/**
 * Remote Video Component - Optimized
 * Uses React.memo and stable refs to prevent unnecessary re-renders
 */

import React, { useEffect, useRef, memo } from 'react';

interface RemoteVideoProps {
    stream: MediaStream | undefined;
    isLocal: boolean;
    style?: React.CSSProperties;
}

const RemoteVideoComponent: React.FC<RemoteVideoProps> = ({ stream, isLocal, style }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const attachedStreamIdRef = useRef<string | null>(null);
    const keepAliveRef = useRef<number | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const streamId = stream?.id || null;
        
        // Only re-attach if stream actually changed
        if (streamId !== attachedStreamIdRef.current) {
            attachedStreamIdRef.current = streamId;
            video.srcObject = stream || null;
            
            if (stream) {
                video.play().catch(() => {});
            }
        }

        // Clear any existing keep-alive
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
        }

        // Set up keep-alive only if we have a stream
        if (stream) {
            keepAliveRef.current = window.setInterval(() => {
                if (video.paused && video.srcObject) {
                    video.play().catch(() => {});
                }
            }, 1000);
        }

        return () => {
            if (keepAliveRef.current) {
                clearInterval(keepAliveRef.current);
                keepAliveRef.current = null;
            }
        };
    }, [stream]);

    return (
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
    );
};

// Memoize to prevent re-renders when parent re-renders
export const RemoteVideo = memo(RemoteVideoComponent, (prev, next) => {
    // Only re-render if stream ID changed or isLocal changed
    return prev.stream?.id === next.stream?.id && prev.isLocal === next.isLocal;
});

export default RemoteVideo;
