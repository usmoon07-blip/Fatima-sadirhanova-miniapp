import { useEffect, useState } from 'react';
import { Award, BarChart3, Clapperboard, GraduationCap, LogOut, MessageSquareHeart, ReceiptText, Settings as SettingsIcon } from 'lucide-react';
import NotchNav from './components/NotchNav';
import InstallButton from './components/InstallButton';
import InstallPrompt from './components/InstallPrompt';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Orders from './pages/Orders';
import CrudPage from './pages/CrudPage';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import { api, auth, money, setUnauthorizedHandler } from './api';

const COURSE_FIELDS = [
  { name: 'imageUrl', label: 'Rasm', type: 'image', full: true },
  { name: 'title', label: 'Kurs nomi', required: true, full: true },
  { name: 'category', label: 'Kategoriya', placeholder: 'Tortlar, Desertlar...', default: 'Tortlar', datalist: 'categories' },
  { name: 'badge', label: 'Belgi (ixtiyoriy)', placeholder: 'Hit, New, Premium' },
  { name: 'oldPrice', label: "Eski narx (so'm)", type: 'number', placeholder: 'Chizilgan narx' },
  { name: 'price', label: "Yangi narx (so'm)", type: 'number', required: true },
  { name: 'lessonsCount', label: 'Darslar soni', type: 'number', default: 0 },
  { name: 'duration', label: 'Davomiyligi', placeholder: '3 hafta' },
  { name: 'level', label: 'Daraja', placeholder: "Boshlang'ich" },
  { name: 'sortOrder', label: 'Tartib raqami', type: 'number', default: 0 },
  { name: 'description', label: "Ta'rif", type: 'textarea', full: true },
  { name: 'program', label: 'Kurs dasturi (har bir qatorda bitta mavzu)', type: 'lines', full: true },

  { type: 'heading', label: 'Kursga kirish (bir martalik havola)', hint: "Botni kanalga admin qiling va «Foydalanuvchilarni qo'shish (Invite users via link)» huquqini bering — kanal shu ro'yxatda paydo bo'ladi. To'lov tasdiqlanganda har bir o'quvchiga faqat o'zi uchun, 1 marta ishlaydigan havola yuboriladi." },
  { name: 'channelId', label: 'Yopiq kanal', type: 'select', options: 'channels', placeholder: '— Kanal tanlanmagan —', full: true },
  { name: 'accessLink', label: "Ochiq havola (faqat kanal tanlanmagan bo'lsa — himoyasiz)", placeholder: 'https://t.me/+AbCdEf...', full: true },

  { type: 'heading', label: "Fiskal chek (onlayn to'lov uchun)", hint: "MXIK (IKPU) va qadoq kodini tasnif.soliq.uz dan oling. Bo'sh qoldirilsa, standart (test) kodlar ishlatiladi." },
  { name: 'mxik', label: 'MXIK (IKPU) kodi', placeholder: '06401004002000000' },
  { name: 'packageCode', label: 'Qadoq kodi', placeholder: '1506113' },
  { name: 'vat', label: 'QQS (%)', type: 'number', placeholder: "bo'sh — QQSsiz" },

  { type: 'heading', label: 'Rus tilida (ixtiyoriy)', hint: "Bo'sh qoldirsangiz, o'zbekcha matn ko'rsatiladi" },
  { name: 'titleRu', label: 'Название курса', full: true },
  { name: 'categoryRu', label: 'Категория' },
  { name: 'durationRu', label: 'Длительность' },
  { name: 'levelRu', label: 'Уровень' },
  { name: 'descriptionRu', label: 'Описание', type: 'textarea', full: true },
  { name: 'programRu', label: 'Программа (одна тема на строку)', type: 'lines', full: true },

  { type: 'heading', label: 'Ingliz tilida (ixtiyoriy)', hint: "Bo'sh qoldirsangiz, o'zbekcha matn ko'rsatiladi" },
  { name: 'titleEn', label: 'Course title', full: true },
  { name: 'categoryEn', label: 'Category' },
  { name: 'durationEn', label: 'Duration' },
  { name: 'levelEn', label: 'Level' },
  { name: 'descriptionEn', label: 'Description', type: 'textarea', full: true },
  { name: 'programEn', label: 'Programme (one topic per line)', type: 'lines', full: true },

  { name: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle', default: true },
];

const COURSE_COLUMNS = [
  { key: 'imageUrl', label: '', type: 'image' },
  { key: 'title', label: 'Nomi', render: (c) => <><b>{c.title}</b><small>{c.category}{c.badge ? ` · ${c.badge}` : ''}</small></> },
  { key: 'price', label: 'Narx', render: (c) => <>{c.oldPrice ? <s className="muted">{money(c.oldPrice)}</s> : null}<b className="price-red">{money(c.price)}</b></> },
  { key: 'lessonsCount', label: 'Darslar', render: (c) => c.lessonsCount || '—' },
  { key: 'channelId', label: 'Kirish', render: (c) => (c.channelId ? <span className="tag ok">Bir martalik</span> : c.accessLink ? <span className="tag warn">Ochiq havola</span> : <span className="muted">yo'q</span>) },
  { key: 'titleRu', label: 'RU / EN', render: (c) => `${c.titleRu ? '✓' : '—'} / ${c.titleEn ? '✓' : '—'}` },
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
  { name: 'titleRu', label: 'Заголовок (RU)' },
  { name: 'titleEn', label: 'Title (EN)' },
  { name: 'textRu', label: 'Текст (RU)', type: 'textarea', full: true },
  { name: 'textEn', label: 'Text (EN)', type: 'textarea', full: true },
  { name: 'isActive', label: "Ko'rinsin", type: 'toggle', default: true },
];

const STORY_COLUMNS = [
  { key: 'imageUrl', label: '', type: 'image' },
  { key: 'title', label: 'Sarlavha', render: (s) => <b>{s.title}</b> },
  { key: 'text', label: 'Matn', render: (s) => <span className="clamp">{s.text || '—'}</span> },
];

const PAGES = [
  { id: 'analytics', label: 'Statistika', short: 'Stat', Icon: BarChart3 },
  { id: 'orders', label: 'Arizalar', short: 'Arizalar', Icon: ReceiptText },
  { id: 'courses', label: 'Kurslar', short: 'Kurslar', Icon: GraduationCap },
  { id: 'results', label: 'Natijalar', short: 'Natija', Icon: Award },
  { id: 'reviews', label: 'Izohlar', short: 'Izoh', Icon: MessageSquareHeart },
  { id: 'stories', label: 'Stories', short: 'Story', Icon: Clapperboard },
  { id: 'settings', label: 'Sozlamalar (karta)', short: 'Karta', Icon: SettingsIcon },
];

export default function App() {
  const [authed, setAuthed] = useState(Boolean(auth.token));
  const [askInstall, setAskInstall] = useState(false);
  const [page, setPage] = useState(() => {
    const h = window.location.hash.slice(1);
    return PAGES.some((p) => p.id === h) ? h : 'analytics';
  });

  useEffect(() => setUnauthorizedHandler(() => setAuthed(false)), []);
  useEffect(() => { window.location.hash = page; }, [page]);

  if (!authed) return <Login onSuccess={() => { setAuthed(true); setAskInstall(true); }} />;

  const logout = () => {
    auth.clear();
    setAuthed(false);
  };

  return (
    <div className="layout">
      <NotchNav
        items={PAGES}
        active={page}
        onChange={setPage}
        brand={<span className="brand-logo"><img src={`${import.meta.env.BASE_URL}fs-logo.png`} alt="FS" /></span>}
        actions={(
          <>
            <InstallButton variant="compact" />
            <button type="button" className="icon-btn" onClick={logout} aria-label="Chiqish"><LogOut size={17} /></button>
          </>
        )}
        header={(
          <div className="brand">
            <span className="brand-logo"><img src={`${import.meta.env.BASE_URL}fs-logo.png`} alt="FS" /></span>
            <div>
              <b>Fatima Sadirkhanova</b>
              <small>ADMIN PANEL</small>
            </div>
          </div>
        )}
        footer={(
          <div className="side-footer">
            <InstallButton />
            <button type="button" className="logout" onClick={logout}><LogOut size={18} /> <span>Chiqish</span></button>
          </div>
        )}
      />

      {askInstall && <InstallPrompt onDone={() => setAskInstall(false)} />}
      <main key={page} className="content">
        {page === 'analytics' && <Analytics />}
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
        {page === 'settings' && <Settings />}
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
