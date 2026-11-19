import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import ImageInput from '../components/ImageInput';
import Toggle from '../components/Toggle';
import { api } from '../api';

function emptyForm(fields) {
  const form = {};
  for (const f of fields) {
    if (f.type === 'heading') continue;
    if (f.type === 'toggle') form[f.name] = f.default ?? true;
    else if (f.type === 'lines') form[f.name] = '';
    else form[f.name] = f.default ?? '';
  }
  return form;
}

function toForm(item, fields) {
  const form = {};
  for (const f of fields) {
    if (f.type === 'heading') continue;
    const v = item[f.name];
    if (f.type === 'lines') form[f.name] = (v || []).join('\n');
    else if (f.type === 'toggle') form[f.name] = Boolean(v);
    else form[f.name] = v ?? '';
  }
  return form;
}

function toPayload(form, fields) {
  const data = {};
  for (const f of fields) {
    if (f.type === 'heading') continue;
    const v = form[f.name];
    if (f.type === 'number') data[f.name] = v === '' || v == null ? (f.required ? 0 : null) : Number(v);
    else if (f.type === 'lines') data[f.name] = String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'toggle') data[f.name] = Boolean(v);
    else data[f.name] = typeof v === 'string' ? v.trim() : v;
  }
  return data;
}

export default function CrudPage({ title, subtitle, resource, fields, columns, itemName }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [courseTitles, setCourseTitles] = useState([]);
  const [channels, setChannels] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await resource.list());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (fields.some((f) => f.options === 'channels')) {
      api.channels().then(setChannels).catch(() => {});
    }
    if (fields.some((f) => f.datalist === 'courses')) {
      api.courses.list().then((list) => setCourseTitles(list.map((c) => c.title))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const datalists = useMemo(() => ({
    categories: [...new Set(items.map((i) => i.category).filter(Boolean))],
    courses: courseTitles,
  }), [items, courseTitles]);

  const openNew = () => {
    setForm(emptyForm(fields));
    setFormError('');
    setEditing('new');
  };

  const selectOptions = (f) => {
    if (f.options === 'channels') {
      return channels.map((c) => ({ value: c.id, label: `${c.title}${c.canInvite ? '' : " — «Invite users» huquqi yo'q!"}` }));
    }
    return f.options || [];
  };

  const openEdit = (item) => {
    setForm(toForm(item, fields));
    setFormError('');
    setEditing(item);
  };

  const save = async () => {
    setFormError('');
    for (const f of fields) {
      if (f.type === 'heading') continue;
      if ((f.required || f.type === 'image') && (form[f.name] === '' || form[f.name] == null)) {
        setFormError(`«${f.label}» maydonini to'ldiring`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = toPayload(form, fields);
      if (editing === 'new') await resource.create(payload);
      else await resource.update(editing.id, payload);
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Bu ${itemName} o'chirilsinmi?`)) return;
    try {
      await resource.remove(item.id);
      setItems((list) => list.filter((i) => i.id !== item.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleActive = async (item) => {
    try {
      const payload = toPayload({ ...toForm(item, fields), isActive: !item.isActive }, fields);
      const updated = await resource.update(item.id, payload);
      setItems((list) => list.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      alert(err.message);
    }
  };

  const set = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}><Plus size={18} /> Yangi {itemName}</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th>Holati</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.isActive === false ? 'dim' : ''}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.type === 'image' ? <img className="thumb" src={item[c.key]} alt="" /> : c.render ? c.render(item) : item[c.key]}
                  </td>
                ))}
                <td><Toggle checked={item.isActive} onChange={() => toggleActive(item)} /></td>
                <td className="nowrap actions">
                  <button type="button" className="icon-btn" onClick={() => openEdit(item)} aria-label="Tahrirlash"><Pencil size={16} /></button>
                  <button type="button" className="icon-btn danger" onClick={() => remove(item)} aria-label="O'chirish"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {!items.length && !loading && (
              <tr><td colSpan={columns.length + 2} className="empty-cell">Hozircha bo'sh. «Yangi {itemName}» tugmasini bosing.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          wide
          title={editing === 'new' ? `Yangi ${itemName}` : 'Tahrirlash'}
          onClose={() => setEditing(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Bekor qilish</button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </>
          )}
        >
          <div className="form-grid">
            {fields.map((f) => (f.type === 'heading' ? (
              <div key={f.label} className="form-heading full">
                <b>{f.label}</b>
                {f.hint && <small>{f.hint}</small>}
              </div>
            ) : (
              <div key={f.name} className={`form-field ${f.full ? 'full' : ''}`}>
                {f.type !== 'toggle' && <label htmlFor={`f-${f.name}`}>{f.label}{f.required && ' *'}</label>}
                {f.type === 'select' && (
                  <select id={`f-${f.name}`} value={form[f.name] || ''} onChange={(e) => set(f.name)(e.target.value)}>
                    <option value="">{f.placeholder || '— tanlanmagan —'}</option>
                    {selectOptions(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
                {f.type === 'image' && <ImageInput value={form[f.name]} onChange={set(f.name)} />}
                {f.type === 'toggle' && <Toggle checked={form[f.name]} onChange={set(f.name)} label={f.label} />}
                {(f.type === 'textarea' || f.type === 'lines') && (
                  <textarea id={`f-${f.name}`} rows={f.type === 'lines' ? 6 : 3} value={form[f.name]} onChange={(e) => set(f.name)(e.target.value)} placeholder={f.placeholder} />
                )}
                {(!f.type || f.type === 'number') && (
                  <>
                    <input
                      id={`f-${f.name}`}
                      type={f.type === 'number' ? 'number' : 'text'}
                      min={f.type === 'number' ? 0 : undefined}
                      value={form[f.name]}
                      onChange={(e) => set(f.name)(e.target.value)}
                      placeholder={f.placeholder}
                      list={f.datalist ? `dl-${f.name}` : undefined}
                    />
                    {f.datalist && (
                      <datalist id={`dl-${f.name}`}>
                        {datalists[f.datalist].map((v) => <option key={v} value={v} />)}
                      </datalist>
                    )}
                  </>
                )}
                {f.hint && <small className="field-hint">{f.hint}</small>}
              </div>
            )))}
          </div>
          {formError && <div className="error-box">{formError}</div>}
        </Modal>
      )}
    </div>
  );
}
