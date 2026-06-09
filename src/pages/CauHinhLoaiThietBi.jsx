import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import AppSelect from '../components/AppSelect';
import { deviceTypeService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function CauHinhLoaiThietBi() {
  const { hasPermission } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Phân trang */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ pagesCount: 0, total: 0, currentPage: 0 });

  const [modal, setModal] = useState(null);          // { mode: 'add'|'edit', data? }
  const [form, setForm] = useState({ deviceType: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [toast, setToast] = useState('');
  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* Gọi API danh sách loại thiết bị */
  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deviceTypeService.getAll({ page, size: pageSize });
      const apiData = res.data?.data ?? {};
      const list = Array.isArray(apiData) ? apiData : (apiData.content || []);
      setTypes(list.map(item => ({ id: item.id, deviceType: item.deviceType })));
      setPageInfo({
        pagesCount: apiData.pagesCount || 0,
        total: apiData.currentTotalElementsCount ?? list.length,
        currentPage: apiData.currentPage || page,
      });
    } catch (err) {
      console.error('Fetch device types error:', err);
      setTypes([]);
      setPageInfo({ pagesCount: 0, total: 0, currentPage: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  function openAdd() {
    setForm({ deviceType: '' });
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openEdit(rec) {
    setForm({ id: rec.id, deviceType: rec.deviceType || '' });
    setSaveError('');
    setModal({ mode: 'edit', data: rec });
  }

  async function handleSave() {
    setSaveError('');
    if (!form.deviceType.trim()) {
      setSaveError('Vui lòng nhập tên loại thiết bị.');
      return;
    }
    setSaving(true);
    try {
      const payload = { deviceType: form.deviceType.trim() };
      const res = modal.mode === 'add'
        ? await deviceTypeService.create(payload)
        : await deviceTypeService.update(form.id, payload);
      const body = res?.data;
      if (body && (body.success === false || body.code >= 400)) {
        setSaveError(body.message || 'Có lỗi xảy ra.');
        return;
      }
      setModal(null);
      fetchTypes();
      showToast(modal.mode === 'add' ? 'Thêm loại thiết bị thành công.' : 'Cập nhật loại thiết bị thành công.');
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await deviceTypeService.delete(deleteModal.id);
      const body = res?.data;
      if (body && (body.success === false || body.code >= 400)) {
        setDeleteError(body.message || 'Có lỗi xảy ra.');
        return;
      }
      setDeleteModal(null);
      fetchTypes();
      showToast('Xóa loại thiết bị thành công.');
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    } finally {
      setDeleting(false);
    }
  }

  const COL_COUNT = 3;

  return (
    <div>
      {/* Toast */}
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
          <h1 className="page-title">Cấu hình loại thiết bị</h1>
          <p className="page-subtitle">Quản lý danh mục các loại thiết bị trong hệ thống.</p>
        </div>
        <div className="page-header__actions">
          {hasPermission('device-c') && (
            <button className="btn btn--primary" onClick={openAdd}>
              <IconPlus /> Thêm loại thiết bị
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Loại thiết bị ({pageInfo.total})</span>
        </div>
        <div className="card__body tbl-wrap" style={{ paddingTop: 12 }}>
          <table className="tbl tbl--nowrap">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên loại thiết bị</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Đang tải...</td></tr>
              )}
              {!loading && types.length === 0 && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && types.map((rec, idx) => (
                <tr key={rec.id}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{page * pageSize + idx + 1}</td>
                  <td><strong>{rec.deviceType}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasPermission('device-u') && (
                        <button className="btn btn--icon" onClick={() => openEdit(rec)} title="Sửa">
                          <IconEdit />
                        </button>
                      )}
                      {hasPermission('device-d') && (
                        <button className="btn btn--icon btn--icon-danger" onClick={() => { setDeleteError(''); setDeleteModal(rec); }} title="Xóa">
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
            <span>Tổng <strong>{pageInfo.total}</strong> loại</span>
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
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal__head">
              <span className="modal__title">{modal.mode === 'add' ? 'Thêm loại thiết bị' : 'Sửa loại thiết bị'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div className="field">
                <label>Tên loại thiết bị *</label>
                <input
                  className="input"
                  autoFocus
                  value={form.deviceType}
                  onChange={e => setForm(p => ({ ...p, deviceType: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="Ví dụ: Máy tính, Máy in, Điện thoại..."
                />
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
                {saving ? 'Đang lưu...' : (modal.mode === 'add' ? 'Thêm loại' : 'Lưu thay đổi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !deleting && setDeleteModal(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal__head">
              <span className="modal__title">Xác nhận xóa</span>
              <button className="modal__close btn" onClick={() => setDeleteModal(null)} disabled={deleting}><IconX /></button>
            </div>
            <div className="modal__body">
              <p style={{ color: '#374151' }}>
                Bạn có chắc muốn xóa loại thiết bị <strong>{deleteModal.deviceType}</strong>?<br />
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
                {deleting ? 'Đang xóa...' : 'Xóa loại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function IconPlus() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconEdit() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
