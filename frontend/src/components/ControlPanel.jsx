import React from 'react';
import { Calendar, Cloud, MapPin, Search, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

const PUNE_PRESET_BBOX = [73.75, 18.45, 73.95, 18.60];

const ControlPanel = ({
  bbox,
  onBBoxChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  maxCloudPct,
  setMaxCloudPct,
  onSearch,
  isSearching,
  searchError,
  zeroResultsFound,
}) => {
  const handleUsePreset = () => {
    onBBoxChange(PUNE_PRESET_BBOX);
  };

  const handleClearBBox = () => {
    onBBoxChange(null);
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <h2>Area & Search Controls</h2>
        <p className="subtitle">Select an area on the map and find real Sentinel-2 satellite passes.</p>
      </div>

      {/* AOI Card */}
      <div className="panel-section card">
        <div className="section-title">
          <MapPin size={18} className="icon-accent" />
          <h3>Area of Interest (AOI)</h3>
        </div>

        {bbox ? (
          <div className="bbox-details">
            <div className="bbox-grid">
              <div className="coord-item">
                <span className="coord-label">Lon Min:</span>
                <span className="coord-val">{bbox[0]}</span>
              </div>
              <div className="coord-item">
                <span className="coord-label">Lat Min:</span>
                <span className="coord-val">{bbox[1]}</span>
              </div>
              <div className="coord-item">
                <span className="coord-label">Lon Max:</span>
                <span className="coord-val">{bbox[2]}</span>
              </div>
              <div className="coord-item">
                <span className="coord-label">Lat Max:</span>
                <span className="coord-val">{bbox[3]}</span>
              </div>
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearBBox}
              >
                Clear Selection
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-aoi-prompt">
            <p>No area selected yet. Draw a rectangle on the map using the toolbar on the left.</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleUsePreset}
            >
              <Sparkles size={14} /> Load Pune Sample AOI
            </button>
          </div>
        )}
      </div>

      {/* Date Range Section */}
      <div className="panel-section card">
        <div className="section-title">
          <Calendar size={18} className="icon-accent" />
          <h3>Date Range</h3>
        </div>
        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="start-date">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="input-group">
            <label htmlFor="end-date">End Date</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Cloud Cover Slider */}
      <div className="panel-section card">
        <div className="section-title">
          <Cloud size={18} className="icon-accent" />
          <div className="slider-header">
            <h3>Max Cloud Cover</h3>
            <span className="slider-badge">{maxCloudPct}%</span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={maxCloudPct}
          onChange={(e) => setMaxCloudPct(Number(e.target.value))}
          className="slider"
        />

        <div className="slider-presets">
          <button
            type="button"
            className={`chip ${maxCloudPct === 10 ? 'active' : ''}`}
            onClick={() => setMaxCloudPct(10)}
          >
            &lt; 10%
          </button>
          <button
            type="button"
            className={`chip ${maxCloudPct === 20 ? 'active' : ''}`}
            onClick={() => setMaxCloudPct(20)}
          >
            &lt; 20% (Default)
          </button>
          <button
            type="button"
            className={`chip ${maxCloudPct === 50 ? 'active' : ''}`}
            onClick={() => setMaxCloudPct(50)}
          >
            &lt; 50%
          </button>
          <button
            type="button"
            className={`chip ${maxCloudPct === 80 ? 'active' : ''}`}
            onClick={() => setMaxCloudPct(80)}
          >
            &lt; 80% (Monsoon)
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="panel-actions">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={onSearch}
          disabled={!bbox || isSearching}
        >
          {isSearching ? (
            <>
              <RefreshCw size={16} className="spin" /> Searching Earth Engine...
            </>
          ) : (
            <>
              <Search size={16} /> Search Satellite Scenes
            </>
          )}
        </button>
        {!bbox && (
          <span className="hint-text text-center">
            * Draw an area on the map or click 'Load Pune Sample AOI' to search
          </span>
        )}
      </div>

      {/* Feedback & Alerts */}
      {zeroResultsFound && (
        <div className="alert alert-warning">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>No Low-Cloud Scenes Found</strong>
            <p>
              Earth Engine returned 0 scenes for this area and date range. Consider widening your date
              range or increasing the cloud cover slider (e.g. &lt; 80% during rainy/monsoon seasons).
            </p>
          </div>
        </div>
      )}

      {searchError && (
        <div className="alert alert-error">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>Backend Error</strong>
            <p>{searchError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
