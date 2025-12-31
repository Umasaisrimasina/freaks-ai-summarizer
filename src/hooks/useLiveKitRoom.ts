/**
 * LiveKit Client Integration Hook
 * Manages video call state for LiveKit provider (failover)
 * 
 * FEATURES:
 * - Camera/Microphone control
 * - Participant tracking
 * - Screen sharing
 * - Automatic cleanup on unmount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Room,
    RoomEvent,
    Track,
    LocalParticipant,
    RemoteParticipant,
    Participant,
    createLocalTracks,
    ConnectionState,
} from 'livekit-client';

export interface LiveKitParticipant {
    id: string;
    name: string;
    isLocal: boolean;
    isCameraOn: boolean;
    isMicOn: boolean;
    isSpeaking: boolean;
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
}

export interface UseLiveKitRoomState {
    isJoining: boolean;
    isJoined: boolean;
    error: string | null;
    participants: LiveKitParticipant[];
    localParticipant: LiveKitParticipant | null;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;
}

export interface UseLiveKitRoomActions {
    join: (serverUrl: string, token: string) => Promise<boolean>;
    leave: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleMic: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
}

export type UseLiveKitRoomReturn = UseLiveKitRoomState & UseLiveKitRoomActions;

export function useLiveKitRoom(): UseLiveKitRoomReturn {
    const [isJoining, setIsJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<LiveKitParticipant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<LiveKitParticipant | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const roomRef = useRef<Room | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
        };
    }, []);

    // Convert LiveKit participant to our format
    const convertParticipant = useCallback((p: Participant, isLocal: boolean): LiveKitParticipant => {
        const videoTrack = p.getTrackPublication(Track.Source.Camera)?.track?.mediaStreamTrack;
        const audioTrack = p.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack;

        return {
            id: p.identity,
            name: p.name || p.identity,
            isLocal,
            isCameraOn: p.isCameraEnabled,
            isMicOn: p.isMicrophoneEnabled,
            isSpeaking: p.isSpeaking,
            videoTrack,
            audioTrack,
        };
    }, []);

    // Update participants list
    const updateParticipants = useCallback(() => {
        if (!roomRef.current || !isMountedRef.current) return;

        const room = roomRef.current;
        const converted: LiveKitParticipant[] = [];
        let local: LiveKitParticipant | null = null;

        // Add local participant
        if (room.localParticipant) {
            local = convertParticipant(room.localParticipant, true);
            converted.push(local);
            setIsCameraOn(room.localParticipant.isCameraEnabled);
            setIsMicOn(room.localParticipant.isMicrophoneEnabled);
        }

        // Add remote participants
        room.remoteParticipants.forEach((p) => {
            converted.push(convertParticipant(p, false));
        });

        setParticipants(converted);
        setLocalParticipant(local);
    }, [convertParticipant]);

    /**
     * Join a LiveKit room
     */
    const join = useCallback(async (serverUrl: string, token: string): Promise<boolean> => {
        if (roomRef.current) {
            console.warn('[LiveKit] Already in a room');
            return false;
        }

        setIsJoining(true);
        setError(null);

        try {
            // Create room instance
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            roomRef.current = room;

            // Set up event listeners
            room.on(RoomEvent.Connected, () => {
                if (!isMountedRef.current) return;
                setIsJoined(true);
                setIsJoining(false);
                updateParticipants();
            });

            room.on(RoomEvent.Disconnected, () => {
                if (!isMountedRef.current) return;
                setIsJoined(false);
                setParticipants([]);
                setLocalParticipant(null);
            });

            room.on(RoomEvent.ParticipantConnected, () => {
                updateParticipants();
            });

            room.on(RoomEvent.ParticipantDisconnected, () => {
                updateParticipants();
            });

            room.on(RoomEvent.TrackSubscribed, () => {
                updateParticipants();
            });

            room.on(RoomEvent.TrackUnsubscribed, () => {
                updateParticipants();
            });

            room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                if (!isMountedRef.current) return;
                const speakerIds = new Set(speakers.map(s => s.identity));
                setParticipants(prev => prev.map(p => ({
                    ...p,
                    isSpeaking: speakerIds.has(p.id),
                })));
            });

            room.on(RoomEvent.LocalTrackPublished, () => {
                updateParticipants();
            });

            room.on(RoomEvent.LocalTrackUnpublished, () => {
                updateParticipants();
            });

            // Connect to the room (audio/video off by default - Silent Presence)
            await room.connect(serverUrl, token, {
                autoSubscribe: true,
            });

            return true;

        } catch (err: any) {
            console.error('[LiveKit] Join failed:', err);
            if (isMountedRef.current) {
                setError('Failed to join video call');
                setIsJoining(false);
            }
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
            return false;
        }
    }, [updateParticipants]);

    /**
     * Leave the room
     */
    const leave = useCallback(async () => {
        if (!roomRef.current) return;

        try {
            roomRef.current.disconnect();
            roomRef.current = null;
        } catch (err) {
            console.error('[LiveKit] Leave error:', err);
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
        if (!roomRef.current?.localParticipant) return;

        try {
            const newState = !isCameraOn;
            await roomRef.current.localParticipant.setCameraEnabled(newState);
            if (isMountedRef.current) {
                setIsCameraOn(newState);
            }
        } catch (err) {
            console.error('[LiveKit] Camera toggle error:', err);
        }
    }, [isCameraOn]);

    /**
     * Toggle microphone
     */
    const toggleMic = useCallback(async () => {
        if (!roomRef.current?.localParticipant) return;

        try {
            const newState = !isMicOn;
            await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
            if (isMountedRef.current) {
                setIsMicOn(newState);
            }
        } catch (err) {
            console.error('[LiveKit] Mic toggle error:', err);
        }
    }, [isMicOn]);

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = useCallback(async () => {
        if (!roomRef.current?.localParticipant) return;

        try {
            const newState = !isScreenSharing;
            await roomRef.current.localParticipant.setScreenShareEnabled(newState);
            if (isMountedRef.current) {
                setIsScreenSharing(newState);
            }
        } catch (err) {
            console.error('[LiveKit] Screen share error:', err);
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

export default useLiveKitRoom;
