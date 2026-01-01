/**
 * Input Sanitization
 * Strip dangerous content and enforce limits on user-provided strings
 * 
 * SECURITY: Defense-in-depth against XSS and injection attacks
 */

const MAX_LENGTH = 100;
const MAX_ROOM_ID_LENGTH = 50;

/**
 * Strip all HTML tags from a string
 */
function stripHtml(str: string): string {
    return str
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&[^;]+;/g, '') // Remove HTML entities
        .trim();
}

/**
 * Remove potentially dangerous characters
 */
function stripDangerousChars(str: string): string {
    return str
        .replace(/[<>'"&\\\/`]/g, '') // Remove XSS-prone characters
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim();
}

/**
 * Sanitize a general user-visible string
 * 
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default 100)
 * @returns Sanitized string
 */
export function sanitizeString(input: string | null | undefined, maxLength: number = MAX_LENGTH): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return stripDangerousChars(stripHtml(input)).slice(0, maxLength);
}

/**
 * Sanitize room ID / room name
 * Only allows alphanumeric, hyphens, underscores
 */
export function sanitizeRoomId(input: string | null | undefined): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .replace(/[^a-zA-Z0-9\-_]/g, '') // Only allow safe characters
        .slice(0, MAX_ROOM_ID_LENGTH);
}

/**
 * Sanitize display name for video calls
 * Allows letters, numbers, spaces, and basic punctuation
 */
export function sanitizeDisplayName(input: string | null | undefined): string {
    if (!input || typeof input !== 'string') {
        return 'Participant';
    }

    const sanitized = input
        .replace(/[<>'"&\\\/`]/g, '') // Remove XSS-prone characters
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .trim()
        .slice(0, 50);

    return sanitized || 'Participant';
}

/**
 * Validate UUID format (for room IDs)
 */
export function isValidUuid(input: string | null | undefined): boolean {
    if (!input || typeof input !== 'string') {
        return false;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(input);
}

/**
 * Generate a safe room ID (UUIDv4)
 */
export function generateRoomId(): string {
    // Use crypto.randomUUID if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback for older environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
