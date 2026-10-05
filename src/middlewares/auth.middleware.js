const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/default');
const User = require('../models/User');

const INIT_DATA_MAX_AGE_SEC = 24 * 60 * 60;
const DEV_USER = { id: 100000001, first_name: 'Mehmon', username: 'dev_user' };

/** Telegram WebApp initData imzosini tekshiradi. To'g'ri bo'lsa foydalanuvchini qaytaradi. */
function verifyInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  const a = Buffer.from(calculated, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_SEC) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

/** Mini App so'rovlari uchun: Telegram foydalanuvchisini aniqlaydi va bazaga yozadi */
async function telegramAuth(req, res, next) {
  try {
    const initData = req.get('X-Telegram-Init-Data') || '';
    let tgUser = verifyInitData(initData, config.bot.token);

    if (!tgUser && !initData && config.devAllowBrowser) tgUser = DEV_USER;
    if (!tgUser) {
      return res.status(401).json({ message: 'Telegram orqali kiring. Ilovani bot ichidan oching.' });
    }

    req.tgUser = tgUser;
    req.user = await User.upsertFromTelegram(tgUser);
    return next();
  } catch (err) {
    return next(err);
  }
}

function signAdminToken(username) {
  return jwt.sign({ sub: username, role: 'admin' }, config.admin.jwtSecret, { expiresIn: config.admin.tokenTtl });
}

function adminAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });
  try {
    const payload = jwt.verify(token, config.admin.jwtSecret);
    if (payload.role !== 'admin') throw new Error('role');
    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Sessiya tugagan. Qaytadan kiring.' });
  }
}

/** Zod sxemasi bo'yicha req.body ni tekshiradi */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      return res.status(400).json({
        message: first?.message || "Ma'lumotlar noto'g'ri",
        field: first?.path?.join('.'),
      });
    }
    req.body = result.data;
    return next();
  };
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { telegramAuth, adminAuth, validate, signAdminToken, verifyInitData, safeEqual };
