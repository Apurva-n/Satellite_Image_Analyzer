import React from 'react';
import { Image as ImageIcon, ExternalLink, Sliders, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const ThumbnailViewer = ({
  selectedScene,
  thumbnailUrl,
  isLoadingThumbnail,
  thumbnailError,
  showOverlay,
  setShowOverlay,
  overlayOpacity,
  setOverlayOpacity,
}) => {
  if (!selectedScene) {
    return (
      <div className="thumbnail-card card empty-state">
        <ImageIcon size={36} className="empty-icon" />
        <h4>No Scene Selected</h4>
        <p>Choose a satellite pass from the list above to view real true-color imagery.</p>
      </div>
    );
  }

  return (
    <div className="thumbnail-card card">
      <div className="thumbnail-header">
        <div className="title-with-icon">
          <ImageIcon size={18} className="icon-accent" />
          <h3>Sentinel-2 True Color (RGB)</h3>
        </div>
        {thumbnailUrl && (
          <a
            href={thumbnailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-xs"
            title="Open high-res image in new tab"
          >
            <ExternalLink size={13} /> Fullscreen
          </a>
        )}
      </div>

      {isLoadingThumbnail ? (
        <div className="thumbnail-loading">
          <div className="spinner"></div>
          <p>Generating true-color composite from Earth Engine server...</p>
          <span className="sub-text">Bands: Red (B4), Green (B3), Blue (B2)</span>
        </div>
      ) : thumbnailError ? (
        <div className="alert alert-error">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>Thumbnail Generation Failed</strong>
            <p>{thumbnailError}</p>
          </div>
        </div>
      ) : thumbnailUrl ? (
        <div className="thumbnail-body">
          <div className="image-frame">
            <img
              src={thumbnailUrl}
              alt={`Sentinel-2 pass on ${selectedScene.date}`}
              className="thumbnail-img"
            />
            <div className="image-overlay-pill">
              <span>{selectedScene.date}</span> &bull; <span>{selectedScene.cloud_pct}% cloud</span>
            </div>
          </div>

          {/* Map Overlay Controls */}
          <div className="overlay-controls">
            <div className="toggle-row">
              <label className="toggle-label" htmlFor="toggle-overlay-checkbox">
                <input
                  id="toggle-overlay-checkbox"
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => setShowOverlay(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {showOverlay ? (
                    <>
                      <Eye size={14} /> Map Overlay Active
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} /> Map Overlay Hidden
                    </>
                  )}
                </span>
              </label>
            </div>

            {showOverlay && (
              <div className="opacity-slider-row">
                <div className="opacity-label">
                  <Sliders size={13} />
                  <span>Overlay Opacity: {Math.round(overlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="slider slider-sm"
                />
              </div>
            )}
          </div>

          <div className="scene-meta-table">
            <div className="meta-row">
              <span className="meta-k">Date:</span>
              <span className="meta-v">{selectedScene.date}</span>
            </div>
            <div className="meta-row">
              <span className="meta-k">Cloud Cover:</span>
              <span className="meta-v">{selectedScene.cloud_pct}%</span>
            </div>
            <div className="meta-row">
              <span className="meta-k">Scene ID:</span>
              <span className="meta-v monospace" title={selectedScene.id}>
                {selectedScene.id}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ThumbnailViewer;
