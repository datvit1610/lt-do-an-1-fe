import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import AppSelect from '../components/AppSelect';
import DeviceSelect from '../components/DeviceSelect';
import { loanService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// Trạng thái: 1 - đang mượn, 2 - đã trả, 3 - Trả chậm, 4 - Mất thiết bị
const LOAN_STATUSES = [
  { value: 1, label: 'Đang mượn' },
  { value: 2, label: 'Đã trả' },
  { value: 3, label: 'Trả chậm' },
  { value: 4, label: 'Mất thiết bị' },
];
// Trạng thái cập nhật trả đồ: 1 - trả đồ, 2 - mất đồ
const RETURN_STATUSES = [
  { value: 1, label: 'Trả đồ' },
  { value: 2, label: 'Mất đồ' },
];

/* Định dạng ngày giờ từ giá trị Date của backend */
function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function QuanLyPhieuMuonTra() {
  const { hasPermission } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Bộ lọc */
  const [fLoanCode, setFLoanCode] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFromDate, setFFromDate] = useState('');
  const [fToDate, setFToDate] = useState('');

  /* Query đã commit */
  const [query, setQuery] = useState({ loanCode: '', status: '', fromDate: '', toDate: '' });

  /* Phân trang */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ pagesCount: 0, total: 0, currentPage: 0 });

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({
    deviceOption: null,
    quantity: 1,
    borrowPeriod: '',
    returnPeriod: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* Gọi API danh sách phiếu mượn */
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        loanCode: query.loanCode || undefined,
        status: query.status !== '' ? query.status : undefined,
        fromDate: query.fromDate || undefined,
        toDate: query.toDate || undefined,
        page,
        size: pageSize,
      };

      const response = await loanService.getAllForUser(params);
      const apiData = response.data.data; // Bóc tách object data lồng nhau

      const mappedData = (apiData.content || []).map(item => ({
        id: item.id,
        loanCode: item.loanCode,
        borrowerName: item.borrowerName,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        borrowDate: item.borrowDate,
        borrowPeriod: item.borrowPeriod,
        returnPeriod: item.returnPeriod,
        actualReturnDate: item.actualReturnDate,
        status: item.status,
        statusSaving: item.statusSaving,
        note: item.note,
        lateMinutes: item.lateMinutes,
        createdDate: item.createdDate,
        modifiedDate: item.modifiedDate,
      }));

      setLoans(mappedData);
      setPageInfo({
        pagesCount: apiData.pagesCount || 0,
        total: apiData.currentTotalElementsCount || 0,
        currentPage: apiData.currentPage || page,
      });
    } catch (err) {
      console.error('Fetch loans error:', err);
      setLoans([]);
      setPageInfo({ pagesCount: 0, total: 0, currentPage: 0 });
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  function handleSearch() {
    setPage(0);
    setQuery({
      loanCode: fLoanCode.trim(),
      status: fStatus,
      fromDate: fFromDate,
      toDate: fToDate,
    });
  }
  function handleFilterKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }

  function clearFilters() {
    setFLoanCode(''); setFStatus(''); setFFromDate(''); setFToDate('');
    setPage(0);
    setQuery({ loanCode: '', status: '', fromDate: '', toDate: '' });
  }

  function openAdd() {
    setForm({
      deviceOption: null,
      quantity: 1,
      borrowPeriod: '',
      returnPeriod: '',
      note: '',
    });
    setSaveError('');
    setModal({ mode: 'add' });
  }
  function openReturn(rec) {
    setForm({ id: rec.id, status: 1, note: '' });
    setSaveError('');
    setModal({ mode: 'return', data: rec });
  }

  async function handleSave() {
    setSaveError('');

    if (modal.mode === 'add') {
      if (!form.deviceOption?.value) {
        setSaveError('Vui lòng chọn thiết bị.');
        return;
      }
    } else {
      // Cập nhật trả đồ: mất đồ bắt buộc nhập ghi chú
      if (form.status === 2 && !form.note.trim()) {
        setSaveError('Vui lòng nhập ghi chú khi chọn "Mất đồ".');
        return;
      }
    }

    setSaving(true);
    try {
      if (modal.mode === 'add') {
        const payload = {
          deviceId: form.deviceOption.value,
          quantity: parseInt(form.quantity) || 1,
          borrowPeriod: form.borrowPeriod !== '' ? parseInt(form.borrowPeriod) : null,
          returnPeriod: form.returnPeriod !== '' ? parseInt(form.returnPeriod) : null,
          note: form.note.trim(),
        };
        const res = await loanService.create(payload);
        const body = res?.data;
        if (body && (body.success === false || body.code >= 400)) {
          setSaveError(body.message || 'Có lỗi xảy ra.');
          return;
        }
      } else {
        const payload = {
          status: form.status,
          note: form.note.trim(),
        };
        const res = await loanService.update(form.id, payload);
        const body = res?.data;
        if (body && (body.success === false || body.code >= 400)) {
          setSaveError(body.message || 'Có lỗi xảy ra.');
          return;
        }
      }
      setModal(null);
      fetchLoans();
      showToast(modal.mode === 'add' ? 'Tạo phiếu mượn thành công.' : 'Cập nhật trả đồ thành công.');
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Có lỗi xảy ra.');
    } finally {
      setSaving(false);
    }
  }

  /* Export Excel */
  function handleExportExcel() {
    const data = loans.map((r, idx) => ({
      'STT': idx + 1,
      'Mã phiếu mượn': r.loanCode,
      'Người mượn': r.borrowerName,
      'Mã thiết bị': r.itemCode,
      'Tên thiết bị': r.itemName,
      'Số lượng': r.quantity,
      'Thời gian mượn': formatDateTime(r.borrowDate),
      'Tiết mượn': r.borrowPeriod ?? '',
      'Tiết trả': r.returnPeriod ?? '',
      'Thời gian trả thực tế': formatDateTime(r.actualReturnDate),
      'Trạng thái': getStatusLabel(r.status),
      'Số phút trả chậm': r.lateMinutes ?? '',
      'Ghi chú': r.note || '',
      'Ngày tạo': formatDateTime(r.createdDate),
      'Ngày cập nhật': formatDateTime(r.modifiedDate),
    }));

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-phieu-muon-${new Date().getTime()}.csv`;
    link.click();
    showToast('Xuất dữ liệu thành công.');
  }

  const COL_COUNT = 15;
  const getStatusBadgeColor = (status) => {
    const statusMap = {
      1: 'badge--blue',   // Đang mượn
      2: 'badge--green',  // Đã trả
      3: 'badge--yellow', // Trả chậm
      4: 'badge--red',    // Mất thiết bị
    };
    return statusMap[status] || 'badge--gray';
  };
  const getStatusLabel = (status) => {
    return LOAN_STATUSES.find(s => s.value === status)?.label || status;
  };
  const isLate = (rec) => rec.status === 3 || rec.status === 4;
  // Chỉ cho cập nhật trả đồ khi phiếu còn "Chưa trả" (Đang mượn)
  const canReturn = (rec) => rec.statusSaving === 1;

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
          {hasPermission('loan-c') && (
            <button className="btn btn--primary" onClick={openAdd}>
              <IconPlus /> Tạo phiếu mượn
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field">
              <label>Mã phiếu mượn</label>
              <input className="input" placeholder="Nhập mã phiếu..."
                value={fLoanCode} onChange={e => setFLoanCode(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <AppSelect
                options={[{ value: '', label: 'Tất cả' }, ...LOAN_STATUSES]}
                value={fStatus}
                onChange={(val) => setFStatus(val ?? '')}
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
                <th>Mã phiếu mượn</th>
                <th>Người mượn</th>
                <th>Mã thiết bị</th>
                <th>Tên thiết bị</th>
                <th>Số lượng</th>
                <th>Thời gian mượn</th>
                <th>Tiết mượn</th>
                <th>Tiết trả</th>
                <th>Thời gian trả thực tế</th>
                <th>Trạng thái</th>
                <th>Trả chậm (phút)</th>
                <th>Ghi chú</th>
                <th>Ngày cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Đang tải...</td></tr>
              )}
              {!loading && loans.length === 0 && (
                <tr><td colSpan={COL_COUNT} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Không có dữ liệu</td></tr>
              )}
              {!loading && loans.map((rec, idx) => (
                <tr key={rec.id} style={{ backgroundColor: isLate(rec) ? '#fff5f6' : 'transparent' }}>
                  <td style={{ color: '#9ca3af', width: 48 }}>{page * pageSize + idx + 1}</td>
                  <td><strong>{rec.loanCode}</strong></td>
                  <td>{rec.borrowerName}</td>
                  <td style={{ color: '#6b7280' }}>{rec.itemCode}</td>
                  <td>{rec.itemName}</td>
                  <td style={{ color: '#6b7280', textAlign: 'center' }}>{rec.quantity ?? '—'}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{formatDateTime(rec.borrowDate)}</td>
                  <td style={{ color: '#6b7280', textAlign: 'center' }}>{rec.borrowPeriod ?? '—'}</td>
                  <td style={{ color: '#6b7280', textAlign: 'center' }}>{rec.returnPeriod ?? '—'}</td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{formatDateTime(rec.actualReturnDate)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(rec.status)}`}>
                      {getStatusLabel(rec.status)}
                    </span>
                  </td>
                  <td style={{ color: isLate(rec) ? '#c8102e' : '#9ca3af', textAlign: 'center', fontWeight: rec.lateMinutes ? 600 : 400 }}>
                    {rec.lateMinutes != null ? rec.lateMinutes : '—'}
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.note}>
                    {rec.note || '—'}
                  </td>
                  <td style={{ color: '#9ca3af', fontSize: '0.82rem' }}>{formatDateTime(rec.modifiedDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {hasPermission('loan-u') && (
                        <button
                          className="btn btn--outline btn--sm"
                          onClick={() => openReturn(rec)}
                          disabled={!canReturn(rec)}
                          title={canReturn(rec) ? 'Cập nhật trả đồ' : 'Phiếu đã được xử lý'}
                          style={!canReturn(rec) ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                        >
                          <IconReturn /> Cập nhật trả đồ
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

      {/* Add / Return Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth: modal.mode === 'add' ? 760 : 480 }}>
            <div className="modal__head">
              <span className="modal__title">{modal.mode === 'add' ? 'Tạo phiếu mượn' : 'Cập nhật trả đồ'}</span>
              <button className="modal__close btn" onClick={() => setModal(null)}><IconX /></button>
            </div>
            <div className="modal__body">
              {modal.mode === 'add' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px' }}>
                  <div className="field">
                    <label>Thiết bị *</label>
                    <DeviceSelect
                      value={form.deviceOption}
                      onChange={(opt) => setForm(p => ({ ...p, deviceOption: opt }))}
                    />
                  </div>
                  <div className="field">
                    <label>Số lượng</label>
                    <input className="input" type="number" min="1" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                      placeholder="Số lượng" />
                  </div>
                  <div className="field">
                    <label>Tiết mượn</label>
                    <input className="input" type="number" min="1" value={form.borrowPeriod} onChange={e => setForm(p => ({ ...p, borrowPeriod: e.target.value }))}
                      placeholder="Số tiết" />
                  </div>
                  <div className="field">
                    <label>Tiết trả</label>
                    <input className="input" type="number" min="1" value={form.returnPeriod} onChange={e => setForm(p => ({ ...p, returnPeriod: e.target.value }))}
                      placeholder="Số tiết" />
                  </div>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label>Ghi chú</label>
                    <textarea className="input" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                      placeholder="Ghi chú" style={{ minHeight: 80, resize: 'vertical' }} />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
                  {modal.data && (
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Phiếu mượn: <strong style={{ color: '#1a1f2e' }}>{modal.data.loanCode}</strong>
                      {modal.data.itemName ? ` — ${modal.data.itemName}` : ''}
                    </div>
                  )}
                  <div className="field">
                    <label>Trạng thái trả *</label>
                    <AppSelect
                      options={RETURN_STATUSES}
                      value={form.status}
                      onChange={(val) => setForm(p => ({ ...p, status: val }))}
                    />
                  </div>
                  <div className="field">
                    <label>
                      Ghi chú {form.status === 2 && <span style={{ color: '#c8102e' }}>*</span>}
                    </label>
                    <textarea className="input" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                      placeholder={form.status === 2 ? 'Bắt buộc nhập lý do mất đồ...' : 'Ghi chú (không bắt buộc)'}
                      style={{ minHeight: 80, resize: 'vertical' }} />
                  </div>
                </div>
              )}
              {saveError && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#fff0f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c8102e', fontSize: '0.84rem' }}>
                  {saveError}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setModal(null)} disabled={saving}>Hủy</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : (modal.mode === 'add' ? 'Tạo phiếu' : 'Cập nhật')}
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
function IconReturn() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>; }
function IconUpload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
