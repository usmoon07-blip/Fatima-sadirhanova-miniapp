const { z } = require('zod');
const config = require('../config/default');
const { prisma } = require('../database/connection');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Story = require('../models/Story');
const Order = require('../models/Order');
const botController = require('./botController');
const { normalizePhone } = require('../utils/format');

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
});

function publicUser(user) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    phone: user.phone,
  };
}

const cartController = {
  orderSchema,

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
      },
      delivery,
    });
  },

  async getCatalog(req, res) {
    const [categories, products, stories] = await Promise.all([
      Category.listActive(),
      Product.listAvailable(),
      Story.listActive(),
    ]);
    const activeCategoryIds = new Set(categories.map((c) => c.id));
    res.json({
      categories,
      products: products.filter((p) => !p.categoryId || activeCategoryIds.has(p.categoryId)),
      stories,
    });
  },

  getMe(req, res) {
    res.json({ user: publicUser(req.user) });
  },

  async updatePhone(req, res) {
    const phone = normalizePhone(req.body?.phone);
    if (!phone) return res.status(400).json({ message: "Telefon raqami noto'g'ri" });
    const user = await User.setPhone(req.user.telegramId, phone);
    return res.json({ user: publicUser(user) });
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
        return res.status(400).json({ message: "Savatchadagi ba'zi mahsulotlar hozir mavjud emas. Savatchani yangilang." });
      }
      const { price, size } = Product.unitPrice(product, item.size);
      const key = `${product.id}:${size || ''}`;
      const prev = merged.get(key);
      const quantity = (prev?.quantity || 0) + item.quantity;
      merged.set(key, {
        productId: product.id,
        name: product.name,
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
      return res.status(400).json({ message: `Minimal buyurtma summasi: ${config.delivery.minOrder.toLocaleString('ru-RU')} so'm` });
    }

    let deliveryFee = 0;
    if (body.deliveryType === 'DELIVERY') {
      const free = config.delivery.freeFrom && subtotal >= config.delivery.freeFrom;
      deliveryFee = free ? 0 : config.delivery.fee;
    }

    const order = await prisma.$transaction(async (tx) => {
      if (req.user.phone !== phone) {
        await tx.user.update({ where: { id: req.user.id }, data: { phone } });
      }
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
          address: body.deliveryType === 'DELIVERY' ? body.address || null : null,
          latitude: body.deliveryType === 'DELIVERY' && hasCoords ? body.latitude : null,
          longitude: body.deliveryType === 'DELIVERY' && hasCoords ? body.longitude : null,
          deliveryTime: body.deliveryTime || null,
          comment: body.comment || null,
        },
        include: { user: { select: { telegramId: true, firstName: true, lastName: true, username: true } } },
      });
    });

    botController.notifyOrderCreated(order).catch((err) => console.error('Bot xabari yuborilmadi:', err.message));

    return res.status(201).json({ order });
  },

  async myOrders(req, res) {
    const orders = await Order.listByUser(req.user.id);
    res.json({ orders });
  },
};

module.exports = cartController;
