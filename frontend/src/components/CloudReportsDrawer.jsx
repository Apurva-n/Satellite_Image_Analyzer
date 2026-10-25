import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCloudReports, deleteCloudReport } from '../services/api';
import {
  X,
  FileText,
  Trash2,
  ExternalLink,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import '../styles/terrascope.css';

const CloudReportsDrawer = () => {
  const { isReportsDrawerOpen, closeReportsDrawer, user, refreshReportsCount } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCloudReports();
      setReports(data || []);
      refreshReportsCount();
    } catch (err) {
      console.error('Failed to load cloud reports:', err);
      setError('Could not retrieve reports from Cloud Database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isReportsDrawerOpen) {
      fetchReports();
    }
  }, [isReportsDrawerOpen]);

  if (!isReportsDrawerOpen) return null;

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete report ${id} from Cloud Database?`)) return;

    try {
      await deleteCloudReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      refreshReportsCount();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to delete report from Cloud Database.');
    }
  };

  const handleOpenReport = (id) => {
    closeReportsDrawer();
    navigate(`/report/${id}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(10, 35, 30, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'tsFadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeReportsDrawer();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          height: '100%',
          background: '#FFFFFF',
          boxShadow: '-8px 0 32px rgba(16, 59, 50, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'tsSlideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--ts-border)',
            background: 'var(--ts-bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--ts-mint)',
                color: 'var(--ts-forest)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ts-forest)' }}>
                Cloud Saved Reports
              </div>
              <div style={{ fontSize: 11, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {user?.full_name} &bull; {reports.length} Reports
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeReportsDrawer}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ts-text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Reports List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ts-text-muted)' }}>
              <RefreshCw size={24} className="spin" style={{ color: 'var(--ts-emerald)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>Loading Cloud Database Reports...</div>
            </div>
          ) : error ? (
            <div style={{ padding: 16, background: '#FEE2E2', borderRadius: 8, color: '#991B1B', fontSize: 12 }}>
              {error}
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ts-text-muted)' }}>
              <FileText size={36} style={{ color: '#C4D3C5', marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ts-forest)' }}>No Cloud Reports Yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Generate an analysis on the Workbench and click &ldquo;Create Report&rdquo; to save directly to your Cloud Database account.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleOpenReport(r.id)}
                  className="ts-card-interactive"
                  style={{
                    background: '#FAFBF9',
                    border: '1px solid var(--ts-border)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ts-forest)', lineHeight: 1.3 }}>
                      {r.title || `Report ${r.id}`}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(r.id, e)}
                      title="Delete from Cloud DB"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: 2,
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#DC2626'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      <span>{r.scene_date || 'Recent'}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Layers size={12} />
                      <span>{r.active_layer || 'TRUE_COLOR'}</span>
                    </span>
                    <span style={{ color: 'var(--ts-emerald)', fontWeight: 700, marginLeft: 'auto' }}>
                      {r.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--ts-border)',
            background: 'var(--ts-bg-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11.5,
            color: 'var(--ts-text-muted)',
          }}
        >
          <span>Synced with Cloud Database</span>
          <button
            type="button"
            onClick={fetchReports}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--ts-border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ts-forest)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <RefreshCw size={11} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudReportsDrawer;
