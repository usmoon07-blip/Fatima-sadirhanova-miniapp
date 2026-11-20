import { ArrowRight, Award, GraduationCap, Search, Sparkles } from 'lucide-react';
import PopularCarousel from '../components/PopularCarousel';
import Img from '../components/Img';
import { StoriesRow } from '../components/Stories';
import { ReviewItem } from '../components/CourseSheet';
import { useStore } from '../store/StoreContext';
import { tgUser } from '../lib/telegram';

export default function Home() {
  const { catalog, me, setTab, setFilter, t, loc } = useStore();
  const name = me.user?.firstName || tgUser()?.first_name || t('guest');
  const { courses, categories, results, reviews } = catalog;

  const openCategory = (category) => {
    setFilter({ category, query: '' });
    setTab('courses');
  };

  return (
    <div className="page">
      <div className="greeting">
        <h1 className="serif">{t('greeting', { name })}</h1>
        <p>{t('greetingSub')}</p>
      </div>

      <button type="button" className="search-fake" onClick={() => openCategory('all')}>
        <Search size={18} /> {t('searchCourses')}
      </button>

      <StoriesRow />

      {courses.length > 0 && (
        <section className="block">
          <div className="section-row">
            <h3 className="serif">{t('popular')}</h3>
            <button type="button" className="link-btn" onClick={() => openCategory('all')}>{t('all')}</button>
          </div>
          <PopularCarousel courses={courses.slice(0, 8)} />
        </section>
      )}

      {categories.length > 1 && (
        // Bo'limlar to'xtovsiz sekin suzib turadi (ro'yxat ikki marta takrorlanadi — uzluksiz aylanish uchun)
        <div className="quick-cats marquee" aria-label={t('coursesTitle')}>
          <div className="marquee-track" style={{ animationDuration: `${Math.max(18, categories.length * 6)}s` }}>
            {[0, 1].map((copy) => categories.map((c) => {
              const cover = courses.find((x) => x.category === c);
              return (
                <button key={`${copy}-${c}`} type="button" className="quick-cat" onClick={() => openCategory(c)} tabIndex={copy ? -1 : 0} aria-hidden={copy ? true : undefined}>
                  <span className="quick-cat-img"><Img src={cover?.imageUrl} alt="" /></span>
                  <span>{loc(cover, 'category') || c}</span>
                </button>
              );
            }))}
          </div>
        </div>
      )}

      <section className="hero" onClick={() => openCategory('all')}>
        <div className="hero-text">
          <span className="chip-light"><Sparkles size={12} /> {t('heroTag')}</span>
          <h2 className="serif">{t('heroTitle')}</h2>
          <p>{t('heroText')}</p>
          <button type="button" className="btn btn-light btn-sm">
            {t('heroBtn')} <ArrowRight size={16} />
          </button>
        </div>
        <GraduationCap className="hero-icon" size={64} strokeWidth={1.2} />
      </section>

      <section className="stats-strip">
        <div><b>2 000+</b><span>{t('statStudents')}</span></div>
        <div><b>{courses.length || '—'}</b><span>{t('statCourses')}</span></div>
        <div><b>24/7</b><span>{t('statAccess')}</span></div>
      </section>

      {results.length > 0 && (
        <section className="block">
          <div className="section-row">
            <h3 className="serif">{t('studentResults')}</h3>
            <button type="button" className="link-btn" onClick={() => setTab('results')}>{t('all')}</button>
          </div>
          <div className="h-scroll results-row">
            {results.slice(0, 8).map((r) => (
              <button key={r.id} type="button" className="result-thumb" onClick={() => setTab('results')}>
                <Img src={r.imageUrl} alt={r.studentName} />
                <span>{r.studentName}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {reviews.length > 0 ? (
        <section className="block">
          <div className="section-row">
            <h3 className="serif">{t('reviews')}</h3>
            <button type="button" className="link-btn" onClick={() => setTab('results')}>{t('all')}</button>
          </div>
          {reviews.slice(0, 2).map((r) => <ReviewItem key={r.id} review={r} showCourse />)}
        </section>
      ) : (
        <section className="promo-card" onClick={() => setTab('results')}>
          <Award size={26} />
          <div>
            <b>{t('promoTitle')}</b>
            <p>{t('promoText')}</p>
          </div>
          <ArrowRight size={18} />
        </section>
      )}
    </div>
  );
}
