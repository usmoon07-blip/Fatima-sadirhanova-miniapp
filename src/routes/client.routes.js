const { Router } = require('express');
const multer = require('multer');
const c = require('../controllers/cartController');
const { telegramAuth, validate, idParam } = require('../middlewares/auth.middleware');

const router = Router();

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    const err = new Error('Faqat rasm yuklash mumkin');
    err.status = 400;
    return cb(err);
  },
}).single('file');

router.get('/config', c.config);
router.get('/catalog', c.catalog);
router.get('/reviews', c.reviews);
router.get('/courses/:id/reviews', idParam, c.courseReviews);

router.use(telegramAuth);
router.get('/me', c.me);
router.put('/me/phone', validate(c.schemas.phone), c.updatePhone);
router.put('/me/language', validate(c.schemas.language), c.setLanguage);
router.post('/courses/:id/access', idParam, c.courseAccess);
router.get('/orders', c.myOrders);
router.post('/orders', validate(c.schemas.order), c.createOrder);
router.post('/orders/:id/receipt', idParam, receiptUpload, c.uploadReceipt);
router.post('/orders/:id/pay', idParam, c.payOrder);
router.get('/orders/:id/payment', idParam, c.paymentStatus);
router.post('/reviews', validate(c.schemas.review), c.addReview);

module.exports = router;
