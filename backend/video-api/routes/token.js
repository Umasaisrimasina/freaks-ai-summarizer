/**
 * Video Token Route
 * POST /api/video/token
 * 
 * Generates video meeting tokens for authenticated users
 */

import { Router } from 'express';
import { verifyToken } from '../lib/firebase-admin.js';
import * as daily from '../lib/daily.js';
import * as livekit from '../lib/livekit.js';

const router = Router();

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
        if (!roomId || typeof roomId !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid roomId' });
        }

        // Sanitize room ID
        const sanitizedRoomId = roomId
            .replace(/[^a-zA-Z0-9-_]/g, '-')
            .substring(0, 64);

        // Verify user identity
        const user = await verifyToken(idToken);
        console.log(`[Token] User verified: ${user.uid} (${user.name})`);

        // Determine provider - defaults to livekit
        const provider = process.env.VIDEO_PROVIDER || 'livekit';

        let roomUrl, token;

        if (provider === 'livekit') {
            // LiveKit
            token = await livekit.generateToken(sanitizedRoomId, user);
            roomUrl = livekit.getServerUrl();
            console.log(`[Token] LiveKit token generated for room: ${sanitizedRoomId}`);
        } else {
            // Daily.co (fallback)
            await daily.getOrCreateRoom(sanitizedRoomId);
            token = await daily.generateToken(sanitizedRoomId, user);
            roomUrl = daily.getRoomUrl(sanitizedRoomId);
            console.log(`[Token] Daily token generated for room: ${sanitizedRoomId}`);
        }

        res.json({
            roomUrl,
            token,
            provider,
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

export default router;
