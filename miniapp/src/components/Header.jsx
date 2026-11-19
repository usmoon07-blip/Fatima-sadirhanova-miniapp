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
  const { cart, setTab, t } = useStore();
  return (
    <header className="top-bar">
      <Brand />
      <button type="button" className="icon-btn" onClick={() => setTab('cart')} aria-label={t('nav_cart')}>
        <ShoppingBag size={19} />
        {cart.length > 0 && <span className="dot-badge">{cart.length}</span>}
      </button>
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
