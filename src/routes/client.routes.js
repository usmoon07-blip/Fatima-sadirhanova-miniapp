const { Router } = require('express');
const cartController = require('../controllers/cartController');
const { telegramAuth, validate } = require('../middlewares/auth.middleware');

const router = Router();

// Ochiq yo'llar
router.get('/config', cartController.getConfig);
router.get('/catalog', cartController.getCatalog);

// Telegram orqali tasdiqlangan foydalanuvchi uchun
router.get('/me', telegramAuth, cartController.getMe);
router.put('/me/phone', telegramAuth, cartController.updatePhone);
router.get('/orders', telegramAuth, cartController.myOrders);
router.post('/orders', telegramAuth, validate(cartController.orderSchema), cartController.createOrder);

module.exports = router;
