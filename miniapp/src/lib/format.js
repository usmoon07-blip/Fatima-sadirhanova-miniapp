import { translate } from './i18n';

export function money(n, lang = 'uz') {
  const num = Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${num} ${translate(lang, 'currency')}`;
}

const MONTHS = {
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

export function shortDate(value, lang = 'uz') {
  const d = new Date(value);
  const m = (MONTHS[lang] || MONTHS.uz)[d.getMonth()];
  if (lang === 'en') return `${m} ${d.getDate()}, ${d.getFullYear()}`;
  if (lang === 'ru') return `${d.getDate()} ${m} ${d.getFullYear()}`;
  return `${d.getDate()}-${m}, ${d.getFullYear()}`;
}

export function dateTime(value, lang = 'uz') {
  const d = new Date(value);
  const p = (x) => String(x).padStart(2, '0');
  return `${shortDate(d, lang)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'FS';
}

export function discountPercent(oldPrice, price) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}
