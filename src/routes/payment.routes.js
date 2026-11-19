const { Router } = require('express');
const payments = require('../services/payments');
const { onOrderPaid } = require('../controllers/botController');

const router = Router();

/** Multicard callback (success): imzo, ariza, summa, takroriy so'rov tekshiriladi */
router.post('/multicard/callback', async (req, res) => {
  try {
    const { http, body } = await payments.handleCallback(req.body, req.ip, { onPaid: onOrderPaid });
    res.status(http).json(body);
  } catch (e) {
    console.error('❌ Multicard callback xatosi:', e);
    // Hujjat bo'yicha: 500 da Multicard tranzaksiyani muzlatadi va callback'ni qayta yuboradi
    res.status(500).json({ success: false, message: 'Server xatosi' });
  }
});

module.exports = router;
