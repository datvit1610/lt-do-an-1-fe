import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function HoSo() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [pwModal, setPwModal] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const profile = {
    name: user?.fullName || user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phoneNumber || user?.phone || '',
    role: user?.position || user?.role || '',
  };

  const initials = (profile.name || profile.username || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleChangePw() {
    setPwError('');
    if (!pw.current || !pw.next || !pw.confirm) { setPwError('Vui lòng điền đầy đủ thông tin.'); return; }
    if (pw.next.length < 6) { setPwError('Mật khẩu mới phải ít nhất 6 ký tự.'); return; }
    if (pw.next !== pw.confirm) { setPwError('Mật khẩu xác nhận không khớp.'); return; }

    setPwLoading(true);
    try {
      const res = await authService.resetPassword(pw.current, pw.next);
      const response = res.data;
      if (response?.success === false) {
        setPwError(response?.message || 'Đổi mật khẩu không thành công.');
        return;
      }
      setPwSuccess(true);
      // Đổi mật khẩu thành công: xóa token và bắt đăng nhập lại
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      const serverData = err.response?.data;
      setPwError(serverData?.message || 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Thông tin tài khoản</h1>
          <p className="page-subtitle">Tài khoản đang đăng nhập.</p>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          {/* Profile header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f0f2f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="avatar avatar--lg" style={{ width: 60, height: 60, fontSize: '1.3rem', background: '#c8102e' }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#1a1f2e' }}>{profile.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 2 }}>{profile.role}</div>
              </div>
            </div>
            {hasPermission('change-pass') && (
              <button className="btn btn--outline" onClick={() => setPwModal(true)}>
                <IconKey /> Đổi mật khẩu
              </button>
            )}
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
            <InfoRow label="Họ tên" value={profile.name} />
            <InfoRow label="Số điện thoại" value={profile.phone} />
            <InfoRow label="Tên đăng nhập" value={profile.username} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Vai trò" value={profile.role} highlight />
          </div>
        </div>
      </div>

      {/* Change password modal */}
      {pwModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPwModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal__head">
              <span className="modal__title">Đổi mật khẩu</span>
              <button className="modal__close btn" onClick={() => setPwModal(false)}><IconX /></button>
            </div>
            <div className="modal__body">
              {pwSuccess ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#059669' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
                  <div style={{ fontWeight: 600 }}>Đổi mật khẩu thành công!</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 6 }}>Vui lòng đăng nhập lại...</div>
                </div>
              ) : (
                <>
                  {['current', 'next', 'confirm'].map((key) => (
                    <div className="field" key={key}>
                      <label>
                        {key === 'current' ? 'Mật khẩu hiện tại' : key === 'next' ? 'Mật khẩu mới' : 'Xác nhận mật khẩu mới'} *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input"
                          type={showPw[key] ? 'text' : 'password'}
                          style={{ width: '100%', paddingRight: 40 }}
                          placeholder={key === 'current' ? 'Nhập mật khẩu hiện tại' : key === 'next' ? 'Tối thiểu 6 ký tự' : 'Nhập lại mật khẩu mới'}
                          value={pw[key]}
                          onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}
                        >
                          {showPw[key] ? <IconEyeOff /> : <IconEye />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {pwError && (
                    <div style={{ padding: '10px 14px', background: '#fff0f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c8102e', fontSize: '0.84rem' }}>
                      {pwError}
                    </div>
                  )}
                </>
              )}
            </div>
            {!pwSuccess && (
              <div className="modal__footer">
                <button className="btn btn--outline" onClick={() => setPwModal(false)} disabled={pwLoading}>Hủy</button>
                <button className="btn btn--primary" onClick={handleChangePw} disabled={pwLoading}>
                  {pwLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: highlight ? '#c8102e' : '#1a1f2e' }}>{value || '—'}</div>
    </div>
  );
}

function IconKey() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconEye() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function IconEyeOff() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
