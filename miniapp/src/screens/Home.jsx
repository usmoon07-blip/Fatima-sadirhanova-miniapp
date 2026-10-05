import {
  ChevronRight, GraduationCap, Heart, Info, MapPin, ReceiptText, Search,
} from 'lucide-react';
import CourseCard from '../components/CourseCard';
import Header from '../components/Header';
import Img from '../components/Img';
import ProductCard from '../components/ProductCard';
import { StoriesRow } from '../components/Stories';
import { useStore } from '../store/StoreContext';
import { loc } from '../lib/i18n';

const HERO = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80';

export default function Home() {
  const {
    catalog, displayName, goTo, t, lang, config, user, setPanel, setScreen,
  } = useStore();
  const popular = catalog.products.filter((p) => p.isPopular);
  const heroImage = popular[0]?.imageUrl || HERO;
  const { delivery } = config;

  const banners = [];
  if (catalog.courses.length) {
    const c = catalog.courses[0];
    banners.push({
      key: 'courses', tag: t.coursesTitle.toUpperCase(), title: t.homeCourses, text: loc(c, 'title', lang), dark: true, icon: <GraduationCap size={64} strokeWidth={1.2} />, onClick: () => goTo('courses'),
    });
  }

  return (
    <div className="page">
      <Header />

      <div className="greeting">
        <h2 className="serif">{t.hello(displayName)}</h2>
        <p className="muted">{t.helloSub}</p>
      </div>

      <button type="button" className="search fake" onClick={() => goTo('menu', { category: 'all', query: '' })}>
        <Search size={18} /> <span>{t.search}</span>
      </button>

      <button type="button" className="address-card card" onClick={() => setPanel('address')}>
        <span className="address-icon"><MapPin size={18} /></span>
        <span className="address-text">
          <b>{user?.address || (user?.latitude ? `📍 ${user.latitude.toFixed(4)}, ${user.longitude.toFixed(4)}` : t.setAddress)}</b>
          <small>{config.order?.advanceDays ? t.preorderNote(config.order.advanceDays) : t.deliverIn(delivery.etaDelivery)}</small>
        </span>
        <ChevronRight size={18} className="muted" />
      </button>

      <StoriesRow />

      <div className="quick-grid">
        <button type="button" onClick={() => setPanel('about')}><Info size={20} /><span>{t.quick.about}</span></button>
        <button type="button" onClick={() => goTo('courses')}><GraduationCap size={20} /><span>{t.quick.courses}</span></button>
        <button type="button" onClick={() => goTo('menu', { category: 'fav' })}><Heart size={20} /><span>{t.favorites}</span></button>
        <button type="button" onClick={() => setScreen('orders')}><ReceiptText size={20} /><span>{t.quick.orders}</span></button>
      </div>

      {banners.length > 0 && (
        <div className="h-scroll banners">
          {banners.map((b) => (
            <button key={b.key} type="button" className={`banner ${b.dark ? 'dark' : ''}`} onClick={b.onClick}>
              <span className="banner-tag">{b.tag}</span>
              <span className="banner-title serif">{b.title}</span>
              <span className="banner-text">{b.text}</span>
              {b.code && <span className="banner-code">{b.code}</span>}
              {b.icon && <span className="banner-icon">{b.icon}</span>}
            </button>
          ))}
        </div>
      )}

      <section className="hero">
        <Img src={heroImage} alt="" className="hero-img" eager emoji="🍰" />
        <div className="hero-content">
          <h1 className="serif">{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <button type="button" className="btn btn-primary" onClick={() => goTo('menu', { category: 'all' })}>
            {t.heroBtn}
          </button>
        </div>
      </section>

      {catalog.categories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h3 className="serif">{t.categories}</h3>
            <button type="button" className="link" onClick={() => goTo('menu', { category: 'all' })}>
              {t.all} <ChevronRight size={16} />
            </button>
          </div>
          <div className="cat-grid">
            {catalog.categories.slice(0, 4).map((c) => (
              <button key={c.id} type="button" className="cat-card" onClick={() => goTo('menu', { category: c.id })}>
                <Img src={c.imageUrl} alt="" />
                <span>{loc(c, 'name', lang)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {catalog.courses.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h3 className="serif">{t.homeCourses}</h3>
            <button type="button" className="link" onClick={() => goTo('courses')}>
              {t.all} <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-scroll course-row">
            {catalog.courses.map((c) => <CourseCard key={c.id} course={c} compact />)}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h3 className="serif">{t.popular}</h3>
            <button type="button" className="link" onClick={() => goTo('menu', { category: 'all' })}>
              {t.more} <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-scroll popular-row">
            {popular.map((p) => <ProductCard key={p.id} product={p} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}
