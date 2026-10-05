const config = require('../config/default');
const { bot } = require('../core/bot');
const User = require('../models/User');
const Order = require('../models/Order');
const {
  money, dateTime, escapeHtml, normalizePhone, STATUS_LABELS, DELIVERY_LABELS, PAYMENT_LABELS,
} = require('../utils/format');

const BTN_ORDERS = '📦 Buyurtmalarim';
const BTN_CONTACT = "📞 Biz bilan bog'lanish";

const mainKeyboard = {
  keyboard: [[{ text: BTN_ORDERS }, { text: BTN_CONTACT }]],
  resize_keyboard: true,
  is_persistent: true,
};

const phoneKeyboard = {
  keyboard: [[{ text: '📱 Telefon raqamni yuborish', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

function openAppMarkup(text = '🧁 Menyuni ochish') {
  if (!config.webAppIsHttps) return undefined;
  return { inline_keyboard: [[{ text, web_app: { url: config.bot.webAppUrl } }]] };
}

function itemsText(items) {
  return (items || [])
    .map((i) => `• ${escapeHtml(i.name)}${i.size ? ` (${escapeHtml(i.size)})` : ''} × ${i.quantity} — ${money(i.total)}`)
    .join('\n');
}

function orderSummary(order) {
  const lines = [
    `🧾 <b>Buyurtma #${order.id}</b>`,
    '',
    itemsText(order.items),
    '',
    `Mahsulotlar: ${money(order.subtotal)}`,
  ];
  if (order.deliveryType === 'DELIVERY') {
    lines.push(`Yetkazib berish: ${order.deliveryFee ? money(order.deliveryFee) : 'bepul'}`);
  }
  lines.push(
    `<b>Jami: ${money(order.total)}</b>`,
    '',
    `${DELIVERY_LABELS[order.deliveryType]}`,
    `${PAYMENT_LABELS[order.paymentMethod]}`,
  );
  if (order.deliveryType === 'DELIVERY' && order.address) lines.push(`📍 ${escapeHtml(order.address)}`);
  if (order.deliveryTime) lines.push(`⏰ ${escapeHtml(order.deliveryTime)}`);
  return lines.join('\n');
}

async function sendWelcome(ctx, user) {
  const name = escapeHtml(user.firstName || 'mehmon');
  const text = [
    `Assalomu alaykum, <b>${name}</b>! 🌸`,
    '',
    `<b>${escapeHtml(config.shop.name)}</b> — qo'lda tayyorlanadigan premium tortlar va shirinliklar.`,
    '',
    "Menyuni ochib, sevimli shirinligingizni tanlang. Biz uni yetkazib beramiz yoki o'zingiz olib ketishingiz mumkin. 🧁",
  ].join('\n');

  await ctx.reply(text, { parse_mode: 'HTML', reply_markup: mainKeyboard });
  const markup = openAppMarkup();
  if (markup) {
    await ctx.reply('👇 Buyurtma berish uchun bosing:', { reply_markup: markup });
  } else {
    await ctx.reply("⚙️ Mini App manzili (WEBAPP_URL) hali sozlanmagan. Administrator ngrok manzilini .env fayliga yozishi kerak.");
  }
}

const botController = {
  async start(ctx) {
    const user = await User.upsertFromTelegram(ctx.from);
    if (!user.phone) {
      await ctx.reply(
        `Assalomu alaykum, <b>${escapeHtml(user.firstName || 'mehmon')}</b>! 🌸\n\nBuyurtmalaringiz bo'yicha siz bilan bog'lanishimiz uchun telefon raqamingizni yuboring 👇`,
        { parse_mode: 'HTML', reply_markup: phoneKeyboard },
      );
      return;
    }
    await sendWelcome(ctx, user);
  },

  async contact(ctx) {
    const contact = ctx.message.contact;
    if (contact.user_id && contact.user_id !== ctx.from.id) {
      await ctx.reply("Iltimos, o'zingizning raqamingizni tugma orqali yuboring.", { reply_markup: phoneKeyboard });
      return;
    }
    await User.upsertFromTelegram(ctx.from);
    const phone = normalizePhone(contact.phone_number);
    const user = await User.setPhone(ctx.from.id, phone || contact.phone_number);
    await ctx.reply(`✅ Rahmat! Raqamingiz saqlandi: ${user.phone}`);
    await sendWelcome(ctx, user);
  },

  async myOrders(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    const orders = user ? await Order.listByUser(user.id, 5) : [];
    if (orders.length === 0) {
      await ctx.reply("Sizda hali buyurtmalar yo'q. Keling, birinchisini birga tanlaymiz! 🧁", { reply_markup: openAppMarkup() });
      return;
    }
    const text = orders
      .map((o) => `<b>#${o.id}</b> · ${dateTime(o.createdAt)}\n${STATUS_LABELS[o.status]} · ${money(o.total)}`)
      .join('\n\n');
    await ctx.reply(`📦 <b>So'nggi buyurtmalaringiz:</b>\n\n${text}`, { parse_mode: 'HTML', reply_markup: openAppMarkup('🔁 Yana buyurtma berish') });
  },

  async contactInfo(ctx) {
    const { shop } = config;
    const lines = [`<b>${escapeHtml(shop.name)}</b>`];
    if (shop.phone) lines.push(`📞 ${escapeHtml(shop.phone)}`);
    if (shop.address) lines.push(`📍 ${escapeHtml(shop.address)}`);
    if (shop.workingHours) lines.push(`🕘 Ish vaqti: ${escapeHtml(shop.workingHours)}`);
    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
    if (shop.lat && shop.lng) await ctx.replyWithLocation(shop.lat, shop.lng);
  },

  async fallback(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user?.phone) return botController.start(ctx);
    await ctx.reply('Buyurtma berish uchun menyuni oching 👇', { reply_markup: openAppMarkup() || mainKeyboard });
  },

  // ================= Bildirishnomalar =================

  async notifyOrderCreated(order) {
    if (!bot || !order.user?.telegramId) return;
    const chatId = order.user.telegramId;
    const lines = [
      "✅ <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>",
      order.deliveryType === 'DELIVERY'
        ? 'Kuryerimiz tez orada siz bilan bog\'lanadi 🧁'
        : "Buyurtmangiz tayyor bo'lishi bilan xabar beramiz 🧁",
      '',
      orderSummary(order),
    ];
    if (order.paymentMethod === 'CARD' && config.shop.cardNumber) {
      lines.push('', `💳 Karta: <code>${escapeHtml(config.shop.cardNumber)}</code>${config.shop.cardHolder ? `\n👤 ${escapeHtml(config.shop.cardHolder)}` : ''}`,
        "To'lovni o'tkazib, chekni shu yerga yuborishingiz mumkin yoki kuryerga terminal orqali to'lang.");
    }
    if (order.deliveryType === 'PICKUP' && config.shop.address) {
      lines.push('', `🏪 Olib ketish manzili: ${escapeHtml(config.shop.address)}`);
    }
    await bot.api.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
    if (order.deliveryType === 'PICKUP' && config.shop.lat && config.shop.lng) {
      await bot.api.sendLocation(chatId, config.shop.lat, config.shop.lng);
    }
  },

  async notifyStatusChanged(order) {
    if (!bot || !order.user?.telegramId) return;
    const messages = {
      CONFIRMED: `✅ Buyurtmangiz #${order.id} tasdiqlandi! Tez orada tayyorlashni boshlaymiz.`,
      PREPARING: `👩‍🍳 Buyurtmangiz #${order.id} tayyorlanmoqda. Qandolatchimiz sehr yaratmoqda ✨`,
      READY: order.deliveryType === 'PICKUP'
        ? `📦 Buyurtmangiz #${order.id} tayyor! Olib ketishingiz mumkin.\n📍 ${config.shop.address}`
        : `📦 Buyurtmangiz #${order.id} tayyor va kuryerga topshirilmoqda.`,
      ON_THE_WAY: `🚚 Buyurtmangiz #${order.id} kuryerga berildi va yo'lda! Kuryer tez orada qo'ng'iroq qiladi.`,
      DELIVERED: `🎉 Buyurtmangiz #${order.id} yetkazildi. Yoqimli ishtaha! Bizni tanlaganingiz uchun rahmat 💗`,
      CANCELLED: `❌ Afsuski, buyurtmangiz #${order.id} bekor qilindi. Savollar bo'lsa: ${config.shop.phone}`,
    };
    const text = messages[order.status];
    if (text) await bot.api.sendMessage(order.user.telegramId, text);
  },

  /** Buyurtmani kuryerlar guruhiga yuboradi (COURIER_CHAT_ID sozlangan bo'lsa) */
  async dispatchToCourier(order) {
    if (!bot || !config.bot.courierChatId || order.deliveryType !== 'DELIVERY') return;
    const lines = [
      `🚚 <b>Yangi yetkazma — #${order.id}</b>`,
      '',
      `👤 ${escapeHtml(order.customerName)}`,
      `📞 ${escapeHtml(order.phone)}`,
      order.address ? `📍 ${escapeHtml(order.address)}` : null,
      order.deliveryTime ? `⏰ ${escapeHtml(order.deliveryTime)}` : null,
      order.comment ? `💬 ${escapeHtml(order.comment)}` : null,
      '',
      itemsText(order.items),
      '',
      `${PAYMENT_LABELS[order.paymentMethod]} · <b>${money(order.total)}</b>`,
    ].filter((l) => l !== null);
    await bot.api.sendMessage(config.bot.courierChatId, lines.join('\n'), { parse_mode: 'HTML' });
    if (order.latitude && order.longitude) {
      await bot.api.sendLocation(config.bot.courierChatId, order.latitude, order.longitude);
    }
  },
};

botController.BTN_ORDERS = BTN_ORDERS;
botController.BTN_CONTACT = BTN_CONTACT;

module.exports = botController;
