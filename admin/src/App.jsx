import { useEffect, useState } from 'react';
import { CakeSlice, CircleDot, LayoutGrid, LogOut, ReceiptText } from 'lucide-react';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Stories from './pages/Stories';
import { auth, setUnauthorizedHandler } from './api';

const PAGES = [
  { id: 'orders', label: 'Buyurtmalar', Icon: ReceiptText, Component: Orders },
  { id: 'products', label: 'Mahsulotlar', Icon: CakeSlice, Component: Products },
  { id: 'categories', label: 'Kategoriyalar', Icon: LayoutGrid, Component: Categories },
  { id: 'stories', label: 'Stories', Icon: CircleDot, Component: Stories },
];

function currentPage() {
  const id = window.location.hash.replace('#/', '');
  return PAGES.some((p) => p.id === id) ? id : 'orders';
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(Boolean(auth.token));
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    setUnauthorizedHandler(() => setLoggedIn(false));
    const onHash = () => setPage(currentPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const { Component } = PAGES.find((p) => p.id === page);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <span>🧁</span>
          <div>
            <b>Patisserie</b>
            <small>Admin Panel</small>
          </div>
        </div>
        <nav>
          {PAGES.map(({ id, label, Icon }) => (
            <a key={id} href={`#/${id}`} className={page === id ? 'active' : ''}>
              <Icon size={18} /> {label}
            </a>
          ))}
        </nav>
        <button type="button" className="logout" onClick={() => { auth.clear(); setLoggedIn(false); }}>
          <LogOut size={18} /> Chiqish
        </button>
      </aside>
      <main className="content"><Component /></main>
    </div>
  );
}
