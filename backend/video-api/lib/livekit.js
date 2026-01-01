/**
 * LiveKit Integration
 * Generates access tokens for LiveKit rooms
 */

import { AccessToken, TrackSource } from 'livekit-server-sdk';

/**
 * Generate a LiveKit access token with full media permissions
 * SECURITY: Identity comes from verified Firebase token, NOT client
 */
export async function generateToken(roomId, user) {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('LiveKit credentials not configured');
    }

    // Create access token with identity from verified Firebase user
    // TTL: 15 minutes max for security
    const token = new AccessToken(apiKey, apiSecret, {
        identity: user.uid,
        name: user.name || user.email?.split('@')[0] || 'User',
        ttl: '15m',
    });

    // Grant comprehensive room permissions for Meet-like functionality
    token.addGrant({
        room: roomId,
        roomJoin: true,
        roomCreate: true,           // Allow room creation if it doesn't exist
        canPublish: true,           // Allow publishing camera/mic/screen
        canPublishData: true,       // Allow data messages (chat)
        canSubscribe: true,         // Allow subscribing to others' tracks
    });

    return await token.toJwt();
}

/**
 * Get LiveKit server URL
 */
export function getServerUrl() {
    return process.env.LIVEKIT_URL || 'wss://localhost:7880';
}
