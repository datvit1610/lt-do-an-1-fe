import React from 'react';

const HUST_LOGO_URL = '/assets/logos/hust-logo.png';

export default function HustLogo({ size = 80, className = '' }) {
  // Logo aspect ratio: 500x863 ≈ 0.58
  const height = size;
  const width = size * 0.58;

  return (
    <div
      className={`hust-logo-wrapper ${className}`}
      style={{
        width: width,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={HUST_LOGO_URL}
        alt="Logo Đại học Bách Khoa Hà Nội"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
