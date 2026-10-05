const { z } = require('zod');
const config = require('../config/default');
const { prisma } = require('../database/connection');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Story = require('../models/Story');
const Order = require('../models/Order');
const Course = require('../models/Course');
const botController = require('./botController');
const { normalizePhone, startOfTodayTashkent } = require('../utils/format');
const { pickLang } = require('../utils/i18n');

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
  deliveryAt: z.string().datetime({ offset: true }).nullish(),
  comment: z.string().trim().max(500).nullish(),
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

const cartController = {
  orderSchema,
  addressSchema,

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
      order: config.order,
    });
  },

  async getCatalog(req, res) {
    const [categories, products, stories, courses] = await Promise.all([
      Category.listActive(),
      Product.listAvailable(),
      Story.listActive(),
      Course.listActive(),
    ]);
    const activeCategoryIds = new Set(categories.map((c) => c.id));
    res.json({
      categories,
      products: products.filter((p) => !p.categoryId || activeCategoryIds.has(p.categoryId)),
      stories,
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

  async createOrder(req, res) {
    const body = req.body;
    const phone = normalizePhone(body.phone);
    if (!phone) return res.status(400).json({ message: "Telefon raqami noto'g'ri", field: 'phone' });

    const hasCoords = body.latitude != null && body.longitude != null;
    if (body.deliveryType === 'DELIVERY' && !hasCoords && !body.address) {
      return res.status(400).json({ message: 'Yetkazib berish manzilini kiriting yoki joylashuvni yuboring', field: 'address' });
    }

    // Oldindan buyurtma: sana kamida ORDER_ADVANCE_DAYS kun keyin bo'lishi kerak
    const { advanceDays } = config.order;
    if (advanceDays > 0) {
      const earliest = startOfTodayTashkent().getTime() + advanceDays * 24 * 60 * 60 * 1000;
      if (!body.deliveryAt || new Date(body.deliveryAt).getTime() < earliest) {
        return res.status(400).json({ message: `Buyurtma kamida ${advanceDays} kun avval beriladi. Sanani tanlang.`, field: 'time', reason: 'ADVANCE' });
      }
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

    const deliveryFee = calcDeliveryFee(body.deliveryType, subtotal);
    const isDelivery = body.deliveryType === 'DELIVERY';

    const order = await prisma.$transaction(async (tx) => {
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
          deliveryFee,
          total: subtotal + deliveryFee,
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
    botController.notifyStatusChanged(updated).catch(() => {});
    return res.json({ order: updated });
  },
};

module.exports = cartController;
