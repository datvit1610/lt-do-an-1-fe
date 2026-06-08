import React, { useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { selectStyles } from './AppSelect';
import { deviceService } from '../services/api';

/* Chuẩn hóa 1 item thiết bị từ API /device/select thành option {value,label,raw} */
function toOption(d) {
  if (!d) return null;
  const code = d.deviceCode || d.code || '';
  const name = d.name || d.deviceName || '';
  const label = code ? `${code} - ${name}` : name;
  return { value: d.id ?? d.value, label: label || String(d.id ?? d.value), raw: d };
}

/**
 * Select thiết bị tìm kiếm realtime qua API /device/select (filter theo "name").
 * Gõ tên đến đâu gọi API lọc đến đó (có debounce 300ms).
 * props: value (option|null), onChange(option|null), placeholder, isDisabled
 */
export default function DeviceSelect({ value, onChange, placeholder = 'Tìm và chọn thiết bị...', isDisabled = false }) {
  const timer = useRef(null);

  const loadOptions = (inputValue) =>
    new Promise((resolve) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          const res = await deviceService.select({ name: inputValue || undefined });
          const list = res.data?.data ?? res.data ?? [];
          resolve((Array.isArray(list) ? list : []).map(toOption).filter(Boolean));
        } catch (err) {
          console.error('Load devices error:', err);
          resolve([]);
        }
      }, 300);
    });

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable
      styles={selectStyles}
      classNamePrefix="appselect"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      loadingMessage={() => 'Đang tải...'}
      noOptionsMessage={() => 'Không có thiết bị'}
    />
  );
}
