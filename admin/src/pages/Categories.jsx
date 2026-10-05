import SimpleCrud from './SimpleCrud';
import { api } from '../api';

export default function Categories() {
  return (
    <SimpleCrud
      title="Kategoriyalar"
      subtitle="Menyudagi bo'limlar (Tortlar, Keklar, ...)"
      resource={api.categories}
      emptyItem={{ name: '', nameRu: '', nameEn: '', imageUrl: '', sortOrder: 0, isActive: true }}
      fields={[
        { key: 'imageUrl', label: 'Rasm', type: 'image' },
        { key: 'name', label: "Nomi (o'zbekcha) *", type: 'text', placeholder: 'Tortlar' },
        { key: 'nameRu', label: 'Nomi (ruscha)', type: 'text', half: true, placeholder: 'Торты' },
        { key: 'nameEn', label: 'Nomi (inglizcha)', type: 'text', half: true, placeholder: 'Cakes' },
        { key: 'sortOrder', label: 'Tartib raqami', type: 'number', half: true },
        { key: 'isActive', label: "Mini App'da ko'rinsin", type: 'toggle', half: true },
      ]}
      toPayload={(p) => ({ ...p, sortOrder: p.sortOrder ?? 0 })}
      columns={[
        { key: 'name', label: 'Nomi', render: (c) => <div><b>{c.name}</b><div className="muted small">{[c.nameRu, c.nameEn].filter(Boolean).join(' · ')}</div></div> },
        { key: 'count', label: 'Mahsulotlar', render: (c) => c._count?.products ?? 0 },
        { key: 'sortOrder', label: 'Tartib' },
      ]}
    />
  );
}
