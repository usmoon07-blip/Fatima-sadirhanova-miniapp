/* To'lov jarayoni (Multicard):
   1) createPayment — summa FAQAT serverda bazadagi arizadan hisoblanadi, Multicard'da invoys yaratiladi
   2) handleCallback — imzo, ariza borligi, summa va takroriy so'rov tekshiriladi; to'g'ri bo'lsa ariza PAID
   3) syncPayment — callback kelmay qolsa, Multicard'dan server orqali tekshirish
   Ariza holati hech qachon Mini App'dan kelgan ma'lumot bilan o'zgarmaydi. */
const config = require('../config/default');
const { prisma } = require('../database/connection');
const multicard = require('./multicard');

const mc = config.multicard;
const MAX_INT = 2147483647;

// Hujjatdagi namuna kodlar (docs.multicard.uz → «Создание инвойса», ofd misoli) — test rejimi uchun
const SAMPLE_OFD = { mxik: '06401004002000000', packageCode: '1506113' };

function ofdDefaults() {
  return {
    mxik: mc.ofd.mxik || SAMPLE_OFD.mxik,
    packageCode: mc.ofd.packageCode || SAMPLE_OFD.packageCode,
    vat: mc.ofd.vat,
    tin: mc.ofd.tin || null,
  };
}

/** Fiskal chek qatorlari (ofdRequest): qty, price, mxik, total, package_code, name — majburiy; vat, tin — ixtiyoriy */
async function buildOfd(items) {
  const ids = items.map((i) => i.courseId).filter(Boolean);
  const courses = ids.length ? await prisma.course.findMany({ where: { id: { in: ids } } }) : [];
  const map = new Map(courses.map((c) => [c.id, c]));
  const def = ofdDefaults();
  return items.map((i) => {
    const c = i.courseId ? map.get(i.courseId) : null;
    const price = Math.round(i.price * 100); // tiyin
    const row = {
      qty: 1,
      price,
      total: price,
      mxik: c?.mxik || def.mxik,
      package_code: c?.packageCode || def.packageCode,
      name: String(i.title).slice(0, 255),
    };
    const vat = c?.vat ?? def.vat;
    if (vat != null) row.vat = vat;
    if (def.tin) row.tin = def.tin;
    return row;
  });
}

function callbackUrl() {
  return `${config.publicUrl}/api/payments/multicard/callback`;
}

function returnUrl(orderId, botUsername) {
  if (botUsername) return `https://t.me/${botUsername}?start=paid_${orderId}`;
  return config.bot.webAppUrl || undefined;
}

/** Ariza uchun to'lov havolasi. Amal qilayotgan (muddati o'tmagan, summasi bir xil) havola bo'lsa — o'shani qaytaradi */
async function createPayment(orderId, { lang = 'uz', botUsername } = {}) {
  if (!mc.enabled) throw Object.assign(new Error("Onlayn to'lov hali sozlanmagan"), { status: 503 });
  if (!config.publicUrl) throw Object.assign(new Error('PUBLIC_URL sozlanmagan (callback manzili uchun kerak)'), { status: 503 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw Object.assign(new Error('Ariza topilmadi'), { status: 404 });
  if (order.paymentMethod !== 'multicard') throw Object.assign(new Error("Bu ariza onlayn to'lov uchun emas"), { status: 400 });
  if (order.status !== 'PENDING') throw Object.assign(new Error("Bu ariza uchun to'lov kerak emas"), { status: 400 });

  // Summa — faqat serverda, bazadagi arizadan, tiyinda
  const items = Array.isArray(order.items) ? order.items : [];
  const amount = Math.round(order.total * 100);
  const itemsSum = items.reduce((s, i) => s + Math.round(i.price * 100), 0);
  if (amount <= 0 || amount !== itemsSum) throw Object.assign(new Error("Ariza summasi noto'g'ri"), { status: 400 });
  if (amount > MAX_INT) throw Object.assign(new Error("Summa juda katta — arizani bo'lib to'lang"), { status: 400 });

  const existing = await prisma.payment.findFirst({
    where: { orderId, status: 'CREATED', amount, expiresAt: { gt: new Date(Date.now() + 60e3) } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing?.checkoutUrl) return existing;

  const invoiceId = `FS${order.id}-${Date.now().toString(36)}`;
  const payment = await prisma.payment.create({
    data: { orderId, invoiceId, amount, expiresAt: new Date(Date.now() + mc.invoiceTtl * 1000) },
  });

  try {
    const data = await multicard.createInvoice({
      amount,
      invoice_id: invoiceId,
      lang: ['ru', 'uz', 'en'].includes(lang) ? lang : 'uz',
      return_url: returnUrl(orderId, botUsername),
      callback_url: callbackUrl(),
      ttl: mc.invoiceTtl,
      ofd: await buildOfd(items),
    }, { paymentId: payment.id });

    if (!data?.checkout_url || !data?.uuid) throw new Error("Multicard javobida checkout_url yo'q");
    if (Number(data.amount) !== amount) throw new Error('Multicard qaytargan summa mos emas');

    return prisma.payment.update({
      where: { id: payment.id },
      data: { invoiceUuid: data.uuid, checkoutUrl: data.checkout_url },
    });
  } catch (e) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'CANCELLED' } });
    throw Object.assign(new Error(`To'lov havolasini yaratib bo'lmadi: ${e.message}`), { status: 502 });
  }
}

/** To'lovni PAID qiladi (faqat CREATED holatidan; bir vaqtda kelgan so'rovlardan faqat bittasi o'tadi) */
async function markPaid(payment, fields) {
  const res = await prisma.payment.updateMany({
    where: { id: payment.id, status: 'CREATED' },
    data: { status: 'PAID', paidAt: new Date(), ...fields },
  });
  return res.count === 1;
}

