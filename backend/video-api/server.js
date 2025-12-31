/**
 * Video API Server
 * Express server for video token generation
 * 
 * Supports: Daily.co (primary), LiveKit (fallback)
 * Auth: Firebase ID token verification
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from project root - try multiple locations
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Try .env.local first, then .env, then .env.example
const envPaths = [
    path.join(__dirname, '../../.env.local'),
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../../.env.example'),
];

let envLoaded = false;
for (const envPath of envPaths) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
        console.log(`[Env] Loaded from: ${envPath}`);
        envLoaded = true;
        break;
    }
}
if (!envLoaded) {
    console.warn('[Env] No env file found, using defaults');
}

import tokenRouter from './routes/token.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Video token route
app.use('/api/video', tokenRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     Video API Server Started              ║
╠═══════════════════════════════════════════╣
║  Port:     ${PORT}                            ║
║  Provider: ${process.env.VIDEO_PROVIDER || 'daily'}                         ║
║  Health:   http://localhost:${PORT}/health    ║
╚═══════════════════════════════════════════╝
  `);
});

export default app;
