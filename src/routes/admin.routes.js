const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { Router } = require('express');
const multer = require('multer');
const config = require('../config/default');
const admin = require('../controllers/adminController');
const { adminAuth, validate } = require('../middlewares/auth.middleware');

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

router.post('/login', validate(admin.schemas.login), admin.login);

router.use(adminAuth);

router.get('/stats', admin.stats);

router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.patch('/orders/:id/status', validate(admin.schemas.status), admin.updateOrderStatus);

router.get('/products', admin.products.list);
router.post('/products', validate(admin.schemas.product), admin.products.create);
router.put('/products/:id', validate(admin.schemas.product), admin.products.update);
router.delete('/products/:id', admin.products.remove);

router.get('/categories', admin.categories.list);
router.post('/categories', validate(admin.schemas.category), admin.categories.create);
router.put('/categories/:id', validate(admin.schemas.category), admin.categories.update);
router.delete('/categories/:id', admin.categories.remove);

router.get('/stories', admin.stories.list);
router.post('/stories', validate(admin.schemas.story), admin.stories.create);
router.put('/stories/:id', validate(admin.schemas.story), admin.stories.update);
router.delete('/stories/:id', admin.stories.remove);

router.post('/upload', upload.single('file'), admin.upload);

module.exports = router;
