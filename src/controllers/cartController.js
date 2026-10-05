const { z } = require('zod');
const config = require('../config/default');
const { prisma } = require('../database/connection');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Story = require('../models/Story');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const Course = require('../models/Course');
const botController = require('./botController');
const { normalizePhone } = require('../utils/format');
const { pickLang } = require('../utils/i18n');

const PROMO_MESSAGES = {
  NOT_FOUND: 'Promokod topilmadi',
  EXPIRED: 'Promokod muddati tugagan',
  LIMIT: 'Promokoddan foydalanish limiti tugagan',
  FIRST_ORDER: 'Bu promokod faqat birinchi buyurtma uchun',
  MIN_ORDER: 'Buyurtma summasi promokod uchun yetarli emas',
};

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    Object.assign(this, extra);
  }
}

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    size: z.string().max(60).nullish(),
    quantity: z.number().int().min(1).max(50),
  })).min(1, "Savatcha bo'sh").max(50),
  deliveryType: z.enum(['DELIVERY', 'PICKUP']),
  paymentMethod: z.enum(['CASH', 'CARD']),
  customerName: z.string().trim().min(2, 'Ismingizni kiriting').max(80),
  phone: z.string().trim().min(7, 'Telefon raqamini kiriting').max(30),
  address: z.string().trim().max(300).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  deliveryTime: z.string().trim().max(60).nullish(),
  comment: z.string().trim().max(500).nullish(),
  promoCode: z.string().trim().max(40).nullish(),
});

const promoSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().int().min(0),
});

const addressSchema = z.object({
  address: z.string().trim().max(300).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
});

function publicUser(user) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
    language: user.language,
    address: user.address,
    latitude: user.latitude,
    longitude: user.longitude,
  };
}

function calcDeliveryFee(deliveryType, amount) {
  if (deliveryType !== 'DELIVERY') return 0;
  const free = config.delivery.freeFrom && amount >= config.delivery.freeFrom;
  return free ? 0 : config.delivery.fee;
}

