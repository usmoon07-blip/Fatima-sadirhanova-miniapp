/* Biznes egasi uchun statistika: tushum, konversiya, kurslar reytingi, voronka, auditoriya */
const { prisma } = require('../database/connection');

const DAY = 24 * 60 * 60 * 1000;
const TZ_OFFSET_MIN = 5 * 60; // Toshkent UTC+5

const localDate = (d) => new Date(new Date(d).getTime() + TZ_OFFSET_MIN * 60000);
const dayKey = (d) => localDate(d).toISOString().slice(0, 10);
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const change = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function summarize(orders) {
  const paid = orders.filter((o) => o.status === 'PAID');
  const pending = orders.filter((o) => o.status === 'PENDING');
  const cancelled = orders.filter((o) => o.status === 'CANCELLED');
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  return {
    orders: orders.length,
    paid: paid.length,
    pending: pending.length,
    cancelled: cancelled.length,
    revenue,
    avgCheck: paid.length ? Math.round(revenue / paid.length) : 0,
    conversion: pct(paid.length, orders.length),
    cancelRate: pct(cancelled.length, orders.length),
    pendingAmount: pending.reduce((s, o) => s + o.total, 0),
    pendingWithReceipt: pending.filter((o) => o.receiptUrl).length,
    // 24 soatdan beri chek yubormagan — to'lov qilmay qolganlar
    abandoned: pending.filter((o) => !o.receiptUrl && Date.now() - new Date(o.createdAt).getTime() > DAY).length,
  };
}

