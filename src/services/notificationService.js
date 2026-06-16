import api from './api';

/**
 * Dịch vụ thông báo — dùng chung axios instance (đã tự đính kèm token + xử lý 401/403).
 * baseURL đã có sẵn '/api/v1' nên ở đây chỉ dùng đường dẫn tương đối.
 */
export const notificationService = {
  getNotifications: (page = 0, size = 10) =>
    api.get('/notification/get-all', { params: { page, size } }),
  markRead: (id) => api.put(`/notification/${id}/read`),
  markAllRead: () => api.put('/notification/read-all'),
};

export default notificationService;
