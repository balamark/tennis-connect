import axios from 'axios';

// Set up axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://tennis-connect-backend-552905514167.us-central1.run.app/api'
    : 'http://localhost:8080/api');

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if this is a bulletin API call - allow components to handle this gracefully
      const isBulletinAPI = error.config?.url?.includes('/bulletins');
      
      if (!isBulletinAPI) {
        // Token expired or invalid for other APIs - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
        window.location.href = '/login';
      }
      // For bulletin API, let the component handle the error and show mock data
    }
    return Promise.reject(error);
  }
);

export default api; 