/**
 * Daily.co Client Integration Hook
 * Manages video call state for Daily.co provider
 * 
 * FEATURES:
 * - Camera/Microphone control
 * - Participant tracking
 * - Screen sharing
 * - Automatic cleanup on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';

export interface DailyParticipant {
    id: string;
    name: string;
    isLocal: boolean;
    isCameraOn: boolean;
    isMicOn: boolean;
    isSpeaking: boolean;
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
}

export interface UseDailyCallState {
    isJoining: boolean;
    isJoined: boolean;
    error: string | null;
    participants: DailyParticipant[];
    localParticipant: DailyParticipant | null;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;
}

export interface UseDailyCallActions {
    join: (roomUrl: string, token: string) => Promise<boolean>;
    leave: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleMic: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
}

export type UseDailyCallReturn = UseDailyCallState & UseDailyCallActions;

export function useDailyCall(): UseDailyCallReturn {
    const [isJoining, setIsJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<DailyParticipant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<DailyParticipant | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const callObjectRef = useRef<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (callObjectRef.current) {
                callObjectRef.current.leave().catch(console.error);
                callObjectRef.current.destroy();
                callObjectRef.current = null;
            }
        };
    }, []);

    // Convert Daily participant to our format
    const convertParticipant = useCallback((p: any): DailyParticipant => ({
        id: p.session_id || p.user_id,
        name: p.user_name || 'Participant',
        isLocal: p.local,
        isCameraOn: p.video,
        isMicOn: p.audio,
        isSpeaking: false, // Updated via active-speaker event
        videoTrack: p.tracks?.video?.persistentTrack,
        audioTrack: p.tracks?.audio?.persistentTrack,
    }), []);

    // Update participants list
    const updateParticipants = useCallback(() => {
        if (!callObjectRef.current || !isMountedRef.current) return;

        const dailyParticipants = callObjectRef.current.participants();
        const converted: DailyParticipant[] = [];
        let local: DailyParticipant | null = null;

        Object.values(dailyParticipants).forEach((p: any) => {
            const participant = convertParticipant(p);
            if (p.local) {
                local = participant;
                setIsCameraOn(p.video);
                setIsMicOn(p.audio);
            }
            converted.push(participant);
        });

        setParticipants(converted);
        setLocalParticipant(local);
    }, [convertParticipant]);

    /**
     * Join a Daily.co room
     */
    const join = useCallback(async (roomUrl: string, token: string): Promise<boolean> => {
        if (callObjectRef.current) {
            console.warn('[Daily] Already in a call');
            return false;
        }

        setIsJoining(true);
        setError(null);

        try {
            // Create call object
            const callObject = DailyIframe.createCallObject({
                showLeaveButton: false,
                showFullscreenButton: false,
                iframeStyle: { display: 'none' }, // Headless mode
            });

            callObjectRef.current = callObject;

            // Set up event listeners
            callObject.on('joined-meeting', () => {
                if (!isMountedRef.current) return;
                setIsJoined(true);
                setIsJoining(false);
                updateParticipants();
            });

            callObject.on('left-meeting', () => {
                if (!isMountedRef.current) return;
                setIsJoined(false);
                setParticipants([]);
                setLocalParticipant(null);
            });

            callObject.on('participant-joined', () => {
                updateParticipants();
            });

            callObject.on('participant-left', () => {
                updateParticipants();
            });

            callObject.on('participant-updated', () => {
                updateParticipants();
            });

            callObject.on('active-speaker-change', (event: any) => {
                if (!isMountedRef.current) return;
                setParticipants(prev => prev.map(p => ({
                    ...p,
                    isSpeaking: p.id === event?.activeSpeaker?.peerId,
                })));
            });

            callObject.on('error', (event: any) => {
                console.error('[Daily] Error:', event);
                if (isMountedRef.current) {
                    setError('Video call error occurred');
                }
            });

            // Join the meeting
            await callObject.join({
                url: roomUrl,
                token: token,
                startVideoOff: true, // Silent Presence default
                startAudioOff: true,
            });

            return true;

        } catch (err: any) {
            console.error('[Daily] Join failed:', err);
            if (isMountedRef.current) {
                setError('Failed to join video call');
                setIsJoining(false);
            }
            if (callObjectRef.current) {
                callObjectRef.current.destroy();
                callObjectRef.current = null;
            }
            return false;
        }
    }, [updateParticipants]);

    /**
     * Leave the call
     */
    const leave = useCallback(async () => {
        if (!callObjectRef.current) return;

        try {
            await callObjectRef.current.leave();
            callObjectRef.current.destroy();
            callObjectRef.current = null;
        } catch (err) {
            console.error('[Daily] Leave error:', err);
        }

        if (isMountedRef.current) {
            setIsJoined(false);
            setParticipants([]);
            setLocalParticipant(null);
            setIsCameraOn(false);
            setIsMicOn(false);
            setIsScreenSharing(false);
        }
    }, []);

    /**
     * Toggle camera
     */
    const toggleCamera = useCallback(async () => {
        if (!callObjectRef.current) return;

        try {
            const newState = !isCameraOn;
            await callObjectRef.current.setLocalVideo(newState);
            if (isMountedRef.current) {
                setIsCameraOn(newState);
            }
        } catch (err) {
            console.error('[Daily] Camera toggle error:', err);
        }
    }, [isCameraOn]);

    /**
     * Toggle microphone
     */
    const toggleMic = useCallback(async () => {
        if (!callObjectRef.current) return;

        try {
            const newState = !isMicOn;
            await callObjectRef.current.setLocalAudio(newState);
            if (isMountedRef.current) {
                setIsMicOn(newState);
            }
        } catch (err) {
            console.error('[Daily] Mic toggle error:', err);
        }
    }, [isMicOn]);

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = useCallback(async () => {
        if (!callObjectRef.current) return;

        try {
            if (isScreenSharing) {
                await callObjectRef.current.stopScreenShare();
            } else {
                await callObjectRef.current.startScreenShare();
            }
            if (isMountedRef.current) {
                setIsScreenSharing(!isScreenSharing);
            }
        } catch (err) {
            console.error('[Daily] Screen share error:', err);
            // Permission denied or cancelled
        }
    }, [isScreenSharing]);

    return {
        isJoining,
        isJoined,
        error,
        participants,
        localParticipant,
        isCameraOn,
        isMicOn,
        isScreenSharing,
        join,
        leave,
        toggleCamera,
        toggleMic,
        toggleScreenShare,
    };
}

export default useDailyCall;
