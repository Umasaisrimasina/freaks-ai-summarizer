/**
 * CSRF Protection
 * Origin header validation to prevent cross-site request forgery
 * 
 * SECURITY: Blocks unauthorized cross-origin token requests
 */

export interface CsrfValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Get allowed origins from environment variable
 * Format: comma-separated list (e.g., "http://localhost:5173,https://myapp.com")
 */
function getAllowedOrigins(): string[] {
    const origins = process.env.ALLOWED_ORIGINS || '';

    // Default to localhost for development
    if (!origins) {
        return [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ];
    }

    return origins.split(',').map(o => o.trim()).filter(Boolean);
}

/**
 * Validate the Origin header against allowed origins
 * 
 * @param origin - Origin header from request
 * @returns Validation result
 */
export function validateOrigin(origin: string | null | undefined): CsrfValidationResult {
    // No origin header is suspicious for POST requests
    if (!origin) {
        return {
            valid: false,
            error: 'Missing Origin header',
        };
    }

    const allowedOrigins = getAllowedOrigins();

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
        return { valid: true };
    }

    // Log the blocked attempt for monitoring
    console.warn('[CSRF] Blocked request from unauthorized origin:', origin);

    return {
        valid: false,
        error: 'Forbidden origin',
    };
}

/**
 * Validate request method - only allow POST for sensitive endpoints
 */
export function validateMethod(method: string | undefined): CsrfValidationResult {
    if (method !== 'POST') {
        return {
            valid: false,
            error: 'Method not allowed',
        };
    }
    return { valid: true };
}

/**
 * Full CSRF validation for API endpoints
 */
export function validateCsrf(
    method: string | undefined,
    origin: string | null | undefined
): CsrfValidationResult {
    // Check method first
    const methodResult = validateMethod(method);
    if (!methodResult.valid) {
        return methodResult;
    }

    // Then check origin
    return validateOrigin(origin);
}
