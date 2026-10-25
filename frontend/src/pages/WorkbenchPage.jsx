import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  MapPin,
  Calendar,
  Sparkles,
  Maximize2,
  FileText,
  GitCompare,
  TrendingUp,
  Compass,
  Sliders,
  Eye,
  Check,
  Search,
  Crosshair,
  Ruler,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Info,
  Satellite,
  X,
  Award,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { useApp } from '../store/AppContext';
import { useAuth } from '../context/AuthContext';
import { getSpectralIndex, searchScenes, saveCloudReport } from '../services/api';
import '../styles/terrascope.css';

const LAYER_OPTIONS = [
  {
    id: 'TRUE_COLOR',
    title: 'Natural view',
    subtitle: 'True color',
    legendTitle: 'Surface reflectance',
    legendTag: 'RGB composite',
    gradient: 'linear-gradient(to right, #1E293B, #94A3B8, #F8FAFC)',
    labels: ['Shadow', 'Midtone', 'High Albedo'],
    resultTitle: 'Calibrated Natural Optical Composite',
    resultBody: 'Natural optical surface reflectance combining RGB channels with clear atmospheric transmission.',
    deltaLabel: 'Atmospheric optical depth',
    deltaVal: '0.08 AOT (Optimal)',
  },
  {
    id: 'NDVI',
    title: 'Plant health',
    subtitle: 'NDVI',
    legendTitle: 'Vegetation vigor',
    legendTag: 'NDVI index',
    gradient: 'linear-gradient(to right, #D97706, #FDE68A, #6EE7B7, #047857)',
    labels: ['Stressed', 'Moderate', 'Dense Vigor'],
    resultTitle: 'Optimal photosynthetic vigor: healthy vegetation',
    resultBody: 'Healthy vegetative canopy with active chlorophyll absorption and robust cellular structure.',
    deltaLabel: 'Canopy vitality index',
    deltaVal: '+0.12 vs median',
  },
  {
    id: 'NDWI',
    title: 'Water & floods',
    subtitle: 'NDWI',
    legendTitle: 'Water level',
    legendTag: 'NDWI index',
    gradient: 'linear-gradient(to right, #D8B48D, #93C5FD, #0284C7, #0369A1)',
    labels: ['Dry', 'Transition', 'Wet'],
    resultTitle: 'Low moisture: mostly dry ground',
    resultBody: 'Water covers ~0.6% of area. Normal dry ground with zero flooding indicators detected.',
    deltaLabel: 'Hydro-boundary delta',
    deltaVal: '-0.04 vs median',
  },
  {
    id: 'NDBI',
    title: 'Built-up land',
    subtitle: 'NDBI',
    legendTitle: 'Impervious surface',
    legendTag: 'NDBI index',
    gradient: 'linear-gradient(to right, #047857, #E5E7EB, #B45309, #7F1D1D)',
    labels: ['Vegetated', 'Suburban', 'Dense Urban'],
    resultTitle: 'Balanced suburban & mixed infrastructure',
    resultBody: 'Stable suburban fabric and impervious surfaces across residential nodes.',
    deltaLabel: 'Impervious surface fraction',
    deltaVal: '18.4% of total AOI',
  },
  {
    id: 'NBR',
    title: 'Burn scars',
    subtitle: 'NBR',
    legendTitle: 'Burn severity',
    legendTag: 'NBR index',
    gradient: 'linear-gradient(to right, #7F1D1D, #D97706, #FEF08A, #047857)',
    labels: ['High Severity', 'Moderate', 'Unburned'],
    resultTitle: 'No wildfire scars or active burn anomalies',
    resultBody: 'Normalized Burn Ratio indicates zero recent thermal disturbance across the perimeter.',
    deltaLabel: 'Thermal scar index',
    deltaVal: '+0.48 (Unburned)',
  },
  {
    id: 'FALSE_COLOR',
    title: 'Infrared',
    subtitle: 'Color infrared',
    legendTitle: 'NIR Reflectance',
    legendTag: 'B8/B4/B3 bands',
    gradient: 'linear-gradient(to right, #0284C7, #E5E7EB, #EF4444, #991B1B)',
    labels: ['Water/Urban', 'Sparse', 'Dense Biomass'],
    resultTitle: 'High near-infrared cellular reflectance',
    resultBody: 'Near-infrared composite highlighting dense vegetative biomass and cellular moisture.',
    deltaLabel: 'NIR/Red radiance ratio',
    deltaVal: '4.82 (High Biomass)',
  },
];

