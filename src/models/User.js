const { prisma } = require('../database/connection');

const User = {
  /** Telegram foydalanuvchisini bazaga yozadi yoki yangilaydi */
  upsertFromTelegram(tg) {
    const data = {
      firstName: tg.first_name || null,
      lastName: tg.last_name || null,
      username: tg.username || null,
    };
    return prisma.user.upsert({
      where: { telegramId: String(tg.id) },
      update: data,
      create: { telegramId: String(tg.id), ...data },
    });
  },

  findByTelegramId(telegramId) {
    return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  },

  setPhone(id, phone) {
    return prisma.user.update({ where: { id }, data: { phone } });
  },

  count() {
    return prisma.user.count();
  },
};

module.exports = User;
