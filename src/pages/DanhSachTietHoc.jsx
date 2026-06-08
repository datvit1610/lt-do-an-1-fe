import React, { useState, useEffect, useCallback } from 'react';
import AppSelect from '../components/AppSelect';
import { classPeriodService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const SHIFTS = [
  { value: 'SANG', label: 'Sáng' },
  { value: 'CHIEU', label: 'Chiều' },
  { value: 'TOI', label: 'Tối' },
];

/* Định dạng LocalTime "HH:mm:ss" → "HH:mm" (để hiển thị & gán vào input type=time) */
function toHHmm(t) {
  if (!t) return '';
  const parts = String(t).split(':');
  if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  return String(t);
}

/* "HH:mm" từ input → "HH:mm:ss" gửi backend (LocalTime) */
function toLocalTime(t) {
  if (!t) return null;
  const parts = String(t).split(':');
  const hh = (parts[0] || '00').padStart(2, '0');
  const mm = (parts[1] || '00').padStart(2, '0');
  return `${hh}:${mm}:00`;
}

/* Định dạng Date → dd/MM/yyyy HH:mm */
function formatDateTime(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const shiftLabel = (s) => SHIFTS.find(x => x.value === s)?.label || s || '—';
const emptyForm = { periodNumber: '', shift: '', startTime: '', endTime: '' };

export default function DanhSachTietHoc() {
  const { hasPermission } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null);       // { mode: 'add' | 'edit', data? }
  const [form, setForm] = useState(emptyForm);
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

  const fetchPeriods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await classPeriodService.getAll();
      const data = res.data?.data ?? res.data;
      // Hỗ trợ cả dạng phân trang ({ content: [...] }) lẫn mảng phẳng
      const list = Array.isArray(data) ? data : (data?.content || []);
      setPeriods(list);
    } catch {
      setPeriods([]);
      setError('Không tải được danh sách tiết học.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  function openAdd() {
    setForm(emptyForm);
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openEdit(p) {
    setForm({
      periodNumber: p.periodNumber != null ? String(p.periodNumber) : '',
      shift: p.shift || '',
      startTime: toHHmm(p.startTime),
      endTime: toHHmm(p.endTime),
    });
    setSaveError('');
    setModal({ mode: 'edit', data: p });
  }

  async function handleSave() {
    setSaveError('');
    const num = Number(form.periodNumber);
    if (!form.periodNumber?.toString().trim() || !Number.isInteger(num) || num < 1) {
      setSaveError('Số tiết phải là số nguyên lớn hơn 0.');
      return;
    }
    if (!form.shift) { setSaveError('Vui lòng chọn ca học.'); return; }
    if (!form.startTime || !form.endTime) { setSaveError('Vui lòng nhập giờ bắt đầu và giờ kết thúc.'); return; }
    if (form.startTime >= form.endTime) { setSaveError('Giờ kết thúc phải sau giờ bắt đầu.'); return; }

    const payload = {
      periodNumber: num,
      shift: form.shift,
      startTime: toLocalTime(form.startTime),
      endTime: toLocalTime(form.endTime),
    };

    setSaving(true);
    try {
      const res = modal.mode === 'add'
        ? await classPeriodService.create(payload)
        : await classPeriodService.update(modal.data.id, payload);
      if (res.data?.success === false) {
        setSaveError(res.data?.message || 'Lưu tiết học không thành công.');
        return;
      }
      setModal(null);
      showToast(modal.mode === 'add' ? 'Thêm tiết học thành công.' : 'Cập nhật tiết học thành công.');
      fetchPeriods();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu tiết học.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await classPeriodService.delete(deleteModal.id);
      if (res.data?.success === false) {
        setDeleteError(res.data?.message || 'Xóa tiết học không thành công.');
        return;
      }
      setDeleteModal(null);
      showToast('Xóa tiết học thành công.');
      fetchPeriods();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa tiết học.');
    } finally {
      setDeleting(false);
    }
  }

  const COL_COUNT = 8;

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
          <h1 className="page-title">Danh sách tiết học</h1>
          <p className="page-subtitle">Cấu hình các tiết học và khung giờ tương ứng trong hệ thống.</p>
        </div>
        <div className="page-header__actions">
          {hasPermission('class-period-c') && (
            <button className="btn btn--primary" onClick={openAdd}>
              <IconPlus /> Thêm tiết học
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px 0' }}>
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Tiết học ({periods.length})</span>
        </div>
        <div className="card__body tbl-wrap" style={{ paddingTop: 12 }}>
          <table className="tbl tbl--nowrap">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tiết học</th>
                <th>Ca học</th>
                <th>Giờ bắt đầu</th>
                <th>Giờ kết thúc</th>
                <th>Ngày tạo</th>
                <th>Ngày cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Đang tải...</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#c8102e', padding: '40px 0' }}>{error}</td></tr>
              )}
              {!loading && !error && periods.length === 0 && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && !error && periods.map((p, idx) => (
                <tr key={p.id ?? idx}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{idx + 1}</td>
                  <td><strong>{p.periodNumber ?? '—'}</strong></td>
                  <td>{shiftLabel(p.shift)}</td>
                  <td style={{ color: '#374151' }}>{toHHmm(p.startTime) || '—'}</td>
                  <td style={{ color: '#374151' }}>{toHHmm(p.endTime) || '—'}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{formatDateTime(p.createdDate)}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{formatDateTime(p.modifiedDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasPermission('class-period-u') && (
                        <button className="btn btn--icon" onClick={() => openEdit(p)} title="Sửa">
                          <IconEdit />
                        </button>
                      )}
                      {hasPermission('class-period-d') && (
                        <button className="btn btn--icon btn--icon-danger" onClick={() => { setDeleteError(''); setDeleteModal(p); }} title="Xóa">
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
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && setModal(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal__head">
              <span className="modal__title">{modal.mode === 'add' ? 'Thêm tiết học' : 'Sửa tiết học'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
                <div className="field">
                  <label>Số tiết *</label>
                  <input className="input" type="number" min={1} value={form.periodNumber}
                    onChange={e => setForm(p => ({ ...p, periodNumber: e.target.value }))} placeholder="Nhập số tiết" />
                </div>
                <div className="field">
                  <label>Ca học *</label>
                  <AppSelect
                    options={SHIFTS}
                    value={form.shift}
                    onChange={(val) => setForm(p => ({ ...p, shift: val }))}
                    placeholder="-- Chọn ca --"
                  />
                </div>
                <div className="field">
                  <label>Giờ bắt đầu *</label>
                  <input className="input" type="time" value={form.startTime}
                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Giờ kết thúc *</label>
                  <input className="input" type="time" value={form.endTime}
                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} />
                </div>
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
                {saving ? 'Đang lưu...' : (modal.mode === 'add' ? 'Thêm tiết học' : 'Lưu thay đổi')}
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
                Bạn có chắc muốn xóa <strong>tiết {deleteModal.periodNumber}</strong> ({shiftLabel(deleteModal.shift)})?<br />
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
                {deleting ? 'Đang xóa...' : 'Xóa tiết học'}
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
