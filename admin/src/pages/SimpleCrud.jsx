import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ImageInput from '../components/ImageInput';
import Toggle from '../components/Toggle';

/**
 * Kategoriyalar va Story'lar uchun umumiy CRUD sahifa.
 * fields: [{ key, label, type: 'text' | 'textarea' | 'number' | 'image' | 'toggle' | 'select' | 'date', options, half }]
 * Tarjima maydonlari (nameRu, nameEn ...) oddiy matn maydoni sifatida beriladi.
 */
export default function SimpleCrud({
  title, subtitle, resource, fields, columns, emptyItem, noImage = false, toForm = (x) => x, toPayload = (x) => x, nameOf,
}) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await resource.list();
      setItems(r.items);
    } catch (e) {
      setError(e.message);
    }
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  const open = (item) => {
    setError('');
    setEditing(item);
    setForm(item.id ? toForm({ ...item }) : { ...emptyItem });
  };

  const payload = (f) => toPayload(Object.fromEntries(fields.map((fd) => {
    const v = f[fd.key];
    if (fd.type === 'number') return [fd.key, v === '' || v == null ? null : Number(v)];
    return [fd.key, v ?? null];
  })));

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing.id) await resource.update(editing.id, payload(form));
      else await resource.create(payload(form));
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`"${nameOf ? nameOf(item) : item.name || item.title}" o'chirilsinmi?`)) return;
    try {
      await resource.remove(item.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await resource.update(item.id, payload({ ...toForm({ ...item }), isActive: !item.isActive }));
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => open({})}><Plus size={16} /> Qo'shish</button>
      </div>

      {error && !editing && <div className="alert">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {!noImage && <th>Rasm</th>}
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Faol</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.isActive ? '' : 'dim'}>
                {!noImage && <td>{item.imageUrl ? <img className="thumb" src={item.imageUrl} alt="" /> : <div className="thumb" />}</td>}
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>)}
                <td><Toggle checked={item.isActive} onChange={() => toggleActive(item)} /></td>
                <td className="nowrap">
                  <button type="button" className="icon-btn" onClick={() => open(item)}><Pencil size={16} /></button>
                  <button type="button" className="icon-btn danger" onClick={() => remove(item)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={columns.length + (noImage ? 2 : 3)} className="empty-cell">Hozircha bo'sh</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          wide
          title={editing.id ? 'Tahrirlash' : "Yangi qo'shish"}
          onClose={() => setEditing(null)}
          footer={(
            <>
              {error && <div className="error-text grow">{error}</div>}
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Bekor qilish</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </>
          )}
        >
          <div className="form-grid">
            {fields.map((fd) => {
              const value = form[fd.key] ?? '';
              const set = (v) => setForm((p) => ({ ...p, [fd.key]: v }));
              const cls = fd.half ? '' : 'span-2';
              if (fd.type === 'image') return <label key={fd.key} className={cls}>{fd.label}<ImageInput value={value} onChange={set} /></label>;
              if (fd.type === 'toggle') return <div key={fd.key} className={cls}><Toggle checked={form[fd.key]} onChange={set} label={fd.label} /></div>;
              if (fd.type === 'textarea') return <label key={fd.key} className={cls}>{fd.label}<textarea rows={2} value={value} onChange={(e) => set(e.target.value)} placeholder={fd.placeholder} /></label>;
              if (fd.type === 'select') {
                return (
                  <label key={fd.key} className={cls}>{fd.label}
                    <select value={value} onChange={(e) => set(e.target.value)}>
                      {fd.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                );
              }
              return (
                <label key={fd.key} className={cls}>{fd.label}
                  <input
                    type={fd.type === 'number' ? 'number' : fd.type === 'date' ? 'date' : 'text'}
                    value={value}
                    onChange={(e) => set(fd.upper ? e.target.value.toUpperCase() : e.target.value)}
                    placeholder={fd.placeholder}
                  />
                </label>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
