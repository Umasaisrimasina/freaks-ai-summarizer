import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Users, Flame, Clock, Calendar, Beaker, Search, FileText, Layers, Zap, X } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const profileMenuRef = useRef(null);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu]);

    // FR-41: Progress data
    const todaysGoal = 75; // percentage
    const streakDays = 12;
    const weeklyActivity = [3, 5, 2, 4, 5, 1, 0]; // Mon-Sun intensity (0-5)

    // FR-42: Calendar-synced agenda
    const upNextTasks = [
        { id: 1, title: 'Advanced Algorithms: Graph Theory', subject: 'Computer Science', time: 'Today 2:00 PM', urgent: true },
        { id: 2, title: 'Cognitive Psychology Notes', subject: 'Psychology 101', time: 'Tomorrow', urgent: false },
        { id: 3, title: 'System Design Interview Prep', subject: 'Career', time: 'Friday', urgent: false },
    ];

    // FR-56: Experimental features
    const experimentalFeatures = [
        { id: 1, name: 'AI Concept Maps', description: 'Visual knowledge graphs' },
        { id: 2, name: 'Socratic Tutor', description: 'Guided questioning mode' },
    ];

    return (
        <div className="dashboard-container" style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '2rem',
            position: 'relative'
        }}>
            {/* FR-02: User Avatar (top-right) */}
            <div
                ref={profileMenuRef}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem'
                }}>
                <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2px solid var(--border-subtle)',
                        backgroundColor: 'var(--neutral-200)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        overflow: 'hidden'
                    }}
                >
                    <img
                        src="/images/icons/avatar.jpg"
                        alt="Profile"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </button>
                {showProfileMenu && (
                    <div style={{
                        position: 'absolute',
                        top: '50px',
                        right: 0,
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-modal)',
                        padding: '0.5rem',
                        minWidth: '180px',
                        zIndex: 100
                    }}>
                        <button
                            onClick={() => {
                                setShowProfileMenu(false);
                                navigate('/profile-settings');
                            }}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                textAlign: 'left',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: 'var(--text-body)',
                                color: 'var(--text-primary)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Profile Settings
                        </button>
                        <button style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--text-body)',
                            color: 'var(--text-primary)'
                        }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {/* Hero Section - Primary CTA */}
            <section style={{
                textAlign: 'center',
                padding: '4rem 2rem 3rem',
                marginBottom: '3rem'
            }}>
                <h1 style={{
                    fontSize: 'var(--text-h1)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '2.5rem',
                    letterSpacing: '-0.02em'
                }}>
                    Welcome back, Alex
                </h1>

                {/* Primary CTA - Only colored element */}
                <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/study-arena')}
                    style={{
                        fontSize: '1.25rem',
                        padding: '1.25rem 3rem',
                        marginBottom: '1rem'
                    }}
                >
                    <Play fill="currentColor" size={20} />
                    Start Study Session
                </button>

                {/* Secondary Actions */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/knowledge-lab')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={18} />
                        Add Study Material
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/commons')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Users size={18} />
                        Join Study Room
                    </button>
                </div>

                {/* Search Bar */}
                <div
                    onClick={() => setIsCommandPaletteOpen(true)}
                    style={{
                        maxWidth: '500px',
                        margin: '0 auto',
                        padding: '0.875rem 1.25rem',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                >
                    <Search size={18} color="var(--text-muted)" />
                    <span style={{
                        flex: 1,
                        color: 'var(--text-muted)',
                        fontSize: 'var(--text-body)'
                    }}>
                        Search notes, topics...
                    </span>
                    <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace'
                    }}>
                        ⌘K
                    </span>
                </div>
            </section>

            {/* Command Palette Modal - Portal to body for full-screen blur */}
            {isCommandPaletteOpen && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsCommandPaletteOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            zIndex: 9999
                        }}
                    />

                    {/* Modal */}
                    <div style={{
                        position: 'fixed',
                        top: '20%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        width: '90%',
                        maxWidth: '600px',
                        zIndex: 10000,
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {/* Search Input */}
                        <div style={{
                            padding: '1rem',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <Search size={20} color="var(--text-muted)" />
                            <input
                                type="text"
                                placeholder="Type to search or enter command..."
                                autoFocus
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: 'var(--text-body)',
                                    backgroundColor: 'transparent',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <button
                                onClick={() => setIsCommandPaletteOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    padding: '0.25rem'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Command Options */}
                        <div style={{ padding: '0.5rem' }}>
                            {/* Go to Biology Notes */}
                            <div
                                onClick={() => {
                                    setIsCommandPaletteOpen(false);
                                    navigate('/knowledge-lab');
                                }}
                                style={{
                                    padding: '0.875rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <FileText size={18} color="var(--text-muted)" />
                                <span style={{
                                    flex: 1,
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--text-body)'
                                }}>
                                    Go to: Biology Notes
                                </span>
                            </div>

                            {/* Create New Flashcard Deck */}
                            <div
                                onClick={() => {
                                    setIsCommandPaletteOpen(false);
                                    navigate('/knowledge-lab');
                                }}
                                style={{
                                    padding: '0.875rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Layers size={18} color="var(--text-muted)" />
                                <span style={{
                                    flex: 1,
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--text-body)'
                                }}>
                                    Create: New Flashcard Deck
                                </span>
                            </div>

                            {/* Start Focus Session */}
                            <div
                                onClick={() => {
                                    setIsCommandPaletteOpen(false);
                                    navigate('/study-arena');
                                }}
                                style={{
                                    padding: '0.875rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Zap size={18} color="var(--text-muted)" />
                                <span style={{
                                    flex: 1,
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--text-body)'
                                }}>
                                    Action: Start Focus Session
                                </span>
                            </div>
                        </div>
                    </div>
                </>, document.body
            )}

            {/* FR-41: Progress Dashboard - Metrics Grid */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {/* Today's Goal - Circular Progress */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '0.75rem'
                    }}>
                        <svg width="80" height="80" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="var(--neutral-200)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="var(--primary-600)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${todaysGoal * 2.51} 251`}
                                transform="rotate(-90 50 50)"
                            />
                            <text
                                x="50" y="50"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="var(--text-primary)"
                                fontSize="20"
                                fontWeight="600"
                            >
                                {todaysGoal}%
                            </text>
                        </svg>
                    </div>
                    <div style={{
                        fontSize: 'var(--text-small)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                    }}>
                        Today's Goal
                    </div>
                    <div style={{
                        fontSize: 'var(--text-small)',
                        color: 'var(--text-muted)',
                        marginTop: '0.25rem'
                    }}>
                        3/4 tasks done
                    </div>
                </div>

                {/* Streak Indicator */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '2.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        <Flame size={48} color="#F59E0B" fill="#F59E0B" />
                    </div>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem'
                    }}>
                        {streakDays}
                    </div>
                    <div style={{
                        fontSize: 'var(--text-small)',
                        color: 'var(--text-secondary)'
                    }}>
                        day streak
                    </div>
                </div>

                {/* Monthly Activity Heatmap */}
                <div style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{
                        fontSize: 'var(--text-small)',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem',
                        textAlign: 'center'
                    }}>
                        This Month
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '4px'
                    }}>
                        {(() => {
                            // Generate 30 days of activity data (0-5 intensity)
                            const monthlyActivity = [
                                3, 5, 2, 4, 5, 1,
                                0, 3, 4, 5, 2, 3,
                                4, 1, 5, 3, 2, 4,
                                5, 3, 1, 4, 5, 2,
                                3, 4, 5, 1, 0, 2
                            ];

                            // Color mapping with better contrast
                            const getActivityColor = (intensity) => {
                                if (intensity === 0) return '#E5E7EB'; // Light gray (no activity)
                                if (intensity <= 1) return '#BFDBFE'; // Light blue
                                if (intensity <= 2) return '#93C5FD'; // Medium-light blue
                                if (intensity <= 3) return '#60A5FA'; // Medium blue
                                if (intensity <= 4) return '#3B82F6'; // Strong blue
                                return '#2563EB'; // Deep blue (max activity)
                            };

                            return monthlyActivity.map((intensity, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: '100%',
                                        height: '20px',
                                        borderRadius: '3px',
                                        backgroundColor: getActivityColor(intensity),
                                        border: '1px solid rgba(0, 0, 0, 0.08)',
                                        transition: 'transform 0.15s ease'
                                    }}
                                    title={`Day ${i + 1}: ${intensity > 0 ? `${intensity} sessions` : 'No activity'}`}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            ));
                        })()}
                    </div>
                    <div style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontSize: '0.625rem',
                        color: 'var(--text-muted)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#E5E7EB', border: '1px solid rgba(0, 0, 0, 0.08)' }} />
                            <span>Less</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#2563EB', border: '1px solid rgba(0, 0, 0, 0.08)' }} />
                            <span>More</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FR-42: Calendar Integration - Up Next Agenda */}
            <section style={{
                backgroundColor: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '2rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <Calendar size={20} color="var(--text-secondary)" />
                    <h2 style={{
                        fontSize: 'var(--text-body)',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>
                        Up Next
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {upNextTasks.map((task) => (
                        <div
                            key={task.id}
                            style={{
                                padding: '1rem',
                                backgroundColor: task.urgent ? 'var(--accent-light)' : 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: task.urgent ? '3px solid var(--accent-primary)' : 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '0.25rem'
                            }}>
                                <div style={{
                                    fontSize: 'var(--text-body)',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)'
                                }}>
                                    {task.title}
                                </div>
                                <div style={{
                                    fontSize: 'var(--text-small)',
                                    color: task.urgent ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    fontWeight: task.urgent ? 600 : 400
                                }}>
                                    {task.time}
                                </div>
                            </div>
                            <div style={{
                                fontSize: 'var(--text-small)',
                                color: 'var(--text-secondary)'
                            }}>
                                {task.subject}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FR-56: Experimental Section (De-emphasized) */}
            <section style={{
                padding: '1.5rem',
                textAlign: 'center',
                opacity: 0.6,
                transition: 'opacity 0.2s ease'
            }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                }}>
                    <Beaker size={16} color="var(--text-muted)" />
                    <h3 style={{
                        fontSize: 'var(--text-small)',
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Labs
                    </h3>
                </div>
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {experimentalFeatures.map((feature) => (
                        <button
                            key={feature.id}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: 'transparent',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-small)',
                                color: 'var(--text-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                e.currentTarget.style.borderColor = 'var(--text-muted)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }}
                        >
                            {feature.name}
                        </button>
                    ))}
                </div>
            </section>
        </div >
    );
};

export default Dashboard;
