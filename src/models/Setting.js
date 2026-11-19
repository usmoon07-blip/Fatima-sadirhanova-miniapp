const { prisma } = require('../database/connection');
const config = require('../config/default');

/** Admin Paneldan o'zgartiriladigan sozlamalar. Bazada bo'lmasa — .env dagi qiymat ishlatiladi */
const DEFAULTS = {
  cardNumber: () => config.shop.cardNumber,
  cardHolder: () => config.shop.cardHolder,
  paymentNote: () => '',
};

const KEYS = Object.keys(DEFAULTS);

const Setting = {
  KEYS,

  async getAll() {
    const rows = await prisma.setting.findMany({ where: { key: { in: KEYS } } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return Object.fromEntries(KEYS.map((k) => [k, map[k] ?? DEFAULTS[k]() ?? '']));
  },

  async setMany(values) {
    const ops = Object.entries(values)
      .filter(([k]) => KEYS.includes(k))
      .map(([key, value]) => prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? '') },
        create: { key, value: String(value ?? '') },
      }));
    await prisma.$transaction(ops);
    return Setting.getAll();
  },

  /** Mijozga ko'rsatiladigan to'lov ma'lumotlari */
  async payment() {
    const s = await Setting.getAll();
    return { cardNumber: s.cardNumber, cardHolder: s.cardHolder, note: s.paymentNote };
  },
};

module.exports = Setting;
