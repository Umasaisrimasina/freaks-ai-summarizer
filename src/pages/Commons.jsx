import React, { useState, useEffect, useRef } from 'react';
import { Users, Clock, Shield, Music, SkipBack, Play, Pause, SkipForward, Plus, X, ArrowRight, Mic, MicOff, Video, VideoOff, LogOut, FileText, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVideoProvider } from '../hooks/useVideoProvider';

const Commons = () => {
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    // Room Mode State (Silent Presence)
    const [activeRoom, setActiveRoom] = useState(null);
    const [floatingVideoPosition, setFloatingVideoPosition] = useState({ x: null, y: null });

    // Ref for local video element
    const localVideoRef = useRef(null);

    // Video provider hook - manages participants, camera, mic, screen share
    const {
        connect: connectVideo,
        disconnect: disconnectVideo,
        isConnecting: isVideoConnecting,
        isConnected: isVideoConnected,
        error: videoError,
        participants: videoParticipants,
        localParticipant,
        isCameraOn,
        isMicOn,
        isScreenSharing,
        toggleCamera,
        toggleMic,
        toggleScreenShare,
        localVideoStream,
        joinCode,
    } = useVideoProvider();

    // Attach local video stream to video element when available
    useEffect(() => {
        if (localVideoRef.current && localVideoStream) {
            localVideoRef.current.srcObject = localVideoStream;
        } else if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
    }, [localVideoStream]);

    // Map video participants to UI format (includes video stream for remote participants)
    const participants = videoParticipants.length > 0
        ? videoParticipants.map(p => ({
            id: p.id,
            name: p.name,
            initials: p.initials,
            color: p.color,
            isSpeaking: p.isSpeaking,
            hasCamera: p.isCameraOn,
            isMe: p.isLocal,
            videoStream: p.videoStream,
        }))
        : [];

    // FR-43: Collaborative Study Rooms
    const studyRooms = [
        { id: 1, name: 'Quiet Study A', currentTask: 'Chapter 5', participants: 85 },
        { id: 2, name: 'Focus Group B', currentTask: 'Project Prep', participants: 42 },
        { id: 3, name: 'Reading Room C', currentTask: 'Article Review', participants: 67 },
        { id: 4, name: 'Discussion Hall D', currentTask: 'Topic Brainstorm', participants: 110 },
        { id: 5, name: 'Workshop E', currentTask: 'Coding Challenge', participants: 35 },
        { id: 6, name: 'Breakout Space F', currentTask: 'Casual Chat', participants: 28 },
    ];

    /**
     * Handle joining a room
     * SECURITY: Only sends roomId to server; identity is extracted server-side
     * from the verified Firebase token. Never sends userId/userName from client.
     */
    const handleJoinRoom = async (room) => {
        // Enter room mode in-place FIRST (Silent Presence UI)
        // This ensures the UI transitions immediately
        setActiveRoom(room);

        // THEN attempt video connection (best-effort, non-blocking for UI)
        // Generate a safe room ID from the room name
        const roomId = `room-${room.id}-${room.name.toLowerCase().replace(/\s+/g, '-')}`;

        // SECURITY: connectVideo only sends roomId
        // Server extracts identity from Firebase token via Authorization header
        // Connection failure doesn't block UI - user can still see room mode
        try {
            await connectVideo(roomId);
        } catch (err) {
            // Video connection failed - room mode still works
            console.warn('[Commons] Video connection failed, continuing in demo mode');
        }
    };

    /**
     * Handle joining by code
     * Same security model as handleJoinRoom
     */
    const handleJoinByCode = async () => {
        if (roomCode.trim()) {
            setIsJoinModalOpen(false);
            const customRoom = { id: 'custom', name: `Room ${roomCode}`, currentTask: 'Study Session', participants: 1 };
            const code = roomCode.trim();
            setRoomCode('');

            // Enter room mode in-place FIRST
            setActiveRoom(customRoom);

            // THEN attempt video connection (best-effort)
            try {
                await connectVideo(`room-custom-${code}`);
            } catch (err) {
                console.warn('[Commons] Video connection failed, continuing in demo mode');
            }
        }
    };

    /**
     * Handle leaving a room
     * Disconnects from video and cleans up resources
     */
    const handleLeaveRoom = () => {
        // Disconnect from video (cleans up credentials and resets state)
        disconnectVideo();

        // Reset local UI state
        setActiveRoom(null);
    };

    /**
     * Handle creating a new study room
     * Generates a unique room ID and enters room mode
     */
    const handleCreateRoom = async () => {
        // Generate a unique room ID
        const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const newRoom = {
            id: roomId,
            name: 'New Study Room',
            currentTask: 'Study Session',
            participants: 1
        };

        // Enter room mode in-place FIRST
        setActiveRoom(newRoom);

        // THEN attempt video connection (best-effort)
        try {
            await connectVideo(roomId);
        } catch (err) {
            console.warn('[Commons] Video connection failed, continuing in demo mode');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            padding: '2rem',
            position: 'relative'
        }}>
            {/* Header: Conditional based on room mode */}
            {activeRoom ? (
                /* Room Mode Header with Participant Avatars */
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    padding: '1rem 1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    {/* Room Name */}
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        {activeRoom.name}
                    </h1>

                    {/* Join Code - shareable room code */}
                    {joinCode && (
                        <div
                            onClick={() => {
                                navigator.clipboard.writeText(joinCode);
                                alert('Room code copied!');
                            }}
                            style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                            title="Click to copy room code"
                        >
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code:</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.1em' }}>
                                {joinCode}
                            </span>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        {participants.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    position: 'relative'
                                }}
                            >
                                {/* Avatar Circle */}
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: p.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        boxShadow: p.isSpeaking
                                            ? `0 0 0 3px var(--bg-card), 0 0 0 5px #10B981`
                                            : 'none',
                                        transition: 'box-shadow 0.2s ease',
                                        cursor: p.isMe ? 'pointer' : 'default'
                                    }}
                                    title={p.name}
                                >
                                    {p.initials}
                                </div>
                                {/* Name Label */}
                                <span style={{
                                    fontSize: '0.625rem',
                                    color: 'var(--text-muted)',
                                    maxWidth: '50px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {p.isMe ? 'You' : p.name.split(' ')[0]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Leave Button */}
                    <button
                        onClick={handleLeaveRoom}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                    >
                        Leave
                    </button>
                </div>
            ) : (
                /* Lobby Mode Header */
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        The Commons
                    </h1>

                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center'
                    }}>
                        {/* Join by Code Search Bar */}
                        <div
                            onClick={() => setIsJoinModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(8px)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.borderColor = 'var(--primary-500)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                        >
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Join:</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>[Code]</span>
                            <ArrowRight size={16} color="var(--text-muted)" />
                        </div>

                        {/* Create Study Room Button */}
                        <button
                            onClick={handleCreateRoom}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#3B82F6',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
                        >
                            <Plus size={18} />
                            Create Study Room
                        </button>
                    </div>
                </div>
            )}

            {/* Join Modal */}
            {isJoinModalOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsJoinModalOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 1000
                        }}
                    />

                    {/* Modal */}
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        width: '90%',
                        maxWidth: '400px',
                        zIndex: 1001,
                        boxShadow: 'var(--shadow-modal)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {/* Close Button */}
                        <button
                            onClick={() => setIsJoinModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '0.25rem'
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Modal Title */}
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            Join Study Room
                        </h2>

                        {/* Room Code Label */}
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '0.5rem'
                        }}>
                            Room Code
                        </label>

                        {/* Room Code Input */}
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
                            placeholder="ABC-123"
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                fontSize: '1rem',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem',
                                outline: 'none',
                                transition: 'border-color 0.2s ease',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                        />

                        {/* Join Room Button */}
                        <button
                            onClick={handleJoinByCode}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                backgroundColor: 'var(--primary-600)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-700)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-600)'}
                        >
                            Join Room
                        </button>
                    </div>
                </>
            )}

            {/* Main Content: Conditional Room Mode or Lobby */}
            {activeRoom ? (
                /* Room Mode: Shared Materials Area */
                <div style={{
                    flex: 1,
                    position: 'relative',
                    minHeight: '60vh'
                }}>
                    {/* Video Grid - shows all participants */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: participants.length <= 2
                            ? 'repeat(auto-fit, minmax(400px, 1fr))'
                            : 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1rem',
                        padding: '1rem',
                        minHeight: '50vh',
                    }}>
                        {participants.map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    aspectRatio: '16/9',
                                    backgroundColor: 'var(--neutral-800)',
                                    borderRadius: 'var(--radius-lg)',
                                    border: p.isSpeaking
                                        ? '3px solid #10B981'
                                        : '1px solid var(--border-subtle)',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Video or Avatar */}
                                {p.hasCamera && (p.isMe ? localVideoStream : p.videoStream) ? (
                                    <video
                                        autoPlay
                                        playsInline
                                        muted={p.isMe}
                                        ref={(el) => {
                                            if (el) {
                                                if (p.isMe && localVideoStream) {
                                                    el.srcObject = localVideoStream;
                                                } else if (!p.isMe && p.videoStream) {
                                                    el.srcObject = p.videoStream;
                                                }
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transform: p.isMe ? 'scaleX(-1)' : 'none',
                                        }}
                                    />
                                ) : (
                                    /* Avatar fallback when camera is off */
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        backgroundColor: p.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#FFFFFF',
                                        fontSize: '1.5rem',
                                        fontWeight: 600,
                                    }}>
                                        {p.initials}
                                    </div>
                                )}

                                {/* Name overlay */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0.5rem',
                                    left: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: '#FFFFFF',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                }}>
                                    {p.isMe ? 'You' : p.name}
                                </div>

                                {/* Mic indicator */}
                                {!p.isMe && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '0.5rem',
                                        right: '0.5rem',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        {p.isSpeaking ? (
                                            <Mic size={14} color="#10B981" />
                                        ) : (
                                            <MicOff size={14} color="#EF4444" />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Empty state when no participants */}
                        {participants.length === 0 && (
                            <div style={{
                                gridColumn: '1 / -1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '3rem',
                                color: 'var(--text-muted)',
                            }}>
                                <Users size={48} strokeWidth={1} />
                                <p style={{ marginTop: '1rem' }}>Waiting for participants to join...</p>
                                {joinCode && (
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                                        Share code: <strong style={{ color: 'var(--primary)' }}>{joinCode}</strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Floating Video Tile (shows local camera when on) */}
                    {isCameraOn && (
                        <div style={{
                            position: 'absolute',
                            bottom: '1rem',
                            right: '1rem',
                            width: '200px',
                            height: '150px',
                            backgroundColor: 'var(--neutral-800)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            overflow: 'hidden',
                            border: '2px solid var(--bg-card)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Local Video Element */}
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scaleX(-1)', // Mirror for selfie view
                                }}
                            />
                            {/* Close button */}
                            <button
                                onClick={toggleCamera}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                                title="Turn off camera"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {/* Mic Toggle */}
                        <button
                            onClick={toggleMic}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: isMicOn ? '#10B981' : 'var(--bg-secondary)',
                                color: isMicOn ? '#FFFFFF' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            title={isMicOn ? 'Mute' : 'Unmute'}
                        >
                            {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>

                        {/* Camera Toggle */}
                        <button
                            onClick={toggleCamera}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: isCameraOn ? '#3B82F6' : 'var(--bg-secondary)',
                                color: isCameraOn ? '#FFFFFF' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                        </button>

                        {/* Screen Share Toggle */}
                        <button
                            onClick={toggleScreenShare}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                backgroundColor: isScreenSharing ? '#8B5CF6' : 'var(--bg-secondary)',
                                color: isScreenSharing ? '#FFFFFF' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                        >
                            <Monitor size={18} />
                        </button>
                    </div>
                </div >
            ) : (
                /* Lobby Mode: Room Grid + Sidebar */
                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    position: 'relative'
                }}>
                    {/* Room Grid (Left) */}
                    <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        alignContent: 'start'
                    }}>
                        {studyRooms.map((room) => (
                            <div
                                key={room.id}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                            >
                                {/* Room Name */}
                                <h3 style={{
                                    fontSize: '1.125rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    {room.name}
                                </h3>

                                {/* FR-44: Task Sync - Current Task */}
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-muted)',
                                    marginBottom: '1rem'
                                }}>
                                    Currently: {room.currentTask}
                                </p>

                                {/* Participants + Join Button */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.875rem'
                                    }}>
                                        <Users size={16} />
                                        <span>{room.participants} participants</span>
                                    </div>

                                    <button
                                        onClick={() => handleJoinRoom(room)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'var(--text-secondary)',
                                            color: 'var(--bg-card)',
                                            border: 'none',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--text-primary)'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--text-secondary)'}
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Floating Sidebar (Right) */}
                    <div style={{
                        width: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {/* Community Stats Card */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '1rem'
                            }}>
                                Community Stats
                            </h2>

                            {/* Collective Achievement (White Hat) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <Clock size={20} color="var(--text-muted)" />
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Together: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1,247 hours</span>
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Users size={20} color="var(--text-muted)" />
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Active learners: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>234</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Your Path Card (FR-45, FR-46) */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h2 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '1rem'
                            }}>
                                Your Path
                            </h2>

                            {/* FR-45: XP (Contribution-based, White Hat) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🌱</span>
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Contributions: <span style={{ fontWeight: 600, color: '#10B981' }}>125 points</span>
                                    </p>
                                </div>
                            </div>

                            {/* FR-45: League (Narrative, opt-in) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Guild: <span style={{ fontWeight: 600, color: '#3B82F6' }}>Explorers</span>
                                    </p>
                                </div>
                            </div>

                            {/* FR-46: Streak (Continuity framing, White Hat) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>🔥</span>
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Streak: <span style={{ fontWeight: 600, color: '#F59E0B' }}>12 days</span>
                                    </p>
                                </div>
                            </div>

                            {/* FR-46: Streak Preservation (Care/support tone) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Shield size={20} color="var(--text-muted)" />
                                <div>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        Shield available
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FR-47: Shared Playlist Widget (Bottom-Right) - Only show in lobby mode */}
            {
                !activeRoom && (
                    <div style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '280px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.25rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                    }}>
                        {/* Album Art Placeholder */}
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Music size={24} color="var(--text-muted)" />
                        </div>

                        <h3 style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem'
                        }}>
                            Shared Playlist
                        </h3>

                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.75rem'
                        }}>
                            Earned by community
                        </p>

                        {/* Progress Bar */}
                        <div style={{
                            width: '100%',
                            height: '4px',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: '2px',
                            marginBottom: '0.75rem',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '45%',
                                height: '100%',
                                backgroundColor: 'var(--accent-primary)'
                            }} />
                        </div>

                        {/* Playback Controls */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem'
                        }}>
                            <button style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}>
                                <SkipBack size={20} />
                            </button>

                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    padding: '0.25rem'
                                }}
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>

                            <button style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.25rem'
                            }}>
                                <SkipForward size={20} />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Commons;
