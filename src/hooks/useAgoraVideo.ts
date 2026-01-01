/**
 * Agora Video Provider Hook
 * Implements video calling using Agora RTC SDK
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    IAgoraRTCRemoteUser,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';
import { auth } from '../firebase';

// Agora App ID from environment or hardcoded for development
// @ts-ignore - Vite env types
const AGORA_APP_ID = import.meta.env?.VITE_AGORA_APP_ID || 'd45777a63be74f9d8c5effc3685a6a16';

export interface VideoParticipant {
    id: string;
    name: string;
    initials: string;
    color: string;
    isLocal: boolean;
    isCameraOn: boolean;
    isMicOn: boolean;
    isSpeaking: boolean;
    videoTrack?: MediaStreamTrack;
    audioTrack?: MediaStreamTrack;
    videoStream?: MediaStream;
    // Agora-specific
    agoraUser?: IAgoraRTCRemoteUser;
}

export interface UseVideoProviderReturn {
    connect: (roomId: string) => Promise<boolean>;
    disconnect: () => Promise<void>;
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    participants: VideoParticipant[];
    localParticipant: VideoParticipant | null;
    isCameraOn: boolean;
    isMicOn: boolean;
    isScreenSharing: boolean;
    toggleCamera: () => Promise<void>;
    toggleMic: () => Promise<void>;
    toggleScreenShare: () => Promise<void>;
    localVideoStream: MediaStream | null;
    joinCode: string | null;
}

// Helper functions
function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function getColor(id: string): string {
    const colors = [
        '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
        '#F59E0B', '#10B981', '#06B6D4', '#3B82F6'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash) + id.charCodeAt(i);
        hash |= 0;
    }
    return colors[Math.abs(hash) % colors.length];
}

export function useAgoraVideo(): UseVideoProviderReturn {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<VideoParticipant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<VideoParticipant | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isMicOn, setIsMicOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
    const [joinCode, setJoinCode] = useState<string | null>(null);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
    const remoteUsersRef = useRef<Map<string, IAgoraRTCRemoteUser>>(new Map());
    const isMountedRef = useRef(true);

    // Update participants list
    const updateParticipants = useCallback(() => {
        if (!isMountedRef.current) return;

        const allParticipants: VideoParticipant[] = [];

        // Add local participant
        const user = auth.currentUser;
        const localName = user?.displayName || user?.email?.split('@')[0] || 'You';
        const localId = user?.uid || 'local';

        const local: VideoParticipant = {
            id: localId,
            name: localName,
            initials: getInitials(localName),
            color: getColor(localId),
            isLocal: true,
            isCameraOn: !!localVideoTrackRef.current && !localVideoTrackRef.current.muted,
            isMicOn: !!localAudioTrackRef.current && !localAudioTrackRef.current.muted,
            isSpeaking: false,
            videoStream: localVideoTrackRef.current 
                ? new MediaStream([localVideoTrackRef.current.getMediaStreamTrack()])
                : undefined,
        };
        allParticipants.push(local);
        setLocalParticipant(local);

        // Update local video stream
        if (localVideoTrackRef.current && !localVideoTrackRef.current.muted) {
            setLocalVideoStream(new MediaStream([localVideoTrackRef.current.getMediaStreamTrack()]));
        } else if (screenTrackRef.current) {
            setLocalVideoStream(new MediaStream([screenTrackRef.current.getMediaStreamTrack()]));
        }

        // Add remote participants
        remoteUsersRef.current.forEach((remoteUser, odeid) => {
            const remoteName = remoteUser.uid?.toString() || 'Guest';
            const remoteId = remoteUser.uid?.toString() || odeid;

            // Get video stream from remote user
            let videoStream: MediaStream | undefined;
            if (remoteUser.videoTrack) {
                try {
                    videoStream = new MediaStream([remoteUser.videoTrack.getMediaStreamTrack()]);
                    console.log(`[Agora] Remote user ${remoteId} has video track`);
                } catch (e) {
                    console.warn(`[Agora] Could not get video track for ${remoteId}:`, e);
                }
            }

            const remote: VideoParticipant = {
                id: remoteId,
                name: remoteName,
                initials: getInitials(remoteName),
                color: getColor(remoteId),
                isLocal: false,
                isCameraOn: !!remoteUser.videoTrack,
                isMicOn: !!remoteUser.audioTrack,
                isSpeaking: false,
                videoStream,
                agoraUser: remoteUser,
            };
            allParticipants.push(remote);
            console.log(`[Agora] Added remote participant:`, remoteId, 'hasVideo:', !!remoteUser.videoTrack);
        });

        console.log(`[Agora] Total participants: ${allParticipants.length}`);
        setParticipants(allParticipants);
    }, []);

    // Connect to a room
    const connect = useCallback(async (roomId: string): Promise<boolean> => {
        if (isConnected || isConnecting) {
            console.warn('[Agora] Already connected or connecting');
            return false;
        }

        const normalizedRoomId = roomId.toUpperCase();
        console.log('[Agora] ========================================');
        console.log('[Agora] Connecting to room:', normalizedRoomId);
        console.log('[Agora] App ID:', AGORA_APP_ID);
        console.log('[Agora] ========================================');

        if (!AGORA_APP_ID) {
            setError('Agora App ID not configured');
            return false;
        }

        setIsConnecting(true);
        setError(null);
        setJoinCode(normalizedRoomId);

        try {
            // Create Agora client
            const client = AgoraRTC.createClient({ 
                mode: 'rtc', 
                codec: 'vp8' 
            });
            clientRef.current = client;

            // Set up event handlers
            client.on('user-published', async (user, mediaType) => {
                console.log(`[Agora] User published: ${user.uid}, mediaType: ${mediaType}`);
                
                // Subscribe to the remote user
                await client.subscribe(user, mediaType);
                console.log(`[Agora] Subscribed to ${user.uid} ${mediaType}`);

                // Store remote user
                remoteUsersRef.current.set(user.uid.toString(), user);

                // Play audio automatically
                if (mediaType === 'audio' && user.audioTrack) {
                    user.audioTrack.play();
                }

                // Update participants
                setTimeout(updateParticipants, 100);
            });

            client.on('user-unpublished', (user, mediaType) => {
                console.log(`[Agora] User unpublished: ${user.uid}, mediaType: ${mediaType}`);
                // Update the stored user
                remoteUsersRef.current.set(user.uid.toString(), user);
                updateParticipants();
            });

            client.on('user-joined', (user) => {
                console.log(`[Agora] User joined: ${user.uid}`);
                remoteUsersRef.current.set(user.uid.toString(), user);
                updateParticipants();
            });

            client.on('user-left', (user) => {
                console.log(`[Agora] User left: ${user.uid}`);
                remoteUsersRef.current.delete(user.uid.toString());
                updateParticipants();
            });

            // Generate a unique UID for this user
            const user = auth.currentUser;
            const uid = user?.uid ? hashStringToNumber(user.uid) : Math.floor(Math.random() * 100000);
            
            // Join the channel (no token required for testing)
            console.log('[Agora] Joining channel:', normalizedRoomId, 'as UID:', uid);
            await client.join(AGORA_APP_ID, normalizedRoomId, null, uid);
            console.log('[Agora] Joined channel successfully');

            // Create and publish local tracks
            try {
                console.log('[Agora] Creating local tracks...');
                const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                
                localAudioTrackRef.current = audioTrack;
                localVideoTrackRef.current = videoTrack;

                // Publish tracks
                await client.publish([audioTrack, videoTrack]);
                console.log('[Agora] Published local tracks');

                setIsCameraOn(true);
                setIsMicOn(true);
                setLocalVideoStream(new MediaStream([videoTrack.getMediaStreamTrack()]));
            } catch (mediaErr: any) {
                console.warn('[Agora] Could not create media tracks:', mediaErr.message);
                // Continue without media - user can enable later
            }

            setIsConnected(true);
            setIsConnecting(false);
            updateParticipants();

            return true;

        } catch (err: any) {
            console.error('[Agora] Connection failed:', err);
            setError(err.message || 'Failed to connect');
            setIsConnecting(false);
            return false;
        }
    }, [isConnected, isConnecting, updateParticipants]);

    // Disconnect from room
    const disconnect = useCallback(async () => {
        console.log('[Agora] Disconnecting...');

        // Stop local tracks
        if (localVideoTrackRef.current) {
            localVideoTrackRef.current.stop();
            localVideoTrackRef.current.close();
            localVideoTrackRef.current = null;
        }
        if (localAudioTrackRef.current) {
            localAudioTrackRef.current.stop();
            localAudioTrackRef.current.close();
            localAudioTrackRef.current = null;
        }
        if (screenTrackRef.current) {
            screenTrackRef.current.stop();
            screenTrackRef.current.close();
            screenTrackRef.current = null;
        }

        // Leave channel
        if (clientRef.current) {
            await clientRef.current.leave();
            clientRef.current = null;
        }

        // Clear state
        remoteUsersRef.current.clear();
        setIsConnected(false);
        setParticipants([]);
        setLocalParticipant(null);
        setIsCameraOn(false);
        setIsMicOn(false);
        setIsScreenSharing(false);
        setLocalVideoStream(null);
        setJoinCode(null);
    }, []);

    // Toggle camera
    const toggleCamera = useCallback(async () => {
        if (!clientRef.current) return;

        try {
            if (localVideoTrackRef.current) {
                // Toggle existing track
                await localVideoTrackRef.current.setMuted(!localVideoTrackRef.current.muted);
                const isOn = !localVideoTrackRef.current.muted;
                setIsCameraOn(isOn);
                if (isOn) {
                    setLocalVideoStream(new MediaStream([localVideoTrackRef.current.getMediaStreamTrack()]));
                } else {
                    setLocalVideoStream(null);
                }
            } else {
                // Create new video track
                const videoTrack = await AgoraRTC.createCameraVideoTrack();
                localVideoTrackRef.current = videoTrack;
                await clientRef.current.publish([videoTrack]);
                setIsCameraOn(true);
                setLocalVideoStream(new MediaStream([videoTrack.getMediaStreamTrack()]));
            }
            updateParticipants();
        } catch (err: any) {
            console.error('[Agora] Toggle camera failed:', err);
            setError('Could not toggle camera');
        }
    }, [updateParticipants]);

    // Toggle microphone
    const toggleMic = useCallback(async () => {
        if (!clientRef.current) return;

        try {
            if (localAudioTrackRef.current) {
                await localAudioTrackRef.current.setMuted(!localAudioTrackRef.current.muted);
                setIsMicOn(!localAudioTrackRef.current.muted);
            } else {
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                localAudioTrackRef.current = audioTrack;
                await clientRef.current.publish([audioTrack]);
                setIsMicOn(true);
            }
            updateParticipants();
        } catch (err: any) {
            console.error('[Agora] Toggle mic failed:', err);
            setError('Could not toggle microphone');
        }
    }, [updateParticipants]);

    // Toggle screen share
    const toggleScreenShare = useCallback(async () => {
        if (!clientRef.current) return;

        try {
            if (isScreenSharing && screenTrackRef.current) {
                // Stop screen share
                await clientRef.current.unpublish([screenTrackRef.current]);
                screenTrackRef.current.stop();
                screenTrackRef.current.close();
                screenTrackRef.current = null;
                setIsScreenSharing(false);
                
                // Restore camera if it was on
                if (localVideoTrackRef.current && !localVideoTrackRef.current.muted) {
                    setLocalVideoStream(new MediaStream([localVideoTrackRef.current.getMediaStreamTrack()]));
                }
            } else {
                // Start screen share
                const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'disable');
                
                // Handle array return (with audio) or single track
                const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
                screenTrackRef.current = videoTrack as ILocalVideoTrack;
                
                // Unpublish camera first if publishing
                if (localVideoTrackRef.current) {
                    await clientRef.current.unpublish([localVideoTrackRef.current]);
                }
                
                await clientRef.current.publish([videoTrack]);
                setIsScreenSharing(true);
                setLocalVideoStream(new MediaStream([videoTrack.getMediaStreamTrack()]));
                
                // Handle screen share stop from browser UI
                videoTrack.on('track-ended', async () => {
                    console.log('[Agora] Screen share ended by user');
                    if (clientRef.current && screenTrackRef.current) {
                        await clientRef.current.unpublish([screenTrackRef.current]);
                        screenTrackRef.current.close();
                        screenTrackRef.current = null;
                        setIsScreenSharing(false);
                        
                        // Republish camera
                        if (localVideoTrackRef.current) {
                            await clientRef.current.publish([localVideoTrackRef.current]);
                            if (!localVideoTrackRef.current.muted) {
                                setLocalVideoStream(new MediaStream([localVideoTrackRef.current.getMediaStreamTrack()]));
                            }
                        }
                    }
                });
            }
            updateParticipants();
        } catch (err: any) {
            console.error('[Agora] Toggle screen share failed:', err);
            setError('Could not share screen');
        }
    }, [isScreenSharing, updateParticipants]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            disconnect();
        };
    }, [disconnect]);

    return {
        connect,
        disconnect,
        isConnecting,
        isConnected,
        error,
        participants,
        localParticipant,
        isCameraOn,
        isMicOn,
        isScreenSharing,
        toggleCamera,
        toggleMic,
        toggleScreenShare,
        localVideoStream,
        joinCode,
    };
}

// Helper to convert string to numeric UID for Agora
function hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 1000000000; // Keep it under 10 digits
}

export default useAgoraVideo;
