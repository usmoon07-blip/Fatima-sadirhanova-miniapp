const TZ = 'Asia/Tashkent';

function money(amount) {
  return `${Math.round(amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

function dateTime(date) {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return `${get('day')}.${get('month')}.${get('year')} ${get('hour')}:${get('minute')}`;
}

/** Toshkent vaqti bo'yicha bugungi kun boshlanishi (UTC Date) */
function startOfTodayTashkent() {
  const now = new Date();
  const offsetMs = 5 * 60 * 60 * 1000; // UTC+5, yozgi vaqt yo'q
  const local = new Date(now.getTime() + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - offsetMs);
}

function normalizePhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return '';
}

function escapeHtml(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const STATUS_LABELS = {
  NEW: '🆕 Yangi',
  CONFIRMED: '✅ Tasdiqlandi',
  PREPARING: '👩‍🍳 Tayyorlanmoqda',
  READY: '📦 Tayyor',
  ON_THE_WAY: '🚚 Kuryerga berildi',
  DELIVERED: '🎉 Yetkazildi',
  CANCELLED: '❌ Bekor qilindi',
};

const DELIVERY_LABELS = { DELIVERY: '🚚 Yetkazib berish', PICKUP: '🏪 Olib ketish' };
const PAYMENT_LABELS = { CASH: '💵 Naqd', CARD: '💳 Karta orqali' };

module.exports = {
  money, dateTime, startOfTodayTashkent, normalizePhone, escapeHtml, STATUS_LABELS, DELIVERY_LABELS, PAYMENT_LABELS,
};
