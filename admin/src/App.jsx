import { useEffect, useState } from 'react';
import { Award, Clapperboard, GraduationCap, LogOut, MessageSquareHeart, ReceiptText } from 'lucide-react';
import Login from './pages/Login';
import Orders from './pages/Orders';
import CrudPage from './pages/CrudPage';
import Reviews from './pages/Reviews';
import { api, auth, money, setUnauthorizedHandler } from './api';

const COURSE_FIELDS = [
  { name: 'imageUrl', label: 'Rasm', type: 'image', full: true },
  { name: 'title', label: 'Kurs nomi', required: true, full: true },
  { name: 'category', label: 'Kategoriya', placeholder: 'Tortlar, Desertlar...', default: 'Tortlar', datalist: 'categories' },
  { name: 'badge', label: 'Belgi (ixtiyoriy)', placeholder: 'Hit, Yangi, Premium' },
  { name: 'oldPrice', label: "Eski narx (so'm)", type: 'number', placeholder: 'Chizilgan narx' },
  { name: 'price', label: "Yangi narx (so'm)", type: 'number', required: true },
  { name: 'lessonsCount', label: 'Darslar soni', type: 'number', default: 0 },
  { name: 'duration', label: 'Davomiyligi', placeholder: '3 hafta' },
  { name: 'level', label: 'Daraja', placeholder: "Boshlang'ich" },
  { name: 'sortOrder', label: 'Tartib raqami', type: 'number', default: 0 },
  { name: 'description', label: 'Ta\'rif', type: 'textarea', full: true },
  { name: 'program', label: 'Kurs dasturi (har bir qatorda bitta mavzu)', type: 'lines', full: true },
  { name: 'accessLink', label: 'Kursga kirish havolasi (yopiq kanal/guruh) — to\'lovdan keyin botda yuboriladi', placeholder: 'https://t.me/+AbCdEf...', full: true },
  { name: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle', default: true },
];

const COURSE_COLUMNS = [
  { key: 'imageUrl', label: '', type: 'image' },
  { key: 'title', label: 'Nomi', render: (c) => <><b>{c.title}</b><small>{c.category}{c.badge ? ` · ${c.badge}` : ''}</small></> },
  { key: 'price', label: 'Narx', render: (c) => <>{c.oldPrice ? <s className="muted">{money(c.oldPrice)}</s> : null}<b className="price-red">{money(c.price)}</b></> },
  { key: 'lessonsCount', label: 'Darslar', render: (c) => c.lessonsCount || '—' },
  { key: 'accessLink', label: 'Havola', render: (c) => (c.accessLink ? '✅' : <span className="muted">yo'q</span>) },
];

const RESULT_FIELDS = [
  { name: 'imageUrl', label: "O'quvchi ishi rasmi", type: 'image', full: true },
  { name: 'studentName', label: "O'quvchi ismi", required: true },
  { name: 'courseTitle', label: 'Kurs nomi', datalist: 'courses' },
  { name: 'text', label: 'Izoh / natija haqida', type: 'textarea', full: true },
  { name: 'sortOrder', label: 'Tartib raqami', type: 'number', default: 0 },
  { name: 'isActive', label: "Ko'rinsin", type: 'toggle', default: true },
];

const RESULT_COLUMNS = [
  { key: 'imageUrl', label: '', type: 'image' },
  { key: 'studentName', label: "O'quvchi", render: (r) => <><b>{r.studentName}</b><small>{r.courseTitle || ''}</small></> },
  { key: 'text', label: 'Izoh', render: (r) => <span className="clamp">{r.text || '—'}</span> },
];

const STORY_FIELDS = [
  { name: 'imageUrl', label: 'Rasm (vertikal rasm yaxshi ko\'rinadi)', type: 'image', full: true },
  { name: 'title', label: 'Sarlavha', required: true },
  { name: 'sortOrder', label: 'Tartib raqami', type: 'number', default: 0 },
  { name: 'text', label: 'Matn', type: 'textarea', full: true },
  { name: 'isActive', label: "Ko'rinsin", type: 'toggle', default: true },
];

const STORY_COLUMNS = [
  { key: 'imageUrl', label: '', type: 'image' },
  { key: 'title', label: 'Sarlavha', render: (s) => <b>{s.title}</b> },
  { key: 'text', label: 'Matn', render: (s) => <span className="clamp">{s.text || '—'}</span> },
];

const PAGES = [
  { id: 'orders', label: 'Buyurtmalar', Icon: ReceiptText },
  { id: 'courses', label: 'Kurslar', Icon: GraduationCap },
  { id: 'results', label: 'Natijalar', Icon: Award },
  { id: 'reviews', label: 'Izohlar', Icon: MessageSquareHeart },
  { id: 'stories', label: 'Stories', Icon: Clapperboard },
];

export default function App() {
  const [authed, setAuthed] = useState(Boolean(auth.token));
  const [page, setPage] = useState(() => window.location.hash.slice(1) || 'orders');

  useEffect(() => setUnauthorizedHandler(() => setAuthed(false)), []);
  useEffect(() => { window.location.hash = page; }, [page]);

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;

  const logout = () => {
    auth.clear();
    setAuthed(false);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">🧁</span>
          <div>
            <b>Fatima Sadirkhanova</b>
            <small>ADMIN PANEL</small>
          </div>
        </div>
        <nav>
          {PAGES.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              <Icon size={18} /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="logout" onClick={logout}><LogOut size={18} /> <span>Chiqish</span></button>
      </aside>

      <main className="content">
        {page === 'orders' && <Orders />}
        {page === 'courses' && (
          <CrudPage
            key="courses"
            title="Kurslar"
            subtitle="Kurs qo'shish, tahrirlash va o'chirish"
            resource={api.courses}
            fields={COURSE_FIELDS}
            columns={COURSE_COLUMNS}
            itemName="kurs"
          />
        )}
        {page === 'results' && (
          <CrudPage
            key="results"
            title="O'quvchilar natijalari"
            subtitle="Mini App'dagi «Natijalar» galereyasi"
            resource={api.results}
            fields={RESULT_FIELDS}
            columns={RESULT_COLUMNS}
            itemName="natija"
          />
        )}
        {page === 'reviews' && <Reviews />}
        {page === 'stories' && (
          <CrudPage
            key="stories"
            title="Stories"
            subtitle="Bosh sahifaning tepasidagi doira shaklidagi bloklar"
            resource={api.stories}
            fields={STORY_FIELDS}
            columns={STORY_COLUMNS}
            itemName="story"
          />
        )}
      </main>
    </div>
  );
}
