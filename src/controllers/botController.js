const { InlineKeyboard, Keyboard, InputFile } = require('grammy');
const config = require('../config/default');
const { bot } = require('../core/bot');
const User = require('../models/User');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Setting = require('../models/Setting');
const Upload = require('../models/Upload');
const Channel = require('../models/Channel');
const { ensureAccess, decideJoinRequest } = require('../services/access');
const payments = require('../services/payments');
const { money, escapeHtml, fullName } = require('../utils/format');
const { t, loc, normalizeLang } = require('../utils/i18n');

const LANG_BUTTONS = [['uz', "🇺🇿 O'zbekcha"], ['ru', '🇷🇺 Русский'], ['en', '🇬🇧 English']];

const langOf = (user, from) => user?.language || normalizeLang(from?.language_code);
const isOwner = (id) => Boolean(config.bot.ownerId) && String(id) === config.bot.ownerId;

function appKeyboard(lang, withLangs = false) {
  const kb = new InlineKeyboard();
  if (config.webAppIsHttps) kb.webApp(t(lang, 'openApp'), config.bot.webAppUrl).row();
  if (withLangs) LANG_BUTTONS.forEach(([code, label]) => kb.text(code === lang ? `• ${label}` : label, `lang:${code}`));
  return kb.inline_keyboard.length && kb.inline_keyboard[0].length ? kb : undefined;
}

function itemsText(items, lang) {
  return (Array.isArray(items) ? items : [])
    .map((i) => `• ${escapeHtml(i.title)} — <b>${money(i.price)}</b>`)
    .join('\n');
}

/** Foydalanuvchining shaxsiy menyu tugmasini uning tilida o'rnatadi */
async function setUserMenuButton(chatId, lang) {
  if (!bot || !config.webAppIsHttps) return;
  await bot.api.setChatMenuButton({
    chat_id: Number(chatId),
    menu_button: { type: 'web_app', text: t(lang, 'menuButton'), web_app: { url: config.bot.webAppUrl } },
  }).catch(() => {});
}

function startText(lang, name) {
  return `${t(lang, 'greeting', { name: escapeHtml(name) })}\n\n${t(lang, 'startBody', { shop: `<b>${escapeHtml(config.shop.name)}</b>` })}`;
}

/** /start: uch tildagi kutib olish matni (bitta xabarda) va til tanlash */
function welcomeText(name) {
  const n = escapeHtml(name);
  return [
    `🇺🇿 <b>Assalomu alaykum, ${n}!</b> 👋`,
    '',
    "Fatima Sadirkhanova qandolatchilik kurslariga xush kelibsiz! 🌸 Darsga yozilish uchun quyidagi «Ochish» tugmasini bosing.",
    '',
    "Savollaringiz bo'lsa, shu yerga yozib qoldiring — albatta javob beramiz. 💬",
    '',
    '',
    `🇷🇺 <b>Здравствуйте, ${n}!</b> 👋`,
    '',
    'Добро пожаловать на кондитерские курсы Фатимы Садирхановой! 🌸 Чтобы записаться на урок, нажмите кнопку «Открыть» ниже.',
    '',
    'Если у вас есть вопросы, напишите их сюда — мы обязательно ответим. 💬',
    '',
    '',
    `🇬🇧 <b>Hello, ${n}!</b> 👋`,
    '',
    "Welcome to Fatima Sadirkhanova's pastry courses! 🌸 To sign up for a lesson, tap the «Open» button below.",
    '',
    "If you have any questions, write them here — we'll be sure to reply. 💬",
    '',
    '',
    '🌐 <b>Tilni tanlang / Выберите язык / Choose language</b> 👇',
  ].join('\n');
}

function welcomeKeyboard() {
  const kb = new InlineKeyboard();
  if (config.webAppIsHttps) kb.webApp('📚 Ochish / Открыть / Open', config.bot.webAppUrl).row();
  LANG_BUTTONS.forEach(([code, label]) => kb.text(label, `lang:${code}`));
  return kb;
}

