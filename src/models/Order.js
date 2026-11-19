const { prisma } = require('../database/connection');

const USER_SELECT = { id: true, telegramId: true, firstName: true, lastName: true, username: true, phone: true };

const Order = {
  create(data) {
    return prisma.order.create({ data, include: { user: { select: USER_SELECT } } });
  },

  listByUser(userId) {
    return prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  },

  list({ status } = {}) {
    return prisma.order.findMany({
      where: status && status !== 'ALL' ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { user: { select: USER_SELECT } },
    });
  },

  setStatus(id, status) {
    return prisma.order.update({ where: { id }, data: { status }, include: { user: { select: USER_SELECT } } });
  },

  findById(id) {
    return prisma.order.findUnique({ where: { id }, include: { user: { select: USER_SELECT } } });
  },

  remove(id) {
    return prisma.order.delete({ where: { id } });
  },

  setReceipt(id, receiptUrl) {
    return prisma.order.update({
      where: { id }, data: { receiptUrl, receiptAt: new Date() }, include: { user: { select: USER_SELECT } },
    });
  },

  /** Foydalanuvchining chek yuborilmagan oxirgi kutilayotgan arizasi */
  latestAwaitingReceipt(userId) {
    return prisma.order.findFirst({
      where: { userId, status: 'PENDING', receiptUrl: null }, orderBy: { createdAt: 'desc' },
    });
  },

  /** Foydalanuvchi to'lagan (PAID) va to'lovi kutilayotgan (PENDING) kurs ID'lari */
  async courseIdsByUser(userId) {
    const orders = await prisma.order.findMany({
      where: { userId, status: { in: ['PAID', 'PENDING'] } },
      select: { items: true, status: true },
    });
    const paid = new Set();
    const pending = new Set();
    for (const o of orders) {
      for (const item of Array.isArray(o.items) ? o.items : []) {
        if (!item.courseId) continue;
        (o.status === 'PAID' ? paid : pending).add(item.courseId);
      }
    }
    for (const id of paid) pending.delete(id);
    return { paid: [...paid], pending: [...pending] };
  },

  async stats() {
    const [pending, receipts, paid, revenue, today] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PENDING', receiptUrl: { not: null } } }),
      prisma.order.count({ where: { status: 'PAID' } }),
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
      prisma.order.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    ]);
    return { pending, receipts, paid, revenue: revenue._sum.total || 0, today };
  },
};

module.exports = Order;
