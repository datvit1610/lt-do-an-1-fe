import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import { roleService, userService } from '../services/api';
import AppSelect from '../components/AppSelect';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function DanhSachTaiKhoan() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Bộ lọc (nhập tay) */
  const [fUserName, setFUserName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fStatus, setFStatus] = useState(''); // '' | '1' | '0'

  /* Query đã commit (debounce) gửi lên API */
  const [query, setQuery] = useState({ userName: '', email: '', phone: '', status: '' });

  /* Phân trang */
  const [page, setPage] = useState(0); // 0-based
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ pagesCount: 0, total: 0, currentPage: 0 });

  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data? }
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({ username: '', name: '', email: '', roleId: '', phone: '', position: '', active: true, password: '' });
  const [roles, setRoles] = useState([]); // [{ roleId, roleName }]
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* Load danh sách nhóm quyền (role) */
  useEffect(() => {
    roleService.select()
      .then(res => setRoles(res.data?.data || []))
      .catch(() => setRoles([]));
  }, []);

  /* Gọi API danh sách tài khoản */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        userName: query.userName || undefined,
        email: query.email || undefined,
        phone: query.phone || undefined,
        status: query.status !== '' ? Number(query.status) : undefined,
        page,
        size: pageSize,
      };
      const res = await userService.getAll(params);
      const d = res.data?.data;
      setAccounts(d?.content || []);
      setPageInfo({
        pagesCount: d?.pagesCount || 0,
        total: d?.currentTotalElementsCount || 0,
        currentPage: d?.currentPage || 0,
      });
    } catch {
      setAccounts([]);
      setPageInfo({ pagesCount: 0, total: 0, currentPage: 0 });
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* Bấm "Tìm kiếm" mới commit bộ lọc và gọi API (tránh spam API khi gõ) */
  function handleSearch() {
    setPage(0);
    setQuery({ userName: fUserName.trim(), email: fEmail.trim(), phone: fPhone.trim(), status: fStatus });
  }
  function handleFilterKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  function clearFilters() {
    setFUserName(''); setFEmail(''); setFPhone(''); setFStatus('');
    setPage(0);
    setQuery({ userName: '', email: '', phone: '', status: '' });
  }

  function openAdd() {
    setForm({ username: '', name: '', email: '', roleId: '', phone: '', position: '', active: true, password: '' });
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openEdit(acc) {
    setForm({
      userId: acc.userId,
      username: acc.userName,
      name: acc.fullName,
      email: acc.email,
      phone: acc.phoneNumber,
      roleId: acc.roleId,
      position: acc.position || '',
      active: acc.status === 1,
    });
    setSaveError('');
    setModal({ mode: 'edit', data: acc });
  }
  async function handleSave() {
    setSaveError('');

    if (modal.mode === 'add') {
      // Validate FE
      if (!form.username.trim() || !form.name.trim() || !form.password || !form.roleId) {
        setSaveError('Vui lòng nhập đủ Tên đăng nhập, Họ tên, Mật khẩu và Nhóm quyền.');
        return;
      }
      const selectedRole = roles.find(r => r.roleId === form.roleId);
      const payload = {
        userName: form.username.trim(),
        password: form.password,
        fullName: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        position: form.position.trim() || selectedRole?.roleName || '',
        status: form.active ? 1 : 0,
        roleId: form.roleId,
      };
      setSaving(true);
      try {
        const res = await userService.create(payload);
        const response = res.data;
        if (response?.success === false) {
          setSaveError(response?.message || 'Tạo tài khoản không thành công.');
          return;
        }
        setModal(null);
        showToast(response?.message || 'Tạo tài khoản thành công.');
        fetchUsers(); // tải lại danh sách từ server
      } catch (err) {
        setSaveError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
      } finally {
        setSaving(false);
      }
    } else {
      // Sửa tài khoản
      if (!form.name.trim() || !form.roleId) {
        setSaveError('Vui lòng nhập đủ Họ tên và Nhóm quyền.');
        return;
      }
      const payload = {
        fullName: form.name.trim(),
        email: form.email.trim(),
        phoneNumber: form.phone.trim(),
        position: form.position.trim(),
        status: form.active ? 1 : 0,
        roleId: form.roleId,
      };
      setSaving(true);
      try {
        const res = await userService.update(form.userId, payload);
        const response = res.data;
        if (response?.success === false) {
          setSaveError(response?.message || 'Cập nhật tài khoản không thành công.');
          return;
        }
        setModal(null);
        showToast(response?.message || 'Cập nhật tài khoản thành công.');
        fetchUsers(); // tải lại danh sách từ server
      } catch (err) {
        setSaveError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản.');
      } finally {
        setSaving(false);
      }
    }
  }
  async function handleDelete() {
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await userService.remove(deleteModal.userId);
      const response = res.data;
      if (response?.success === false) {
        setDeleteError(response?.message || 'Xóa tài khoản không thành công.');
        return;
      }
      const msg = response?.message || 'Xóa tài khoản thành công.';
      setDeleteModal(null);
      showToast(msg);
      fetchUsers(); // tải lại danh sách từ server
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa tài khoản.');
    } finally {
      setDeleting(false);
    }
  }

  const COL_COUNT = 12;

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field">
              <label>Tên đăng nhập</label>
              <input className="input" placeholder="Nhập tên đăng nhập..."
                value={fUserName} onChange={e => setFUserName(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" placeholder="Nhập email..."
                value={fEmail} onChange={e => setFEmail(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input className="input" placeholder="Nhập SĐT..."
                value={fPhone} onChange={e => setFPhone(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <AppSelect
                options={[
                  { value: '', label: 'Tất cả' },
                  { value: '1', label: 'Hoạt động' },
                  { value: '0', label: 'Tạm ngưng' },
                ]}
                value={fStatus}
                onChange={(val) => setFStatus(val || '')}
                isClearable
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--primary" onClick={handleSearch} disabled={loading}>
                <IconSearch /> Tìm kiếm
              </button>
              <button className="btn btn--outline" onClick={clearFilters} disabled={loading}>Xóa bộ lọc</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Tài khoản ({pageInfo.total})</span>
        </div>
        <div className="card__body tbl-wrap" style={{ paddingTop: 12 }}>
          <table className="tbl tbl--nowrap">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên TK</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Nhóm quyền</th>
                <th>Chức vụ</th>
                <th>SĐT</th>
                <th>Ngày tạo</th>
                <th>Ngày sửa</th>
                <th>Người tạo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Đang tải...</td></tr>
              )}
              {!loading && accounts.length === 0 && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && accounts.map((acc, idx) => (
                <tr key={acc.userId}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{page * pageSize + idx + 1}</td>
                  <td><strong>{acc.userName}</strong></td>
                  <td>{acc.fullName}</td>
                  <td style={{ color: '#6b7280' }}>{acc.email}</td>
                  <td><span className={`badge ${/admin|quản trị/i.test(acc.roleName || '') ? 'badge--red' : 'badge--blue'}`}>{acc.roleName}</span></td>
                  <td style={{ color: '#6b7280' }}>{acc.position || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{acc.phoneNumber}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{acc.createdDate || '—'}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{acc.modifiedDate || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{acc.createdBy || '—'}</td>
                  <td>
                    <span className={`badge ${acc.status === 1 ? 'badge--green' : 'badge--gray'}`}>
                      {acc.status === 1 ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--icon" onClick={() => openEdit(acc)} title="Sửa">
                        <IconEdit />
                      </button>
                      <button className="btn btn--icon btn--icon-danger" onClick={() => { setDeleteError(''); setDeleteModal(acc); }} title="Xóa">
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px 20px', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#6b7280' }}>
            <span>Số dòng / trang:</span>
            <div style={{ width: 96 }}>
              <AppSelect
                options={PAGE_SIZE_OPTIONS.map(n => ({ value: String(n), label: String(n) }))}
                value={String(pageSize)}
                onChange={(val) => { setPageSize(Number(val) || 10); setPage(0); }}
              />
            </div>
            <span>Tổng <strong>{pageInfo.total}</strong> tài khoản</span>
          </div>

          {pageInfo.pagesCount > 1 && (
            <ReactPaginate
              forcePage={page}
              pageCount={pageInfo.pagesCount}
              onPageChange={({ selected }) => setPage(selected)}
              previousLabel="‹"
              nextLabel="›"
              breakLabel="…"
              marginPagesDisplayed={1}
              pageRangeDisplayed={2}
              containerClassName="pagination"
              pageClassName="pagination__item"
              activeClassName="pagination__active"
              previousClassName="pagination__nav"
              nextClassName="pagination__nav"
              breakClassName="pagination__item"
              disabledClassName="pagination__disabled"
            />
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: 760 }}>
            <div className="modal__head">
              <span className="modal__title">{modal.mode === 'add' ? 'Thêm tài khoản' : 'Sửa tài khoản'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
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
                  <label>Chức vụ</label>
                  <input className="input" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    placeholder="Chức vụ" />
                </div>
                <div className="field">
                  <label>Nhóm quyền *</label>
                  <AppSelect
                    options={roles.map(r => ({ value: r.roleId, label: r.roleName }))}
                    value={form.roleId}
                    onChange={(val) => setForm(p => ({ ...p, roleId: val }))}
                    placeholder="-- Chọn nhóm quyền --"
                    isSearchable
                    isClearable
                  />
                </div>
                <div className="field">
                  <label>Trạng thái</label>
                  <AppSelect
                    options={[
                      { value: '1', label: 'Hoạt động' },
                      { value: '0', label: 'Tạm ngưng' },
                    ]}
                    value={form.active ? '1' : '0'}
                    onChange={(val) => setForm(p => ({ ...p, active: val === '1' }))}
                  />
                </div>
                {modal.mode === 'add' && (
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Mật khẩu *</label>
                    <input className="input" type="password" placeholder="Mật khẩu ban đầu"
                      value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                )}
              </div>
              {saveError && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff0f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c8102e', fontSize: '0.84rem' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setModal(null)} disabled={saving}>Hủy</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : (modal.mode === 'add' ? 'Tạo tài khoản' : 'Lưu thay đổi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !deleting && setDeleteModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__head">
              <span className="modal__title">Xác nhận xóa</span>
              <button className="modal__close btn" onClick={() => setDeleteModal(null)} disabled={deleting}><IconX /></button>
            </div>
            <div className="modal__body">
              <p style={{ color: '#374151' }}>
                Bạn có chắc muốn xóa tài khoản <strong>{deleteModal.userName}</strong>?<br />
                Hành động này không thể hoàn tác.
              </p>
              {deleteError && (
                <div style={{ marginTop: 6, padding: '10px 14px', background: '#fff0f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c8102e', fontSize: '0.84rem' }}>
                  {deleteError}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setDeleteModal(null)} disabled={deleting}>Hủy</button>
              <button className="btn btn--primary" style={{ background: '#c8102e' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconEdit() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
