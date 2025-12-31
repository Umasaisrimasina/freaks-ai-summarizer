/**
 * useVideoRoom Hook
 * Manages video room connection lifecycle
 * 
 * SECURITY:
 * - All credentials come from secure backend
 * - No client-side identity handling
 * - Graceful error handling without exposing details
 * - Automatic cleanup on unmount
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchVideoToken, VideoCredentials, VideoError } from '../services/videoService';

export interface UseVideoRoomState {
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    credentials: VideoCredentials | null;
}

export interface UseVideoRoomActions {
    connect: (roomId: string) => Promise<boolean>;
    disconnect: () => void;
    clearError: () => void;
}

export type UseVideoRoomReturn = UseVideoRoomState & UseVideoRoomActions;

/**
 * Hook to manage video room connection
 * 
 * Usage:
 * const { connect, disconnect, isConnected, error } = useVideoRoom();
 * 
 * // When user clicks join
 * await connect(roomId);
 * 
 * // When user leaves
 * disconnect();
 */
export function useVideoRoom(): UseVideoRoomReturn {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<VideoCredentials | null>(null);

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /**
     * Connect to a video room
     * Fetches credentials from secure backend
     */
    const connect = useCallback(async (roomId: string): Promise<boolean> => {
        if (!isMountedRef.current) return false;

        setIsConnecting(true);
        setError(null);

        try {
            // Fetch credentials from secure backend
            // SECURITY: Only sends roomId; identity is server-injected
            const creds = await fetchVideoToken(roomId);

            if (!isMountedRef.current) return false;

            setCredentials(creds);
            setIsConnected(true);
            setIsConnecting(false);
            return true;

        } catch (err: any) {
            if (!isMountedRef.current) return false;

            const videoError = err as VideoError;
            setError(videoError.message || 'Unable to join room');
            setIsConnecting(false);
            setIsConnected(false);
            return false;
        }
    }, []);

    /**
     * Disconnect from the video room
     * Cleans up resources
     */
    const disconnect = useCallback(() => {
        setIsConnected(false);
        setCredentials(null);
        setError(null);

        // SECURITY: Clear any cached credentials on disconnect
        // Provider-specific cleanup would go here
    }, []);

    /**
     * Clear any displayed error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isConnecting,
        isConnected,
        error,
        credentials,
        connect,
        disconnect,
        clearError,
    };
}

export default useVideoRoom;
