import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import '../styles/terrascope.css';

const AuthModal = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register } = useAuth();

  const [mode, setMode] = useState(authModalMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('analyst');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Sync mode with context
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMsg(null);
  }, [authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          organization: organization || 'Terrascope Environmental Observatory',
          role,
        });
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const detail = err?.response?.data?.detail || err.message || 'Authentication failed. Please verify your credentials.';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'Demo login failed';
      setErrorMsg(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 35, 30, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'tsFadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="ts-card-interactive"
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid var(--ts-border)',
          boxShadow: '0 24px 64px rgba(16, 59, 50, 0.22)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header with Terrascope Logo and Close */}
        <div
          style={{
            background: 'linear-gradient(135deg, #103B32 0%, #154D41 100%)',
            color: '#FFFFFF',
            padding: '24px 28px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={closeAuthModal}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'var(--ts-mint)',
                color: 'var(--ts-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              T
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.3 }}>TERRASCOPE EARTH ENGINE</div>
              <div style={{ fontSize: 11, color: 'var(--ts-mint)', fontFamily: 'var(--font-mono)' }}>
                Cloud Security &amp; Authorization Gateway
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 10,
              padding: 3,
              marginTop: 14,
            }}
          >
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: mode === 'login' ? '#FFFFFF' : 'transparent',
                color: mode === 'login' ? 'var(--ts-forest)' : '#E2E8E5',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: mode === 'register' ? '#FFFFFF' : 'transparent',
                color: mode === 'register' ? 'var(--ts-forest)' : '#E2E8E5',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#991B1B',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--ts-forest)', marginBottom: 5 }}>
                    FULL NAME
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ts-text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Goodall"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: '1px solid var(--ts-border)',
                        borderRadius: 8,
                        fontSize: 13,
                        outline: 'none',
                        background: '#FAFBF9',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--ts-forest)', marginBottom: 5 }}>
                    ORGANIZATION / INSTITUTION
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ts-text-muted)' }} />
                    <input
                      type="text"
                      placeholder="e.g. National Remote Sensing Centre"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: '1px solid var(--ts-border)',
                        borderRadius: 8,
                        fontSize: 13,
                        outline: 'none',
                        background: '#FAFBF9',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--ts-forest)', marginBottom: 5 }}>
                    ACCESS ROLE (RBAC)
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--ts-border)',
                      borderRadius: 8,
                      fontSize: 13,
                      background: '#FAFBF9',
                      color: 'var(--ts-forest)',
                      fontWeight: 600,
                    }}
                  >
                    <option value="analyst">Senior Geospatial Analyst (Full Analytics &amp; Reports)</option>
                    <option value="researcher">Field Researcher (Observations &amp; Time Series)</option>
                    <option value="viewer">Public Viewer (Read-only)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--ts-forest)', marginBottom: 5 }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ts-text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="analyst@terrascope.earth"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid var(--ts-border)',
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none',
                    background: '#FAFBF9',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--ts-forest)', marginBottom: 5 }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--ts-text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: '1px solid var(--ts-border)',
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none',
                    background: '#FAFBF9',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 6,
                padding: '12px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--ts-forest)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(16, 59, 50, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isSubmitting ? 'Authenticating with Cloud DB...' : mode === 'login' ? 'Sign In to Terrascope' : 'Create Cloud Account'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Accounts Bar */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid var(--ts-border)',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: 'var(--ts-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sparkles size={12} style={{ color: 'var(--ts-emerald)' }} />
              <span>One-Click Cloud Demo Accounts</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@terrascope.earth', 'TerrascopeAdmin2026!')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: '1px solid var(--ts-border)',
                  background: 'var(--ts-bg-subtle)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ts-forest)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div>👑 Administrator</div>
                <div style={{ fontSize: 9, color: 'var(--ts-text-muted)', marginTop: 2 }}>Full Control</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('analyst@terrascope.earth', 'TerrascopeAnalyst2026!')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: '1px solid var(--ts-border)',
                  background: 'var(--ts-bg-subtle)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ts-forest)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div>📊 Senior Analyst</div>
                <div style={{ fontSize: 9, color: 'var(--ts-text-muted)', marginTop: 2 }}>Marcus Thorne</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('researcher@terrascope.earth', 'TerrascopeResearch2026!')}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: '1px solid var(--ts-border)',
                  background: 'var(--ts-bg-subtle)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ts-forest)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div>🔬 Researcher</div>
                <div style={{ fontSize: 9, color: 'var(--ts-text-muted)', marginTop: 2 }}>Dr. Maya Lin</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer with Security Note */}
        <div
          style={{
            background: '#F6F8F5',
            padding: '12px 24px',
            borderTop: '1px solid var(--ts-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--ts-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={13} style={{ color: 'var(--ts-emerald)' }} />
            <span>256-bit JWT Cryptographic Authentication</span>
          </div>
          <div>PostgreSQL / Cloud DB</div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
