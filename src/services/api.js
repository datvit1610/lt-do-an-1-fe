import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://113.161.103.134:8070/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hust_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hust_user');
      localStorage.removeItem('hust_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Auth endpoints ----
export const authService = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/profile'),
};

export default api;
