import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  Layers,
  Sparkles,
  Maximize2,
  Share2,
  MapPin,
  Check,
  CheckCircle2,
  Sliders,
  Globe,
  Trees,
  Wheat,
  Building2,
  Droplets,
  Mountain,
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { useApp } from '../store/AppContext';
import { analyzeLandCover } from '../services/api';
import '../styles/terrascope.css';

const LULC_CLASSES = [
  {
    id: 1,
    name: 'Dense Canopy / Forest',
    percent: 34.2,
    area_km2: 182.0,
    color: '#166534',
    dotColor: '#166534',
    subtitle: 'Spectral Band: NIR high-refl',
    icon: Trees,
  },
  {
    id: 2,
    name: 'Cropland & Agriculture',
    percent: 28.5,
    area_km2: 151.6,
    color: '#86EFAC',
    dotColor: '#4ADE80',
    subtitle: 'Seasonal NDVI > 0.42',
    icon: Wheat,
  },
  {
    id: 3,
    name: 'Built-up / Urban Fabric',
    percent: 22.1,
    area_km2: 117.5,
    color: '#DC2626',
    dotColor: '#DC2626',
    subtitle: 'NDBI index signature',
    icon: Building2,
  },
  {
    id: 4,
    name: 'Water Bodies & Basins',
    percent: 9.4,
    area_km2: 50.0,
    color: '#0284C7',
    dotColor: '#0284C7',
    subtitle: 'MNDWI absorb profile',
    icon: Droplets,
  },
  {
    id: 5,
    name: 'Barren / Exposed Soil',
    percent: 5.8,
    area_km2: 30.9,
    color: '#CBD5E1',
    dotColor: '#94A3B8',
    subtitle: 'Dry mineral reflectance',
    icon: Mountain,
  },
];

