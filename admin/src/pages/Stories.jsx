import SimpleCrud from './SimpleCrud';
import { api } from '../api';

export default function Stories() {
  return (
    <SimpleCrud
      title="Stories"
      subtitle="Bosh sahifadagi Instagram uslubidagi doira bloklar (aksiya, yangiliklar)"
      resource={api.stories}
      emptyItem={{ title: '', titleRu: '', titleEn: '', imageUrl: '', text: '', textRu: '', textEn: '', sortOrder: 0, isActive: true }}
      fields={[
        { key: 'imageUrl', label: "Rasm (vertikal rasm yaxshi ko'rinadi) *", type: 'image' },
        { key: 'title', label: "Sarlavha (o'zbekcha) *", type: 'text', placeholder: 'Aksiya' },
        { key: 'titleRu', label: 'Sarlavha (ruscha)', type: 'text', half: true },
        { key: 'titleEn', label: 'Sarlavha (inglizcha)', type: 'text', half: true },
        { key: 'text', label: "Matn (o'zbekcha)", type: 'textarea' },
        { key: 'textRu', label: 'Matn (ruscha)', type: 'textarea', half: true },
        { key: 'textEn', label: 'Matn (inglizcha)', type: 'textarea', half: true },
        { key: 'sortOrder', label: 'Tartib raqami', type: 'number', half: true },
        { key: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle', half: true },
      ]}
      toPayload={(p) => ({ ...p, sortOrder: p.sortOrder ?? 0 })}
      columns={[
        { key: 'title', label: 'Sarlavha', render: (s) => <b>{s.title}</b> },
        { key: 'text', label: 'Matn', render: (s) => <span className="muted small">{s.text}</span> },
        { key: 'sortOrder', label: 'Tartib' },
      ]}
    />
  );
}
