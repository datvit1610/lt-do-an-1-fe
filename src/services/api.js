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

function notifyForbidden() {
  // Không đủ quyền → hiển thị popup global (GlobalAlert lắng nghe event này)
  window.dispatchEvent(new CustomEvent('app:forbidden', {
    detail: { message: 'Không có quyền truy cập, vui lòng liên hệ Admin hệ thống.' },
  }));
}

// Handle 401 / 403 globally
api.interceptors.response.use(
  (res) => {
    // BE trả HTTP 200 nhưng body có code = 403 khi không đủ quyền
    if (res?.data?.code === 403) notifyForbidden();
    return res;
  },
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem('hust_user');
      localStorage.removeItem('hust_token');
      window.location.href = '/login';
    } else if (status === 403 || err.response?.data?.code === 403) {
      notifyForbidden();
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

// ---- Loan endpoints (Danh sách phiếu mượn) ----
export const loanService = {
  getAllForUser: (params) => api.get('/loan/get-all-for-user', { params }),
  getAll: (params) => api.get('/loan/get-all', { params }),
  create: (payload) => api.post('/loan/create', payload),
  update: (loanId, payload) => api.post(`/loan/update/${loanId}`, payload),
  delete: (loanId) => api.post(`/loan/delete/${loanId}`),
  export: () => api.get('/loan/export'),
};

// ---- Class period endpoints (Danh sách tiết học) ----
export const classPeriodService = {
  getAll: (params) => api.get('/class-period/get-all', { params }),
  create: (payload) => api.post('/class-period/create', payload),
  update: (id, payload) => api.post(`/class-period/update/${id}`, payload),
  delete: (id) => api.post(`/class-period/delete/${id}`),
};

// ---- Loan config endpoints (Cấu hình mượn trả) ----
export const loanConfigService = {
  get: () => api.get('/loan-config/get'),
  set: (lateThresholdMinutes) => api.post('/loan-config/set', { lateThresholdMinutes }),
};

// ---- Dashboard endpoints ----
export const dashboardService = {
  overview: (params) => api.get('/dashboard/overview', { params }),
  top5Devices: (params) => api.get('/dashboard/top5-devices', { params }),
  loanStatusStats: (params) => api.get('/dashboard/loan-status-stats', { params }),
  loanTrend: (params) => api.get('/dashboard/loan-trend', { params }),
  deviceTypeStats: (params) => api.get('/dashboard/device-type-stats', { params }),
  topBorrowers: (params) => api.get('/dashboard/top-borrowers', { params }),
};

// ---- Device endpoints (Danh sách thiết bị) ----
export const deviceService = {
  getAll: (params) => api.get('/device/get-all', { params }),
  select: (params) => api.get('/device/select', { params }),
  create: (payload) => api.post('/device/create', payload),
  update: (deviceId, payload) => api.post(`/device/update/${deviceId}`, payload),
  delete: (deviceId) => api.post(`/device/delete/${deviceId}`),
};

// ---- Device type endpoints (Cấu hình loại thiết bị) ----
export const deviceTypeService = {
  getAll: (params) => api.get('/device-type/get-all', { params }),
  select: () => api.get('/device-type/select'),
  create: (payload) => api.post('/device-type/create', payload),
  update: (id, payload) => api.post(`/device-type/update/${id}`, payload),
  delete: (id) => api.post(`/device-type/delete/${id}`),
};

export default api;
