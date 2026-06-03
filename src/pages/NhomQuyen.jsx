import React, { useState, useEffect } from 'react';
import { permissionService, roleService } from '../services/api';

/* groupId enum → tên nhóm hiển thị */
const GROUP_NAMES = {
  1: 'Tổng quan dashboard',
  2: 'Quản lý thiết bị',
  3: 'Quản lý mượn trả',
  4: 'Quản lý hệ thống',
};
const GROUP_ORDER = [1, 2, 3, 4];

/* Gom danh sách permission phẳng thành các nhóm theo groupId */
function buildSections(permissions) {
  const byGroup = new Map();
  permissions.forEach(p => {
    if (!byGroup.has(p.groupId)) byGroup.set(p.groupId, []);
    byGroup.get(p.groupId).push(p);
  });
  const orderedIds = [...GROUP_ORDER, ...[...byGroup.keys()].filter(id => !GROUP_ORDER.includes(id))];
  return orderedIds
    .filter(id => byGroup.has(id))
    .map(id => ({
      groupId: id,
      group: GROUP_NAMES[id] || `Nhóm ${id}`,
      items: byGroup.get(id),
    }));
}

/* Chuẩn hóa role từ API → group dùng trong UI (perms = danh sách permissionId) */
function mapRole(r) {
  return {
    id: r.roleId,
    name: r.roleName,
    perms: (r.permissions || []).map(p => p.permissionId),
  };
}

