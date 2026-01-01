/**
 * Video Token API Endpoint
 * Generates secure, short-lived tokens for video room access
 * 
 * SECURITY FEATURES:
 * 1. POST only (blocks GET abuse)
 * 2. CSRF protection (Origin validation)
 * 3. Firebase Auth verification (no anonymous joins)
 * 4. Rate limiting (10 req/min per user)
 * 5. Server-side identity injection (no spoofing)
 * 6. Short TTL tokens (15 min)
 * 7. Minimal permissions (is_owner: false)
 * 8. Provider-agnostic errors (no leaks)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyFirebaseToken, extractBearerToken } from '@/lib/auth/verifyFirebase';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { validateCsrf } from '@/lib/security/csrf';
import { sanitizeRoomId, sanitizeDisplayName } from '@/lib/security/sanitize';
import { createMeetingToken as createDailyToken, getOrCreateRoom as getDailyRoom, getRoomUrl as getDailyRoomUrl } from '@/lib/video/daily';
import { createParticipantToken as createLiveKitToken, getLiveKitUrl } from '@/lib/video/livekit';

// Response types
interface TokenResponse {
    token: string;
    roomUrl: string;
    expiresIn: number;
}

interface ErrorResponse {
    error: string;
    code?: string;
}

// Supported providers
type VideoProvider = 'daily' | 'livekit';

/**
 * Get video provider from environment
 * Defaults to 'daily' if not specified
 */
function getVideoProvider(): VideoProvider {
    const provider = process.env.VIDEO_PROVIDER?.toLowerCase();
    if (provider === 'livekit') {
        return 'livekit';
    }
    return 'daily';
}

/**
 * Main API handler
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<TokenResponse | ErrorResponse>
) {
    // ========================================
    // SECURITY LAYER 1: Method + CSRF Check
    // ========================================
    const csrfResult = validateCsrf(req.method, req.headers.origin);
    if (!csrfResult.valid) {
        const statusCode = req.method !== 'POST' ? 405 : 403;
        return res.status(statusCode).json({
            error: csrfResult.error || 'Request blocked'
        });
    }

    // ========================================
    // SECURITY LAYER 2: Authentication
    // ========================================
    const idToken = extractBearerToken(req.headers.authorization);
    if (!idToken) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }

    let verifiedUser;
    try {
        verifiedUser = await verifyFirebaseToken(idToken);
    } catch (error: any) {
        return res.status(401).json({
            error: error.message || 'Authentication failed'
        });
    }

    // ========================================
    // SECURITY LAYER 3: Rate Limiting
    // ========================================
    const rateLimitResult = checkRateLimit(verifiedUser.uid);
    if (!rateLimitResult.allowed) {
        res.setHeader('Retry-After', Math.ceil(rateLimitResult.resetIn / 1000));
        return res.status(429).json({
            error: 'Too many requests - please wait a moment'
        });
    }

    // ========================================
    // INPUT VALIDATION
    // ========================================
    const { roomId } = req.body;
    if (!roomId || typeof roomId !== 'string') {
        return res.status(400).json({
            error: 'Room ID is required'
        });
    }

    const sanitizedRoomId = sanitizeRoomId(roomId);
    if (!sanitizedRoomId) {
        return res.status(400).json({
            error: 'Invalid room ID format'
        });
    }

    // User identity is ALWAYS from verified Firebase token, never from request
    const userName = sanitizeDisplayName(verifiedUser.name);
    const userId = verifiedUser.uid;

    // ========================================
    // TOKEN GENERATION
    // ========================================
    const provider = getVideoProvider();
    const ttlSeconds = 15 * 60; // 15 minutes
    const now = Math.floor(Date.now() / 1000);

    try {
        let token: string;
        let roomUrl: string;

        if (provider === 'livekit') {
            // LiveKit token generation
            token = await createLiveKitToken(
                sanitizedRoomId,
                userId,
                userName
            );
            roomUrl = getLiveKitUrl();
        } else {
            // Daily.co token generation (default)
            await getDailyRoom(sanitizedRoomId);
            token = await createDailyToken({
                room_name: sanitizedRoomId,
                user_id: userId,
                user_name: userName,
                exp: now + ttlSeconds,
                nbf: now,
                start_audio_off: true,
                start_video_off: true,
            });
            roomUrl = getDailyRoomUrl(sanitizedRoomId);
        }

        // ========================================
        // SUCCESS RESPONSE
        // ========================================
        // Log join event for audit trail
        console.log(JSON.stringify({
            event: 'room_token_issued',
            uid: userId,
            roomId: sanitizedRoomId,
            provider, // Internal only, not exposed to client
            timestamp: new Date().toISOString(),
        }));

        return res.status(200).json({
            token,
            roomUrl,
            expiresIn: ttlSeconds,
        });

    } catch (error: any) {
        // Log error internally but return generic message
        console.error('[token] Provider error:', error.message);

        // SECURITY: Never expose provider-specific errors to client
        return res.status(503).json({
            error: 'Video service temporarily unavailable'
        });
    }
}

/**
 * API configuration
 */
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1kb', // Limit body size
        },
    },
};
