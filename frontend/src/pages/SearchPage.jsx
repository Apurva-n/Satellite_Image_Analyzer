import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Cloud, Sliders, ChevronDown, ChevronUp, Search, RefreshCw, X, Crosshair, Sparkles, Layers, Info } from 'lucide-react';
import MapComponent from '../components/MapComponent';
import { useApp } from '../store/AppContext';
import { searchScenes } from '../services/api';
import { LOCATION_PRESETS } from '../utils/presets';

const SearchPage = () => {
  const navigate = useNavigate();
  const {
    bbox,
    setBbox,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    maxCloudPct,
    setMaxCloudPct,
    setScenes,
    setSelectedScene,
  } = useApp();

  const [activeLayer, setActiveLayer] = useState('TRUE_COLOR');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [quickDateActive, setQuickDateActive] = useState('Q1 2026');

  // Compute spatial metrics
  const getMetrics = () => {
    if (!bbox || bbox.length !== 4) return { area: 0, pixels: '~0 px' };
    const [w, s, e, n] = bbox;
    const latMid = (s + n) / 2;
    const kmPerDegLat = 111.0;
    const kmPerDegLon = 111.0 * Math.cos((latMid * Math.PI) / 180);
    const widthKm = Math.abs(e - w) * kmPerDegLon;
    const heightKm = Math.abs(n - s) * kmPerDegLat;
    const area = Number((widthKm * heightKm).toFixed(2));
    const pxX = Math.round((widthKm * 1000) / 10);
    const pxY = Math.round((heightKm * 1000) / 10);
    return { area, pixels: `~${pxX} × ${pxY} px` };
  };

  const metrics = getMetrics();

  const handleQuickDate = (presetKey) => {
    setQuickDateActive(presetKey);
    const now = new Date('2026-03-31');
    if (presetKey === '7days') {
      setStartDate('2026-03-24');
      setEndDate('2026-03-31');
    } else if (presetKey === '30days') {
      setStartDate('2026-03-01');
      setEndDate('2026-03-31');
    } else if (presetKey === 'Q1 2026') {
      setStartDate('2026-01-01');
      setEndDate('2026-03-31');
    }
  };

  const handleCenterOnMap = () => {
    // default to Pune or reset
    setBbox([73.75, 18.45, 73.95, 18.60]);
  };

  const handleClearBbox = () => {
    setBbox(null);
  };

  const handleSearchSubmit = async () => {
    if (!bbox) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchScenes(bbox, startDate, endDate, maxCloudPct);
      setScenes(results);
      if (results && results.length > 0) {
        // Auto-select cleanest
        const cleanest = results.reduce(
          (prev, curr) => (curr.cloud_pct < prev.cloud_pct ? curr : prev),
          results[0]
        );
        setSelectedScene(cleanest);
      }
      navigate('/scenes');
    } catch (err) {
      console.error('Search failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to query Sentinel-2 scenes from Earth Engine.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mc-split-view">
      {/* LEFT: Map Pane */}
      <section className="mc-map-pane">
        {/* Floating Layer View Chips (Matches screenshot: True Color, Color Infrared, NDVI, NDWI) */}
        <div className="mc-floating-layer-bar">
          <button
            type="button"
            className={`mc-layer-chip ${activeLayer === 'TRUE_COLOR' ? 'active' : ''}`}
            onClick={() => setActiveLayer('TRUE_COLOR')}
          >
            True Color (RGB)
          </button>
          <button
            type="button"
            className={`mc-layer-chip ${activeLayer === 'FALSE_COLOR' ? 'active' : ''}`}
            onClick={() => setActiveLayer('FALSE_COLOR')}
          >
            Color Infrared (NIR)
          </button>
          <button
            type="button"
            className={`mc-layer-chip ${activeLayer === 'NDVI' ? 'active' : ''}`}
            onClick={() => setActiveLayer('NDVI')}
          >
            NDVI
          </button>
          <button
            type="button"
            className={`mc-layer-chip ${activeLayer === 'NDWI' ? 'active' : ''}`}
            onClick={() => setActiveLayer('NDWI')}
          >
            NDWI
          </button>
        </div>

        {/* Floating Bottom Hint Toast */}
        <div className="mc-map-hint-toast">
          <Info size={15} className="text-cyan-400" />
          <span>Use the <strong>Rectangle tool</strong> (top left) to pan, draw, or adjust spatial boundaries.</span>
        </div>

        {/* Map Canvas */}
        <div className="mc-map-wrapper">
          <MapComponent
            bbox={bbox}
            onBBoxChange={(newBbox) => setBbox(newBbox)}
            showOverlay={false}
          />
        </div>
      </section>

      {/* RIGHT: Mission Control Parameter Sidebar */}
      <aside className="mc-sidebar-pane">
        <div className="mc-sidebar-content">
          {/* Step Tag & Heading */}
          <div className="mc-step-header">
            <span className="mc-step-badge">STEP 1 OF 3 &bull; DEFINE PARAMETERS</span>
            <span className="mc-utc-stamp">UTC TIMESTAMP</span>
          </div>

          <div className="mc-pane-title-group">
            <h2>Area & Search Controls</h2>
            <p>Select an area on the map and discover available Sentinel-2 satellite passes.</p>
          </div>

          {/* Error notice if any */}
          {searchError && (
            <div className="mc-toast-banner error">
              <span>{searchError}</span>
            </div>
          )}

          {/* CARD 1: Area of Interest (AOI) */}
          <div className="mc-glass-card">
            <div className="mc-card-header">
              <span className="mc-card-title">
                <MapPin size={15} className="text-cyan-400" /> AREA OF INTEREST (AOI)
              </span>
              <span className="mc-tag-locked">&bull; LOCKED</span>
            </div>

            {bbox ? (
              <>
                <div className="mc-coords-grid">
                  <div className="mc-coord-cell">
                    <span className="mc-coord-label">LONGITUDE_MIN</span>
                    <span className="mc-coord-val">{bbox[0].toFixed(4)}&deg; E</span>
                  </div>
                  <div className="mc-coord-cell">
                    <span className="mc-coord-label">LATITUDE_MIN</span>
                    <span className="mc-coord-val">{bbox[1].toFixed(4)}&deg; N</span>
                  </div>
                  <div className="mc-coord-cell">
                    <span className="mc-coord-label">LONGITUDE_MAX</span>
                    <span className="mc-coord-val">{bbox[2].toFixed(4)}&deg; E</span>
                  </div>
                  <div className="mc-coord-cell">
                    <span className="mc-coord-label">LATITUDE_MAX</span>
                    <span className="mc-coord-val">{bbox[3].toFixed(4)}&deg; N</span>
                  </div>
                </div>

                <div className="mc-coverage-metrics">
                  <div className="mc-metric-group">
                    <span className="mc-metric-label">SPATIAL COVERAGE</span>
                    <span className="mc-metric-val">{metrics.area} km&sup2;</span>
                  </div>
                  <div className="mc-metric-group" style={{ textAlign: 'right' }}>
                    <span className="mc-metric-label">APPROX. RESOLUTION</span>
                    <span className="mc-metric-val" style={{ color: '#F1F5F9' }}>{metrics.pixels}</span>
                  </div>
                </div>

                <div className="mc-card-actions">
                  <button type="button" className="mc-btn-link" onClick={handleClearBbox}>
                    <X size={14} /> Clear
                  </button>
                  <button type="button" className="mc-btn-link" onClick={handleCenterOnMap}>
                    <Crosshair size={14} /> Center on Map
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', color: '#94A3B8' }}>
                <p>No area selected. Draw a rectangle on the map or click below.</p>
                <button
                  type="button"
                  className="mc-chip-btn active"
                  style={{ marginTop: 10 }}
                  onClick={handleCenterOnMap}
                >
                  <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} /> Load Pune AOI
                </button>
              </div>
            )}
          </div>

          {/* CARD 2: Observation Window */}
          <div className="mc-glass-card">
            <div className="mc-card-header">
              <span className="mc-card-title">
                <Calendar size={15} className="text-cyan-400" /> OBSERVATION WINDOW
              </span>
              <span className="mc-utc-stamp">UTC TIMESTAMP</span>
            </div>

            <div className="mc-date-grid">
              <div className="mc-input-field-group">
                <span className="mc-input-label">ACQUISITION START</span>
                <input
                  type="date"
                  className="mc-date-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="mc-input-field-group">
                <span className="mc-input-label">ACQUISITION END</span>
                <input
                  type="date"
                  className="mc-date-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mc-chips-row">
              <button
                type="button"
                className={`mc-chip-btn ${quickDateActive === '7days' ? 'active' : ''}`}
                onClick={() => handleQuickDate('7days')}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className={`mc-chip-btn ${quickDateActive === '30days' ? 'active' : ''}`}
                onClick={() => handleQuickDate('30days')}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                className={`mc-chip-btn ${quickDateActive === 'Q1 2026' ? 'active' : ''}`}
                onClick={() => handleQuickDate('Q1 2026')}
              >
                Q1 2026 (Selected)
              </button>
            </div>
          </div>

          {/* CARD 3: Max Cloud Cover */}
          <div className="mc-glass-card">
            <div className="mc-slider-header">
              <span className="mc-card-title">
                <Cloud size={15} className="text-cyan-400" /> MAX CLOUD COVER
              </span>
              <span className="mc-slider-val-badge">{maxCloudPct}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              className="mc-range-slider"
              value={maxCloudPct}
              onChange={(e) => setMaxCloudPct(Number(e.target.value))}
            />

            <div className="mc-chips-row">
              <button
                type="button"
                className={`mc-chip-btn ${maxCloudPct === 10 ? 'active' : ''}`}
                onClick={() => setMaxCloudPct(10)}
              >
                &le; 10%
              </button>
              <button
                type="button"
                className={`mc-chip-btn ${maxCloudPct === 20 ? 'active' : ''}`}
                onClick={() => setMaxCloudPct(20)}
              >
                &le; 20%
              </button>
              <button
                type="button"
                className={`mc-chip-btn ${maxCloudPct === 50 ? 'active' : ''}`}
                onClick={() => setMaxCloudPct(50)}
              >
                &le; 50%
              </button>
              <button
                type="button"
                className={`mc-chip-btn ${maxCloudPct === 80 ? 'active' : ''}`}
                onClick={() => setMaxCloudPct(80)}
              >
                &le; 80%
              </button>
            </div>
          </div>

          {/* CARD 4: Collapsible Platform & Spectral Calibration */}
          <div className="mc-glass-card">
            <button
              type="button"
              className="mc-collapsible-btn"
              onClick={() => setShowCalibration(!showCalibration)}
            >
              <span className="mc-card-title">
                <Sliders size={15} className="text-cyan-400" /> PLATFORM &amp; SPECTRAL CALIBRATION
              </span>
              {showCalibration ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showCalibration && (
              <div className="mc-calibration-body">
                <p><strong>Sensor:</strong> MSI (MultiSpectral Instrument) on Sentinel-2A / Sentinel-2B.</p>
                <p><strong>Processing Level:</strong> Level-2A Bottom-Of-Atmosphere (BOA) Harmonized Surface Reflectance.</p>
                <p><strong>CRS Reprojection:</strong> EPSG:4326 (WGS84) Geodetic with GEE Pixel Reducers.</p>
              </div>
            )}
          </div>
        </div>

        {/* PINNED BOTTOM BUTTON */}
        <div className="mc-bottom-action-pinned">
          <button
            type="button"
            className="mc-btn-primary-gradient"
            onClick={handleSearchSubmit}
            disabled={!bbox || isSearching}
          >
            {isSearching ? (
              <>
                <RefreshCw size={17} className="mc-spin" />
                <span>SEARCHING SENTINEL-2 ARCHIVE...</span>
              </>
            ) : (
              <>
                <Search size={17} />
                <span>SEARCH SATELLITE SCENES</span>
              </>
            )}
          </button>
          <span className="mc-source-tagline">
            Queries Google Earth Engine Sentinel-2 Harmonized Collection
          </span>
        </div>
      </aside>
    </div>
  );
};

export default SearchPage;
