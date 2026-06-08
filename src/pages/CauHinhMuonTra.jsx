import React, { useState, useEffect } from 'react';
import { loanConfigService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CauHinhMuonTra() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('loan-config-c');
  const [value, setValue] = useState('');       // giá trị đang nhập (chuỗi để dễ validate)
  const [original, setOriginal] = useState(null); // giá trị gốc từ server
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  /* Tải cấu hình hiện tại */
  useEffect(() => {
    setLoading(true);
    loanConfigService.get()
      .then(res => {
        const data = res.data?.data ?? res.data;
        const minutes = data?.lateThresholdMinutes;
        setOriginal(minutes ?? null);
        setValue(minutes != null ? String(minutes) : '');
      })
      .catch(() => setError('Không tải được cấu hình mượn trả.'))
      .finally(() => setLoading(false));
  }, []);

  const dirty = value.trim() !== '' && Number(value) !== original;

  async function handleSave() {
    setError('');
    const trimmed = value.trim();
    if (trimmed === '') { setError('Ngưỡng phút chậm trả không được để trống.'); return; }
    const minutes = Number(trimmed);
    if (!Number.isInteger(minutes) || minutes < 0) {
      setError('Ngưỡng phút chậm trả phải là số nguyên không âm.');
      return;
    }

    setSaving(true);
    try {
      const res = await loanConfigService.set(minutes);
      const response = res.data;
      if (response?.success === false) {
        setError(response?.message || 'Cập nhật cấu hình không thành công.');
        return;
      }
      setOriginal(minutes);
      showToast('Đã lưu cấu hình mượn trả.');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setValue(original != null ? String(original) : '');
    setError('');
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-title">Cấu hình mượn trả</h1>
          <p className="page-subtitle">Thiết lập ngưỡng thời gian xác định một phiếu mượn bị chậm trả.</p>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          {loading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9ca3af' }}>Đang tải cấu hình...</div>
          ) : (
            <>
              <div className="field" style={{ maxWidth: 360 }}>
                <label>Ngưỡng phút chậm trả *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step={1}
                    style={{ width: 160 }}
                    placeholder="Ví dụ: 15"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={!canEdit}
                  />
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>phút</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 8 }}>
                  Phiếu được trả trễ hơn thời hạn quá số phút này sẽ bị tính là <strong>chậm trả</strong>.
                </p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#fff0f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#c8102e', fontSize: '0.84rem', maxWidth: 360 }}>
                  {error}
                </div>
              )}

              {canEdit && (
                <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0f2f5' }}>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving || !dirty}>
                    {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>
                  <button className="btn btn--outline" onClick={handleReset} disabled={saving || !dirty}>
                    Hoàn tác
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '12px 18px', background: '#059669', color: '#fff', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
