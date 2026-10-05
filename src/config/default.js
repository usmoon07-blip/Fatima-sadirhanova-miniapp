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
    courierChatId: (process.env.COURIER_CHAT_ID || '').trim(),
  },

  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin',
    jwtSecret: process.env.JWT_SECRET || 'change-me-please',
    tokenTtl: '7d',
  },

  shop: {
    name: process.env.SHOP_NAME || 'Fatima Sadirhanova',
    tagline: process.env.SHOP_TAGLINE || 'PATISSERIE',
    phone: process.env.SHOP_PHONE || '',
    address: process.env.SHOP_ADDRESS || '',
    lat: process.env.SHOP_LAT ? num(process.env.SHOP_LAT, null) : null,
    lng: process.env.SHOP_LNG ? num(process.env.SHOP_LNG, null) : null,
    workingHours: process.env.SHOP_WORKING_HOURS || '',
    cardNumber: process.env.CARD_NUMBER || '',
    cardHolder: process.env.CARD_HOLDER || '',
  },

  delivery: {
    fee: num(process.env.DELIVERY_FEE, 25000),
    freeFrom: num(process.env.FREE_DELIVERY_FROM, 0),
    minOrder: num(process.env.MIN_ORDER_AMOUNT, 0),
  },
};

config.webAppIsHttps = config.bot.webAppUrl.startsWith('https://');

module.exports = config;
