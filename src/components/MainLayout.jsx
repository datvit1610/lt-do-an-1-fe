import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HustLogo from './HustLogo';
import './MainLayout.css';

const NAV = [
  {
    group: 'TỔNG QUAN',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    ],
  },
  {
    group: 'QUẢN LÝ',
    items: [
      { to: '/thiet-bi', label: 'Quản lý thiết bị', icon: IconBox },
      { to: '/phieu-muon-tra', label: 'Phiếu mượn trả', icon: IconClipboard },
    ],
  },
  {
    group: 'HỆ THỐNG',
    items: [
      { to: '/tai-khoan/danh-sach', label: 'Danh sách tài khoản', icon: IconUsers },
      { to: '/tai-khoan/nhom-quyen', label: 'Nhóm quyền', icon: IconShield },
      { to: '/tai-khoan/ho-so', label: 'Thông tin tài khoản', icon: IconUser },
    ],
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.name || user?.username || 'A')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={`layout ${sidebarOpen ? 'layout--open' : 'layout--closed'}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__head">
          <div className="sidebar__logo">
            <HustLogo size={44} />
            <div className="sidebar__brand">
              <span className="sidebar__brand-name">HUST EMS</span>
              <span className="sidebar__brand-sub">Quản lý thiết bị</span>
            </div>
          </div>
          <button className="sidebar__toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Thu gọn menu">
            <IconChevron />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV.map(section => (
            <div key={section.group} className="sidebar__section">
              <span className="sidebar__section-label">{section.group}</span>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                  }
                >
                  <span className="sidebar__icon"><item.icon /></span>
                  <span className="sidebar__label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="avatar avatar--sm">{initials}</div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name || user?.username}</span>
              <span className="sidebar__user-role">{user?.role || 'Quản trị viên'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="layout__main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar__left">
            <button className="topbar__menu-btn" onClick={() => setSidebarOpen(v => !v)}>
              <IconMenu />
            </button>
          </div>
          <div className="topbar__right">
            <button className="topbar__icon-btn" aria-label="Thông báo">
              <IconBell />
            </button>
            <div className="topbar__profile" onClick={() => setDropdownOpen(v => !v)}>
              <div className="avatar">{initials}</div>
              <div className="topbar__profile-info">
                <span className="topbar__name">{user?.name || user?.username || 'Admin'}</span>
                <span className="topbar__role">{user?.role || 'Quản trị viên'}</span>
              </div>
              <IconChevronDown />
              {dropdownOpen && (
                <div className="topbar__dropdown">
                  <NavLink to="/tai-khoan/ho-so" className="topbar__dd-item" onClick={() => setDropdownOpen(false)}>
                    <IconUser /> Thông tin tài khoản
                  </NavLink>
                  <div className="topbar__dd-divider" />
                  <button className="topbar__dd-item topbar__dd-item--danger" onClick={handleLogout}>
                    <IconLogout /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ── Inline SVG Icons ── */
function IconDashboard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function IconBox() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
}
function IconClipboard() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="10" x2="15" y2="10"/></svg>;
}
function IconUsers() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconShield() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function IconUser() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IconChevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function IconChevronDown() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function IconMenu() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function IconBell() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function IconLogout() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
