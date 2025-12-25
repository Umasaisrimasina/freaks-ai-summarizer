import React from 'react';
import { Users, Radio, Flame, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Commons = () => {
    const navigate = useNavigate();

    // Mock data
    const featuredSession = {
        name: 'Deep Focus | Algorithms',
        host: 'Sarah M.',
        participants: 4,
        maxParticipants: 6,
        isLive: true
    };

    const onlineFriends = [
        { name: 'Alex', initial: 'A', color: '#3B82F6' },
        { name: 'Jordan', initial: 'J', color: '#10B981' },
        { name: 'Sam', initial: 'S', color: '#F59E0B' },
    ];

    const userStreak = 7;

    return (
        <div className="animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            position: 'relative',
            padding: '2rem',
            textAlign: 'center'
        }}>

            {/* Streak Badge - Top Right Corner */}
            <div style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
            }}>
                <Flame size={16} color="#F59E0B" />
                <span>{userStreak} day streak</span>
            </div>

            {/* Create Session - Top Left */}
            <button
                style={{
                    position: 'absolute',
                    top: '1.5rem',
                    left: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                }}
            >
                <Plus size={16} />
                Create Room
            </button>

            {/* Main Content - Single Featured Session */}
            <div style={{ maxWidth: '500px', width: '100%' }}>

                {/* Title */}
                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                }}>
                    Study Together
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                    Join an active session or start your own.
                </p>

                {/* Featured Session Card */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    boxShadow: 'var(--shadow-hover)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '3rem'
                }}>
                    {/* Live Indicator */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '50px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginBottom: '1.5rem'
                    }}>
                        <Radio size={12} />
                        LIVE NOW
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.75rem'
                    }}>
                        {featuredSession.name}
                    </h2>

                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Hosted by <strong style={{ color: 'var(--text-primary)' }}>{featuredSession.host}</strong>
                    </p>

                    {/* Participants */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '2rem'
                    }}>
                        <Users size={18} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {featuredSession.participants}/{featuredSession.maxParticipants} studying
                        </span>
                    </div>

                    {/* Join Button */}
                    <button
                        onClick={() => navigate('/study-arena')}
                        style={{
                            width: '100%',
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'var(--accent-text)',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-soft)',
                            transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        Join Session
                    </button>
                </div>

                {/* Online Friends - Minimal Presence */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem'
                }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Friends online:</span>
                    <div style={{ display: 'flex', gap: '-0.5rem' }}>
                        {onlineFriends.map((friend, index) => (
                            <div
                                key={friend.name}
                                style={{
                                    position: 'relative',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: friend.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    marginLeft: index > 0 ? '-8px' : '0',
                                    border: '2px solid var(--bg-primary)',
                                    zIndex: onlineFriends.length - index
                                }}
                                title={friend.name}
                            >
                                {friend.initial}
                                {/* Green Presence Dot */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#22C55E',
                                    border: '2px solid var(--bg-primary)'
                                }} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Commons;
