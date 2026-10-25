import React from 'react';
import { LOCATION_PRESETS } from '../utils/presets';
import { Compass, Sparkles } from 'lucide-react';

const PresetSelector = ({ activePresetId, onSelectPreset }) => {
  return (
    <div className="preset-selector-container">
      <div className="preset-header">
        <div className="preset-title">
          <Sparkles size={14} className="text-amber-400" />
          <span>Quick Landmark Presets</span>
        </div>
        <span className="preset-hint">1-click instant load</span>
      </div>

      <div className="preset-scroll-track">
        {LOCATION_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`preset-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset)}
              title={preset.description}
            >
              <span className="preset-emoji">{preset.icon}</span>
              <div className="preset-texts">
                <span className="preset-name">{preset.name}</span>
                <span className="preset-country">{preset.country}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PresetSelector;
