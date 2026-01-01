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
        // API server runs on port 5174 (Express backend)
        const API_BASE = 'http://localhost:5174';
        const response = await fetch(`${API_BASE}/video/token`, {
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

// ============================================================
// ADMIN CONTROLS
// ============================================================

const API_BASE = 'http://localhost:5174';

/**
 * Mute a participant's audio or video (admin only)
 * @param roomId - The room ID
 * @param participantId - The participant's identity
 * @param trackType - 'audio', 'video', or 'all'
 */
export async function muteParticipant(
    roomId: string, 
    participantId: string, 
    trackType: 'audio' | 'video' | 'all' = 'audio'
): Promise<{ success: boolean; message: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw { message: 'Not authenticated', retryable: false } as VideoError;
    }

    const idToken = await currentUser.getIdToken(true);

    const response = await fetch(`${API_BASE}/video/admin/mute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ roomId, participantId, trackType }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Mute failed' }));
        throw { message: err.error || 'Failed to mute participant', retryable: false } as VideoError;
    }

    return response.json();
}

/**
 * Kick a participant from the room (admin only)
 * @param roomId - The room ID
 * @param participantId - The participant's identity
 */
export async function kickParticipant(
    roomId: string, 
    participantId: string
): Promise<{ success: boolean; message: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw { message: 'Not authenticated', retryable: false } as VideoError;
    }

    const idToken = await currentUser.getIdToken(true);

    const response = await fetch(`${API_BASE}/video/admin/kick`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ roomId, participantId }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Kick failed' }));
        throw { message: err.error || 'Failed to kick participant', retryable: false } as VideoError;
    }

    return response.json();
}

/**
 * Get list of participants in a room (admin only)
 * @param roomId - The room ID
 */
export async function listParticipants(roomId: string): Promise<any> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw { message: 'Not authenticated', retryable: false } as VideoError;
    }

    const idToken = await currentUser.getIdToken(true);

    const response = await fetch(`${API_BASE}/video/admin/participants?roomId=${encodeURIComponent(roomId)}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to list participants' }));
        throw { message: err.error || 'Failed to list participants', retryable: false } as VideoError;
    }

    return response.json();
}
