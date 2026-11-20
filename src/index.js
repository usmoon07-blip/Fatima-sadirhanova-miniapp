const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const { webhookCallback } = require('grammy');
const config = require('./config/default');
const { connectDatabase, disconnectDatabase } = require('./database/connection');
const { bot } = require('./core/bot');
const { registerBotRoutes, setupBotUi, ALLOWED_UPDATES } = require('./routes/bot.routes');
const clientRoutes = require('./routes/client.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const Upload = require('./models/Upload');

// BOT_TOKEN hech qachon log'larga tushmasin
const redact = (v) => (typeof v === 'string' ? v.replace(/bot\d+:[\w-]+/g, 'bot***').replace(/\d{6,}:[\w-]{30,}/g, '***') : v);
for (const level of ['log', 'warn', 'error']) {
  const original = console[level].bind(console);
  console[level] = (...args) => original(...args.map((a) => (a instanceof Error ? redact(a.stack || a.message) : redact(a))));
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const useWebhook = Boolean(bot && config.publicUrl.startsWith('https://'));
const webhookPath = bot ? `/telegram/${sha256(config.bot.token).slice(0, 32)}` : null;
const webhookSecret = bot ? sha256(`${config.bot.token}:webhook`).slice(0, 48) : null;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, cb) {
    // Origin'siz so'rovlar (Telegram, server-server) o'tadi; ro'yxat bo'sh bo'lsa — hammasiga ruxsat
    if (!origin || config.corsOrigins.length === 0) return cb(null, true);
    return cb(null, config.corsOrigins.includes(origin.replace(/\/$/, '')));
  },
}));

// Telegram webhook — 404 handler'dan OLDIN
if (useWebhook) {
  const checkSecret = (req, res, next) => (
    req.get('X-Telegram-Bot-Api-Secret-Token') === webhookSecret ? next() : res.sendStatus(401)
  );
  app.post(webhookPath, checkSecret, express.json(), webhookCallback(bot, 'express', { secretToken: webhookSecret }));
}

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({
  ok: true,
  bot: Boolean(bot),
  mode: useWebhook ? 'webhook' : 'polling',
  // Qaysi to'lov usuli faol (kalitlar ko'rsatilmaydi — faqat bor/yo'qligi)
  payments: config.multicard.enabled ? 'multicard' : 'manual',
  multicard: {
    baseUrl: config.multicard.baseUrl,
    applicationId: Boolean(config.multicard.applicationId),
    secret: Boolean(config.multicard.secret),
    storeId: Boolean(config.multicard.storeId),
    callbackUrl: config.publicUrl ? `${config.publicUrl}/api/payments/multicard/callback` : null,
  },
  version: process.env.RENDER_GIT_COMMIT ? process.env.RENDER_GIT_COMMIT.slice(0, 7) : null,
  service: process.env.RENDER_SERVICE_ID || null,
}));
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', clientRoutes);
app.use('/api', (req, res) => res.status(404).json({ message: "Bunday yo'l topilmadi" }));

// Rasmlar: bazadan (yangi) yoki diskdan (eski, lokal)
app.get('/uploads/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    if (/^[a-z0-9]{20,40}$/i.test(id)) {
      const file = await Upload.findById(id);
      if (file) {
        res.set('Content-Type', file.mimeType);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(Buffer.from(file.data));
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
});
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '7d' }));

// Admin Panel (qurilgan bo'lsa) — /admin manzilida
if (fs.existsSync(path.join(config.adminDist, 'index.html'))) {
  app.use('/admin', express.static(config.adminDist, {
    index: false,
    maxAge: '1h',
    setHeaders(res, filePath) {
      // PWA: service worker va manifest har doim yangi olinsin; xeshli fayllar — uzoq kesh
      if (/sw\.js$|manifest\.webmanifest$|index\.html$/.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
      else if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      if (filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/manifest+json');
    },
  }));
  app.get(/^\/admin(\/.*)?$/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(config.adminDist, 'index.html'));
  });
  app.get('/', (req, res) => res.redirect('/admin/'));
}

app.use((req, res) => res.status(404).json({ message: 'Topilmadi' }));

// Yagona xatolik ushlagich
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'P2025') return res.status(404).json({ message: "Ma'lumot topilmadi" });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Rasm hajmi 5 MB dan oshmasligi kerak' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: "Noto'g'ri JSON" });
  const status = err.status || 500;
  if (status >= 500) console.error('❌ Server xatosi:', err);
  return res.status(status).json({ message: status >= 500 ? 'Serverda xatolik yuz berdi' : err.message });
});

async function startBot() {
  if (!bot) return;
  registerBotRoutes(bot);
  try {
    await bot.init();
    await setupBotUi(bot);
    if (useWebhook) {
      await bot.api.setWebhook(`${config.publicUrl}${webhookPath}`, {
        secret_token: webhookSecret,
        drop_pending_updates: true,
        allowed_updates: ALLOWED_UPDATES,
      });
      console.log(`🤖 Bot webhook rejimida: @${bot.botInfo.username}`);
    } else {
      await bot.api.deleteWebhook({ drop_pending_updates: true });
      bot.start({
        drop_pending_updates: true,
        allowed_updates: ALLOWED_UPDATES,
        onStart: (info) => console.log(`🤖 Bot ishga tushdi (polling): @${info.username}`),
      }).catch((err) => console.error("❌ Bot to'xtadi:", err.message));
    }
  } catch (err) {
    console.error("❌ Botni ishga tushirib bo'lmadi. BOT_TOKEN to'g'riligini tekshiring:", err.message);
  }
}

/* Uyg'oq tutish: bepul Render 15 daqiqa so'rov bo'lmasa uxlaydi va keyingi kirishda
   «uyg'onmoqda» sahifasini ko'rsatadi. Server o'z ommaviy manziliga har 10 daqiqada
   so'rov yuboradi — Render buni tashqi so'rov deb hisoblaydi va server uxlamaydi.
   /api/health bazaga murojaat qilmaydi, shuning uchun Neon bazasi bekorga uyg'onmaydi. */
function keepAwake() {
  if (!process.env.RENDER || !config.publicUrl.startsWith('https://')) return;
  const url = `${config.publicUrl}/api/health?keepalive=1`;
  const ping = () => fetch(url, { signal: AbortSignal.timeout(30000) })
    .catch((err) => console.warn('⚠️ Keep-alive so\'rovi o\'tmadi:', err.message));
  setInterval(ping, 10 * 60 * 1000).unref();
  console.log("⏰ Keep-alive yoqildi: server uxlamaydi (har 10 daqiqada).");
}

async function main() {
  await connectDatabase();
  const server = app.listen(config.port, () => {
    console.log(`🚀 API ishlayapti: port ${config.port}`);
  });
  await startBot();
  keepAwake();

  const shutdown = async () => {
    console.log("\n⏹  To'xtatilmoqda...");
    server.close();
    if (bot && bot.isRunning()) await bot.stop();
    await disconnectDatabase();
    process.exit(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('❌ Ishga tushishda xato:', err.message);
  if (/DATABASE_URL|connect|P1001|P1000/i.test(err.message)) {
    console.error("👉 DATABASE_URL (Neon connection string) to'g'riligini tekshiring.");
  }
  process.exit(1);
});
