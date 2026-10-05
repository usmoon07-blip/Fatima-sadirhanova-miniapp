const config = require('../config/default');
const botController = require('../controllers/botController');

function registerBotRoutes(bot) {
  bot.command('start', botController.start);
  bot.command(['orders', 'myorders'], botController.myOrders);
  bot.command(['contact', 'help'], botController.contactInfo);
  bot.on('message:contact', botController.contact);
  bot.hears(botController.BTN_ORDERS, botController.myOrders);
  bot.hears(botController.BTN_CONTACT, botController.contactInfo);
  bot.on('message', botController.fallback);
}

/** Bot buyruqlari va "Menyu" tugmasini Telegram'da o'rnatadi */
async function setupBotUi(bot) {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Boshlash' },
    { command: 'orders', description: 'Mening buyurtmalarim' },
    { command: 'contact', description: "Biz bilan bog'lanish" },
  ]);

  if (config.webAppIsHttps) {
    await bot.api.setChatMenuButton({
      menu_button: { type: 'web_app', text: 'Menyu', web_app: { url: config.bot.webAppUrl } },
    });
    console.log(`✅ Bot "Menyu" tugmasi ulandi: ${config.bot.webAppUrl}`);
  } else {
    console.warn('⚠️  WEBAPP_URL https bilan boshlanmaydi — Mini App tugmasi ko\'rinmaydi. ngrok manzilini .env ga yozing.');
  }
}

module.exports = { registerBotRoutes, setupBotUi };