const PRESETS = [
  { name: 'Pune', bbox: [73.75, 18.45, 73.95, 18.60] },
  { name: 'Mumbai', bbox: [72.78, 18.90, 72.98, 19.15] },
  { name: 'Delhi', bbox: [77.10, 28.55, 77.30, 28.75] },
];

const WorkbenchPage = () => {
  const navigate = useNavigate();
  const {
    bbox,
    setBbox,
    activeLayer,
    setActiveLayer,
    spectralData,
    setSpectralData,
    selectedScene,
    setSelectedScene,
    scenes,
    setScenes,
    thumbnailUrl,
    setThumbnailUrl,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    maxCloudPct,
    setMaxCloudPct,
    saveReport,
  } = useApp();

  const { token, refreshReportsCount } = useAuth();

  const [overlayOpacity, setOverlayOpacity] = useState(85);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRaster, setIsLoadingRaster] = useState(false);
  const [showSceneModal, setShowSceneModal] = useState(false);
  const [isSearchingScenes, setIsSearchingScenes] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [datePreset, setDatePreset] = useState('Q1 2026');

  // Selected layer config object
  const currentLayer = LAYER_OPTIONS.find((l) => l.id === activeLayer) || LAYER_OPTIONS[2]; // Default NDWI

  // Calculate AOI area
  const currentBbox = bbox || [73.75, 18.45, 73.95, 18.60];
  const [w, s, e, n] = currentBbox;
  const latMid = (s + n) / 2;
  const kmPerDegLat = 111.0;
  const kmPerDegLon = 111.0 * Math.cos((latMid * Math.PI) / 180);
  const widthKm = Math.abs(e - w) * kmPerDegLon;
  const heightKm = Math.abs(n - s) * kmPerDegLat;
  const areaKm2 = Math.round(widthKm * heightKm);

  // Search scenes from Earth Engine for current AOI
  const handleSearchScenes = async (preset = datePreset) => {
    if (!currentBbox) return;
    setIsSearchingScenes(true);
    setSearchError(null);
    setShowSceneModal(true);

    let start = startDate || '2026-01-01';
    let end = endDate || '2026-03-31';

    if (preset === '30days') {
      start = '2026-03-01';
      end = '2026-03-31';
    } else if (preset === '90days') {
      start = '2026-01-01';
      end = '2026-03-31';
    } else if (preset === 'Q1 2026') {
      start = '2026-01-01';
      end = '2026-03-31';
    }

    setStartDate(start);
    setEndDate(end);

    try {
      const results = await searchScenes(currentBbox, start, end, maxCloudPct || 20);
      setScenes(results);

      if (results && results.length > 0) {
        // Auto-select cleanest cloud-free pass
        const cleanest = results.reduce(
          (prev, curr) => (curr.cloud_pct < prev.cloud_pct ? curr : prev),
          results[0]
        );
        handleSelectScene(cleanest, false);
      }
    } catch (err) {
      console.error('Scene search failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to query Sentinel-2 scenes.';
      setSearchError(msg);
    } finally {
      setIsSearchingScenes(false);
    }
  };

  // Select a specific scene and load its spectral raster
  const handleSelectScene = async (scene, closeModal = true) => {
    setSelectedScene(scene);
    if (closeModal) setShowSceneModal(false);
    setIsLoadingRaster(true);
    try {
      const res = await getSpectralIndex(scene.id, currentBbox, activeLayer);
      if (res) {
        setSpectralData(res);
        const url = res.thumbnail_url || res.tile_url;
        if (url) {
          setThumbnailUrl(url);
        }
      }
    } catch (err) {
      console.warn('Failed to load spectral index for scene:', scene.id, err);
    } finally {
      setIsLoadingRaster(false);
    }
  };

  // Fetch or update spectral raster when layer changes
  const handleSelectLayer = async (layerId) => {
    setActiveLayer(layerId);
    setIsLoadingRaster(true);
    try {
      const sceneId = selectedScene?.id || '';
      const res = await getSpectralIndex(sceneId, currentBbox, layerId);
      if (res) {
        setSpectralData(res);
        const url = res.thumbnail_url || res.tile_url;
        if (url) {
          setThumbnailUrl(url);
        }
      }
    } catch (err) {
      console.warn('Could not refresh spectral index for layer:', layerId, err);
    } finally {
      setIsLoadingRaster(false);
    }
  };

  // Initialize raster layer on mount if empty
  useEffect(() => {
    if (!thumbnailUrl) {
      handleSelectLayer(activeLayer || 'TRUE_COLOR');
    }
  }, []);

  const handleCreateReport = () => {
    const reportId = `REP-${Date.now().toString().slice(-4)}`;
    const reportPayload = {
      id: reportId,
      createdAt: new Date().toISOString(),
      scene: selectedScene || {
        id: 'COPERNICUS/S2_SR_HARMONIZED/S2B_MSIL2A_20260103',
        date: '2026-01-03',
        cloud_pct: 8.5,
      },
      bbox: currentBbox,
      spectralData,
      thumbnailUrl,
      activeLayer,
    };
    if (saveReport) saveReport(reportId, reportPayload);

    // Persist to Cloud Database if user is authenticated
    if (token) {
      saveCloudReport({
        id: reportId,
        title: `Observation Analysis ${reportId}`,
        bbox: currentBbox,
        scene_id: reportPayload.scene?.id,
        scene_date: reportPayload.scene?.date,
        cloud_pct: reportPayload.scene?.cloud_pct,
        active_layer: activeLayer,
        spectral_data: spectralData,
        thumbnail_url: thumbnailUrl,
      }).then(() => refreshReportsCount?.()).catch(() => {});
    }

    navigate(`/report/${reportId}`);
  };

  const handleApplyPreset = (presetBbox) => {
    setBbox(presetBbox);
  };

  const handleSearchSubmit = (ev) => {
    ev.preventDefault();
    if (!searchQuery) return;
    const q = searchQuery.toLowerCase();
    const match = PRESETS.find((p) => p.name.toLowerCase().includes(q));
    if (match) {
      setBbox(match.bbox);
    } else {
      alert(`Location "${searchQuery}" not in presets. Choose Pune, Mumbai, or Delhi, or draw directly on the map.`);
    }
  };

  return (
    <div className="ts-content-split">
      {/* 1. Map Canvas Viewport */}
      <div className="ts-map-container">
        {/* Floating Top Toolbar */}
        <div className="ts-map-toolbar">
          <button
            type="button"
            className="ts-tool-btn active"
            title="Use rectangle tool on the map to define bounding box"
          >
            <span>✏️ Draw area</span>
          </button>

          {/* Dedicated Search Imagery Button in Toolbar */}
          <button
            type="button"
            className="ts-tool-btn"
            style={{
              backgroundColor: 'var(--ts-forest)',
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '6px 14px',
              boxShadow: '0 2px 10px rgba(16, 59, 50, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => handleSearchScenes()}
            disabled={isSearchingScenes}
          >
            <Satellite size={14} className={isSearchingScenes ? 'spin' : ''} />
            <span>{isSearchingScenes ? 'Searching...' : '🛰️ Search Scenes'}</span>
          </button>

          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="ts-tool-btn"
              onClick={() => handleApplyPreset(p.bbox)}
            >
              {p.name}
            </button>
          ))}

          <form onSubmit={handleSearchSubmit} className="ts-tool-input-wrap">
            <Search size={14} style={{ color: 'var(--ts-text-muted)' }} />
            <input
              type="text"
              placeholder="Search place..."
              className="ts-tool-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Floating AOI Search Banner directly below the toolbar */}
        <div className="ts-aoi-search-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ts-pulse-dot" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ts-forest)' }}>
              AOI: ~{areaKm2} km&sup2;
            </span>
            <span style={{ fontSize: 11, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)' }}>
              [{w.toFixed(2)}&deg;, {s.toFixed(2)}&deg; &rarr; {e.toFixed(2)}&deg;, {n.toFixed(2)}&deg;]
            </span>
          </div>

          <button
            type="button"
            className="ts-btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: 12,
              height: 30,
              borderRadius: 'var(--ts-radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={() => handleSearchScenes()}
            disabled={isSearchingScenes}
          >
            <Search size={12} className={isSearchingScenes ? 'spin' : ''} />
            <span>{isSearchingScenes ? 'Querying Sentinel-2...' : 'Search Satellite Imagery'}</span>
          </button>
        </div>

        {/* Floating Right Map Controls */}
        <div className="ts-map-controls-right">
          <button type="button" className="ts-control-icon-btn" title="Map Layers">
            <Layers size={17} />
          </button>
          <button type="button" className="ts-control-icon-btn" title="Measurement Tool">
            <Ruler size={17} />
          </button>
          <button
            type="button"
            className="ts-control-icon-btn"
            title="Recenter Map"
            onClick={() => setBbox([73.75, 18.45, 73.95, 18.60])}
          >
            <Crosshair size={17} />
          </button>
        </div>

        {/* The Live Interactive Leaflet Map */}
        <MapComponent
          bbox={currentBbox}
          onBBoxChange={setBbox}
          thumbnailUrl={thumbnailUrl}
          overlayOpacity={overlayOpacity / 100}
          showOverlay={true}
        />

        {/* Floating Bottom Left Legend Card */}
        <div className="ts-map-legend">
          <div className="ts-map-legend-title">
            <span>{currentLayer.legendTitle}</span>
            <span className="ts-map-legend-tag">{currentLayer.legendTag}</span>
          </div>
          <div
            className="ts-map-legend-bar"
            style={{ background: currentLayer.gradient }}
          />
          <div className="ts-map-legend-labels">
            <span>{currentLayer.labels[0]}</span>
            <span>{currentLayer.labels[1]}</span>
            <span>{currentLayer.labels[2]}</span>
          </div>
        </div>

        {/* Floating Bottom Right Scale Badge */}
        <div className="ts-map-scale-badge">
          Sentinel-2 L2A &bull; EPSG:4326 &bull; <strong>1:25,000</strong>
        </div>
      </div>

      {/* 2. Right Inspector / Control Panel */}
      <aside className="ts-inspector">
        <div>
          {/* Stepper Tabs */}
          <div className="ts-stepper">
            <div className="ts-step-tab" style={{ cursor: 'pointer' }} onClick={() => alert(`Active Bounding Box: [${w}, ${s}, ${e}, ${n}] (${areaKm2} km²)`)}>
              1 Area &check;
            </div>
            <div
              className="ts-step-tab"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => handleSearchScenes()}
            >
              <Calendar size={11} />
              <span>2 Date</span>
            </div>
            <div className="ts-step-tab active">3 View</div>

            <button
              type="button"
              className="ts-btn-primary"
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                fontSize: 11.5,
                height: 26,
                borderRadius: 'var(--ts-radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
              onClick={handleCreateReport}
              title="Generate Intelligence Report"
            >
              <FileText size={12} />
              <span>Create Report</span>
            </button>
          </div>

          {/* Context Metadata Row with Change Scene Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: 'var(--ts-bg-subtle)',
              borderRadius: 'var(--ts-radius-sm)',
              border: '1px solid var(--ts-border)',
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: 'var(--ts-text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                CURRENT SATELLITE PASS
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ts-forest)' }}>
                {selectedScene?.date || '5 Jan 2026'} &bull; {selectedScene?.cloud_pct ?? 0}% cloud
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSearchScenes()}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--ts-border-strong)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11.5,
                fontWeight: 600,
                color: 'var(--ts-forest)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Search size={12} />
              <span>Change Scene</span>
            </button>
          </div>

          <h2 className="ts-inspector-title">What do you want to see?</h2>
          <p className="ts-inspector-subtitle">
            Select an optical composite or spectral index overlay.
          </p>

          {/* 6 Layer Option Cards (2 Columns) */}
          <div className="ts-layers-grid">
            {LAYER_OPTIONS.map((layer) => {
              const isSelected = activeLayer === layer.id;
              return (
                <div
                  key={layer.id}
                  className={`ts-layer-card ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectLayer(layer.id)}
                >
                  <div className="ts-layer-card-title">{layer.title}</div>
                  <div className="ts-layer-card-code">{layer.subtitle}</div>
                  {isSelected && <span className="ts-layer-active-dot" />}
                </div>
              );
            })}
          </div>

          {/* Analytical Result Box */}
          <div className="ts-result-box ts-card-interactive">
            <div className="ts-result-header">
              <span className="ts-result-badge">RESULT</span>
              <span className="ts-result-confidence">Confidence 98.4%</span>
            </div>
            <div className="ts-result-headline">{currentLayer.resultTitle}</div>
            <div className="ts-result-body">{currentLayer.resultBody}</div>
            <div className="ts-result-stat-row">
              <span>{currentLayer.deltaLabel}</span>
              <span className="ts-result-stat-val">{currentLayer.deltaVal}</span>
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="ts-slider-wrap">
            <div className="ts-slider-label">
              <span>Overlay opacity</span>
              <span>{overlayOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="ts-range-slider"
            />
          </div>
        </div>

        {/* Bottom Docked Action Buttons */}
        <div className="ts-inspector-actions">
          <button
            type="button"
            className="ts-btn-action-primary"
            onClick={handleCreateReport}
          >
            <FileText size={16} />
            <span>Create report</span>
          </button>
          <button
            type="button"
            className="ts-btn-action-secondary"
            onClick={() => navigate('/change-detection')}
          >
            <Calendar size={15} />
            <span>Compare dates</span>
          </button>
        </div>
      </aside>

      {/* 3. Discovered Sentinel-2 Scenes Modal Dialog */}
      {showSceneModal && (
        <div className="ts-modal-backdrop" onClick={() => setShowSceneModal(false)}>
          <div className="ts-scene-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="ts-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--ts-mint-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ts-forest)',
                  }}
                >
                  <Satellite size={18} />
                </div>
                <div>
                  <h3 className="ts-modal-title">Discovered Sentinel-2 Passes</h3>
                  <div style={{ fontSize: 11.5, color: 'var(--ts-text-muted)' }}>
                    Copernicus Level-2A imagery clipped to your {areaKm2} km&sup2; area
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="ts-modal-close-btn"
                onClick={() => setShowSceneModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="ts-modal-filters">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ts-forest)', textTransform: 'uppercase' }}>
                  WINDOW:
                </span>
                {['30days', '90days', 'Q1 2026'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`ts-date-preset-chip ${datePreset === preset ? 'active' : ''}`}
                    onClick={() => {
                      setDatePreset(preset);
                      handleSearchScenes(preset);
                    }}
                  >
                    {preset === '30days' ? 'Last 30 Days' : preset === '90days' ? 'Last 90 Days' : 'Q1 2026'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="ts-btn-primary"
                style={{ padding: '6px 14px', fontSize: 12, height: 32, borderRadius: 'var(--ts-radius-full)' }}
                onClick={() => handleSearchScenes(datePreset)}
                disabled={isSearchingScenes}
              >
                <RefreshCw size={12} className={isSearchingScenes ? 'spin' : ''} />
                <span>{isSearchingScenes ? 'Querying...' : 'Re-query'}</span>
              </button>
            </div>

            {/* Scene Cards List */}
            <div className="ts-scene-list">
              {isSearchingScenes ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ts-text-muted)' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto', color: 'var(--ts-forest)' }} />
                  <div style={{ fontWeight: 600, color: 'var(--ts-forest)', fontSize: 14 }}>
                    Querying European Space Agency catalog via Google Earth Engine...
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Searching cloud-filtered Level-2A surface reflectance tiles for this bounding box.
                  </div>
                </div>
              ) : searchError ? (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: 14, borderRadius: 10, color: '#DC2626', fontSize: 13 }}>
                  {searchError}
                </div>
              ) : scenes && scenes.length > 0 ? (
                scenes.map((scene) => {
                  const isSelected = selectedScene?.id === scene.id;
                  const isCleanest = scene.cloud_pct < 5.0;
                  return (
                    <div
                      key={scene.id}
                      className={`ts-scene-card-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectScene(scene)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: isSelected ? 'var(--ts-forest)' : 'var(--ts-bg-subtle)',
                            color: isSelected ? '#FFFFFF' : 'var(--ts-forest)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ts-forest)' }}>
                            {scene.date}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ts-text-muted)' }}>
                            ID: {scene.id.slice(0, 24)}...
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isCleanest && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: '#FEF3C7',
                              color: '#B45309',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Award size={12} /> Cleanest
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            padding: '4px 10px',
                            borderRadius: 'var(--ts-radius-full)',
                            background: scene.cloud_pct <= 10 ? 'var(--ts-mint-subtle)' : '#FEF3C7',
                            color: scene.cloud_pct <= 10 ? 'var(--ts-emerald)' : '#B45309',
                          }}
                        >
                          {scene.cloud_pct.toFixed(1)}% Cloud
                        </span>

                        <button
                          type="button"
                          className={isSelected ? 'ts-btn-primary' : 'ts-btn-secondary'}
                          style={{ height: 32, padding: '0 12px', fontSize: 12, borderRadius: 'var(--ts-radius-full)' }}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ts-text-muted)' }}>
                  <Cloud size={28} style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
                  <div style={{ fontWeight: 600, color: 'var(--ts-forest)' }}>
                    No satellite scenes queried yet for this bounding box.
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Click &ldquo;Re-query&rdquo; above to fetch all Sentinel-2 passes from Earth Engine.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkbenchPage;
