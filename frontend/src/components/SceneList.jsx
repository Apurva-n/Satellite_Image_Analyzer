import React from 'react';
import { Calendar, Cloud, Award, CheckCircle2, ChevronRight, Layers } from 'lucide-react';

const SceneList = ({ scenes, selectedScene, onSelectScene, isSearching }) => {
  if (isSearching) {
    return (
      <div className="scene-list-card skeleton-pulse">
        <div className="scene-loading-flex">
          <div className="spinner"></div>
          <span>Scanning Sentinel-2 constellation orbits...</span>
        </div>
      </div>
    );
  }

  if (!scenes || scenes.length === 0) {
    return null;
  }

  // Find scene with minimum cloud cover
  const clearestScene = scenes.reduce(
    (prev, curr) => (curr.cloud_pct < prev.cloud_pct ? curr : prev),
    scenes[0]
  );

  const getCloudBadgeStyle = (pct) => {
    if (pct < 10) return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    if (pct < 25) return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
  };

  return (
    <div className="scene-list-card">
      <div className="scene-list-header">
        <div className="scene-header-left">
          <Layers size={16} className="text-cyan-400" />
          <h4>Satellite Passes Found</h4>
          <span className="count-badge">{scenes.length}</span>
        </div>

        {clearestScene && (
          <button
            type="button"
            className="clearest-pick-btn"
            onClick={() => onSelectScene(clearestScene)}
            title="Auto-select lowest cloud pass"
          >
            <Award size={13} className="text-amber-400" />
            <span>Best ({clearestScene.cloud_pct}% Clouds)</span>
          </button>
        )}
      </div>

      <div className="scene-chips-track">
        {scenes.map((scene) => {
          const isSelected = selectedScene && selectedScene.id === scene.id;
          const isClearest = clearestScene && clearestScene.id === scene.id;
          const cloudStyle = getCloudBadgeStyle(scene.cloud_pct);

          return (
            <button
              key={scene.id}
              type="button"
              className={`scene-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectScene(scene)}
            >
              <div className="scene-chip-header">
                <div className="scene-date-group">
                  <Calendar size={13} className="text-slate-400" />
                  <span className="scene-date-text">{scene.date}</span>
                </div>
                {isClearest && <span className="clearest-star-tag">★ Clearest</span>}
              </div>

              <div className="scene-chip-bottom">
                <span
                  className="cloud-pill-tag"
                  style={{
                    backgroundColor: cloudStyle.bg,
                    color: cloudStyle.text,
                    borderColor: cloudStyle.border,
                  }}
                >
                  <Cloud size={11} />
                  <span>{scene.cloud_pct}% Clouds</span>
                </span>

                {isSelected && (
                  <div className="selected-indicator-dot">
                    <CheckCircle2 size={13} className="text-cyan-400" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SceneList;
