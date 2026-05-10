import axios from 'axios';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}/eduschedule-pro/backend/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;