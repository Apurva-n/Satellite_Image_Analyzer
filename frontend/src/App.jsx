import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import ControlPanel from './components/ControlPanel';
import SceneList from './components/SceneList';
import ThumbnailViewer from './components/ThumbnailViewer';
import { searchScenes, getThumbnail, checkHealth } from './services/api';
import { Satellite, Activity, CheckCircle2, XCircle } from 'lucide-react';
import './App.css';

function App() {
  // BBox format: [lon_min, lat_min, lon_max, lat_max]
  const [bbox, setBbox] = useState(null);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-03-31');
  const [maxCloudPct, setMaxCloudPct] = useState(20);

  // Scenes & Results
  const [scenes, setScenes] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [zeroResultsFound, setZeroResultsFound] = useState(false);

  // Selected Scene & Thumbnail
  const [selectedScene, setSelectedScene] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(null);

  // Map Overlay controls
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.9);

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState('checking');

  // Verify backend connectivity on load
  useEffect(() => {
    const pingBackend = async () => {
      try {
        const res = await checkHealth();
        if (res.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (err) {
        console.warn('Backend not responding at http://localhost:8000', err);
        setBackendStatus('offline');
      }
    };
    pingBackend();
  }, []);

  // Search scenes handler
  const handleSearch = async () => {
    if (!bbox) return;

    setIsSearching(true);
    setSearchError(null);
    setZeroResultsFound(false);
    setSelectedScene(null);
    setThumbnailUrl(null);
    setThumbnailError(null);

    try {
      const results = await searchScenes(bbox, startDate, endDate, maxCloudPct);
      setScenes(results);

      if (results.length === 0) {
        setZeroResultsFound(true);
      } else {
        // Auto-select the scene with minimum cloud cover
        const bestScene = results.reduce((prev, curr) =>
          curr.cloud_pct < prev.cloud_pct ? curr : prev,
          results[0]
        );
        handleSelectScene(bestScene, bbox);
      }
    } catch (err) {
      console.error('Search failed:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to connect to Earth Engine backend. Ensure backend server is running.';
      setSearchError(msg);
    } finally {
      setIsSearching(false);
    }
  };

  // Select scene and load its thumbnail
  const handleSelectScene = async (scene, currentBbox = bbox) => {
    setSelectedScene(scene);
    if (!currentBbox) return;

    setIsLoadingThumbnail(true);
    setThumbnailError(null);

    try {
      const data = await getThumbnail(scene.id, currentBbox);
      setThumbnailUrl(data.thumbnail_url);
    } catch (err) {
      console.error('Thumbnail fetch failed:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to generate thumbnail from Earth Engine.';
      setThumbnailError(msg);
    } finally {
      setIsLoadingThumbnail(false);
    }
  };

  const handleBBoxChange = (newBbox) => {
    setBbox(newBbox);
    // If bbox is removed, reset results
    if (!newBbox) {
      setScenes([]);
      setSelectedScene(null);
      setThumbnailUrl(null);
      setZeroResultsFound(false);
      setSearchError(null);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <Satellite className="logo-icon" size={26} />
            <div className="brand-titles">
              <h1>Satellite Image Analyzer</h1>
              <span className="badge-tag">Sentinel-2 &bull; Google Earth Engine</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className={`status-indicator ${backendStatus}`}>
            {backendStatus === 'connected' ? (
              <>
                <CheckCircle2 size={14} />
                <span>Backend Online (EE Ready)</span>
              </>
            ) : backendStatus === 'checking' ? (
              <>
                <Activity size={14} className="spin" />
                <span>Connecting to Backend...</span>
              </>
            ) : (
              <>
                <XCircle size={14} />
                <span>Backend Offline (Port 8000)</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="app-main">
        {/* Left Column: Interactive Map */}
        <section className="map-section">
          <MapComponent
            bbox={bbox}
            onBBoxChange={handleBBoxChange}
            thumbnailUrl={thumbnailUrl}
            showOverlay={showOverlay}
            overlayOpacity={overlayOpacity}
          />
        </section>

        {/* Right Column: Controls, Scene Picker & Image Viewer */}
        <aside className="sidebar-section">
          <ControlPanel
            bbox={bbox}
            onBBoxChange={handleBBoxChange}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            maxCloudPct={maxCloudPct}
            setMaxCloudPct={setMaxCloudPct}
            onSearch={handleSearch}
            isSearching={isSearching}
            searchError={searchError}
            zeroResultsFound={zeroResultsFound}
          />

          <SceneList
            scenes={scenes}
            selectedScene={selectedScene}
            onSelectScene={(scene) => handleSelectScene(scene)}
            isSearching={isSearching}
          />

          <ThumbnailViewer
            selectedScene={selectedScene}
            thumbnailUrl={thumbnailUrl}
            isLoadingThumbnail={isLoadingThumbnail}
            thumbnailError={thumbnailError}
            showOverlay={showOverlay}
            setShowOverlay={setShowOverlay}
            overlayOpacity={overlayOpacity}
            setOverlayOpacity={setOverlayOpacity}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;
