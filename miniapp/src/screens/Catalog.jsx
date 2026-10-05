import { useMemo, useState } from 'react';
import { Heart, Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useStore } from '../store/StoreContext';

export default function Catalog() {
  const { catalog, activeCategory, setActiveCategory, favorites } = useStore();
  const [query, setQuery] = useState('');

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.products.filter((p) => {
      if (p.isUpsell) return false;
      if (activeCategory === 'fav' && !favorites.includes(p.id)) return false;
      if (activeCategory !== 'all' && activeCategory !== 'fav' && p.categoryId !== activeCategory) return false;
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [catalog.products, activeCategory, favorites, query]);

  return (
    <div className="page">
      <div className="search">
        <Search size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Shirinliklarni qidiring..." />
        {query && <button type="button" aria-label="Tozalash" onClick={() => setQuery('')}><X size={16} /></button>}
      </div>

      <div className="page-title">
        <h1 className="serif">Katalog</h1>
        <p className="muted">Mazali tanlovimiz bilan tanishing</p>
      </div>

      <div className="chips h-scroll">
        <button type="button" className={`chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Hammasi</button>
        {catalog.categories.map((c) => (
          <button key={c.id} type="button" className={`chip ${activeCategory === c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>
            {c.name}
          </button>
        ))}
        <button type="button" className={`chip ${activeCategory === 'fav' ? 'active' : ''}`} onClick={() => setActiveCategory('fav')}>
          <Heart size={14} /> Sevimlilar
        </button>
      </div>

      {products.length ? (
        <div className="grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-emoji">🔍</div>
          <p className="muted">{activeCategory === 'fav' ? "Sevimlilar ro'yxati hozircha bo'sh" : 'Hech narsa topilmadi'}</p>
        </div>
      )}
    </div>
  );
}
