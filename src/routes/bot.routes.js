const config = require('../config/default');
const botController = require('../controllers/botController');

function registerBotRoutes(bot) {
  bot.command('start', botController.start);
  bot.command(['orders', 'myorders'], botController.myOrders);
  bot.command(['contact', 'help'], botController.contactInfo);
  bot.command(['lang', 'language'], botController.askLanguage);
  bot.callbackQuery(/^lang:(uz|ru|en)$/, botController.chooseLanguage);
  bot.on('message:contact', botController.contact);
  bot.hears(botController.labels.orders, botController.myOrders);
  bot.hears(botController.labels.contact, botController.contactInfo);
  bot.hears(botController.labels.lang, botController.askLanguage);
  bot.on('message', botController.fallback);
}

/** Bot buyruqlari va standart "Menyu" tugmasini Telegram'da o'rnatadi */
async function setupBotUi(bot) {
  const commands = {
    uz: [['start', 'Boshlash'], ['orders', 'Mening buyurtmalarim'], ['contact', "Biz bilan bog'lanish"], ['lang', "Tilni o'zgartirish"]],
    ru: [['start', 'Начать'], ['orders', 'Мои заказы'], ['contact', 'Связаться с нами'], ['lang', 'Сменить язык']],
    en: [['start', 'Start'], ['orders', 'My orders'], ['contact', 'Contact us'], ['lang', 'Change language']],
  };
  const toCmd = (list) => list.map(([command, description]) => ({ command, description }));
  await bot.api.setMyCommands(toCmd(commands.uz));
  await bot.api.setMyCommands(toCmd(commands.ru), { language_code: 'ru' });
  await bot.api.setMyCommands(toCmd(commands.en), { language_code: 'en' });

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
