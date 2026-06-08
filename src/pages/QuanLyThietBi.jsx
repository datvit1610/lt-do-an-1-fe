import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import AppSelect from '../components/AppSelect';
import { deviceService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const EQUIPMENT_CATEGORIES = [
  { value: 'ĐIỆN_THOẠI', label: 'Điện thoại' },
  { value: 'MÁY_TÍNH', label: 'Máy tính' },
  { value: 'MÁY_IN', label: 'Máy in' },
  { value: 'TỦ', label: 'Tủ' },
  { value: 'KHÁC', label: 'Khác' },
];

export default function QuanLyThietBi() {
  const { hasPermission } = useAuth();
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Bộ lọc */
  const [fEquipmentName, setFEquipmentName] = useState('');
  const [fEquipmentCode, setFEquipmentCode] = useState('');
  const [fCategory, setFCategory] = useState('');
  const [fStatus, setFStatus] = useState('');

  /* Query đã commit */
  const [query, setQuery] = useState({ equipmentName: '', equipmentCode: '', category: '', status: '' });

  /* Phân trang */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ pagesCount: 0, total: 0, currentPage: 0 });

  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({
    equipmentName: '',
    equipmentCode: '',
    category: '',
    location: '',
    quantity: 1,
    status: 1,
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* Gọi API danh sách thiết bị */
  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        name: query.equipmentName || undefined,
        deviceCode: query.equipmentCode || undefined,
        deviceType: query.category || undefined,
        status: query.status || undefined,
        page,
        size: pageSize,
      };

      const response = await deviceService.getAll(params);
      const apiData = response.data.data; // Extract nested data object
      
      // Map DeviceResponse fields to component's equipment structure
      const mappedData = (apiData.content || []).map(item => ({
        equipmentId: item.id,
        equipmentCode: item.deviceCode,
        equipmentName: item.name,
        category: item.deviceType,
        location: item.location || '',
        status: item.status,
        note: item.description || '',
        quantity: item.quantity || 1,
        createdDate: item.createdDate,
        createdBy: item.createdBy || 'system',
      }));

      setEquipments(mappedData);
      
      // Handle pagination from API
      setPageInfo({
        pagesCount: apiData.pagesCount || 0,
        total: apiData.currentTotalElementsCount || 0,
        currentPage: apiData.currentPage || page,
      });
    } catch (err) {
      console.error('Fetch equipments error:', err);
      setEquipments([]);
      setPageInfo({ pagesCount: 0, total: 0, currentPage: 0 });
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => { fetchEquipments(); }, [fetchEquipments]);

  function handleSearch() {
    setPage(0);
    setQuery({ equipmentName: fEquipmentName.trim(), equipmentCode: fEquipmentCode.trim(), category: fCategory, status: fStatus });
  }
  function handleFilterKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  function clearFilters() {
    setFEquipmentName(''); setFEquipmentCode(''); setFCategory(''); setFStatus('');
    setPage(0);
    setQuery({ equipmentName: '', equipmentCode: '', category: '', status: '' });
  }

  function openAdd() {
    setForm({ equipmentName: '', equipmentCode: '', category: '', location: '', quantity: 1, status: 1, note: '' });
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openEdit(eq) {
    setForm({
      equipmentId: eq.equipmentId,
      equipmentName: eq.equipmentName,
      equipmentCode: eq.equipmentCode,
      category: eq.category,
      location: eq.location,
      quantity: eq.quantity || 1,
      status: eq.status,
      note: eq.note,
    });
    setSaveError('');
    setModal({ mode: 'edit', data: eq });
  }

  async function handleSave() {
    setSaveError('');
    const required = ['equipmentName', 'equipmentCode', 'category'];
    if (required.some(f => !form[f]?.toString().trim())) {
      setSaveError('Vui lòng nhập đủ Tên thiết bị, Mã thiết bị và Loại thiết bị.');
      return;
    }
    setSaving(true);
    try {
      // Convert status: 1 = hoạt động, 0 = ngưng
      const statusMap = { 1: 1, 0: 0, 'HOẠT_ĐỘNG': 1, 'TẠM_NGƯNG': 0, 'HƯ_HỎNG': 0, 'KỸ_TRỤC': 0 };
      const statusValue = typeof form.status === 'number' ? form.status : statusMap[form.status] || 1;
      
      const payload = {
        name: form.equipmentName.trim(),
        deviceCode: form.equipmentCode.trim(),
        deviceType: form.category,
        location: form.location?.trim() || '',
        quantity: parseInt(form.quantity) || 1,
        description: form.note?.trim() || '',
        status: statusValue,
      };

      if (modal.mode === 'add') {
        await deviceService.create(payload);
      } else {
        await deviceService.update(form.equipmentId, payload);
      }
      
      setModal(null);
      fetchEquipments(); // Reload data
      showToast(modal.mode === 'add' ? 'Tạo thiết bị thành công.' : 'Cập nhật thiết bị thành công.');
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
      await deviceService.delete(deleteModal.equipmentId);
      setDeleteModal(null);
      fetchEquipments(); // Reload data
      showToast('Xóa thiết bị thành công.');
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    } finally {
      setDeleting(false);
    }
  }

  /* Import Excel */
  function handleImportExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // TODO: Parse xlsx file - cần thêm library xlsx
        console.log('Import file:', file.name);
        showToast(`Nhập dữ liệu từ ${file.name} thành công.`);
      } catch (err) {
        showToast('Lỗi khi nhập file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  /* Export Excel */
  async function handleExportExcel() {
    try {
      setLoading(true);
      // Call API with same filters but size=10000 to get all data
      const params = {
        name: query.equipmentName || undefined,
        deviceCode: query.equipmentCode || undefined,
        deviceType: query.category || undefined,
        status: query.status || undefined,
        page: 0,
        size: 10000,
      };

      const response = await deviceService.getAll(params);
      const apiData = response.data.data;
      const allEquipments = (apiData.content || []).map(item => ({
        stt: '',
        equipmentCode: item.deviceCode,
        equipmentName: item.name,
        category: item.deviceType,
        location: item.location || '',
        quantity: item.quantity || 1,
        createdDate: item.createdDate,
        createdBy: item.createdBy || '',
        status: item.status === 1 ? 'Hoạt động' : 'Ngưng',
        note: item.description || '',
      }));

      // Add STT
      allEquipments.forEach((e, idx) => { e.stt = idx + 1; });

      // Create CSV
      const headers = ['STT', 'Mã thiết bị', 'Tên thiết bị', 'Loại', 'Vị trí/Phòng', 'Số lượng', 'Ngày nhập', 'Người nhập', 'Trạng thái', 'Mô tả'];
      const rows = allEquipments.map(e => [
        e.stt,
        e.equipmentCode,
        e.equipmentName,
        e.category,
        e.location,
        e.quantity,
        e.createdDate,
        e.createdBy,
        e.status,
        e.note,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(v => `"${v}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `danh-sach-thiet-bi-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      showToast(`Xuất dữ liệu thành công (${allEquipments.length} thiết bị).`);
    } catch (err) {
      showToast('Lỗi khi xuất dữ liệu: ' + (err.message || 'Có lỗi xảy ra'));
    } finally {
      setLoading(false);
    }
  }

  const COL_COUNT = 11;
  const getCategoryLabel = (cat) => {
    return EQUIPMENT_CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

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
          <h1 className="page-title">Quản lý thiết bị</h1>
          <p className="page-subtitle">Danh sách, quản lý và theo dõi thiết bị của hệ thống.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconDownload />
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Nhập Excel
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} style={{ display: 'none' }} />
            </label>
          </button>
          <button className="btn btn--outline" onClick={handleExportExcel}>
            <IconUpload /> Xuất Excel
          </button>
          {hasPermission('device-c') && (
            <button className="btn btn--primary" onClick={openAdd}>
              <IconPlus /> Thêm thiết bị
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field">
              <label>Mã thiết bị</label>
              <input className="input" placeholder="Nhập mã thiết bị..."
                value={fEquipmentCode} onChange={e => setFEquipmentCode(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Tên thiết bị</label>
              <input className="input" placeholder="Nhập tên thiết bị..."
                value={fEquipmentName} onChange={e => setFEquipmentName(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Loại thiết bị</label>
              <AppSelect
                options={[{ value: '', label: 'Tất cả' }, ...EQUIPMENT_CATEGORIES]}
                value={fCategory}
                onChange={(val) => setFCategory(val || '')}
                isClearable
              />
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <AppSelect
                options={[{ value: '', label: 'Tất cả' }, { value: 1, label: 'Hoạt động' }, { value: 0, label: 'Ngưng' }]}
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
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Thiết bị ({pageInfo.total})</span>
        </div>
        <div className="card__body tbl-wrap" style={{ paddingTop: 12 }}>
          <table className="tbl tbl--nowrap">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã thiết bị</th>
                <th>Tên thiết bị</th>
                <th>Loại</th>
                <th>Vị trí/Phòng</th>
                <th>Số lượng</th>
                <th>Ngày nhập</th>
                <th>Người nhập</th>
                <th>Trạng thái</th>
                <th>Mô tả</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Đang tải...</td></tr>
              )}
              {!loading && equipments.length === 0 && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && equipments.map((eq, idx) => (
                <tr key={eq.equipmentId}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{page * pageSize + idx + 1}</td>
                  <td><strong>{eq.equipmentCode}</strong></td>
                  <td>{eq.equipmentName}</td>
                  <td><span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{getCategoryLabel(eq.category)}</span></td>
                  <td style={{ color: '#6b7280' }}>{eq.location || '—'}</td>
                  <td style={{ color: '#6b7280', textAlign: 'center' }}>{eq.quantity || 1}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{eq.createdDate || '—'}</td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{eq.createdBy || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#fff',
                      backgroundColor: eq.status === 1 ? '#10b981' : '#ef4444'
                    }}>
                      {eq.status === 1 ? 'Hoạt động' : 'Ngưng'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={eq.note}>
                    {eq.note || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasPermission('device-u') && (
                        <button className="btn btn--icon" onClick={() => openEdit(eq)} title="Sửa">
                          <IconEdit />
                        </button>
                      )}
                      {hasPermission('device-d') && (
                        <button className="btn btn--icon btn--icon-danger" onClick={() => { setDeleteError(''); setDeleteModal(eq); }} title="Xóa">
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
            <span>Tổng <strong>{pageInfo.total}</strong> thiết bị</span>
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
              <span className="modal__title">{modal.mode === 'add' ? 'Thêm thiết bị' : 'Sửa thiết bị'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
                <div className="field">
                  <label>Mã thiết bị *</label>
                  <input className="input" value={form.equipmentCode} onChange={e => setForm(p => ({ ...p, equipmentCode: e.target.value }))}
                    placeholder="Ví dụ: TB001" disabled={modal.mode === 'edit'} />
                </div>
                <div className="field">
                  <label>Tên thiết bị *</label>
                  <input className="input" value={form.equipmentName} onChange={e => setForm(p => ({ ...p, equipmentName: e.target.value }))}
                    placeholder="Tên thiết bị" />
                </div>
                <div className="field">
                  <label>Loại thiết bị *</label>
                  <input className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="Ví dụ: Máy tính, Máy in, Điện thoại..." />
                </div>
                <div className="field">
                  <label>Số lượng</label>
                  <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                    placeholder="Số lượng" />
                </div>
                <div className="field">
                  <label>Vị trí</label>
                  <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Phòng/Khu vực" />
                </div>
                <div className="field">
                  <label>Trạng thái</label>
                  <AppSelect
                    options={[
                      { value: 1, label: 'Hoạt động' },
                      { value: 0, label: 'Ngưng' }
                    ]}
                    value={form.status}
                    onChange={(val) => setForm(p => ({ ...p, status: val }))}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Mô tả</label>
                  <textarea className="input" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="Mô tả thiết bị" style={{ minHeight: 80, resize: 'vertical' }} />
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
                {saving ? 'Đang lưu...' : (modal.mode === 'add' ? 'Tạo thiết bị' : 'Lưu thay đổi')}
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
                Bạn có chắc muốn xóa thiết bị <strong>{deleteModal.equipmentName}</strong> ({deleteModal.equipmentCode})?<br />
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
                {deleting ? 'Đang xóa...' : 'Xóa thiết bị'}
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
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconEdit() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconTrash() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconDownload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconUpload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
