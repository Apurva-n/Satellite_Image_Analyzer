import React, { useState } from 'react';
import { X, Globe2, Sparkles, Layers, GitCompare, Cpu, ArrowRight, Check } from 'lucide-react';

const QuickGuideModal = ({ isOpen, onClose, onSelectPreset }) => {
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'Welcome to Satellite Vision',
      title: 'Earth Intelligence Made Simple',
      subtitle: 'Experience true optical satellite imagery from the European Space Agency Sentinel-2 constellation, processed in real time via Google Earth Engine.',
      icon: <Globe2 size={36} className="text-cyan-400" />,
      features: [
        { title: '10-Meter Sharp Resolution', desc: 'Every pixel represents a 10m x 10m patch on the Earth\'s surface.' },
        { title: 'Multispectral Light Bands', desc: 'See beyond human vision using Near-Infrared to measure chlorophyll and moisture.' },
        { title: 'Zero Clutter, 1-Click Presets', desc: 'No need to enter complicated coordinates. Just pick a location and explore.' }
      ]
    },
    {
      badge: '3 Powerful Exploration Modes',
      title: 'Choose What You Want to Discover',
      subtitle: 'Seamlessly toggle between environmental health, historical changes, and machine learning classification.',
      icon: <Layers size={36} className="text-emerald-400" />,
      features: [
        {
          title: '🌿 Spectral Vision',
          desc: 'Inspect natural true color, active crop health (NDVI), lake water (NDWI), and concrete infrastructure (NDBI).'
        },
        {
          title: '⏱️ Time Machine (Change Detection)',
          desc: 'Compare two dates to immediately measure deforestation, flood expansion, or wildfire burn severity.'
        },
        {
          title: '🧠 AI Land Scanner',
          desc: 'An automated computer vision model classifies the terrain into Water, Forest, Crops, Urban, and Barren soil.'
        }
      ]
    },
    {
      badge: 'How to Get Started in 5 Seconds',
      title: 'Pick a Famous Landmark to Test',
      subtitle: 'Click any of these world-famous locations to instantly load live satellite observations:',
      icon: <Sparkles size={36} className="text-amber-400" />,
      quickPicks: true
    }
  ];

  const current = slides[slide];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close Guide">
          <X size={18} />
        </button>

        <div className="modal-header">
          <span className="modal-pill-badge">{current.badge}</span>
          <div className="modal-icon-wrapper">{current.icon}</div>
          <h2 className="modal-title">{current.title}</h2>
          <p className="modal-subtitle">{current.subtitle}</p>
        </div>

        <div className="modal-body">
          {current.features && (
            <div className="features-list">
              {current.features.map((feat, idx) => (
                <div key={idx} className="feature-item">
                  <div className="feature-check">
                    <Check size={14} />
                  </div>
                  <div className="feature-text">
                    <h4>{feat.title}</h4>
                    <p>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {current.quickPicks && (
            <div className="quick-picks-grid">
              <button
                type="button"
                className="quick-pick-card"
                onClick={() => {
                  onSelectPreset('pune');
                  onClose();
                }}
              >
                <span className="pick-icon">📍</span>
                <div className="pick-info">
                  <h4>Pune City & Reservoirs</h4>
                  <span>India • Western Ghats</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-pick-card"
                onClick={() => {
                  onSelectPreset('dubai');
                  onClose();
                }}
              >
                <span className="pick-icon">🏝️</span>
                <div className="pick-info">
                  <h4>Dubai Palm Jumeirah</h4>
                  <span>UAE • Coastal Islands</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-pick-card"
                onClick={() => {
                  onSelectPreset('grand_canyon');
                  onClose();
                }}
              >
                <span className="pick-icon">🏜️</span>
                <div className="pick-info">
                  <h4>Grand Canyon</h4>
                  <span>USA • Colorado River</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-pick-card"
                onClick={() => {
                  onSelectPreset('venice');
                  onClose();
                }}
              >
                <span className="pick-icon">🌊</span>
                <div className="pick-info">
                  <h4>Venice Lagoon</h4>
                  <span>Italy • Historic Canals</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="slide-indicators">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`slide-dot ${i === slide ? 'active' : ''}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>

          <div className="modal-actions">
            {slide > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSlide(slide - 1)}
              >
                Back
              </button>
            )}

            {slide < slides.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSlide(slide + 1)}
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
              >
                Start Exploring Now <Sparkles size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickGuideModal;