/** Bot egasiga xabar (egasi botga kamida bir marta /start bosgan bo'lishi kerak) */
async function toOwner(text, extra = {}) {
  if (!bot || !config.bot.ownerId) return;
  await bot.api.sendMessage(config.bot.ownerId, text, { parse_mode: 'HTML', ...extra })
    .catch((e) => console.warn('⚠️  Egaga xabar yuborilmadi (egasi botga /start bosganmi?):', e.message));
}

function ownerOrderButtons(orderId) {
  return new InlineKeyboard().text("✅ To'landi", `ord:PAID:${orderId}`).text('❌ Bekor qilish', `ord:CANCELLED:${orderId}`);
}

function ownerOrderText(order, title) {
  const u = order.user || {};
  return [
    `<b>${title} #${order.id}</b>`,
    `Mijoz: ${escapeHtml(order.customerName)}${u.username ? ` (@${escapeHtml(u.username)})` : ''}`,
    `Telefon: ${escapeHtml(order.phone)}`,
    itemsText(order.items),
    `Jami: <b>${money(order.total)}</b>`,
    order.comment ? `Izoh: ${escapeHtml(order.comment)}` : '',
  ].filter(Boolean).join('\n');
}

const botController = {
  async start(ctx) {
    const user = ctx.from ? await User.upsertFromTelegram(ctx.from) : null;
    const lang = langOf(user, ctx.from);
    // To'lov sahifasidan qaytish: /start paid_<arizaId>
    const m = String(ctx.match || '').match(/^paid_(\d+)$/);
    if (m && user) return botController.paymentReturn(ctx, user, Number(m[1]), lang);
    await setUserMenuButton(ctx.chat.id, lang);
    await ctx.reply(welcomeText(ctx.from?.first_name || 'Mehmon'), { parse_mode: 'HTML', reply_markup: welcomeKeyboard() });
    if (!config.webAppIsHttps) await ctx.reply(t(lang, 'appNotReady'));
  },

  async chooseLanguage(ctx) {
    const kb = new InlineKeyboard();
    LANG_BUTTONS.forEach(([code, label]) => kb.text(label, `lang:${code}`));
    return ctx.reply(`🌐 ${t('uz', 'chooseLang')}`, { reply_markup: kb });
  },

  async setLanguage(ctx) {
    const lang = ctx.match[1];
    const user = await User.upsertFromTelegram(ctx.from);
    await User.setLanguage(user.id, lang);
    await setUserMenuButton(ctx.chat.id, lang);
    await ctx.answerCallbackQuery({ text: t(lang, 'langSaved') });
    await ctx.reply(t(lang, 'langChosen'), { parse_mode: 'HTML', reply_markup: appKeyboard(lang) });
  },

  /** Mijoz yozgan savol egasiga yuboriladi; egasi shu xabarga «Reply» qilsa, javob mijozga boradi */
  async textMessage(ctx) {
    if (ctx.chat.type !== 'private') return undefined;
    const text = ctx.message.text || '';
    if (isOwner(ctx.from.id)) {
      const replied = ctx.message.reply_to_message;
      const m = (replied?.text || replied?.caption || '').match(/ID:\s*(\d+)/);
      if (!m) return botController.start(ctx);
      const target = await User.findByTelegramId(m[1]);
      const lang = langOf(target);
      try {
        await bot.api.sendMessage(m[1], `${t(lang, 'supportReply', { shop: escapeHtml(config.shop.name) })}\n\n${escapeHtml(text)}`, { parse_mode: 'HTML' });
        return ctx.reply('✅ Javobingiz mijozga yuborildi.', { reply_parameters: { message_id: ctx.message.message_id } });
      } catch (e) {
        return ctx.reply(`❌ Javob yuborilmadi: ${e.message}`);
      }
    }
    const user = await User.upsertFromTelegram(ctx.from);
    const lang = langOf(user, ctx.from);
    if (!config.bot.ownerId) return ctx.reply(t(lang, 'supportSent'), { reply_markup: appKeyboard(lang) });
    const who = [fullName(user), user.username ? `@${user.username}` : '', user.phone || ''].filter(Boolean).join(' · ');
    await toOwner([
      '✉️ <b>Yangi savol</b>',
      `Kimdan: ${escapeHtml(who)}`,
      `ID: ${user.telegramId}`,
      '',
      escapeHtml(text),
      '',
      "↩️ <i>Javob berish uchun shu xabarga «Javob berish» (Reply) qiling.</i>",
    ].join('\n'));
    return ctx.reply(t(lang, 'supportSent'), { reply_markup: appKeyboard(lang) });
  },

  async myOrders(ctx) {
    const user = ctx.from && (await User.findByTelegramId(ctx.from.id));
    const lang = langOf(user, ctx.from);
    const orders = user ? await Order.listByUser(user.id) : [];
    if (!orders.length) return ctx.reply(t(lang, 'noOrders'), { reply_markup: appKeyboard(lang) });
    const text = orders.slice(0, 5).map((o) => [
      `<b>${t(lang, 'order')} #${o.id}</b> · ${t(lang, `status_${o.status}`)}`,
      itemsText(o.items),
      `${t(lang, 'total')}: <b>${money(o.total)}</b>`,
    ].join('\n')).join('\n\n');
    return ctx.reply(text, { parse_mode: 'HTML', reply_markup: appKeyboard(lang) });
  },

  async help(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    const lang = langOf(user, ctx.from);
    const lines = [t(lang, 'contacts')];
    if (config.shop.phone) lines.push(`${t(lang, 'phone')}: ${config.shop.phone}`);
    if (config.shop.authorTelegram) lines.push(`Telegram: @${config.shop.authorTelegram}`);
    if (config.shop.authorInstagram) lines.push(`Instagram: instagram.com/${config.shop.authorInstagram}`);
    lines.push('', t(lang, 'helpCommands'));
    return ctx.reply(lines.join('\n'), { reply_markup: appKeyboard(lang) });
  },

  async askPhone(ctx) {
    const user = await User.findByTelegramId(ctx.from.id);
    const lang = langOf(user, ctx.from);
    const kb = new Keyboard().requestContact(t(lang, 'sendPhone')).resized().oneTime();
    return ctx.reply(t(lang, 'askPhone'), { reply_markup: kb });
  },

  async contact(ctx) {
    const contact = ctx.message?.contact;
    if (!contact || contact.user_id !== ctx.from.id) return undefined;
    const user = await User.upsertFromTelegram(ctx.from);
    const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
    await User.setPhone(user.id, phone);
    return ctx.reply(t(langOf(user, ctx.from), 'phoneSaved'), { reply_markup: { remove_keyboard: true } });
  },

  /** Mijoz chatga chek rasmini yuborsa — oxirgi to'lanmagan arizaga biriktiriladi */
  async receiptPhoto(ctx) {
    const msg = ctx.message;
    const doc = msg.document && /^image\//.test(msg.document.mime_type || '') ? msg.document : null;
    const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;
    const fileInfo = photo || doc;
    if (!fileInfo) return undefined;

    const user = await User.findByTelegramId(ctx.from.id);
    const lang = langOf(user, ctx.from);
    const order = user && (await Order.latestAwaitingReceipt(user.id));
    if (!order) return ctx.reply(t(lang, 'noPendingOrder'), { reply_markup: appKeyboard(lang) });
    if (fileInfo.file_size && fileInfo.file_size > 8 * 1024 * 1024) return ctx.reply(t(lang, 'photoTooBig'));

    const file = await ctx.api.getFile(fileInfo.file_id);
    const res = await fetch(`https://api.telegram.org/file/bot${config.bot.token}/${file.file_path}`);
    if (!res.ok) throw new Error(`Faylni yuklab bo'lmadi: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());
    const mimeType = doc?.mime_type || 'image/jpeg';
    const saved = await Upload.create({ mimeType, data });
    const updated = await Order.setReceipt(order.id, `/uploads/${saved.id}`);
    await notifyReceiptReceived(updated, data);
    return undefined;
  },

  /** Mijoz to'lov sahifasidan botga qaytganda: to'lov holatini server orqali tekshiradi */
  async paymentReturn(ctx, user, orderId, lang) {
    const order = await Order.findById(orderId);
    if (!order || order.userId !== user.id) return ctx.reply(t(lang, 'noPendingOrder'), { reply_markup: appKeyboard(lang) });
    let payment = await payments.latestPayment(orderId);
    if (payment?.status === 'CREATED') {
      try { payment = await payments.syncPayment(payment.id, { onPaid: onOrderPaid }); } catch (e) { console.warn('⚠️  To\'lov tekshirilmadi:', e.message); }
    }
    const fresh = await Order.findById(orderId);
    if (fresh.status === 'PAID') return ctx.reply(t(lang, 'payReturnPaid', { id: orderId }), { reply_markup: appKeyboard(lang) });
    const kb = new InlineKeyboard();
    if (payment?.status === 'CREATED' && payment.checkoutUrl) kb.url(t(lang, 'payBtn'), payment.checkoutUrl).row();
    if (config.webAppIsHttps) kb.webApp(t(lang, 'openApp'), config.bot.webAppUrl);
    return ctx.reply(t(lang, 'payReturnPending', { id: orderId }), { reply_markup: kb });
  },

  /** Egasi Telegram'dan arizani tasdiqlaydi / bekor qiladi */
  async ownerOrderAction(ctx) {
    if (!isOwner(ctx.from.id)) return ctx.answerCallbackQuery({ text: "Ruxsat yo'q", show_alert: true });
    const [, status, id] = ctx.match;
    let order;
    try {
      order = await changeOrderStatus(Number(id), status);
    } catch (e) {
      return ctx.answerCallbackQuery({ text: e.message, show_alert: true });
    }
    if (!order) return ctx.answerCallbackQuery({ text: 'Ariza topilmadi', show_alert: true });
    await ctx.answerCallbackQuery({ text: status === 'PAID' ? "To'landi — kurs ochildi" : 'Bekor qilindi' });
    const mark = status === 'PAID' ? "\n\n✅ To'landi deb belgilandi. Mijozga kursga kirish havolasi yuborildi." : '\n\n❌ Bekor qilindi.';
    const msg = ctx.callbackQuery.message;
    const edit = msg?.caption != null
      ? ctx.editMessageCaption({ caption: `${msg.caption}${mark}` })
      : ctx.editMessageText(`${msg?.text || ''}${mark}`);
    return edit.catch(() => {});
  },

  /** Bot kanalga admin qilinganda / chiqarilganda */
  async myChatMember(ctx) {
    const upd = ctx.myChatMember;
    const chat = upd.chat;
    if (chat.type !== 'channel' && chat.type !== 'supergroup') return;
    const m = upd.new_chat_member;
    const isAdmin = m.status === 'administrator';
    const canInvite = isAdmin && Boolean(m.can_invite_users);
    await Channel.upsert({ id: chat.id, title: chat.title || String(chat.id), username: chat.username, canInvite, isActive: isAdmin });
    if (isAdmin && canInvite) {
      await toOwner(`Bot «${escapeHtml(chat.title)}» kanaliga admin qilindi.\n\nEndi Admin Panel → Kurslar → kursni tahrirlab, «Kanal» maydonida shu kanalni tanlang. Shundan keyin har bir o'quvchiga bir martalik havola yuboriladi.`);
    } else if (isAdmin) {
      await toOwner(`Bot «${escapeHtml(chat.title)}» kanaliga admin qilindi, lekin <b>«Foydalanuvchilarni qo'shish / Invite users via link»</b> huquqi berilmagan. Kanal sozlamalarida shu huquqni yoqing.`);
    } else if (m.status === 'left' || m.status === 'kicked') {
      await toOwner(`Bot «${escapeHtml(chat.title)}» kanalidan chiqarildi. Bu kanalga havolalar endi yaratilmaydi.`);
    }
  },

  /** Kanalga qo'shilish so'rovi — faqat havola egasi qabul qilinadi */
  async joinRequest(ctx) {
    const req = ctx.chatJoinRequest;
    const { approved, access } = await decideJoinRequest(req);
    const user = await User.findByTelegramId(req.from.id);
    const lang = langOf(user, req.from);
    const text = approved
      ? t(lang, 'joinApproved', { title: escapeHtml(req.chat.title) })
      : t(lang, 'joinDenied');
    await bot.api.sendMessage(req.user_chat_id || req.from.id, text, { reply_markup: approved ? undefined : appKeyboard(lang) }).catch(() => {});
    if (!approved && access && access.user.telegramId !== String(req.from.id)) {
      await toOwner(`Diqqat: ${escapeHtml(fullName({ firstName: req.from.first_name, lastName: req.from.last_name, username: req.from.username }))} boshqa o'quvchining havolasi bilan «${escapeHtml(req.chat.title)}» kanaliga kirmoqchi bo'ldi — rad etildi.`);
    }
  },
};

