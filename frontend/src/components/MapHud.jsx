import React, { useState } from 'react';
import { Eye, EyeOff, Sliders, ExternalLink, Info, ChevronUp, ChevronDown, Layers, MapPin } from 'lucide-react';

const MapHud = ({
  thumbnailUrl,
  showOverlay,
  setShowOverlay,
  overlayOpacity,
  setOverlayOpacity,
  activeLayer = 'TRUE_COLOR',
  spectralData,
  bbox,
  activeMode,
}) => {
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  if (!thumbnailUrl) return null;

  // Approximate area in km2 from bbox
  const getApproxArea = () => {
    if (!bbox || bbox.length !== 4) return null;
    const [w, s, e, n] = bbox;
    const latMid = (s + n) / 2;
    const kmPerDegLat = 111.0;
    const kmPerDegLon = 111.0 * Math.cos((latMid * Math.PI) / 180);
    const widthKm = Math.abs(e - w) * kmPerDegLon;
    const heightKm = Math.abs(n - s) * kmPerDegLat;
    return Math.round(widthKm * heightKm);
  };

  const approxKm2 = getApproxArea();

  const getLegendInfo = () => {
    if (activeMode === 'LANDCOVER') {
      return {
        title: '5-Class AI Land Cover',
        items: [
          { color: '#419bdf', label: 'Water Bodies' },
          { color: '#2d6a4f', label: 'Dense Forest' },
          { color: '#70e000', label: 'Cropland & Agriculture' },
          { color: '#d90429', label: 'Urban & Concrete' },
          { color: '#ddb892', label: 'Barren Soil & Rock' },
        ],
      };
    }
    if (activeMode === 'CHANGE') {
      return {
        title: 'Bi-Temporal Difference Heatmap',
        items: [
          { color: '#d90429', label: 'Severe Negative Impact / Loss' },
          { color: '#ffd166', label: 'Moderate Shift' },
          { color: '#06d6a0', label: 'Positive Growth / Regreening' },
        ],
      };
    }
    // Spectral Vision
    switch (activeLayer) {
      case 'NDVI':
        return {
          title: 'Plant Health & Chlorophyll (NDVI)',
          gradient: 'linear-gradient(to right, #a50026, #f46d43, #fee08b, #d9ef8b, #66bd63, #006837)',
          minLabel: 'Sparse / Barren (-0.2)',
          maxLabel: 'Dense Healthy Forest (+0.8)',
        };
      case 'NDWI':
        return {
          title: 'Water Index (NDWI)',
          gradient: 'linear-gradient(to right, #ffffd4, #fed98e, #fe9929, #d95f0e, #993404, #08519c)',
          minLabel: 'Dry Soil (-0.8)',
          maxLabel: 'Deep Water (+0.4)',
        };
      case 'NDBI':
        return {
          title: 'Built-up Concrete Index (NDBI)',
          gradient: 'linear-gradient(to right, #0000ff, #00ffff, #ffff00, #ff0000)',
          minLabel: 'Vegetation (-0.4)',
          maxLabel: 'Dense Concrete (+0.5)',
        };
      default:
        return {
          title: 'Natural Surface Reflectance (RGB)',
          items: [
            { color: '#388bfd', label: 'Atmospheric Harmonized Level-2A' },
          ],
        };
    }
  };

  const legend = getLegendInfo();

  return (
    <div className="map-hud-container">
      {/* Expanded Legend Drawer */}
      {isLegendOpen && (
        <div className="map-legend-drawer">
          <div className="legend-drawer-header">
            <span className="legend-title">{legend.title}</span>
            <button
              type="button"
              className="legend-close-pill"
              onClick={() => setIsLegendOpen(false)}
            >
              Close
            </button>
          </div>

          {legend.gradient ? (
            <div className="legend-gradient-wrap">
              <div className="legend-gradient-bar" style={{ background: legend.gradient }} />
              <div className="legend-range-labels">
                <span>{legend.minLabel}</span>
                <span>{legend.maxLabel}</span>
              </div>
            </div>
          ) : (
            <div className="legend-classes-grid">
              {legend.items?.map((item, i) => (
                <div key={i} className="legend-class-chip">
                  <span className="legend-color-dot" style={{ backgroundColor: item.color }} />
                  <span className="legend-chip-label">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Floating HUD Bar */}
      <div className="map-hud-bar">
        {/* Layer Visibility Toggle */}
        <button
          type="button"
          className={`hud-btn ${showOverlay ? 'active' : ''}`}
          onClick={() => setShowOverlay(!showOverlay)}
          title={showOverlay ? 'Hide Satellite Layer' : 'Show Satellite Layer'}
        >
          {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{showOverlay ? 'Layer Active' : 'Hidden'}</span>
        </button>

        <div className="hud-divider" />

        {/* Opacity Slider */}
        <div className="hud-slider-group" title="Adjust Satellite Layer Transparency">
          <Sliders size={14} className="hud-slider-icon" />
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            className="hud-slider"
          />
          <span className="hud-slider-val">{Math.round(overlayOpacity * 100)}%</span>
        </div>

        <div className="hud-divider" />

        {/* Legend Button */}
        <button
          type="button"
          className={`hud-btn ${isLegendOpen ? 'active' : ''}`}
          onClick={() => setIsLegendOpen(!isLegendOpen)}
        >
          <Layers size={15} />
          <span>Legend</span>
          {isLegendOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {approxKm2 && (
          <>
            <div className="hud-divider" />
            <div className="hud-area-badge">
              <MapPin size={13} className="text-cyan-400" />
              <span>~{approxKm2} km²</span>
            </div>
          </>
        )}

        <div className="hud-divider" />

        {/* High-Res Fullscreen Link */}
        <a
          href={thumbnailUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hud-btn hud-link"
          title="Open high-resolution satellite raster in new tab"
        >
          <ExternalLink size={15} />
          <span>High-Res</span>
        </a>
      </div>
    </div>
  );
};

export default MapHud;
