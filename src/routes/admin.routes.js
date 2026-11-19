const { Router } = require('express');
const a = require('../controllers/adminController');
const { adminAuth, loginGuard, validate, idParam } = require('../middlewares/auth.middleware');

const router = Router();

router.post('/login', loginGuard, validate(a.schemas.login), a.login);

router.use(adminAuth);
router.get('/stats', a.stats);

router.get('/orders', a.orders);
router.patch('/orders/:id/status', idParam, validate(a.schemas.status), a.setOrderStatus);
router.delete('/orders/:id', idParam, a.deleteOrder);

const resource = (name, handlers, schema) => {
  router.get(`/${name}`, handlers.list);
  router.post(`/${name}`, validate(schema), handlers.create);
  router.put(`/${name}/:id`, idParam, validate(schema), handlers.update);
  router.delete(`/${name}/:id`, idParam, handlers.remove);
};
resource('courses', a.courses, a.schemas.course);
resource('results', a.results, a.schemas.result);
resource('stories', a.stories, a.schemas.story);

router.get('/reviews', a.reviews);
router.patch('/reviews/:id', idParam, validate(a.schemas.visible), a.setReviewVisible);
router.delete('/reviews/:id', idParam, a.deleteReview);

router.get('/channels', a.channels);
router.get('/settings', a.getSettings);
router.put('/settings', validate(a.schemas.settings), a.saveSettings);

router.post('/upload', a.uploadMiddleware, a.upload);

module.exports = router;