/** Ariza holatini o'zgartiradi va mijozga xabar yuboradi (Admin Panel va Telegram tugmalari uchun) */
async function changeOrderStatus(id, status, { byPaymentSystem = false } = {}) {
  const before = await Order.findById(id);
  if (!before) return null;
  if (before.status === status) return before;
  // Onlayn (Multicard) arizani «To'landi» qilish — faqat to'lov tizimining tasdig'i bilan
  if (status === 'PAID' && before.paymentMethod === 'multicard' && !byPaymentSystem) {
    throw Object.assign(new Error("Bu ariza onlayn to'lanadi — holati Multicard tasdig'i bilan avtomatik o'zgaradi"), { status: 400 });
  }
  if (status === 'CANCELLED' && before.paymentMethod === 'multicard') await payments.cancelOpenPayments(id);
  const order = await Order.setStatus(id, status);
  notifyOrderStatus(order).catch((e) => console.error('❌ Bot xabari yuborilmadi:', e.message));
  return order;
}

/** To'lov tizimi tasdiqlagan ariza: holat PAID, o'quvchiga kanal havolalari, egaga xabar */
async function onOrderPaid(orderId) {
  const order = await changeOrderStatus(orderId, 'PAID', { byPaymentSystem: true });
  const p = await payments.latestPayment(orderId);
  if (order) {
    await toOwner(`${ownerOrderText(order, "✅ Onlayn to'landi — ariza")}${p?.cardPan ? `\nKarta: ${escapeHtml(p.cardPan)} (${escapeHtml(p.ps || '')})` : ''}${p?.receiptUrl ? `\nChek: ${escapeHtml(p.receiptUrl)}` : ''}`);
  }
  return order;
}

