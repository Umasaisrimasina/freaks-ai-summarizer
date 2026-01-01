/**
 * Per-User Rate Limiting
 * UID-based throttling to prevent token endpoint abuse
 * 
 * SECURITY: Prevents quota exhaustion attacks
 * Uses in-memory LRU cache (MVP-safe, resets on server restart)
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetIn: number;
}

// In-memory cache with max 10,000 entries
const rateLimitCache = new Map<string, RateLimitEntry>();
const MAX_CACHE_SIZE = 10000;
const WINDOW_MS = 60 * 1000; // 1 minute window
const DEFAULT_LIMIT = 10; // 10 requests per minute

/**
 * Clean up expired entries to prevent memory bloat
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitCache.entries()) {
        if (now > entry.resetTime) {
            rateLimitCache.delete(key);
        }
    }
}

/**
 * Evict oldest entries if cache is too large
 */
function evictOldestIfNeeded(): void {
    if (rateLimitCache.size >= MAX_CACHE_SIZE) {
        // Delete first 10% of entries (oldest)
        const deleteCount = Math.floor(MAX_CACHE_SIZE * 0.1);
        const keysToDelete = Array.from(rateLimitCache.keys()).slice(0, deleteCount);
        keysToDelete.forEach(key => rateLimitCache.delete(key));
    }
}

/**
 * Check if a user ID is within rate limits
 * 
 * @param uid - Firebase user ID
 * @param limit - Max requests per window (default 10)
 * @returns Rate limit status
 */
export function checkRateLimit(uid: string, limit: number = DEFAULT_LIMIT): RateLimitResult {
    const now = Date.now();
    const key = `token:${uid}`;

    // Clean up periodically (1% chance each call to avoid blocking)
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    const existing = rateLimitCache.get(key);

    // If no entry or expired, create new window
    if (!existing || now > existing.resetTime) {
        evictOldestIfNeeded();
        rateLimitCache.set(key, {
            count: 1,
            resetTime: now + WINDOW_MS,
        });
        return {
            allowed: true,
            remaining: limit - 1,
            resetIn: WINDOW_MS,
        };
    }

    // Check if within limit
    if (existing.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: existing.resetTime - now,
        };
    }

    // Increment counter
    existing.count += 1;
    rateLimitCache.set(key, existing);

    return {
        allowed: true,
        remaining: limit - existing.count,
        resetIn: existing.resetTime - now,
    };
}

/**
 * Reset rate limit for a specific user (for testing/admin)
 */
export function resetRateLimit(uid: string): void {
    rateLimitCache.delete(`token:${uid}`);
}

/**
 * Get current rate limit stats (for debugging)
 */
export function getRateLimitStats(): { size: number; maxSize: number } {
    return {
        size: rateLimitCache.size,
        maxSize: MAX_CACHE_SIZE,
    };
}
