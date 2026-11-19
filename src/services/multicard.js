/* Multicard to'lov shlyuzi bilan ishlash (docs.multicard.uz).
   Faqat hujjatda bor metodlar ishlatiladi:
   - POST /auth                       — token (24 soat, keshlanadi)
   - POST /payment/invoice            — invoys va to'lov sahifasi havolasi (checkout_url)
   - GET  /payment/invoice/{uuid}     — invoys ma'lumotlari (ichida payment)
   - DELETE /payment/invoice/{uuid}   — to'lanmagan invoysni bekor qilish
   - DELETE /payment/{uuid}           — to'langan tranzaksiyani bekor qilish (pulni qaytarish)
   Summalar — TIYINDA. */
const crypto = require('crypto');
const config = require('../config/default');
const { prisma } = require('../database/connection');

const mc = config.multicard;
let tokenCache = { token: null, expiresAt: 0 };

/** Logga yozishdan oldin maxfiy maydonlarni yashiradi */
function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const k of Object.keys(copy)) {
    if (['secret', 'token', 'card_token', 'Authorization'].includes(k)) copy[k] = '***';
    else if (copy[k] && typeof copy[k] === 'object') copy[k] = redact(copy[k]);
  }
  return copy;
}

/** To'lov tizimi bilan har bir so'rov/javobni bazaga va konsolga yozadi */
async function log({ direction, endpoint, paymentId = null, httpStatus = null, request = null, response = null, note = null }) {
  const entry = { direction, endpoint, httpStatus, note };
  console.log(`💳 [multicard ${direction}] ${endpoint} ${httpStatus ?? ''} ${note ?? ''}`.trim());
  try {
    await prisma.paymentLog.create({
      data: {
        provider: 'multicard', direction, endpoint, paymentId, httpStatus,
        request: request == null ? undefined : redact(request),
        response: response == null ? undefined : redact(response),
        note,
      },
    });
  } catch (e) {
    console.error('❌ PaymentLog yozilmadi:', e.message, entry);
  }
}

class MulticardError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function rawFetch(method, path, body, headers = {}, paymentId = null) {
  let res;
  try {
    res = await fetch(`${mc.baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
      body: body == null ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    // Tarmoq xatosi ham logga yoziladi
    await log({ direction: 'out', endpoint: `${method} ${path}`, paymentId, request: body, note: `network error: ${e.cause?.code || e.message}` });
    throw new MulticardError(`Multicard bilan aloqa yo'q (${e.cause?.code || e.message})`);
  }
  let data = null;
  try { data = await res.json(); } catch { /* bo'sh javob */ }
  return { status: res.status, data };
}

/** Token: 24 soat amal qiladi — keshlanadi, muddatidan 10 daqiqa oldin yangilanadi */
async function getToken(force = false) {
  if (!force && tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const body = { application_id: mc.applicationId, secret: mc.secret };
  const { status, data } = await rawFetch('POST', '/auth', body);
  await log({ direction: 'out', endpoint: 'POST /auth', httpStatus: status, request: body, response: data });
  if (status !== 200 || !data?.token) {
    throw new MulticardError("Multicard'dan token olinmadi", { status, code: data?.error?.code, details: data?.error?.details });
  }
  // expiry — GMT+5 vaqti ("2026-11-20 15:06:02")
  const exp = data.expiry ? Date.parse(`${data.expiry.replace(' ', 'T')}+05:00`) : NaN;
  tokenCache = { token: data.token, expiresAt: (Number.isFinite(exp) ? exp : Date.now() + 24 * 3600e3) - 10 * 60e3 };
  return tokenCache.token;
}

/** Avtorizatsiyali so'rov; 401 bo'lsa tokenni yangilab bir marta qayta urinadi */
async function call(method, path, body, { paymentId = null } = {}) {
  let token = await getToken();
  let res = await rawFetch(method, path, body, { Authorization: `Bearer ${token}` }, paymentId);
  if (res.status === 401) {
    token = await getToken(true);
    res = await rawFetch(method, path, body, { Authorization: `Bearer ${token}` }, paymentId);
  }
  await log({ direction: 'out', endpoint: `${method} ${path}`, paymentId, httpStatus: res.status, request: body, response: res.data });
  if (res.status >= 400 || res.data?.success === false) {
    throw new MulticardError(res.data?.error?.details || `Multicard xatosi (HTTP ${res.status})`, {
      status: res.status, code: res.data?.error?.code, details: res.data?.error?.details,
    });
  }
  return res.data?.data;
}

function createInvoice(payload, opts) {
  return call('POST', '/payment/invoice', { store_id: mc.storeId, ...payload }, opts);
}
function getInvoice(uuid, opts) {
  return call('GET', `/payment/invoice/${encodeURIComponent(uuid)}`, null, opts);
}
function deleteInvoice(uuid, opts) {
  return call('DELETE', `/payment/invoice/${encodeURIComponent(uuid)}`, null, opts);
}
function refundPayment(transactionUuid, opts) {
  return call('DELETE', `/payment/${encodeURIComponent(transactionUuid)}`, null, opts);
}

/** Callback imzosi: md5({store_id}{invoice_id}{amount}{secret}) */
function callbackSign(storeId, invoiceId, amount) {
  return crypto.createHash('md5').update(`${storeId}${invoiceId}${amount}${mc.secret}`).digest('hex');
}

function verifyCallbackSign(body) {
  if (!body || typeof body.sign !== 'string') return false;
  const expected = callbackSign(body.store_id, body.invoice_id, body.amount);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(body.sign.toLowerCase(), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  MulticardError, log, getToken, createInvoice, getInvoice, deleteInvoice, refundPayment, callbackSign, verifyCallbackSign,
};
