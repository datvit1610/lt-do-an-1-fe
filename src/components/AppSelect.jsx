import React from 'react';
import Select from 'react-select';

const HUST_RED = '#c8102e';

/* Style react-select theo tông màu HUST, đồng bộ với .input/.select */
export const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1.5,
    flexWrap: 'nowrap',
    borderColor: state.isFocused ? HUST_RED : '#d1d5db',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(200,16,46,0.10)' : 'none',
    '&:hover': { borderColor: state.isFocused ? HUST_RED : '#b6bcc6' },
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }),
  valueContainer: (base) => ({ ...base, padding: '2px 12px', flexWrap: 'nowrap' }),
  singleValue: (base) => ({ ...base, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
  placeholder: (base) => ({ ...base, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
  clearIndicator: (base) => ({ ...base, color: '#9ca3af', padding: 4, '&:hover': { color: HUST_RED } }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? HUST_RED : '#9ca3af',
    '&:hover': { color: HUST_RED },
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  menu: (base) => ({
    ...base,
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
    zIndex: 50,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    cursor: 'pointer',
    backgroundColor: state.isSelected
      ? HUST_RED
      : state.isFocused
        ? 'rgba(200,16,46,0.08)'
        : '#fff',
    color: state.isSelected ? '#fff' : '#1a1f2e',
    '&:active': { backgroundColor: state.isSelected ? HUST_RED : 'rgba(200,16,46,0.16)' },
  }),
};

/**
 * Select tái sử dụng, làm việc với value "thô" (string).
 * props: options [{value,label}], value, onChange(value), placeholder, isSearchable, isDisabled, isClearable
 */
export default function AppSelect({ options = [], value, onChange, placeholder = 'Chọn...', isSearchable = false, isDisabled = false, isClearable = false }) {
  const selected = options.find(o => o.value === value) || null;
  return (
    <Select
      options={options}
      value={selected}
      onChange={(opt) => onChange(opt ? opt.value : '')}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      isClearable={isClearable}
      styles={selectStyles}
      classNamePrefix="appselect"
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      noOptionsMessage={() => 'Không có dữ liệu'}
    />
  );
}
