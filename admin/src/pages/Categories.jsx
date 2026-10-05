import SimpleCrud from './SimpleCrud';
import { api } from '../api';

export default function Categories() {
  return (
    <SimpleCrud
      title="Kategoriyalar"
      subtitle="Katalogdagi bo'limlar (Tortlar, Keklar, ...)"
      resource={api.categories}
      emptyItem={{ name: '', imageUrl: '', sortOrder: 0, isActive: true }}
      fields={[
        { key: 'imageUrl', label: 'Rasm', type: 'image' },
        { key: 'name', label: 'Nomi *', type: 'text', placeholder: 'Masalan: Tortlar' },
        { key: 'sortOrder', label: 'Tartib raqami', type: 'number' },
        { key: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle' },
      ]}
      columns={[
        { key: 'name', label: 'Nomi', render: (c) => <b>{c.name}</b> },
        { key: 'count', label: 'Mahsulotlar', render: (c) => c._count?.products ?? 0 },
        { key: 'sortOrder', label: 'Tartib' },
      ]}
    />
  );
}
