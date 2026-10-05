const { prisma } = require('../database/connection');

const User = {
  /** Telegram foydalanuvchisini topadi yoki yaratadi, ismini yangilaydi */
  async upsertFromTelegram(tgUser) {
    const telegramId = String(tgUser.id);
    const data = {
      firstName: tgUser.first_name || null,
      lastName: tgUser.last_name || null,
      username: tgUser.username || null,
      languageCode: tgUser.language_code || null,
    };
    return prisma.user.upsert({
      where: { telegramId },
      create: { telegramId, ...data },
      update: data,
    });
  },

  findByTelegramId(telegramId) {
    return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  },

  setPhone(telegramId, phone) {
    return prisma.user.update({ where: { telegramId: String(telegramId) }, data: { phone } });
  },

  setLanguage(telegramId, language) {
    return prisma.user.update({ where: { telegramId: String(telegramId) }, data: { language } });
  },

  saveAddress(userId, { address, latitude, longitude }) {
    return prisma.user.update({
      where: { id: userId },
      data: { address: address || null, latitude: latitude ?? null, longitude: longitude ?? null },
    });
  },

  /** Profil uchun: buyurtmalar soni va jami xarid */
  async stats(userId) {
    const agg = await prisma.order.aggregate({
      where: { userId, status: { not: 'CANCELLED' } },
      _count: true,
      _sum: { total: true },
    });
    return { ordersCount: agg._count, totalSpent: agg._sum.total || 0 };
  },

  countOrders(userId) {
    return prisma.order.count({ where: { userId, status: { not: 'CANCELLED' } } });
  },

  count() {
    return prisma.user.count();
  },
};

module.exports = User;
