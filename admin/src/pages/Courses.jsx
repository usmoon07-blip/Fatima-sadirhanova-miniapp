import SimpleCrud from './SimpleCrud';
import { api, money } from '../api';

const LIST_KEYS = ['program', 'programRu', 'programEn'];
const split = (text) => (text || '').split('\n').map((s) => s.trim()).filter(Boolean);

export default function Courses() {
  return (
    <SimpleCrud
      title="Kurslar"
      subtitle="Online va offline qandolatchilik kurslari — Mini App'dagi «Kurslar» bo'limi"
      resource={api.courses}
      nameOf={(c) => c.title}
      emptyItem={{
        title: '', titleRu: '', titleEn: '', description: '', descriptionRu: '', descriptionEn: '',
        program: '', programRu: '', programEn: '', duration: '', durationRu: '', durationEn: '',
        imageUrl: '', onlinePrice: '', offlinePrice: '', badge: '', sortOrder: 0, isActive: true,
      }}
      toForm={(c) => {
        const f = { ...c };
        for (const k of LIST_KEYS) f[k] = (c[k] || []).join('\n');
        for (const k of ['titleRu', 'titleEn', 'descriptionRu', 'descriptionEn', 'duration', 'durationRu', 'durationEn', 'badge', 'onlinePrice', 'offlinePrice']) f[k] = c[k] ?? '';
        return f;
      }}
      toPayload={(p) => {
        const out = { ...p, sortOrder: p.sortOrder ?? 0 };
        for (const k of LIST_KEYS) out[k] = split(p[k]);
        return out;
      }}
      fields={[
        { key: 'imageUrl', label: 'Rasm *', type: 'image' },
        { key: 'title', label: "Kurs nomi (o'zbekcha) *", type: 'text', placeholder: 'Makaronterapiya' },
        { key: 'titleRu', label: 'Nomi (ruscha)', type: 'text', half: true },
        { key: 'titleEn', label: 'Nomi (inglizcha)', type: 'text', half: true },
        { key: 'onlinePrice', label: "Online narxi (so'm) — bo'sh bo'lsa online yo'q", type: 'number', half: true },
        { key: 'offlinePrice', label: "Offline narxi (so'm) — bo'sh bo'lsa offline yo'q", type: 'number', half: true },
        { key: 'duration', label: "Davomiyligi (o'zbekcha)", type: 'text', half: true, placeholder: '2 kun · 8 soat' },
        { key: 'badge', label: 'Belgi (badge)', type: 'text', half: true, placeholder: 'Hit, Premium, Yangi' },
        { key: 'durationRu', label: 'Davomiyligi (ruscha)', type: 'text', half: true },
        { key: 'durationEn', label: 'Davomiyligi (inglizcha)', type: 'text', half: true },
        { key: 'description', label: "Tavsif (o'zbekcha)", type: 'textarea' },
        { key: 'descriptionRu', label: 'Tavsif (ruscha)', type: 'textarea', half: true },
        { key: 'descriptionEn', label: 'Tavsif (inglizcha)', type: 'textarea', half: true },
        { key: 'program', label: "Kurs dasturi (o'zbekcha, har qatorga bitta mavzu)", type: 'textarea' },
        { key: 'programRu', label: 'Dastur (ruscha)', type: 'textarea', half: true },
        { key: 'programEn', label: 'Dastur (inglizcha)', type: 'textarea', half: true },
        { key: 'sortOrder', label: 'Tartib raqami', type: 'number', half: true },
        { key: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle', half: true },
      ]}
      columns={[
        { key: 'title', label: 'Kurs', render: (c) => <div><b>{c.title}</b><div className="muted small">{c.duration}</div></div> },
        { key: 'online', label: 'Online', render: (c) => (c.onlinePrice ? money(c.onlinePrice) : <span className="muted">—</span>) },
        { key: 'offline', label: 'Offline', render: (c) => (c.offlinePrice ? money(c.offlinePrice) : <span className="muted">—</span>) },
        { key: 'count', label: 'Arizalar', render: (c) => c._count?.enrollments ?? 0 },
      ]}
    />
  );
}
