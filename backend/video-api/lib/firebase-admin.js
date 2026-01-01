/**
 * Firebase Admin SDK Initialization
 * Used for verifying user identity from Firebase ID tokens
 */

import admin from 'firebase-admin';

let firebaseApp = null;

export function initializeFirebase() {
    if (firebaseApp) return firebaseApp;

    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (!serviceAccountJson) {
            console.warn('[Firebase] No service account configured - auth will be skipped');
            return null;
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });

        console.log('[Firebase] Admin SDK initialized');
        return firebaseApp;

    } catch (error) {
        console.error('[Firebase] Init error:', error.message);
        return null;
    }
}

/**
 * Verify Firebase ID token and extract user info
 * In development, falls back to mock user if verification fails
 */
export async function verifyToken(idToken) {
    // Development mode: always allow with mock user
    const isDev = process.env.NODE_ENV !== 'production';

    if (!firebaseApp) {
        initializeFirebase();
    }

    if (!firebaseApp) {
        // No Firebase config - return mock user
        console.warn('[Firebase] Auth skipped - returning mock user');
        return createMockUser(idToken);
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        return {
            uid: decodedToken.uid,
            name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
            email: decodedToken.email || null
        };

    } catch (error) {
        console.error('[Firebase] Token verification failed:', error.message);

        // In development, return mock user instead of failing
        if (isDev) {
            console.warn('[Firebase] Dev mode - returning mock user');
            return createMockUser(idToken);
        }

        throw new Error('Invalid authentication token');
    }
}

/**
 * Create a mock user from token (extracts email if possible)
 * In dev mode, extracts user info from Firebase token without verification
 */
function createMockUser(idToken) {
    // Try to decode JWT payload for user info (without verification)
    try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
            // Base64 decode the payload
            const payloadStr = Buffer.from(parts[1], 'base64').toString('utf-8');
            const payload = JSON.parse(payloadStr);
            
            // Firebase tokens use 'user_id' or 'sub' for the UID
            const uid = payload.user_id || payload.sub;
            const name = payload.name || payload.email?.split('@')[0] || 'User';
            const email = payload.email || 'user@localhost';
            
            console.log(`[Firebase] Mock user from token: uid=${uid}, name=${name}`);
            
            return {
                uid: uid || 'dev-user-' + Date.now(),
                name,
                email
            };
        }
    } catch (e) {
        console.warn('[Firebase] Could not parse token:', e.message);
    }

    // Fallback if token parsing fails
    const fallbackId = 'dev-user-' + Date.now();
    console.log(`[Firebase] Using fallback mock user: ${fallbackId}`);
    return {
        uid: fallbackId,
        name: 'Dev User',
        email: 'dev@localhost'
    };
}

// Initialize on module load
initializeFirebase();
