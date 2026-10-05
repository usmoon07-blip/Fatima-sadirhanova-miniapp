import { ArrowLeft, Copy, Ticket } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useStore } from '../store/StoreContext';
import { loc } from '../lib/i18n';
import { haptic } from '../lib/telegram';

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  fallbackCopy(text);
  return Promise.resolve();
}

function fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  try { document.execCommand('copy'); } catch { /* */ }
  document.body.removeChild(el);
}

function fmtDate(value) {
  const d = new Date(value);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export default function Promos() {
  const {
    catalog, t, lang, money, showToast, setPromo, applyPromo, goTo, cartCount, setScreen,
  } = useStore();
  const discounted = catalog.products.filter((p) => p.oldPrice > p.price);

  const copy = async (code) => {
    await copyText(code);
    haptic.success();
    showToast(t.copied);
  };

  const use = async (code) => {
    if (cartCount) {
      const ok = await applyPromo(code);
      if (ok) goTo('cart');
    } else {
      setPromo({ code, discount: 0 });
      goTo('menu', { category: 'all' });
      showToast(t.promoApplied(code));
    }
  };

  return (
    <div className="page no-nav">
      <div className="topbar">
        <button type="button" className="icon-btn" aria-label="←" onClick={() => setScreen(null)}><ArrowLeft size={20} /></button>
        <div className="topbar-title">
          <h1 className="serif">{t.promosTitle}</h1>
          <small className="muted">{t.promosSub}</small>
        </div>
        <span style={{ width: 40 }} />
      </div>

      {catalog.promos.length ? (
        <div className="promo-list">
          {catalog.promos.map((p, i) => (
            <article key={p.id} className={`promo-card ${i % 3 === 1 ? 'dark' : ''}`}>
              <Ticket className="promo-bg-icon" size={70} strokeWidth={1} />
              <h3 className="serif">{p.type === 'PERCENT' ? t.percentOff(p.value) : t.fixedOff(money(p.value))}</h3>
              <p>{loc(p, 'description', lang)}</p>
              <div className="promo-code-row">
                <button type="button" className="promo-code" onClick={() => use(p.code)}>{p.code}</button>
                <button type="button" className="promo-copy" aria-label={t.copy} onClick={() => copy(p.code)}><Copy size={16} /></button>
              </div>
              <small>
                {[
                  p.minOrder ? t.promoMin(money(p.minOrder)) : t.promoAny,
                  p.type === 'PERCENT' && p.maxDiscount ? t.maxOff(money(p.maxDiscount)) : null,
                  p.firstOrderOnly ? t.firstOrderOnly : null,
                  p.expiresAt ? t.until(fmtDate(p.expiresAt)) : null,
                ].filter(Boolean).join(' · ')}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-emoji">🎁</div>
          <p className="muted">{t.noPromos}</p>
        </div>
      )}

      {discounted.length > 0 && (
        <section className="section">
          <div className="section-head"><h3 className="serif">{t.discounted}</h3></div>
          <div className="grid">{discounted.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  );
}
