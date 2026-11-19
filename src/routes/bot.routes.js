const config = require('../config/default');
const { botController } = require('../controllers/botController');
const { t } = require('../utils/i18n');

/** Bot qabul qiladigan yangilanishlar turlari */
const ALLOWED_UPDATES = ['message', 'callback_query', 'my_chat_member', 'chat_join_request'];

function registerBotRoutes(bot) {
  bot.command('start', botController.start);
  bot.command('buyurtmalarim', botController.myOrders);
  bot.command(['yordam', 'help'], botController.help);
  bot.command('telefon', botController.askPhone);
  bot.command(['til', 'lang', 'language'], botController.chooseLanguage);
  bot.callbackQuery(/^lang:(uz|ru|en)$/, botController.setLanguage);
  bot.callbackQuery(/^ord:(PAID|CANCELLED):(\d+)$/, botController.ownerOrderAction);
  bot.on('my_chat_member', botController.myChatMember);
  bot.on('chat_join_request', botController.joinRequest);
  bot.on('message:contact', botController.contact);
  bot.on(['message:photo', 'message:document'], botController.receiptPhoto);
  bot.on('message:text', (ctx, next) => (ctx.chat.type === 'private' ? botController.start(ctx) : next()));
}

/** Bot menyusi: har bir til uchun buyruqlar va "Kurslar" tugmasi (Mini App) */
async function setupBotUi(bot) {
  const commands = (lang) => [
    { command: 'start', description: { uz: 'Bosh menyu', ru: 'Главное меню', en: 'Main menu' }[lang] },
    { command: 'buyurtmalarim', description: { uz: 'Mening buyurtmalarim', ru: 'Мои заказы', en: 'My orders' }[lang] },
    { command: 'til', description: { uz: "Tilni o'zgartirish", ru: 'Сменить язык', en: 'Change language' }[lang] },
    { command: 'yordam', description: { uz: "Bog'lanish", ru: 'Контакты', en: 'Contacts' }[lang] },
  ];
  await bot.api.setMyCommands(commands('uz'));
  await bot.api.setMyCommands(commands('ru'), { language_code: 'ru' });
  await bot.api.setMyCommands(commands('en'), { language_code: 'en' });

  if (config.webAppIsHttps) {
    await bot.api.setChatMenuButton({
      menu_button: { type: 'web_app', text: t('uz', 'menuButton'), web_app: { url: config.bot.webAppUrl } },
    });
    console.log(`📱 Mini App tugmasi ulandi: ${config.bot.webAppUrl}`);
  } else {
    await bot.api.setChatMenuButton({ menu_button: { type: 'commands' } });
    console.warn('⚠️  WEBAPP_URL https emas — Mini App tugmasi chiqmaydi.');
  }
}

module.exports = { registerBotRoutes, setupBotUi, ALLOWED_UPDATES };