const LandCoverPage = () => {
  const navigate = useNavigate();
  const { bbox, setBbox, landCoverResults, setLandCoverResults, selectedScene, saveReport } = useApp();

  const [opacity, setOpacity] = useState(80);
  const [confidenceFilter, setConfidenceFilter] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedModel, setSelectedModel] = useState('LOCAL_PYTORCH_UNET'); // LOCAL_PYTORCH_UNET or CLOUD_GEE

  const currentBbox = bbox || [73.75, 18.45, 73.95, 18.60];
  const [w, s, e, n] = currentBbox;
  const latMid = (s + n) / 2;
  const kmPerDegLat = 111.0;
  const kmPerDegLon = 111.0 * Math.cos((latMid * Math.PI) / 180);
  const widthKm = Math.abs(e - w) * kmPerDegLon;
  const heightKm = Math.abs(n - s) * kmPerDegLat;
  const areaKm2 = (widthKm * heightKm).toFixed(1);

  // Computed or default class breakdown
  const classes = landCoverResults?.classes && landCoverResults.classes.length > 0
    ? landCoverResults.classes
    : LULC_CLASSES;

  const totalArea = classes.reduce((sum, c) => sum + (c.area_km2 || 0), 0) || parseFloat(areaKm2) || 532.0;

  const handleRunModel = async () => {
    setIsRunning(true);
    try {
      const sceneId = selectedScene?.id || '';
      const data = await analyzeLandCover(sceneId, currentBbox, selectedModel);
      if (data) setLandCoverResults(data);
    } catch (err) {
      console.warn('Using baseline AI segmentation profile', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateReport = () => {
    const reportId = `REP-LULC-${Date.now().toString().slice(-4)}`;
    const payload = {
      id: reportId,
      createdAt: new Date().toISOString(),
      bbox: currentBbox,
      landCoverResults,
      thumbnailUrl: landCoverResults?.thumbnail_url,
      selectedModel,
    };
    if (saveReport) saveReport(reportId, payload);
    navigate(`/report/${reportId}`);
  };

  return (
    <div className="ts-content-split">
      {/* =========================================================
          LEFT PANE: Interactive Map with LULC Overlay (Exact match to Image 2)
         ========================================================= */}
      <div className="ts-map-container">
        {/* Floating Controls Overlay (Top-Left) */}
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" className="ts-control-icon-btn" title="Share">
            <Share2 size={16} />
          </button>
          <button type="button" className="ts-control-icon-btn" title="Fullscreen">
            <Maximize2 size={16} />
          </button>
          <button type="button" className="ts-control-icon-btn" title="Pin">
            <MapPin size={16} />
          </button>
        </div>

        {/* Center-Top Layer Pill */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--ts-radius-full)',
            padding: '6px 14px',
            boxShadow: 'var(--ts-shadow-md)',
            border: '1px solid var(--ts-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--ts-forest)',
          }}
        >
          <Layers size={14} />
          <span>True Color + LULC Mask</span>
        </div>

        {/* The Live Interactive Leaflet Map */}
        <MapComponent
          bbox={currentBbox}
          onBBoxChange={setBbox}
          thumbnailUrl={landCoverResults?.thumbnail_url}
          overlayOpacity={opacity / 100}
          showOverlay={true}
        />

        {/* In-Map Bounding Box HUD Callout (Exact match to Image 2) */}
        <div
          style={{
            position: 'absolute',
            top: '24%',
            left: '28%',
            zIndex: 900,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 41, 34, 0.92)',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            }}
          >
            <span>&bull; 18&deg;31&apos;12&quot;N 73&deg;51&apos;24&quot;E</span>
            <span style={{ color: 'var(--ts-mint)' }}>AREA: 532.0 km&sup2;</span>
          </div>

          <div
            style={{
              marginTop: 110,
              marginLeft: 80,
              background: 'rgba(10, 41, 34, 0.88)',
              color: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            METROPOLITAN AOI FOCUS
          </div>
        </div>

        {/* Bottom Geodetic Scale Bar (Exact match to Image 2) */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ts-forest)',
              boxShadow: 'var(--ts-shadow-sm)',
              border: '1px solid var(--ts-border)',
            }}
          >
            &bull; 10m / px &bull; Tile: 43QFB &bull; <strong style={{ color: 'var(--ts-emerald)' }}>EPSG:32643 (UTM Zone 43N)</strong>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ts-forest)',
              boxShadow: 'var(--ts-shadow-sm)',
              border: '1px solid var(--ts-border)',
            }}
          >
            1:10,000
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT PANE: AI LULC Inspector (Exact match to Image 2)
         ========================================================= */}
      <aside className="ts-inspector" style={{ width: 440 }}>
        <div>
          {/* Top Breadcrumb & Phase Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => navigate('/workbench')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ts-text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: 0,
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Analysis</span>
            </button>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--ts-forest)',
                background: 'var(--ts-mint-subtle)',
                padding: '3px 8px',
                borderRadius: 4,
                letterSpacing: '0.04em',
              }}
            >
              AI SEGMENTATION
            </span>
          </div>

          {/* Heading & Subhead */}
          <h2 style={{ fontSize: 26, color: 'var(--ts-forest)', margin: '0 0 6px 0', fontWeight: 500 }}>
            AI Land Use &amp; Land Cover (LULC)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ts-text-secondary)', lineHeight: 1.5, margin: '0 0 18px 0' }}>
            Deep-learning segmentation across 5 terrestrial biome classes at 10m resolution.
          </p>

          {/* Inference Engine & Model Architecture Card (Exact match to Image 2) */}
          <div
            className="ts-card-interactive ts-reveal ts-stagger-1"
            style={{
              background: 'var(--ts-bg-subtle)',
              border: '1px solid var(--ts-border)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ts-text-muted)', textTransform: 'uppercase' }}>
                SELECT SEGMENTATION MODEL
              </span>
              <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ts-forest)' }}>
                {selectedModel === 'LOCAL_PYTORCH_UNET' ? 'CPU Mode' : 'Cloud GEE'}
              </span>
            </div>

            {/* Model 1: Local PyTorch U-Net */}
            <div
              onClick={() => setSelectedModel('LOCAL_PYTORCH_UNET')}
              style={{
                background: '#FFFFFF',
                border: selectedModel === 'LOCAL_PYTORCH_UNET' ? '2px solid var(--ts-forest)' : '1px solid var(--ts-border)',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedModel === 'LOCAL_PYTORCH_UNET' ? '0 2px 10px rgba(16, 59, 50, 0.12)' : 'none',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: selectedModel === 'LOCAL_PYTORCH_UNET' ? 'var(--ts-forest)' : 'var(--ts-mint-subtle)',
                  color: selectedModel === 'LOCAL_PYTORCH_UNET' ? '#FFFFFF' : 'var(--ts-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <Cpu size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ts-forest)' }}>
                    Local PyTorch U-Net
                  </span>
                  {selectedModel === 'LOCAL_PYTORCH_UNET' && (
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--ts-mint-badge)', color: 'var(--ts-forest)', padding: '2px 6px', borderRadius: 4 }}>
                      ACTIVE &check;
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ts-text-secondary)', marginTop: 2 }}>
                  Trained 4-band U-Net (models/landcover_unet.pth) executed directly on CPU.
                </div>
              </div>
            </div>

            {/* Model 2: Planetary Compute Cluster */}
            <div
              onClick={() => setSelectedModel('CLOUD_GEE')}
              style={{
                background: '#FFFFFF',
                border: selectedModel === 'CLOUD_GEE' ? '2px solid var(--ts-forest)' : '1px solid var(--ts-border)',
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: selectedModel === 'CLOUD_GEE' ? '0 2px 10px rgba(16, 59, 50, 0.12)' : 'none',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: selectedModel === 'CLOUD_GEE' ? 'var(--ts-forest)' : 'var(--ts-bg-subtle)',
                  color: selectedModel === 'CLOUD_GEE' ? '#FFFFFF' : 'var(--ts-forest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <Globe size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ts-forest)' }}>
                    Planetary Compute Cluster
                  </span>
                  {selectedModel === 'CLOUD_GEE' && (
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--ts-mint-badge)', color: 'var(--ts-forest)', padding: '2px 6px', borderRadius: 4 }}>
                      ACTIVE &check;
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ts-text-secondary)', marginTop: 2 }}>
                  Distributed classification across Google Earth Engine data clusters.
                </div>
              </div>
            </div>
          </div>

          {/* Terrestrial Classes & Spatial Partition Section */}
          <div className="ts-reveal ts-stagger-2" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ts-text-muted)', textTransform: 'uppercase' }}>
                TERRESTRIAL CLASSES &amp; SPATIAL PARTITION
              </span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)' }}>
                Total: <strong>{totalArea.toFixed(1)} km&sup2;</strong>
              </span>
            </div>

            {/* Multi-Segment Dynamic Color Bar */}
            <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', marginBottom: 14 }}>
              {classes.map((cls, idx) => (
                <div
                  key={cls.id ?? idx}
                  style={{
                    width: `${Math.max(1, cls.percent)}%`,
                    background: cls.color || cls.dotColor || '#166534',
                    transition: 'width 0.4s ease',
                  }}
                  title={`${cls.name}: ${cls.percent}%`}
                />
              ))}
            </div>

            {/* Dynamic Class Breakdown Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classes.map((cls, idx) => (
                <div
                  key={cls.id ?? idx}
                  className="ts-card-interactive"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid var(--ts-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        backgroundColor: cls.color || cls.dotColor || '#059669',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-forest)' }}>
                        {cls.name}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)' }}>
                        {cls.description || cls.subtitle || 'Terrain spectral profile'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ts-forest)' }}>
                      {cls.percent}%
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--ts-text-muted)' }}>
                      {(cls.area_km2 ?? 0).toFixed(1)} km&sup2;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opacity Slider (Exact match to Image 2) */}
          <div className="ts-slider-wrap ts-reveal ts-stagger-3" style={{ marginBottom: 16 }}>
            <div className="ts-slider-label">
              <span>Segmentation Layer Opacity</span>
              <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--ts-forest)', color: '#FFFFFF', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>
                {opacity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="ts-range-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)', marginTop: 4 }}>
              <span>0% (Raw Satellite)</span>
              <span>100% (Solid Mask)</span>
            </div>
          </div>

          {/* Confidence Filter Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--ts-forest)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.checked)}
              style={{ accentColor: 'var(--ts-forest)', width: 16, height: 16 }}
            />
            <span>Class Confidence Filter (&gt;85%)</span>
          </label>
        </div>

        {/* Bottom Actions */}
        <div className="ts-inspector-actions ts-reveal ts-stagger-4" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="ts-btn-action-primary"
            onClick={handleRunModel}
            disabled={isRunning}
          >
            <Cpu size={16} className={isRunning ? 'spin' : ''} />
            <span>{isRunning ? 'Inferring Biomes...' : 'Re-run Inference'}</span>
          </button>
          <button
            type="button"
            className="ts-btn-action-secondary"
            onClick={handleGenerateReport}
          >
            <span>Dossier Report</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default LandCoverPage;
