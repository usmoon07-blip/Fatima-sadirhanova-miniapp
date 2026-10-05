import { House, LayoutGrid, ShoppingBag, UserRound } from 'lucide-react';
import { useStore } from '../store/StoreContext';

const ITEMS = [
  { id: 'home', label: 'Bosh sahifa', Icon: House },
  { id: 'catalog', label: 'Katalog', Icon: LayoutGrid },
  { id: 'cart', label: 'Savatcha', Icon: ShoppingBag },
  { id: 'profile', label: 'Profil', Icon: UserRound },
];

export default function BottomNav() {
  const { tab, goTo, cartCount } = useStore();
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, label, Icon }) => (
        <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => goTo(id)}>
          <span className="nav-icon">
            <Icon size={22} strokeWidth={tab === id ? 2.3 : 1.8} />
            {id === 'cart' && cartCount > 0 && <span className="dot-badge">{cartCount}</span>}
          </span>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
