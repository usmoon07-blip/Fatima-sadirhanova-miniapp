import { ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Img from '../components/Img';
import ProductCard from '../components/ProductCard';
import { StoriesRow } from '../components/Stories';
import { useStore } from '../store/StoreContext';

const HERO = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80';

export default function Home() {
  const { catalog, displayName, goTo } = useStore();
  const popular = catalog.products.filter((p) => p.isPopular && !p.isUpsell);
  const heroImage = popular[0]?.imageUrl || HERO;

  return (
    <div className="page">
      <Header />

      <div className="greeting">
        <h2 className="serif">Assalomu alaykum, {displayName} 👋</h2>
        <p className="muted">Bugun qaysi shirinlik bilan o'zingizni erkalaysiz?</p>
      </div>

      <StoriesRow />

      <section className="hero">
        <Img src={heroImage} alt="" className="hero-img" eager emoji="🍰" />
        <div className="hero-content">
          <h1 className="serif">Har kuni yangi pishiriqlar</h1>
          <p>Qo'lda tayyorlangan premium shirinliklar — eshigingizgacha</p>
          <button type="button" className="btn btn-primary" onClick={() => goTo('catalog', { category: 'all' })}>
            Yangi buyurtma berish
          </button>
        </div>
      </section>

      {catalog.categories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h3 className="serif">Kategoriyalar</h3>
            <button type="button" className="link" onClick={() => goTo('catalog', { category: 'all' })}>
              Barchasi <ChevronRight size={16} />
            </button>
          </div>
          <div className="cat-grid">
            {catalog.categories.slice(0, 4).map((c) => (
              <button key={c.id} type="button" className="cat-card" onClick={() => goTo('catalog', { category: c.id })}>
                <Img src={c.imageUrl} alt={c.name} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h3 className="serif">Mashhur tanlovlar</h3>
            <button type="button" className="link" onClick={() => goTo('catalog', { category: 'all' })}>
              Ko'proq <ChevronRight size={16} />
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
