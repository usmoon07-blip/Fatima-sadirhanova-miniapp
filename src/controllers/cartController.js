const { z } = require('zod');
const config = require('../config/default');
const Course = require('../models/Course');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Result = require('../models/Result');
const Story = require('../models/Story');
const User = require('../models/User');
const Setting = require('../models/Setting');
const Upload = require('../models/Upload');
const { notifyOrderCreated, notifyReceiptReceived, setUserMenuButton } = require('./botController');
const { ensureAccess, accessMap } = require('../services/access');
const { t, LANGS } = require('../utils/i18n');

const PHONE_RE = /^\+?[0-9\s\-()]{9,20}$/;

const schemas = {
  phone: z.object({
    phone: z.string().trim().regex(PHONE_RE, 'err.phone'),
  }),
  language: z.object({ language: z.enum(LANGS) }),
  order: z.object({
    courseIds: z.array(z.number().int().positive()).min(1, 'err.cartEmpty').max(30),
    /** Mini App'dagi kurs nomlari — eski nusxadan noto'g'ri kursga yozilmaslik uchun */
    titles: z.record(z.string(), z.string().max(200)).optional(),
    customerName: z.string().trim().min(2, 'err.name').max(80),
    phone: z.string().trim().regex(PHONE_RE, 'err.phone'),
    comment: z.string().trim().max(500).optional().nullable(),
  }),
  review: z.object({
    courseId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().min(3, 'err.reviewShort').max(1000, 'err.reviewLong'),
  }),
};

const cartController = {
  schemas,

  async config(req, res) {
    res.json({
      payment: await Setting.payment(),
      shop: {
        name: config.shop.name,
        tagline: config.shop.tagline,
        phone: config.shop.phone,
        adminUsername: config.shop.adminUsername,
        authorTelegram: config.shop.authorTelegram,
        authorInstagram: config.shop.authorInstagram,
      },
    });
  },

  async catalog(req, res) {
    const [courses, stories, results, reviews] = await Promise.all([
      Course.listPublic(),
      Story.listActive(),
      Result.listActive(),
      Review.listPublic({ take: 30 }),
    ]);
    const categories = [...new Set(courses.map((c) => c.category).filter(Boolean))];
    res.json({ courses, categories, stories, results, reviews });
  },

  async me(req, res) {
    const u = req.user;
    const [{ paid, pending }, reviews, accesses] = await Promise.all([
      Order.courseIdsByUser(u.id),
      Review.listByUser(u.id),
      accessMap(u.id),
    ]);
    const owned = paid.length ? await Course.findMany(paid) : [];
    res.json({
      user: {
        id: u.id, firstName: u.firstName, lastName: u.lastName, username: u.username, phone: u.phone, language: u.language,
      },
      purchased: paid,
      pending,
      myCourses: owned.map((c) => {
        const a = accesses.get(c.id);
        let access = null;
        if (c.channelId) access = { protected: true, used: Boolean(a?.usedAt), ready: Boolean(a) };
        else if (c.accessLink) access = { protected: false, link: c.accessLink };
        return {
          id: c.id, title: c.title, titleRu: c.titleRu, titleEn: c.titleEn, imageUrl: c.imageUrl, lessonsCount: c.lessonsCount, access,
        };
      }),
      reviews,
    });
  },

  async setLanguage(req, res) {
    const user = await User.setLanguage(req.user.id, req.body.language);
    setUserMenuButton(user.telegramId, user.language).catch(() => {});
    res.json({ language: user.language });
  },

  /** Bir martalik kanal havolasini beradi (kerak bo'lsa yaratadi) */
  async courseAccess(req, res) {
    const { paid } = await Order.courseIdsByUser(req.user.id);
    if (!paid.includes(req.id)) return res.status(403).json({ message: t(req.lang, 'err.notBought') });
    const course = await Course.findById(req.id);
    try {
      const access = await ensureAccess(req.user, course);
      if (!access) return res.status(404).json({ message: t(req.lang, 'err.accessFailed') });
      return res.json(access);
    } catch (e) {
      console.error(`❌ Havola yaratilmadi (kurs #${req.id}):`, e.message);
      return res.status(500).json({ message: t(req.lang, 'err.accessFailed') });
    }
  },

  async updatePhone(req, res) {
    const user = await User.setPhone(req.user.id, req.body.phone);
    res.json({ phone: user.phone });
  },

  async myOrders(req, res) {
    res.json(await Order.listByUser(req.user.id));
  },

  async createOrder(req, res) {
    const { courseIds, titles, customerName, phone, comment } = req.body;
    const ids = [...new Set(courseIds)];
    const courses = await Course.findManyActive(ids);
    if (courses.length !== ids.length) {
      return res.status(400).json({ message: t(req.lang, 'err.coursesGone') });
    }
    const changed = titles && courses.find((c) => titles[c.id] && titles[c.id] !== c.title);
    if (changed) {
      return res.status(409).json({ message: t(req.lang, 'err.menuChanged') });
    }

    const { paid } = await Order.courseIdsByUser(req.user.id);
    const owned = courses.filter((c) => paid.includes(c.id));
    if (owned.length) {
      return res.status(400).json({ message: t(req.lang, 'err.owned', { title: owned[0].title }) });
    }

    const items = courses.map((c) => ({
      courseId: c.id, title: c.title, imageUrl: c.imageUrl, price: c.price, oldPrice: c.oldPrice, type: 'course',
    }));
    const total = items.reduce((s, i) => s + i.price, 0);

    if (!req.user.phone) await User.setPhone(req.user.id, phone);

    const order = await Order.create({
      userId: req.user.id, items, total, customerName, phone, comment: comment || null,
    });
    notifyOrderCreated(order).catch((e) => console.error('❌ Bot xabari yuborilmadi:', e.message));
    return res.status(201).json(order);
  },

  async uploadReceipt(req, res) {
    if (!req.file) return res.status(400).json({ message: t(req.lang, 'err.receiptMissing') });
    const order = await Order.findById(req.id);
    if (!order || order.userId !== req.user.id) return res.status(404).json({ message: t(req.lang, 'err.orderNotFound') });
    if (order.status !== 'PENDING') return res.status(400).json({ message: t(req.lang, 'err.receiptNotNeeded') });
    const saved = await Upload.create({ mimeType: req.file.mimetype, data: req.file.buffer });
    const updated = await Order.setReceipt(order.id, `/uploads/${saved.id}`);
    notifyReceiptReceived(updated, req.file.buffer).catch((e) => console.error('❌ Bot xabari yuborilmadi:', e.message));
    return res.json(updated);
  },

  async courseReviews(req, res) {
    res.json(await Review.listPublic({ courseId: req.id }));
  },

  async reviews(req, res) {
    res.json(await Review.listPublic({ take: 100 }));
  },

  async addReview(req, res) {
    const { courseId, rating, text } = req.body;
    const { paid } = await Order.courseIdsByUser(req.user.id);
    if (!paid.includes(courseId)) {
      return res.status(403).json({ message: t(req.lang, 'err.reviewNotBought') });
    }
    await Review.upsert(req.user.id, courseId, { rating, text });
    return res.status(201).json({ ok: true });
  },
};

module.exports = cartController;
