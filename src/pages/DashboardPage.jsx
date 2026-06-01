import React, { useState } from 'react';

/* ── Mock data bám sát dữ liệu thực tế của hệ thống ── */
const STATS = [
  { label: 'Tổng tài khoản', value: 10, sub: '+2 tháng này', icon: '👥', color: '#c8102e', bg: '#fff0f2' },
  { label: 'Đang hoạt động', value: 8,  sub: '80% tổng số', icon: '✅', color: '#059669', bg: '#ecfdf5' },
  { label: 'Nhóm quyền',     value: 4,  sub: 'admin, quản gia...', icon: '🛡️', color: '#2563eb', bg: '#eff6ff' },
  { label: 'Tạm ngưng',      value: 2,  sub: '20% tổng số', icon: '⏸️', color: '#d97706', bg: '#fffbeb' },
];

const RECENT_ACCOUNTS = [
  { username: 'xuantest',    name: 'Nguyễn Kim Xuân', role: 'Nhân viên kho', createdAt: '27/05/2026', active: true,  by: 'Admin' },
  { username: 'quangkhanh15', name: 'quangkhanh15',   role: 'Quản gia',      createdAt: '20/05/2026', active: true,  by: 'Admin' },
  { username: 'quangkhanh13', name: 'quangkhanh13',   role: 'Quản gia',      createdAt: '20/05/2026', active: true,  by: 'Admin' },
  { username: 'quangkhanh12', name: 'quangkhanh12',   role: 'Quản gia',      createdAt: '20/05/2026', active: true,  by: 'Admin' },
  { username: 'quangkhanh11', name: 'quangkhanh11',   role: 'Quản gia',      createdAt: '20/05/2026', active: false, by: 'Admin' },
];

const ROLE_DIST = [
  { name: 'Nhân viên kho', count: 1,  color: '#2563eb' },
  { name: 'Quản gia',      count: 6,  color: '#c8102e' },
  { name: 'Nhân viên',     count: 2,  color: '#059669' },
  { name: 'Admin',         count: 1,  color: '#d97706' },
];

const GROUPS = [
  { name: 'nhân viên',    perms: 7,  members: 2 },
  { name: 'Quản gia',     perms: 6,  members: 6 },
  { name: 'Nhân viên kho',perms: 3,  members: 1 },
  { name: 'admin',        perms: 22, members: 1 },
];

const ACTIVITY = [
  { time: '27/05/2026 11:26', actor: 'Admin', action: 'Tạo tài khoản', target: 'xuantest', type: 'create' },
  { time: '20/05/2026 16:40', actor: 'Admin', action: 'Tạo tài khoản', target: 'quangkhanh15', type: 'create' },
  { time: '20/05/2026 16:40', actor: 'Admin', action: 'Tạm ngưng',     target: 'quangkhanh11', type: 'warning' },
  { time: '20/05/2026 16:06', actor: 'Admin', action: 'Tạo tài khoản', target: 'quangkhanh13', type: 'create' },
  { time: '20/05/2026 15:59', actor: 'Admin', action: 'Tạo tài khoản', target: 'quangkhanh12', type: 'create' },
  { time: '20/05/2026 15:46', actor: 'Admin', action: 'Kích hoạt',      target: 'quangkhanh10', type: 'success' },
];

const ROLE_BADGE = {
  'Nhân viên kho': { cls: 'badge--blue' },
  'Quản gia':      { cls: 'badge--gray' },
  'Nhân viên':     { cls: 'badge--gray' },
  'Admin':         { cls: 'badge--red' },
  'admin':         { cls: 'badge--red' },
  'Quản trị viên': { cls: 'badge--red' },
};

const ACTIVITY_COLOR = { create: '#059669', warning: '#d97706', success: '#2563eb', delete: '#c8102e' };

export default function DashboardPage() {
  const total = ROLE_DIST.reduce((s, r) => s + r.count, 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hệ thống quản lý thiết bị — Đại học Bách Khoa Hà Nội</p>
        </div>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af', alignSelf: 'center' }}>
          Cập nhật: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="card__body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: s.color, marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Role chart + Group list ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Role distribution */}
        <div className="card">
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            Phân bố vai trò tài khoản
          </div>
          <div className="card__body">
            {/* Bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ROLE_DIST.map(r => (
                <div key={r.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#374151' }}>{r.name}</span>
                    <span style={{ fontSize: '0.84rem', color: '#9ca3af' }}>{r.count} / {total}</span>
                  </div>
                  <div style={{ height: 8, background: '#f0f2f5', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(r.count / total) * 100}%`,
                      background: r.color,
                      borderRadius: 99,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Legend dots */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f2f5' }}>
              {ROLE_DIST.map(r => (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.name} ({r.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Group summary */}
        <div className="card">
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            Nhóm quyền hệ thống
          </div>
          <div style={{ padding: '0 4px 8px' }}>
            {GROUPS.map((g, i) => (
              <div key={g.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 16px', borderBottom: i < GROUPS.length - 1 ? '1px solid #f8f9fb' : 'none',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: i === 3 ? '#fff0f2' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>
                  🛡️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1f2e' }}>{g.name}</div>
                  <div style={{ fontSize: '0.76rem', color: '#9ca3af', marginTop: 2 }}>{g.members} tài khoản</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: i === 3 ? '#c8102e' : '#1a1f2e' }}>{g.perms}</div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>quyền</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent accounts + Activity log ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>

        {/* Recent accounts table */}
        <div className="card">
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Tài khoản mới nhất</span>
            <a href="/tai-khoan/danh-sach" style={{ fontSize: '0.8rem', color: '#c8102e', fontWeight: 600, textDecoration: 'none' }}>Xem tất cả →</a>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Tên TK</th>
                  <th>Họ tên</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ACCOUNTS.map(acc => (
                  <tr key={acc.username}>
                    <td><strong style={{ color: '#1a1f2e' }}>{acc.username}</strong></td>
                    <td style={{ color: '#6b7280' }}>{acc.name}</td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[acc.role]?.cls || 'badge--gray'}`}>{acc.role}</span>
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{acc.createdAt}</td>
                    <td>
                      <span className={`badge ${acc.active ? 'badge--green' : 'badge--gray'}`}>
                        {acc.active ? 'Hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity log */}
        <div className="card">
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            Hoạt động gần đây
          </div>
          <div style={{ padding: '8px 20px 16px' }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: i < ACTIVITY.length - 1 ? '1px solid #f8f9fb' : 'none' }}>
                {/* Dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: ACTIVITY_COLOR[a.type], marginTop: 4, flexShrink: 0 }} />
                  {i < ACTIVITY.length - 1 && <div style={{ width: 1, flex: 1, background: '#f0f2f5', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', color: '#374151' }}>
                    <strong>{a.actor}</strong> {a.action.toLowerCase()}{' '}
                    <strong style={{ color: ACTIVITY_COLOR[a.type] }}>{a.target}</strong>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}