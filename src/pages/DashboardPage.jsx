import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/api';

/* Format Date → 'YYYY-MM-DD' để gắn vào input[type=date] và gửi API */
function toYmd(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/* Khoảng mặc định: 1 tháng trước → hôm nay */
function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  return { from: toYmd(from), to: toYmd(to) };
}
/* Format giá trị Date từ BE → 'YYYY-MM-DD' (fallback: chuỗi gốc) */
function ymdFromApi(val, fallback) {
  if (!val) return fallback;
  const d = new Date(val);
  return isNaN(d.getTime()) ? fallback : toYmd(d);
}

/* ── Mock data cho hệ thống quản lý thiết bị ── */
const RECENT_RECEIPTS = [
  { receiptCode: 'PMT001', borrower: 'Nguyễn Văn A', equipment: 'Máy tính', borrowDate: '27/05/2026', returnDate: '03/06/2026', status: 'ĐÃ_TRẢ', daysLeft: -1 },
  { receiptCode: 'PMT002', borrower: 'Trần Thị B', equipment: 'Máy in HP', borrowDate: '25/05/2026', returnDate: '01/06/2026', status: 'ĐANG_MƯỢN', daysLeft: 5 },
  { receiptCode: 'PMT003', borrower: 'Lê Văn C', equipment: 'Điện thoại', borrowDate: '20/05/2026', returnDate: '27/05/2026', status: 'CHẬM_TRẢ', daysLeft: -3 },
  { receiptCode: 'PMT004', borrower: 'Phạm Thị D', equipment: 'Tủ tài liệu', borrowDate: '28/05/2026', returnDate: '04/06/2026', status: 'ĐANG_MƯỢN', daysLeft: 3 },
  { receiptCode: 'PMT005', borrower: 'Hoàng Văn E', equipment: 'Máy tính xách tay', borrowDate: '26/05/2026', returnDate: '02/06/2026', status: 'ĐANG_MƯỢN', daysLeft: 4 },
];

const OVERDUE_EQUIPMENT = [
  { receiptCode: 'PMT003', equipment: 'Điện thoại', borrower: 'Lê Văn C', overdueDays: 3, expectedReturn: '27/05/2026' },
  { receiptCode: 'PMT006', equipment: 'Máy tính', borrower: 'Hoàng Văn F', overdueDays: 1, expectedReturn: '28/05/2026' },
  { receiptCode: 'PMT007', equipment: 'Máy in', borrower: 'Ngô Thị G', overdueDays: 5, expectedReturn: '24/05/2026' },
];

const ACTIVITY_LOG = [
  { time: '27/05/2026 14:30', user: 'Admin', action: 'Tạo thiết bị', target: 'Máy tính Dell', type: 'create' },
  { time: '26/05/2026 10:15', user: 'Phạm Thị D', action: 'Mượn thiết bị', target: 'Tủ tài liệu', type: 'borrow' },
  { time: '25/05/2026 16:45', user: 'Trần Thị B', action: 'Trả thiết bị', target: 'Máy in HP', type: 'return' },
  { time: '24/05/2026 11:20', user: 'Admin', action: 'Cập nhật trạng thái', target: 'Máy tính #TB028', type: 'update' },
  { time: '23/05/2026 09:00', user: 'Admin', action: 'Nhập thiết bị từ Excel', target: '10 thiết bị', type: 'import' },
];

const ACTIVITY_COLOR = {
  create: '#059669',
  borrow: '#2563eb',
  return: '#8b5cf6',
  update: '#d97706',
  import: '#c8102e',
  warning: '#dc2626',
};

