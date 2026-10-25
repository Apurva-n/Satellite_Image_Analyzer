import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  FileText,
  Database,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import '../styles/terrascope.css';

const UserNavMenu = ({ showDbBadge = false }) => {
  const {
    user,
    isAuthenticated,
    role,
    dbStatus,
    cloudReportsCount,
    logout,
    openAuthModal,
    openReportsDrawer,
    openDbModal,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Optional Cloud Database Ping Badge (only when explicitly requested) */}
      {showDbBadge && (
        <button
          type="button"
          onClick={openDbModal}
          title="View Cloud Database status & telemetry"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ts-forest)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: dbStatus?.status === 'connected' ? '#10B981' : '#F59E0B',
              boxShadow: '0 0 6px #10B981',
            }}
          />
          <span>{dbStatus?.cloud_enabled ? 'Cloud PostgreSQL' : 'Cloud DB'}</span>
          {dbStatus?.latency_ms !== undefined && (
            <span style={{ fontSize: 9.5, color: 'var(--ts-text-muted)' }}>({dbStatus.latency_ms}ms)</span>
          )}
        </button>
      )}

      {/* User Session or Login Button */}
      {isAuthenticated ? (
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFFFFF',
              border: '1px solid var(--ts-border)',
              borderRadius: 24,
              padding: '3px 12px 3px 4px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 59, 50, 0.05)',
              transition: 'all 0.15s ease',
            }}
          >
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}&backgroundColor=103B32,22C55E`}
              alt={user.full_name}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--ts-border)',
              }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ts-forest)' }}>
                {user.full_name.split(' ')[0]}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: role === 'admin' ? '#991B1B' : 'var(--ts-emerald)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                {role}
              </div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--ts-text-muted)' }} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 260,
                background: '#FFFFFF',
                borderRadius: 14,
                border: '1px solid var(--ts-border)',
                boxShadow: '0 12px 36px rgba(16, 59, 50, 0.15)',
                padding: '8px 0',
                zIndex: 9999,
                animation: 'tsFadeIn 0.15s ease-out',
              }}
            >
              {/* User Bio Header */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--ts-border)', background: 'var(--ts-bg-subtle)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ts-forest)' }}>{user.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>{user.email}</div>
                <div style={{ fontSize: 10.5, color: 'var(--ts-text-secondary)', marginTop: 3 }}>{user.organization}</div>
              </div>

              {/* Menu Actions */}
              <div style={{ padding: '6px 8px' }}>
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); openReportsDrawer(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--ts-forest)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ts-bg-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={15} style={{ color: 'var(--ts-emerald)' }} />
                    <span>My Cloud Reports</span>
                  </span>
                  <span
                    style={{
                      background: 'var(--ts-mint)',
                      color: 'var(--ts-forest)',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {cloudReportsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setIsOpen(false); openDbModal(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--ts-forest)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--ts-bg-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Database size={15} style={{ color: 'var(--ts-emerald)' }} />
                  <span>Cloud Database Telemetry</span>
                </button>
              </div>

              {/* Sign Out */}
              <div style={{ borderTop: '1px solid var(--ts-border)', padding: '6px 8px 0 8px' }}>
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); logout(); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#DC2626',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 8,
            border: '1px solid var(--ts-border)',
            background: '#FFFFFF',
            color: 'var(--ts-forest)',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--ts-forest)';
            e.currentTarget.style.background = 'var(--ts-bg-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--ts-border)';
            e.currentTarget.style.background = '#FFFFFF';
          }}
        >
          <LogIn size={13} />
          <span>Sign In</span>
        </button>
      )}
    </div>
  );
};

export default UserNavMenu;
