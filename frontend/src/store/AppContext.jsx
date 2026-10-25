import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const STORAGE_KEY = 'SATELLITE_ANALYZER_STATE_V1';

const DEFAULT_STATE = {
  bbox: [73.75, 18.45, 73.95, 18.60], // Pune default
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  maxCloudPct: 20,
  scenes: [],
  selectedScene: null,
  activeLayer: 'TRUE_COLOR',
  spectralData: null,
  thumbnailUrl: null,
  changeResults: null,
  landCoverResults: null,
  timeSeriesResults: null,
  reports: {},
};

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_STATE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not parse saved session state', e);
    }
    return DEFAULT_STATE;
  });

  const [backendStatus, setBackendStatus] = useState('checking');
  const [latencyMs, setLatencyMs] = useState(38);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist session state', e);
    }
  }, [state]);

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const setBbox = (bbox) => updateState({ bbox });
  const setStartDate = (startDate) => updateState({ startDate });
  const setEndDate = (endDate) => updateState({ endDate });
  const setMaxCloudPct = (maxCloudPct) => updateState({ maxCloudPct });
  const setScenes = (scenes) => updateState({ scenes });
  const setSelectedScene = (selectedScene) => updateState({ selectedScene });
  const setActiveLayer = (activeLayer) => updateState({ activeLayer });
  const setSpectralData = (spectralData) => updateState({ spectralData });
  const setThumbnailUrl = (thumbnailUrl) => updateState({ thumbnailUrl });
  const setChangeResults = (changeResults) => updateState({ changeResults });
  const setLandCoverResults = (landCoverResults) => updateState({ landCoverResults });
  const setTimeSeriesResults = (timeSeriesResults) => updateState({ timeSeriesResults });

  const saveReport = (id, reportData) => {
    setState((prev) => ({
      ...prev,
      reports: {
        ...prev.reports,
        [id]: reportData,
      },
    }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        backendStatus,
        setBackendStatus,
        latencyMs,
        setLatencyMs,
        setBbox,
        setStartDate,
        setEndDate,
        setMaxCloudPct,
        setScenes,
        setSelectedScene,
        setActiveLayer,
        setSpectralData,
        setThumbnailUrl,
        setChangeResults,
        setLandCoverResults,
        setTimeSeriesResults,
        saveReport,
        updateState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
