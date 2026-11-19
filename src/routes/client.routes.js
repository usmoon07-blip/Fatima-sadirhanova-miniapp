const { Router } = require('express');
const c = require('../controllers/cartController');
const { telegramAuth, validate, idParam } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/config', c.config);
router.get('/catalog', c.catalog);
router.get('/reviews', c.reviews);
router.get('/courses/:id/reviews', idParam, c.courseReviews);

router.use(telegramAuth);
router.get('/me', c.me);
router.put('/me/phone', validate(c.schemas.phone), c.updatePhone);
router.get('/orders', c.myOrders);
router.post('/orders', validate(c.schemas.order), c.createOrder);
router.post('/reviews', validate(c.schemas.review), c.addReview);

module.exports = router;
