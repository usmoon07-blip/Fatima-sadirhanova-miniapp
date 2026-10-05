const { z } = require('zod');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const botController = require('./botController');
const { normalizePhone } = require('../utils/format');

const optText = (max) => z.string().trim().max(max).nullish().transform((v) => v || null);
const lines = z.array(z.string().max(300)).max(60).default([]);
const price = z.coerce.number().int().min(0).max(1_000_000_000).nullish().transform((v) => (v ? v : null));

const schemas = {
  enroll: z.object({
    format: z.enum(['ONLINE', 'OFFLINE']),
    customerName: z.string().trim().min(2, 'Ismingizni kiriting').max(80),
    phone: z.string().trim().min(7, 'Telefon raqamini kiriting').max(30),
    paymentMethod: z.enum(['CASH', 'CARD']),
    comment: optText(500),
  }),

  course: z.object({
    title: z.string().trim().min(1, 'Kurs nomini kiriting').max(120),
    titleRu: optText(120),
    titleEn: optText(120),
    description: z.string().trim().max(3000).default(''),
    descriptionRu: optText(3000),
    descriptionEn: optText(3000),
    program: lines,
    programRu: lines,
    programEn: lines,
    duration: optText(80),
    durationRu: optText(80),
    durationEn: optText(80),
    imageUrl: z.string().trim().min(1, 'Rasm kerak').max(1000),
    onlinePrice: price,
    offlinePrice: price,
    badge: optText(30),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  }).refine((c) => c.onlinePrice || c.offlinePrice, { message: 'Kamida bitta format narxini kiriting (online yoki offline)', path: ['onlinePrice'] }),

  status: z.object({ status: z.enum(['NEW', 'CONFIRMED', 'PAID', 'COMPLETED', 'CANCELLED']) }),
};

const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw Object.assign(new Error("Noto'g'ri ID"), { status: 400 });
  return id;
};

const courseController = {
  schemas,

  // ========== Mijoz ==========

  async enroll(req, res) {
    const course = await Course.findById(idParam(req));
    if (!course || !course.isActive) return res.status(404).json({ message: 'Kurs topilmadi' });

    const price = Course.priceFor(course, req.body.format);
    if (!price) return res.status(400).json({ message: 'Bu kurs tanlangan formatda o\'tilmaydi', field: 'format' });

    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ message: "Telefon raqami noto'g'ri", field: 'phone' });

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId: course.id,
      courseTitle: course.title,
      format: req.body.format,
      price,
      customerName: req.body.customerName,
      phone,
      paymentMethod: req.body.paymentMethod,
      comment: req.body.comment,
    });

    botController.notifyEnrollmentCreated(enrollment).catch((err) => console.error('Bot xabari yuborilmadi:', err.message));
    return res.status(201).json({ enrollment });
  },

  async myEnrollments(req, res) {
    res.json({ enrollments: await Enrollment.listByUser(req.user.id) });
  },

  async cancelMine(req, res) {
    const id = idParam(req);
    const ok = await Enrollment.cancelIfNew(id, req.user.id);
    if (!ok) return res.status(400).json({ message: "Arizani endi bekor qilib bo'lmaydi", reason: 'TOO_LATE' });
    const enrollment = await Enrollment.findById(id);
    botController.notifyEnrollmentStatus(enrollment, { byCustomer: true }).catch(() => {});
    return res.json({ enrollment });
  },

  // ========== Admin ==========

  courses: {
    list: async (req, res) => res.json({ items: await Course.listAll() }),
    create: async (req, res) => res.status(201).json({ item: await Course.create(req.body) }),
    update: async (req, res) => res.json({ item: await Course.update(idParam(req), req.body) }),
    remove: async (req, res) => {
      await Course.remove(idParam(req));
      res.json({ ok: true });
    },
  },

  async listEnrollments(req, res) {
    const [enrollments, newCount] = await Promise.all([Enrollment.list({ status: req.query.status }), Enrollment.countNew()]);
    res.json({ enrollments, newCount });
  },

  async updateEnrollmentStatus(req, res) {
    const id = idParam(req);
    const current = await Enrollment.findById(id);
    if (!current) return res.status(404).json({ message: 'Ariza topilmadi' });
    if (current.status === req.body.status) return res.json({ enrollment: current });
    const enrollment = await Enrollment.updateStatus(id, req.body.status);
    botController.notifyEnrollmentStatus(enrollment).catch((err) => console.error('Mijozga xabar yuborilmadi:', err.message));
    return res.json({ enrollment });
  },

  async deleteEnrollment(req, res) {
    await Enrollment.remove(idParam(req));
    res.json({ ok: true });
  },
};

module.exports = courseController;
