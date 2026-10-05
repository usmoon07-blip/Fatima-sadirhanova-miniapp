const { Router } = require('express');
const cartController = require('../controllers/cartController');
const courseController = require('../controllers/courseController');
const { telegramAuth, validate } = require('../middlewares/auth.middleware');

const router = Router();

// Ochiq yo'llar
router.get('/config', cartController.getConfig);
router.get('/catalog', cartController.getCatalog);

// Telegram orqali tasdiqlangan foydalanuvchi uchun
router.get('/me', telegramAuth, cartController.getMe);
router.put('/me/phone', telegramAuth, cartController.updatePhone);
router.put('/me/language', telegramAuth, cartController.updateLanguage);
router.put('/me/address', telegramAuth, validate(cartController.addressSchema), cartController.saveAddress);
router.post('/promo/check', telegramAuth, validate(cartController.promoSchema), cartController.checkPromo);
router.get('/orders', telegramAuth, cartController.myOrders);
router.post('/orders', telegramAuth, validate(cartController.orderSchema), cartController.createOrder);
router.post('/orders/:id/cancel', telegramAuth, cartController.cancelOrder);

// Kurslar
router.post('/courses/:id/enroll', telegramAuth, validate(courseController.schemas.enroll), courseController.enroll);
router.get('/enrollments', telegramAuth, courseController.myEnrollments);
router.post('/enrollments/:id/cancel', telegramAuth, courseController.cancelMine);

module.exports = router;
