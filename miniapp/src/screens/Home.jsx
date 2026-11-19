import { ArrowRight, Award, GraduationCap, Search, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import CourseCard from '../components/CourseCard';
import Img from '../components/Img';
import { StoriesRow } from '../components/Stories';
import { ReviewItem } from '../components/CourseSheet';
import { useStore } from '../store/StoreContext';
import { tgUser } from '../lib/telegram';

export default function Home() {
  const { catalog, me, setTab, setFilter } = useStore();
  const name = me.user?.firstName || tgUser()?.first_name || 'Mehmon';
  const { courses, categories, results, reviews } = catalog;

  const openCategory = (category) => {
    setFilter({ category, query: '' });
    setTab('courses');
  };

  return (
    <div className="page">
      <Header />

      <div className="greeting">
        <h1 className="serif">Assalomu alaykum, {name} 👋</h1>
        <p>Bugun qaysi shirinlikni birga o'rganamiz?</p>
      </div>

      <button type="button" className="search-fake" onClick={() => openCategory('all')}>
        <Search size={18} /> Kurslarni qidirish...
      </button>

      <StoriesRow />

      <section className="hero" onClick={() => openCategory('all')}>
        <div className="hero-text">
          <span className="chip-light"><Sparkles size={12} /> KURSLAR</span>
          <h2 className="serif">Qandolatchilik kurslari</h2>
          <p>Uyda turib professional tortlar va desertlar pishirishni o'rganing</p>
          <button type="button" className="btn btn-light btn-sm">
            Kursni tanlash <ArrowRight size={16} />
          </button>
        </div>
        <GraduationCap className="hero-icon" size={64} strokeWidth={1.2} />
      </section>

      {categories.length > 1 && (
        <div className="quick-cats h-scroll">
          {categories.map((c) => {
            const cover = courses.find((x) => x.category === c);
            return (
              <button key={c} type="button" className="quick-cat" onClick={() => openCategory(c)}>
                <span className="quick-cat-img"><Img src={cover?.imageUrl} alt="" /></span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>
      )}

      {courses.length > 0 && (
        <section className="block">
          <div className="section-row">
            <h3 className="serif">Mashhur kurslar</h3>
            <button type="button" className="link-btn" onClick={() => openCategory('all')}>Barchasi</button>
          </div>
          <div className="h-scroll cards-row">
            {courses.slice(0, 6).map((c) => <CourseCard key={c.id} course={c} wide />)}
          </div>
        </section>
      )}

      <section className="stats-strip">
        <div><b>10 000+</b><span>o'quvchi</span></div>
        <div><b>{courses.length || '—'}</b><span>kurs</span></div>
        <div><b>24/7</b><span>darslarga kirish</span></div>
      </section>

      {results.length > 0 && (
        <section className="block">
          <div className="section-row">
            <h3 className="serif">O'quvchilar natijalari</h3>
            <button type="button" className="link-btn" onClick={() => setTab('results')}>Barchasi</button>
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
            <h3 className="serif">Izohlar</h3>
            <button type="button" className="link-btn" onClick={() => setTab('results')}>Barchasi</button>
          </div>
          {reviews.slice(0, 2).map((r) => <ReviewItem key={r.id} review={r} showCourse />)}
        </section>
      ) : (
        <section className="promo-card" onClick={() => setTab('results')}>
          <Award size={26} />
          <div>
            <b>O'quvchilarimiz natijalari</b>
            <p>Kurslarimizni tamomlaganlar ishlarini ko'ring</p>
          </div>
          <ArrowRight size={18} />
        </section>
      )}
    </div>
  );
}
