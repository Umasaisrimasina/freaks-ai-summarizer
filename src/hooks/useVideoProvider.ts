/**
 * Unified Video Provider Hook - LiveKit Edition
 * Real LiveKit integration with multi-user video
 * 
 * FEATURES:
 * - Real LiveKit video calls
 * - Multi-user participant sync
 * - Remote video/audio tracks
 * - Camera/mic controls
 * - Screen sharing
 * - Join by room ID
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Room, RoomEvent, Track, Participant, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { fetchVideoToken } from '../services/videoService';
import { auth } from '../firebase';

export interface VideoParticipant {
    id: string;
    name: string;
    isLocal: boolean;
    isCameraOn: boolean;
    isMicOn: boolean;
    isSpeaking: boolean;
    initials: string;
    color: string;
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
    videoStream?: MediaStream;
}

export interface UseVideoProviderState {
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    participants: VideoParticipant[];
    localParticipant: VideoParticipant | null;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;
    roomId: string | null;
    localVideoStream: MediaStream | null;
    joinCode: string | null;
}

export interface UseVideoProviderActions {
    connect: (roomId: string) => Promise<boolean>;
    disconnect: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleMic: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
}

export type UseVideoProviderReturn = UseVideoProviderState & UseVideoProviderActions;

// Color palette for participant avatars
const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';
}

function getColor(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Generate a shareable room code from room ID
function generateJoinCode(roomId: string): string {
    const hash = roomId.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
}

export function useVideoProvider(): UseVideoProviderReturn {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<VideoParticipant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<VideoParticipant | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
    const [joinCode, setJoinCode] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const roomRef = useRef<Room | null>(null);

    /**
     * Convert LiveKit participant to our format
     */
    const convertParticipant = useCallback((p: Participant, isLocal: boolean): VideoParticipant => {
        const name = p.name || p.identity || 'Guest';
        const id = p.identity || 'unknown';

        // Get video track
        let videoTrack: MediaStreamTrack | undefined;
        let videoStream: MediaStream | undefined;
        const camPublication = p.getTrackPublication(Track.Source.Camera);
        if (camPublication?.track) {
            videoTrack = camPublication.track.mediaStreamTrack;
            if (videoTrack) {
                videoStream = new MediaStream([videoTrack]);
            }
        }

        // Get audio track  
        let audioTrack: MediaStreamTrack | undefined;
        const micPublication = p.getTrackPublication(Track.Source.Microphone);
        if (micPublication?.track) {
            audioTrack = micPublication.track.mediaStreamTrack;
        }

        return {
            id,
            name,
            initials: getInitials(name),
            color: getColor(id),
            isLocal,
            isCameraOn: camPublication?.isSubscribed || false,
            isMicOn: micPublication?.isSubscribed || false,
            isSpeaking: p.isSpeaking || false,
            videoTrack,
            audioTrack,
            videoStream,
        };
    }, []);

    /**
     * Update all participants from LiveKit room
     */
    const updateParticipants = useCallback(() => {
        if (!roomRef.current || !isMountedRef.current) return;

        const room = roomRef.current;
        const converted: VideoParticipant[] = [];

        // Add local participant
        if (room.localParticipant) {
            const local = convertParticipant(room.localParticipant, true);
            converted.push(local);
            setLocalParticipant(local);

            // Update local video stream
            const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
            if (camPub?.track?.mediaStreamTrack) {
                setLocalVideoStream(new MediaStream([camPub.track.mediaStreamTrack]));
                setIsCameraOn(true);
            } else {
                setIsCameraOn(false);
            }

            const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
            setIsMicOn(!!micPub?.track);
        }

        // Add remote participants
        room.remoteParticipants.forEach((p: RemoteParticipant) => {
            converted.push(convertParticipant(p, false));
        });

        setParticipants(converted);
    }, [convertParticipant]);

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

    /**
     * Connect to a video room using LiveKit
     */
    const connect = useCallback(async (newRoomId: string): Promise<boolean> => {
        if (isConnected || isConnecting) {
            console.warn('[VideoProvider] Already connected or connecting');
            return false;
        }

        setIsConnecting(true);
        setError(null);
        setRoomId(newRoomId);
        setJoinCode(generateJoinCode(newRoomId));

        try {
            // Fetch token from backend
            console.log('[VideoProvider] Fetching token for room:', newRoomId);
            const credentials = await fetchVideoToken(newRoomId);
            console.log('[VideoProvider] Got credentials:', credentials.roomUrl);

            // Create LiveKit room
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
            });

            roomRef.current = room;

            // Set up event listeners
            room.on(RoomEvent.Connected, () => {
                console.log('[VideoProvider] Connected to room');
                if (isMountedRef.current) {
                    setIsConnected(true);
                    setIsConnecting(false);
                    updateParticipants();
                }
            });

            room.on(RoomEvent.Disconnected, () => {
                console.log('[VideoProvider] Disconnected from room');
                if (isMountedRef.current) {
                    setIsConnected(false);
                    setParticipants([]);
                    setLocalParticipant(null);
                }
            });

            room.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log('[VideoProvider] Participant joined:', participant.identity);
                updateParticipants();
            });

            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log('[VideoProvider] Participant left:', participant.identity);
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
                const speakerIds = speakers.map(s => s.identity);
                setParticipants(prev => prev.map(p => ({
                    ...p,
                    isSpeaking: speakerIds.includes(p.id),
                })));
            });

            // Connect to the room
            await room.connect(credentials.roomUrl, credentials.token);
            console.log('[VideoProvider] Successfully connected to LiveKit');

            return true;

        } catch (err: any) {
            console.error('[VideoProvider] Connection failed:', err.message);

            // Fallback to local-only mode
            if (isMountedRef.current) {
                setError(null);
                setIsConnected(true);
                setIsConnecting(false);

                const user = auth.currentUser;
                const name = user?.displayName || user?.email?.split('@')[0] || 'You';
                const id = user?.uid || 'local';

                const local: VideoParticipant = {
                    id,
                    name,
                    initials: getInitials(name),
                    color: getColor(id),
                    isLocal: true,
                    isCameraOn: false,
                    isMicOn: false,
                    isSpeaking: false,
                };

                setLocalParticipant(local);
                setParticipants([local]);
            }

            return true;
        }
    }, [isConnected, isConnecting, updateParticipants]);

    /**
     * Disconnect from video room
     */
    const disconnect = useCallback(async () => {
        if (roomRef.current) {
            try {
                await roomRef.current.disconnect();
            } catch (err) {
                console.error('[VideoProvider] Disconnect error:', err);
            }
            roomRef.current = null;
        }

        // Stop local video stream
        if (localVideoStream) {
            localVideoStream.getTracks().forEach(t => t.stop());
        }

        if (isMountedRef.current) {
            setIsConnected(false);
            setIsConnecting(false);
            setParticipants([]);
            setLocalParticipant(null);
            setIsCameraOn(false);
            setIsMicOn(false);
            setIsScreenSharing(false);
            setRoomId(null);
            setJoinCode(null);
            setLocalVideoStream(null);
            setError(null);
        }
    }, [localVideoStream]);

    /**
     * Toggle camera
     */
    const toggleCamera = useCallback(async () => {
        const newState = !isCameraOn;

        if (roomRef.current?.localParticipant) {
            try {
                await roomRef.current.localParticipant.setCameraEnabled(newState);
                setIsCameraOn(newState);
                updateParticipants();
            } catch (err: any) {
                console.error('[VideoProvider] Camera toggle error:', err);
                setError('Camera permission denied');
            }
        } else {
            // Local-only mode
            if (newState) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    });
                    setLocalVideoStream(stream);
                    setIsCameraOn(true);
                    setLocalParticipant(prev => prev ? { ...prev, isCameraOn: true } : null);
                    setParticipants(prev => prev.map(p =>
                        p.isLocal ? { ...p, isCameraOn: true } : p
                    ));
                } catch (err: any) {
                    console.error('[VideoProvider] Camera error:', err);
                    setError('Camera permission denied');
                }
            } else {
                if (localVideoStream) {
                    localVideoStream.getTracks().forEach(t => t.stop());
                }
                setLocalVideoStream(null);
                setIsCameraOn(false);
                setLocalParticipant(prev => prev ? { ...prev, isCameraOn: false } : null);
                setParticipants(prev => prev.map(p =>
                    p.isLocal ? { ...p, isCameraOn: false } : p
                ));
            }
        }
    }, [isCameraOn, localVideoStream, updateParticipants]);

    /**
     * Toggle microphone
     */
    const toggleMic = useCallback(async () => {
        const newState = !isMicOn;

        if (roomRef.current?.localParticipant) {
            try {
                await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
                setIsMicOn(newState);
                updateParticipants();
            } catch (err: any) {
                console.error('[VideoProvider] Mic toggle error:', err);
                setError('Microphone permission denied');
            }
        } else {
            setIsMicOn(newState);
            setLocalParticipant(prev => prev ? { ...prev, isMicOn: newState } : null);
            setParticipants(prev => prev.map(p =>
                p.isLocal ? { ...p, isMicOn: newState } : p
            ));
        }
    }, [isMicOn, updateParticipants]);

    /**
     * Toggle screen sharing
     */
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Stop screen sharing
            if (roomRef.current?.localParticipant) {
                try {
                    await roomRef.current.localParticipant.setScreenShareEnabled(false);
                } catch (err) {
                    console.error('[VideoProvider] Screen share stop error:', err);
                }
            }
            // Stop local screen share stream
            if (localVideoStream) {
                // Check if current stream is screen share (has display surface)
                const track = localVideoStream.getVideoTracks()[0];
                if (track?.getSettings?.()?.displaySurface) {
                    localVideoStream.getTracks().forEach(t => t.stop());
                    setLocalVideoStream(null);
                }
            }
            setIsScreenSharing(false);
        } else {
            // Start screen sharing
            if (roomRef.current?.localParticipant) {
                try {
                    await roomRef.current.localParticipant.setScreenShareEnabled(true);
                    setIsScreenSharing(true);
                } catch (err: any) {
                    console.error('[VideoProvider] Screen share error:', err);
                    setError('Screen share failed');
                }
            } else {
                // Local-only mode - use getDisplayMedia directly
                try {
                    console.log('[VideoProvider] Starting local screen share...');
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            displaySurface: 'monitor',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                        },
                        audio: false,
                    });

                    // Stop camera stream if active
                    if (localVideoStream) {
                        localVideoStream.getTracks().forEach(t => t.stop());
                    }

                    setLocalVideoStream(stream);
                    setIsScreenSharing(true);
                    setIsCameraOn(false);

                    // Listen for user stopping share via browser UI
                    stream.getVideoTracks()[0].onended = () => {
                        console.log('[VideoProvider] Screen share ended by user');
                        setIsScreenSharing(false);
                        setLocalVideoStream(null);
                    };

                    console.log('[VideoProvider] Screen share started successfully');
                } catch (err: any) {
                    console.error('[VideoProvider] Screen share error:', err);
                    if (err.name === 'NotAllowedError') {
                        setError('Screen share permission denied');
                    } else {
                        setError('Screen share failed');
                    }
                }
            }
        }
    }, [isScreenSharing, localVideoStream]);

    return {
        isConnecting,
        isConnected,
        error,
        participants,
        localParticipant,
        isCameraOn,
        isMicOn,
        isScreenSharing,
        roomId,
        localVideoStream,
        joinCode,
        connect,
        disconnect,
        toggleCamera,
        toggleMic,
        toggleScreenShare,
    };
}

export default useVideoProvider;
