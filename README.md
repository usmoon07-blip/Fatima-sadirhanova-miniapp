# 🧁 Fatima Sadirhanova — Premium qandolatchilik uchun Telegram bot + Mini App + Admin Panel

Loyiha 3 qismdan iborat va to'liq **sizning kompyuteringizda (localhost)** ishlaydi:

| Qism | Manzil | Vazifasi |
|---|---|---|
| **Backend (API + Bot)** | `http://localhost:4000` | Ma'lumotlar bazasi, buyurtmalar, Telegram bot |
| **Mini App** (mijozlar uchun) | `http://localhost:5173` | Telegram ichida ochiladigan do'kon |
| **Admin Panel** | `http://localhost:5174` | Buyurtmalar, mahsulotlar, kategoriyalar, stories |

---

## 0-QADAM. Kompyuterga o'rnatish kerak bo'lgan dasturlar

1. **Node.js 20 yoki 22 (LTS)** — https://nodejs.org → "LTS" tugmasini bosib yuklab oling va o'rnating.
2. **ngrok** — https://ngrok.com/download (bepul ro'yxatdan o'ting).
3. (Ixtiyoriy) **VS Code** — kodni ochish va `.env` faylini tahrirlash uchun: https://code.visualstudio.com

Tekshirish uchun terminalda (Windows: `cmd` yoki `PowerShell`):
```bash
node -v
```
`v20...` yoki `v22...` chiqsa — tayyor.

---

## 1-QADAM. Neon.tech'da PostgreSQL bazasini yaratish

1. https://neon.tech saytiga kiring → **Sign up** (Google akkaunt bilan kirish eng oson).
2. **Create project** tugmasini bosing:
   - Project name: `bakery`
   - Region: **Europe (Frankfurt)** — O'zbekistonga eng yaqini.