async function releasePromo(order) {
  if (!order.promoCode) return;
  await prisma.promoCode.updateMany({
    where: { code: order.promoCode, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

const cartController = {
  orderSchema,
  promoSchema,
  addressSchema,
  releasePromo,

  getConfig(req, res) {
    const { shop, delivery } = config;
    res.json({
      shop: {
        name: shop.name,
        tagline: shop.tagline,
        phone: shop.phone,
        address: shop.address,
        lat: shop.lat,
        lng: shop.lng,
        workingHours: shop.workingHours,
        cardNumber: shop.cardNumber,
        cardHolder: shop.cardHolder,
        about: shop.about,
      },
      delivery,
    });
  },

  async getCatalog(req, res) {
    const [categories, products, stories, promos, courses] = await Promise.all([
      Category.listActive(),
      Product.listAvailable(),
      Story.listActive(),
      PromoCode.listPublic(),
      Course.listActive(),
    ]);
    const activeCategoryIds = new Set(categories.map((c) => c.id));
    res.json({
      categories,
      products: products.filter((p) => !p.categoryId || activeCategoryIds.has(p.categoryId)),
      stories,
      promos,
      courses,
    });
  },

  async getMe(req, res) {
    const stats = await User.stats(req.user.id);
    res.json({ user: publicUser(req.user), stats });
  },

  async updatePhone(req, res) {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ message: "Telefon raqami noto'g'ri" });
    const user = await User.setPhone(req.user.telegramId, phone);
    return res.json({ user: publicUser(user) });
  },

  async updateLanguage(req, res) {
    const lang = pickLang(req.body?.language);
    const user = await User.setLanguage(req.user.telegramId, lang);
    botController.setUserMenuButton(user.telegramId, lang).catch(() => {});
    res.json({ user: publicUser(user) });
  },

  async saveAddress(req, res) {
    const user = await User.saveAddress(req.user.id, req.body);
    res.json({ user: publicUser(user) });
  },

  async checkPromo(req, res) {
    const promo = await PromoCode.findByCode(req.body.code);
    const previousOrders = await User.countOrders(req.user.id);
    const result = PromoCode.evaluate(promo, req.body.subtotal, { previousOrders });
    if (!result.ok) {
      return res.status(400).json({ message: PROMO_MESSAGES[result.reason], reason: result.reason, minOrder: result.minOrder });
    }
    return res.json({
      code: result.promo.code,
      discount: result.discount,
      type: result.promo.type,
      value: result.promo.value,
    });
  },

  async createOrder(req, res) {
    const body = req.body;
    const phone = normalizePhone(body.phone);
    if (!phone) return res.status(400).json({ message: "Telefon raqami noto'g'ri", field: 'phone' });

    const hasCoords = body.latitude != null && body.longitude != null;
    if (body.deliveryType === 'DELIVERY' && !hasCoords && !body.address) {
      return res.status(400).json({ message: 'Yetkazib berish manzilini kiriting yoki joylashuvni yuboring', field: 'address' });
    }

    // Narxlar faqat bazadan olinadi — mijoz yuborgan narxga ishonilmaydi
    const ids = [...new Set(body.items.map((i) => i.productId))];
    const products = await Product.findManyByIds(ids);
    const byId = new Map(products.map((p) => [p.id, p]));

    const merged = new Map();
    for (const item of body.items) {
      const product = byId.get(item.productId);
      if (!product || !product.isAvailable) {
        return res.status(400).json({ message: "Savatchadagi ba'zi mahsulotlar hozir mavjud emas. Savatchani yangilang.", reason: 'UNAVAILABLE' });
      }
      const { price, size } = Product.unitPrice(product, item.size);
      const key = `${product.id}:${size || ''}`;
      const quantity = (merged.get(key)?.quantity || 0) + item.quantity;
      merged.set(key, {
        productId: product.id,
        name: product.name,
        nameRu: product.nameRu || null,
        nameEn: product.nameEn || null,
        imageUrl: product.imageUrl,
        size,
        price,
        quantity,
        total: price * quantity,
      });
    }

    const items = [...merged.values()];
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);

    if (config.delivery.minOrder && subtotal < config.delivery.minOrder) {
      return res.status(400).json({ message: `Minimal buyurtma summasi: ${config.delivery.minOrder.toLocaleString('ru-RU')} so'm`, reason: 'MIN_ORDER_TOTAL' });
    }

    // Promokod — chegirma serverda qayta hisoblanadi
    let discount = 0;
    let promo = null;
    if (body.promoCode) {
      promo = await PromoCode.findByCode(body.promoCode);
      const previousOrders = await User.countOrders(req.user.id);
      const result = PromoCode.evaluate(promo, subtotal, { previousOrders });
      if (!result.ok) {
        return res.status(400).json({ message: PROMO_MESSAGES[result.reason], reason: result.reason, field: 'promo', minOrder: result.minOrder });
      }
      discount = result.discount;
    }

    const afterDiscount = subtotal - discount;
    const deliveryFee = calcDeliveryFee(body.deliveryType, afterDiscount);
    const isDelivery = body.deliveryType === 'DELIVERY';

    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        if (promo) {
          const used = await tx.promoCode.updateMany({
            where: { id: promo.id, ...(promo.usageLimit != null ? { usedCount: { lt: promo.usageLimit } } : {}) },
            data: { usedCount: { increment: 1 } },
          });
          if (used.count === 0) throw new HttpError(400, PROMO_MESSAGES.LIMIT, { reason: 'LIMIT', field: 'promo' });
        }
        const userData = {};
        if (req.user.phone !== phone) userData.phone = phone;
        if (isDelivery) {
          userData.address = body.address || null;
          userData.latitude = hasCoords ? body.latitude : null;
          userData.longitude = hasCoords ? body.longitude : null;
        }
        if (Object.keys(userData).length) await tx.user.update({ where: { id: req.user.id }, data: userData });

        return tx.order.create({
          data: {
            userId: req.user.id,
            items,
            subtotal,
            discount,
            promoCode: promo ? promo.code : null,
            deliveryFee,
            total: afterDiscount + deliveryFee,
            deliveryType: body.deliveryType,
            paymentMethod: body.paymentMethod,
            customerName: body.customerName,
            phone,
            address: isDelivery ? body.address || null : null,
            latitude: isDelivery && hasCoords ? body.latitude : null,
            longitude: isDelivery && hasCoords ? body.longitude : null,
            deliveryTime: body.deliveryTime || null,
            comment: body.comment || null,
          },
          include: { user: { select: { telegramId: true, firstName: true, lastName: true, username: true, language: true } } },
        });
      });
    } catch (err) {
      if (err instanceof HttpError) return res.status(err.status).json({ message: err.message, reason: err.reason, field: err.field });
      throw err;
    }

    botController.notifyOrderCreated(order).catch((err) => console.error('Bot xabari yuborilmadi:', err.message));

    return res.status(201).json({ order });
  },

  async myOrders(req, res) {
    const orders = await Order.listByUser(req.user.id);
    res.json({ orders });
  },

  /** Mijoz buyurtmani faqat oshxona qabul qilmaguncha (NEW) bekor qila oladi */
  async cancelOrder(req, res) {
    const id = Number(req.params.id);
    const order = Number.isInteger(id) ? await Order.findById(id) : null;
    if (!order || order.userId !== req.user.id) return res.status(404).json({ message: 'Buyurtma topilmadi' });
    if (order.status !== 'NEW') {
      return res.status(400).json({ message: "Buyurtma tayyorlanmoqda — endi bekor qilib bo'lmaydi", reason: 'TOO_LATE' });
    }
    const updated = await Order.updateStatus(id, 'CANCELLED', { cancelledBy: 'customer' });
    await releasePromo(updated);
    botController.notifyStatusChanged(updated).catch(() => {});
    return res.json({ order: updated });
  },
};

module.exports = cartController;
