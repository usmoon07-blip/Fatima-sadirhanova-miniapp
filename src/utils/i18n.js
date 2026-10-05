/* Bot xabarlari uchun tarjimalar: uz | ru | en */

const LANGS = ['uz', 'ru', 'en'];

function pickLang(lang) {
  return LANGS.includes(lang) ? lang : 'uz';
}

const dict = {
  uz: {
    chooseLang: '🌐 Tilni tanlang',
    langSaved: "✅ Til o'zgartirildi: O'zbekcha",
    greetAskPhone: (name) => `Assalomu alaykum, <b>${name}</b>! 🌸\n\nBuyurtmalaringiz bo'yicha siz bilan bog'lanishimiz uchun telefon raqamingizni yuboring 👇`,
    sendPhoneBtn: '📱 Telefon raqamni yuborish',
    ownPhoneOnly: "Iltimos, o'zingizning raqamingizni tugma orqali yuboring.",
    phoneSaved: (p) => `✅ Rahmat! Raqamingiz saqlandi: ${p}`,
    welcome: (name, shop) => `Assalomu alaykum, <b>${name}</b>! 🌸\n\n<b>${shop}</b> — qo'lda tayyorlanadigan premium tortlar va shirinliklar.\n\nMenyuni ochib, sevimli shirinligingizni tanlang. Biz uni yetkazib beramiz yoki o'zingiz olib ketishingiz mumkin. 🧁`,
    openMenuHint: '👇 Buyurtma berish uchun bosing:',
    openMenuBtn: '🧁 Menyuni ochish',
    reorderBtn: '🔁 Yana buyurtma berish',
    menuButton: 'Menyu',
    notConfigured: "⚙️ Mini App manzili (WEBAPP_URL) hali sozlanmagan. Administrator ngrok manzilini .env fayliga yozishi kerak.",
    btnOrders: '📦 Buyurtmalarim',
    btnContact: "📞 Biz bilan bog'lanish",
    btnLang: '🌐 Til',
    noOrders: "Sizda hali buyurtmalar yo'q. Keling, birinchisini birga tanlaymiz! 🧁",
    lastOrders: "📦 <b>So'nggi buyurtmalaringiz:</b>",
    workingHours: 'Ish vaqti',
    openMenuShort: 'Buyurtma berish uchun menyuni oching 👇',
    orderAccepted: '✅ <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>',
    courierSoon: "Kuryerimiz tez orada siz bilan bog'lanadi 🧁",
    pickupSoon: "Buyurtmangiz tayyor bo'lishi bilan xabar beramiz 🧁",
    order: 'Buyurtma',
    items: 'Mahsulotlar',
    discount: 'Chegirma',
    delivery: 'Yetkazib berish',
    free: 'bepul',
    total: 'Jami',
    card: 'Karta',
    cardHint: "To'lovni o'tkazib, chekni shu yerga yuborishingiz mumkin yoki kuryerga terminal orqali to'lang.",
    pickupAddress: 'Olib ketish manzili',
    deliveryType: { DELIVERY: '🚚 Yetkazib berish', PICKUP: '🏪 Olib ketish' },
    payment: { CASH: '💵 Naqd', CARD: '💳 Karta orqali' },
    status: {
      NEW: '🆕 Yangi', CONFIRMED: '✅ Tasdiqlandi', PREPARING: '👩‍🍳 Tayyorlanmoqda', READY: '📦 Tayyor',
      ON_THE_WAY: "🚚 Yo'lda", DELIVERED: '🎉 Yetkazildi', CANCELLED: '❌ Bekor qilindi',
    },
    statusMsg: {
      CONFIRMED: (id) => `✅ Buyurtmangiz #${id} qabul qilindi! Tez orada tayyorlashni boshlaymiz.`,
      PREPARING: (id) => `👩‍🍳 Buyurtmangiz #${id} tayyorlanmoqda. Qandolatchimiz sehr yaratmoqda ✨`,
      READY_PICKUP: (id, addr) => `📦 Buyurtmangiz #${id} tayyor! Olib ketishingiz mumkin.${addr ? `\n📍 ${addr}` : ''}`,
      READY: (id) => `📦 Buyurtmangiz #${id} tayyor va kuryerga topshirilmoqda.`,
      ON_THE_WAY: (id) => `🚚 Buyurtmangiz #${id} kuryerga berildi va yo'lda! Kuryer tez orada qo'ng'iroq qiladi.`,
      DELIVERED: (id) => `🎉 Buyurtmangiz #${id} yetkazildi. Yoqimli ishtaha! Bizni tanlaganingiz uchun rahmat 💗`,
      CANCELLED: (id, phone) => `❌ Afsuski, buyurtmangiz #${id} bekor qilindi.${phone ? ` Savollar bo'lsa: ${phone}` : ''}`,
      CANCELLED_BY_USER: (id) => `Buyurtmangiz #${id} bekor qilindi.`,
    },
  },

  ru: {
    chooseLang: '🌐 Выберите язык',
    langSaved: '✅ Язык изменён: Русский',
    greetAskPhone: (name) => `Здравствуйте, <b>${name}</b>! 🌸\n\nОтправьте, пожалуйста, ваш номер телефона, чтобы мы могли связаться с вами по заказу 👇`,
    sendPhoneBtn: '📱 Отправить номер телефона',
    ownPhoneOnly: 'Пожалуйста, отправьте свой номер с помощью кнопки.',
    phoneSaved: (p) => `✅ Спасибо! Номер сохранён: ${p}`,
    welcome: (name, shop) => `Здравствуйте, <b>${name}</b>! 🌸\n\n<b>${shop}</b> — премиальные торты и десерты ручной работы.\n\nОткройте меню и выберите любимый десерт. Мы доставим его или вы сможете забрать заказ сами. 🧁`,
    openMenuHint: '👇 Нажмите, чтобы сделать заказ:',
    openMenuBtn: '🧁 Открыть меню',
    reorderBtn: '🔁 Заказать снова',
    menuButton: 'Меню',
    notConfigured: '⚙️ Адрес Mini App (WEBAPP_URL) ещё не настроен.',
    btnOrders: '📦 Мои заказы',
    btnContact: '📞 Связаться с нами',
    btnLang: '🌐 Язык',
    noOrders: 'У вас пока нет заказов. Давайте выберем первый вместе! 🧁',
    lastOrders: '📦 <b>Ваши последние заказы:</b>',
    workingHours: 'Время работы',
    openMenuShort: 'Откройте меню, чтобы сделать заказ 👇',
    orderAccepted: '✅ <b>Ваш заказ успешно принят!</b>',
    courierSoon: 'Наш курьер скоро свяжется с вами 🧁',
    pickupSoon: 'Сообщим, как только заказ будет готов 🧁',
    order: 'Заказ',
    items: 'Товары',
    discount: 'Скидка',
    delivery: 'Доставка',
    free: 'бесплатно',
    total: 'Итого',
    card: 'Карта',
    cardHint: 'Вы можете перевести оплату и отправить чек сюда или оплатить курьеру через терминал.',
    pickupAddress: 'Адрес самовывоза',
    deliveryType: { DELIVERY: '🚚 Доставка', PICKUP: '🏪 Самовывоз' },
    payment: { CASH: '💵 Наличные', CARD: '💳 Картой' },
    status: {
      NEW: '🆕 Новый', CONFIRMED: '✅ Принят', PREPARING: '👩‍🍳 Готовится', READY: '📦 Готов',
      ON_THE_WAY: '🚚 В пути', DELIVERED: '🎉 Доставлен', CANCELLED: '❌ Отменён',
    },
    statusMsg: {
      CONFIRMED: (id) => `✅ Ваш заказ #${id} принят! Скоро начнём готовить.`,
      PREPARING: (id) => `👩‍🍳 Ваш заказ #${id} готовится. Наш кондитер творит волшебство ✨`,
      READY_PICKUP: (id, addr) => `📦 Ваш заказ #${id} готов! Можете забирать.${addr ? `\n📍 ${addr}` : ''}`,
      READY: (id) => `📦 Ваш заказ #${id} готов и передаётся курьеру.`,
      ON_THE_WAY: (id) => `🚚 Ваш заказ #${id} передан курьеру и уже в пути! Курьер скоро позвонит.`,
      DELIVERED: (id) => `🎉 Ваш заказ #${id} доставлен. Приятного аппетита! Спасибо, что выбрали нас 💗`,
      CANCELLED: (id, phone) => `❌ К сожалению, ваш заказ #${id} отменён.${phone ? ` Вопросы: ${phone}` : ''}`,
      CANCELLED_BY_USER: (id) => `Ваш заказ #${id} отменён.`,
    },
  },

  en: {
    chooseLang: '🌐 Choose a language',
    langSaved: '✅ Language changed: English',
    greetAskPhone: (name) => `Hello, <b>${name}</b>! 🌸\n\nPlease share your phone number so we can contact you about your orders 👇`,
    sendPhoneBtn: '📱 Share phone number',
    ownPhoneOnly: 'Please share your own number using the button.',
    phoneSaved: (p) => `✅ Thank you! Your number is saved: ${p}`,
    welcome: (name, shop) => `Hello, <b>${name}</b>! 🌸\n\n<b>${shop}</b> — handmade premium cakes and desserts.\n\nOpen the menu and choose your favourite treat. We'll deliver it, or you can pick it up yourself. 🧁`,
    openMenuHint: '👇 Tap to place an order:',
    openMenuBtn: '🧁 Open menu',
    reorderBtn: '🔁 Order again',
    menuButton: 'Menu',
    notConfigured: '⚙️ The Mini App URL (WEBAPP_URL) is not configured yet.',
    btnOrders: '📦 My orders',
    btnContact: '📞 Contact us',
    btnLang: '🌐 Language',
    noOrders: "You don't have any orders yet. Let's pick the first one together! 🧁",
    lastOrders: '📦 <b>Your recent orders:</b>',
    workingHours: 'Opening hours',
    openMenuShort: 'Open the menu to place an order 👇',
    orderAccepted: '✅ <b>Your order has been received!</b>',
    courierSoon: 'Our courier will contact you shortly 🧁',
    pickupSoon: "We'll let you know as soon as your order is ready 🧁",
    order: 'Order',
    items: 'Items',
    discount: 'Discount',
    delivery: 'Delivery',
    free: 'free',
    total: 'Total',
    card: 'Card',
    cardHint: 'You can transfer the payment and send the receipt here, or pay the courier by card terminal.',
    pickupAddress: 'Pickup address',
    deliveryType: { DELIVERY: '🚚 Delivery', PICKUP: '🏪 Pickup' },
    payment: { CASH: '💵 Cash', CARD: '💳 Card' },
    status: {
      NEW: '🆕 New', CONFIRMED: '✅ Accepted', PREPARING: '👩‍🍳 Preparing', READY: '📦 Ready',
      ON_THE_WAY: '🚚 On the way', DELIVERED: '🎉 Delivered', CANCELLED: '❌ Cancelled',
    },
    statusMsg: {
      CONFIRMED: (id) => `✅ Your order #${id} has been accepted! We'll start preparing it soon.`,
      PREPARING: (id) => `👩‍🍳 Your order #${id} is being prepared. Our pastry chef is working magic ✨`,
      READY_PICKUP: (id, addr) => `📦 Your order #${id} is ready for pickup!${addr ? `\n📍 ${addr}` : ''}`,
      READY: (id) => `📦 Your order #${id} is ready and being handed to the courier.`,
      ON_THE_WAY: (id) => `🚚 Your order #${id} is on the way! The courier will call you soon.`,
      DELIVERED: (id) => `🎉 Your order #${id} has been delivered. Enjoy! Thank you for choosing us 💗`,
      CANCELLED: (id, phone) => `❌ Unfortunately, your order #${id} was cancelled.${phone ? ` Questions: ${phone}` : ''}`,
      CANCELLED_BY_USER: (id) => `Your order #${id} has been cancelled.`,
    },
  },
};

function t(lang) {
  return dict[pickLang(lang)];
}

/** Barcha tillardagi tugma matni (bot.hears uchun) */
function allLabels(key) {
  return LANGS.map((l) => dict[l][key]);
}

const LANG_BUTTONS = [
  [{ text: "🇺🇿 O'zbekcha", callback_data: 'lang:uz' }],
  [{ text: '🇷🇺 Русский', callback_data: 'lang:ru' }],
  [{ text: '🇬🇧 English', callback_data: 'lang:en' }],
];

module.exports = { t, pickLang, allLabels, LANGS, LANG_BUTTONS };