/** Mini App'dan kursga yozilish arizasi tushganda mijozga va egasiga xabar */
async function notifyOrderCreated(order, payment = null) {
  if (!bot) return;
  const user = await User.findById(order.userId);
  const lang = langOf(user);
  if (order.paymentMethod === 'multicard') {
    const lines = [
      t(lang, 'orderAccepted'),
      '',
      `<b>${t(lang, 'order')} #${order.id}</b>`,
      itemsText(order.items),
      '',
      `${t(lang, 'total')}: <b>${money(order.total)}</b>`,
      '',
      t(lang, 'payOnlineHint'),
    ];
    const kb = new InlineKeyboard();
    if (payment?.checkoutUrl) kb.url(t(lang, 'payBtn'), payment.checkoutUrl);
    await bot.api.sendMessage(order.user.telegramId, lines.join('\n'), { parse_mode: 'HTML', reply_markup: payment?.checkoutUrl ? kb : undefined });
    await toOwner(`${ownerOrderText(order, 'Kursga yangi ariza')}\n\nOnlayn to'lov (Multicard) kutilmoqda.`);
    return;
  }
  const lines = [
    t(lang, 'orderAccepted'),
    '',
    `<b>${t(lang, 'order')} #${order.id}</b>`,
    itemsText(order.items),
    '',
    `${t(lang, 'total')}: <b>${money(order.total)}</b>`,
  ];
  const pay = await Setting.payment();
  if (order.receiptUrl) {
    lines.push('', t(lang, 'receiptAlready'));
  } else if (pay.cardNumber) {
    lines.push(
      '',
      `<b>${t(lang, 'payByCard')}</b>`,
      `<code>${escapeHtml(pay.cardNumber)}</code>${pay.cardHolder ? `\n${escapeHtml(pay.cardHolder)}` : ''}`,
      `${t(lang, 'amount')}: <b>${money(order.total)}</b>`,
    );
    if (pay.note) lines.push(escapeHtml(pay.note));
    lines.push('', t(lang, 'sendReceipt'));
  } else {
    lines.push('', t(lang, 'cardLater'));
  }
  await bot.api.sendMessage(order.user.telegramId, lines.join('\n'), { parse_mode: 'HTML' });
  await toOwner(`${ownerOrderText(order, 'Kursga yangi ariza')}\n\nTo'lov cheki kelishi kutilmoqda.`);
}

