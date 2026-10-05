const config = require('../config/default');
const { bot } = require('../core/bot');
const User = require('../models/User');
const Order = require('../models/Order');
const { money, dateTime, escapeHtml, normalizePhone } = require('../utils/format');
const { t, pickLang, allLabels, LANG_BUTTONS } = require('../utils/i18n');

function langOf(user) {
  return pickLang(user?.language);
}

function mainKeyboard(lang) {
  const tr = t(lang);
  return {
    keyboard: [[{ text: tr.btnOrders }, { text: tr.btnContact }], [{ text: tr.btnLang }]],
    resize_keyboard: true,
    is_persistent: true,
  };
}

function phoneKeyboard(lang) {
  return {
    keyboard: [[{ text: t(lang).sendPhoneBtn, request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

function webAppUrl(lang) {
  return `${config.bot.webAppUrl}/?lang=${lang}`;
}

function openAppMarkup(lang, text) {
  if (!config.webAppIsHttps) return undefined;
  return { inline_keyboard: [[{ text: text || t(lang).openMenuBtn, web_app: { url: webAppUrl(lang) } }]] };
}

/** Har bir foydalanuvchi uchun "Menyu" tugmasini o'z tilida o'rnatadi */
async function setUserMenuButton(chatId, lang) {
  if (!bot || !config.webAppIsHttps) return;
  await bot.api.setChatMenuButton({
    chat_id: Number(chatId),
    menu_button: { type: 'web_app', text: t(lang).menuButton, web_app: { url: webAppUrl(lang) } },
  }).catch(() => {});
}

function itemName(item, lang) {
  if (lang === 'ru' && item.nameRu) return item.nameRu;
  if (lang === 'en' && item.nameEn) return item.nameEn;
  return item.name;
}

function courseTitle(enrollment, lang) {
  const c = enrollment.course;
  if (c && lang === 'ru' && c.titleRu) return c.titleRu;
  if (c && lang === 'en' && c.titleEn) return c.titleEn;
  return enrollment.courseTitle;
}

function itemsText(items, lang = 'uz') {
  return (items || [])
    .map((i) => `• ${escapeHtml(itemName(i, lang))}${i.size ? ` (${escapeHtml(i.size)})` : ''} × ${i.quantity} — ${money(i.total)}`)
    .join('\n');
}

function orderSummary(order, lang) {
  const tr = t(lang);
  const lines = [
    `🧾 <b>${tr.order} #${order.id}</b>`,
    '',
    itemsText(order.items, lang),
    '',
    `${tr.items}: ${money(order.subtotal)}`,
  ];
  if (order.deliveryType === 'DELIVERY') {
    lines.push(`${tr.delivery}: ${order.deliveryFee ? money(order.deliveryFee) : tr.free}`);
  }
  lines.push(
    `<b>${tr.total}: ${money(order.total)}</b>`,
    '',
    tr.deliveryType[order.deliveryType],
    tr.payment[order.paymentMethod],
  );
  if (order.deliveryType === 'DELIVERY' && order.address) lines.push(`📍 ${escapeHtml(order.address)}`);
  if (order.deliveryTime) lines.push(`⏰ ${escapeHtml(order.deliveryTime)}`);
  return lines.join('\n');
}

async function sendWelcome(ctx, user) {
  const lang = langOf(user);
  const tr = t(lang);
  await ctx.reply(tr.welcome(escapeHtml(user.firstName || '🙂'), escapeHtml(config.shop.name)), {
    parse_mode: 'HTML',
    reply_markup: mainKeyboard(lang),
  });
  const markup = openAppMarkup(lang);
  if (markup) await ctx.reply(tr.openMenuHint, { reply_markup: markup });
  else await ctx.reply(tr.notConfigured);
}

async function askLanguage(ctx) {
  await ctx.reply("🌐 Tilni tanlang\n🌐 Выберите язык\n🌐 Choose a language", {
    reply_markup: { inline_keyboard: LANG_BUTTONS },
  });
}

async function continueOnboarding(ctx, user) {
  const lang = langOf(user);
  if (!user.phone) {
    await ctx.reply(t(lang).greetAskPhone(escapeHtml(user.firstName || '🙂')), {
      parse_mode: 'HTML',
      reply_markup: phoneKeyboard(lang),
    });
    return;
  }
  await sendWelcome(ctx, user);
}

const botController = {
  async start(ctx) {
    const user = await User.upsertFromTelegram(ctx.from);
    if (!user.language) return askLanguage(ctx);
    return continueOnboarding(ctx, user);
  },

  askLanguage,

  async chooseLanguage(ctx) {
    const lang = pickLang(ctx.match[1]);
    await User.upsertFromTelegram(ctx.from);
    const user = await User.setLanguage(ctx.from.id, lang);
    await ctx.answerCallbackQuery({ text: t(lang).langSaved });
    await ctx.deleteMessage().catch(() => {});
    await setUserMenuButton(ctx.from.id, lang);
    await continueOnboarding(ctx, user);
  },

  async contact(ctx) {
    const contact = ctx.message.contact;
    const existing = await User.upsertFromTelegram(ctx.from);
    const lang = langOf(existing);
    if (contact.user_id && contact.user_id !== ctx.from.id) {
      await ctx.reply(t(lang).ownPhoneOnly, { reply_markup: phoneKeyboard(lang) });
      return;
    }
    const phone = normalizePhone(contact.phone_number) || contact.phone_number;
    const user = await User.setPhone(ctx.from.id, phone);
    await ctx.reply(t(lang).phoneSaved(user.phone));
    if (!user.language) return askLanguage(ctx);
    return sendWelcome(ctx, user);
  },

  async myOrders(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    const lang = langOf(user);
    const tr = t(lang);
    const orders = user ? await Order.listByUser(user.id, 5) : [];
    if (orders.length === 0) {
      await ctx.reply(tr.noOrders, { reply_markup: openAppMarkup(lang) });
      return;
    }
    const text = orders
      .map((o) => `<b>#${o.id}</b> · ${dateTime(o.createdAt)}\n${tr.status[o.status]} · ${money(o.total)}`)
      .join('\n\n');
    await ctx.reply(`${tr.lastOrders}\n\n${text}`, { parse_mode: 'HTML', reply_markup: openAppMarkup(lang, tr.reorderBtn) });
  },

  async contactInfo(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    const tr = t(langOf(user));
    const { shop } = config;
    const lines = [`<b>${escapeHtml(shop.name)}</b>`];
    if (shop.phone) lines.push(`📞 ${escapeHtml(shop.phone)}`);
    if (shop.address) lines.push(`📍 ${escapeHtml(shop.address)}`);
    if (shop.workingHours) lines.push(`🕘 ${tr.workingHours}: ${escapeHtml(shop.workingHours)}`);
    await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
    if (shop.lat && shop.lng) await ctx.replyWithLocation(shop.lat, shop.lng);
  },

  async fallback(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    if (!user?.language || !user?.phone) return botController.start(ctx);
    const lang = langOf(user);
    await ctx.reply(t(lang).openMenuShort, { reply_markup: openAppMarkup(lang) || mainKeyboard(lang) });
    return undefined;
  },

  labels: {
    orders: allLabels('btnOrders'),
    contact: allLabels('btnContact'),
    lang: allLabels('btnLang'),
  },

  // ================= Bildirishnomalar =================

  async notifyOrderCreated(order) {
    if (!bot || !order.user?.telegramId) return;
    const lang = langOf(order.user);
    const tr = t(lang);
    const chatId = order.user.telegramId;
    const lines = [
      tr.orderAccepted,
      order.deliveryType === 'DELIVERY' ? tr.courierSoon : tr.pickupSoon,
      '',
      orderSummary(order, lang),
    ];
    if (order.paymentMethod === 'CARD' && config.shop.cardNumber) {
      lines.push('', `💳 ${tr.card}: <code>${escapeHtml(config.shop.cardNumber)}</code>${config.shop.cardHolder ? `\n👤 ${escapeHtml(config.shop.cardHolder)}` : ''}`, tr.cardHint);
    }
    if (order.deliveryType === 'PICKUP' && config.shop.address) {
      lines.push('', `🏪 ${tr.pickupAddress}: ${escapeHtml(config.shop.address)}`);
    }
    await bot.api.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
    if (order.deliveryType === 'PICKUP' && config.shop.lat && config.shop.lng) {
      await bot.api.sendLocation(chatId, config.shop.lat, config.shop.lng);
    }
  },

  async notifyStatusChanged(order) {
    if (!bot || !order.user?.telegramId) return;
    const m = t(langOf(order.user)).statusMsg;
    let text = null;
    if (order.status === 'CANCELLED') {
      text = order.cancelledBy === 'customer' ? m.CANCELLED_BY_USER(order.id) : m.CANCELLED(order.id, config.shop.phone);
    } else if (order.status === 'READY') {
      text = order.deliveryType === 'PICKUP' ? m.READY_PICKUP(order.id, config.shop.address) : m.READY(order.id);
    } else if (m[order.status]) {
      text = m[order.status](order.id);
    }
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
      `${t('uz').payment[order.paymentMethod]} · <b>${money(order.total)}</b>`,
    ].filter((l) => l !== null);
    await bot.api.sendMessage(config.bot.courierChatId, lines.join('\n'), { parse_mode: 'HTML' });
    if (order.latitude && order.longitude) {
      await bot.api.sendLocation(config.bot.courierChatId, order.latitude, order.longitude);
    }
  },

  // ================= Kurslar =================

  async notifyEnrollmentCreated(enrollment) {
    if (!bot || !enrollment.user?.telegramId) return;
    const lang = langOf(enrollment.user);
    const tr = t(lang);
    const title = escapeHtml(courseTitle(enrollment, lang));
    const lines = [
      tr.enrollAccepted(title, tr.format[enrollment.format]),
      '',
      `${tr.price}: <b>${money(enrollment.price)}</b>`,
      tr.payment[enrollment.paymentMethod],
    ];
    if (enrollment.paymentMethod === 'CARD' && config.shop.cardNumber) {
      lines.push(`💳 <code>${escapeHtml(config.shop.cardNumber)}</code>${config.shop.cardHolder ? ` · ${escapeHtml(config.shop.cardHolder)}` : ''}`);
    }
    await bot.api.sendMessage(enrollment.user.telegramId, lines.join('\n'), { parse_mode: 'HTML' });
  },

  async notifyEnrollmentStatus(enrollment) {
    if (!bot || !enrollment.user?.telegramId) return;
    const lang = langOf(enrollment.user);
    const fn = t(lang).enrollStatus[enrollment.status];
    if (fn) await bot.api.sendMessage(enrollment.user.telegramId, fn(courseTitle(enrollment, lang)));
  },

  setUserMenuButton,
};

module.exports = botController;
