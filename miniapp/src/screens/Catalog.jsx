import { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { PageTitle } from '../components/Header';
import { useStore } from '../store/StoreContext';
import { L } from '../lib/i18n';
import { haptic } from '../lib/telegram';

export default function Catalog() {
  const { catalog, filter, setFilter, t, loc } = useStore();
  const { courses, categories } = catalog;

  const list = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter.category !== 'all' && c.category !== filter.category) return false;
      if (!q) return true;
      const text = ['uz', 'ru', 'en'].map((l) => `${L(c, 'title', l)} ${L(c, 'description', l)} ${L(c, 'category', l)}`).join(' ');
      return text.toLowerCase().includes(q);
    });
  }, [courses, filter]);

  const chips = ['all', ...categories];
  const chipLabel = (c) => (c === 'all' ? t('allCats') : loc(courses.find((x) => x.category === c), 'category') || c);

  return (
    <div className="page">
      <PageTitle title={t('coursesTitle')} subtitle={t('coursesSub')} />

      <label className="search">
        <Search size={18} />
        <input
          type="search"
          value={filter.query}
          onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
          placeholder={t('searchCourses')}
        />
        {filter.query && (
          <button type="button" onClick={() => setFilter((f) => ({ ...f, query: '' }))} aria-label={t('clear')}><X size={16} /></button>
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
            {chipLabel(c)}
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
          <b>{t('notFound')}</b>
          <p>{t('notFoundSub')}</p>
        </div>
      )}
    </div>
  );
}
