import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Cloud,
  Award,
  ExternalLink,
  ArrowRight,
  Filter,
  Layers,
  CheckCircle2,
  Globe,
  Search,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import '../styles/terrascope.css';

const ScenesPage = () => {
  const navigate = useNavigate();
  const { scenes, selectedScene, setSelectedScene, bbox } = useApp();

  const [sortBy, setSortBy] = useState('cloud_asc');

  if (!bbox) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div className="ts-result-box" style={{ marginBottom: 20 }}>
          <div className="ts-result-headline">No Area of Interest specified</div>
          <div className="ts-result-body">
            Please define an Area of Interest on the Studio Workbench map first to view available satellite passes.
          </div>
        </div>
        <Link to="/workbench" className="ts-btn-action-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Return to Studio Workbench
        </Link>
      </div>
    );
  }

  const sortedScenes = [...(scenes || [])].sort((a, b) => {
    if (sortBy === 'cloud_asc') return a.cloud_pct - b.cloud_pct;
    if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
    return 0;
  });

  const cleanest =
    scenes && scenes.length > 0
      ? scenes.reduce((prev, curr) => (curr.cloud_pct < prev.cloud_pct ? curr : prev), scenes[0])
      : null;

  const handleOpenScene = (scene) => {
    setSelectedScene(scene);
    navigate('/workbench');
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Link
            to="/workbench"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--ts-forest)',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} /> Back to Workbench
          </Link>
          <span style={{ color: 'var(--ts-border-strong)' }}>&bull;</span>
          <span className="ts-step-badge">SATELLITE PASS REPOSITORY</span>
        </div>

        <h1 className="ts-serif" style={{ fontSize: 30, color: 'var(--ts-forest)', margin: '0 0 6px' }}>
          Discovered Sentinel-2 Passes ({scenes?.length || 0})
        </h1>
        <p style={{ margin: 0, color: 'var(--ts-text-secondary)', fontSize: 14 }}>
          Copernicus Sentinel-2 Level-2A surface reflectance acquisitions covering your selected area of interest.
        </p>
      </div>

      {/* Filter / Sort Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--ts-border)',
          borderRadius: 'var(--ts-radius-md)',
          boxShadow: 'var(--ts-shadow-sm)',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Filter size={15} style={{ color: 'var(--ts-forest)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-text-main)' }}>Sort Passes By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              borderRadius: 'var(--ts-radius-sm)',
              border: '1px solid var(--ts-border-strong)',
              backgroundColor: 'var(--ts-bg-subtle)',
              color: 'var(--ts-text-main)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          >
            <option value="cloud_asc">Lowest Cloud Cover First</option>
            <option value="date_desc">Most Recent Date First</option>
            <option value="date_asc">Oldest Date First</option>
          </select>
        </div>

        {cleanest && (
          <button
            type="button"
            className="ts-btn-sample"
            onClick={() => handleOpenScene(cleanest)}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            <Award size={14} style={{ color: '#D97706' }} />
            <span>
              Open Clearest Pass ({cleanest.cloud_pct}% Clouds on {cleanest.date})
            </span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {!scenes || scenes.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--ts-border)',
            borderRadius: 'var(--ts-radius-lg)',
            boxShadow: 'var(--ts-shadow-sm)',
          }}
        >
          <Layers size={36} style={{ color: 'var(--ts-forest)', marginBottom: 12 }} />
          <h3 className="ts-serif" style={{ fontSize: 20, color: 'var(--ts-forest)', marginBottom: 6 }}>
            No Satellite Passes Found
          </h3>
          <p style={{ color: 'var(--ts-text-secondary)', maxWidth: 460, margin: '0 auto 20px', fontSize: 14 }}>
            No passes matched your observation window and cloud threshold. Search scenes from the Workbench to fetch current passes.
          </p>
          <Link to="/workbench" className="ts-btn-action-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            <ArrowLeft size={16} /> Return to Studio Workbench
          </Link>
        </div>
      ) : (
        /* Grid of Scene Cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {sortedScenes.map((scene) => {
            const isClearest = cleanest && cleanest.id === scene.id;
            const isSelected = selectedScene && selectedScene.id === scene.id;

            return (
              <div
                key={scene.id}
                className="ts-card-interactive"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `1.5px solid ${isSelected ? 'var(--ts-forest)' : isClearest ? 'var(--ts-mint-dark)' : 'var(--ts-border)'}`,
                  borderRadius: 'var(--ts-radius-md)',
                  padding: 16,
                  boxShadow: isSelected ? '0 8px 24px rgba(16, 59, 50, 0.12)' : 'var(--ts-shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} style={{ color: 'var(--ts-forest)' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ts-text-main)' }}>{scene.date}</span>
                  </div>
                  {isClearest && (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--ts-radius-full)',
                        backgroundColor: 'var(--ts-mint-subtle)',
                        color: 'var(--ts-forest)',
                        fontSize: 10.5,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ★ CLEAREST SKY
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ts-text-secondary)',
                  }}
                >
                  <Cloud size={14} />
                  <span>{scene.cloud_pct}% Cloud Cover</span>
                  <span>&bull;</span>
                  <span>Orbit {scene.orbit ?? '142'}</span>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--ts-text-muted)',
                    wordBreak: 'break-all',
                    backgroundColor: 'var(--ts-bg-subtle)',
                    padding: '6px 8px',
                    borderRadius: 6,
                  }}
                >
                  {scene.id}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenScene(scene)}
                  className="ts-btn-action-primary"
                  style={{
                    marginTop: 'auto',
                    justifyContent: 'center',
                    width: '100%',
                    backgroundColor: isSelected ? 'var(--ts-mint)' : 'var(--ts-forest)',
                    color: isSelected ? 'var(--ts-forest)' : '#FFFFFF',
                  }}
                >
                  <span>{isSelected ? '✓ Active Pass Loaded' : 'Load Scene into Workbench'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScenesPage;
