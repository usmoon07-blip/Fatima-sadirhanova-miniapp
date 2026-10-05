const { z } = require('zod');
const config = require('../config/default');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Story = require('../models/Story');
const Order = require('../models/Order');
const User = require('../models/User');
const botController = require('./botController');
const { signAdminToken, safeEqual } = require('../middlewares/auth.middleware');

const imageUrl = z.string().trim().min(1, 'Rasm kerak').max(1000);
const money = z.coerce.number().int().min(0).max(1_000_000_000);
const optText = (max) => z.string().trim().max(max).nullish().transform((v) => v || null);
const lines = z.array(z.string().max(200)).max(40).default([]);

const STATUSES = ['NEW', 'CONFIRMED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];

const schemas = {
  login: z.object({ password: z.string().min(1, 'Parolni kiriting').max(200) }),

  status: z.object({ status: z.enum(STATUSES) }),

  product: z.object({
    name: z.string().trim().min(1, 'Nomini kiriting').max(120),
    nameRu: optText(120),
    nameEn: optText(120),
    description: z.string().trim().max(2000).default(''),
    descriptionRu: optText(2000),
    descriptionEn: optText(2000),
    imageUrl,
    price: money.refine((v) => v > 0, 'Narxni kiriting'),
    oldPrice: money.nullish().transform((v) => (v ? v : null)),
    categoryId: z.coerce.number().int().positive().nullish(),
    ingredients: lines,
    ingredientsRu: lines,
    ingredientsEn: lines,
    sizes: z.array(z.object({ label: z.string().max(60), price: money })).max(20).default([]),
    rating: z.coerce.number().min(0).max(5).default(5),
    reviewsCount: z.coerce.number().int().min(0).default(0),
    badge: optText(30),
    isPopular: z.boolean().default(false),
    isAvailable: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  }),

  category: z.object({
    name: z.string().trim().min(1, 'Nomini kiriting').max(60),
    nameRu: optText(60),
    nameEn: optText(60),
    imageUrl: optText(1000),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  }),

  story: z.object({
    title: z.string().trim().min(1, 'Sarlavha kiriting').max(40),
    titleRu: optText(40),
    titleEn: optText(40),
    imageUrl,
    text: optText(500),
    textRu: optText(500),
    textEn: optText(500),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  }),

};

const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error("Noto'g'ri ID");
    err.status = 400;
    throw err;
  }
  return id;
};

function crud(model) {
  return {
    list: async (req, res) => res.json({ items: await model.listAll() }),
    create: async (req, res) => res.status(201).json({ item: await model.create(req.body) }),
    update: async (req, res) => res.json({ item: await model.update(idParam(req), req.body) }),
    remove: async (req, res) => {
      await model.remove(idParam(req));
      res.json({ ok: true });
    },
  };
}

const adminController = {
  schemas,

  login(req, res) {
    const { password } = req.body;
    let role = null;
    if (safeEqual(password, config.admin.password)) role = 'admin';
    else if (config.admin.kitchenPassword && safeEqual(password, config.admin.kitchenPassword)) role = 'kitchen';

    if (!role) {
      const left = req.loginFailed();
      return res.status(401).json({
        message: left > 0 ? `Parol noto'g'ri. Yana ${left} ta urinish qoldi.` : `Parol noto'g'ri. Kirish ${config.admin.lockMinutes} daqiqaga bloklandi.`,
      });
    }
    req.loginSucceeded();
    return res.json({ token: signAdminToken(role), role });
  },

  me(req, res) {
    res.json({ role: req.admin.role, shopName: config.shop.name });
  },

  async stats(req, res) {
    const [orders, customers] = await Promise.all([Order.stats(), User.count()]);
    res.json({ ...orders, customers });
  },

  async report(req, res) {
    const period = ['today', '7', '30', '90', 'all'].includes(req.query.period) ? req.query.period : '30';
    res.json(await Order.report(period));
  },

  async kitchen(req, res) {
    res.json({ orders: await Order.listActive(), now: new Date().toISOString() });
  },

  async listOrders(req, res) {
    const orders = await Order.list({ status: req.query.status, search: req.query.search });
    res.json({ orders });
  },

  async getOrder(req, res) {
    const order = await Order.findById(idParam(req));
    if (!order) return res.status(404).json({ message: 'Buyurtma topilmadi' });
    return res.json({ order });
  },

  async updateOrderStatus(req, res) {
    const id = idParam(req);
    const current = await Order.findById(id);
    if (!current) return res.status(404).json({ message: 'Buyurtma topilmadi' });
    if (current.status === req.body.status) return res.json({ order: current });

    const extra = req.body.status === 'CANCELLED' ? { cancelledBy: 'restaurant' } : {};
    const order = await Order.updateStatus(id, req.body.status, extra);
    botController.notifyStatusChanged(order).catch((err) => console.error('Mijozga xabar yuborilmadi:', err.message));
    if (order.status === 'ON_THE_WAY') {
      botController.dispatchToCourier(order).catch((err) => console.error('Kuryerga yuborilmadi:', err.message));
    }
    return res.json({ order });
  },

  async deleteOrder(req, res) {
    await Order.remove(idParam(req));
    res.json({ ok: true });
  },

  products: crud(Product),
  categories: crud(Category),
  stories: crud(Story),

  upload(req, res) {
    if (!req.file) return res.status(400).json({ message: 'Fayl yuklanmadi' });
    return res.status(201).json({ url: `/uploads/${req.file.filename}` });
  },
};

module.exports = adminController;
