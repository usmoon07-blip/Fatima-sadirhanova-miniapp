import SimpleCrud from './SimpleCrud';
import { api, money } from '../api';

const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');

export default function Promos() {
  return (
    <SimpleCrud
      noImage
      title="Promokodlar"
      subtitle="Chegirma serverda qayta hisoblanadi — mijoz soxta summa yubora olmaydi"
      resource={api.promos}
      nameOf={(p) => p.code}
      emptyItem={{
        code: '', description: '', descriptionRu: '', descriptionEn: '', type: 'PERCENT', value: 10, maxDiscount: '', minOrder: 0,
        expiresAt: '', usageLimit: '', firstOrderOnly: false, isActive: true,
      }}
      toForm={(p) => ({
        ...p, expiresAt: dateOnly(p.expiresAt), maxDiscount: p.maxDiscount ?? '', usageLimit: p.usageLimit ?? '',
        descriptionRu: p.descriptionRu ?? '', descriptionEn: p.descriptionEn ?? '',
      })}
      toPayload={(p) => ({
        ...p,
        value: p.value ?? 0,
        minOrder: p.minOrder ?? 0,
        expiresAt: p.expiresAt ? `${p.expiresAt}T23:59:59+05:00` : null,
      })}
      fields={[
        { key: 'code', label: 'Kod * (lotin harflari, masalan YANGI20)', type: 'text', half: true, upper: true },
        {
          key: 'type', label: 'Chegirma turi', type: 'select', half: true,
          options: [{ value: 'PERCENT', label: 'Foizli (%)' }, { value: 'FIXED', label: "Summali (so'm)" }],
        },
        { key: 'value', label: "Qiymati * (foiz yoki so'm)", type: 'number', half: true },
        { key: 'maxDiscount', label: "Maksimal chegirma, so'm (foizli uchun)", type: 'number', half: true },
        { key: 'minOrder', label: "Eng kam buyurtma summasi (so'm)", type: 'number', half: true },
        { key: 'expiresAt', label: 'Amal qilish muddati (oxirgi kun)', type: 'date', half: true },
        { key: 'usageLimit', label: "Foydalanish limiti (bo'sh — cheksiz)", type: 'number', half: true },
        { key: 'description', label: "Tavsif (o'zbekcha)", type: 'text', placeholder: "Birinchi buyurtmangizga 20 000 so'm chegirma" },
        { key: 'descriptionRu', label: 'Tavsif (ruscha)', type: 'text', half: true },
        { key: 'descriptionEn', label: 'Tavsif (inglizcha)', type: 'text', half: true },
        { key: 'firstOrderOnly', label: 'Faqat birinchi buyurtma uchun', type: 'toggle', half: true },
        { key: 'isActive', label: 'Faol', type: 'toggle', half: true },
      ]}
      columns={[
        { key: 'code', label: 'Kod', render: (p) => <b className="mono">{p.code}</b> },
        { key: 'description', label: 'Tavsif', render: (p) => <span className="muted small">{p.description}</span> },
        {
          key: 'value', label: 'Chegirma',
          render: (p) => (
            <div>
              <b>{p.type === 'PERCENT' ? `${p.value}%` : money(p.value)}</b>
              {p.type === 'PERCENT' && p.maxDiscount ? <div className="muted small">maks. {money(p.maxDiscount)}</div> : null}
            </div>
          ),
        },
        { key: 'minOrder', label: 'Eng kam summa', render: (p) => (p.minOrder ? money(p.minOrder) : '—') },
        { key: 'used', label: 'Ishlatilgan', render: (p) => `${p.usedCount}${p.usageLimit ? ` / ${p.usageLimit}` : ''}` },
        {
          key: 'expiresAt', label: 'Muddati',
          render: (p) => {
            if (!p.expiresAt) return <span className="muted">Cheksiz</span>;
            const expired = new Date(p.expiresAt) < new Date();
            return <span className={expired ? 'red' : ''}>{dateOnly(p.expiresAt).split('-').reverse().join('.')}{expired ? ' (tugagan)' : ''}</span>;
          },
        },
        { key: 'first', label: 'Shart', render: (p) => (p.firstOrderOnly ? <span className="pill">1-buyurtma</span> : '—') },
      ]}
    />
  );
}
