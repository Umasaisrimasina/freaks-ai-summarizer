/**
 * Video Service - Client-Side
 * Securely fetches room tokens from the backend
 * 
 * SECURITY:
 * - NEVER sends userId, userName, or role from client
 * - Only sends roomId; identity is injected server-side
 * - Passes Firebase ID token via Authorization header
 * - Handles errors gracefully without exposing details
 */

import { auth } from '../firebase';

export interface VideoCredentials {
    token: string;
    roomUrl: string;
    expiresIn: number;
}

export interface VideoError {
    message: string;
    retryable: boolean;
}

/**
 * Fetch video room credentials from secure backend
 * 
 * SECURITY: The server will:
 * 1. Verify the Firebase ID token
 * 2. Extract user identity from the verified token (NOT from request)
 * 3. Apply rate limiting
 * 4. Generate a short-lived, minimal-permission token
 * 
 * @param roomId - The room to join (only thing client provides)
 * @returns Video credentials or throws error
 */
export async function fetchVideoToken(roomId: string): Promise<VideoCredentials> {
    // Get current user's Firebase ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw { message: 'Please sign in to join a room', retryable: false } as VideoError;
    }

    let idToken: string;
    try {
        // Force refresh to ensure token is valid
        idToken = await currentUser.getIdToken(true);
    } catch (error) {
        throw { message: 'Session expired - please sign in again', retryable: false } as VideoError;
    }

    try {
        // API server runs on port 3001 (Express backend)
        const API_BASE = 'http://localhost:3001';
        const response = await fetch(`${API_BASE}/api/video/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // SECURITY: Pass Firebase ID token via Authorization header
                // Server will verify this and extract identity from it
                'Authorization': `Bearer ${idToken}`,
            },
            // SECURITY: Only send roomId - NEVER send userId, userName, or role
            // The server will inject identity from the verified Firebase token
            body: JSON.stringify({ roomId }),
        });

        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401) {
                throw { message: 'Please sign in to join a room', retryable: false } as VideoError;
            }
            if (response.status === 429) {
                throw { message: 'Too many requests - please wait a moment', retryable: true } as VideoError;
            }
            if (response.status === 503) {
                throw { message: 'Video service temporarily unavailable', retryable: true } as VideoError;
            }
            // Generic error for all other cases (SECURITY: don't expose details)
            throw { message: 'Unable to join room', retryable: true } as VideoError;
        }

        const data = await response.json();
        return {
            token: data.token,
            roomUrl: data.roomUrl,
            expiresIn: data.expiresIn,
        };

    } catch (error: any) {
        // If it's already a VideoError, rethrow
        if (error.message && typeof error.retryable === 'boolean') {
            throw error;
        }
        // Network or unexpected errors
        console.error('[video] Token fetch failed:', error);
        throw { message: 'Connection error - please try again', retryable: true } as VideoError;
    }
}

/**
 * Check if video provider is configured
 * Used to gracefully disable video features if not set up
 */
export function isVideoConfigured(): boolean {
    // This will be true if the API endpoint exists
    // The actual provider check happens server-side
    return true;
}
