import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  Layers,
  Sparkles,
  TrendingUp,
  Sliders,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { useApp } from '../store/AppContext';
import { getSpectralIndex } from '../services/api';

const LAYER_CONFIGS = [
  { id: 'TRUE_COLOR', label: 'True Color (RGB)', icon: '🌿', desc: 'Visible Red, Green, Blue photographic reflectance.' },
  { id: 'FALSE_COLOR', label: 'Color Infrared (NIR)', icon: '🛰️', desc: 'Near-Infrared composite. Dense vegetation reflects intense red.' },
  { id: 'NDVI', label: 'NDVI (Plant Health)', icon: '🌾', desc: 'Normalized Difference Vegetation Index. Chlorophyll density.' },
  { id: 'NDWI', label: 'NDWI (Water/Floods)', icon: '💧', desc: 'Normalized Difference Water Index. Highlights open surface moisture.' },
  { id: 'NDBI', label: 'NDBI (Built-up Urban)', icon: '🏙️', desc: 'Concrete, asphalt, and built-up infrastructure index.' },
  { id: 'NBR', label: 'NBR (Burn Severity)', icon: '🔥', desc: 'Normalized Burn Ratio for wildfire impact tracking.' },
];

const AnalysisPage = () => {
  const { sceneId } = useParams();
  const navigate = useNavigate();
  const {
    bbox,
    selectedScene,
    setSelectedScene,
    scenes,
    activeLayer,
    setActiveLayer,
    spectralData,
    setSpectralData,
    thumbnailUrl,
    setThumbnailUrl,
    saveReport,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [showOverlay, setShowOverlay] = useState(true);

  // Active scene resolution
  const currentSceneId = sceneId ? decodeURIComponent(sceneId) : selectedScene?.id || (scenes?.[0]?.id ?? null);

  useEffect(() => {
    if (!currentSceneId || !bbox) return;

    // sync selectedScene object if needed
    if (!selectedScene || selectedScene.id !== currentSceneId) {
      const match = scenes?.find((s) => s.id === currentSceneId);
      if (match) setSelectedScene(match);
      else setSelectedScene({ id: currentSceneId, date: '2026-01-03', cloud_pct: 12.0 });
    }

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await getSpectralIndex(currentSceneId, bbox, activeLayer);
        setThumbnailUrl(data.thumbnail_url);
        setSpectralData(data);
      } catch (err) {
        console.error('Analysis error:', err);
        setErrorMsg(err.response?.data?.detail || err.message || 'Failed to fetch spectral raster from GEE.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [currentSceneId, bbox, activeLayer]);

  if (!bbox) {
    return (
      <div className="mc-page-container">
        <div className="mc-toast-banner warning">
          <span>No Area of Interest selected. Please choose a region to view multispectral analysis.</span>
        </div>
        <Link to="/" className="mc-btn-back" style={{ width: 'fit-content' }}>
          <ArrowLeft size={16} /> Return to Search
        </Link>
      </div>
    );
  }

  const handleLayerSwitch = (layerId) => {
    setActiveLayer(layerId);
  };

  const handleGenerateReport = () => {
    const reportId = `report-${Date.now()}`;
    const reportPayload = {
      id: reportId,
      createdAt: new Date().toISOString(),
      scene: selectedScene || { id: currentSceneId, date: '2026-01-03', cloud_pct: 12.0 },
      bbox,
      spectralData,
      thumbnailUrl,
      activeLayer,
    };
    saveReport(reportId, reportPayload);
    navigate(`/report/${reportId}`);
  };

  const stats = spectralData?.stats;
  const currentConfig = LAYER_CONFIGS.find((l) => l.id === activeLayer) || LAYER_CONFIGS[0];

  return (
    <div className="mc-split-view">
      {/* LEFT: Analysis Map Viewer with Floating Layer Chips */}
      <section className="mc-map-pane">
        <div className="mc-floating-layer-bar">
          {LAYER_CONFIGS.slice(0, 4).map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`mc-layer-chip ${activeLayer === layer.id ? 'active' : ''}`}
              onClick={() => handleLayerSwitch(layer.id)}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* Map View */}
        <div className="mc-map-wrapper">
          <MapComponent
            bbox={bbox}
            thumbnailUrl={thumbnailUrl}
            showOverlay={showOverlay}
            overlayOpacity={overlayOpacity}
            onBBoxChange={() => {}}
          />
        </div>
      </section>

      {/* RIGHT: Analysis Controls & Metrics Sidebar */}
      <aside className="mc-sidebar-pane">
        <div className="mc-sidebar-content">
          {/* Header Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/scenes" className="mc-btn-back" style={{ padding: '4px 12px', fontSize: 12 }}>
              <ArrowLeft size={14} /> Back to Passes
            </Link>
            <span className="mc-step-badge">MULTISPECTRAL MATRIX</span>
          </div>

          <div className="mc-pane-title-group">
            <h2>{currentConfig.label}</h2>
            <p>{currentConfig.desc}</p>
          </div>

          {errorMsg && (
            <div className="mc-toast-banner error">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Layer Selector Chips */}
          <div className="mc-glass-card">
            <span className="mc-card-title">
              <Layers size={15} className="text-cyan-400" /> SELECT SPECTRAL BAND / INDEX
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {LAYER_CONFIGS.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className={`mc-chip-btn ${activeLayer === layer.id ? 'active' : ''}`}
                  style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}
                  onClick={() => handleLayerSwitch(layer.id)}
                  disabled={isLoading}
                >
                  <span>{layer.icon}</span>
                  <span style={{ fontWeight: 600 }}>{layer.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opacity & Display Controls */}
          <div className="mc-glass-card">
            <div className="mc-card-header">
              <span className="mc-card-title">
                <Sliders size={15} className="text-cyan-400" /> LAYER OPACITY &amp; VISIBILITY
              </span>
              <button
                type="button"
                className="mc-btn-link"
                onClick={() => setShowOverlay(!showOverlay)}
              >
                {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{showOverlay ? 'Overlay Visible' : 'Overlay Hidden'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                className="mc-range-slider"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--mc-cyan)', minWidth: 42 }}>
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          </div>

          {/* Zonal Statistics Card */}
          {stats && (
            <div className="mc-glass-card">
              <div className="mc-card-header">
                <span className="mc-card-title">
                  <TrendingUp size={15} className="text-cyan-400" /> SPECTRAL INDEX STATISTICS
                </span>
                {stats.category && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}>
                    {stats.category}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div style={{ background: 'rgba(9, 14, 24, 0.6)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>MEAN</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#22D3EE', fontFamily: 'var(--font-mono)' }}>
                    {stats.mean_val !== null ? stats.mean_val.toFixed(3) : 'N/A'}
                  </div>
                </div>
                <div style={{ background: 'rgba(9, 14, 24, 0.6)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>MIN</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-mono)' }}>
                    {stats.min_val !== null ? stats.min_val.toFixed(2) : 'N/A'}
                  </div>
                </div>
                <div style={{ background: 'rgba(9, 14, 24, 0.6)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase' }}>MAX</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', fontFamily: 'var(--font-mono)' }}>
                    {stats.max_val !== null ? stats.max_val.toFixed(2) : 'N/A'}
                  </div>
                </div>
              </div>

              {stats.distribution && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>Surface Coverage Breakdown:</span>
                  {Object.entries(stats.distribution).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#F1F5F9' }}>{key}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#22D3EE' }}>{val}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions (Open High-Res) */}
          {thumbnailUrl && (
            <a
              href={thumbnailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-btn-link"
              style={{ padding: '8px 0', color: 'var(--mc-cyan)' }}
            >
              <ExternalLink size={14} /> View Raw High-Resolution Raster from GEE
            </a>
          )}
        </div>

        {/* BOTTOM ACTION: GENERATE REPORT */}
        <div className="mc-bottom-action-pinned">
          <button
            type="button"
            className="mc-btn-primary-gradient"
            onClick={handleGenerateReport}
            disabled={isLoading || !thumbnailUrl}
          >
            <FileText size={17} />
            <span>GENERATE PDF INTELLIGENCE REPORT</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default AnalysisPage;
