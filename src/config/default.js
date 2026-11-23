const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const config = {
  port: num(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
  devAllowBrowser: process.env.DEV_ALLOW_BROWSER === 'true',
  uploadsDir: path.join(__dirname, '..', '..', 'uploads'),
  adminDist: path.join(__dirname, '..', '..', 'admin', 'dist'),
  /** Serverning ommaviy manzili (Render o'zi RENDER_EXTERNAL_URL beradi). Bo'lsa — webhook, bo'lmasa — polling */
  publicUrl: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').trim().replace(/\/+$/, ''),
  /** Ruxsat etilgan saytlar (vergul bilan). Bo'sh bo'lsa — hammasiga ruxsat */
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean),

  bot: {
    token: (process.env.BOT_TOKEN || '').trim(),
    /** Bot egasi (Telegram user ID) — yangi arizalar va cheklar shu odamga keladi */
    ownerId: (process.env.OWNER_ID || '816069987').trim(),
    webAppUrl: (process.env.WEBAPP_URL || '').trim().replace(/\/+$/, ''),
  },

  admin: {
    password: process.env.ADMIN_PASSWORD || 'fatima2026',
    jwtSecret: process.env.JWT_SECRET || 'change-me-please',
    tokenTtl: '7d',
    maxLoginAttempts: 5,
    lockMinutes: 15,
  },

  shop: {
    name: process.env.SHOP_NAME || 'Fatima Sadirkhanova',
    tagline: process.env.SHOP_TAGLINE || 'PATISSERIE',
    phone: process.env.SHOP_PHONE || '',
    adminUsername: (process.env.ADMIN_USERNAME || '').replace(/^@/, '').trim(),
    authorTelegram: (process.env.AUTHOR_TELEGRAM || 'fatima_sadirkhanova').replace(/^@/, '').trim(),
    authorInstagram: (process.env.AUTHOR_INSTAGRAM || 'fatima_sadirkhanova').replace(/^@/, '').trim(),
    cardNumber: process.env.CARD_NUMBER || '',
    cardHolder: process.env.CARD_HOLDER || '',
  },

};

// Multicard to'lov tizimi (kalitlar faqat .env da)
config.multicard = {
  baseUrl: (process.env.MULTICARD_BASE_URL || 'https://dev-mesh.multicard.uz').trim().replace(/\/+$/, ''),
  applicationId: (process.env.MULTICARD_APPLICATION_ID || '').trim(),
  secret: (process.env.MULTICARD_SECRET || '').trim(),
  storeId: (process.env.MULTICARD_STORE_ID || '').trim(),
  /** Callback qabul qilinadigan IP (hujjat bo'yicha). Bo'sh bo'lsa — faqat imzo tekshiriladi */
  callbackIp: (process.env.MULTICARD_CALLBACK_IP || '').trim(),
  /** Invoys amal qilish muddati (soniya) */
  invoiceTtl: num(process.env.MULTICARD_INVOICE_TTL, 3600),
  /** Fiskal chek uchun standart qiymatlar (kursda ko'rsatilmagan bo'lsa) */
  ofd: {
    mxik: (process.env.OFD_DEFAULT_MXIK || '').trim(),
    packageCode: (process.env.OFD_DEFAULT_PACKAGE_CODE || '').trim(),
    vat: process.env.OFD_DEFAULT_VAT === undefined || process.env.OFD_DEFAULT_VAT === '' ? null : num(process.env.OFD_DEFAULT_VAT, null),
    tin: (process.env.OFD_TIN || '').trim(),
  },
};
config.multicard.enabled = Boolean(config.multicard.applicationId && config.multicard.secret && config.multicard.storeId);

config.webAppIsHttps = config.bot.webAppUrl.startsWith('https://');

module.exports = config;
