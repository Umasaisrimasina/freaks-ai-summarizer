/**
 * Daily.co Video Provider Integration
 * Server-side only - creates rooms and generates meeting tokens
 * 
 * SECURITY:
 * - API key never exposed to client
 * - All tokens are short-lived (15 min)
 * - is_owner is always false (principle of least privilege)
 * - Room names are server-generated or validated
 */

const DAILY_API_BASE = 'https://api.daily.co/v1';

interface DailyRoomConfig {
    name?: string;
    privacy?: 'private' | 'public';
    properties?: {
        exp?: number;
        enable_screenshare?: boolean;
        enable_chat?: boolean;
        start_audio_off?: boolean;
        start_video_off?: boolean;
    };
}

interface DailyRoom {
    id: string;
    name: string;
    url: string;
    created_at: string;
    config: DailyRoomConfig;
}

interface DailyTokenConfig {
    room_name: string;
    user_id: string;
    user_name: string;
    exp?: number;
    nbf?: number;
    is_owner?: boolean;
    enable_screenshare?: boolean;
    start_audio_off?: boolean;
    start_video_off?: boolean;
}

interface DailyToken {
    token: string;
}

/**
 * Get Daily.co API key from environment
 * Throws if not configured
 */
function getDailyApiKey(): string {
    const apiKey = process.env.DAILY_API_KEY;
    if (!apiKey) {
        throw new Error('Daily.co API key not configured');
    }
    return apiKey;
}

/**
 * Make authenticated request to Daily.co API
 */
async function dailyFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const apiKey = getDailyApiKey();

    const response = await fetch(`${DAILY_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[Daily.co] API error:', response.status, error);
        throw new Error('Video service unavailable');
    }

    return response.json();
}

/**
 * Create a new private Daily.co room
 * 
 * @param roomName - Desired room name (must be unique)
 * @returns Room details
 */
export async function createRoom(roomName: string): Promise<DailyRoom> {
    // Calculate room expiration (24 hours from now)
    const expiresAt = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    const room = await dailyFetch<DailyRoom>('/rooms', {
        method: 'POST',
        body: JSON.stringify({
            name: roomName,
            privacy: 'private', // SECURITY: Always private
            properties: {
                exp: expiresAt,
                enable_screenshare: true,
                enable_chat: true,
                start_audio_off: true, // Silent Presence default
                start_video_off: true, // Camera off by default
            },
        }),
    });

    return room;
}

/**
 * Get existing room or create if not found
 */
export async function getOrCreateRoom(roomName: string): Promise<DailyRoom> {
    try {
        // Try to get existing room
        const room = await dailyFetch<DailyRoom>(`/rooms/${roomName}`);
        return room;
    } catch (error) {
        // Room doesn't exist, create it
        return createRoom(roomName);
    }
}

/**
 * Delete a room when session ends
 */
export async function deleteRoom(roomName: string): Promise<void> {
    await dailyFetch(`/rooms/${roomName}`, {
        method: 'DELETE',
    });
}

/**
 * Generate a meeting token for a user
 * 
 * SECURITY:
 * - Short TTL (15 minutes)
 * - nbf prevents token stockpiling
 * - is_owner is always false
 * - Identity injected server-side
 * 
 * @param config - Token configuration
 * @returns Meeting token
 */
export async function createMeetingToken(config: DailyTokenConfig): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    const tokenConfig = {
        properties: {
            room_name: config.room_name,
            user_id: config.user_id,
            user_name: config.user_name,
            exp: config.exp || (now + 15 * 60), // 15 minutes
            nbf: config.nbf || now, // Not valid before now
            is_owner: false, // SECURITY: Never grant owner privileges
            enable_screenshare: config.enable_screenshare ?? true,
            start_audio_off: config.start_audio_off ?? true,
            start_video_off: config.start_video_off ?? true,
        },
    };

    const result = await dailyFetch<DailyToken>('/meeting-tokens', {
        method: 'POST',
        body: JSON.stringify(tokenConfig),
    });

    return result.token;
}

/**
 * Get room URL for joining
 */
export function getRoomUrl(roomName: string): string {
    const domain = process.env.DAILY_DOMAIN || 'your-domain';
    return `https://${domain}.daily.co/${roomName}`;
}
