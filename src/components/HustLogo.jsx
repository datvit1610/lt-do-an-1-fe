import React from 'react';

/**
 * HustLogo — SVG logo chính xác của Đại học Bách Khoa Hà Nội
 * Gồm: nền đỏ trái / trắng phải, ngôi sao vàng, com-pa + bánh răng vàng, chữ
 * Props: size (số), className
 */
export default function HustLogo({ size = 80, className = '' }) {
  const w = size * 0.65;   // tỉ lệ width:height ~ 2:3
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 200 308"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Đại học Bách Khoa Hà Nội"
    >
      {/* ── Nền ── */}
      {/* Trái: đỏ */}
      <rect x="0" y="0" width="100" height="248" fill="#C8102E"/>
      {/* Phải: trắng */}
      <rect x="100" y="0" width="100" height="248" fill="#FFFFFF"/>

      {/* ── Viền ngoài toàn khối ── */}
      <rect x="1" y="1" width="198" height="246" fill="none" stroke="#C8102E" strokeWidth="2"/>

      {/* ── Ngôi sao vàng (góc trên trái) ── */}
      <polygon
        points="38,14 41.8,26 54,26 44.1,33.2 47.9,45.2 38,38 28.1,45.2 31.9,33.2 22,26 34.2,26"
        fill="#F0B429"
      />

      {/* ── Chữ "ĐẠI HỌC" (góc trên phải) ── */}
      <text
        x="150"
        y="38"
        textAnchor="middle"
        fill="#C8102E"
        fontSize="22"
        fontWeight="900"
        fontFamily="'Be Vietnam Pro', Arial, sans-serif"
        letterSpacing="1"
      >ĐẠI HỌC</text>

      {/* ── Com-pa (compass) ── */}
      {/* Chốt xoay trên com-pa */}
      <circle cx="138" cy="62" r="9" fill="none" stroke="#F0B429" strokeWidth="5"/>
      <circle cx="138" cy="62" r="3.5" fill="#F0B429"/>

      {/* Cánh trái com-pa (dài, chéo xuống trái) */}
      <line x1="134" y1="69" x2="62" y2="190" stroke="#F0B429" strokeWidth="7" strokeLinecap="round"/>
      {/* Đầu nhọn trái */}
      <polygon points="62,190 55,205 69,195" fill="#F0B429"/>

      {/* Cánh phải com-pa (chéo xuống phải / thẳng hơn) */}
      <line x1="142" y1="69" x2="118" y2="195" stroke="#F0B429" strokeWidth="7" strokeLinecap="round"/>
      {/* Đầu nhọn phải */}
      <polygon points="118,195 112,210 126,200" fill="#F0B429"/>

      {/* Thanh ngang giữa hai cánh com-pa */}
      <line x1="84" y1="138" x2="128" y2="148" stroke="#F0B429" strokeWidth="5" strokeLinecap="round"/>

      {/* ── Bánh răng ── */}
      {/* Vòng tròn bánh răng */}
      <circle cx="100" cy="200" r="38" fill="none" stroke="#F0B429" strokeWidth="6"/>
      <circle cx="100" cy="200" r="22" fill="none" stroke="#F0B429" strokeWidth="5"/>

      {/* Răng bánh răng — 8 răng */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 100 + 38 * Math.cos(rad);
        const y1 = 200 + 38 * Math.sin(rad);
        const x2 = 100 + 48 * Math.cos(rad);
        const y2 = 200 + 48 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#F0B429" strokeWidth="8" strokeLinecap="square"/>
        );
      })}

      {/* ── Dải vàng dưới + chữ "BÁCH KHOA" ── */}
      <rect x="0" y="248" width="200" height="60" fill="#F0B429"/>
      <text
        x="100"
        y="290"
        textAnchor="middle"
        fill="#C8102E"
        fontSize="28"
        fontWeight="900"
        fontFamily="'Be Vietnam Pro', Arial, sans-serif"
        letterSpacing="2"
      >BÁCH KHOA</text>
    </svg>
  );
}