async function analytics(periodParam) {
  const days = { 7: 7, 30: 30, 90: 90 }[periodParam] || null; // null — butun davr
  const now = new Date();
  const from = days ? new Date(now.getTime() - days * DAY) : null;
  const prevFrom = days ? new Date(now.getTime() - 2 * days * DAY) : null;

  const [allOrders, users, courses, reviewAgg] = await Promise.all([
    prisma.order.findMany({
      select: { id: true, userId: true, items: true, total: true, status: true, receiptUrl: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({ select: { id: true, createdAt: true, language: true } }),
    prisma.course.findMany({ select: { id: true, title: true, price: true, isActive: true } }),
    prisma.review.groupBy({ by: ['courseId'], where: { isVisible: true }, _avg: { rating: true }, _count: { _all: true } }),
  ]);

  const inPeriod = (d) => !from || new Date(d) >= from;
  const orders = allOrders.filter((o) => inPeriod(o.createdAt));
  const prevOrders = days ? allOrders.filter((o) => new Date(o.createdAt) >= prevFrom && new Date(o.createdAt) < from) : [];

  const summary = summarize(orders);
  const prev = days ? summarize(prevOrders) : null;
  summary.revenueChange = prev ? change(summary.revenue, prev.revenue) : null;
  summary.paidChange = prev ? change(summary.paid, prev.paid) : null;
  summary.ordersChange = prev ? change(summary.orders, prev.orders) : null;

  // To'lovni tasdiqlash vaqti (soat): arizadan "To'landi" gacha
  const payHours = orders.filter((o) => o.status === 'PAID').map((o) => (new Date(o.updatedAt) - new Date(o.createdAt)) / 3600000);
  summary.medianPayHours = payHours.length ? Math.round(median(payHours) * 10) / 10 : null;

  // Kunlik tushum (oxirgi N kun; butun davr uchun — oxirgi 90 kun)
  const chartDays = days || 90;
  const daily = [];
  const byDay = new Map();
  for (const o of allOrders) {
    const k = dayKey(o.createdAt);
    const e = byDay.get(k) || { revenue: 0, orders: 0, paid: 0 };
    e.orders += 1;
    if (o.status === 'PAID') { e.revenue += o.total; e.paid += 1; }
    byDay.set(k, e);
  }
  for (let i = chartDays - 1; i >= 0; i -= 1) {
    const k = dayKey(new Date(now.getTime() - i * DAY));
    daily.push({ date: k, ...(byDay.get(k) || { revenue: 0, orders: 0, paid: 0 }) });
  }

  // Kurslar bo'yicha
  const ratingMap = new Map(reviewAgg.map((r) => [r.courseId, r]));
  const courseStats = new Map(courses.map((c) => [c.id, {
    id: c.id, title: c.title, price: c.price, isActive: c.isActive,
    orders: 0, paid: 0, pending: 0, cancelled: 0, revenue: 0, buyers: new Set(),
  }]));
  for (const o of orders) {
    const items = Array.isArray(o.items) ? o.items : [];
    for (const it of items) {
      if (!it.courseId) continue;
      let cs = courseStats.get(it.courseId);
      if (!cs) {
        cs = { id: it.courseId, title: `${it.title} (o'chirilgan)`, price: it.price, isActive: false, orders: 0, paid: 0, pending: 0, cancelled: 0, revenue: 0, buyers: new Set() };
        courseStats.set(it.courseId, cs);
      }
      cs.orders += 1;
      if (o.status === 'PAID') { cs.paid += 1; cs.revenue += it.price; cs.buyers.add(o.userId); }
      if (o.status === 'PENDING') cs.pending += 1;
      if (o.status === 'CANCELLED') cs.cancelled += 1;
    }
  }
  const courseList = [...courseStats.values()].map((c) => {
    const r = ratingMap.get(c.id);
    return {
      id: c.id, title: c.title, price: c.price, isActive: c.isActive,
      orders: c.orders, paid: c.paid, pending: c.pending, cancelled: c.cancelled, revenue: c.revenue,
      conversion: pct(c.paid, c.orders), cancelRate: pct(c.cancelled, c.orders),
      revenueShare: pct(c.revenue, summary.revenue),
      rating: r ? Math.round(r._avg.rating * 10) / 10 : null, reviews: r ? r._count._all : 0,
    };
  }).sort((a, b) => b.paid - a.paid || b.orders - a.orders || b.revenue - a.revenue);

  // Auditoriya
  const paidAll = allOrders.filter((o) => o.status === 'PAID');
  const paidPerUser = new Map();
  for (const o of paidAll) paidPerUser.set(o.userId, (paidPerUser.get(o.userId) || 0) + 1);
  const newUsers = users.filter((u) => inPeriod(u.createdAt)).length;
  const audience = {
    total: users.length,
    newUsers,
    buyers: paidPerUser.size,
    repeatBuyers: [...paidPerUser.values()].filter((n) => n >= 2).length,
    buyerRate: pct(paidPerUser.size, users.length),
    ltv: paidPerUser.size ? Math.round(paidAll.reduce((s, o) => s + o.total, 0) / paidPerUser.size) : 0,
    languages: ['uz', 'ru', 'en'].map((l) => ({ lang: l, count: users.filter((u) => (u.language || 'uz') === l).length })),
  };

  // Voronka (davr ichida): yangi foydalanuvchi → ariza → chek → to'lov
  const uniq = (arr) => new Set(arr).size;
  const funnel = [
    { key: 'visitors', label: 'Botga kirgan (yangi)', value: newUsers },
    { key: 'ordered', label: 'Kursga yozilgan', value: uniq(orders.map((o) => o.userId)) },
    { key: 'receipt', label: 'Chek yuborgan', value: uniq(orders.filter((o) => o.receiptUrl || o.status === 'PAID').map((o) => o.userId)) },
    { key: 'paid', label: "To'lagan", value: uniq(orders.filter((o) => o.status === 'PAID').map((o) => o.userId)) },
  ];

  // Faol soatlar (Toshkent vaqti) va hafta kunlari
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
  const weekdays = Array.from({ length: 7 }, (_, d) => ({ day: d, orders: 0 }));
  for (const o of orders) {
    const d = localDate(o.createdAt);
    hours[d.getUTCHours()].orders += 1;
    weekdays[(d.getUTCDay() + 6) % 7].orders += 1; // 0 = Dushanba
  }

  return {
    period: days ? String(days) : 'all',
    summary,
    daily,
    courses: courseList,
    audience,
    funnel,
    hours,
    weekdays,
  };
}

module.exports = { analytics };
