const config = require('../config/default');
const { botController } = require('../controllers/botController');

function registerBotRoutes(bot) {
  bot.command('start', botController.start);
  bot.command('buyurtmalarim', botController.myOrders);
  bot.command('yordam', botController.help);
  bot.command('telefon', botController.askPhone);
  bot.on('message:contact', botController.contact);
  bot.on(['message:photo', 'message:document'], botController.receiptPhoto);
  bot.on('message:text', botController.start);
}

/** Bot menyusi: buyruqlar ro'yxati va "Kurslar" tugmasi (Mini App) */
async function setupBotUi(bot) {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Bosh menyu' },
    { command: 'buyurtmalarim', description: 'Mening buyurtmalarim' },
    { command: 'yordam', description: "Bog'lanish" },
  ]);
  if (config.webAppIsHttps) {
    await bot.api.setChatMenuButton({
      menu_button: { type: 'web_app', text: 'Kurslar', web_app: { url: config.bot.webAppUrl } },
    });
    console.log(`📱 Mini App tugmasi ulandi: ${config.bot.webAppUrl}`);
  } else {
    await bot.api.setChatMenuButton({ menu_button: { type: 'commands' } });
    console.warn('⚠️  WEBAPP_URL https emas — Mini App tugmasi chiqmaydi. ngrok manzilini .env ga yozing.');
  }
}

module.exports = { registerBotRoutes, setupBotUi };
