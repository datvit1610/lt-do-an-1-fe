import React, { useState } from 'react';

/* ── Mock data cho hệ thống quản lý thiết bị ── */
const EQUIPMENT_STATS = [
  { label: 'Tổng thiết bị', value: 156, sub: '+5 tháng này', icon: '📦', color: '#c8102e', bg: '#fff0f2' },
  { label: 'Hoạt động', value: 142, sub: '91% tổng số', icon: '✅', color: '#059669', bg: '#ecfdf5' },
  { label: 'Đang mượn', value: 38, sub: 'chờ trả lại', icon: '🔄', color: '#2563eb', bg: '#eff6ff' },
  { label: 'Cần bảo trì', value: 14, sub: 'hư hỏng/quá hạn', icon: '⚠️', color: '#d97706', bg: '#fffbeb' },
];

const EQUIPMENT_STATUS = [
  { name: 'Hoạt động', count: 142, color: '#059669' },
  { name: 'Đang mượn', count: 38, color: '#2563eb' },
  { name: 'Hư hỏng', count: 8, color: '#c8102e' },
  { name: 'Kỹ trục', count: 6, color: '#d97706' },
];

const EQUIPMENT_CATEGORY = [
  { name: 'Máy tính', count: 45, color: '#3b82f6' },
  { name: 'Điện thoại', count: 32, color: '#8b5cf6' },
  { name: 'Máy in', count: 18, color: '#ec4899' },
  { name: 'Tủ tài liệu', count: 28, color: '#f59e0b' },
  { name: 'Khác', count: 33, color: '#6b7280' },
];

const BORROW_STATS = [
  { label: 'Tổng người dùng', value: 24, icon: '👥', color: '#9333ea' },
  { label: 'Phiếu năm nay', value: 128, icon: '📋', color: '#0891b2' },
  { label: 'Quá hạn chưa trả', value: 7, icon: '⏰', color: '#dc2626' },
];

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

function DonutChart({ data }) {
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
              {segments[hoveredIndex].count} thiết bị · {segments[hoveredIndex].percentage}%
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

export default function DashboardPage() {
  const totalEquipment = EQUIPMENT_STATUS.reduce((s, e) => s + e.count, 0);
  const totalCategory = EQUIPMENT_CATEGORY.reduce((s, c) => s + c.count, 0);

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

      {/* ── Stat cards: Thiết bị ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {EQUIPMENT_STATS.map((s, idx) => (
          <div
            key={s.label}
            className="card"
            style={{
              borderTop: `3px solid ${s.color}`,
              animation: `slideInUp 0.5s ease both`,
              animationDelay: `${0.1 + idx * 0.08}s`
            }}
          >
            <div className="card__body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: s.color, marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Stat cards: Mượn trả ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {BORROW_STATS.map((s, idx) => (
          <div
            key={s.label}
            className="card"
            style={{
              borderTop: `3px solid ${s.color}`,
              animation: `slideInUp 0.5s ease both`,
              animationDelay: `${0.42 + idx * 0.08}s`
            }}
          >
            <div className="card__body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a1f2e', lineHeight: 1 }}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Trạng thái thiết bị + Loại thiết bị ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Trạng thái thiết bị */}
        <div
          className="card"
          style={{
            animation: `slideInUp 0.5s ease both`,
            animationDelay: `0.66s`
          }}
        >
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            Trạng thái thiết bị
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {EQUIPMENT_STATUS.map(e => (
                <div key={e.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#374151' }}>{e.name}</span>
                    <span style={{ fontSize: '0.84rem', color: '#9ca3af' }}>{e.count} / {totalEquipment}</span>
                  </div>
                  <div style={{ height: 8, background: '#f0f2f5', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(e.count / totalEquipment) * 100}%`,
                      background: e.color,
                      borderRadius: 99,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f2f5' }}>
              {EQUIPMENT_STATUS.map(e => (
                <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{e.name} ({e.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phân bố loại thiết bị */}
        <div
          className="card"
          style={{
            animation: `slideInUp 0.5s ease both`,
            animationDelay: `0.74s`
          }}
        >
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f2f5', fontWeight: 700, color: '#1a1f2e' }}>
            Phân bố loại thiết bị
          </div>
          <div className="card__body">
            <DonutChart data={EQUIPMENT_CATEGORY} />
          </div>
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
