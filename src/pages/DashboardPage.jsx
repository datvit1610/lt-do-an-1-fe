import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: '16px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px 56px',
        boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
        maxWidth: '480px',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--hust-navy)', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '1.8rem',
        }}>✓</div>
        <h1 style={{ color: 'var(--hust-navy)', fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>
          Đăng nhập thành công!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Xin chào, <strong>{user?.name || user?.username || 'Người dùng'}</strong>.<br />
          Dashboard đang được xây dựng...
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 28px',
            background: 'var(--hust-red)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
