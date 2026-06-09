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
function DonutChart({ data, unit = 'thiết bị' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const total = data.reduce((s, item) => s + item.count, 0);
  const radius = 100;
  const cx = 120, cy = 120;

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
        <svg width="240" height="240" style={{ maxWidth: '100%' }}>
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

  /* ── Thống kê lượt mượn theo loại thiết bị (biểu đồ donut) ── */
  const [deviceTypeStats, setDeviceTypeStats] = useState(null);
  const [deviceTypeLoading, setDeviceTypeLoading] = useState(false);

  const fetchDeviceTypeStats = useCallback(async () => {
    setDeviceTypeLoading(true);
    try {
      const res = await dashboardService.deviceTypeStats({ fromDate: range.from, toDate: range.to });
      setDeviceTypeStats(res.data?.data ?? null);
    } catch (err) {
      console.error('Fetch device type stats error:', err);
      setDeviceTypeStats(null);
    } finally {
      setDeviceTypeLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { fetchDeviceTypeStats(); }, [fetchDeviceTypeStats]);

  /* ── Top người mượn nhiều nhất (bảng xếp hạng) ── */
  const [borrowerRole, setBorrowerRole] = useState(''); // '' = Tất cả | 'Sinh viên' | 'Giảng viên'
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [borrowersLoading, setBorrowersLoading] = useState(false);

  const fetchTopBorrowers = useCallback(async () => {
    setBorrowersLoading(true);
    try {
      const res = await dashboardService.topBorrowers({
        fromDate: range.from,
        toDate: range.to,
        roleName: borrowerRole || undefined,
      });
      const data = res.data?.data ?? [];
      setTopBorrowers(Array.isArray(data) ? data : (data.content || []));
    } catch (err) {
      console.error('Fetch top borrowers error:', err);
      setTopBorrowers([]);
    } finally {
      setBorrowersLoading(false);
    }
  }, [range.from, range.to, borrowerRole]);

  useEffect(() => { fetchTopBorrowers(); }, [fetchTopBorrowers]);

  const BORROWER_ROLES = [
    { value: '', label: 'Tất cả' },
    { value: 'Sinh viên', label: 'Sinh viên' },
    { value: 'Giảng viên', label: 'Giảng viên' },
  ];
  const AVATAR_COLORS = ['#fecdd3', '#bfdbfe', '#bbf7d0', '#fde68a', '#ddd6fe', '#fbcfe8', '#a5f3fc', '#fed7aa'];
  const borrowerRows = (topBorrowers || []).map(b => ({
    id: b.borrowerId,
    name: b.fullName || '—',
    role: b.roleName || '',
    count: Number(b.totalLoans ?? 0),
  }));
  const borrowerMax = Math.max(1, ...borrowerRows.map(r => r.count));
  const borrowerTop = borrowerRows[0] || null;
  const borrowerAvg = borrowerRows.length
    ? Math.round(borrowerRows.reduce((s, r) => s + r.count, 0) / borrowerRows.length)
    : 0;
  const initialsOf = (name) => (name || '?').trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();

  const DEVICE_TYPE_COLORS = ['#c8102e', '#2563eb', '#059669', '#d97706', '#9333ea', '#0891b2', '#ec4899', '#6b7280'];
  const deviceTypeData = (deviceTypeStats?.data ?? []).map((d, i) => ({
    name: d.deviceType || '—',
    count: Number(d.totalLoans ?? 0),
    color: DEVICE_TYPE_COLORS[i % DEVICE_TYPE_COLORS.length],
  }));
  const deviceTypeTotal = Number(deviceTypeStats?.total ?? deviceTypeData.reduce((s, d) => s + d.count, 0));

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

      {/* ── Hàng dưới: Loại thiết bị (donut) + chỗ trống chờ biểu đồ sau ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Thống kê lượt mượn theo loại thiết bị */}
        <div className="card" style={{ animation: 'slideInUp 0.5s ease both', animationDelay: '0.9s' }}>
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700, color: '#1a1f2e' }}>Lượt mượn theo loại thiết bị</span>
            {deviceTypeStats?.mostPopularType && (
              <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                Nhiều nhất: <strong style={{ color: '#c8102e' }}>{deviceTypeStats.mostPopularType}</strong>
              </span>
            )}
          </div>
          <div className="card__body">
            {deviceTypeLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : deviceTypeTotal === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu trong khoảng thời gian này</div>
            ) : (
              <DonutChart data={deviceTypeData.filter(d => d.count > 0)} unit="lượt" />
            )}
          </div>
        </div>

        {/* Top người mượn nhiều nhất */}
        <div className="card" style={{ animation: 'slideInUp 0.5s ease both', animationDelay: '0.98s' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'inline-flex', border: '1.5px solid #e5e7eb', borderRadius: 9, overflow: 'hidden' }}>
              {BORROWER_ROLES.map(r => (
                <button
                  key={r.value || 'all'}
                  onClick={() => setBorrowerRole(r.value)}
                  style={{
                    padding: '6px 14px', border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                    background: borrowerRole === r.value ? '#c8102e' : '#fff',
                    color: borrowerRole === r.value ? '#fff' : '#6b7280',
                    transition: 'background 0.15s',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Top {borrowerRows.length || 10}</span>
          </div>

          {/* 3 thẻ thống kê */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '14px 16px 4px' }}>
            {[
              { label: 'Người mượn nhiều nhất', value: borrowerTop?.name ?? '—', big: false },
              { label: 'Lượt mượn cao nhất', value: borrowerTop ? borrowerTop.count : '—', big: true },
              { label: 'Trung bình top', value: borrowerRows.length ? borrowerAvg : '—', big: true },
            ].map(s => (
              <div key={s.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: s.big ? '1.4rem' : '0.95rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(s.value)}>
                  {borrowersLoading ? '…' : s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Bảng xếp hạng */}
          <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {borrowersLoading ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
            ) : borrowerRows.length === 0 ? (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#9ca3af' }}>Không có dữ liệu trong khoảng thời gian này</div>
            ) : (
              borrowerRows.map((r, idx) => (
                <div key={r.id || idx} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', border: '1px solid #f0f2f5', borderRadius: 10,
                }}>
                  <span style={{ width: 18, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: idx < 3 ? '#c8102e' : '#9ca3af', flexShrink: 0 }}>{idx + 1}</span>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: '#374151',
                  }}>{initialsOf(r.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.role}
                    </div>
                  </div>
                  <div style={{ width: 70, height: 7, background: '#f0f2f5', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${(r.count / borrowerMax) * 100}%`, background: '#c8102e', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 36 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1 }}>{r.count}</div>
                    <div style={{ fontSize: '0.66rem', color: '#9ca3af' }}>lượt</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
