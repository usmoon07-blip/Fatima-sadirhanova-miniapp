/* Bazaga boshlang'ich kurslar va story'larni yozadi.
   Har bir bo'lim faqat bo'sh bo'lsa to'ldiriladi — qayta ishga tushirilsa ma'lumotlaringiz o'chmaydi. */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

// Rasmlar vaqtinchalik: Admin Panel > Kurslar bo'limidan haqiqiy suratlarni yuklang.
const IMG = {
  macarons: img('1569864358642-9d1684040f43'),
  celebration: img('1464349095431-e9a21285b5f3'),
  bento: img('1563729784474-d77dbb933a9e'),
  mousse: img('1606313564200-e75d5e30476c'),
  cheesecake: img('1533134242443-d4fd215305ad'),
  berry: img('1488477181946-6428a0291777'),
};

const courses = [
  {
    title: 'Makaronterapiya',
    category: 'Desertlar',
    badge: 'Hit',
    level: "Boshlang'ich",
    duration: '3 hafta',
    lessonsCount: 12,
    oldPrice: 990000,
    price: 790000,
    imageUrl: IMG.macarons,
    description: "Fransuz makaronlarini noldan o'rganing: silliq qopqoqlar, «yubka» va mukammal to'ldirmalar. Kurs oxirida o'z sovg'a qutingizni tayyorlaysiz.",
    program: [
      'Bodom uni va shakar tanlash',
      'Italyan va fransuz merengi',
      "Makaronaj — xamirni to'g'ri aralashtirish",
      'Qopqoqlarni quyish va pishirish',
      "Ganash, kurd va mevali to'ldirmalar",
      "Bo'yash, bezatish va qadoqlash",
    ],
    sortOrder: 1,
  },
  {
    title: 'Tortlar akademiyasi',
    category: 'Tortlar',
    badge: 'Premium',
    level: "Boshlang'ichdan professionalgacha",
    duration: '2 oy',
    lessonsCount: 40,
    oldPrice: 2990000,
    price: 2490000,
    imageUrl: IMG.celebration,
    description: "Qandolatchilikni boshidan oxirigacha: biskvitlar, kremlar, tortni yig'ish, bezash va tannarxni hisoblash. Uydan biznes boshlamoqchi bo'lganlar uchun.",
    program: [
      'Biskvit turlari va ularning sirlari',
      'Kremlar: krem-chiz, ganash, plombir kremi',
      "Tortni yig'ish va tekislash",
      'Bezash: gullar, shokolad dekor, yozuvlar',
      'Bayram va to\'y tortlari',
      "Tannarx, narx qo'yish va mijoz topish",
    ],
    sortOrder: 2,
  },
  {
    title: 'Bento tortlar',
    category: 'Tortlar',
    badge: 'Yangi',
    level: "Boshlang'ich",
    duration: '2 hafta',
    lessonsCount: 10,
    oldPrice: 690000,
    price: 490000,
    imageUrl: IMG.bento,
    description: "Instagramda eng ko'p so'raladigan mini tortlar. Kichik hajm, katta daromad: retseptlar, bezash va qadoqlash sirlari.",
    program: [
      'Bento uchun biskvit va krem',
      "Tortni yig'ish va silliq qoplash",
      "Rang berish va trend dizaynlar",
      'Yozuvlar va mini dekor',
      'Qadoqlash va sotish',
    ],
    sortOrder: 3,
  },
  {
    title: 'Muss desertlar va zerkalo glazur',
    category: 'Desertlar',
    level: "O'rta",
    duration: '3 hafta',
    lessonsCount: 14,
    oldPrice: 1290000,
    price: 990000,
    imageUrl: IMG.mousse,
    description: "Zamonaviy fransuz desertlari: muss, konfi, kremyu va oynadek yaltiroq glazur. Restoran darajasidagi desertlarni uyda tayyorlang.",
    program: [
      'Muss desert tuzilishi va qatlamlar',
      'Konfi, kremyu va krambl',
      'Silikon qoliplar bilan ishlash',
      'Zerkalo (oyna) glazur',
      'Velur va dekor elementlari',
    ],
    sortOrder: 4,
  },
];

const stories = [
  { title: 'Yangi oqim', imageUrl: IMG.macarons, text: "Makaronterapiya kursining yangi oqimiga qabul boshlandi! Joylar soni cheklangan.", sortOrder: 1 },
  { title: 'Chegirmalar', imageUrl: IMG.celebration, text: "Barcha kurslarga chegirmalar amalda. Shoshiling!", sortOrder: 2 },
  { title: 'Sertifikat', imageUrl: IMG.cheesecake, text: 'Kursni tugatgan har bir o\'quvchiga shaxsiy sertifikat beriladi.', sortOrder: 3 },
  { title: "Qanday o'qiymiz?", imageUrl: IMG.berry, text: "Video darslar, retseptlar va kurator bilan yopiq guruh. Istalgan vaqtda, o'zingizga qulay tezlikda.", sortOrder: 4 },
];

async function main() {
  if ((await prisma.course.count()) === 0) {
    for (const c of courses) await prisma.course.create({ data: c });
    console.log(`✅ ${courses.length} ta kurs qo'shildi.`);
  } else {
    console.log("ℹ️  Kurslar allaqachon bor — o'tkazib yuborildi.");
  }

  if ((await prisma.story.count()) === 0) {
    await prisma.story.createMany({ data: stories });
    console.log(`✅ ${stories.length} ta story qo'shildi.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
