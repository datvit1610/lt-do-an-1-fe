import React, { useState, useEffect, useCallback } from 'react';
import ReactPaginate from 'react-paginate';
import AppSelect from '../components/AppSelect';
import { loanService } from '../services/api';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
// Trạng thái: 1 - đang mượn, 2 - đã trả, 3 - Trả chậm, 4 - Mất thiết bị
const LOAN_STATUSES = [
  { value: 1, label: 'Đang mượn' },
  { value: 2, label: 'Đã trả' },
  { value: 3, label: 'Trả chậm' },
  { value: 4, label: 'Mất thiết bị' },
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

export default function TongHopPhieuMuonTra() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);

  /* Bộ lọc */
  const [fLoanCode, setFLoanCode] = useState('');
  const [fBorrowerName, setFBorrowerName] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFromDate, setFFromDate] = useState('');
  const [fToDate, setFToDate] = useState('');

  /* Query đã commit */
  const [query, setQuery] = useState({ loanCode: '', borrowerName: '', status: '', fromDate: '', toDate: '' });

  /* Phân trang */
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageInfo, setPageInfo] = useState({ pagesCount: 0, total: 0, currentPage: 0 });

  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* Gọi API tổng hợp phiếu mượn (tất cả người dùng) */
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        loanCode: query.loanCode || undefined,
        borrowerName: query.borrowerName || undefined,
        status: query.status !== '' ? query.status : undefined,
        fromDate: query.fromDate || undefined,
        toDate: query.toDate || undefined,
        page,
        size: pageSize,
      };

      const response = await loanService.getAll(params);
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
    setFLoanCode(''); setFBorrowerName(''); setFStatus(''); setFFromDate(''); setFToDate('');
    setPage(0);
    setQuery({ loanCode: '', borrowerName: '', status: '', fromDate: '', toDate: '' });
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
    link.download = `tong-hop-phieu-muon-${new Date().getTime()}.csv`;
    link.click();
    showToast('Xuất dữ liệu thành công.');
  }

  const COL_COUNT = 14;
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
          <h1 className="page-title">Tổng hợp phiếu mượn trả</h1>
          <p className="page-subtitle">Theo dõi tất cả phiếu mượn, trả thiết bị của toàn bộ người dùng trong hệ thống.</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--outline" onClick={handleExportExcel}>
            <IconUpload /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="field">
              <label>Mã phiếu mượn</label>
              <input className="input" placeholder="Nhập mã phiếu..."
                value={fLoanCode} onChange={e => setFLoanCode(e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>
            <div className="field">
              <label>Tên người mượn</label>
              <input className="input" placeholder="Nhập tên..."
                value={fBorrowerName} onChange={e => setFBorrowerName(e.target.value)} onKeyDown={handleFilterKeyDown} />
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
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Tổng hợp phiếu mượn trả ({pageInfo.total})</span>
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
    </div>
  );
}

// Icons
function IconSearch() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconUpload() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