function DonutChart({ data, unit = 'thiết bị' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const total = data.reduce((s, item) => s + item.count, 0);
  const radius = 75;
  const cx = 100, cy = 100;

  let currentAngle = -90;

  const segments = data.map((item) => {
    const sliceAngle = (item.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    currentAngle = endAngle;

    return {
      ...item,
      percentage: ((item.count / total) * 100).toFixed(1),
      path,
    };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
        <svg width="220" height="220" style={{ maxWidth: '100%' }}>
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={seg.path}
              fill={seg.color}
              fillOpacity={hoveredIndex === idx ? 1 : 0.9}
              onMouseEnter={(e) => {
                setHoveredIndex(idx);
                setTooltipPos({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s' }}
            />
          ))}
        </svg>
        {hoveredIndex !== null && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x + 10,
              top: tooltipPos.y + 10,
              background: '#1a1f2e',
              color: '#fff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: 6,
              pointerEvents: 'none',
              fontSize: '0.85rem',
              zIndex: 999,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ fontWeight: 600 }}>{segments[hoveredIndex].name}</div>
            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
              {segments[hoveredIndex].count} {unit} · {segments[hoveredIndex].percentage}%
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', justifyContent: 'center' }}>
        {segments.map((seg) => (
          <div key={seg.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#1a1f2e' }}>{seg.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{seg.count} ({seg.percentage}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Làm tròn max trục Y lên giá trị "đẹp" */
function niceMax(m) {
  if (m <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(m)));
  const r = m / pow;
  const nice = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10;
  return nice * pow;
}

/* Biểu đồ đường: data = [{ label, loans }] */
function LineChart({ data, color = '#c8102e' }) {
  const [hover, setHover] = useState(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  const W = 760, H = 300;
  const padL = 38, padR = 16, padT = 16, padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const n = data.length;
  const maxVal = Math.max(1, ...data.map(d => Number(d.loans) || 0));
  const maxY = niceMax(maxVal);
  const TICKS = 5;
  const yTicks = Array.from({ length: TICKS + 1 }, (_, i) => Math.round((maxY * i) / TICKS));

  const xAt = (i) => (n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const yAt = (v) => padT + plotH - (v / maxY) * plotH;

  const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(Number(d.loans) || 0), label: d.label, loans: Number(d.loans) || 0 }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${padT + plotH} L ${pts[0].x.toFixed(1)} ${padT + plotH} Z`
    : '';

  const maxLabels = 10;
  const labelStep = Math.max(1, Math.ceil(n / maxLabels));
  const showDots = n <= 24;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Lưới ngang + nhãn trục Y */}
        {yTicks.map((t, i) => {
          const y = yAt(t);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#eef0f3" strokeWidth="1" />
              <text x={padL - 8} y={y + 3} textAnchor="end" fontSize="11" fill="#9ca3af">{t}</text>
            </g>
          );
        })}

        {/* Nhãn trục X */}
        {pts.map((p, i) => (
          (i % labelStep === 0 || i === n - 1) && (
            <text key={i} x={p.x} y={H - 10} textAnchor="middle" fontSize="11" fill="#9ca3af">{p.label}</text>
          )
        ))}

        {/* Vùng tô + đường */}
        {areaPath && <path d={areaPath} fill="url(#lineFill)" />}
        {pts.length > 1 && <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}

        {/* Điểm dữ liệu */}
        {pts.map((p, i) => (
          <g key={i}>
            {showDots && <circle cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />}
            <circle
              cx={p.x} cy={p.y} r="10" fill="transparent"
              onMouseEnter={(e) => { setHover(i); setTipPos({ x: e.clientX, y: e.clientY }); }}
              onMouseMove={(e) => setTipPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>

      {hover !== null && pts[hover] && (
        <div style={{
          position: 'fixed', left: tipPos.x + 12, top: tipPos.y + 12,
          background: '#1a1f2e', color: '#fff', padding: '8px 12px', borderRadius: 6,
          pointerEvents: 'none', fontSize: '0.82rem', zIndex: 999, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          <div style={{ fontWeight: 600 }}>{pts[hover].label}</div>
          <div style={{ marginTop: 2 }}>{pts[hover].loans} lượt mượn</div>
        </div>
      )}
    </div>
  );
}


export default function DashboardPage() {
  /* ── Tổng quan hệ thống (API thật) ── */
  const [range, setRange] = useState(defaultRange);
  const [overview, setOverview] = useState(null);
  const [ovLoading, setOvLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setOvLoading(true);
    try {
      const res = await dashboardService.overview({ fromDate: range.from, toDate: range.to });
      setOverview(res.data?.data ?? null);
    } catch (err) {
      console.error('Fetch dashboard overview error:', err);
      setOverview(null);
    } finally {
      setOvLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  /* ── Top 5 thiết bị được mượn nhiều nhất ── */
  const [top5, setTop5] = useState([]);
  const [topLoading, setTopLoading] = useState(false);

  const fetchTop5 = useCallback(async () => {
    setTopLoading(true);
    try {
      const res = await dashboardService.top5Devices({ fromDate: range.from, toDate: range.to });
      const data = res.data?.data ?? [];
      setTop5(Array.isArray(data) ? data : (data.content || []));
    } catch (err) {
      console.error('Fetch top5 devices error:', err);
      setTop5([]);
    } finally {
      setTopLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { fetchTop5(); }, [fetchTop5]);

  /* ── Thống kê phiếu mượn theo trạng thái (biểu đồ tròn) ── */
  const [loanStats, setLoanStats] = useState(null);
  const [loanStatsLoading, setLoanStatsLoading] = useState(false);

  const fetchLoanStats = useCallback(async () => {
    setLoanStatsLoading(true);
    try {
      const res = await dashboardService.loanStatusStats({ fromDate: range.from, toDate: range.to });
      setLoanStats(res.data?.data ?? null);
    } catch (err) {
      console.error('Fetch loan status stats error:', err);
      setLoanStats(null);
    } finally {
      setLoanStatsLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { fetchLoanStats(); }, [fetchLoanStats]);

  /* ── Xu hướng lượt mượn theo thời gian (biểu đồ line) ── */
  const [trendGroup, setTrendGroup] = useState('DAY'); // DAY | WEEK | MONTH
  const [trend, setTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await dashboardService.loanTrend({ fromDate: range.from, toDate: range.to, groupBy: trendGroup });
      setTrend(res.data?.data ?? null);
    } catch (err) {
      console.error('Fetch loan trend error:', err);
      setTrend(null);
    } finally {
      setTrendLoading(false);
    }
  }, [range.from, range.to, trendGroup]);

  useEffect(() => { fetchTrend(); }, [fetchTrend]);

  const trendPoints = trend?.data ?? [];
  const TREND_GROUPS = [
    { value: 'DAY', label: 'Ngày' },
    { value: 'WEEK', label: 'Tuần' },
    { value: 'MONTH', label: 'Tháng' },
  ];

  const loanStatusData = [
    { name: 'Đang mượn', count: Number(loanStats?.borrowing ?? 0), color: '#2563eb' },
    { name: 'Đã trả', count: Number(loanStats?.returned ?? 0), color: '#059669' },
    { name: 'Trả chậm', count: Number(loanStats?.lateReturn ?? 0), color: '#d97706' },
    { name: 'Mất thiết bị', count: Number(loanStats?.lost ?? 0), color: '#c8102e' },
  ];
  const loanStatusTotal = loanStatusData.reduce((s, d) => s + d.count, 0);

  // Chuẩn hóa dữ liệu top5 (hỗ trợ nhiều tên field từ BE)
  const TOP5_COLORS = ['#c8102e', '#2563eb', '#059669', '#d97706', '#9333ea'];
  const topRows = (top5 || []).map((d, i) => ({
    name: d.deviceName ?? d.name ?? d.itemName ?? d.deviceCode ?? '—',
    code: d.deviceCode ?? d.itemCode ?? d.code ?? '',
    count: Number(d.borrowCount ?? d.totalLoans ?? d.loanCount ?? d.count ?? d.total ?? 0),
    color: TOP5_COLORS[i % TOP5_COLORS.length],
  }));
  const topMax = Math.max(1, ...topRows.map(r => r.count));

  const fromLabel = ymdFromApi(overview?.fromDate, range.from);
  const toLabel = ymdFromApi(overview?.toDate, range.to);
  const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString('vi-VN'));

  const OVERVIEW_CARDS = [
    { label: 'Đầu thiết bị', value: overview?.totalDeviceTypes, sub: 'Số loại / mã thiết bị có trong hệ thống', icon: '📚', color: '#c8102e', bg: '#fff0f2' },
    { label: 'Tổng số lượng', value: overview?.totalDeviceQuantity, sub: 'Cộng dồn số lượng tất cả thiết bị', icon: '🧱', color: '#d97706', bg: '#fffbeb' },
    { label: 'Lượt mượn', value: overview?.totalLoans, sub: `Từ ${fromLabel} đến ${toLabel}`, icon: '📋', color: '#059669', bg: '#ecfdf5' },
    { label: 'Lượt mất', value: overview?.totalLost, sub: `Từ ${fromLabel} đến ${toLabel}`, icon: '⚠️', color: '#dc2626', bg: '#fef2f2' },
    { label: 'Giảng viên', value: overview?.totalTeachers, sub: 'Tài khoản người dùng vai trò Giảng viên', icon: '🎓', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Sinh viên', value: overview?.totalStudents, sub: 'Tài khoản người dùng vai trò Sinh viên', icon: '👥', color: '#9333ea', bg: '#f5f3ff' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.6s ease' }}>
      {/* Header */}
      <div className="page-header" style={{ animation: 'slideInDown 0.6s ease' }}>
        <div className="page-header__left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hệ thống quản lý thiết bị — Đại học Bách Khoa Hà Nội</p>
        </div>
        <div style={{ fontSize: '0.82rem', color: '#9ca3af', alignSelf: 'center' }}>
          Cập nhật: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Tổng quan hệ thống (dữ liệu thật) ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card__body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1f2e' }}>Tổng quan hệ thống</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Từ ngày</label>
              <input
                className="input"
                type="date"
                value={range.from}
                max={range.to || undefined}
                onChange={e => setRange(p => ({ ...p, from: e.target.value }))}
              />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.75rem' }}>Đến ngày</label>
              <input
                className="input"
                type="date"
                value={range.to}
                min={range.from || undefined}
                onChange={e => setRange(p => ({ ...p, to: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards: Tổng quan ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {OVERVIEW_CARDS.map((s, idx) => (
          <div
            key={s.label}
            className="card"
            style={{
              borderTop: `3px solid ${s.color}`,
              animation: `slideInUp 0.5s ease both`,
              animationDelay: `${0.1 + idx * 0.06}s`
            }}
          >
            <div className="card__body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1 }}>
                  {ovLoading ? '…' : fmtNum(s.value)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Trạng thái thiết bị + Loại thiết bị ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Top 5 thiết bị được mượn nhiều nhất */}
        <div
          className="card"
          style={{
            animation: `slideInUp 0.5s ease both`,
            animationDelay: `0.66s`
          }}
        >
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            Top 5 thiết bị được mượn nhiều nhất
          </div>
          <div className="card__body">
            {topLoading ? (
              <div style={{ padding: '28px 0', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : topRows.length === 0 ? (
              <div style={{ padding: '28px 0', textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu trong khoảng thời gian này</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {topRows.map((r, idx) => (
                  <div key={r.code || r.name || idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5, gap: 12 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.code ? `${r.name} (${r.code})` : r.name}>
                        {r.name}
                        {r.code && <span style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 6, fontSize: '0.78rem' }}>({r.code})</span>}
                      </span>
                      <span style={{ fontSize: '0.84rem', color: '#9ca3af', flexShrink: 0 }}>{r.count} lượt</span>
                    </div>
                    <div style={{ height: 8, background: '#f0f2f5', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(r.count / topMax) * 100}%`,
                        background: r.color,
                        borderRadius: 99,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thống kê phiếu mượn theo trạng thái */}
        <div
          className="card"
          style={{
            animation: `slideInUp 0.5s ease both`,
            animationDelay: `0.74s`
          }}
        >
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Thống kê phiếu mượn theo trạng thái</span>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Tổng {loanStatusTotal} phiếu</span>
          </div>
          <div className="card__body">
            {loanStatsLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : loanStatusTotal === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu trong khoảng thời gian này</div>
            ) : (
              <DonutChart data={loanStatusData.filter(d => d.count > 0)} unit="phiếu" />
            )}
          </div>
        </div>
      </div>

      {/* ── Xu hướng lượt mượn theo thời gian ── */}
      <div className="card" style={{ marginBottom: 20, animation: 'slideInUp 0.5s ease both', animationDelay: '0.82s' }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Xu hướng lượt mượn theo thời gian</span>
          {/* Toggle Ngày / Tuần / Tháng */}
          <div style={{ display: 'inline-flex', border: '1.5px solid #e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
            {TREND_GROUPS.map(g => (
              <button
                key={g.value}
                onClick={() => setTrendGroup(g.value)}
                style={{
                  padding: '7px 16px', border: 'none', cursor: 'pointer',
                  fontSize: '0.84rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                  background: trendGroup === g.value ? '#c8102e' : '#fff',
                  color: trendGroup === g.value ? '#fff' : '#6b7280',
                  transition: 'background 0.15s',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 thẻ thống kê */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: '18px 20px 4px' }}>
          {[
            { label: 'Tổng lượt mượn', value: trend?.total, sub: 'trong khoảng thời gian' },
            { label: 'Cao điểm', value: trend?.peak, sub: trend?.peakLabel || '—' },
            { label: 'Trung bình / kỳ', value: trend?.average, sub: 'lượt mượn' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1 }}>
                {trendLoading ? '…' : (s.value == null ? '—' : Number(s.value).toLocaleString('vi-VN'))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Biểu đồ */}
        <div className="card__body" style={{ paddingTop: 8 }}>
          {trendLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
          ) : trendPoints.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu trong khoảng thời gian này</div>
          ) : (
            <LineChart data={trendPoints} />
          )}
        </div>
      </div>

      {/* ── Row 3: Phiếu mượn trả gần đây + Thiết bị quá hạn ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Phiếu mượn trả gần đây */}
        <div
          className="card"
          style={{
            animation: `slideInUp 0.5s ease both`,
            animationDelay: `0.82s`
          }}
        >
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Phiếu mượn trả gần đây</span>
            <a href="/phieu-muon-tra" style={{ fontSize: '0.8rem', color: '#c8102e', fontWeight: 600, textDecoration: 'none' }}>Xem tất cả →</a>
          </div>
          <div className="tbl-wrap">
            <table className="tbl" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Mã phiếu</th>
                  <th>Người mượn</th>
                  <th>Thiết bị</th>
                  <th>Ngày mượn</th>
                  <th>Dự trả</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_RECEIPTS.map(rec => {
                  const statusColors = {
                    'ĐÃ_TRẢ': { class: 'badge--green', label: 'Đã trả' },
                    'ĐANG_MƯỢN': { class: 'badge--blue', label: 'Đang mượn' },
                    'CHẬM_TRẢ': { class: 'badge--red', label: 'Chậm trả' },
                    'MẤT_THIẾT_BỊ': { class: 'badge--red', label: 'Mất thiết bị' },
                  };
                  const status = statusColors[rec.status] || { class: 'badge--gray', label: rec.status };
                  return (
                    <tr key={rec.receiptCode}>
                      <td><strong>{rec.receiptCode}</strong></td>
                      <td style={{ color: '#6b7280' }}>{rec.borrower}</td>
                      <td style={{ color: '#6b7280' }}>{rec.equipment}</td>
                      <td style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{rec.borrowDate}</td>
                      <td style={{ color: rec.daysLeft < 0 ? '#dc2626' : '#9ca3af', fontSize: '0.8rem', fontWeight: rec.daysLeft < 0 ? 600 : 400 }}>
                        {rec.returnDate} {rec.daysLeft < 0 && <span title="Quá hạn">⚠️</span>}
                      </td>
                      <td>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Thiết bị quá hạn */}
        <div
          className="card"
          style={{
            animation: `slideInUp 0.5s ease both`,
            animationDelay: `0.9s`
          }}
        >
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            ⚠️ Quá hạn chưa trả
          </div>
          <div style={{ padding: '8px 16px 16px' }}>
            {OVERDUE_EQUIPMENT.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af' }}>
                ✓ Không có phiếu quá hạn
              </div>
            ) : (
              OVERDUE_EQUIPMENT.map((item, i) => (
                <div key={item.receiptCode} style={{
                  padding: '12px 0',
                  borderBottom: i < OVERDUE_EQUIPMENT.length - 1 ? '1px solid #f8f9fb' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: '0.9rem', fontWeight: 700, color: '#dc2626'
                    }}>
                      {item.overdueDays}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1a1f2e' }}>
                        {item.equipment}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 2 }}>
                        {item.borrower}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 1 }}>
                        Dự trả: {item.expectedReturn}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Activity log ── */}
      <div
        className="card"
        style={{
          animation: `slideInUp 0.5s ease both`,
          animationDelay: `0.98s`
        }}
      >
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Hoạt động gần đây</span>
          <a href="/tai-khoan/danh-sach" style={{ fontSize: '0.8rem', color: '#c8102e', fontWeight: 600, textDecoration: 'none' }}>Xem tất cả →</a>
        </div>
        <div style={{ padding: '12px 20px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {ACTIVITY_LOG.map((a, i) => (
              <div key={i} style={{
                padding: '12px 14px', background: '#f9fafb', borderRadius: 10,
                borderLeft: `3px solid ${ACTIVITY_COLOR[a.type]}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: ACTIVITY_COLOR[a.type] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: ACTIVITY_COLOR[a.type],
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', color: '#374151' }}>
                      <strong>{a.user}</strong> {a.action.toLowerCase()}{' '}
                      <strong style={{ color: ACTIVITY_COLOR[a.type] }}>{a.target}</strong>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
