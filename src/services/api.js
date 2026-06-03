import axios from 'axios';

// const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8088/api/v1';
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
  resetPassword: (oldPassword, newPassword) =>
    api.post('/reset-password', { oldPassword, newPassword }),
};

// ---- Role endpoints ----
export const roleService = {
  select: () => api.get('/role/select'),
  getAll: (params = { page: 0, size: 100 }) => api.get('/role/get-all', { params }),
  create: (payload) => api.post('/role/create', payload),
  update: (roleId, payload) => api.post(`/role/update/${roleId}`, payload),
  delete: (roleId) => api.post(`/role/delete/${roleId}`),
};

// ---- Permission endpoints ----
export const permissionService = {
  getAll: () => api.get('/permission/get-all'),
};

// ---- User endpoints ----
export const userService = {
  create: (payload) => api.post('/user/create', payload),
  getAll: (params) => api.get('/user/get-all', { params }),
  update: (userId, payload) => api.post(`/user/update/${userId}`, payload),
  remove: (userId) => api.post(`/user/delete/${userId}`),
};

// ---- Equipment endpoints ----
export const equipmentService = {
  getAll: (params) => api.get('/equipment/get-all', { params }),
  create: (payload) => api.post('/equipment/create', payload),
  update: (equipmentId, payload) => api.post(`/equipment/update/${equipmentId}`, payload),
  delete: (equipmentId) => api.post(`/equipment/delete/${equipmentId}`),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/equipment/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  export: () => api.get('/equipment/export'),
};

// ---- Borrow/Return Receipt endpoints ----
export const receiptService = {
  getAll: (params) => api.get('/receipt/get-all', { params }),
  create: (payload) => api.post('/receipt/create', payload),
  update: (receiptId, payload) => api.post(`/receipt/update/${receiptId}`, payload),
  delete: (receiptId) => api.post(`/receipt/delete/${receiptId}`),
  export: () => api.get('/receipt/export'),
};

export default api;
