const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const config = {
  port: num(process.env.PORT, 4000),
  databaseUrl: process.env.DATABASE_URL,
  devAllowBrowser: process.env.DEV_ALLOW_BROWSER === 'true',
  uploadsDir: path.join(__dirname, '..', '..', 'uploads'),

  bot: {
    token: (process.env.BOT_TOKEN || '').trim(),
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
    cardNumber: process.env.CARD_NUMBER || '',
    cardHolder: process.env.CARD_HOLDER || '',
  },

  upsell: {
    title: process.env.UPSELL_TITLE || '',
    price: num(process.env.UPSELL_PRICE, 0),
  },
};

config.webAppIsHttps = config.bot.webAppUrl.startsWith('https://');
config.upsell.enabled = Boolean(config.upsell.title && config.upsell.price > 0);

module.exports = config;
