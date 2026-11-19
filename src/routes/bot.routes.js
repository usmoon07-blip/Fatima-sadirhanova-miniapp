const config = require('../config/default');
const { botController } = require('../controllers/botController');
const { t } = require('../utils/i18n');

/** Bo'sh chatda ko'rinadigan kutib olish matni (512 belgigacha) */
const DESCRIPTION = {
  uz: "🌸 Fatima Sadirkhanova qandolatchilik kurslariga xush kelibsiz!\n\n"
    + "🎂 Uyda turib tortlar, desertlar va makaronlar pishirishni o'rganing\n"
    + "🎥 Darslarni istalgan vaqtda, o'zingizga qulay tezlikda ko'ring\n"
    + "💬 Savollaringizga kurator javob beradi\n"
    + "💳 Karta orqali qulay to'lov\n\n"
    + "👇 «Boshlash» tugmasini bosing va o'zingizga mos kursni tanlang!",
  ru: '🌸 Добро пожаловать на кондитерские курсы Фатимы Садирхановой!\n\n'
    + '🎂 Научитесь печь торты, десерты и макаруны не выходя из дома\n'
    + '🎥 Смотрите уроки в любое время, в удобном темпе\n'
    + '💬 Куратор ответит на ваши вопросы\n'
    + '💳 Удобная оплата картой\n\n'
    + '👇 Нажмите «Старт» и выберите подходящий курс!',
  en: "🌸 Welcome to Fatima Sadirkhanova's pastry courses!\n\n"
    + '🎂 Learn to bake cakes, desserts and macarons at home\n'
    + '🎥 Watch the lessons any time, at your own pace\n'
    + '💬 Our curator will answer your questions\n'
    + '💳 Easy payment by card\n\n'
    + '👇 Tap «Start» and choose the course that suits you!',
};

/** Bot profilida va ulashilganda ko'rinadigan qisqa tavsif (120 belgigacha) */
const SHORT_DESCRIPTION = {
  uz: "🎂 Fatima Sadirkhanova qandolatchilik kurslari. Uyda turib shirinlik pishirishni o'rganing!",
  ru: '🎂 Кондитерские курсы Фатимы Садирхановой. Научитесь печь десерты дома!',
  en: "🎂 Fatima Sadirkhanova's pastry courses. Learn to bake desserts at home!",
};

/** Bot qabul qiladigan yangilanishlar turlari */
const ALLOWED_UPDATES = ['message', 'callback_query', 'my_chat_member', 'chat_join_request'];

function registerBotRoutes(bot) {
  bot.command('start', botController.start);
  bot.command(['arizalarim', 'buyurtmalarim'], botController.myOrders);
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
    { command: 'arizalarim', description: { uz: 'Mening arizalarim', ru: 'Мои заявки', en: 'My enrollments' }[lang] },
    { command: 'til', description: { uz: "Tilni o'zgartirish", ru: 'Сменить язык', en: 'Change language' }[lang] },
    { command: 'yordam', description: { uz: "Bog'lanish", ru: 'Контакты', en: 'Contacts' }[lang] },
  ];
  await bot.api.setMyCommands(commands('uz'));
  await bot.api.setMyCommands(commands('ru'), { language_code: 'ru' });
  await bot.api.setMyCommands(commands('en'), { language_code: 'en' });

  // Bo'sh chatda («Botni boshlash» dan oldin) ko'rinadigan kutib olish matni va bot profilidagi qisqa tavsif
  for (const [lang, code] of [['uz', undefined], ['ru', 'ru'], ['en', 'en']]) {
    const extra = code ? { language_code: code } : {};
    await bot.api.setMyDescription(DESCRIPTION[lang], extra).catch((e) => console.warn('⚠️  Tavsif saqlanmadi:', e.message));
    await bot.api.setMyShortDescription(SHORT_DESCRIPTION[lang], extra).catch(() => {});
  }

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
