const { InlineKeyboard, Keyboard } = require('grammy');
const config = require('../config/default');
const { bot } = require('../core/bot');
const User = require('../models/User');
const Order = require('../models/Order');
const Course = require('../models/Course');
const Setting = require('../models/Setting');
const Upload = require('../models/Upload');
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

  /** Mijoz chatga chek rasmini yuborsa — oxirgi to'lanmagan buyurtmaga biriktiriladi */
  async receiptPhoto(ctx) {
    const msg = ctx.message;
    const doc = msg.document && /^image\//.test(msg.document.mime_type || '') ? msg.document : null;
    const photo = msg.photo ? msg.photo[msg.photo.length - 1] : null;
    const fileInfo = photo || doc;
    if (!fileInfo) return undefined;

    const user = await User.findByTelegramId(ctx.from.id);
    const order = user && (await Order.latestAwaitingReceipt(user.id));
    if (!order) {
      return ctx.reply("Sizda to'lovi kutilayotgan buyurtma yo'q. Kurs tanlash uchun tugmani bosing 👇", { reply_markup: appKeyboard() });
    }
    if (fileInfo.file_size && fileInfo.file_size > 8 * 1024 * 1024) {
      return ctx.reply('Rasm juda katta. Iltimos, skrinshot yuboring.');
    }

    const file = await ctx.api.getFile(fileInfo.file_id);
    const res = await fetch(`https://api.telegram.org/file/bot${config.bot.token}/${file.file_path}`);
    if (!res.ok) throw new Error(`Faylni yuklab bo'lmadi: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());
    const saved = await Upload.create({ mimeType: doc?.mime_type || 'image/jpeg', data });
    const updated = await Order.setReceipt(order.id, `/uploads/${saved.id}`);
    await notifyReceiptReceived(updated);
    return undefined;
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
  const pay = await Setting.payment();
  if (order.receiptUrl) {
    lines.push('', "🧾 Chekingiz qabul qilindi. To'lov tekshirilgach, kursga kirish havolasi shu yerga keladi.");
  } else if (pay.cardNumber) {
    lines.push(
      '',
      "💳 <b>To'lov — karta orqali:</b>",
      `<code>${escapeHtml(pay.cardNumber)}</code>${pay.cardHolder ? `\n👤 ${escapeHtml(pay.cardHolder)}` : ''}`,
      `💰 Summa: <b>${money(order.total)}</b>`,
    );
    if (pay.note) lines.push(escapeHtml(pay.note));
    lines.push('', "📸 To'lagach, <b>chek rasmini (skrinshot) shu chatga yuboring</b>.");
  } else {
    lines.push('', "💳 To'lov karta orqali. Kuratorimiz karta ma'lumotlarini yuboradi.");
  }
  await bot.api.sendMessage(order.user.telegramId, lines.join('\n'), { parse_mode: 'HTML' });
}

/** Chek qabul qilinganda mijozga tasdiq */
async function notifyReceiptReceived(order) {
  if (!bot || !order.user?.telegramId) return;
  await bot.api.sendMessage(
    order.user.telegramId,
    `🧾 Buyurtma #${order.id} uchun chekingiz qabul qilindi!\nTo'lov tekshirilgach, kursga kirish havolasini shu yerga yuboramiz ⏳`,
  );
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

module.exports = { botController, notifyOrderCreated, notifyOrderStatus, notifyReceiptReceived };
