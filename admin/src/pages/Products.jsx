import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import ImageInput from '../components/ImageInput';
import Toggle from '../components/Toggle';
import { api, money } from '../api';

const LANG_TABS = [
  { id: '', label: "🇺🇿 O'zbekcha" },
  { id: 'Ru', label: '🇷🇺 Ruscha' },
  { id: 'En', label: '🇬🇧 Inglizcha' },
];

const EMPTY = {
  name: '', nameRu: '', nameEn: '', description: '', descriptionRu: '', descriptionEn: '', imageUrl: '',
  ingredientsRuText: '', ingredientsEnText: '', price: '', oldPrice: '', categoryId: '',
  ingredientsText: '', sizes: [], rating: 5, reviewsCount: 0, badge: '',
  isPopular: false, isAvailable: true, sortOrder: 0,
};

function toForm(p) {
  return {
    ...EMPTY,
    ...p,
    oldPrice: p.oldPrice ?? '',
    categoryId: p.categoryId ?? '',
    badge: p.badge ?? '',
    nameRu: p.nameRu ?? '',
    nameEn: p.nameEn ?? '',
    descriptionRu: p.descriptionRu ?? '',
    descriptionEn: p.descriptionEn ?? '',
    ingredientsText: (p.ingredients || []).join('\n'),
    ingredientsRuText: (p.ingredientsRu || []).join('\n'),
    ingredientsEnText: (p.ingredientsEn || []).join('\n'),
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
  };
}

const splitLines = (text) => (text || '').split('\n').map((s) => s.trim()).filter(Boolean);

function toPayload(f) {
  return {
    name: f.name,
    nameRu: f.nameRu,
    nameEn: f.nameEn,
    description: f.description,
    descriptionRu: f.descriptionRu,
    descriptionEn: f.descriptionEn,
    imageUrl: f.imageUrl,
    price: Number(f.price) || 0,
    oldPrice: f.oldPrice === '' ? null : Number(f.oldPrice),
    categoryId: f.categoryId === '' ? null : Number(f.categoryId),
    ingredients: splitLines(f.ingredientsText),
    ingredientsRu: splitLines(f.ingredientsRuText),
    ingredientsEn: splitLines(f.ingredientsEnText),
    sizes: f.sizes.filter((s) => s.label && Number(s.price) > 0).map((s) => ({ label: s.label.trim(), price: Number(s.price) })),
    rating: Number(f.rating) || 0,
    reviewsCount: Number(f.reviewsCount) || 0,
    badge: f.badge,
    isPopular: f.isPopular,
    isAvailable: f.isAvailable,
    sortOrder: Number(f.sortOrder) || 0,
  };
}

