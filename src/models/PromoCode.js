const { prisma } = require('../database/connection');

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

const PromoCode = {
  normalizeCode,

  listAll() {
    return prisma.promoCode.findMany({ orderBy: [{ isActive: 'desc' }, { id: 'asc' }] });
  },

  /** Mini App'dagi "Aksiyalar" bo'limi uchun faol va muddati o'tmagan promokodlar */
  listPublic() {
    return prisma.promoCode.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { id: 'asc' },
      select: {
        id: true, code: true, description: true, descriptionRu: true, descriptionEn: true,
        type: true, value: true, maxDiscount: true, minOrder: true, expiresAt: true, firstOrderOnly: true,
        usageLimit: true, usedCount: true,
      },
    }).then((list) => list.filter((p) => p.usageLimit == null || p.usedCount < p.usageLimit));
  },

  findByCode(code) {
    return prisma.promoCode.findUnique({ where: { code: normalizeCode(code) } });
  },

  create(data) {
    return prisma.promoCode.create({ data: { ...data, code: normalizeCode(data.code) } });
  },

  update(id, data) {
    return prisma.promoCode.update({ where: { id }, data: { ...data, code: normalizeCode(data.code) } });
  },

  remove(id) {
    return prisma.promoCode.delete({ where: { id } });
  },

  /**
   * Promokodni tekshiradi va chegirmani hisoblaydi.
   * Natija: { ok: true, discount, promo } yoki { ok: false, reason, minOrder }
   */
  evaluate(promo, subtotal, { previousOrders = 0 } = {}) {
    if (!promo || !promo.isActive) return { ok: false, reason: 'NOT_FOUND' };
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { ok: false, reason: 'EXPIRED' };
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) return { ok: false, reason: 'LIMIT' };
    if (promo.firstOrderOnly && previousOrders > 0) return { ok: false, reason: 'FIRST_ORDER' };
    if (subtotal < promo.minOrder) return { ok: false, reason: 'MIN_ORDER', minOrder: promo.minOrder };

    let discount = promo.type === 'PERCENT' ? Math.round((subtotal * promo.value) / 100) : promo.value;
    if (promo.type === 'PERCENT' && promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    discount = Math.max(0, Math.min(discount, subtotal));
    return { ok: true, discount, promo };
  },
};

module.exports = PromoCode;
