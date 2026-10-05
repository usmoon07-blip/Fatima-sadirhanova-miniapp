import SimpleCrud from './SimpleCrud';
import { api } from '../api';

export default function Stories() {
  return (
    <SimpleCrud
      title="Stories"
      subtitle="Bosh sahifadagi Instagram uslubidagi doira bloklar (aksiya, yangiliklar)"
      resource={api.stories}
      emptyItem={{ title: '', imageUrl: '', text: '', sortOrder: 0, isActive: true }}
      fields={[
        { key: 'imageUrl', label: 'Rasm (vertikal rasm yaxshi ko\'rinadi) *', type: 'image' },
        { key: 'title', label: 'Sarlavha (qisqa) *', type: 'text', placeholder: 'Aksiya' },
        { key: 'text', label: 'Matn', type: 'textarea' },
        { key: 'sortOrder', label: 'Tartib raqami', type: 'number' },
        { key: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle' },
      ]}
      columns={[
        { key: 'title', label: 'Sarlavha', render: (s) => <b>{s.title}</b> },
        { key: 'text', label: 'Matn', render: (s) => <span className="muted small">{s.text}</span> },
        { key: 'sortOrder', label: 'Tartib' },
      ]}
    />
  );
}
