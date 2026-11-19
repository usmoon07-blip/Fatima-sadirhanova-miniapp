const { z } = require('zod');
const config = require('../config/default');
const Course = require('../models/Course');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Result = require('../models/Result');
const Story = require('../models/Story');
const User = require('../models/User');
const { notifyOrderCreated } = require('./botController');

const PHONE_RE = /^\+?[0-9\s\-()]{9,20}$/;

const schemas = {
  phone: z.object({
    phone: z.string().trim().regex(PHONE_RE, "Telefon raqam noto'g'ri"),
  }),
  order: z.object({
    courseIds: z.array(z.number().int().positive()).min(1, "Savatcha bo'sh").max(30),
    upsell: z.boolean().optional().default(false),
    customerName: z.string().trim().min(2, 'Ismingizni kiriting').max(80),
    phone: z.string().trim().regex(PHONE_RE, "Telefon raqam noto'g'ri"),
    comment: z.string().trim().max(500).optional().nullable(),
  }),
  review: z.object({
    courseId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    text: z.string().trim().min(3, 'Izoh juda qisqa').max(1000, 'Izoh juda uzun'),
  }),
};

const cartController = {
  schemas,

  config(req, res) {
    res.json({
      shop: {
        name: config.shop.name,
        tagline: config.shop.tagline,
        phone: config.shop.phone,
        adminUsername: config.shop.adminUsername,
      },
      upsell: config.upsell.enabled ? { title: config.upsell.title, price: config.upsell.price } : null,
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
    const [{ paid, pending }, reviews] = await Promise.all([
      Order.courseIdsByUser(u.id),
      Review.listByUser(u.id),
    ]);
    const owned = paid.length ? await Course.findMany(paid) : [];
    res.json({
      user: { id: u.id, firstName: u.firstName, lastName: u.lastName, username: u.username, phone: u.phone },
      purchased: paid,
      pending,
      myCourses: owned.map((c) => ({
        id: c.id, title: c.title, imageUrl: c.imageUrl, lessonsCount: c.lessonsCount, accessLink: c.accessLink,
      })),
      reviews,
    });
  },

  async updatePhone(req, res) {
    const user = await User.setPhone(req.user.id, req.body.phone);
    res.json({ phone: user.phone });
  },

  async myOrders(req, res) {
    res.json(await Order.listByUser(req.user.id));
  },

  async createOrder(req, res) {
    const { courseIds, upsell, customerName, phone, comment } = req.body;
    const ids = [...new Set(courseIds)];
    const courses = await Course.findManyActive(ids);
    if (courses.length !== ids.length) {
      return res.status(400).json({ message: "Savatchadagi ba'zi kurslar endi mavjud emas. Savatchani yangilang." });
    }

    const { paid } = await Order.courseIdsByUser(req.user.id);
    const owned = courses.filter((c) => paid.includes(c.id));
    if (owned.length) {
      return res.status(400).json({ message: `«${owned[0].title}» kursi sizda allaqachon bor` });
    }

    const items = courses.map((c) => ({
      courseId: c.id, title: c.title, imageUrl: c.imageUrl, price: c.price, oldPrice: c.oldPrice, type: 'course',
    }));
    if (upsell && config.upsell.enabled) {
      items.push({ courseId: null, title: config.upsell.title, imageUrl: null, price: config.upsell.price, oldPrice: null, type: 'extra' });
    }
    const total = items.reduce((s, i) => s + i.price, 0);

    if (!req.user.phone) await User.setPhone(req.user.id, phone);

    const order = await Order.create({
      userId: req.user.id, items, total, customerName, phone, comment: comment || null,
    });
    notifyOrderCreated(order).catch((e) => console.error('❌ Bot xabari yuborilmadi:', e.message));
    return res.status(201).json(order);
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
      return res.status(403).json({ message: "Izoh qoldirish uchun avval kursni sotib olishingiz kerak" });
    }
    await Review.upsert(req.user.id, courseId, { rating, text });
    return res.status(201).json({ ok: true });
  },
};

module.exports = cartController;
