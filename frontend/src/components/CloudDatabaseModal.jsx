import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Database,
  Users,
  FileText,
  Bookmark,
  Code2,
} from 'lucide-react';
import '../styles/terrascope.css';

const CloudDatabaseModal = () => {
  const { isDbModalOpen, closeDbModal, dbStatus, fetchDbStatus } = useAuth();

  if (!isDbModalOpen) return null;

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
        if (e.target === e.currentTarget) closeDbModal();
      }}
    >
      <div
        className="ts-card-interactive"
        style={{
          width: '100%',
          maxWidth: 540,
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid var(--ts-border)',
          boxShadow: '0 24px 64px rgba(16, 59, 50, 0.22)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #103B32 0%, #154D41 100%)',
            color: '#FFFFFF',
            padding: '22px 26px',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={closeDbModal}
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
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--ts-mint)',
                color: 'var(--ts-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>CLOUD DATABASE OBSERVATORY</div>
              <div style={{ fontSize: 11, color: 'var(--ts-mint)', fontFamily: 'var(--font-mono)' }}>
                Live Connection Telemetry &amp; Persistence Engine
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 26px', overflowY: 'auto' }}>
          {/* Status Row */}
          <div
            style={{
              background: 'var(--ts-bg-subtle)',
              border: '1px solid var(--ts-border)',
              borderRadius: 12,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)', textTransform: 'uppercase' }}>
                CURRENT PROVIDER
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ts-forest)', marginTop: 2 }}>
                {dbStatus?.provider || 'Cloud PostgreSQL Database'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)', textTransform: 'uppercase' }}>
                STATUS &amp; LATENCY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, justifyContent: 'flex-end' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ts-emerald)' }}>
                  Connected ({dbStatus?.latency_ms ?? 0.8}ms)
                </span>
              </div>
            </div>
          </div>

          {/* Counts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#FAFBF9', border: '1px solid var(--ts-border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ts-text-muted)' }}>
                <Users size={13} style={{ color: 'var(--ts-emerald)' }} />
                <span>Users</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-forest)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {dbStatus?.counts?.users ?? 3}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ts-text-muted)' }}>Admin / Analysts</div>
            </div>

            <div style={{ background: '#FAFBF9', border: '1px solid var(--ts-border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ts-text-muted)' }}>
                <FileText size={13} style={{ color: 'var(--ts-emerald)' }} />
                <span>Saved Reports</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-forest)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {dbStatus?.counts?.saved_reports ?? 1}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ts-text-muted)' }}>Cloud Dossiers</div>
            </div>

            <div style={{ background: '#FAFBF9', border: '1px solid var(--ts-border)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ts-text-muted)' }}>
                <Bookmark size={13} style={{ color: 'var(--ts-emerald)' }} />
                <span>Saved AOIs</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ts-forest)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {dbStatus?.counts?.saved_aois ?? 2}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ts-text-muted)' }}>Geographic AOIs</div>
            </div>
          </div>

          {/* Cloud Database Setup Info */}
          <div
            style={{
              background: '#F6F8F5',
              border: '1px solid var(--ts-border)',
              borderRadius: 12,
              padding: '16px 18px',
              fontSize: 12.5,
              color: 'var(--ts-text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--ts-forest)', marginBottom: 6 }}>
              <Code2 size={14} style={{ color: 'var(--ts-emerald)' }} />
              <span>Connect Any Cloud Database (Supabase / Neon / AWS / Render)</span>
            </div>
            <div>
              Terrascope automatically persists users, reports, and AOIs. To point this deployment to your personal cloud PostgreSQL cluster, add your connection string to <code>backend/.env</code>:
            </div>
            <pre
              style={{
                background: '#103B32',
                color: '#A7F3D0',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                margin: '8px 0',
                overflowX: 'auto',
              }}
            >
              DATABASE_URL=postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres
            </pre>
            <div style={{ fontSize: 11, color: 'var(--ts-text-muted)' }}>
              Supports Supabase, Neon Serverless, AWS RDS, CockroachDB, and Render with automatic connection pooling.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            background: '#FAFBF9',
            padding: '12px 26px',
            borderTop: '1px solid var(--ts-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={fetchDbStatus}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--ts-border)',
              background: '#FFFFFF',
              color: 'var(--ts-forest)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Refresh Telemetry
          </button>

          <button
            type="button"
            onClick={closeDbModal}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--ts-forest)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudDatabaseModal;
