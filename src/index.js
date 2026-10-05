const express = require('express');
const cors = require('cors');
const config = require('./config/default');
const { connectDatabase, disconnectDatabase } = require('./database/connection');
const { bot } = require('./core/bot');
const { registerBotRoutes, setupBotUi } = require('./routes/bot.routes');
const clientRoutes = require('./routes/client.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(config.uploadsDir, { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true, bot: Boolean(bot) }));
app.use('/api/admin', adminRoutes);
app.use('/api', clientRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: "Bunday yo'l topilmadi" }));

// Yagona xatolik ushlagich
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.code === 'P2002') return res.status(400).json({ message: 'Bunday qiymat allaqachon mavjud ' });
  if (err.code === 'P2025') return res.status(404).json({ message: 'Maʼlumot topilmadi' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Fayl hajmi 8 MB dan oshmasligi kerak' });
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
    bot.start({
      drop_pending_updates: true,
      onStart: (info) => console.log(`🤖 Bot ishga tushdi: @${info.username}`),
    }).catch((err) => console.error('❌ Bot to\'xtadi:', err.message));
  } catch (err) {
    console.error('❌ Botni ishga tushirib bo\'lmadi. BOT_TOKEN to\'g\'riligini tekshiring:', err.message);
  }
}

async function main() {
  await connectDatabase();
  const server = app.listen(config.port, () => {
    console.log(`🚀 API ishlayapti: http://localhost:${config.port}`);
  });
  await startBot();

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
    console.error("👉 .env faylidagi DATABASE_URL (Neon connection string) to'g'riligini tekshiring.");
  }
  process.exit(1);
});
