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
const { notifyOrderStatus } = require('./botController');

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
    description: z.string().trim().max(3000).optional().default(''),
    imageUrl: z.string().trim().min(1, 'Rasm qo\'shing').max(1000),
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
    const before = await Order.findById(req.id);
    if (!before) return res.status(404).json({ message: 'Buyurtma topilmadi' });
    const order = await Order.setStatus(req.id, req.body.status);
    if (before.status !== order.status) {
      notifyOrderStatus(order).catch((e) => console.error('❌ Bot xabari yuborilmadi:', e.message));
    }
    return res.json(order);
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
