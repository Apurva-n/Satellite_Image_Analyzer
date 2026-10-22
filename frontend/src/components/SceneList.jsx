import React from 'react';
import { Layers, Calendar, Cloud, CheckCircle, ChevronRight, Award } from 'lucide-react';

const SceneList = ({ scenes, selectedScene, onSelectScene, isSearching }) => {
  if (isSearching) {
    return (
      <div className="scene-list-card card">
        <div className="loading-placeholder">
          <div className="spinner"></div>
          <p>Querying Copernicus Sentinel-2 catalog via Earth Engine...</p>
        </div>
      </div>
    );
  }

  if (!scenes || scenes.length === 0) {
    return null;
  }

  // Find scene with minimum cloud cover
  const cleanestScene = scenes.reduce((prev, curr) =>
    curr.cloud_pct < prev.cloud_pct ? curr : prev,
    scenes[0]
  );

  const getCloudBadgeClass = (pct) => {
    if (pct < 10) return 'badge-success';
    if (pct < 30) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="scene-list-card card">
      <div className="scene-list-header">
        <div className="title-with-count">
          <Layers size={18} className="icon-accent" />
          <h3>Available Satellite Passes</h3>
          <span className="count-pill">{scenes.length}</span>
        </div>
        {cleanestScene && (
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onSelectScene(cleanestScene)}
            title="Auto-select lowest cloud pass"
          >
            <Award size={13} /> Select Clearest ({cleanestScene.cloud_pct}%)
          </button>
        )}
      </div>

      <div className="scene-items-container">
        {scenes.map((scene) => {
          const isSelected = selectedScene && selectedScene.id === scene.id;
          return (
            <div
              key={scene.id}
              className={`scene-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectScene(scene)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectScene(scene);
              }}
            >
              <div className="scene-info-left">
                <div className="scene-date">
                  <Calendar size={14} />
                  <span>{scene.date}</span>
                </div>
                <div className="scene-id-code" title={scene.id}>
                  {scene.id}
                </div>
              </div>

              <div className="scene-info-right">
                <div className={`badge ${getCloudBadgeClass(scene.cloud_pct)}`}>
                  <Cloud size={12} />
                  <span>{scene.cloud_pct}% cloud</span>
                </div>
                {isSelected ? (
                  <CheckCircle size={18} className="selected-icon" />
                ) : (
                  <ChevronRight size={16} className="chevron-icon" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SceneList;
