const { prisma } = require('../database/connection');
const { startOfTodayTashkent } = require('../utils/format');

const USER_SELECT = { select: { telegramId: true, firstName: true, lastName: true, username: true, language: true } };
const ACTIVE = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'];
const TZ_OFFSET_MS = 5 * 60 * 60 * 1000; // Toshkent UTC+5

const tashkentDateKey = (d) => new Date(new Date(d).getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);
const tashkentHour = (d) => new Date(new Date(d).getTime() + TZ_OFFSET_MS).getUTCHours();

const Order = {
  ACTIVE,

  create(data) {
    return prisma.order.create({ data, include: { user: USER_SELECT } });
  },

  findById(id) {
    return prisma.order.findUnique({ where: { id }, include: { user: USER_SELECT } });
  },

  listByUser(userId, take = 30) {
    return prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take });
  },

  list({ status, search, take = 300 } = {}) {
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      const q = search.trim();
      const or = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
      if (/^\d+$/.test(q) && q.length < 10) or.push({ id: Number(q) });
      where.OR = or;
    }
    return prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take, include: { user: USER_SELECT } });
  },

  /** Oshxona ekrani: faol buyurtmalar + oxirgi 3 soatda yakunlanganlar emas */
  listActive() {
    return prisma.order.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: { createdAt: 'asc' },
      include: { user: USER_SELECT },
    });
  },

  updateStatus(id, status, extra = {}) {
    return prisma.order.update({
      where: { id },
      data: { status, statusAt: new Date(), ...extra },
      include: { user: USER_SELECT },
    });
  },

  remove(id) {
    return prisma.order.delete({ where: { id } });
  },

  async stats() {
    const today = startOfTodayTashkent();
    const [todayAgg, totalAgg, newCount, activeCount, todayCancelled] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
        _count: true,
        _sum: { total: true },
      }),
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _count: true, _sum: { total: true } }),
      prisma.order.count({ where: { status: 'NEW' } }),
      prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'] } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: 'CANCELLED' },
        _count: true,
        _sum: { total: true },
      }),
    ]);
    return {
      todayOrders: todayAgg._count,
      todayRevenue: todayAgg._sum.total || 0,
      totalOrders: totalAgg._count,
      totalRevenue: totalAgg._sum.total || 0,
      newOrders: newCount,
      activeOrders: activeCount,
      todayCancelled: todayCancelled._count,
      todayCancelledSum: todayCancelled._sum.total || 0,
    };
  },

  /**
   * Biznes egasi uchun hisobot.
   * period: 'today' | '7' | '30' | '90' | 'all'
   */
  async report(period = '30') {
    let from = null;
    if (period === 'today') from = startOfTodayTashkent();
    else if (['7', '30', '90'].includes(String(period))) {
      from = new Date(startOfTodayTashkent().getTime() - (Number(period) - 1) * 24 * 60 * 60 * 1000);
    }
    const where = from ? { createdAt: { gte: from } } : {};

    const [orders, newCustomers, totalCustomers, enrollments] = await Promise.all([
      prisma.order.findMany({ where, orderBy: { createdAt: 'asc' } }),
      prisma.user.count({ where: from ? { createdAt: { gte: from } } : {} }),
      prisma.user.count(),
      prisma.enrollment.findMany({ where, select: { status: true, price: true } }),
    ]);

    // Bekor qilinganlar tushumga va boshqa hisob-kitoblarga KIRMAYDI — alohida hisoblanadi
    const valid = orders.filter((o) => o.status !== 'CANCELLED');
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED');
    const cancelled = cancelledOrders.length;
    const sumOf = (list) => list.reduce((s, o) => s + o.total, 0);
    const byCustomer = cancelledOrders.filter((o) => o.cancelledBy === 'customer');
    const byRestaurant = cancelledOrders.filter((o) => o.cancelledBy !== 'customer');
    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const delivered = valid.filter((o) => o.status === 'DELIVERED');
    const collected = delivered.reduce((s, o) => s + o.total, 0);

    const split = (key, values) => values.map((v) => {
      const list = valid.filter((o) => o[key] === v);
      return { key: v, count: list.length, sum: list.reduce((s, o) => s + o.total, 0) };
    });

    // Kunlik tushum
    const daily = new Map();
    if (from) {
      for (let t = from.getTime(); t <= Date.now(); t += 24 * 60 * 60 * 1000) daily.set(tashkentDateKey(t), 0);
    }
    for (const o of valid) {
      const k = tashkentDateKey(o.createdAt);
      daily.set(k, (daily.get(k) || 0) + o.total);
    }

    // Kun davomidagi yuklama (soatlar bo'yicha)
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const o of valid) hourly[tashkentHour(o.createdAt)].count += 1;

    // Eng ko'p sotilganlar
    const products = new Map();
    for (const o of valid) {
      for (const i of o.items || []) {
        const p = products.get(i.productId) || { productId: i.productId, name: i.name, quantity: 0, revenue: 0 };
        p.quantity += i.quantity;
        p.revenue += i.total;
        products.set(i.productId, p);
      }
    }

    // Eng qadrli mijozlar va qayta kelganlar
    const customers = new Map();
    for (const o of valid) {
      const c = customers.get(o.userId) || { userId: o.userId, name: o.customerName, phone: o.phone, orders: 0, total: 0 };
      c.orders += 1;
      c.total += o.total;
      c.name = o.customerName;
      c.phone = o.phone;
      customers.set(o.userId, c);
    }
    const returning = [...customers.values()].filter((c) => c.orders >= 2).length;

    return {
      period,
      revenue,
      ordersCount: valid.length,
      collected,
      deliveredCount: delivered.length,
      averageCheck: valid.length ? Math.round(revenue / valid.length) : 0,
      cancelled,
      cancelledShare: orders.length ? Math.round((cancelled / orders.length) * 100) : 0,
      cancelledSum: sumOf(cancelledOrders),
      cancelledByCustomer: { count: byCustomer.length, sum: sumOf(byCustomer) },
      cancelledByRestaurant: { count: byRestaurant.length, sum: sumOf(byRestaurant) },
      cancelledList: cancelledOrders.slice(-50).reverse().map((o) => ({
        id: o.id,
        createdAt: o.createdAt,
        cancelledAt: o.statusAt,
        customerName: o.customerName,
        phone: o.phone,
        total: o.total,
        cancelledBy: o.cancelledBy === 'customer' ? 'customer' : 'restaurant',
        items: (o.items || []).map((i) => `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}`).join(', '),
      })),
      newCustomers,
      totalCustomers,
      returningCustomers: returning,
      enrollments: enrollments.filter((e) => e.status !== 'CANCELLED').length,
      enrollmentsPaid: enrollments.filter((e) => ['PAID', 'COMPLETED'].includes(e.status)).reduce((s, e) => s + e.price, 0),
      payment: split('paymentMethod', ['CASH', 'CARD']),
      deliveryType: split('deliveryType', ['DELIVERY', 'PICKUP']),
      daily: [...daily.entries()].map(([date, sum]) => ({ date, sum })),
      hourly,
      topProducts: [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10),
      topCustomers: [...customers.values()].sort((a, b) => b.total - a.total).slice(0, 10),
    };
  },
};

module.exports = Order;
