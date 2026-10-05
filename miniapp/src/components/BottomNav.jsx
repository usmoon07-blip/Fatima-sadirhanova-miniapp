import { House, ShoppingBag, UserRound, UtensilsCrossed, Zap } from 'lucide-react';
import { useStore } from '../store/StoreContext';

const ITEMS = [
  { id: 'home', Icon: House },
  { id: 'menu', Icon: UtensilsCrossed },
  { id: 'cart', Icon: ShoppingBag },
  { id: 'promos', Icon: Zap },
  { id: 'profile', Icon: UserRound },
];

export default function BottomNav() {
  const { tab, goTo, cartCount, t } = useStore();
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, Icon }) => (
        <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => goTo(id)}>
          <span className="nav-icon">
            <Icon size={21} strokeWidth={tab === id ? 2.3 : 1.8} />
            {id === 'cart' && cartCount > 0 && <span className="dot-badge">{cartCount}</span>}
          </span>
          <span className="nav-label">{t.nav[id]}</span>
        </button>
      ))}
    </nav>
  );
}
