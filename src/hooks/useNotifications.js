import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';

const POLL_INTERVAL = 1 * 60 * 1000; // 2 phút

/* Bóc danh sách thông báo từ nhiều dạng response khác nhau */
function extractList(res) {
  const data = res?.data?.data ?? res?.data;
  if (Array.isArray(data)) return data;
  // Cấu trúc thực tế: data.items.content
  return data?.items?.content || data?.content || [];
}

/* Lấy số chưa đọc: ưu tiên field từ API, nếu không có thì tự đếm */
function extractUnread(res, list) {
  const data = res?.data?.data ?? res?.data;
  const fromApi = data?.unreadCount;
  if (typeof fromApi === 'number') return fromApi;
  return list.filter(n => !(n.read ?? n.isRead ?? n.readAt)).length;
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(0, 10);
      if (!mounted.current) return;
      const list = extractList(res);
      setNotifications(list);
      setUnreadCount(extractUnread(res, list));
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    // Cập nhật lạc quan trên UI trước
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true, isRead: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationService.markRead(id);
    } catch (err) {
      console.error('Mark read error:', err);
      fetchNotifications(); // rollback bằng cách tải lại
    }
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllRead();
    } catch (err) {
      console.error('Mark all read error:', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return { notifications, unreadCount, markRead, markAllRead, loading };
}
