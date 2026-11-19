const multer = require('multer');
const { z } = require('zod');
const config = require('../config/default');
const Course = require('../models/Course');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Result = require('../models/Result');
const Story = require('../models/Story');
const User = require('../models/User');
const Upload = require('../models/Upload');
const Setting = require('../models/Setting');
const { signAdminToken, safeEqual } = require('../middlewares/auth.middleware');
const { changeOrderStatus, onOrderPaid } = require('./botController');
const payments = require('../services/payments');
const { prisma } = require('../database/connection');
const Channel = require('../models/Channel');
const { analytics } = require('../services/analytics');

const optText = (max) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
const optInt = z.union([z.number().int().min(0), z.null()]).optional().transform((v) => (v ? v : null));

const schemas = {
  login: z.object({ password: z.string().min(1, 'Parolni kiriting') }),
  status: z.object({ status: z.enum(['PENDING', 'PAID', 'CANCELLED']) }),
  visible: z.object({ isVisible: z.boolean() }),
  settings: z.object({
    cardNumber: z.string().trim().max(40).optional(),
    cardHolder: z.string().trim().max(80).optional(),
    paymentNote: z.string().trim().max(500).optional(),
  }),
  course: z.object({
    title: z.string().trim().min(2, 'Kurs nomini kiriting').max(120),
    titleRu: optText(120),
    titleEn: optText(120),
    description: z.string().trim().max(3000).optional().default(''),
    descriptionRu: optText(3000),
    descriptionEn: optText(3000),
    categoryRu: optText(60),
    categoryEn: optText(60),
    programRu: z.array(z.string().trim().min(1).max(200)).max(60).optional().default([]),
    programEn: z.array(z.string().trim().min(1).max(200)).max(60).optional().default([]),
    durationRu: optText(60),
    durationEn: optText(60),
    levelRu: optText(60),
    levelEn: optText(60),
    channelId: optText(40),
    mxik: optText(20),
    packageCode: optText(20),
    vat: z.union([z.number().int().min(0).max(100), z.null()]).optional(),
    imageUrl: z.string().trim().max(1000).optional().default(''),
    oldPrice: optInt,
    price: z.number().int().min(0, "Narx noto'g'ri"),
    category: z.string().trim().min(1, 'Kategoriyani kiriting').max(60),
    program: z.array(z.string().trim().min(1).max(200)).max(60).optional().default([]),
    lessonsCount: z.number().int().min(0).optional().default(0),
    duration: optText(60),
    level: optText(60),
    badge: optText(30),
    accessLink: optText(500),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
  }),
  result: z.object({
    studentName: z.string().trim().min(1, "O'quvchi ismini kiriting").max(80),
    courseTitle: optText(120),
    imageUrl: z.string().trim().min(1, "Rasm qo'shing").max(1000),
    text: optText(1000),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
  }),
  story: z.object({
    title: z.string().trim().min(1, 'Sarlavhani kiriting').max(40),
    titleRu: optText(40),
    titleEn: optText(40),
    textRu: optText(500),
    textEn: optText(500),
    imageUrl: z.string().trim().min(1, "Rasm qo'shing").max(1000),
    text: optText(500),
    isActive: z.boolean().optional().default(true),
    sortOrder: z.number().int().optional().default(0),
  }),
};

/** Oddiy CRUD handlerlari */
const crud = (Model) => ({
  list: async (req, res) => res.json(await Model.listAll()),
  create: async (req, res) => res.status(201).json(await Model.create(req.body)),
  update: async (req, res) => res.json(await Model.update(req.id, req.body)),
  remove: async (req, res) => {
    await Model.remove(req.id);
    res.json({ ok: true });
  },
});

// Rasm yuklash — fayl bazaga yoziladi (bepul serverlarda disk qayta ishga tushganda o'chadi)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    const err = new Error('Faqat rasm (JPG, PNG, WEBP, GIF) yuklash mumkin');
    err.status = 400;
    return cb(err);
  },
});

const adminController = {
  schemas,
  uploadMiddleware: upload.single('file'),

  login(req, res) {
    if (!safeEqual(req.body.password, config.admin.password)) {
      req.loginFailed();
      return res.status(401).json({ message: "Parol noto'g'ri" });
    }
    req.loginSucceeded();
    return res.json({ token: signAdminToken() });
  },

  async stats(req, res) {
    const [orders, students, reviews] = await Promise.all([Order.stats(), User.count(), Review.count()]);
    res.json({ ...orders, students, reviews });
  },

  async orders(req, res) {
    res.json(await Order.list({ status: req.query.status }));
  },

  async setOrderStatus(req, res) {
    let order;
    try {
      order = await changeOrderStatus(req.id, req.body.status);
    } catch (e) {
      return res.status(e.status || 500).json({ message: e.message });
    }
    if (!order) return res.status(404).json({ message: 'Ariza topilmadi' });
    return res.json(await Order.findById(req.id));
  },

  async analytics(req, res) {
    res.json(await analytics(String(req.query.period || '30')));
  },

  /** Multicard: to'lovni server orqali qayta tekshirish */
  async syncPayment(req, res) {
    const p = await payments.latestPayment(req.id);
    if (!p) return res.status(404).json({ message: "To'lov topilmadi" });
    try {
      await payments.syncPayment(p.id, { onPaid: onOrderPaid });
    } catch (e) {
      return res.status(502).json({ message: e.message });
    }
    return res.json(await Order.findById(req.id));
  },

  /** Multicard: pulni qaytarish (DELETE /payment/{uuid}) va arizani bekor qilish */
  async refundPayment(req, res) {
    try {
      await payments.refund(req.id);
    } catch (e) {
      return res.status(e.status || 502).json({ message: e.message });
    }
    await changeOrderStatus(req.id, 'CANCELLED');
    return res.json(await Order.findById(req.id));
  },

  async paymentLogs(req, res) {
    const p = await prisma.payment.findMany({ where: { orderId: req.id }, include: { logs: { orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'asc' } });
    res.json(p);
  },

  async channels(req, res) {
    res.json(await Channel.listActive());
  },

  async deleteOrder(req, res) {
    await Order.remove(req.id);
    res.json({ ok: true });
  },

  courses: crud(Course),
  results: crud(Result),
  stories: crud(Story),

  async getSettings(req, res) {
    res.json(await Setting.getAll());
  },

  async saveSettings(req, res) {
    res.json(await Setting.setMany(req.body));
  },

  async reviews(req, res) {
    res.json(await Review.listAll());
  },

  async setReviewVisible(req, res) {
    res.json(await Review.setVisible(req.id, req.body.isVisible));
  },

  async deleteReview(req, res) {
    await Review.remove(req.id);
    res.json({ ok: true });
  },

  async upload(req, res) {
    if (!req.file) return res.status(400).json({ message: 'Fayl tanlanmadi' });
    const saved = await Upload.create({ mimeType: req.file.mimetype, data: req.file.buffer });
    return res.json({ url: `/uploads/${saved.id}` });
  },
};

module.exports = adminController;
