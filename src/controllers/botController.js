const { InlineKeyboard, Keyboard } = require('grammy');
const config = require('../config/default');
const { bot } = require('../core/bot');
const User = require('../models/User');
const Order = require('../models/Order');
const Course = require('../models/Course');
const { money, escapeHtml } = require('../utils/format');

const STATUS_LABEL = { PENDING: "⏳ To'lov kutilmoqda", PAID: "✅ To'landi", CANCELLED: '❌ Bekor qilindi' };

function appKeyboard(text = "🧁 Kurslarni ko'rish") {
  if (!config.webAppIsHttps) return undefined;
  return new InlineKeyboard().webApp(text, config.bot.webAppUrl);
}

function itemsText(items) {
  return (Array.isArray(items) ? items : [])
    .map((i) => `• ${escapeHtml(i.title)} — <b>${money(i.price)}</b>`)
    .join('\n');
}

const botController = {
  async start(ctx) {
    if (ctx.from) await User.upsertFromTelegram(ctx.from);
    const name = escapeHtml(ctx.from?.first_name || 'Mehmon');
    const text = [
      `Assalomu alaykum, <b>${name}</b>! 🌸`,
      '',
      `<b>${escapeHtml(config.shop.name)}</b> qandolatchilik kurslariga xush kelibsiz.`,
      '',
      "🎂 Uyda turib professional tortlar, desertlar va makaronlar pishirishni o'rganing.",
      "🎓 Darslarni istalgan vaqtda ko'rasiz, savollaringizga javob beramiz.",
      '',
      "Pastdagi tugmani bosing va o'zingizga mos kursni tanlang 👇",
    ].join('\n');

    const keyboard = appKeyboard();
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    if (!keyboard) {
      await ctx.reply("ℹ️ Mini App hali ulanmagan. Admin: .env faylida WEBAPP_URL ga ngrok bergan https manzilni yozing va backendni qayta ishga tushiring.");
    }
  },

  async myOrders(ctx) {
    const user = ctx.from && (await User.findByTelegramId(ctx.from.id));
    const orders = user ? await Order.listByUser(user.id) : [];
    if (!orders.length) {
      return ctx.reply("Sizda hali buyurtmalar yo'q. Kurslarni ko'rish uchun tugmani bosing 👇", { reply_markup: appKeyboard() });
    }
    const text = orders.slice(0, 5).map((o) => [
      `<b>Buyurtma #${o.id}</b> · ${STATUS_LABEL[o.status]}`,
      itemsText(o.items),
      `Jami: <b>${money(o.total)}</b>`,
    ].join('\n')).join('\n\n');
    return ctx.reply(text, { parse_mode: 'HTML', reply_markup: appKeyboard() });
  },

  async help(ctx) {
    const lines = ["📞 Bog'lanish:"];
    if (config.shop.phone) lines.push(`Telefon: ${config.shop.phone}`);
    if (config.shop.adminUsername) lines.push(`Telegram: @${config.shop.adminUsername}`);
    lines.push('', '/start — Bosh menyu', '/buyurtmalarim — Mening buyurtmalarim');
    return ctx.reply(lines.join('\n'), { reply_markup: appKeyboard() });
  },

  async askPhone(ctx) {
    const kb = new Keyboard().requestContact('📱 Raqamni yuborish').resized().oneTime();
    return ctx.reply('Telefon raqamingizni yuboring:', { reply_markup: kb });
  },

  async contact(ctx) {
    const contact = ctx.message?.contact;
    if (!contact || contact.user_id !== ctx.from.id) return undefined;
    const user = await User.upsertFromTelegram(ctx.from);
    const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
    await User.setPhone(user.id, phone);
    return ctx.reply('✅ Raqamingiz saqlandi. Rahmat!', { reply_markup: { remove_keyboard: true } });
  },
};

/** Mini App'dan buyurtma tushganda mijozga xabar */
async function notifyOrderCreated(order) {
  if (!bot) return;
  const lines = [
    "Buyurtmangiz muvaffaqiyatli qabul qilindi! Kuratorimiz tez orada bog'lanadi 🧁",
    '',
    `<b>Buyurtma #${order.id}</b>`,
    itemsText(order.items),
    '',
    `💰 Jami: <b>${money(order.total)}</b>`,
  ];
  if (config.shop.cardNumber) {
    lines.push(
      '',
      "💳 To'lov uchun karta:",
      `<code>${escapeHtml(config.shop.cardNumber)}</code>${config.shop.cardHolder ? ` (${escapeHtml(config.shop.cardHolder)})` : ''}`,
      "To'lov chekini shu chatga yoki kuratorga yuboring.",
    );
  }
  await bot.api.sendMessage(order.user.telegramId, lines.join('\n'), { parse_mode: 'HTML' });
}

/** Admin buyurtma holatini o'zgartirganda mijozga xabar */
async function notifyOrderStatus(order) {
  if (!bot || !order.user?.telegramId) return;
  const chatId = order.user.telegramId;

  if (order.status === 'PAID') {
    const ids = (Array.isArray(order.items) ? order.items : []).map((i) => i.courseId).filter(Boolean);
    const courses = ids.length ? await Course.findMany(ids) : [];
    const kb = new InlineKeyboard();
    const lines = [`✅ <b>To'lovingiz tasdiqlandi!</b> (buyurtma #${order.id})`, '', '🎓 Kurslaringiz ochildi:'];
    for (const c of courses) {
      lines.push(`• ${escapeHtml(c.title)}`);
      if (c.accessLink) kb.url(`▶️ ${c.title}`.slice(0, 60), c.accessLink).row();
    }
    if (!courses.some((c) => c.accessLink)) lines.push('', 'Kurator sizga darslarga kirish havolasini yuboradi.');
    lines.push('', "Kursni tugatgach, Mini App'da izoh qoldirishni unutmang 🌸");
    if (config.webAppIsHttps) kb.webApp('🧁 Mini App', config.bot.webAppUrl);
    await bot.api.sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML', reply_markup: kb });
  } else if (order.status === 'CANCELLED') {
    await bot.api.sendMessage(chatId, `❌ Buyurtma #${order.id} bekor qilindi. Savollar bo'lsa, biz bilan bog'laning.`);
  }
}

module.exports = { botController, notifyOrderCreated, notifyOrderStatus };
