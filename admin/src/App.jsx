import { useEffect, useState } from 'react';
import {
  BarChart3, CakeSlice, ChefHat, CircleDot, GraduationCap, LayoutGrid, LogOut, ReceiptText, TicketPercent, UserCheck,
} from 'lucide-react';
import Login from './pages/Login';
import Kitchen from './pages/Kitchen';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Stories from './pages/Stories';
import Promos from './pages/Promos';
import Reports from './pages/Reports';
import Courses from './pages/Courses';
import Enrollments from './pages/Enrollments';
import { auth, setUnauthorizedHandler } from './api';

const PAGES = [
  { id: 'kitchen', label: 'Oshxona ekrani', Icon: ChefHat, Component: Kitchen, roles: ['admin', 'kitchen'] },
  { id: 'orders', label: 'Buyurtmalar', Icon: ReceiptText, Component: Orders, roles: ['admin'] },
  { id: 'products', label: 'Mahsulotlar', Icon: CakeSlice, Component: Products, roles: ['admin'] },
  { id: 'categories', label: 'Kategoriyalar', Icon: LayoutGrid, Component: Categories, roles: ['admin'] },
  { id: 'enrollments', label: 'Kursga yozilganlar', Icon: UserCheck, Component: Enrollments, roles: ['admin'] },
  { id: 'courses', label: 'Kurslar', Icon: GraduationCap, Component: Courses, roles: ['admin'] },
  { id: 'promos', label: 'Promokodlar', Icon: TicketPercent, Component: Promos, roles: ['admin'] },
  { id: 'stories', label: 'Stories', Icon: CircleDot, Component: Stories, roles: ['admin'] },
  { id: 'reports', label: 'Hisobot', Icon: BarChart3, Component: Reports, roles: ['admin'] },
];

function pageFromHash(role) {
  const allowed = PAGES.filter((p) => p.roles.includes(role));
  const id = window.location.hash.replace('#/', '');
  return allowed.some((p) => p.id === id) ? id : allowed[0].id;
}

export default function App() {
  const [role, setRole] = useState(auth.token ? auth.role : null);
  const [page, setPage] = useState(() => pageFromHash(auth.role));

  useEffect(() => {
    setUnauthorizedHandler(() => setRole(null));
    const onHash = () => setPage(pageFromHash(auth.role));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!role) {
    return (
      <Login onLogin={(r) => {
        setRole(r);
        setPage(pageFromHash(r));
      }}
      />
    );
  }

  const pages = PAGES.filter((p) => p.roles.includes(role));
  const { Component } = pages.find((p) => p.id === page) || pages[0];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <span>🧁</span>
          <div>
            <b>Patisserie</b>
            <small>{role === 'kitchen' ? 'Oshpaz' : 'Boshqaruv paneli'}</small>
          </div>
        </div>
        <nav>
          {pages.map(({ id, label, Icon }) => (
            <a key={id} href={`#/${id}`} className={page === id ? 'active' : ''}>
              <Icon size={18} /> {label}
            </a>
          ))}
        </nav>
        <button type="button" className="logout" onClick={() => { auth.clear(); setRole(null); }}>
          <LogOut size={18} /> Chiqish
        </button>
      </aside>
      <main className="content"><Component /></main>
    </div>
  );
}
