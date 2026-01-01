/**
 * Daily.co Integration
 * Creates rooms and generates meeting tokens
 */

const DAILY_API_BASE = 'https://api.daily.co/v1';

// Cache room URLs returned from API
const roomUrlCache = new Map();

/**
 * Create or get a Daily.co room
 */
export async function getOrCreateRoom(roomId) {
    const apiKey = process.env.DAILY_API_KEY;

    if (!apiKey) {
        throw new Error('Daily.co API key not configured');
    }

    // Check if room exists
    try {
        const checkResponse = await fetch(`${DAILY_API_BASE}/rooms/${roomId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (checkResponse.ok) {
            const room = await checkResponse.json();
            console.log(`[Daily] Room exists: ${roomId}, URL: ${room.url}`);
            roomUrlCache.set(roomId, room.url);
            return room;
        }
    } catch (error) {
        // Room doesn't exist, create it
    }

    // Create new room
    const createResponse = await fetch(`${DAILY_API_BASE}/rooms`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: roomId,
            privacy: 'private',
            properties: {
                enable_chat: true,
                enable_screenshare: true,
                max_participants: 20,
                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
            }
        })
    });

    if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('[Daily] Room creation failed:', error);
        throw new Error('Failed to create room');
    }

    const room = await createResponse.json();
    console.log(`[Daily] Created room: ${roomId}, URL: ${room.url}`);
    roomUrlCache.set(roomId, room.url);
    return room;
}

/**
 * Generate a meeting token for a user
 */
export async function generateToken(roomId, user) {
    const apiKey = process.env.DAILY_API_KEY;

    if (!apiKey) {
        throw new Error('Daily.co API key not configured');
    }

    const response = await fetch(`${DAILY_API_BASE}/meeting-tokens`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            properties: {
                room_name: roomId,
                user_id: user.uid,
                user_name: user.name,
                is_owner: false,
                enable_screenshare: true,
                start_video_off: true,
                start_audio_off: true,
                exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[Daily] Token generation failed:', error);
        throw new Error('Failed to generate meeting token');
    }

    const data = await response.json();
    return data.token;
}

/**
 * Get room URL from cache (populated by getOrCreateRoom)
 */
export function getRoomUrl(roomId) {
    // Return cached URL from API response
    if (roomUrlCache.has(roomId)) {
        return roomUrlCache.get(roomId);
    }

    // Fallback (should not happen if getOrCreateRoom was called first)
    console.warn(`[Daily] Room URL not cached for ${roomId}, using fallback`);
    const domain = process.env.DAILY_DOMAIN;
    if (domain) {
        return `https://${domain}.daily.co/${roomId}`;
    }
    throw new Error('Room URL not available - call getOrCreateRoom first');
}

