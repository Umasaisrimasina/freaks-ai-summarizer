import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, BookOpen, BrainCircuit, Users, Sun, Moon, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const RootLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [theme, setTheme] = useState('light');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/' },
    { icon: BookOpen, label: 'Knowledge Lab', path: '/knowledge-lab' },
    { icon: BrainCircuit, label: 'Study Arena', path: '/study-arena' },
    { icon: Users, label: 'Commons', path: '/commons' },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside style={{
        width: isSidebarCollapsed ? '72px' : '280px',
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        padding: isSidebarCollapsed ? '2rem 0.75rem' : '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.3s ease, padding 0.3s ease, background-color 0.3s ease, border-color 0.3s ease',
        position: 'relative'
      }}>
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: 'var(--shadow-soft)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
          }}
        >
          {isSidebarCollapsed ?
            <ChevronRight size={14} color="var(--text-secondary)" /> :
            <ChevronLeft size={14} color="var(--text-secondary)" />
          }
        </button>

        <div>
          <div style={{
            marginBottom: '3rem',
            paddingLeft: isSidebarCollapsed ? '0' : '0.75rem',
            textAlign: isSidebarCollapsed ? 'center' : 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '0.5rem'
          }}>
            {isSidebarCollapsed ? (
              <img
                src="/chronos logo.jpg"
                alt="Chronos"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <>
                <img
                  src="/chronos logo.jpg"
                  alt="Chronos"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover'
                  }}
                />
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  Chronos
                </h1>
              </>
            )}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isSidebarCollapsed ? item.label : ''}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    padding: isSidebarCollapsed ? '0.75rem' : '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                    fontWeight: isActive ? 500 : 400,
                    boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* User Info */}
          {currentUser && !isSidebarCollapsed && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem'
            }}>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {currentUser.displayName || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                {currentUser.email}
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isSidebarCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: '0.75rem',
              padding: isSidebarCollapsed ? '0.75rem' : '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              width: '100%',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
            {!isSidebarCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              try {
                await logout();
                navigate('/login');
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            title={isSidebarCollapsed ? 'Logout' : ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: '0.75rem',
              padding: isSidebarCollapsed ? '0.75rem' : '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              width: '100%',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.color = '#DC2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut size={20} strokeWidth={1.5} />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;