function ProductForm({ initial, categories, onClose, onSaved }) {
  const [f, setF] = useState(() => toForm(initial || {}));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('');
  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  const setSize = (i, key, value) => setF((prev) => ({
    ...prev, sizes: prev.sizes.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
  }));

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = toPayload(f);
      if (initial?.id) await api.products.update(initial.id, payload);
      else await api.products.create(payload);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      wide
      title={initial?.id ? 'Mahsulotni tahrirlash' : "Yangi mahsulot qo'shish"}
      onClose={onClose}
      footer={(
        <>
          {error && <div className="error-text grow">{error}</div>}
          <button type="button" className="btn btn-outline" onClick={onClose}>Bekor qilish</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
        </>
      )}
    >
      <div className="form-grid">
        <label className="span-2">Rasm<ImageInput value={f.imageUrl} onChange={set('imageUrl')} /></label>
        <div className="span-2 lang-tabs">
          {LANG_TABS.map((l) => (
            <button key={l.id} type="button" className={tab === l.id ? 'active' : ''} onClick={() => setTab(l.id)}>
              {l.label}
              {l.id && f[`name${l.id}`] ? ' ✓' : ''}
            </button>
          ))}
        </div>
        <label className="span-2">Nomi{tab ? '' : ' *'}
          <input value={f[`name${tab}`]} onChange={set(`name${tab}`)} placeholder={tab ? `Bo'sh qolsa o'zbekchasi ko'rsatiladi: ${f.name}` : 'Masalan: Qulupnayli tort'} />
        </label>
        <label className="span-2">Ta'rifi<textarea rows={3} value={f[`description${tab}`]} onChange={set(`description${tab}`)} /></label>
        <label className="span-2">Tarkibi (har bir qatorga bittadan)
          <textarea rows={4} value={f[`ingredients${tab}Text`]} onChange={set(`ingredients${tab}Text`)} placeholder={'Vanilli biskvit\nYangi qulupnay\nQaymoq'} />
        </label>
        <label>Kategoriya
          <select value={f.categoryId} onChange={set('categoryId')}>
            <option value="">— Kategoriyasiz —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Belgi (badge)<input value={f.badge} onChange={set('badge')} placeholder="Bestseller, Yangi, -20%..." /></label>
        <label>Yangi narx (so'm) *<input type="number" min="0" value={f.price} onChange={set('price')} placeholder="249000" /></label>
        <label>Eski narx (so'm)<input type="number" min="0" value={f.oldPrice} onChange={set('oldPrice')} placeholder="Chegirma bo'lsa" /></label>

        <div className="span-2 sizes-box">
          <div className="row between">
            <b>O'lchamlar / variantlar</b>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setF((p) => ({ ...p, sizes: [...p.sizes, { label: '', price: '' }] }))}>
              <Plus size={14} /> Variant qo'shish
            </button>
          </div>
          <p className="muted small">Bo'sh qoldirilsa — asosiy narx ishlatiladi. Variant bo'lsa, narx variant bo'yicha olinadi.</p>
          {f.sizes.map((s, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div className="size-row" key={i}>
              <input value={s.label} onChange={(e) => setSize(i, 'label', e.target.value)} placeholder="16 sm (6–8 kishi)" />
              <input type="number" min="0" value={s.price} onChange={(e) => setSize(i, 'price', e.target.value)} placeholder="Narx" />
              <button type="button" className="icon-btn" onClick={() => setF((p) => ({ ...p, sizes: p.sizes.filter((_, idx) => idx !== i) }))}><X size={16} /></button>
            </div>
          ))}
        </div>

        <label>Reyting (0–5)<input type="number" min="0" max="5" step="0.1" value={f.rating} onChange={set('rating')} /></label>
        <label>Sharhlar soni<input type="number" min="0" value={f.reviewsCount} onChange={set('reviewsCount')} /></label>
        <label>Tartib raqami<input type="number" value={f.sortOrder} onChange={set('sortOrder')} /></label>
        <div className="toggles">
          <Toggle checked={f.isAvailable} onChange={set('isAvailable')} label="Sotuvda bor" />
          <Toggle checked={f.isPopular} onChange={set('isPopular')} label="Mashhur (bosh sahifada)" />
        </div>
      </div>
    </Modal>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.products.list(), api.categories.list()]);
      setProducts(p.items);
      setCategories(c.items);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`"${p.name}" o'chirilsinmi?`)) return;
    try {
      await api.products.remove(p.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const quickToggle = async (p, key) => {
    const payload = toPayload({ ...toForm(p), [key]: !p[key] });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [key]: !p[key] } : x)));
    try {
      await api.products.update(p.id, payload);
    } catch (e) {
      alert(e.message);
      load();
    }
  };

  const shown = products.filter((p) => !filter || String(p.categoryId) === filter);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Mahsulotlar</h1>
          <p className="muted">Jami: {products.length} ta</p>
        </div>
        <div className="row gap">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" className="btn btn-primary" onClick={() => setEditing({})}><Plus size={16} /> Yangi mahsulot</button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Rasm</th>
              <th>Nomi</th>
              <th>Kategoriya</th>
              <th className="right">Eski narx</th>
              <th className="right">Yangi narx</th>
              <th>Variantlar</th>
              <th>Sotuvda</th>
              <th>Mashhur</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className={p.isAvailable ? '' : 'dim'}>
                <td><img className="thumb" src={p.imageUrl} alt="" /></td>
                <td>
                  <div className="strong">{p.name}</div>
                  {(p.nameRu || p.nameEn) && <div className="muted small">{[p.nameRu, p.nameEn].filter(Boolean).join(' · ')}</div>}
                  <div className="row gap-sm">
                    {p.badge && <span className="pill">{p.badge}</span>}
                  </div>
                </td>
                <td>{p.category?.name || <span className="muted">—</span>}</td>
                <td className="right">{p.oldPrice ? <s className="muted">{money(p.oldPrice)}</s> : '—'}</td>
                <td className="right strong red nowrap">{money(p.price)}</td>
                <td className="muted small">{(p.sizes || []).map((s) => s.label).join(', ') || '—'}</td>
                <td><Toggle checked={p.isAvailable} onChange={() => quickToggle(p, 'isAvailable')} /></td>
                <td><Toggle checked={p.isPopular} onChange={() => quickToggle(p, 'isPopular')} /></td>
                <td className="nowrap">
                  <button type="button" className="icon-btn" title="Tahrirlash" onClick={() => setEditing(p)}><Pencil size={16} /></button>
                  <button type="button" className="icon-btn danger" title="O'chirish" onClick={() => remove(p)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={9} className="empty-cell">Mahsulotlar yo'q</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
