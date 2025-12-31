/**
 * LiveKit Integration
 * Generates access tokens for LiveKit rooms
 */

import { AccessToken } from 'livekit-server-sdk';

/**
 * Generate a LiveKit access token
 */
export async function generateToken(roomId, user) {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('LiveKit credentials not configured');
    }

    // Create access token
    const token = new AccessToken(apiKey, apiSecret, {
        identity: user.uid,
        name: user.name,
        ttl: '15m', // 15 minutes
    });

    // Grant room permissions
    token.addGrant({
        room: roomId,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });

    return await token.toJwt();
}

/**
 * Get LiveKit server URL
 */
export function getServerUrl() {
    return process.env.LIVEKIT_URL || 'wss://localhost:7880';
}
