# 🧁 Fatima Sadirkhanova — Qandolatchilik kurslari (Telegram Bot + Mini App + Admin Panel)

Loyiha 3 qismdan iborat va to'liq **sizning kompyuteringizda (localhost)** ishlaydi:

| Qism | Manzil | Vazifasi |
|---|---|---|
| **Backend (API + Bot)** | `http://localhost:4000` | Baza, buyurtmalar, Telegram bot |
| **Mini App** (o'quvchilar uchun) | `http://localhost:5173` | Telegram ichida ochiladigan kurslar do'koni |
| **Admin Panel** | `http://localhost:5174` | Buyurtmalar, kurslar, natijalar, izohlar, stories |

**Mini App bo'limlari:** Bosh sahifa · Kurslar · Savatcha · Natijalar · Profil. Dizayn **Rose Gold** palitrasida (`#FFF8F4`, `#F2D3CB`, `#D9A79A`, `#9C5F68`). Pastki menyuda videodagi kabi "uchuvchi doira" animatsiyasi bor.

**Ish jarayoni:**
1. O'quvchi kursni savatchaga qo'shib, buyurtmani tasdiqlaydi → Mini App yopiladi → bot: *"Buyurtmangiz muvaffaqiyatli qabul qilindi!"*
2. Buyurtma Admin Panelda **"To'lov kutilmoqda"** holatida paydo bo'ladi (ovozli signal bilan).
3. To'lovni olgach, admin holatni **"To'landi"** qiladi → bot o'quvchiga kursga kirish havolasini yuboradi (havola Admin Panel → Kurslar → "Kursga kirish havolasi" maydonida).
4. Kursni sotib olgan o'quvchi Mini App'da **izoh** qoldira oladi.

---

## 0. O'rnatish kerak bo'lgan dasturlar

1. **Node.js 20 yoki 22 (LTS)**: https://nodejs.org
2. **ngrok**: https://ngrok.com/download (bepul ro'yxatdan o'ting)

Tekshirish: `node -v` → `v20...` yoki `v22...`

## 1. `.env` faylini yaratish

Loyiha papkasida `.env.example` dan nusxa oling va nomini `.env` qiling, keyin qiymatlarni to'ldiring:

```env
DATABASE_URL="Neon connection string"
BOT_TOKEN="BotFather bergan token"
WEBAPP_URL=""                 # 4-qadamda ngrok manzilini qo'yasiz
ADMIN_PASSWORD="admin paroli"
JWT_SECRET="istalgan uzun tasodifiy matn"
```

> ⚠️ `.env` faylini hech kimga bermang va GitHub'ga yuklamang (u `.gitignore` da).

## 2. O'rnatish, migratsiya va seed

```bash
npm run setup
```

Bu bitta buyruq: paketlarni o'rnatadi (backend + Mini App + Admin), bazada jadvallarni yaratadi (`prisma migrate deploy`) va 4 ta namunaviy kurs + 4 ta story yozadi (`seed`).

Alohida-alohida bajarish kerak bo'lsa:

```bash
npm install
npm --prefix miniapp install
npm --prefix admin install
npm run db:migrate
npm run db:seed
```

## 3. Ishga tushirish

```bash
npm run dev
```

API, Mini App va Admin Panel birga ishga tushadi. Admin Panel: http://localhost:5174

## 4. ngrok orqali Telegram'ga ulash

1. Yangi terminal oching:
   ```bash
   ngrok config add-authtoken SIZNING_NGROK_TOKENINGIZ
   ```
   (token: https://dashboard.ngrok.com/get-started/your-authtoken — bir marta qilinadi)
2. ```bash
   ngrok http 5173
   ```
3. `Forwarding  https://xxxx-xx.ngrok-free.app` qatoridagi **https** manzilni nusxa oling.
4. `.env` da `WEBAPP_URL="https://xxxx-xx.ngrok-free.app"` qiling.
5. `npm run dev` terminalida `Ctrl + C`, keyin qayta `npm run dev`.
6. Telegram'da botingizga `/start` yozing → **"🧁 Kurslarni ko'rish"** tugmasi yoki chap pastdagi **"Kurslar"** menyu tugmasi Mini App'ni ochadi.

> ngrok'ning bepul versiyasida har safar manzil o'zgaradi — har gal 3–5-qadamlarni takrorlang. Birinchi ochilishda ngrok ogohlantirish sahifasi chiqsa, **"Visit Site"** ni bosing.

## Foydali buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Hammasini ishga tushirish |
| `npm run db:studio` | Bazani brauzerda ko'rish (Prisma Studio) |
| `npm run db:seed` | Bo'sh bo'lsa namunaviy kurslarni qayta yozish |

## Papka tuzilishi

```
src/
├── config/default.js           # Sozlamalar (.env)
├── core/bot.js                 # Bot instansiyasi (grammY)
├── database/connection.js      # Prisma ulanishi
├── models/                     # User, Course, Order, Review, Result, Story
├── controllers/
│   ├── botController.js        # Bot javoblari va xabarnomalar
│   ├── cartController.js       # Mini App API
│   └── adminController.js      # Admin Panel API (CRUD)
├── routes/                     # bot / client / admin yo'llari
├── middlewares/auth.middleware.js  # Telegram initData + admin JWT + validatsiya
└── index.js
prisma/  schema.prisma, migrations, seed.js
miniapp/ React Mini App
admin/   React Admin Panel
```

---

## 🌐 Bepul serverga joylash (kompyuter o'chiq bo'lsa ham ishlaydi)

| Qism | Qayerda | Manzil |
|---|---|---|
| Backend + Bot (webhook) + Admin Panel | **Render** (bepul) | `https://fatima-sadirhanova-api.onrender.com` → Admin: `/admin` |
| Mini App | **Vercel** (bepul) | `https://fatima-sadirhanova-miniapp.vercel.app` |
| Baza | **Neon** | mavjud baza |

Kodda tayyor: `render.yaml` (Blueprint), `miniapp/vercel.json`, `miniapp/.env.production`,
`.github/workflows/keepalive.yml` (ish vaqtida har 10 daqiqada serverni uyg'otadi).

**1. Render:** https://dashboard.render.com → GitHub bilan kiring → **New → Blueprint** →
`fatima-sadirhanova-miniapp` omborini tanlang → so'ralgan 3 ta qiymatni kiriting
(`DATABASE_URL`, `BOT_TOKEN`, `ADMIN_PASSWORD`) → **Apply**. 5–10 daqiqa kuting.
Tekshirish: `https://fatima-sadirhanova-api.onrender.com/api/health` → `{"ok":true,...}`

**2. Vercel:** https://vercel.com → GitHub bilan kiring → **Add New → Project** → omborni **Import** →
**Root Directory: `miniapp`** (eng muhim!) → **Deploy**.

**3. Manzillar boshqacha chiqsa** (nom band bo'lsa Render/Vercel boshqa nom beradi):
- Render manzilini `miniapp/.env.production` va `.github/workflows/keepalive.yml` ga yozing.
- Vercel manzilini Render → Environment → `WEBAPP_URL` va `CORS_ORIGINS` ga yozing.

> ⚠️ Server ishlayotganda botni kompyuterda (`npm run dev`) ishga tushirmang — bitta bot ikki joyda ishlay olmaydi.
