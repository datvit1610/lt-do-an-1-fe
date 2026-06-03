import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import AppSelect from '../components/AppSelect';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const RECEIPT_STATUSES = [
  { value: 'ĐANG_MƯỢN', label: 'Đang mượn' },
  { value: 'ĐÃ_TRẢ', label: 'Đã trả' },
  { value: 'CHẬM_TRẢ', label: 'Chậm trả' },
  { value: 'MẤT_THIẾT_BỊ', label: 'Mất thiết bị' },
];

export default function QuanLyPhieuMuonTra() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Bộ lọc */
  const [fReceiptCode, setFReceiptCode] = useState('');
  const [fBorrowerName, setFBorrowerName] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFromDate, setFFromDate] = useState('');
  const [fToDate, setFToDate] = useState('');

  /* Query đã commit */
  const [query, setQuery] = useState({ receiptCode: '', borrowerName: '', status: '', fromDate: '', toDate: '' });

  /* Phân trang */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ pagesCount: 0, total: 0, currentPage: 0 });

  const [modal, setModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [form, setForm] = useState({
    borrowerName: '',
    borrowerDepartment: '',
    equipmentCode: '',
    equipmentName: '',
    borrowDate: '',
    expectedReturnDate: '',
    actualReturnDate: '',
    status: 'ĐANG_MƯỢN',
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

  /* Mock: Gọi API danh sách phiếu mượn trả */
  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        receiptCode: query.receiptCode || undefined,
        borrowerName: query.borrowerName || undefined,
        status: query.status || undefined,
        fromDate: query.fromDate || undefined,
        toDate: query.toDate || undefined,
        page,
        size: pageSize,
      };
      console.log('Fetch params:', params);

      // Mock data
      const mockData = [
        { receiptId: '1', receiptCode: 'PMT001', borrowerName: 'Nguyễn Văn A', borrowerDepartment: 'Phòng IT', equipmentCode: 'TB001', equipmentName: 'Máy tính để bàn', borrowDate: '2024-01-10', expectedReturnDate: '2024-01-17', actualReturnDate: '2024-01-16', status: 'ĐÃ_TRẢ', note: 'Trả đúng hạn', createdDate: '2024-01-10', createdBy: 'admin' },
        { receiptId: '2', receiptCode: 'PMT002', borrowerName: 'Trần Thị B', borrowerDepartment: 'Phòng HR', equipmentCode: 'TB002', equipmentName: 'Máy in HP', borrowDate: '2024-01-12', expectedReturnDate: '2024-01-19', actualReturnDate: null, status: 'ĐANG_MƯỢN', note: 'Còn đang sử dụng', createdDate: '2024-01-12', createdBy: 'user1' },
        { receiptId: '3', receiptCode: 'PMT003', borrowerName: 'Lê Văn C', borrowerDepartment: 'Phòng Kế toán', equipmentCode: 'TB003', equipmentName: 'Điện thoại iPhone', borrowDate: '2024-01-05', expectedReturnDate: '2024-01-12', actualReturnDate: null, status: 'CHẬM_TRẢ', note: 'Quá hạn trả', createdDate: '2024-01-05', createdBy: 'user2' },
        { receiptId: '4', receiptCode: 'PMT004', borrowerName: 'Phạm Thị D', borrowerDepartment: 'Phòng Marketing', equipmentCode: 'TB004', equipmentName: 'Tủ tài liệu', borrowDate: '2023-12-28', expectedReturnDate: '2024-01-04', actualReturnDate: null, status: 'MẤT_THIẾT_BỊ', note: 'Mất thiết bị', createdDate: '2023-12-28', createdBy: 'user3' },
        { receiptId: '5', receiptCode: 'PMT005', borrowerName: 'Hoàng Văn E', borrowerDepartment: 'Phòng IT', equipmentCode: 'TB005', equipmentName: 'Máy tính xách tay', borrowDate: '2024-01-08', expectedReturnDate: '2024-01-15', actualReturnDate: '2024-01-14', status: 'ĐÃ_TRẢ', note: '', createdDate: '2024-01-08', createdBy: 'admin' },
      ];

      setReceipts(mockData);
      setPageInfo({
        pagesCount: Math.ceil(mockData.length / pageSize),
        total: mockData.length,
        currentPage: page,
      });
    } catch {
      setReceipts([]);
      setPageInfo({ pagesCount: 0, total: 0, currentPage: 0 });
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  function handleSearch() {
    setPage(0);
    setQuery({
      receiptCode: fReceiptCode.trim(),
      borrowerName: fBorrowerName.trim(),
      status: fStatus,
      fromDate: fFromDate,
      toDate: fToDate,
    });
  }
  function handleFilterKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  function clearFilters() {
    setFReceiptCode(''); setFBorrowerName(''); setFStatus(''); setFFromDate(''); setFToDate('');
    setPage(0);
    setQuery({ receiptCode: '', borrowerName: '', status: '', fromDate: '', toDate: '' });
  }

  function openAdd() {
    setForm({
      borrowerName: '',
      borrowerDepartment: '',
      equipmentCode: '',
      equipmentName: '',
      borrowDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: '',
      actualReturnDate: '',
      status: 'ĐANG_MƯỢN',
      note: '',
    });
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openEdit(rec) {
    setForm({
      receiptId: rec.receiptId,
      borrowerName: rec.borrowerName,
      borrowerDepartment: rec.borrowerDepartment,
      equipmentCode: rec.equipmentCode,
      equipmentName: rec.equipmentName,
      borrowDate: rec.borrowDate,
      expectedReturnDate: rec.expectedReturnDate,
      actualReturnDate: rec.actualReturnDate,
      status: rec.status,
      note: rec.note,
    });
    setSaveError('');
    setModal({ mode: 'edit', data: rec });
  }

  async function handleSave() {
    setSaveError('');
    const required = ['borrowerName', 'equipmentCode', 'borrowDate', 'expectedReturnDate'];
    if (required.some(f => !form[f]?.toString().trim())) {
      setSaveError('Vui lòng nhập đủ Tên người mượn, Mã thiết bị, Ngày mượn và Ngày dự kiến trả.');
      return;
    }

    if (form.actualReturnDate && form.actualReturnDate < form.borrowDate) {
      setSaveError('Ngày trả không được trước ngày mượn.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        borrowerName: form.borrowerName.trim(),
        borrowerDepartment: form.borrowerDepartment.trim(),
        equipmentCode: form.equipmentCode.trim(),
        equipmentName: form.equipmentName.trim(),
        borrowDate: form.borrowDate,
        expectedReturnDate: form.expectedReturnDate,
        actualReturnDate: form.actualReturnDate || null,
        status: form.status,
        note: form.note.trim(),
      };
      console.log('Saving:', payload);

      if (modal.mode === 'add') {
        const newItem = { ...payload, receiptId: String(Date.now()), receiptCode: `PMT${String(Date.now()).slice(-6)}`, createdDate: new Date().toISOString().split('T')[0], createdBy: 'current_user' };
        setReceipts([newItem, ...receipts]);
      } else {
        setReceipts(receipts.map(r => r.receiptId === form.receiptId ? { ...r, ...payload } : r));
      }
      setModal(null);
      showToast(modal.mode === 'add' ? 'Tạo phiếu mượn trả thành công.' : 'Cập nhật phiếu mượn trả thành công.');
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
      setReceipts(receipts.filter(r => r.receiptId !== deleteModal.receiptId));
      setDeleteModal(null);
      showToast('Xóa phiếu mượn trả thành công.');
    } catch (err) {
      setDeleteError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setDeleting(false);
    }
  }

  /* Export Excel */
  function handleExportExcel() {
    const data = receipts.map((r, idx) => ({
      'STT': idx + 1,
      'Mã phiếu': r.receiptCode,
      'Người mượn': r.borrowerName,
      'Phòng ban': r.borrowerDepartment,
      'Mã TBi': r.equipmentCode,
      'Tên TBi': r.equipmentName,
      'Ngày mượn': r.borrowDate,
      'Ngày dự kiến trả': r.expectedReturnDate,
      'Ngày thực tế trả': r.actualReturnDate || '-',
      'Trạng thái': r.status,
      'Ghi chú': r.note,
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-phieu-muon-tra-${new Date().getTime()}.csv`;
    link.click();
    showToast('Xuất dữ liệu thành công.');
  }

  const COL_COUNT = 11;
  const getStatusBadgeColor = (status) => {
    const statusMap = {
      'ĐÃ_TRẢ': 'badge--green',
      'ĐANG_MƯỢN': 'badge--blue',
      'CHẬM_TRẢ': 'badge--yellow',
      'MẤT_THIẾT_BỊ': 'badge--red',
    };
    return statusMap[status] || 'badge--gray';
  };
  const getStatusLabel = (status) => {
    return RECEIPT_STATUSES.find(s => s.value === status)?.label || status;
  };

  const isOverdue = (receipt) => {
    if (receipt.status === 'ĐÃ_TRẢ' || receipt.status === 'MẤT_THIẾT_BỊ') return false;
    return new Date(receipt.expectedReturnDate) < new Date();
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
          <h1 className="page-title">Quản lý phiếu mượn trả</h1>
          <p className="page-subtitle">Theo dõi và quản lý các phiếu mượn, trả thiết bị của hệ thống.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" onClick={handleExportExcel}>
            <IconUpload /> Xuất Excel
          </button>
          <button className="btn btn--primary" onClick={openAdd}>
            <IconPlus /> Tạo phiếu mượn
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field">
              <label>Mã phiếu</label>
              <input className="input" placeholder="Nhập mã phiếu..."
                value={fReceiptCode} onChange={e => setFReceiptCode(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Tên người mượn</label>
              <input className="input" placeholder="Nhập tên..."
                value={fBorrowerName} onChange={e => setFBorrowerName(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <AppSelect
                options={[{ value: '', label: 'Tất cả' }, ...RECEIPT_STATUSES]}
                value={fStatus}
                onChange={(val) => setFStatus(val || '')}
                isClearable
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Từ ngày</label>
                <input className="input" type="date" value={fFromDate} onChange={e => setFFromDate(e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.75rem' }}>Đến ngày</label>
                <input className="input" type="date" value={fToDate} onChange={e => setFToDate(e.target.value)} />
              </div>
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
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Phiếu mượn trả ({pageInfo.total})</span>
        </div>
        <div className="card__body tbl-wrap" style={{ paddingTop: 12 }}>
          <table className="tbl tbl--nowrap">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã phiếu</th>
                <th>Người mượn</th>
                <th>Phòng ban</th>
                <th>Mã TBi</th>
                <th>Ngày mượn</th>
                <th>Dự kiến trả</th>
                <th>Trạng thái</th>
                <th>Ghi chú</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Đang tải...</td></tr>
              )}
              {!loading && receipts.length === 0 && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && receipts.map((rec, idx) => (
                <tr key={rec.receiptId} style={{ backgroundColor: isOverdue(rec) ? '#fff5f6' : 'transparent' }}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{page * pageSize + idx + 1}</td>
                  <td><strong>{rec.receiptCode}</strong></td>
                  <td>{rec.borrowerName}</td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>{rec.borrowerDepartment || '—'}</td>
                  <td style={{ color: '#6b7280' }}>{rec.equipmentCode}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{rec.borrowDate}</td>
                  <td style={{ color: isOverdue(rec) ? '#c8102e' : '#9ca3af', fontSize: '0.82rem', fontWeight: isOverdue(rec) ? 600 : 400 }}>
                    {rec.expectedReturnDate} {isOverdue(rec) && <span title="Quá hạn">⚠️</span>}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(rec.status)}`}>
                      {getStatusLabel(rec.status)}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rec.note || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn--icon" onClick={() => openEdit(rec)} title="Sửa">
                        <IconEdit />
                      </button>
                      <button className="btn btn--icon btn--icon-danger" onClick={() => { setDeleteError(''); setDeleteModal(rec); }} title="Xóa">
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
            <span>Tổng <strong>{pageInfo.total}</strong> phiếu</span>
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
              <span className="modal__title">{modal.mode === 'add' ? 'Tạo phiếu mượn' : 'Cập nhật phiếu mượn'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
                <div className="field">
                  <label>Tên người mượn *</label>
                  <input className="input" value={form.borrowerName} onChange={e => setForm(p => ({ ...p, borrowerName: e.target.value }))}
                    placeholder="Tên người mượn" />
                </div>
                <div className="field">
                  <label>Phòng ban</label>
                  <input className="input" value={form.borrowerDepartment} onChange={e => setForm(p => ({ ...p, borrowerDepartment: e.target.value }))}
                    placeholder="Phòng/Bộ phận" />
                </div>
                <div className="field">
                  <label>Mã thiết bị *</label>
                  <input className="input" value={form.equipmentCode} onChange={e => setForm(p => ({ ...p, equipmentCode: e.target.value }))}
                    placeholder="Ví dụ: TB001" />
                </div>
                <div className="field">
                  <label>Tên thiết bị</label>
                  <input className="input" value={form.equipmentName} onChange={e => setForm(p => ({ ...p, equipmentName: e.target.value }))}
                    placeholder="Tên thiết bị" />
                </div>
                <div className="field">
                  <label>Ngày mượn *</label>
                  <input className="input" type="date" value={form.borrowDate} onChange={e => setForm(p => ({ ...p, borrowDate: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Ngày dự kiến trả *</label>
                  <input className="input" type="date" value={form.expectedReturnDate} onChange={e => setForm(p => ({ ...p, expectedReturnDate: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Ngày thực tế trả</label>
                  <input className="input" type="date" value={form.actualReturnDate} onChange={e => setForm(p => ({ ...p, actualReturnDate: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Trạng thái</label>
                  <AppSelect
                    options={RECEIPT_STATUSES}
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
                {saving ? 'Đang lưu...' : (modal.mode === 'add' ? 'Tạo phiếu' : 'Lưu thay đổi')}
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
                Bạn có chắc muốn xóa phiếu <strong>{deleteModal.receiptCode}</strong>?<br />
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
                {deleting ? 'Đang xóa...' : 'Xóa phiếu'}
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
function IconUpload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
