/**
 * Video Routes
 * POST /video/token - Generate room token
 * POST /video/admin/mute - Mute a participant (admin only)
 * POST /video/admin/kick - Remove participant from room (admin only)
 * 
 * Generates video meeting tokens for authenticated users
 */

import { Router } from 'express';
import { verifyToken } from '../lib/firebase-admin.js';
import * as daily from '../lib/daily.js';
import * as livekit from '../lib/livekit.js';
import { RoomServiceClient } from 'livekit-server-sdk';

const router = Router();

// Initialize LiveKit Room Service Client for admin operations
let roomServiceClient = null;
function getRoomServiceClient() {
    if (!roomServiceClient) {
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const url = process.env.LIVEKIT_URL;
        
        if (apiKey && apiSecret && url) {
            // Convert wss:// to https:// for API calls
            const httpUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
            roomServiceClient = new RoomServiceClient(httpUrl, apiKey, apiSecret);
        }
    }
    return roomServiceClient;
}

/**
 * POST /api/video/token
 * 
 * Request:
 *   Headers: { Authorization: 'Bearer <firebase-id-token>' }
 *   Body: { roomId: string }
 * 
 * Response:
 *   { roomUrl: string, token: string, provider: 'daily' | 'livekit' }
 */
router.post('/token', async (req, res) => {
    try {
        // Extract auth token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }
        const idToken = authHeader.substring(7);

        // Extract room ID
        const { roomId } = req.body;
        console.log(`[Token] Received roomId from client: "${roomId}"`);
        
        if (!roomId || typeof roomId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid roomId' });
        }

        // CRITICAL: Normalize room ID to UPPERCASE for consistent matching
        // This ensures all users connect to the SAME LiveKit room
        const normalizedRoomId = roomId
            .toUpperCase()
            .replace(/[^A-Z0-9-_]/g, '')
            .substring(0, 64);
        
        console.log(`[Token] Normalized roomId: "${normalizedRoomId}"`);

        // Verify user identity
        const user = await verifyToken(idToken);
        console.log(`[Token] User verified: ${user.uid} (${user.name})`);

        // FORCE LIVEKIT ONLY (per project requirements)
        const provider = 'livekit';

        let roomUrl, token;

        // LiveKit ONLY - no Daily.co
        token = await livekit.generateToken(normalizedRoomId, user);
        roomUrl = livekit.getServerUrl();
        
        // DETAILED LOGGING for debugging multi-user issues
        console.log(`[Token] ========================================`);
        console.log(`[Token] LiveKit token generated`);
        console.log(`[Token]   Room ID: "${normalizedRoomId}"`);
        console.log(`[Token]   User ID: "${user.uid}"`);
        console.log(`[Token]   User Name: "${user.name}"`);
        console.log(`[Token]   Room URL: "${roomUrl}"`);
        console.log(`[Token] ========================================`);

        res.json({
            roomUrl,
            token,
            provider,
            roomId: normalizedRoomId, // Return normalized ID for debugging
            expiresIn: 900 // 15 minutes
        });

    } catch (error) {
        console.error('[Token] Error:', error.message);

        if (error.message.includes('authentication')) {
            return res.status(401).json({ error: error.message });
        }

        res.status(500).json({ error: 'Failed to generate token' });
    }
});

/**
 * POST /video/admin/mute
 * Mute a participant's audio/video track (admin only)
 * 
 * Request:
 *   Headers: { Authorization: 'Bearer <firebase-id-token>' }
 *   Body: { roomId: string, participantId: string, trackType: 'audio' | 'video' | 'all' }
 */
router.post('/admin/mute', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }
        const idToken = authHeader.substring(7);

        const { roomId, participantId, trackType = 'audio' } = req.body;
        
        if (!roomId || !participantId) {
            return res.status(400).json({ error: 'Missing roomId or participantId' });
        }

        // Verify admin user
        const user = await verifyToken(idToken);
        // TODO: Check if user is room creator/admin from database
        // For now, any authenticated user can mute (trust model)
        console.log(`[Admin] Mute request from ${user.uid} for participant ${participantId}`);

        const client = getRoomServiceClient();
        if (!client) {
            return res.status(503).json({ error: 'Room service not configured' });
        }

        const normalizedRoomId = roomId.toUpperCase().replace(/[^A-Z0-9-_]/g, '').substring(0, 64);

        // Mute the participant's track(s)
        if (trackType === 'audio' || trackType === 'all') {
            await client.mutePublishedTrack(normalizedRoomId, participantId, 'microphone', true);
        }
        if (trackType === 'video' || trackType === 'all') {
            await client.mutePublishedTrack(normalizedRoomId, participantId, 'camera', true);
        }

        console.log(`[Admin] Muted ${trackType} for ${participantId} in room ${normalizedRoomId}`);
        res.json({ success: true, message: `Muted ${trackType} for participant` });

    } catch (error) {
        console.error('[Admin] Mute error:', error.message);
        res.status(500).json({ error: 'Failed to mute participant' });
    }
});

/**
 * POST /video/admin/kick
 * Remove a participant from the room (admin only)
 * 
 * Request:
 *   Headers: { Authorization: 'Bearer <firebase-id-token>' }
 *   Body: { roomId: string, participantId: string }
 */
router.post('/admin/kick', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }
        const idToken = authHeader.substring(7);

        const { roomId, participantId } = req.body;
        
        if (!roomId || !participantId) {
            return res.status(400).json({ error: 'Missing roomId or participantId' });
        }

        // Verify admin user
        const user = await verifyToken(idToken);
        // TODO: Check if user is room creator/admin from database
        console.log(`[Admin] Kick request from ${user.uid} for participant ${participantId}`);

        const client = getRoomServiceClient();
        if (!client) {
            return res.status(503).json({ error: 'Room service not configured' });
        }

        const normalizedRoomId = roomId.toUpperCase().replace(/[^A-Z0-9-_]/g, '').substring(0, 64);

        // Remove participant from room
        await client.removeParticipant(normalizedRoomId, participantId);

        console.log(`[Admin] Kicked ${participantId} from room ${normalizedRoomId}`);
        res.json({ success: true, message: 'Participant removed from room' });

    } catch (error) {
        console.error('[Admin] Kick error:', error.message);
        res.status(500).json({ error: 'Failed to remove participant' });
    }
});

/**
 * GET /video/admin/participants
 * List all participants in a room (admin only)
 */
router.get('/admin/participants', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }
        const idToken = authHeader.substring(7);

        const { roomId } = req.query;
        
        if (!roomId) {
            return res.status(400).json({ error: 'Missing roomId' });
        }

        const user = await verifyToken(idToken);
        console.log(`[Admin] Participants list request from ${user.uid}`);

        const client = getRoomServiceClient();
        if (!client) {
            return res.status(503).json({ error: 'Room service not configured' });
        }

        const normalizedRoomId = roomId.toUpperCase().replace(/[^A-Z0-9-_]/g, '').substring(0, 64);
        const participants = await client.listParticipants(normalizedRoomId);

        res.json({
            roomId: normalizedRoomId,
            participants: participants.map(p => ({
                id: p.identity,
                name: p.name,
                state: p.state,
                joinedAt: p.joinedAt,
                tracks: p.tracks?.map(t => ({
                    source: t.source,
                    type: t.type,
                    muted: t.muted
                }))
            }))
        });

    } catch (error) {
        console.error('[Admin] List participants error:', error.message);
        res.status(500).json({ error: 'Failed to list participants' });
    }
});

export default router;