export default function NhomQuyen() {
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPerms, setEditPerms] = useState(new Set());
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [addPerms, setAddPerms] = useState(new Set());
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingRole, setDeletingRole] = useState(false);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }
  const [permSections, setPermSections] = useState([]); // danh mục phân quyền chi tiết từ API
  const [loadingPerms, setLoadingPerms] = useState(false);

  /* Tải danh sách phân quyền chi tiết */
  useEffect(() => {
    setLoadingPerms(true);
    permissionService.getAll()
      .then(res => setPermSections(buildSections(res.data?.data || [])))
      .catch(() => setPermSections([]))
      .finally(() => setLoadingPerms(false));
  }, []);

  /* Tải danh sách nhóm quyền (role) kèm permission đã gán */
  async function reloadRoles(selectId) {
    setLoadingRoles(true);
    try {
      const res = await roleService.getAll({ page: 0, size: 100 });
      const list = (res.data?.data?.content || []).map(mapRole);
      setGroups(list);
      const target = (selectId && list.find(g => g.id === selectId)) || list[0];
      if (target) selectGroup(target);
    } catch {
      setGroups([]);
    } finally {
      setLoadingRoles(false);
    }
  }
  useEffect(() => {
    reloadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function handleSave() {
    const nameChanged = editName !== selected.name;
    const permsChanged = editPerms.size !== selected.perms.length ||
                         selected.perms.some(p => !editPerms.has(p));

    if (!nameChanged && !permsChanged) {
      showToast('Không có thay đổi để lưu.');
      return;
    }

    setSavingEdit(true);
    try {
      const permissionOlds = selected.perms;
      const permissionNews = [...editPerms];
      const payload = {
        roleName: editName,
        permissionOlds,
        permissionNews,
      };
      await roleService.update(selected.id, payload);
      setGroups(prev => prev.map(g =>
        g.id === selected?.id ? { ...g, name: editName, perms: permissionNews } : g
      ));
      setSelected(prev => ({ ...prev, name: editName, perms: permissionNews }));
      showToast('Cập nhật nhóm quyền thành công.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhóm quyền.');
    } finally {
      setSavingEdit(false);
    }
  }

  function openAddModal() {
    setNewName('');
    setAddPerms(new Set());
    setAddError('');
    setAddModal(true);
  }
  function toggleAddPerm(perm) {
    setAddPerms(prev => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });
  }
  function toggleAddGroupAll(groupPerms) {
    const allChecked = groupPerms.every(p => addPerms.has(p));
    setAddPerms(prev => {
      const next = new Set(prev);
      if (allChecked) groupPerms.forEach(p => next.delete(p));
      else groupPerms.forEach(p => next.add(p));
      return next;
    });
  }

  async function handleAdd() {
    setAddError('');
    if (!newName.trim()) { setAddError('Vui lòng nhập tên nhóm quyền.'); return; }
    const payload = {
      roleName: newName.trim(),
      permissionNews: [...addPerms],
    };
    setAddSaving(true);
    try {
      const res = await roleService.create(payload);
      const response = res.data;
      if (response?.success === false) {
        setAddError(response?.message || 'Tạo nhóm quyền không thành công.');
        return;
      }
      setAddModal(false);
      showToast(response?.message || 'Tạo nhóm quyền thành công.');
      await reloadRoles(response?.data?.roleId); // tải lại danh sách, chọn nhóm vừa tạo nếu có
    } catch (err) {
      setAddError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm quyền.');
    } finally {
      setAddSaving(false);
    }
  }

  async function handleDelete() {
    setDeletingRole(true);
    try {
      await roleService.delete(selected.id);
      setGroups(prev => prev.filter(g => g.id !== selected?.id));
      const remaining = groups.filter(g => g.id !== selected?.id);
      if (remaining.length) selectGroup(remaining[0]);
      else setSelected(null);
      setDeleteModal(false);
      showToast('Xóa nhóm quyền thành công.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi xóa nhóm quyền.');
    } finally {
      setDeletingRole(false);
    }
  }

  return (
    <div>
      {/* Toast thông báo */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', background: '#059669', color: '#fff',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontWeight: 600, fontSize: '0.9rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>✓</span>
          {toast}
        </div>
      )}

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
            <button className="btn btn--primary btn--sm" onClick={openAddModal}>
              <IconPlus /> Thêm mới
            </button>
          </div>
          <div style={{ padding: '0 8px 12px' }}>
            {loadingRoles && groups.length === 0 && (
              <div style={{ color: '#9ca3af', padding: '16px 12px', fontSize: '0.85rem' }}>Đang tải...</div>
            )}
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => selectGroup(g)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: selected?.id === g.id ? '#1a1f2e' : 'transparent',
                  color: selected?.id === g.id ? 'white' : '#374151',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}
              >
                <span>{g.name}</span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                  background: selected?.id === g.id ? 'rgba(255,255,255,0.15)' : '#f3f4f6',
                  color: selected?.id === g.id ? 'rgba(255,255,255,0.8)' : '#6b7280',
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
              <button className="btn btn--outline btn--sm" style={{ color: '#c8102e', borderColor: '#fca5a5' }} onClick={() => setDeleteModal(true)} disabled={savingEdit}>
                Xóa nhóm
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={savingEdit}>
                {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', marginBottom: 16 }}>Danh sách phân quyền chi tiết</p>
            {loadingPerms ? (
              <div style={{ color: '#9ca3af', padding: '20px 0' }}>Đang tải...</div>
            ) : permSections.length === 0 ? (
              <div style={{ color: '#9ca3af', padding: '20px 0' }}>Không có dữ liệu phân quyền</div>
            ) : (
              <PermissionChecklist sections={permSections} selected={editPerms} onToggle={togglePerm} onToggleGroup={toggleGroupAll} />
            )}
          </div>
        </div>
      </div>

      {/* Add group modal */}
      {addModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !addSaving && setAddModal(false)}>
          <div className="modal" style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', maxHeight: '88vh' }}>
            <div className="modal__head">
              <div>
                <span className="modal__title">Thêm nhóm quyền mới</span>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>Nhập tên vai trò và tích chọn các quyền cho nhóm này để phân quyền hệ thống.</p>
              </div>
              <button className="modal__close btn" onClick={() => setAddModal(false)} disabled={addSaving}><IconX /></button>
            </div>
            <div className="modal__body" style={{ overflowY: 'auto' }}>
              <div className="field">
                <label>Tên nhóm quyền *</label>
                <input className="input" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Ví dụ: Nhân viên bán hàng, Admin,..." />
              </div>

              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6b7280', margin: '4px 0 16px' }}>Danh sách phân quyền chi tiết</p>
                {loadingPerms ? (
                  <div style={{ color: '#9ca3af', padding: '20px 0' }}>Đang tải...</div>
                ) : permSections.length === 0 ? (
                  <div style={{ color: '#9ca3af', padding: '20px 0' }}>Không có dữ liệu phân quyền</div>
                ) : (
                  <PermissionChecklist sections={permSections} selected={addPerms} onToggle={toggleAddPerm} onToggleGroup={toggleAddGroupAll} />
                )}
              </div>

              {addError && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff0f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c8102e', fontSize: '0.84rem' }}>
                  {addError}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setAddModal(false)} disabled={addSaving}>Hủy</button>
              <button className="btn btn--primary" onClick={handleAdd} disabled={addSaving}>
                {addSaving ? 'Đang tạo...' : `Tạo vai trò${addPerms.size ? ` (${addPerms.size} quyền)` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !deletingRole && setDeleteModal(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal__head">
              <span className="modal__title">Xóa nhóm quyền</span>
              <button className="modal__close btn" onClick={() => setDeleteModal(false)} disabled={deletingRole}><IconX /></button>
            </div>
            <div className="modal__body">
              <p>Bạn có chắc muốn xóa nhóm <strong>{selected?.name}</strong>? Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setDeleteModal(false)} disabled={deletingRole}>Hủy</button>
              <button className="btn btn--primary" style={{ background: '#c8102e' }} onClick={handleDelete} disabled={deletingRole}>
                {deletingRole ? 'Đang xóa...' : 'Xóa nhóm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Checklist phân quyền dùng chung (panel sửa & modal thêm mới) */
function PermissionChecklist({ sections, selected, onToggle, onToggleGroup }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {sections.map(section => {
        const ids = section.items.map(p => p.permissionId);
        const allChecked = ids.every(id => selected.has(id));
        const someChecked = ids.some(id => selected.has(id));
        return (
          <div key={section.groupId}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={() => onToggleGroup(ids)}
                  style={{ width: 16, height: 16, accentColor: '#c8102e' }}
                />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1f2e' }}>{section.group}</span>
              </label>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: '#f0f2f5', color: '#6b7280',
              }}>
                {ids.filter(id => selected.has(id)).length}/{ids.length}
              </span>
            </div>

            {/* Perm checkboxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingLeft: 8 }}>
              {section.items.map(perm => (
                <label
                  key={perm.permissionId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                    borderRadius: 10, cursor: 'pointer', border: '1.5px solid',
                    borderColor: selected.has(perm.permissionId) ? 'rgba(200,16,46,0.2)' : '#e5e7eb',
                    background: selected.has(perm.permissionId) ? '#fff5f6' : 'white',
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(perm.permissionId)}
                    onChange={() => onToggle(perm.permissionId)}
                    style={{ width: 15, height: 15, accentColor: '#c8102e', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.84rem', color: '#374151', fontWeight: 500 }}>
                    {perm.description || perm.permissionName}
                    {perm.description && (
                      <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6, fontSize: '0.78rem' }}>({perm.permissionName})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconPlus() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
