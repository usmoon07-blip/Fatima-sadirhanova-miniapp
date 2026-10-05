const { Bot } = require('grammy');
const config = require('../config/default');

let bot = null;

if (config.bot.token) {
  bot = new Bot(config.bot.token);
  bot.catch((err) => {
    console.error('❌ Bot xatosi:', err.error?.message || err.message);
  });
} else {
  console.warn('⚠️  BOT_TOKEN topilmadi — bot ishga tushmaydi (API va Admin Panel ishlayveradi).');
}

module.exports = { bot };
