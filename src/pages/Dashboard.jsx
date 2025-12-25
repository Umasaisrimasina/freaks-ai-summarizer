import React from 'react';
import { Play, ArrowRight, CheckCircle2, Flame, Clock, MoreHorizontal } from 'lucide-react';

const Dashboard = () => {
    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '2rem' }}>

            {/* Header / Date - Optional Context */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dashboard</h1>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Tuesday, Oct 24</span>
            </header>

            {/* Hero Card */}
            <section style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border-subtle)'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '1rem',
                        letterSpacing: '-0.02em'
                    }}>
                        Good morning, Alex.
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                        Ready to focus and achieve your goals?
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                            <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="30" cy="30" r="26" stroke="var(--border-subtle)" strokeWidth="6" fill="none" />
                                <circle cx="30" cy="30" r="26" stroke="var(--accent-primary)" strokeWidth="6" fill="none" strokeDasharray="163" strokeDashoffset="40" strokeLinecap="round" />
                            </svg>
                            <span style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>
                                75%
                            </span>
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Today's Goal</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>6/8 hours studied</p>
                        </div>
                    </div>
                </div>

                <button style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-text)',
                    padding: '1rem 2.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: 'var(--shadow-soft)',
                    transition: 'transform 0.2s ease',
                    height: 'fit-content'
                }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <Play fill="currentColor" size={18} />
                    Start Study Session
                </button>
            </section>

            {/* Metrics Grid */}
            <section style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2rem',
                marginBottom: '2rem'
            }}>
                <MetricCard icon={Flame} label="Current Streak" value="12 Days" subtext="Personal Best: 14 days" accentColor="#F59E0B" />
                <MetricCard icon={CheckCircle2} label="Tasks Today" value="5/8" subtext="62.5% Completed" accentColor="#10B981" />
                <MetricCard icon={Clock} label="Focus Time" value="1.5h" subtext="+20m vs yesterday" accentColor="#3B82F6" />
            </section>

            {/* Up Next / Tasks Card */}
            <section style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid var(--border-subtle)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Upcoming Tasks</h3>
                    <button style={{ color: 'var(--text-muted)' }}><MoreHorizontal size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <TaskItem
                        title="Advanced Algorithms: Graph Theory"
                        meta="Computer Science"
                        due="Today"
                        active
                    />
                    <TaskItem
                        title="Cognitive Psychology Notes"
                        meta="Psychology 101"
                        due="Tomorrow"
                    />
                    <TaskItem
                        title="System Design Interview Prep"
                        meta="Career"
                        due="Fri"
                    />
                    <TaskItem
                        title="Read: Chapter 5 - Modern History"
                        meta="History"
                        due="Fri"
                    />
                </div>
            </section>
        </div>
    );
};

const MetricCard = ({ icon: Icon, label, value, subtext, accentColor }) => (
    <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-soft)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
            <Icon size={20} color={accentColor} />
        </div>
        <div>
            <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{subtext}</div>
        </div>
    </div>
);

const TaskItem = ({ title, meta, due, active }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem 1.5rem',
        backgroundColor: active ? 'var(--bg-secondary)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        border: '1px solid transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
    }}
        onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }}
        onMouseOut={(e) => {
            if (!active) {
                e.currentTarget.style.backgroundColor = 'transparent';
            }
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid var(--border-subtle)'
            }} />
            <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{meta}</p>
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
                fontSize: '0.85rem',
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: active ? 600 : 400
            }}>
                {due}
            </span>
        </div>
    </div>
);

export default Dashboard;
