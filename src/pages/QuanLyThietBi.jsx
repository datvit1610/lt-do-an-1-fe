import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import AppSelect from '../components/AppSelect';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const EQUIPMENT_STATUSES = [
  { value: 'HOẠT_ĐỘNG', label: 'Hoạt động' },
  { value: 'TẠM_NGƯNG', label: 'Tạm ngưng' },
  { value: 'HƯ_HỎNG', label: 'Hư hỏng' },
  { value: 'KỸ_TRỤC', label: 'Kỹ trục' },
];
const EQUIPMENT_CATEGORIES = [
  { value: 'ĐIỆN_THOẠI', label: 'Điện thoại' },
  { value: 'MÁY_TÍNH', label: 'Máy tính' },
  { value: 'MÁY_IN', label: 'Máy in' },
  { value: 'TỦ', label: 'Tủ' },
  { value: 'KHÁC', label: 'Khác' },
];

export default function QuanLyThietBi() {
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
    serialNumber: '',
    location: '',
    purchaseDate: '',
    status: 'HOẠT_ĐỘNG',
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

  /* Mock: Gọi API danh sách thiết bị */
  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Thay bằng API thực
      const params = {
        equipmentName: query.equipmentName || undefined,
        equipmentCode: query.equipmentCode || undefined,
        category: query.category || undefined,
        status: query.status || undefined,
        page,
        size: pageSize,
      };
      console.log('Fetch params:', params);

      // Mock data
      const mockData = [
        { equipmentId: '1', equipmentCode: 'TB001', equipmentName: 'Máy tính để bàn', category: 'MÁY_TÍNH', serialNumber: 'SN12345', location: 'Phòng 101', purchaseDate: '2023-01-15', status: 'HOẠT_ĐỘNG', note: 'Mới', createdDate: '2023-01-15', modifiedDate: '2024-01-10', createdBy: 'admin' },
        { equipmentId: '2', equipmentCode: 'TB002', equipmentName: 'Máy in HP LaserJet', category: 'MÁY_IN', serialNumber: 'SN12346', location: 'Phòng 102', purchaseDate: '2022-06-10', status: 'HOẠT_ĐỘNG', note: 'Đang sử dụng', createdDate: '2022-06-10', modifiedDate: '2024-01-10', createdBy: 'admin' },
        { equipmentId: '3', equipmentCode: 'TB003', equipmentName: 'Điện thoại iPhone', category: 'ĐIỆN_THOẠI', serialNumber: 'SN12347', location: 'Phòng 103', purchaseDate: '2023-05-20', status: 'TẠM_NGƯNG', note: 'Chờ sửa', createdDate: '2023-05-20', modifiedDate: '2024-01-10', createdBy: 'user1' },
        { equipmentId: '4', equipmentCode: 'TB004', equipmentName: 'Tủ tài liệu', category: 'TỦ', serialNumber: 'SN12348', location: 'Phòng 104', purchaseDate: '2021-03-12', status: 'HƯ_HỎNG', note: 'Cần thay thế', createdDate: '2021-03-12', modifiedDate: '2024-01-10', createdBy: 'admin' },
        { equipmentId: '5', equipmentCode: 'TB005', equipmentName: 'Máy tính xách tay', category: 'MÁY_TÍNH', serialNumber: 'SN12349', location: 'Phòng 105', purchaseDate: '2023-08-05', status: 'HOẠT_ĐỘNG', note: '', createdDate: '2023-08-05', modifiedDate: '2024-01-10', createdBy: 'user2' },
      ];

      setEquipments(mockData);
      setPageInfo({
        pagesCount: Math.ceil(mockData.length / pageSize),
        total: mockData.length,
        currentPage: page,
      });
    } catch {
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
    setForm({ equipmentName: '', equipmentCode: '', category: '', serialNumber: '', location: '', purchaseDate: '', status: 'HOẠT_ĐỘNG', note: '' });
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openEdit(eq) {
    setForm({
      equipmentId: eq.equipmentId,
      equipmentName: eq.equipmentName,
      equipmentCode: eq.equipmentCode,
      category: eq.category,
      serialNumber: eq.serialNumber,
      location: eq.location,
      purchaseDate: eq.purchaseDate,
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
      // TODO: Thay bằng API thực
      const payload = {
        equipmentName: form.equipmentName.trim(),
        equipmentCode: form.equipmentCode.trim(),
        category: form.category,
        serialNumber: form.serialNumber.trim(),
        location: form.location.trim(),
        purchaseDate: form.purchaseDate,
        status: form.status,
        note: form.note.trim(),
      };
      console.log('Saving:', payload);

      if (modal.mode === 'add') {
        const newItem = { ...payload, equipmentId: String(Date.now()), createdDate: new Date().toISOString().split('T')[0], createdBy: 'current_user' };
        setEquipments([newItem, ...equipments]);
      } else {
        setEquipments(equipments.map(e => e.equipmentId === form.equipmentId ? { ...e, ...payload } : e));
      }
      setModal(null);
      showToast(modal.mode === 'add' ? 'Tạo thiết bị thành công.' : 'Cập nhật thiết bị thành công.');
    } catch (err) {
      setSaveError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError('');
    setDeleting(true);
    try {
      // TODO: Thay bằng API thực
      setEquipments(equipments.filter(e => e.equipmentId !== deleteModal.equipmentId));
      setDeleteModal(null);
      showToast('Xóa thiết bị thành công.');
    } catch (err) {
      setDeleteError(err.message || 'Có lỗi xảy ra.');
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
  function handleExportExcel() {
    // TODO: Dùng library xlsx để export
    const data = equipments.map((e, idx) => ({
      'STT': idx + 1,
      'Mã thiết bị': e.equipmentCode,
      'Tên thiết bị': e.equipmentName,
      'Loại': e.category,
      'Serial': e.serialNumber,
      'Vị trí': e.location,
      'Ngày mua': e.purchaseDate,
      'Trạng thái': e.status,
      'Ghi chú': e.note,
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-thiet-bi-${new Date().getTime()}.csv`;
    link.click();
    showToast('Xuất dữ liệu thành công.');
  }

  const COL_COUNT = 11;
  const getStatusBadgeColor = (status) => {
    const statusMap = {
      'HOẠT_ĐỘNG': 'badge--green',
      'TẠM_NGƯNG': 'badge--yellow',
      'HƯ_HỎNG': 'badge--red',
      'KỸ_TRỤC': 'badge--blue',
    };
    return statusMap[status] || 'badge--gray';
  };
  const getStatusLabel = (status) => {
    return EQUIPMENT_STATUSES.find(s => s.value === status)?.label || status;
  };
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
          <button className="btn btn--primary" onClick={openAdd}>
            <IconPlus /> Thêm thiết bị
          </button>
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
                options={[{ value: '', label: 'Tất cả' }, ...EQUIPMENT_STATUSES]}
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
                <th>Mã TBi</th>
                <th>Tên thiết bị</th>
                <th>Loại</th>
                <th>Serial</th>
                <th>Vị trí</th>
                <th>Ngày mua</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
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
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{eq.serialNumber || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{eq.location || '—'}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{eq.purchaseDate || '—'}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{eq.createdDate || '—'}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(eq.status)}`}>
                      {getStatusLabel(eq.status)}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eq.note || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--icon" onClick={() => openEdit(eq)} title="Sửa">
                        <IconEdit />
                      </button>
                      <button className="btn btn--icon btn--icon-danger" onClick={() => { setDeleteError(''); setDeleteModal(eq); }} title="Xóa">
                        <IconTrash />
                      </button>
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
                  <AppSelect
                    options={EQUIPMENT_CATEGORIES}
                    value={form.category}
                    onChange={(val) => setForm(p => ({ ...p, category: val }))}
                    placeholder="-- Chọn loại --"
                  />
                </div>
                <div className="field">
                  <label>Serial Number</label>
                  <input className="input" value={form.serialNumber} onChange={e => setForm(p => ({ ...p, serialNumber: e.target.value }))}
                    placeholder="Số serial" />
                </div>
                <div className="field">
                  <label>Vị trí</label>
                  <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Phòng/Khu vực" />
                </div>
                <div className="field">
                  <label>Ngày mua</label>
                  <input className="input" type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Trạng thái</label>
                  <AppSelect
                    options={EQUIPMENT_STATUSES}
                    value={form.status}
                    onChange={(val) => setForm(p => ({ ...p, status: val }))}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Ghi chú</label>
                  <textarea className="input" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                    placeholder="Ghi chú" style={{ minHeight: 80, resize: 'vertical' }} />
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
