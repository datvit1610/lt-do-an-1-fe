import React, { useState } from 'react';

/* ── Mock data ── */
const MOCK_ACCOUNTS = [
  { id: 1, username: 'admin', name: 'Nguyễn Văn Admin', email: 'admin@hust.edu.vn', role: 'Quản trị viên', phone: '0912345678', createdAt: '01/01/2024', active: true },
  { id: 2, username: 'nguyenvanb', name: 'Nguyễn Văn B', email: 'nguyenvanb@hust.edu.vn', role: 'Quản lý kho', phone: '0923456789', createdAt: '15/02/2024', active: true },
  { id: 3, username: 'tranthic', name: 'Trần Thị C', email: 'tranthic@hust.edu.vn', role: 'Nhân viên', phone: '0934567890', createdAt: '20/03/2024', active: false },
  { id: 4, username: 'ledinhd', name: 'Lê Đình D', email: 'ledinhd@hust.edu.vn', role: 'Nhân viên', phone: '0945678901', createdAt: '05/04/2024', active: true },
  { id: 5, username: 'phamthie', name: 'Phạm Thị E', email: 'phamthie@hust.edu.vn', role: 'Quản lý kho', phone: '0956789012', createdAt: '10/05/2024', active: true },
];

const ROLES = ['Tất cả', 'Quản trị viên', 'Quản lý kho', 'Nhân viên'];

export default function DanhSachTaiKhoan() {
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data? }
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({ username: '', name: '', email: '', role: 'Nhân viên', phone: '', active: true });

  /* Filter */
  const filtered = accounts.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.username.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchRole = filterRole === 'Tất cả' || a.role === filterRole;
    const matchStatus = filterStatus === 'Tất cả' || (filterStatus === 'Hoạt động' ? a.active : !a.active);
    return matchQ && matchRole && matchStatus;
  });

  function openAdd() {
    setForm({ username: '', name: '', email: '', role: 'Nhân viên', phone: '', active: true });
    setModal({ mode: 'add' });
  }
  function openEdit(acc) {
    setForm({ ...acc });
    setModal({ mode: 'edit', data: acc });
  }
  function handleSave() {
    if (modal.mode === 'add') {
      setAccounts(prev => [...prev, { ...form, id: Date.now(), createdAt: new Date().toLocaleDateString('vi-VN') }]);
    } else {
      setAccounts(prev => prev.map(a => a.id === form.id ? form : a));
    }
    setModal(null);
  }
  function handleDelete() {
    setAccounts(prev => prev.filter(a => a.id !== deleteModal.id));
    setDeleteModal(null);
  }
  function toggleActive(id) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Danh sách tài khoản</h1>
          <p className="page-subtitle">Danh sách tài khoản, vai trò và phân quyền hệ thống.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={openAdd}>
            <IconPlus /> Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field">
              <label>Tên tài khoản / Họ tên</label>
              <input className="input" placeholder="Nhập tên đăng nhập hoặc họ tên..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="field">
              <label>Vai trò</label>
              <select className="select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option>Tất cả</option>
                <option>Hoạt động</option>
                <option>Tạm ngưng</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--outline" onClick={() => { setSearch(''); setFilterRole('Tất cả'); setFilterStatus('Tất cả'); }}>
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Tài khoản ({filtered.length})</span>
        </div>
        <div className="card__body tbl-wrap" style={{ paddingTop: 12 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên TK</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>SĐT</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {filtered.map((acc, idx) => (
                <tr key={acc.id}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{idx + 1}</td>
                  <td><strong>{acc.username}</strong></td>
                  <td>{acc.name}</td>
                  <td style={{ color: '#6b7280' }}>{acc.email}</td>
                  <td><span className={`badge ${acc.role === 'Quản trị viên' ? 'badge--red' : acc.role === 'Quản lý kho' ? 'badge--blue' : 'badge--gray'}`}>{acc.role}</span></td>
                  <td style={{ color: '#6b7280' }}>{acc.phone}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{acc.createdAt}</td>
                  <td>
                    <label className="toggle">
                      <input type="checkbox" checked={acc.active} onChange={() => toggleActive(acc.id)} />
                      <span className="toggle__track" />
                    </label>
                    <span style={{ marginLeft: 8, fontSize: '0.8rem', color: acc.active ? '#059669' : '#9ca3af', fontWeight: 600 }}>
                      {acc.active ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn--ghost btn--sm" onClick={() => openEdit(acc)} title="Sửa">
                        <IconEdit />
                      </button>
                      <button className="btn btn--danger-ghost btn--sm" onClick={() => setDeleteModal(acc)} title="Xóa">
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal__head">
              <span className="modal__title">{modal.mode === 'add' ? 'Thêm tài khoản' : 'Sửa tài khoản'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label>Tên đăng nhập *</label>
                  <input className="input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="username" disabled={modal.mode === 'edit'} />
                </div>
                <div className="field">
                  <label>Họ tên *</label>
                  <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Họ và tên" />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@hust.edu.vn" />
                </div>
                <div className="field">
                  <label>Số điện thoại</label>
                  <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="09xxxxxxxx" />
                </div>
                <div className="field">
                  <label>Vai trò</label>
                  <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    {ROLES.filter(r => r !== 'Tất cả').map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                {modal.mode === 'add' && (
                  <div className="field">
                    <label>Mật khẩu *</label>
                    <input className="input" type="password" placeholder="Mật khẩu ban đầu"
                      value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setModal(null)}>Hủy</button>
              <button className="btn btn--primary" onClick={handleSave}>
                {modal.mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__head">
              <span className="modal__title">Xác nhận xóa</span>
              <button className="modal__close btn" onClick={() => setDeleteModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <p style={{ color: '#374151' }}>
                Bạn có chắc muốn xóa tài khoản <strong>{deleteModal.username}</strong>?<br />
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setDeleteModal(null)}>Hủy</button>
              <button className="btn btn--primary" style={{ background: '#c8102e' }} onClick={handleDelete}>Xóa tài khoản</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconEdit() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
