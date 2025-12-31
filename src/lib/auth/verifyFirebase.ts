/**
 * Firebase ID Token Verification
 * Server-side only - validates Firebase Auth tokens and extracts user identity
 * 
 * SECURITY: Never trust client-provided identity - always verify server-side
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

    admin.initializeApp({
        credential: serviceAccount
            ? admin.credential.cert(serviceAccount)
            : admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

export interface VerifiedUser {
    uid: string;
    name: string;
    email: string | null;
}

export interface VerificationError {
    code: string;
    message: string;
}

/**
 * Verify Firebase ID token and extract user identity
 * 
 * @param idToken - The Firebase ID token from Authorization header
 * @returns Verified user data (uid, name, email)
 * @throws Error on invalid/expired token
 */
export async function verifyFirebaseToken(idToken: string): Promise<VerifiedUser> {
    if (!idToken || typeof idToken !== 'string') {
        throw new Error('Missing or invalid ID token');
    }

    try {
        // Verify the token with Firebase Admin SDK
        // This checks signature, expiration, and issuer
        const decodedToken = await admin.auth().verifyIdToken(idToken, true);

        // Extract user identity from verified claims
        // NEVER trust client-provided name/uid - always use decoded token
        const uid = decodedToken.uid;
        const name = decodedToken.name ||
            decodedToken.email?.split('@')[0] ||
            'Participant';
        const email = decodedToken.email || null;

        return { uid, name, email };
    } catch (error: any) {
        // Log for debugging but return generic error to client
        console.error('[verifyFirebase] Token verification failed:', error.code);

        if (error.code === 'auth/id-token-expired') {
            throw new Error('Session expired - please sign in again');
        }
        if (error.code === 'auth/id-token-revoked') {
            throw new Error('Session revoked - please sign in again');
        }
        if (error.code === 'auth/argument-error') {
            throw new Error('Invalid authentication token');
        }

        throw new Error('Authentication failed');
    }
}

/**
 * Extract ID token from Authorization header
 * Expects format: "Bearer <token>"
 */
export function extractBearerToken(authHeader: string | null | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
