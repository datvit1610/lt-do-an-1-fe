import React, { useState } from 'react';

const PERMISSIONS = [
  {
    group: 'Tổng quan',
    items: ['Dashboard', 'Thống kê'],
  },
  {
    group: 'Quản lý thiết bị',
    items: ['Xem danh sách thiết bị', 'Thêm thiết bị', 'Sửa thiết bị', 'Xóa thiết bị', 'Xuất Excel'],
  },
  {
    group: 'Quản lý mượn/trả',
    items: ['Xem phiếu mượn', 'Tạo phiếu mượn', 'Duyệt phiếu mượn', 'Xóa phiếu mượn', 'Xem phiếu trả', 'Tạo phiếu trả'],
  },
  {
    group: 'Quản lý phòng',
    items: ['Xem danh sách phòng', 'Thêm phòng', 'Sửa phòng', 'Xóa phòng'],
  },
  {
    group: 'Hệ thống',
    items: ['Quản lý tài khoản', 'Quản lý nhóm quyền', 'Xem lịch sử thao tác'],
  },
];

const INIT_GROUPS = [
  { id: 1, name: 'Quản trị viên', perms: PERMISSIONS.flatMap(g => g.items) },
  { id: 2, name: 'Quản lý kho', perms: ['Dashboard', 'Xem danh sách thiết bị', 'Thêm thiết bị', 'Sửa thiết bị', 'Xem phiếu mượn', 'Tạo phiếu mượn', 'Xem phiếu trả', 'Tạo phiếu trả'] },
  { id: 3, name: 'Nhân viên', perms: ['Dashboard', 'Xem danh sách thiết bị', 'Xem phiếu mượn', 'Xem phiếu trả'] },
  { id: 4, name: 'Quản gia', perms: ['Dashboard', 'Thống kê', 'Xem danh sách thiết bị', 'Xem phòng', 'Xem lịch sử thao tác'] },
];

export default function NhomQuyen() {
  const [groups, setGroups] = useState(INIT_GROUPS);
  const [selected, setSelected] = useState(INIT_GROUPS[0]);
  const [editName, setEditName] = useState(INIT_GROUPS[0].name);
  const [editPerms, setEditPerms] = useState(new Set(INIT_GROUPS[0].perms));
  const [addModal, setAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [saved, setSaved] = useState(false);

  function selectGroup(g) {
    setSelected(g);
    setEditName(g.name);
    setEditPerms(new Set(g.perms));
  }

  function togglePerm(perm) {
    setEditPerms(prev => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }

  function toggleGroupAll(groupPerms) {
    const allChecked = groupPerms.every(p => editPerms.has(p));
    setEditPerms(prev => {
      const next = new Set(prev);
      if (allChecked) groupPerms.forEach(p => next.delete(p));
      else groupPerms.forEach(p => next.add(p));
      return next;
    });
  }

  function handleSave() {
    setGroups(prev => prev.map(g =>
      g.id === selected.id ? { ...g, name: editName, perms: [...editPerms] } : g
    ));
    setSelected(prev => ({ ...prev, name: editName, perms: [...editPerms] }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    const ng = { id: Date.now(), name: newName.trim(), perms: [] };
    setGroups(prev => [...prev, ng]);
    selectGroup(ng);
    setNewName('');
    setAddModal(false);
  }

  function handleDelete() {
    setGroups(prev => prev.filter(g => g.id !== selected.id));
    const remaining = groups.filter(g => g.id !== selected.id);
    if (remaining.length) selectGroup(remaining[0]);
    setDeleteModal(false);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Nhóm quyền</h1>
          <p className="page-subtitle">Quản lý vai trò và phân quyền truy cập hệ thống.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Left: group list */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px' }}>
            <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Nhóm quyền ({groups.length})</span>
            <button className="btn btn--primary btn--sm" onClick={() => setAddModal(true)}>
              <IconPlus /> Thêm mới
            </button>
          </div>
          <div style={{ padding: '0 8px 12px' }}>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => selectGroup(g)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: selected.id === g.id ? '#1a1f2e' : 'transparent',
                  color: selected.id === g.id ? 'white' : '#374151',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
              >
                <span>{g.name}</span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                  background: selected.id === g.id ? 'rgba(255,255,255,0.15)' : '#f3f4f6',
                  color: selected.id === g.id ? 'rgba(255,255,255,0.8)' : '#6b7280',
                }}>
                  {g.perms.length} quyền
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: permission editor */}
        <div className="card">
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="field" style={{ flex: 1, gap: 4 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6b7280' }}>Tên nhóm quyền</label>
              <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ maxWidth: 320 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn--outline btn--sm" style={{ color: '#c8102e', borderColor: '#fca5a5' }} onClick={() => setDeleteModal(true)}>
                Xóa nhóm
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleSave}>
                {saved ? '✓ Đã lưu' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', marginBottom: 16 }}>Danh sách phân quyền chi tiết</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {PERMISSIONS.map(section => {
                const allChecked = section.items.every(p => editPerms.has(p));
                const someChecked = section.items.some(p => editPerms.has(p));
                return (
                  <div key={section.group}>
                    {/* Group header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                          onChange={() => toggleGroupAll(section.items)}
                          style={{ width: 16, height: 16, accentColor: '#c8102e' }}
                        />
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1f2e' }}>{section.group}</span>
                      </label>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: '#f0f2f5', color: '#6b7280',
                      }}>
                        {section.items.filter(p => editPerms.has(p)).length}/{section.items.length}
                      </span>
                    </div>

                    {/* Perm checkboxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 8 }}>
                      {section.items.map(perm => (
                        <label
                          key={perm}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                            borderRadius: 10, cursor: 'pointer', border: '1.5px solid',
                            borderColor: editPerms.has(perm) ? 'rgba(200,16,46,0.2)' : '#e5e7eb',
                            background: editPerms.has(perm) ? '#fff5f6' : 'white',
                            transition: 'all 0.12s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={editPerms.has(perm)}
                            onChange={() => togglePerm(perm)}
                            style={{ width: 15, height: 15, accentColor: '#c8102e', flexShrink: 0 }}
                          />
                          <span style={{ fontSize: '0.84rem', color: '#374151', fontWeight: 500 }}>{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add group modal */}
      {addModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__head">
              <span className="modal__title">Thêm nhóm quyền</span>
              <button className="modal__close btn" onClick={() => setAddModal(false)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label>Tên nhóm quyền *</label>
                <input className="input" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="VD: Thủ kho, Giáo vụ..." onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setAddModal(false)}>Hủy</button>
              <button className="btn btn--primary" onClick={handleAdd}>Tạo nhóm</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__head">
              <span className="modal__title">Xóa nhóm quyền</span>
              <button className="modal__close btn" onClick={() => setDeleteModal(false)}><IconX /></button>
            </div>
            <div className="modal__body">
              <p>Bạn có chắc muốn xóa nhóm <strong>{selected.name}</strong>? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setDeleteModal(false)}>Hủy</button>
              <button className="btn btn--primary" style={{ background: '#c8102e' }} onClick={handleDelete}>Xóa nhóm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
