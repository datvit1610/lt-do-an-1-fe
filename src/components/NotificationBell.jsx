import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';
import './NotificationBell.css';

/* Định dạng thời gian tương đối: "5 phút trước" */
function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((Date.now() - then) / 1000); // giây
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(value).toLocaleDateString('vi-VN');
}

const isUnread = (n) => !(n.read ?? n.isRead ?? n.readAt);

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  /* Toast khi có thông báo mới */
  const [toast, setToast] = useState(null);          // { count } | null
  const prevUnread = useRef(unreadCount);
  const toastTimer = useRef(null);

  useEffect(() => {
    // Khi polling phát hiện unreadCount tăng so với lần trước → hiện toast
    if (unreadCount > prevUnread.current) {
      const diff = unreadCount - prevUnread.current;
      setToast({ count: diff });
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 4000); // tự ẩn sau 4s
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* Đóng dropdown khi click ra ngoài */
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleItemClick(n) {
    if (isUnread(n)) markRead(n.id);
    setOpen(false);
    navigate('/phieu-muon-tra');
  }

  const items = notifications.slice(0, 10);

  return (
    <div className="notif" ref={ref}>
      <button className="notif__btn" aria-label="Thông báo" onClick={() => setOpen(v => !v)}>
        <IconBell />
        {unreadCount > 0 && (
          <span className="notif__badge">{unreadCount >= 10 ? '9+' : unreadCount}</span>
        )}
      </button>

      {toast && (
        <div className="notif__toast">🔔 Bạn có {toast.count} thông báo mới</div>
      )}

      {open && (
        <div className="notif__dropdown">
          <div className="notif__head">
            <span className="notif__title">Thông báo</span>
            {unreadCount > 0 && <span className="notif__count">{unreadCount} mới</span>}
          </div>

          <div className="notif__list">
            {items.length === 0 ? (
              <div className="notif__empty">Không có thông báo</div>
            ) : (
              items.map((n) => {
                const unread = isUnread(n);
                return (
                  <div
                    key={n.id}
                    className={`notif__item ${unread ? 'notif__item--unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="notif__icon"><IconBell size={18} /></div>
                    <div className="notif__body">
                      <div className="notif__item-title">{n.title || 'Thông báo'}</div>
                      {(n.message || n.content) && (
                        <div className="notif__item-msg">{n.message || n.content}</div>
                      )}
                      <div className="notif__time">{timeAgo(n.createdAt ?? n.createdDate ?? n.time)}</div>
                    </div>
                    {unread && <span className="notif__dot" />}
                  </div>
                );
              })
            )}
          </div>

          {items.length > 0 && (
            <div className="notif__footer">
              <button
                className="notif__mark-all"
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                Đánh dấu tất cả đã đọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBell({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
