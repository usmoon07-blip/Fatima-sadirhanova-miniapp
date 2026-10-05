import { Bell, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/StoreContext';

export function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M14 30h36l-5 24H19z" fill="#B8874E" />
      <path d="M22 30l3 24M32 30v24M42 30l-3 24" stroke="#9A6C37" strokeWidth="2" />
      <path d="M18 30c-6 0-8-10 0-12 1-7 11-10 15-4 5-5 15-1 14 6 6 1 6 10-1 10z" fill="#F3E4CE" />
      <circle cx="33" cy="12" r="5" fill="#7A4E2D" />
    </svg>
  );
}

export default function Header() {
  const { config, cartCount, goTo, setScreen } = useStore();
  return (
    <header className="app-header">
      <div className="brand">
        <Logo />
        <div>
          <div className="brand-name">{config?.shop.name}</div>
          <div className="brand-tag">{config?.shop.tagline}</div>
        </div>
      </div>
      <div className="header-actions">
        <button type="button" className="icon-btn" aria-label="orders" onClick={() => setScreen('orders')}>
          <Bell size={20} />
        </button>
        <button type="button" className="icon-btn" aria-label="cart" onClick={() => goTo('cart')}>
          <ShoppingBag size={20} />
          {cartCount > 0 && <span className="dot-badge">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
