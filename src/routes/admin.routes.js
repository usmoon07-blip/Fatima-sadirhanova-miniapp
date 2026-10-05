const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { Router } = require('express');
const multer = require('multer');
const config = require('../config/default');
const admin = require('../controllers/adminController');
const courses = require('../controllers/courseController');
const { adminAuth, loginGuard, validate } = require('../middlewares/auth.middleware');

fs.mkdirSync(config.uploadsDir, { recursive: true });

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') && ALLOWED_EXT.has(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : Object.assign(new Error('Faqat rasm (jpg, png, webp) yuklash mumkin'), { status: 400 }), ok);
  },
});

const router = Router();
const adminOnly = adminAuth(['admin']);
const staff = adminAuth(['admin', 'kitchen']);

router.post('/login', loginGuard, validate(admin.schemas.login), admin.login);
router.get('/me', staff, admin.me);

// Oshxona ekrani — oshpaz ham, admin ham
router.get('/kitchen', staff, admin.kitchen);
router.patch('/orders/:id/status', staff, validate(admin.schemas.status), admin.updateOrderStatus);

// Qolganlari faqat admin (egasi / menejer)
router.use(adminOnly);

router.get('/stats', admin.stats);
router.get('/report', admin.report);

router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.delete('/orders/:id', admin.deleteOrder);

for (const [name, schema] of [['products', 'product'], ['categories', 'category'], ['stories', 'story']]) {
  router.get(`/${name}`, admin[name].list);
  router.post(`/${name}`, validate(admin.schemas[schema]), admin[name].create);
  router.put(`/${name}/:id`, validate(admin.schemas[schema]), admin[name].update);
  router.delete(`/${name}/:id`, admin[name].remove);
}

router.get('/courses', courses.courses.list);
router.post('/courses', validate(courses.schemas.course), courses.courses.create);
router.put('/courses/:id', validate(courses.schemas.course), courses.courses.update);
router.delete('/courses/:id', courses.courses.remove);

router.get('/enrollments', courses.listEnrollments);
router.patch('/enrollments/:id/status', validate(courses.schemas.status), courses.updateEnrollmentStatus);
router.delete('/enrollments/:id', courses.deleteEnrollment);

router.post('/upload', upload.single('file'), admin.upload);

module.exports = router;
