import React from 'react';
import {
  Sparkles,
  ExternalLink,
  Activity,
  Layers,
  Info,
  TrendingUp,
  Droplets,
  Trees,
  Building2,
  Flame,
  Globe2,
} from 'lucide-react';

const SPECTRAL_MODES = [
  {
    id: 'TRUE_COLOR',
    name: 'Natural True Color',
    badge: 'Visible Light',
    icon: <Globe2 size={18} className="text-cyan-400" />,
    desc: 'Atmospheric-corrected true-color photographic view mimicking human vision.',
  },
  {
    id: 'NDVI',
    name: 'Plant & Crop Health',
    badge: 'Vegetation (NDVI)',
    icon: <Trees size={18} className="text-emerald-400" />,
    desc: 'Calculates active chlorophyll absorption. Vibrant green = dense crops & trees.',
  },
  {
    id: 'NDWI',
    name: 'Water Bodies & Moisture',
    badge: 'Water (NDWI)',
    icon: <Droplets size={18} className="text-blue-400" />,
    desc: 'Exploits high NIR absorption by water to map lakes, rivers, and wetlands.',
  },
  {
    id: 'NDBI',
    name: 'Urban & Concrete Grid',
    badge: 'Built-up (NDBI)',
    icon: <Building2 size={18} className="text-rose-400" />,
    desc: 'Detects high SWIR reflectance from concrete, tarmac roads, and buildings.',
  },
  {
    id: 'NBR',
    name: 'Wildfire Burn Scars',
    badge: 'Burn Severity (NBR)',
    icon: <Flame size={18} className="text-amber-400" />,
    desc: 'Highlights scorched earth and canopy damage following wildfires.',
  },
  {
    id: 'FALSE_COLOR',
    name: 'Infrared Biomass',
    badge: 'Near-Infrared Composite',
    icon: <Sparkles size={18} className="text-purple-400" />,
    desc: 'Maps Near-Infrared light to red. Healthy foliage reflects intensely as red.',
  },
];

const ThumbnailViewer = ({
  selectedScene,
  thumbnailUrl,
  isLoadingThumbnail,
  thumbnailError,
  activeLayer = 'TRUE_COLOR',
  onSelectLayer,
  spectralData,
}) => {
  if (!selectedScene) {
    return (
      <div className="empty-panel-prompt">
        <div className="prompt-icon-ring">
          <Layers size={24} className="text-cyan-400" />
        </div>
        <h4>Select a Satellite Pass Above</h4>
        <p>Pick any date to load live multispectral analysis for your chosen area.</p>
      </div>
    );
  }

  const activeModeObj = SPECTRAL_MODES.find((m) => m.id === activeLayer) || SPECTRAL_MODES[0];
  const stats = spectralData?.stats;

  return (
    <div className="spectral-vision-panel">
      {/* Active Layer Description Banner */}
      <div className="active-mode-banner">
        <div className="banner-left">
          <div className="banner-icon-box">{activeModeObj.icon}</div>
          <div>
            <h3 className="banner-title">{activeModeObj.name}</h3>
            <span className="banner-badge">{activeModeObj.badge}</span>
          </div>
        </div>
        {isLoadingThumbnail && (
          <div className="live-calculating-pill">
            <span className="pulsing-dot" />
            <span>Processing Cloud Raster...</span>
          </div>
        )}
      </div>

      <p className="banner-description">{activeModeObj.desc}</p>

      {/* Grid of Spectral Vision Modes */}
      <div className="modes-selection-grid">
        {SPECTRAL_MODES.map((mode) => {
          const isSelected = activeLayer === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              className={`mode-select-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectLayer(mode.id)}
              disabled={isLoadingThumbnail}
            >
              <div className="mode-card-top">
                <div className="mode-card-icon">{mode.icon}</div>
                <span className="mode-card-badge">{mode.badge}</span>
              </div>
              <span className="mode-card-name">{mode.name}</span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {thumbnailError && (
        <div className="error-callout">
          <p>{thumbnailError}</p>
        </div>
      )}

      {/* Zonal Scientific Metrics Card */}
      {stats && (
        <div className="stats-glass-card">
          <div className="stats-header">
            <div className="stats-title-wrap">
              <TrendingUp size={16} className="text-emerald-400" />
              <h4>Zonal Environmental Metrics</h4>
            </div>
            {stats.category && (
              <span className="stats-pill-badge">{stats.category}</span>
            )}
          </div>

          <div className="stats-metrics-row">
            <div className="metric-metric-box">
              <span className="metric-label">Mean Index</span>
              <span className="metric-number">
                {stats.mean_val !== null && stats.mean_val !== undefined
                  ? stats.mean_val.toFixed(3)
                  : 'N/A'}
              </span>
            </div>

            <div className="metric-metric-box">
              <span className="metric-label">Min Val</span>
              <span className="metric-number">
                {stats.min_val !== null && stats.min_val !== undefined
                  ? stats.min_val.toFixed(2)
                  : 'N/A'}
              </span>
            </div>

            <div className="metric-metric-box">
              <span className="metric-label">Max Val</span>
              <span className="metric-number">
                {stats.max_val !== null && stats.max_val !== undefined
                  ? stats.max_val.toFixed(2)
                  : 'N/A'}
              </span>
            </div>
          </div>

          {/* Distribution Breakdown Bars */}
          {stats.distribution && Object.keys(stats.distribution).length > 0 && (
            <div className="distribution-bars-container">
              <span className="distribution-label">Land Surface Distribution:</span>
              <div className="dist-items-list">
                {Object.entries(stats.distribution).map(([cat, pct]) => (
                  <div key={cat} className="dist-item-row">
                    <div className="dist-info">
                      <span className="dist-name">{cat}</span>
                      <span className="dist-pct">{pct}%</span>
                    </div>
                    <div className="dist-track">
                      <div
                        className="dist-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          backgroundColor:
                            cat.includes('Dense') || cat.includes('Canopy')
                              ? '#10b981'
                              : cat.includes('Water')
                              ? '#06b6d4'
                              : cat.includes('Urban')
                              ? '#ef4444'
                              : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThumbnailViewer;
