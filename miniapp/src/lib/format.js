export function money(n) {
  return `${Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

export function shortMoney(n) {
  return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function dateTime(value) {
  const d = new Date(value);
  const p = (x) => String(x).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function discountPercent(product) {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.oldPrice) * 100);
}

/** +998 90 123 45 67 ko'rinishiga keltiradi */
export function formatPhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length <= 9 && !d.startsWith('998')) d = `998${d}`;
  d = d.slice(0, 12);
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return `+${parts.join(' ')}`;
}

export function isValidPhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('998')) return d.length === 12;
  return d.length >= 10 && d.length <= 15;
}

export const STATUS = {
  NEW: { label: 'Qabul qilindi', tone: 'info' },
  CONFIRMED: { label: 'Tasdiqlandi', tone: 'info' },
  PREPARING: { label: 'Tayyorlanmoqda', tone: 'warn' },
  READY: { label: 'Tayyor', tone: 'warn' },
  ON_THE_WAY: { label: "Yo'lda", tone: 'warn' },
  DELIVERED: { label: 'Yetkazildi', tone: 'ok' },
  CANCELLED: { label: 'Bekor qilindi', tone: 'bad' },
};

export function pluralItems(n) {
  return `${n} ta mahsulot`;
}
