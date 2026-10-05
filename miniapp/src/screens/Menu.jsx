import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Heart, Search, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useStore } from '../store/StoreContext';
import { loc } from '../lib/i18n';

const STICKY_OFFSET = 70;

function haystack(p, categoryNames) {
  return [
    p.name, p.nameRu, p.nameEn, p.description, p.descriptionRu, p.descriptionEn,
    ...(p.ingredients || []), ...(p.ingredientsRu || []), ...(p.ingredientsEn || []),
    categoryNames.get(p.categoryId) || '',
  ].filter(Boolean).join(' ').toLowerCase();
}

export default function Menu() {
  const {
    catalog, activeCategory, setActiveCategory, favorites, menuQuery, setMenuQuery, t, lang,
  } = useStore();
  const [current, setCurrent] = useState(null);
  const sectionRefs = useRef(new Map());
  const chipsRef = useRef(null);
  const inputRef = useRef(null);

  const products = useMemo(() => catalog.products.filter((p) => !p.isUpsell), [catalog.products]);

  const categoryNames = useMemo(() => new Map(catalog.categories.map((c) => [
    c.id, [c.name, c.nameRu, c.nameEn].filter(Boolean).join(' '),
  ])), [catalog.categories]);

  const q = menuQuery.trim().toLowerCase();
  const flatMode = Boolean(q) || activeCategory === 'fav';

  const flat = useMemo(() => {
    if (!flatMode) return [];
    return products.filter((p) => {
      if (activeCategory === 'fav' && !favorites.includes(p.id)) return false;
      if (q && !haystack(p, categoryNames).includes(q)) return false;
      return true;
    });
  }, [flatMode, products, activeCategory, favorites, q, categoryNames]);

  const sections = useMemo(() => {
    const list = catalog.categories
      .map((c) => ({ id: c.id, title: loc(c, 'name', lang), items: products.filter((p) => p.categoryId === c.id) }))
      .filter((s) => s.items.length);
    const rest = products.filter((p) => !p.categoryId || !categoryNames.has(p.categoryId));
    if (rest.length) list.push({ id: 'other', title: t.more, items: rest });
    return list;
  }, [catalog.categories, products, lang, categoryNames, t]);

  // Bosh sahifadan kategoriya tanlab kelinsa — o'sha bo'limga skroll
  useLayoutEffect(() => {
    if (flatMode || typeof activeCategory !== 'number') return;
    const el = sectionRefs.current.get(activeCategory);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skroll paytida joriy bo'limni aniqlash (scrollspy)
  useEffect(() => {
    if (flatMode) return undefined;
    const onScroll = () => {
      let active = sections[0]?.id ?? null;
      for (const s of sections) {
        const el = sectionRefs.current.get(s.id);
        if (el && el.getBoundingClientRect().top - STICKY_OFFSET - 20 <= 0) active = s.id;
      }
      setCurrent(active);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [flatMode, sections]);

  // Faol chipni ko'rinadigan joyga surish
  useEffect(() => {
    const bar = chipsRef.current;
    const chip = bar?.querySelector('.chip.active');
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - bar.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' });
  }, [current, activeCategory]);

  const jump = (id) => {
    setMenuQuery('');
    setActiveCategory(id);
    requestAnimationFrame(() => {
      const el = sectionRefs.current.get(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET + 2, behavior: 'smooth' });
    });
  };

  const chipActive = (id) => (flatMode ? activeCategory === id : current === id);

  return (
    <div className="page">
      <div className="page-title">
        <h1 className="serif">{t.menuTitle}</h1>
        <p className="muted">{t.menuSub}</p>
      </div>

      <div className="search">
        <Search size={18} />
        <input ref={inputRef} value={menuQuery} onChange={(e) => setMenuQuery(e.target.value)} placeholder={t.search} />
        {menuQuery && <button type="button" aria-label="×" onClick={() => setMenuQuery('')}><X size={16} /></button>}
      </div>

      <div className="chips h-scroll sticky-chips" ref={chipsRef}>
        {sections.map((s) => (
          <button key={s.id} type="button" className={`chip ${chipActive(s.id) && !q ? 'active' : ''}`} onClick={() => jump(s.id)}>
            {s.title}
          </button>
        ))}
        <button type="button" className={`chip ${activeCategory === 'fav' ? 'active' : ''}`} onClick={() => { setMenuQuery(''); setActiveCategory(activeCategory === 'fav' ? 'all' : 'fav'); window.scrollTo({ top: 0 }); }}>
          <Heart size={14} /> {t.favorites}
        </button>
      </div>

      {flatMode ? (
        flat.length ? (
          <div className="grid">{flat.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        ) : (
          <div className="empty">
            <div className="empty-emoji">🔍</div>
            <p className="muted">{activeCategory === 'fav' && !q ? t.favEmpty : t.nothingFound}</p>
          </div>
        )
      ) : (
        sections.map((s) => (
          <section key={s.id} className="menu-section" ref={(el) => (el ? sectionRefs.current.set(s.id, el) : sectionRefs.current.delete(s.id))}>
            <div className="section-head">
              <h3 className="serif">{s.title}</h3>
              <span className="muted small">{t.countItems(s.items.length)}</span>
            </div>
            <div className="grid">{s.items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </section>
        ))
      )}
    </div>
  );
}
