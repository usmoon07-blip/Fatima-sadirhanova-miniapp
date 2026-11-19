const { prisma } = require('../database/connection');
const { normalizeLang, LANGS } = require('../utils/i18n');

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
      create: { telegramId: String(tg.id), ...data, language: normalizeLang(tg.language_code) },
    });
  },

  findByTelegramId(telegramId) {
    return prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  },

  setPhone(id, phone) {
    return prisma.user.update({ where: { id }, data: { phone } });
  },

  setLanguage(id, language) {
    return prisma.user.update({ where: { id }, data: { language: LANGS.includes(language) ? language : 'uz' } });
  },

  findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  count() {
    return prisma.user.count();
  },
};

module.exports = User;
