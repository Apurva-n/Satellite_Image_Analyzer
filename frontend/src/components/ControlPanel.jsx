import React, { useState } from 'react';
import {
  Calendar,
  Cloud,
  MapPin,
  Search,
  RefreshCw,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

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
  scenesCount = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Compute approximate area in km2
  const getAreaKm2 = () => {
    if (!bbox || bbox.length !== 4) return null;
    const [w, s, e, n] = bbox;
    const latMid = (s + n) / 2;
    const kmPerDegLat = 111.0;
    const kmPerDegLon = 111.0 * Math.cos((latMid * Math.PI) / 180);
    const widthKm = Math.abs(e - w) * kmPerDegLon;
    const heightKm = Math.abs(n - s) * kmPerDegLat;
    return Math.round(widthKm * heightKm);
  };

  const area = getAreaKm2();

  return (
    <div className="search-control-card">
      {/* Current Area Status Banner */}
      <div className="location-status-banner">
        <div className="location-meta">
          <div className="location-icon-circle">
            <MapPin size={16} className="text-cyan-400" />
          </div>
          <div className="location-titles">
            <span className="location-tag">Target Area</span>
            <h4 className="location-heading">
              {area ? `Selected Region (~${area} km²)` : 'No Area Selected'}
            </h4>
          </div>
        </div>

        {bbox && (
          <button
            type="button"
            className="clear-btn-chip"
            onClick={() => onBBoxChange(null)}
            title="Clear current area"
          >
            <X size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {!bbox && (
        <div className="aoi-helper-prompt">
          <p>Draw a rectangle on the map or pick one of the landmark presets above to inspect satellite imagery.</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onBBoxChange(PUNE_PRESET_BBOX)}
          >
            <Sparkles size={14} /> Load Pune Sample Area
          </button>
        </div>
      )}

      {/* Main Search Action */}
      <div className="search-action-row">
        <button
          type="button"
          className="btn btn-primary btn-search-hero"
          onClick={onSearch}
          disabled={!bbox || isSearching}
        >
          {isSearching ? (
            <>
              <RefreshCw size={17} className="spin" />
              <span>Querying Sentinel-2 Catalog...</span>
            </>
          ) : (
            <>
              <Search size={17} />
              <span>{scenesCount > 0 ? 'Refresh Passes' : 'Search Satellite Passes'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          className={`btn btn-secondary filter-toggle-btn ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Adjust search dates and maximum cloud percentage"
        >
          <SlidersHorizontal size={15} />
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Collapsible Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters-drawer">
          <div className="filter-dates-grid">
            <div className="input-group">
              <label htmlFor="start-date" className="filter-label">
                <Calendar size={13} /> Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label htmlFor="end-date" className="filter-label">
                <Calendar size={13} /> End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="filter-slider-group">
            <div className="slider-header-flex">
              <span className="filter-label">
                <Cloud size={13} /> Max Cloud Filter
              </span>
              <span className="slider-pct-badge">{maxCloudPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={maxCloudPct}
              onChange={(e) => setMaxCloudPct(Number(e.target.value))}
              className="cloud-slider"
            />
            <div className="slider-hints">
              <span>0% (Pristine)</span>
              <span>20% (Recommended)</span>
              <span>100% (Any)</span>
            </div>
          </div>
        </div>
      )}

      {/* Errors & Empty States */}
      {searchError && (
        <div className="error-callout">
          <AlertCircle size={16} />
          <p>{searchError}</p>
        </div>
      )}

      {zeroResultsFound && (
        <div className="warning-callout">
          <AlertCircle size={16} />
          <div>
            <strong>No Low-Cloud Passes Found</strong>
            <p>During monsoon or winter cloudiness, try increasing the Cloud Cover slider to 30% or selecting dry-season months (Jan–April).</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
