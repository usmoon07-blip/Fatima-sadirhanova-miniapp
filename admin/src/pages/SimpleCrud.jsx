import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ImageInput from '../components/ImageInput';
import Toggle from '../components/Toggle';

/**
 * Kategoriyalar va Story'lar uchun umumiy CRUD sahifa.
 * fields: [{ key, label, type: 'text' | 'textarea' | 'number' | 'image' | 'toggle', required }]
 */
export default function SimpleCrud({ title, subtitle, resource, fields, columns, emptyItem }) {
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
    setForm(item.id ? { ...item } : { ...emptyItem });
  };

  const payload = (f) => Object.fromEntries(fields.map((fd) => [fd.key, fd.type === 'number' ? Number(f[fd.key]) || 0 : f[fd.key] ?? null]));

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
    if (!window.confirm(`"${item.name || item.title}" o'chirilsinmi?`)) return;
    try {
      await resource.remove(item.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      await resource.update(item.id, payload({ ...item, isActive: !item.isActive }));
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
              <th>Rasm</th>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Faol</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.isActive ? '' : 'dim'}>
                <td>{item.imageUrl ? <img className="thumb" src={item.imageUrl} alt="" /> : <div className="thumb" />}</td>
                {columns.map((c) => <td key={c.key}>{c.render ? c.render(item) : item[c.key]}</td>)}
                <td><Toggle checked={item.isActive} onChange={() => toggleActive(item)} /></td>
                <td className="nowrap">
                  <button type="button" className="icon-btn" onClick={() => open(item)}><Pencil size={16} /></button>
                  <button type="button" className="icon-btn danger" onClick={() => remove(item)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={columns.length + 3} className="empty-cell">Hozircha bo'sh</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
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
          <div className="form-grid single">
            {fields.map((fd) => {
              const value = form[fd.key] ?? '';
              const set = (v) => setForm((p) => ({ ...p, [fd.key]: v }));
              if (fd.type === 'image') return <label key={fd.key}>{fd.label}<ImageInput value={value} onChange={set} /></label>;
              if (fd.type === 'toggle') return <Toggle key={fd.key} checked={form[fd.key]} onChange={set} label={fd.label} />;
              if (fd.type === 'textarea') return <label key={fd.key}>{fd.label}<textarea rows={3} value={value} onChange={(e) => set(e.target.value)} /></label>;
              return (
                <label key={fd.key}>{fd.label}
                  <input type={fd.type === 'number' ? 'number' : 'text'} value={value} onChange={(e) => set(e.target.value)} placeholder={fd.placeholder} />
                </label>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
