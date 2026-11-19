import { ShoppingBag } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export function Brand() {
  const { config } = useStore();
  return (
    <div className="brand">
      <span className="brand-logo"><img src="/fs-logo.png" alt="Fatima Sadirkhanova" /></span>
      <span className="brand-text">
        <b className="serif">{config?.shop?.name || 'Fatima Sadirkhanova'}</b>
        <small>{config?.shop?.tagline || 'PATISSERIE'}</small>
      </span>
    </div>
  );
}

export default function Header() {
  const { cart, setTab, t, config } = useStore();
  return (
    <header className="app-top">
      <div className="app-top-row">
        <button type="button" className="app-top-logo" onClick={() => setTab('home')} aria-label={t('nav_home')}>
          <img src="/fs-logo.png" alt="" />
        </button>
        <div className="app-top-title">
          <small>{config?.shop?.tagline || 'PATISSERIE'}</small>
          <b className="serif">{config?.shop?.name || 'Fatima Sadirkhanova'}</b>
        </div>
        <button type="button" className="app-top-btn" onClick={() => setTab('cart')} aria-label={t('nav_cart')}>
          <ShoppingBag size={21} />
          {cart.length > 0 && <span className="dot-badge">{cart.length}</span>}
        </button>
      </div>
    </header>
  );
}

export function PageTitle({ title, subtitle }) {
  return (
    <div className="page-title">
      <h1 className="serif">{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