/**
 * Multicard callback (success). Javob: { http, body }.
 * HTTP 200 + success:true — qabul qilindi. success:false — Multicard to'lovni bekor qiladi va pulni qaytaradi,
 * message esa to'lovchiga ko'rsatiladi (hujjat bo'yicha).
 */
async function handleCallback(body, ip, { onPaid } = {}) {
  const reply = async (http, out, note, paymentId = null) => {
    await multicard.log({ direction: 'in', endpoint: 'POST /api/payments/multicard/callback', paymentId, httpStatus: http, request: { ...body, _ip: ip }, response: out, note });
    return { http, body: out };
  };
  const fail = (message, note, paymentId) => reply(200, { success: false, message }, note, paymentId);

  const required = ['store_id', 'amount', 'invoice_id', 'uuid', 'sign'];
  if (!body || required.some((k) => body[k] === undefined || body[k] === null || body[k] === '')) {
    return fail("So'rov to'liq emas", 'missing fields');
  }
  if (mc.callbackIp && ip !== mc.callbackIp) return fail("Ruxsat yo'q", `ip ${ip} not allowed`);
  if (String(body.store_id) !== String(mc.storeId)) return fail('Kassa mos emas', 'store_id mismatch');
  if (!multicard.verifyCallbackSign(body)) return fail("Imzo noto'g'ri", 'bad sign');

  const payment = await prisma.payment.findUnique({ where: { invoiceId: String(body.invoice_id) }, include: { order: true } });
  if (!payment) return fail('Invoys topilmadi', 'payment not found');

  // Takroriy so'rov: shu tranzaksiya allaqachon qabul qilingan — oldingi javobni qaytaramiz, qayta hisoblamaymiz
  if (payment.status === 'PAID') {
    if (payment.transactionUuid === String(body.uuid)) return reply(200, { success: true }, 'duplicate callback (idempotent)', payment.id);
    return fail("Bu invoys allaqachon to'langan", 'second transaction for paid invoice', payment.id);
  }
  if (payment.status !== 'CREATED') return fail('Invoys bekor qilingan', `payment status ${payment.status}`, payment.id);
  if (Number(body.amount) !== payment.amount) return fail("Summa mos emas", `amount ${body.amount} != ${payment.amount}`, payment.id);
  if (payment.order.status !== 'PENDING') return fail('Ariza faol emas', `order status ${payment.order.status}`, payment.id);

  const won = await markPaid(payment, {
    transactionUuid: String(body.uuid),
    cardPan: body.card_pan || null,
    ps: body.ps || null,
    billingId: body.billing_id || null,
    receiptUrl: body.receipt_url || null,
  });
  if (!won) {
    // Parallel kelgan takroriy so'rov — natijani qayta o'qib, idempotent javob beramiz
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
    if (fresh?.status === 'PAID' && fresh.transactionUuid === String(body.uuid)) return reply(200, { success: true }, 'duplicate (race)', payment.id);
    return fail("To'lovni qabul qilib bo'lmadi", 'race lost', payment.id);
  }

  await onPaid?.(payment.orderId);
  return reply(200, { success: true }, 'paid', payment.id);
}

/** Callback kelmagan bo'lsa — Multicard'dan server orqali tekshiradi (invoys summasi va to'lov holati) */
async function syncPayment(paymentId, { onPaid } = {}) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment?.invoiceUuid || payment.status !== 'CREATED') return payment;
  const data = await multicard.getInvoice(payment.invoiceUuid, { paymentId: payment.id });
  const p = data?.payment && typeof data.payment === 'object' ? data.payment : null;
  const ok = p?.status === 'success'
    && String(data.invoice_id) === payment.invoiceId
    && Number(data.amount) === payment.amount
    && payment.order.status === 'PENDING';
  if (ok && p.uuid) {
    const won = await markPaid(payment, {
      transactionUuid: String(p.uuid), cardPan: p.card_pan || null, ps: p.ps || null, billingId: p.billing_id || null, receiptUrl: p.receipt_url || null,
    });
    if (won) await onPaid?.(payment.orderId);
  }
  return prisma.payment.findUnique({ where: { id: paymentId } });
}

async function latestPayment(orderId) {
  return prisma.payment.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } });
}

/** Arizani bekor qilishda: to'lanmagan invoyslar Multicard'da ham bekor qilinadi */
async function cancelOpenPayments(orderId) {
  const open = await prisma.payment.findMany({ where: { orderId, status: 'CREATED' } });
  for (const p of open) {
    if (p.invoiceUuid) {
      try { await multicard.deleteInvoice(p.invoiceUuid, { paymentId: p.id }); } catch (e) { console.warn('⚠️  Invoys bekor qilinmadi:', e.message); }
    }
    await prisma.payment.updateMany({ where: { id: p.id, status: 'CREATED' }, data: { status: 'CANCELLED' } });
  }
}

/** Admin: to'langan to'lovni qaytarish (DELETE /payment/{uuid}) */
async function refund(orderId) {
  const payment = await prisma.payment.findFirst({ where: { orderId, status: 'PAID' }, orderBy: { paidAt: 'desc' } });
  if (!payment?.transactionUuid) throw Object.assign(new Error("Qaytariladigan to'lov topilmadi"), { status: 404 });
  await multicard.refundPayment(payment.transactionUuid, { paymentId: payment.id });
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } });
  return payment;
}

module.exports = { createPayment, handleCallback, syncPayment, latestPayment, cancelOpenPayments, refund, buildOfd };
