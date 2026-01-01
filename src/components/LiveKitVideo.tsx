/**
 * LiveKit Video Component
 * Uses LiveKit's native track.attach() method for reliable video playback
 * This is the recommended way to display video from LiveKit tracks
 * 
 * Features:
 * - Native LiveKit track attachment
 * - Picture-in-Picture support
 * - Click to toggle PiP
 */

import React, { useEffect, useRef, memo, useCallback, useState } from 'react';
import { Track, VideoTrack } from 'livekit-client';

interface LiveKitVideoProps {
    track: VideoTrack | undefined;
    isLocal: boolean;
    style?: React.CSSProperties;
    participantName?: string;
    enablePiP?: boolean;
    onPiPChange?: (isPiP: boolean) => void;
}

const LiveKitVideoComponent: React.FC<LiveKitVideoProps> = ({ 
    track, 
    isLocal, 
    style,
    participantName,
    enablePiP = true,
    onPiPChange
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const attachedTrackRef = useRef<VideoTrack | null>(null);
    const [isPiP, setIsPiP] = useState(false);
    const [pipSupported, setPipSupported] = useState(false);

    // Check PiP support on mount
    useEffect(() => {
        setPipSupported('pictureInPictureEnabled' in document);
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Detach previous track if different
        if (attachedTrackRef.current && attachedTrackRef.current !== track) {
            attachedTrackRef.current.detach(video);
            attachedTrackRef.current = null;
        }

        // Attach new track
        if (track && track !== attachedTrackRef.current) {
            track.attach(video);
            attachedTrackRef.current = track;
        }

        return () => {
            // Cleanup on unmount
            if (attachedTrackRef.current && video) {
                attachedTrackRef.current.detach(video);
                attachedTrackRef.current = null;
            }
        };
    }, [track]);

    // Handle PiP state changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleEnterPiP = () => {
            setIsPiP(true);
            onPiPChange?.(true);
        };

        const handleLeavePiP = () => {
            setIsPiP(false);
            onPiPChange?.(false);
        };

        video.addEventListener('enterpictureinpicture', handleEnterPiP);
        video.addEventListener('leavepictureinpicture', handleLeavePiP);

        return () => {
            video.removeEventListener('enterpictureinpicture', handleEnterPiP);
            video.removeEventListener('leavepictureinpicture', handleLeavePiP);
        };
    }, [onPiPChange]);

    /**
     * Toggle Picture-in-Picture mode
     */
    const togglePiP = useCallback(async () => {
        const video = videoRef.current;
        if (!video || !pipSupported || !enablePiP) return;

        try {
            if (document.pictureInPictureElement === video) {
                await document.exitPictureInPicture();
            } else if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                await video.requestPictureInPicture();
            }
        } catch (err) {
            console.error('[LiveKitVideo] PiP toggle failed:', err);
        }
    }, [pipSupported, enablePiP]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: isLocal ? 'scaleX(-1)' : 'none',
                    backgroundColor: '#1a1a1a',
                    ...style,
                }}
            />
            {/* PiP Button - only show for remote videos with PiP support */}
            {enablePiP && pipSupported && !isLocal && track && (
                <button
                    onClick={togglePiP}
                    title={isPiP ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isPiP ? '#8B5CF6' : 'rgba(0, 0, 0, 0.6)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'all 0.2s ease',
                        opacity: 0.8,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                >
                    {/* PiP Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <rect x="11" y="9" width="9" height="6" rx="1" fill="currentColor" />
                    </svg>
                </button>
            )}
            {/* Participant name overlay */}
            {participantName && (
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                }}>
                    {participantName}
                </div>
            )}
        </div>
    );
};

// Memoize to prevent unnecessary re-renders
export const LiveKitVideo = memo(LiveKitVideoComponent, (prev, next) => {
    return prev.track === next.track && 
           prev.isLocal === next.isLocal && 
           prev.participantName === next.participantName &&
           prev.enablePiP === next.enablePiP;
});

export default LiveKitVideo;
