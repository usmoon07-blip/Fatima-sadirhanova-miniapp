const { prisma } = require('../database/connection');
const { startOfTodayTashkent } = require('../utils/format');

const USER_SELECT = { select: { telegramId: true, firstName: true, lastName: true, username: true } };

const Order = {
  create(data) {
    return prisma.order.create({ data, include: { user: USER_SELECT } });
  },

  findById(id) {
    return prisma.order.findUnique({ where: { id }, include: { user: USER_SELECT } });
  },

  listByUser(userId, take = 30) {
    return prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take });
  },

  list({ status, search, take = 200 } = {}) {
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      const q = search.trim();
      const or = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
      if (/^\d+$/.test(q)) or.push({ id: Number(q) });
      where.OR = or;
    }
    return prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, take, include: { user: USER_SELECT } });
  },

  updateStatus(id, status) {
    return prisma.order.update({ where: { id }, data: { status }, include: { user: USER_SELECT } });
  },

  async stats() {
    const today = startOfTodayTashkent();
    const [todayAgg, totalAgg, newCount, activeCount] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
        _count: true,
        _sum: { total: true },
      }),
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _count: true, _sum: { total: true } }),
      prisma.order.count({ where: { status: 'NEW' } }),
      prisma.order.count({ where: { status: { in: ['CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY'] } } }),
    ]);
    return {
      todayOrders: todayAgg._count,
      todayRevenue: todayAgg._sum.total || 0,
      totalOrders: totalAgg._count,
      totalRevenue: totalAgg._sum.total || 0,
      newOrders: newCount,
      activeOrders: activeCount,
    };
  },
};

module.exports = Order;
