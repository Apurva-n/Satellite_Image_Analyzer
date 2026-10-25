import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage to all outgoing requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('terrascope_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ==========================================
// AUTHENTICATION & CLOUD DATABASE ENDPOINTS
// ==========================================

export const loginUser = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (payload) => {
  const response = await apiClient.post('/api/auth/register', payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
};

export const updateProfile = async (payload) => {
  const response = await apiClient.put('/api/auth/profile', payload);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await apiClient.put('/api/auth/change-password', payload);
  return response.data;
};

export const getDatabaseStatus = async () => {
  const response = await apiClient.get('/api/auth/database-status');
  return response.data;
};

export const getCloudReports = async () => {
  const response = await apiClient.get('/api/cloud/reports');
  return response.data;
};

export const saveCloudReport = async (payload) => {
  const response = await apiClient.post('/api/cloud/reports', payload);
  return response.data;
};

export const getCloudReport = async (reportId) => {
  const response = await apiClient.get(`/api/cloud/reports/${reportId}`);
  return response.data;
};

export const deleteCloudReport = async (reportId) => {
  const response = await apiClient.delete(`/api/cloud/reports/${reportId}`);
  return response.data;
};

export const getCloudBookmarks = async () => {
  const response = await apiClient.get('/api/cloud/bookmarks');
  return response.data;
};

export const createCloudBookmark = async (payload) => {
  const response = await apiClient.post('/api/cloud/bookmarks', payload);
  return response.data;
};

export const deleteCloudBookmark = async (bookmarkId) => {
  const response = await apiClient.delete(`/api/cloud/bookmarks/${bookmarkId}`);
  return response.data;
};

export const searchScenes = async (bbox, startDate, endDate, maxCloudPct = 20.0) => {
  const response = await apiClient.post('/search-scenes', {
    bbox,
    start_date: startDate,
    end_date: endDate,
    max_cloud_pct: parseFloat(maxCloudPct),
  });
  return response.data;
};

export const getThumbnail = async (sceneId, bbox) => {
  const response = await apiClient.post('/get-thumbnail', {
    scene_id: sceneId,
    bbox,
  });
  return response.data;
};

export const getSpectralIndex = async (sceneId, bbox, layerType = 'TRUE_COLOR') => {
  const response = await apiClient.post('/get-spectral-index', {
    scene_id: sceneId,
    bbox,
    layer_type: layerType,
  });
  return response.data;
};

export const analyzeChange = async (sceneIdBefore, sceneIdAfter, bbox, changeType = 'VEGETATION') => {
  const response = await apiClient.post('/analyze-change', {
    scene_id_before: sceneIdBefore,
    scene_id_after: sceneIdAfter,
    bbox,
    change_type: changeType,
  });
  return response.data;
};

export const analyzeLandCover = async (sceneId, bbox, modelType = 'CLOUD_GEE') => {
  const response = await apiClient.post('/analyze-landcover', {
    scene_id: sceneId,
    bbox,
    model_type: modelType,
  });
  return response.data;
};

export const getTimeSeries = async (bbox, months = 12, indexType = 'NDVI') => {
  const response = await apiClient.post('/get-timeseries', {
    bbox,
    months: parseInt(months, 10),
    index_type: indexType,
  });
  return response.data;
};

export const getDownloadUrl = async (bbox, sceneId = null, layerType = 'TRUE_COLOR', format = 'GEO_TIFF') => {
  const response = await apiClient.post('/get-download-url', {
    bbox,
    scene_id: sceneId,
    layer_type: layerType,
    format,
  });
  return response.data;
};

export const generateAIReport = async (payload) => {
  const response = await apiClient.post('/generate-ai-report', payload);
  return response.data;
};

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
