import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
