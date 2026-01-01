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
import { 
    Room, 
    RoomEvent, 
    Track, 
    Participant, 
    RemoteParticipant, 
    LocalParticipant,
    ConnectionState,
    LocalTrackPublication,
    RemoteTrackPublication,
    TrackPublication,
    VideoPresets,
    createLocalTracks,
    LocalVideoTrack,
    LocalAudioTrack,
    VideoTrack,
} from 'livekit-client';
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
    /** LiveKit VideoTrack for direct attach/detach - recommended for video playback */
    livekitVideoTrack?: VideoTrack;
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
    localLivekitVideoTrack: VideoTrack | null;
    joinCode: string | null;
}

export interface UseVideoProviderActions {
    connect: (roomId: string) => Promise<boolean>;
    disconnect: () => Promise<void>;
    toggleCamera: () => Promise<void>;
    toggleMic: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
    // Admin controls
    muteParticipant: (participantId: string, trackType?: 'audio' | 'video' | 'all') => Promise<boolean>;
    kickParticipant: (participantId: string) => Promise<boolean>;
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

// The join code IS the room ID (uppercase for display)
function generateJoinCode(roomId: string): string {
    return roomId.toUpperCase();
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
    const [localLivekitVideoTrack, setLocalLivekitVideoTrack] = useState<VideoTrack | null>(null);
    const [joinCode, setJoinCode] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const roomRef = useRef<Room | null>(null);
    const screenShareTrackRef = useRef<LocalVideoTrack | null>(null);
    
    // Stable stream storage - preserves stream objects across renders
    const participantStreamsRef = useRef<Map<string, MediaStream>>(new Map());

    /**
     * Get a stable MediaStream for a participant's video track
     * Creates new stream only when track changes, preserves existing streams
     */
    const getParticipantStream = useCallback((participantId: string, track: MediaStreamTrack | undefined): MediaStream | undefined => {
        if (!track || track.readyState === 'ended') {
            participantStreamsRef.current.delete(participantId);
            return undefined;
        }
        
        const existing = participantStreamsRef.current.get(participantId);
        
        // Reuse existing stream if same track and still alive
        if (existing) {
            const existingTrack = existing.getVideoTracks()[0];
            if (existingTrack?.id === track.id && existingTrack.readyState === 'live') {
                return existing;
            }
        }
        
        // Create new stream with this track
        const newStream = new MediaStream([track]);
        participantStreamsRef.current.set(participantId, newStream);
        return newStream;
    }, []);

    /**
     * Convert LiveKit participant to our format
     */
    const convertParticipant = useCallback((p: Participant, isLocal: boolean): VideoParticipant => {
        const name = p.name || p.identity || 'Guest';
        const id = p.identity || 'unknown';

        // Get video track - check both camera and screen share
        let videoTrack: MediaStreamTrack | undefined;
        let videoStream: MediaStream | undefined;
        let livekitVideoTrack: VideoTrack | undefined;
        let hasCameraOn = false;
        
        // Get camera publication
        const camPublication = p.getTrackPublication(Track.Source.Camera);
        
        if (isLocal) {
            // For local participant, use the track directly
            if (camPublication?.track) {
                livekitVideoTrack = camPublication.track as VideoTrack;
                if (camPublication.track.mediaStreamTrack) {
                    videoTrack = camPublication.track.mediaStreamTrack;
                    videoStream = getParticipantStream(id, videoTrack);
                }
                hasCameraOn = !camPublication.isMuted;
            }
        } else {
            // For remote participants, check subscription status
            const remotePub = camPublication as RemoteTrackPublication;
            if (remotePub?.isSubscribed && remotePub.track) {
                livekitVideoTrack = remotePub.track as VideoTrack;
                if (remotePub.track.mediaStreamTrack) {
                    videoTrack = remotePub.track.mediaStreamTrack;
                    videoStream = getParticipantStream(id, videoTrack);
                }
                hasCameraOn = !remotePub.isMuted;
            }
        }

        // Get audio track  
        let audioTrack: MediaStreamTrack | undefined;
        let hasMicOn = false;
        const micPublication = p.getTrackPublication(Track.Source.Microphone);
        
        if (isLocal) {
            if (micPublication?.track?.mediaStreamTrack) {
                audioTrack = micPublication.track.mediaStreamTrack;
                hasMicOn = !micPublication.isMuted;
            }
        } else {
            const remoteMicPub = micPublication as RemoteTrackPublication;
            if (remoteMicPub?.isSubscribed && remoteMicPub.track?.mediaStreamTrack) {
                audioTrack = remoteMicPub.track.mediaStreamTrack;
                hasMicOn = !remoteMicPub.isMuted;
            }
        }

        return {
            id,
            name,
            initials: getInitials(name),
            color: getColor(id),
            isLocal,
            isCameraOn: hasCameraOn,
            isMicOn: hasMicOn,
            isSpeaking: p.isSpeaking || false,
            videoTrack,
            audioTrack,
            videoStream,
            livekitVideoTrack,
        };
    }, [getParticipantStream]);

    /**
     * Update all participants from LiveKit room
     * This is called directly from the room object to avoid stale closures
     */
    const updateParticipantsFromRoom = useCallback((room: Room) => {
        if (!room || !isMountedRef.current) return;

        const converted: VideoParticipant[] = [];

        // Add local participant
        if (room.localParticipant) {
            const local = convertParticipant(room.localParticipant, true);
            converted.push(local);
            setLocalParticipant(local);

            // Update local video stream and LiveKit track from camera track
            const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
            if (camPub?.track && !camPub.isMuted) {
                // Set the LiveKit video track for native attach/detach
                setLocalLivekitVideoTrack(camPub.track as VideoTrack);
                
                // Also update the stream for backward compatibility
                if (camPub.track.mediaStreamTrack) {
                    const currentTrack = camPub.track.mediaStreamTrack;
                    setLocalVideoStream(prev => {
                        const prevTrack = prev?.getVideoTracks()[0];
                        if (prevTrack?.id === currentTrack.id) return prev;
                        return new MediaStream([currentTrack]);
                    });
                }
                setIsCameraOn(true);
            } else {
                // Check if screen sharing is active
                const screenPub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
                if (screenPub?.track && !screenPub.isMuted) {
                    setLocalLivekitVideoTrack(screenPub.track as VideoTrack);
                    if (screenPub.track.mediaStreamTrack) {
                        const currentTrack = screenPub.track.mediaStreamTrack;
                        setLocalVideoStream(prev => {
                            const prevTrack = prev?.getVideoTracks()[0];
                            if (prevTrack?.id === currentTrack.id) return prev;
                            return new MediaStream([currentTrack]);
                        });
                    }
                    setIsScreenSharing(true);
                } else if (!isScreenSharing) {
                    setIsCameraOn(false);
                    setLocalLivekitVideoTrack(null);
                }
            }

            const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
            setIsMicOn(!!micPub?.track && !micPub.isMuted);
        }

        // Add remote participants
        room.remoteParticipants.forEach((p: RemoteParticipant) => {
            converted.push(convertParticipant(p, false));
        });

        // Only update if participants changed
        setParticipants(prev => {
            // Quick comparison - if same length and same IDs in same order, skip update
            if (prev.length === converted.length) {
                const same = prev.every((p, i) => 
                    p.id === converted[i].id && 
                    p.livekitVideoTrack === converted[i].livekitVideoTrack &&
                    p.isCameraOn === converted[i].isCameraOn
                );
                if (same) return prev;
            }
            return converted;
        });
    }, [convertParticipant, isScreenSharing]);

    /**
     * Update all participants from LiveKit room (uses roomRef)
     */
    const updateParticipants = useCallback(() => {
        if (roomRef.current) {
            updateParticipantsFromRoom(roomRef.current);
        }
    }, [updateParticipantsFromRoom]);

    // Periodic participant sync to catch any missed updates
    useEffect(() => {
        if (!isConnected || !roomRef.current) return;
        
        // Initial sync after connection stabilizes
        const initialTimer = setTimeout(updateParticipants, 500);

        // Periodic sync every 10 seconds as backup (events handle most updates)
        const interval = setInterval(() => {
            if (roomRef.current && isMountedRef.current) {
                updateParticipants();
            }
        }, 10000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isConnected, updateParticipants]);

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
     * Enables camera and microphone automatically after connection
     */
    const connect = useCallback(async (newRoomId: string): Promise<boolean> => {
        if (isConnected || isConnecting) {
            console.warn('[VideoProvider] Already connected or connecting');
            return false;
        }

        // Normalize room ID to uppercase for consistent matching
        const normalizedRoomId = newRoomId.toUpperCase();

        setIsConnecting(true);
        setError(null);
        setRoomId(normalizedRoomId);
        setJoinCode(normalizedRoomId);

        try {
            const credentials = await fetchVideoToken(normalizedRoomId);

            // Create LiveKit room with proper settings
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                videoCaptureDefaults: {
                    resolution: VideoPresets.h720.resolution,
                },
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            roomRef.current = room;

            // Helper to sync participants directly from room object
            const syncParticipants = () => {
                if (!isMountedRef.current) return;
                updateParticipantsFromRoom(room);
            };

            // Set up event listeners BEFORE connecting
            room.on(RoomEvent.Connected, () => {
                if (isMountedRef.current) {
                    setIsConnected(true);
                    setIsConnecting(false);
                    syncParticipants();
                }
            });

            room.on(RoomEvent.Disconnected, () => {
                if (isMountedRef.current) {
                    setIsConnected(false);
                    setParticipants([]);
                    setLocalParticipant(null);
                    setIsCameraOn(false);
                    setIsMicOn(false);
                    setIsScreenSharing(false);
                    setLocalVideoStream(null);
                }
            });

            room.on(RoomEvent.ParticipantConnected, (participant) => {
                setTimeout(syncParticipants, 100);
            });

            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                // Clear stream for disconnected participant
                participantStreamsRef.current.delete(participant.identity);
                syncParticipants();
            });

            room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
                // Sync after track subscription
                syncParticipants();
                setTimeout(syncParticipants, 200);
            });

            room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
                syncParticipants();
            });

            room.on(RoomEvent.LocalTrackPublished, () => syncParticipants());
            room.on(RoomEvent.LocalTrackUnpublished, () => syncParticipants());
            room.on(RoomEvent.TrackMuted, () => syncParticipants());
            room.on(RoomEvent.TrackUnmuted, () => syncParticipants());

            room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                if (!isMountedRef.current) return;
                const speakerIds = speakers.map(s => s.identity);
                setParticipants(prev => prev.map(p => ({
                    ...p,
                    isSpeaking: speakerIds.includes(p.id),
                })));
            });

            room.on(RoomEvent.TrackPublished, () => setTimeout(syncParticipants, 100));

            room.on(RoomEvent.MediaDevicesError, () => {
                // Non-blocking - user can still participate without camera/mic
            });

            // Connect to the room
            await room.connect(credentials.roomUrl, credentials.token);
            console.log('[VideoProvider] Connected to room:', room.name);
            
            syncParticipants();

            // Auto-enable camera and microphone
            try {
                await room.localParticipant.enableCameraAndMicrophone();
                setIsCameraOn(true);
                setIsMicOn(true);
                
                const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
                if (camPub?.track?.mediaStreamTrack) {
                    setLocalVideoStream(new MediaStream([camPub.track.mediaStreamTrack]));
                }
                
                syncParticipants();
            } catch (mediaErr: any) {
                console.warn('[VideoProvider] Could not enable media:', mediaErr.message);
                // This is non-blocking - user is still connected to the room
                // They can try to enable camera/mic manually with the toggle buttons
                // Try to enable camera separately as fallback
                try {
                    console.log('[VideoProvider] Attempting to enable camera only...');
                    await room.localParticipant.setCameraEnabled(true);
                    const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
                    if (camPub?.track?.mediaStreamTrack) {
                        setLocalVideoStream(new MediaStream([camPub.track.mediaStreamTrack]));
                        setIsCameraOn(true);
                        console.log('[VideoProvider] Camera enabled separately');
                    }
                } catch (camErr: any) {
                    console.warn('[VideoProvider] Camera-only enable also failed:', camErr.message);
                    // Still not an error - user can participate without camera
                }
                syncParticipants();
            }

            return true;

        } catch (err: any) {
            console.error('[VideoProvider] ========================================');
            console.error('[VideoProvider] Connection FAILED!');
            console.error('[VideoProvider]   Error:', err.message);
            console.error('[VideoProvider]   Stack:', err.stack);
            console.error('[VideoProvider] ========================================');

            // DO NOT silently fall back to local-only mode!
            // This was hiding connection failures and making users think they were in the room
            if (isMountedRef.current) {
                setError(err.message || 'Failed to connect to video room');
                setIsConnected(false);
                setIsConnecting(false);
            }

            return false;
        }
    }, [isConnected, isConnecting, updateParticipantsFromRoom]);

    /**
     * Disconnect from video room
     */
    const disconnect = useCallback(async () => {
        // Stop screen share track if active
        if (screenShareTrackRef.current) {
            screenShareTrackRef.current.stop();
            screenShareTrackRef.current = null;
        }

        if (roomRef.current) {
            try {
                // Disable camera and mic before disconnecting
                if (roomRef.current.localParticipant) {
                    try {
                        await roomRef.current.localParticipant.setCameraEnabled(false);
                        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
                    } catch (e) {
                        // Ignore errors during cleanup
                    }
                }
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
            
            // Clear participant streams on disconnect
            participantStreamsRef.current.clear();
        }
    }, [localVideoStream]);

    /**
     * Toggle camera
     */
    const toggleCamera = useCallback(async () => {
        const newState = !isCameraOn;
        console.log('[VideoProvider] Toggle camera:', newState);

        if (roomRef.current?.localParticipant) {
            try {
                await roomRef.current.localParticipant.setCameraEnabled(newState);
                setIsCameraOn(newState);
                
                // Update local video stream
                if (newState) {
                    const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
                    if (camPub?.track?.mediaStreamTrack) {
                        setLocalVideoStream(new MediaStream([camPub.track.mediaStreamTrack]));
                    }
                } else {
                    // Only clear stream if not screen sharing
                    if (!isScreenSharing) {
                        setLocalVideoStream(null);
                    }
                }
                
                updateParticipants();
            } catch (err: any) {
                console.error('[VideoProvider] Camera toggle error:', err);
                setError('Camera permission denied');
            }
        } else {
            // Local-only mode (fallback)
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
    }, [isCameraOn, isScreenSharing, localVideoStream, updateParticipants]);

    /**
     * Toggle microphone
     */
    const toggleMic = useCallback(async () => {
        const newState = !isMicOn;
        console.log('[VideoProvider] Toggle mic:', newState);

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
     * Toggle screen sharing - Google Meet style
     * Screen share replaces camera tile, audio continues from mic
     */
    const toggleScreenShare = useCallback(async () => {
        console.log('[VideoProvider] Toggle screen share:', !isScreenSharing);
        
        if (isScreenSharing) {
            // Stop screen sharing
            console.log('[VideoProvider] Stopping screen share...');
            
            if (roomRef.current?.localParticipant) {
                try {
                    await roomRef.current.localParticipant.setScreenShareEnabled(false);
                    console.log('[VideoProvider] Screen share disabled via LiveKit');
                } catch (err) {
                    console.error('[VideoProvider] Screen share stop error:', err);
                }
            }
            
            // Clean up screen share track ref
            if (screenShareTrackRef.current) {
                screenShareTrackRef.current.stop();
                screenShareTrackRef.current = null;
            }
            
            setIsScreenSharing(false);
            
            // Restore camera stream if camera was on
            if (isCameraOn && roomRef.current?.localParticipant) {
                const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
                if (camPub?.track?.mediaStreamTrack) {
                    setLocalVideoStream(new MediaStream([camPub.track.mediaStreamTrack]));
                }
            } else {
                setLocalVideoStream(null);
            }
            
            updateParticipants();
        } else {
            // Start screen sharing
            console.log('[VideoProvider] Starting screen share...');
            
            if (roomRef.current?.localParticipant) {
                try {
                    // Use LiveKit's built-in screen share which handles everything properly
                    await roomRef.current.localParticipant.setScreenShareEnabled(true, {
                        audio: false, // Keep mic separate for clean audio
                        video: {
                            displaySurface: 'monitor',
                        },
                        selfBrowserSurface: 'include',
                        surfaceSwitching: 'include',
                        systemAudio: 'exclude',
                    });
                    
                    setIsScreenSharing(true);
                    
                    // Update local video stream to show screen share
                    const screenPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare);
                    if (screenPub?.track?.mediaStreamTrack) {
                        setLocalVideoStream(new MediaStream([screenPub.track.mediaStreamTrack]));
                        screenShareTrackRef.current = screenPub.track as LocalVideoTrack;
                        
                        // Listen for track ending (user clicked browser's stop button)
                        screenPub.track.mediaStreamTrack.onended = () => {
                            console.log('[VideoProvider] Screen share ended by browser UI');
                            setIsScreenSharing(false);
                            screenShareTrackRef.current = null;
                            
                            // Restore camera if it was on
                            if (isCameraOn && roomRef.current?.localParticipant) {
                                const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
                                if (camPub?.track?.mediaStreamTrack) {
                                    setLocalVideoStream(new MediaStream([camPub.track.mediaStreamTrack]));
                                } else {
                                    setLocalVideoStream(null);
                                }
                            } else {
                                setLocalVideoStream(null);
                            }
                            updateParticipants();
                        };
                    }
                    
                    console.log('[VideoProvider] Screen share started via LiveKit');
                    updateParticipants();
                } catch (err: any) {
                    console.error('[VideoProvider] Screen share error:', err);
                    if (err.name === 'NotAllowedError') {
                        setError('Screen share permission denied');
                    } else {
                        setError('Screen share failed');
                    }
                }
            } else {
                // Local-only mode fallback
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            displaySurface: 'monitor',
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                        },
                        audio: false,
                    });

                    setLocalVideoStream(stream);
                    setIsScreenSharing(true);

                    stream.getVideoTracks()[0].onended = () => {
                        console.log('[VideoProvider] Screen share ended by user');
                        setIsScreenSharing(false);
                        setLocalVideoStream(null);
                    };
                } catch (err: any) {
                    console.error('[VideoProvider] Screen share error:', err);
                    setError('Screen share failed');
                }
            }
        }
    }, [isScreenSharing, isCameraOn, updateParticipants]);

    /**
     * Mute a remote participant's audio or video (admin action)
     */
    const muteParticipantAction = useCallback(async (
        participantId: string, 
        trackType: 'audio' | 'video' | 'all' = 'audio'
    ): Promise<boolean> => {
        if (!roomId) {
            console.error('[VideoProvider] Cannot mute: not in a room');
            return false;
        }
        
        try {
            const { muteParticipant } = await import('../services/videoService');
            await muteParticipant(roomId, participantId, trackType);
            console.log(`[VideoProvider] Muted ${trackType} for ${participantId}`);
            return true;
        } catch (err: any) {
            console.error('[VideoProvider] Mute failed:', err.message);
            setError(err.message || 'Failed to mute participant');
            return false;
        }
    }, [roomId]);

    /**
     * Kick a participant from the room (admin action)
     */
    const kickParticipantAction = useCallback(async (participantId: string): Promise<boolean> => {
        if (!roomId) {
            console.error('[VideoProvider] Cannot kick: not in a room');
            return false;
        }
        
        try {
            const { kickParticipant } = await import('../services/videoService');
            await kickParticipant(roomId, participantId);
            console.log(`[VideoProvider] Kicked ${participantId}`);
            return true;
        } catch (err: any) {
            console.error('[VideoProvider] Kick failed:', err.message);
            setError(err.message || 'Failed to kick participant');
            return false;
        }
    }, [roomId]);

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
        localLivekitVideoTrack,
        joinCode,
        connect,
        disconnect,
        toggleCamera,
        toggleMic,
        toggleScreenShare,
        muteParticipant: muteParticipantAction,
        kickParticipant: kickParticipantAction,
    };
}

export default useVideoProvider;
