import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import HustLogo from '../components/HustLogo';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(form.username.trim(), form.password);
      const response = res.data;
      const data = response?.data;

      if (response?.success === false || response?.code === 400) {
        setError(response?.message || 'Đăng nhập không thành công.');
        return;
      }

      if (!data?.accessToken) {
        throw new Error('Không nhận được accessToken từ server.');
      }

      login({ username: form.username.trim() }, data.accessToken, data.refreshToken);

      const profileRes = await authService.profile();
      const profileData = profileRes.data?.data;
      if (profileData) {
        login(profileData, data.accessToken, data.refreshToken);
      }

      navigate('/dashboard');
    } catch (err) {
      const serverData = err.response?.data;
      const msg =
        err.response?.status === 401
          ? 'Tên đăng nhập hoặc mật khẩu không đúng.'
          : serverData?.message || serverData?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-root">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg__mesh" />
        <div className="login-bg__particles">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="particle" style={{ '--i': i }} />
          ))}
        </div>
        <div className="login-bg__grid" />
      </div>

      {/* ---- Left: Brand panel ---- */}
      <div className="login-brand">
        <div className="login-brand__inner">
          {/* Logo */}
          <div className="login-brand__badge">
            <HustLogo size={110} />
          </div>

          <h1 className="login-brand__title">
            Đại học<br />Bách Khoa<br />Hà Nội
          </h1>

          <div className="login-brand__divider" />

          <p className="login-brand__subtitle">
            Hệ thống Quản lý<br />
            Thiết bị &amp; Dụng cụ<br />
            Học tập
          </p>

          <div className="login-brand__tags">
            <span className="tag">Phòng thí nghiệm</span>
            <span className="tag">Thiết bị học tập</span>
            <span className="tag">Quản lý tài sản</span>
          </div>

          {/* Stats */}
          <div className="login-brand__stats">
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Phòng lab</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">2000+</span>
              <span className="stat-label">Thiết bị</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Cán bộ</span>
            </div>
          </div>
        </div>

        {/* Building decoration */}
        <div className="login-brand__building" aria-hidden="true">
          <svg viewBox="0 0 500 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="150" y="50" width="200" height="110" fill="white" opacity="0.04"/>
            {[170,190,210,230,250,270,290,310,330].map((x,i) => (
              <rect key={i} x={x} y="80" width="7" height="80" fill="white" opacity="0.03"/>
            ))}
            <polygon points="130,50 250,5 370,50" fill="white" opacity="0.05"/>
            <rect x="232" y="0" width="36" height="50" fill="white" opacity="0.06"/>
            <rect x="238" y="5" width="24" height="24" rx="12" fill="white" opacity="0.08"/>
            <rect x="20" y="80" width="130" height="80" fill="white" opacity="0.03"/>
            <rect x="350" y="80" width="130" height="80" fill="white" opacity="0.03"/>
            <line x1="0" y1="158" x2="500" y2="158" stroke="white" strokeWidth="1" opacity="0.1"/>
          </svg>
        </div>
      </div>

      {/* ---- Right: Login form ---- */}
      <div className="login-panel">
        <div className={`login-card ${error ? 'login-card--error' : ''}`}>
          {/* Header */}
          <div className="login-card__header">
            <div className="login-card__logo-sm">
              <HustLogo size={52} />
            </div>
            <div>
              <h2 className="login-card__title">Đăng nhập</h2>
              <p className="login-card__desc">Hệ thống quản lý thiết bị học tập</p>
            </div>
          </div>

          <div className="login-card__rule">
            <span /><span className="login-card__rule-label">HUST EMS</span><span />
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label className="form-label" htmlFor="username">Tên đăng nhập</label>
              <div className="form-input-wrap">
                <span className="form-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="username" name="username" type="text"
                  className="form-input"
                  placeholder="Nhập tên đăng nhập..."
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && passwordRef.current?.focus()}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="password">Mật khẩu</label>
              <div className="form-input-wrap">
                <span className="form-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  ref={passwordRef}
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Nhập mật khẩu..."
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button type="button" className="form-input-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="form-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className={`btn-login ${loading ? 'btn-login--loading' : ''}`} disabled={loading}>
              {loading ? (
                <><span className="btn-login__spinner" />Đang xác thực...</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          <p className="login-card__note">
            Hệ thống chỉ dành cho cán bộ được cấp tài khoản.<br />
            Liên hệ quản trị viên nếu cần hỗ trợ.
          </p>
        </div>

        <p className="login-copyright">
          © {new Date().getFullYear()} Đại học Bách Khoa Hà Nội &mdash; HUST EMS v1.0
        </p>
      </div>
    </div>
  );
}
