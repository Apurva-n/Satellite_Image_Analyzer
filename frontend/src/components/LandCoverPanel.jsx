import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  ExternalLink,
  RefreshCw,
  PieChart,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trees,
  Droplets,
  Building2,
  Wheat,
  Mountain,
} from 'lucide-react';
import { analyzeLandCover } from '../services/api';

const CLASS_ICONS = {
  0: <Droplets size={16} className="text-blue-400" />,
  1: <Trees size={16} className="text-emerald-500" />,
  2: <Wheat size={16} className="text-lime-400" />,
  3: <Building2 size={16} className="text-rose-500" />,
  4: <Mountain size={16} className="text-amber-300" />,
};

const LandCoverPanel = ({
  scenes,
  selectedScene,
  bbox,
  onApplyLandCoverOverlay,
}) => {
  const [sceneId, setSceneId] = useState(
    selectedScene ? selectedScene.id : (scenes && scenes.length > 0 ? scenes[0].id : '')
  );

  const [isClassifying, setIsClassifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [result, setResult] = useState(null);

  const formatSceneLabel = (scene) => {
    if (!scene) return '';
    return `📅 ${scene.date} • ${Math.round(100 - scene.cloud_pct)}% Clear Sky`;
  };

  const handleRunSegmentation = async () => {
    const activeBbox = bbox && bbox.length === 4 ? bbox : [73.75, 18.45, 73.95, 18.60];
    const targetScene = sceneId || (selectedScene ? selectedScene.id : '');

    if (!targetScene) {
      setErrorMsg('Please select a satellite pass first.');
      return;
    }

    setIsClassifying(true);
    setErrorMsg(null);

    try {
      const data = await analyzeLandCover(targetScene, activeBbox);
      setResult(data);
      if (onApplyLandCoverOverlay) {
        onApplyLandCoverOverlay(data.thumbnail_url);
      }
    } catch (err) {
      console.error('Land cover classification failed:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to run Land Cover segmentation in Earth Engine.';
      setErrorMsg(msg);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="landcover-scanner-view">
      {/* Header Banner */}
      <div className="panel-instruction-card">
        <div className="instruction-header">
          <Cpu size={18} className="text-purple-400" />
          <h3>AI Land Cover Scanner</h3>
        </div>
        <p className="instruction-text">
          Our multispectral classification engine analyzes surface reflectance across 6 satellite wavelengths to classify every pixel into 5 terrain types.
        </p>
      </div>

      {/* Target Scene Selector & Trigger */}
      <div className="scanner-control-card">
        <label className="picker-label">Select Satellite Pass to Scan</label>

        {(!scenes || scenes.length === 0) ? (
          <div className="empty-scenes-notice">
            <p>Please select an area on the map or pick a preset above to load satellite imagery.</p>
          </div>
        ) : (
          <div className="scanner-actions-group">
            <select
              className="select-dropdown"
              value={sceneId || (selectedScene ? selectedScene.id : '')}
              onChange={(e) => setSceneId(e.target.value)}
            >
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatSceneLabel(s)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-action-glow btn-block"
              onClick={handleRunSegmentation}
              disabled={isClassifying || !scenes || scenes.length === 0}
            >
              {isClassifying ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Segmenting 10m Ground Pixels...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Scan & Map Land Cover</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="error-callout">
          <AlertTriangle size={16} />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="results-glass-card">
          <div className="results-header">
            <div className="results-title-group">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <h4>Terrain Classification Results</h4>
            </div>
            <span className="results-pill">5 LULC Classes</span>
          </div>

          {/* Dominant Class Spotlight */}
          <div className="dominant-spotlight-box">
            <div className="dominant-left">
              <span className="dominant-tag">Dominant Landscape</span>
              <h3 className="dominant-name">{result.dominant_class}</h3>
            </div>
            <div className="dominant-right">
              <span className="total-area-label">Total AOI Area</span>
              <span className="total-area-val">{result.total_aoi_km2.toFixed(1)} km²</span>
            </div>
          </div>

          {/* 5-Class Detailed Breakdown List */}
          <div className="classes-breakdown-list">
            <span className="breakdown-headline">Surface Composition Breakdown:</span>

            {result.classes?.map((cls) => {
              const icon = CLASS_ICONS[cls.id] || <Layers size={16} />;
              return (
                <div key={cls.id} className="class-row-card">
                  <div className="class-row-header">
                    <div className="class-name-wrap">
                      <span className="class-dot" style={{ backgroundColor: cls.color }} />
                      <div className="class-icon-wrapper">{icon}</div>
                      <span className="class-title">{cls.name}</span>
                    </div>

                    <div className="class-stats-numbers">
                      <span className="class-km2">{cls.area_km2.toFixed(2)} km²</span>
                      <span className="class-percent">({cls.percent}%)</span>
                    </div>
                  </div>

                  <div className="class-progress-track">
                    <div
                      className="class-progress-bar"
                      style={{
                        width: `${Math.min(100, Math.max(0, cls.percent))}%`,
                        backgroundColor: cls.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="results-banner-tip">
            <Sparkles size={14} className="text-cyan-400" />
            <span>Interactive 5-color land use map is now displayed over the satellite terrain.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandCoverPanel;
