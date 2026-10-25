import React, { useState } from 'react';
import {
  GitCompare,
  TrendingDown,
  Droplets,
  Flame,
  Sprout,
  Play,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Info,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { analyzeChange } from '../services/api';

const CHANGE_MODES = [
  {
    id: 'VEGETATION',
    label: 'Vegetation Dynamics',
    badge: 'Forests & Crops (ΔNDVI)',
    icon: <Sprout size={18} className="text-emerald-400" />,
    desc: 'Tracks agricultural harvesting, tree clearing, seasonal drought, or re-greening.',
  },
  {
    id: 'WATER_FLOOD',
    label: 'Flood & Water Inundation',
    badge: 'Hydrology (ΔNDWI)',
    icon: <Droplets size={18} className="text-cyan-400" />,
    desc: 'Identifies newly submerged land, flood expansion, and seasonal dam filling.',
  },
  {
    id: 'BURN_SEVERITY',
    label: 'Wildfire Burn Severity',
    badge: 'Fire Damage (ΔNBR)',
    icon: <Flame size={18} className="text-amber-400" />,
    desc: 'Assesses fire scorch damage, ash scars, and forest canopy destruction.',
  },
];

const ChangeDetectionPanel = ({
  scenes,
  bbox,
  onApplyChangeOverlay,
}) => {
  const [sceneBefore, setSceneBefore] = useState(scenes && scenes.length > 0 ? scenes[0].id : '');
  const [sceneAfter, setSceneAfter] = useState(scenes && scenes.length > 1 ? scenes[scenes.length - 1].id : '');
  const [changeType, setChangeType] = useState('VEGETATION');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [changeError, setChangeError] = useState(null);
  const [changeResult, setChangeResult] = useState(null);

  // Helper to format human-readable scene date
  const formatSceneLabel = (scene) => {
    if (!scene) return '';
    return `📅 ${scene.date} • ${Math.round(100 - scene.cloud_pct)}% Clear Sky`;
  };

  const handleRunAnalysis = async () => {
    const activeBbox = bbox && bbox.length === 4 ? bbox : [73.75, 18.45, 73.95, 18.60];

    if (!sceneBefore || !sceneAfter) {
      setChangeError('Please select both a baseline date and a comparison date.');
      return;
    }

    if (sceneBefore === sceneAfter) {
      setChangeError('Please select two different satellite passes to detect change over time.');
      return;
    }

    setIsAnalyzing(true);
    setChangeError(null);

    try {
      const res = await analyzeChange(sceneBefore, sceneAfter, activeBbox, changeType);
      setChangeResult(res);
      if (onApplyChangeOverlay) {
        onApplyChangeOverlay(res.thumbnail_url);
      }
    } catch (err) {
      console.error('Change detection error:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to run bi-temporal change analysis.';
      setChangeError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeModeObj = CHANGE_MODES.find((m) => m.id === changeType) || CHANGE_MODES[0];

  return (
    <div className="change-detection-view">
      <div className="panel-instruction-card">
        <div className="instruction-header">
          <GitCompare size={18} className="text-cyan-400" />
          <h3>Time Machine (Bi-Temporal Analysis)</h3>
        </div>
        <p className="instruction-text">
          Compare two distinct satellite passes to measure environmental shifts, harvesting, or disaster impacts down to the exact square kilometer.
        </p>
      </div>

      {/* Impact Type Selector Cards */}
      <div className="change-type-grid">
        {CHANGE_MODES.map((m) => {
          const isSelected = changeType === m.id;
          return (
            <button
              key={m.id}
              type="button"
              className={`change-type-card ${isSelected ? 'active' : ''}`}
              onClick={() => setChangeType(m.id)}
            >
              <div className="change-card-top">
                <div className="change-icon-box">{m.icon}</div>
                <span className="change-badge">{m.badge}</span>
              </div>
              <h4 className="change-label">{m.label}</h4>
              <p className="change-desc">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Date Pickers (Before and After) */}
      <div className="time-comparator-card">
        <h4 className="comparator-title">Select Comparison Dates</h4>

        {(!scenes || scenes.length < 2) ? (
          <div className="empty-scenes-notice">
            <p>Please search for a region above with at least 2 satellite passes to run change detection.</p>
          </div>
        ) : (
          <div className="date-selectors-row">
            <div className="date-picker-box">
              <label className="picker-label">
                <span className="step-tag">T1</span> Earlier Baseline Pass
              </label>
              <select
                className="select-dropdown"
                value={sceneBefore}
                onChange={(e) => setSceneBefore(e.target.value)}
              >
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSceneLabel(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="date-picker-box">
              <label className="picker-label">
                <span className="step-tag">T2</span> Later Monitoring Pass
              </label>
              <select
                className="select-dropdown"
                value={sceneAfter}
                onChange={(e) => setSceneAfter(e.target.value)}
              >
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSceneLabel(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-action-glow btn-block"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing || !scenes || scenes.length < 2}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw size={16} className="spin" />
              <span>Analyzing Pixels in Cloud...</span>
            </>
          ) : (
            <>
              <Play size={16} />
              <span>Run Environmental Change Analysis</span>
            </>
          )}
        </button>
      </div>

      {changeError && (
        <div className="error-callout">
          <AlertTriangle size={16} />
          <p>{changeError}</p>
        </div>
      )}

      {/* Analysis Results Card */}
      {changeResult && (
        <div className="results-glass-card">
          <div className="results-header">
            <div className="results-title-group">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <h4>{changeResult.title}</h4>
            </div>
            <span className="results-pill">{changeResult.change_type}</span>
          </div>

          <p className="results-summary">{changeResult.summary}</p>

          <div className="results-metrics-grid">
            <div className="result-metric-card highlighted">
              <span className="res-label">Impacted / Shift Area</span>
              <div className="res-big-number">
                {changeResult.impacted_area_km2.toFixed(2)}{' '}
                <span className="res-unit">km²</span>
              </div>
              <span className="res-sub">Affected Land Surface</span>
            </div>

            <div className="result-metric-card">
              <span className="res-label">Impact Percentage</span>
              <div className="res-big-number text-amber-400">
                {changeResult.percent_impacted.toFixed(1)}{' '}
                <span className="res-unit">%</span>
              </div>
              <span className="res-sub">Of Total Monitored AOI</span>
            </div>

            <div className="result-metric-card">
              <span className="res-label">Total Region Area</span>
              <div className="res-big-number text-slate-300">
                {changeResult.total_aoi_km2.toFixed(1)}{' '}
                <span className="res-unit">km²</span>
              </div>
              <span className="res-sub">Bounding Box Span</span>
            </div>
          </div>

          <div className="results-banner-tip">
            <Sparkles size={14} className="text-cyan-400" />
            <span>The difference heatmap is now displayed live on your map canvas.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeDetectionPanel;
