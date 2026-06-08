import React, { useState, useEffect } from 'react';

/**
 * Popup thông báo dùng chung toàn ứng dụng.
 * Lắng nghe event 'app:forbidden' (phát từ interceptor axios khi gặp lỗi 403)
 * và hiển thị thông báo không có quyền truy cập.
 */
export default function GlobalAlert() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    function handleForbidden(e) {
      setMessage(e.detail?.message || 'Không có quyền truy cập, vui lòng liên hệ Admin hệ thống.');
    }
    window.addEventListener('app:forbidden', handleForbidden);
    return () => window.removeEventListener('app:forbidden', handleForbidden);
  }, []);

  if (!message) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMessage('')}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal__head">
          <span className="modal__title">Thông báo</span>
          <button className="modal__close btn" onClick={() => setMessage('')}>×</button>
        </div>
        <div className="modal__body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff0f2', color: '#c8102e', fontSize: '1.2rem', fontWeight: 700,
            }}>!</span>
            <p style={{ color: '#374151', margin: 0, lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div className="modal__footer">
          <button className="btn btn--primary" onClick={() => setMessage('')}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}