3. Loyiha ochilgach, **Connect** (yoki Dashboard'dagi "Connection string") tugmasini bosing.
4. **"Connection pooling"** belgisini **o'chiring** (pooled emas, oddiy ulanish kerak).
5. Ko'rsatilgan manzilni nusxa oling. U shunga o'xshaydi:
   ```
   postgresql://neondb_owner:AbCdEf123@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Bu manzilni pastdagi 3-qadamda `.env` fayliga qo'yasiz.

> ⚠️ Bu manzil — bazangiz paroli. Uni hech kimga yubormang va internetga joylamang.

---

## 2-QADAM. BotFather orqali bot ochish va token olish

1. Telegram'da **@BotFather** ni qidiring (ko'k galochkali rasmiy bot).
2. **Start** ni bosing, so'ng `/newbot` deb yozing.
3. Bot uchun **ism** yozing (mijozlar ko'radigan nom), masalan: `Fatima Sadirhanova Patisserie`
4. Bot uchun **username** yozing — oxiri `bot` bilan tugashi shart, masalan: `fatima_patisserie_bot`
5. BotFather sizga shunday **token** beradi:
   ```
   7412345678:AAHk3jd8sKJH3k4j5h6KJHkjh3k4jh5k6j7
   ```
6. Bu tokenni nusxa oling — 3-qadamda `.env` ga qo'yasiz.

Qo'shimcha (ixtiyoriy, chiroyli ko'rinish uchun) BotFather'da:
- `/setuserpic` — bot rasmi (logotip)
- `/setdescription` — "Qo'lda tayyorlangan premium tortlar va shirinliklar. Buyurtma bering — yetkazamiz!"

> ⚠️ Token — botingiz kaliti. Uni hech kimga bermang. Agar tarqalib ketsa, BotFather'da `/revoke` qiling.

---

## 3-QADAM. Loyihani sozlash (`.env` fayli)

1. Loyiha papkasini oching.
2. `.env.example` faylidan nusxa olib, nomini **`.env`** qiling:
   - Windows (PowerShell): `Copy-Item .env.example .env`
   - Mac / Linux: `cp .env.example .env`
3. `.env` faylini oching va to'ldiring:
   ```env
   DATABASE_URL="1-qadamdagi Neon manzili"
   BOT_TOKEN="2-qadamdagi token"
   WEBAPP_URL=""            # 6-qadamda ngrok manzilini qo'yasiz
   ADMIN_PASSWORD="egasi/menejer paroli"      # Admin Panel — hamma bo'limlar
   KITCHEN_PASSWORD="oshpaz paroli"           # faqat Oshxona ekrani
   JWT_SECRET="istalgan uzun tasodifiy matn"
   ```
   Do'kon nomi, telefon, manzil, "Biz haqimizda" matni, karta raqami, yetkazib berish narxi va taxminiy vaqt (`DELIVERY_ETA_MIN`, `PICKUP_ETA_MIN`) ham shu faylda o'zgartiriladi.

---

## 4-QADAM. Paketlarni o'rnatish, migratsiya va seed

Loyiha papkasida terminal oching va **bitta buyruq** yozing:

```bash
npm run setup
```

Bu buyruq avtomatik ravishda:
1. Backend, Mini App va Admin Panel paketlarini o'rnatadi (`npm install`);
2. Prisma migratsiyasini bazaga qo'llaydi — jadvallarni yaratadi (`prisma migrate deploy`);
3. Seed skriptini ishga tushiradi — **prayslist bo'yicha menyu** (4 kategoriya: Listli pirojenniylar, Shtuchniy pirojenniylar, Tortlar, Torjestvenniy tortlar — 34 mahsulot, 3 tilda), 4 ta story va 3 ta kurs qo'shadi. Mahsulot suratlari vaqtinchalik — Admin Panel > Mahsulotlar'dan haqiqiylarini yuklang. Kurs narxlari namuna — Admin Panel > Kurslar'da o'zgartiring.

Agar qadamlarni alohida bajarmoqchi bo'lsangiz:
```bash
npm install
npm --prefix miniapp install
npm --prefix admin install
npx prisma migrate deploy     # jadvallarni yaratish
npm run db:seed               # boshlang'ich mahsulotlar
```

Bazani vizual ko'rish uchun: `npm run db:studio`

---

## 5-QADAM. Loyihani ishga tushirish (localhost)

```bash
npm run dev
```

Bu bitta buyruq 3 ta qismni birga ishga tushiradi:
- 🟣 `API` — http://localhost:4000 (backend + bot)
- 🔵 `MINIAPP` — http://localhost:5173
- 🟡 `ADMIN` — http://localhost:5174 (brauzerda avtomatik ochiladi)

**Admin Panel'ga kirish:** http://localhost:5174 → faqat parol:
- `ADMIN_PASSWORD` — egasi va menejer (hamma bo'limlar);
- `KITCHEN_PASSWORD` — oshpaz (faqat Oshxona ekrani; oshxonadagi planshet/televizorda oching).

Parol 5 marta noto'g'ri kiritilsa, kirish 15 daqiqaga bloklanadi.

**Mini App'ni brauzerda sinash:** http://localhost:5173 (`.env` da `DEV_ALLOW_BROWSER=true` bo'lsa, Telegram'siz ham ochiladi).

To'xtatish: terminalda `Ctrl + C`.

---

## 6-QADAM. ngrok orqali Mini App'ni Telegram botga ulash

Telegram Mini App faqat **https** manzilda ishlaydi. ngrok kompyuteringizdagi `localhost:5173` ga vaqtinchalik https manzil beradi.

1. https://dashboard.ngrok.com da ro'yxatdan o'ting.
2. **Your Authtoken** sahifasidan tokenni nusxa oling va terminalda bir marta yozing:
   ```bash
   ngrok config add-authtoken SIZNING_NGROK_TOKENINGIZ
   ```
3. (Tavsiya) **Domains** bo'limida bitta **bepul statik domen** oling (masalan `fatima-bakery.ngrok-free.app`) — shunda manzil har safar o'zgarmaydi.
4. `npm run dev` ishlab turgan holda, **yangi terminal oynasida**:
   ```bash
   ngrok http 5173
   ```
   yoki statik domen bilan:
   ```bash
   ngrok http --url=fatima-bakery.ngrok-free.app 5173
   ```
5. ngrok `Forwarding` qatorida manzil beradi, masalan: `https://fatima-bakery.ngrok-free.app`
6. Shu manzilni `.env` ga yozing (oxirida `/` belgisisiz):
   ```env
   WEBAPP_URL="https://fatima-bakery.ngrok-free.app"
   ```
7. Birinchi terminalda `Ctrl + C` bosib, qayta `npm run dev` qiling. Terminalda shunday yozuv chiqadi:
   ```
   🤖 Bot ishga tushdi: @fatima_patisserie_bot
   ✅ Bot "Menyu" tugmasi ulandi: https://fatima-bakery.ngrok-free.app
   ```
8. Telegram'da botingizni oching → `/start` → telefon raqamingizni yuboring → **"🧁 Menyuni ochish"** tugmasini yoki pastdagi **"Menyu"** tugmasini bosing. 🎉

> ℹ️ ngrok bepul tarifida birinchi ochilishda "You are about to visit..." ogohlantirish sahifasi chiqishi mumkin — **Visit Site** ni bir marta bosing.
> Muqobil (ogohlantirishsiz): `cloudflared tunnel --url http://localhost:5173` (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

> ⚠️ Bepul ngrok domeni statik bo'lmasa, har safar ngrok qayta ishga tushganda yangi manzil beradi — uni `.env` dagi `WEBAPP_URL` ga yozib, backend'ni qayta ishga tushiring.

---

## Imkoniyatlar

### Mijoz uchun (Mini App + Bot)
- **3 til: o'zbek, rus, ingliz.** Bot `/start` da tilni so'raydi; Mini App ham birinchi ochilishda so'raydi. Menyu, taom nomlari, tarkibi va bot xabarlari tarjima qilingan. Til profil yoki botdagi `/lang` orqali istalgan payt almashtiriladi.
- **Bosh sahifa:** qidiruv, saqlangan manzil ("Buyurtma 4–7 kun avvaldan"), stories, tezkor tugmalar (Biz haqimizda, Kurslar, Sevimlilar, Buyurtmalar), kurslar banneri, kategoriyalar, mashhurlar.
- **Menyu:** kategoriyalar bo'yicha bo'limlar; kategoriya paneli tepada yopishib turadi va skroll qilganda joriy bo'lim o'zi belgilanadi. Qidiruv taom nomi, tarkibi yoki kategoriya bo'yicha (3 tilda).
- **Taom kartochkasi:** katta surat, nomi ikki tilda, tarkibi ro'yxat bo'lib, o'lcham, miqdor va doim ko'rinib turadigan narx tugmasi.
- **Savat:** "yana X so'm qo'shsangiz yetkazish bepul", jami summa har o'zgarishda qayta hisoblanadi.
- **Rasmiylashtirish:** yetkazib berish yoki olib ketish, **topshirish sanasi** (kamida `ORDER_ADVANCE_DAYS` = 4 kun keyin; server ham tekshiradi), joylashuvni bir bosishda aniqlash, telefon, vaqt, naqd yoki karta, izoh. **Manzil va telefon eslab qolinadi.**
- **Buyurtmalar:** rangli holat belgisi; **"Bekor qilish"** oshxona qabul qilmaguncha ishlaydi, keyin yo'qoladi; **"Yana buyurtma qilish"** bir bosishda.
- **Kurslar** (pastki menyuda): *Makaronterapiya* (online/offline), *Mukammal kurs* (online/offline), *Individual kurs — 1 kishi uchun* (offline). Har bir kursda tavsif, dastur, davomiylik va har format narxi. Mijoz formatni tanlab ariza qoldiradi (ism, telefon, to'lov turi, izoh), bot arizani 3 tilda tasdiqlaydi. "Mening kurslarim" — arizalar va holati, yangi arizani bekor qilish.
- **Profil:** telefon, saqlangan manzil, buyurtmalar soni, jami xarid, til, mening kurslarim, aloqa, ish vaqti.
- **Bot** buyurtma qabul qilinganda va har bir holat o'zgarganda mijozga uning tilida o'zi xabar yozadi.

### Restoran uchun (Admin Panel)
- **Oshxona ekrani:** 3 ustun (Yangi → Tayyorlanmoqda → Yo'lda / Olib ketishga tayyor). Yangi buyurtmada **tovushli signal**. Har kartochkada taymer: 15 daqiqadan keyin sariq, 25 daqiqadan keyin qizil. "Qabul qildim", "Tayyorlashni boshladim", "Tayyor — kuryerga berildi" tugmalari — har bosishda bot mijozga xabar yuboradi.
- **Buyurtmalar jadvali:** holat bo'yicha filtr, qidiruv, telefon bosilsa qo'ng'iroq, manzil xaritada ochiladi, holatni o'zgartirish va o'chirish.
- **Hisobot:** bugun / 7 / 30 / 90 kun / hammasi. Tushum, qo'lga tekkan pul, o'rtacha chek, bekor qilinganlar ulushi, yangi va qayta kelgan mijozlar, kurs arizalari, naqd/karta va yetkazish/olib ketish ulushi, kunlik tushum grafigi, soatlar bo'yicha yuklama, eng ko'p sotilgan taomlar, eng qadrli mijozlar.
- **Mahsulotlar, kategoriyalar, stories** — 3 tilda, surat yuklash bilan, dasturchisiz.
- **Kurslar:** kurs qo'shish/tahrirlash (3 tilda nom, tavsif, dastur, davomiylik; online va offline narxi alohida — narx bo'sh qolsa o'sha format yo'q).
- **Kursga yozilganlar:** barcha arizalar, holat (Yangi → Tasdiqlandi → To'landi → Kursni tugatdi), har o'zgarishda mijozga bot xabari; yangi ariza kelganda signal.

## Ish jarayoni (qanday ishlaydi)

1. Mijoz botda `/start` bosadi → tilni tanlaydi → telefon raqamini yuboradi → Mini App'ni ochadi.
2. Menyudan tanlaydi, savatga soladi, rasmiylashtiradi.
3. Buyurtma bazaga tushadi, bot mijozga "Buyurtmangiz qabul qilindi!" deb yozadi, Mini App yopiladi.
4. Buyurtma darhol Oshxona ekranida signal bilan paydo bo'ladi.
5. Oshpaz/menejer tugmalarni bosib holatni o'zgartiradi — har safar mijozga bot orqali xabar boradi.
6. (Ixtiyoriy) `.env` da `COURIER_CHAT_ID` ko'rsatilsa, "Kuryerga berildi" bosilganda buyurtma va mijoz lokatsiyasi kuryerlar guruhiga yuboriladi.
   - Guruh ID sini bilish: botni guruhga qo'shing, guruhga biror xabar yozing va brauzerda `https://api.telegram.org/bot<TOKEN>/getUpdates` ni oching — `"chat":{"id":-100...}` qiymati kerakli ID.

> Onlayn to'lov (Payme, Click, Uzum) — keyingi bosqich: buning uchun to'lov tizimi bilan shartnoma va merchant kalitlari kerak.

## Loyiha tuzilishi

```
├── src/                      # Backend (Node.js + Express + grammY)
│   ├── config/default.js
│   ├── core/bot.js
│   ├── database/connection.js
│   ├── models/               # User, Product, Category, Story, Order, Course, Enrollment
│   ├── controllers/          # botController, cartController, adminController
│   ├── routes/               # bot.routes, client.routes, admin.routes
│   ├── middlewares/auth.middleware.js
│   ├── utils/                # format.js, i18n.js (bot tarjimalari)
│   └── index.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── miniapp/                  # Mijozlar uchun React Mini App
├── admin/                    # React Admin Panel
├── uploads/                  # Admin yuklagan rasmlar
├── .env.example
└── package.json
```

## Foydali buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run setup` | Hammasini o'rnatish + migratsiya + seed |
| `npm run dev` | Backend + Mini App + Admin'ni ishga tushirish |
| `npm run db:migrate` | Migratsiyalarni bazaga qo'llash |
| `npm run db:seed` | Boshlang'ich mahsulotlar (baza bo'sh bo'lsa) |
| `npm run db:studio` | Bazani brauzerda ko'rish (Prisma Studio) |
| `npm run db:menu` | Menyuni (kategoriya, mahsulot, story) o'chirib, prayslist bo'yicha qayta yozish. Buyurtmalar, mijozlar va kurslar saqlanadi |

## Muammolar va yechimlar

- **`P1001: Can't reach database server`** — `DATABASE_URL` noto'g'ri yoki internet yo'q. Neon'dan manzilni qayta nusxa oling.
- **Botda "Menyu" tugmasi chiqmadi** — `WEBAPP_URL` `https://` bilan boshlanishi kerak; backend'ni qayta ishga tushiring.
- **Mini App "Telegram orqali kiring" deydi** — ilovani to'g'ridan-to'g'ri brauzerda emas, bot ichidagi tugma orqali oching; yoki `BOT_TOKEN` noto'g'ri.
- **Port band (`5173 is in use`)** — boshqa terminalda eski `npm run dev` ochiq qolgan, uni yoping.
