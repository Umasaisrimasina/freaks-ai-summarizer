/**
 * LiveKit Video Provider Integration
 * Server-side only - generates access tokens with restricted permissions
 * 
 * SECURITY:
 * - API key/secret never exposed to client
 * - Tokens have minimal required permissions
 * - No admin or recording grants
 * - Short TTL (15 min)
 */

import { AccessToken, VideoGrant } from 'livekit-server-sdk';

interface LiveKitTokenConfig {
    roomName: string;
    participantId: string;
    participantName: string;
    ttlSeconds?: number;
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
}

interface LiveKitCredentials {
    apiKey: string;
    apiSecret: string;
}

/**
 * Get LiveKit credentials from environment
 * Throws if not configured
 */
function getLiveKitCredentials(): LiveKitCredentials {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error('LiveKit credentials not configured');
    }

    return { apiKey, apiSecret };
}

/**
 * Generate a LiveKit access token
 * 
 * SECURITY:
 * - Minimal permissions (no admin, no recording)
 * - Short TTL (15 minutes default)
 * - Identity injected server-side
 * 
 * @param config - Token configuration
 * @returns JWT access token
 */
export async function createAccessToken(config: LiveKitTokenConfig): Promise<string> {
    const { apiKey, apiSecret } = getLiveKitCredentials();

    // Create token with identity
    const token = new AccessToken(apiKey, apiSecret, {
        identity: config.participantId,
        name: config.participantName,
        ttl: config.ttlSeconds || 15 * 60, // 15 minutes default
    });

    // Define restricted video grants
    // SECURITY: Only grant necessary permissions
    const videoGrant: VideoGrant = {
        room: config.roomName,
        roomJoin: true, // Can join the room
        canPublish: config.canPublish ?? true, // Can publish audio/video
        canSubscribe: config.canSubscribe ?? true, // Can receive others' streams
        canPublishData: config.canPublishData ?? true, // Can send data messages

        // SECURITY: Explicitly deny admin permissions
        roomCreate: false,
        roomList: false,
        roomRecord: false,
        roomAdmin: false,
        hidden: false,
        recorder: false,
        agent: false,
    };

    token.addGrant(videoGrant);

    return await token.toJwt();
}

/**
 * Generate a token with minimal permissions (viewer only)
 */
export async function createViewerToken(
    roomName: string,
    participantId: string,
    participantName: string
): Promise<string> {
    return createAccessToken({
        roomName,
        participantId,
        participantName,
        canPublish: false, // Cannot publish streams
        canSubscribe: true, // Can only watch
        canPublishData: false, // Cannot send messages
    });
}

/**
 * Generate a token with full participant permissions
 */
export async function createParticipantToken(
    roomName: string,
    participantId: string,
    participantName: string
): Promise<string> {
    return createAccessToken({
        roomName,
        participantId,
        participantName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });
}

/**
 * Get LiveKit WebSocket URL for client connection
 */
export function getLiveKitUrl(): string {
    const url = process.env.LIVEKIT_URL;
    if (!url) {
        throw new Error('LiveKit URL not configured');
    }
    return url;
}