/** Chek qabul qilinganda mijozga tasdiq, egasiga chek rasmi tugmalar bilan */
async function notifyReceiptReceived(order, imageBuffer) {
  if (!bot || !order.user?.telegramId) return;
  const user = await User.findById(order.userId);
  const lang = langOf(user);
  await bot.api.sendMessage(order.user.telegramId, t(lang, 'receiptReceived', { id: order.id }));

  if (!config.bot.ownerId) return;
  const caption = `${ownerOrderText(order, "Chek keldi — ariza")}\n\nSummani tekshiring va tasdiqlang:`;
  const opts = { caption, parse_mode: 'HTML', reply_markup: ownerOrderButtons(order.id) };
  try {
    if (imageBuffer) await bot.api.sendPhoto(config.bot.ownerId, new InputFile(imageBuffer, 'chek.jpg'), opts);
    else await toOwner(caption, { reply_markup: ownerOrderButtons(order.id) });
  } catch (e) {
    console.warn('⚠️  Egaga chek yuborilmadi (egasi botga /start bosganmi?):', e.message);
  }
}

/** Ariza holati o'zgarganda mijozga xabar. To'landi — bir martalik havolalar */
async function notifyOrderStatus(order) {
  if (!bot || !order.user?.telegramId) return;
  const chatId = order.user.telegramId;
  const user = await User.findById(order.userId);
  const lang = langOf(user);

  if (order.status === 'PAID') {
    const ids = (Array.isArray(order.items) ? order.items : []).map((i) => i.courseId).filter(Boolean);
    const courses = ids.length ? await Course.findMany(ids) : [];
    const kb = new InlineKeyboard();
    const lines = [`<b>${t(lang, 'paidTitle', { id: order.id })}</b>`, '', t(lang, 'coursesOpened')];
    let anyLink = false;
    let oneTime = false;
    for (const c of courses) {
      lines.push(`• ${escapeHtml(loc(c, 'title', lang))}`);
      try {
        const access = await ensureAccess(user, c);
        if (access?.link) {
          kb.url(`${t(lang, 'joinBtn')}: ${loc(c, 'title', lang)}`.slice(0, 64), access.link).row();
          anyLink = true;
          if (!access.legacy) oneTime = true;
        }
      } catch (e) {
        console.error(`❌ Kanal havolasini yaratib bo'lmadi (kurs #${c.id}):`, e.message);
        await toOwner(`Diqqat: «${escapeHtml(c.title)}» kursi uchun havola yaratib bo'lmadi. Bot kanalda admin va «Invite users» huquqiga egami? Xato: ${escapeHtml(e.message)}`);
      }
    }
    if (oneTime) lines.push('', t(lang, 'oneTimeNote'));
    if (!anyLink) lines.push('', t(lang, 'curatorWillSend'));
    lines.push('', t(lang, 'leaveReview'));
    if (config.webAppIsHttps) kb.webApp('Mini App', config.bot.webAppUrl);
    await bot.api.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML', reply_markup: kb });
  } else if (order.status === 'CANCELLED') {
    await bot.api.sendMessage(chatId, t(lang, 'cancelled', { id: order.id }));
  }
}

module.exports = {
  botController, notifyOrderCreated, notifyOrderStatus, notifyReceiptReceived, changeOrderStatus, setUserMenuButton, onOrderPaid,
};
