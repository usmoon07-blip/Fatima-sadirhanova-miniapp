import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { PageTitle } from '../components/Header';
import { useStore } from '../store/StoreContext';
import { haptic } from '../lib/telegram';

export default function Catalog() {
  const { catalog, filter, setFilter } = useStore();
  const { courses, categories } = catalog;

  const list = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter.category !== 'all' && c.category !== filter.category) return false;
      if (!q) return true;
      return `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(q);
    });
  }, [courses, filter]);

  const chips = ['all', ...categories];

  return (
    <div className="page">
      <PageTitle title="Kurslar" subtitle="O'zingizga mos kursni tanlang" />

      <label className="search">
        <Search size={18} />
        <input
          type="search"
          value={filter.query}
          onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
          placeholder="Kurslarni qidirish..."
        />
        {filter.query && (
          <button type="button" onClick={() => setFilter((f) => ({ ...f, query: '' }))} aria-label="Tozalash"><X size={16} /></button>
        )}
      </label>

      <div className="chips h-scroll">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${filter.category === c ? 'on' : ''}`}
            onClick={() => { haptic.select(); setFilter((f) => ({ ...f, category: c })); }}
          >
            {c === 'all' ? 'Hammasi' : c}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="grid">
          {list.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      ) : (
        <div className="empty">
          <span className="empty-emoji">🔍</span>
          <b>Hech narsa topilmadi</b>
          <p>Boshqa so'z bilan qidirib ko'ring</p>
        </div>
      )}
    </div>
  );
}
