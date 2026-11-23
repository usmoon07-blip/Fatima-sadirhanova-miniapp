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
`.github/workflows/keepalive.yml` — zaxira turtki (har 10 daqiqada). Asosiy uyg'oq tutish serverning o'zida: `src/index.js` → `keepAwake()`.

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

---

## 🔐 Kursga bir martalik kirish havolasi

1. Telegram'da kurs kanalingizni oching → **Administratorlar → Admin qo'shish** → botingizni tanlang.
2. **«Foydalanuvchilarni qo'shish / Invite users via link»** huquqini yoqing va saqlang.
3. Bot sizga (egasiga) «kanalga admin qilindi» deb yozadi.
4. Admin Panel → **Kurslar** → kursni tahrirlang → **«Yopiq kanal»** ro'yxatidan kanalni tanlang → Saqlash.

To'lov tasdiqlanganda bot o'quvchiga **faqat o'zi uchun** havola yuboradi. Havola orqali kirish so'rovini bot
faqat shu o'quvchidan qabul qiladi, keyin havola bekor qilinadi — qayta bosganda yoki boshqa odam bosganda kirib bo'lmaydi.

## 👑 Bot egasi

`OWNER_ID` (standart: `816069987`) — yangi buyurtmalar va cheklar shu Telegram foydalanuvchisiga keladi,
chek ostidagi **«✅ To'landi»** tugmasi bilan to'g'ridan-to'g'ri Telegram'dan tasdiqlash mumkin.
Egasi botga kamida bir marta `/start` yuborgan bo'lishi kerak.

---

## 💳 Onlayn to'lov — Multicard

Hujjat: https://docs.multicard.uz (bo'lim: «Оплата на платежной странице Multicard»).

### Qanday ishlaydi
1. O'quvchi Mini App'da «Kursga yozilish» ni bosadi → ariza **`PENDING` (to'lov kutilmoqda)** holatida yaratiladi.
2. Server summani **bazadagi kurs narxlaridan** hisoblaydi (tiyinda) va `POST /payment/invoice` bilan invoys yaratadi.
   Fiskal chek (`ofd`) uchun har bir kursning MXIK, qadoq kodi va QQS foizi yuboriladi.
3. Mini App va bot «💳 To'lash» tugmasini ko'rsatadi → Multicard to'lov sahifasi (karta, Payme, Click, Uzum...).
4. To'lovdan keyin Multicard **callback** yuboradi. Server tekshiradi: imzo
   `md5(store_id + invoice_id + amount + secret)`, kassa, invoys borligi, summa bazadagi bilan bir xilligi, takroriy so'rov.
   Hammasi to'g'ri bo'lsa → ariza **`PAID`**, bot o'quvchiga bir martalik kanal havolasini yuboradi.
5. Mini App'dan kelgan «to'landi» xabariga ishonilmaydi; holat faqat Multicard tasdig'i bilan o'zgaradi.
   Admin onlayn arizani qo'lda «To'landi» qila olmaydi.

### Kerakli kalitlar (`.env` / Render → Environment)
| Kalit | Izoh |
|---|---|
| `MULTICARD_BASE_URL` | Test: `https://dev-mesh.multicard.uz`, production: `https://mesh.multicard.uz` |
| `MULTICARD_APPLICATION_ID` | Multicard bergan `application_id` |
| `MULTICARD_SECRET` | Multicard bergan `secret` (imzo shu bilan tekshiriladi) |
| `MULTICARD_STORE_ID` | Kassa ID (`store_id`) |
| `OFD_DEFAULT_MXIK`, `OFD_DEFAULT_PACKAGE_CODE`, `OFD_DEFAULT_VAT` | Kursda kod ko'rsatilmasa ishlatiladi |

Uchta asosiy kalit (`APPLICATION_ID`, `SECRET`, `STORE_ID`) bo'lmasa, onlayn to'lov o'chadi va eski usul (kartaga o'tkazma + chek) ishlaydi.

### Webhook (callback) manzili
```
https://fatima-sadirhanova-api.onrender.com/api/payments/multicard/callback
```
Server uni invoys yaratishda `callback_url` sifatida o'zi yuboradi — Multicard kabinetida alohida sozlash shart emas.
Multicard callback'ni `195.158.26.90` IP'dan yuboradi (xohlasangiz `MULTICARD_CALLBACK_IP` ga yozing).

### Endpointlar
| Yo'l | Kim uchun | Vazifasi |
|---|---|---|
| `POST /api/orders` | Mini App | Ariza + to'lov havolasi (`payment.checkoutUrl`) |
| `POST /api/orders/:id/pay` | Mini App | To'lov havolasini qayta olish |
| `GET /api/orders/:id/payment` | Mini App | Holat (kerak bo'lsa Multicard'dan server orqali tekshiriladi) |
| `POST /api/payments/multicard/callback` | Multicard | To'lov tasdig'i |
| `POST /api/admin/orders/:id/sync-payment` | Admin | Multicard'dan qayta tekshirish |
| `POST /api/admin/orders/:id/refund` | Admin | Pulni qaytarish (`DELETE /payment/{uuid}`) |
| `GET /api/admin/orders/:id/payment-logs` | Admin | Multicard bilan so'rov/javoblar logi |

Jadvallar: `Payment` (summa tiyinda, holat `CREATED/PAID/CANCELLED/REFUNDED`), `PaymentLog` (har bir so'rov va javob).

### Test rejimida tekshirish
Test kartasi: `8600 5333 6409 8829`, muddati `06/28`, SMS kod: `112233` (hujjatda `111111` ham ko'rsatilgan).

| Holat | Qanday tekshiriladi | Kutilgan natija |
|---|---|---|
| Muvaffaqiyatli to'lov | Botda kursga yoziling → «To'lash» → test karta | Ariza `PAID`, botda kanal havolasi, Admin'da «Onlayn to'landi» |
| Noto'g'ri summa | Callback'ni boshqa `amount` bilan yuborish | `{"success":false,"message":"Summa mos emas"}`, ariza `PENDING` |
| Mavjud bo'lmagan ariza | Callback'da noma'lum `invoice_id` | `{"success":false,"message":"Invoys topilmadi"}` |
| Soxta imzo | Callback'da noto'g'ri `sign` | `{"success":false,"message":"Imzo noto'g'ri"}` |
| Takroriy so'rov | Bir xil callback'ni 2 marta | Ikkalasiga `{"success":true}`, to'lov 1 marta hisoblanadi |
| Bekor qilish | Admin arizani «Bekor qilindi» qiladi | Multicard'da invoys bekor (`DELETE /payment/invoice/{uuid}`), keyingi callback rad etiladi |

Hujjat bo'yicha `success:false` javobida Multicard to'lovni bekor qiladi va pulni qaytaradi.

### Testdan productionga o'tish
1. Multicard'dan production kalitlarini oling (`application_id`, `secret`, `store_id`).
2. Render → Environment: `MULTICARD_BASE_URL=https://mesh.multicard.uz` va yangi kalitlarni yozing → **Save** (server qayta ishga tushadi).
3. Admin Panel → Kurslar: har bir kursga **haqiqiy MXIK, qadoq kodi va QQS** ni yozing (tasnif.soliq.uz / buxgalter).
4. Kichik summali haqiqiy to'lov bilan sinab ko'ring va Admin Panelda «Fiskal chek» havolasini tekshiring.
