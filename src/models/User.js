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

  count() {
    return prisma.user.count();
  },
};

module.exports = User;
