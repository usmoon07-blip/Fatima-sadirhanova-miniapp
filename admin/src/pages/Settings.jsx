import { useEffect, useState } from 'react';
import { CreditCard, Save } from 'lucide-react';
import { api } from '../api';

export default function Settings() {
  const [form, setForm] = useState({ cardNumber: '', cardHolder: '', paymentNote: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.settings()
      .then((s) => setForm({ cardNumber: s.cardNumber || '', cardHolder: s.cardHolder || '', paymentNote: s.paymentNote || '' }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const digits = form.cardNumber.replace(/\D/g, '');
    if (form.cardNumber && (digits.length < 12 || digits.length > 19)) {
      setError("Karta raqami 16 ta raqamdan iborat bo'lishi kerak");
      return;
    }
    setSaving(true);
    try {
      await api.saveSettings(form);
      setMessage("✅ Saqlandi. Endi mijozlar shu kartaga to'laydi.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const preview = form.cardNumber.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Sozlamalar</h1>
          <p className="muted">To'lov faqat karta orqali. Mijoz shu kartaga pul o'tkazib, chek rasmini yuboradi.</p>
        </div>
      </div>

      <form className="settings-grid" onSubmit={save}>
        <div className="settings-card">
          <h3><CreditCard size={18} /> To'lov kartasi</h3>
          <div className="form-field">
            <label htmlFor="s-card">Karta raqami (Uzcard / Humo / Visa)</label>
            <input id="s-card" inputMode="numeric" value={form.cardNumber} onChange={set('cardNumber')} placeholder="8600 1234 5678 9012" disabled={loading} />
          </div>
          <div className="form-field">
            <label htmlFor="s-holder">Karta egasining ismi</label>
            <input id="s-holder" value={form.cardHolder} onChange={set('cardHolder')} placeholder="FATIMA SADIRKHANOVA" disabled={loading} />
          </div>
          <div className="form-field">
            <label htmlFor="s-note">Qo'shimcha izoh (ixtiyoriy)</label>
            <textarea id="s-note" rows={3} value={form.paymentNote} onChange={set('paymentNote')} placeholder="Masalan: izohga ismingizni yozing" disabled={loading} />
          </div>
          {error && <div className="error-box">{error}</div>}
          {message && <div className="ok-box">{message}</div>}
          <button type="submit" className="btn btn-primary" disabled={saving || loading}>
            <Save size={16} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>

        <div className="card-preview">
          <small>Mijoz ko'radigan karta</small>
          <b>{preview || '0000 0000 0000 0000'}</b>
          <span>{form.cardHolder || 'KARTA EGASI'}</span>
        </div>
      </form>
    </div>
  );
}
