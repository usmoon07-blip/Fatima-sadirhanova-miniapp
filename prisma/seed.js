/* Bazaga boshlang'ich kurslar va story'larni yozadi.
   Har bir bo'lim faqat bo'sh bo'lsa to'ldiriladi — qayta ishga tushirilsa ma'lumotlaringiz o'chmaydi. */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { buildCourses, fixProgram, REMOVE_TITLES } = require('./catalog-v2');
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


// Rus va ingliz tarjimalari — bazada bo'sh bo'lsa to'ldiriladi (siz yozganlaringiz o'zgarmaydi)
const COURSE_TR = {
  Makaronterapiya: {
    titleRu: 'Макаронтерапия', titleEn: 'Macaron Therapy',
    categoryRu: 'Десерты', categoryEn: 'Desserts',
    levelRu: 'Начальный', levelEn: 'Beginner',
    durationRu: '3 недели', durationEn: '3 weeks',
    descriptionRu: 'Научитесь готовить французские макаруны с нуля: гладкие крышечки, «юбочка» и идеальные начинки. В конце курса вы соберёте свою подарочную коробку.',
    descriptionEn: 'Learn French macarons from scratch: smooth shells, perfect "feet" and fillings. At the end of the course you will assemble your own gift box.',
    programRu: ['Выбор миндальной муки и сахара', 'Итальянская и французская меренга', 'Макаронаж — правильное смешивание', 'Отсадка и выпекание крышечек', 'Ганаш, курд и фруктовые начинки', 'Окрашивание, декор и упаковка'],
    programEn: ['Choosing almond flour and sugar', 'Italian and French meringue', 'Macaronage — mixing the batter right', 'Piping and baking the shells', 'Ganache, curd and fruit fillings', 'Colouring, decorating and packaging'],
  },
  'Tortlar akademiyasi': {
    titleRu: 'Академия тортов', titleEn: 'Cake Academy',
    categoryRu: 'Торты', categoryEn: 'Cakes',
    levelRu: 'От новичка до профессионала', levelEn: 'From beginner to professional',
    durationRu: '2 месяца', durationEn: '2 months',
    descriptionRu: 'Кондитерское дело от А до Я: бисквиты, авторский крем, сборка и декор торта. Научитесь печь вкусные и красивые торты дома — для себя и своих близких.',
    descriptionEn: 'Pastry from A to Z: sponges, signature cream, cake assembly and decorating. Learn to bake delicious, beautiful cakes at home for yourself and your loved ones.',
    programRu: ['Виды бисквитов и их секреты', 'Кремы: крем-чиз, ганаш, пломбирный', 'Сборка и выравнивание торта', 'Декор: цветы, шоколад, надписи', 'Праздничные и свадебные торты'],
    programEn: ['Types of sponge and their secrets', 'Creams: cream cheese, ganache, ice-cream cream', 'Assembling and levelling a cake', 'Decorating: flowers, chocolate, lettering', 'Celebration and wedding cakes'],
  },
  'Bento tortlar': {
    titleRu: 'Бенто-торты', titleEn: 'Bento Cakes',
    categoryRu: 'Торты', categoryEn: 'Cakes',
    levelRu: 'Начальный', levelEn: 'Beginner',
    durationRu: '2 недели', durationEn: '2 weeks',
    descriptionRu: 'Самые популярные мини-торты в Instagram. Маленький размер — большой доход: рецепты, декор и секреты упаковки.',
    descriptionEn: 'The most requested mini cakes on Instagram. Small size, big income: recipes, decorating and packaging secrets.',
    programRu: ['Бисквит и крем для бенто', 'Сборка и ровное покрытие', 'Цвет и трендовый дизайн', 'Надписи и мини-декор', 'Упаковка и продажи'],
    programEn: ['Sponge and cream for bento', 'Assembling and smooth coating', 'Colour and trendy designs', 'Lettering and mini decor', 'Packaging and selling'],
  },
  'Muss desertlar va zerkalo glazur': {
    titleRu: 'Муссовые десерты и зеркальная глазурь', titleEn: 'Mousse Desserts and Mirror Glaze',
    categoryRu: 'Десерты', categoryEn: 'Desserts',
    levelRu: 'Средний', levelEn: 'Intermediate',
    durationRu: '3 недели', durationEn: '3 weeks',
    descriptionRu: 'Современные французские десерты: мусс, конфи, кремю и глазурь с зеркальным блеском. Десерты ресторанного уровня у вас дома.',
    descriptionEn: 'Modern French desserts: mousse, confit, cremeux and a mirror-shine glaze. Restaurant-level desserts at home.',
    programRu: ['Структура муссового десерта и слои', 'Конфи, кремю и крамбл', 'Работа с силиконовыми формами', 'Зеркальная глазурь', 'Велюр и элементы декора'],
    programEn: ['Mousse dessert structure and layers', 'Confit, cremeux and crumble', 'Working with silicone moulds', 'Mirror glaze', 'Velour and decor elements'],
  },
};

const STORY_TR = {
  'Yangi oqim': { titleRu: 'Новый поток', titleEn: 'New intake', textRu: 'Открыт набор в новый поток курса «Макаронтерапия»! Количество мест ограничено.', textEn: 'Enrolment for the new Macaron Therapy intake is open! Places are limited.' },
  Chegirmalar: { titleRu: 'Скидки', titleEn: 'Discounts', textRu: 'На все курсы действуют скидки. Успейте!', textEn: 'All courses are on sale. Hurry!' },
  Sertifikat: { titleRu: 'Сертификат', titleEn: 'Certificate', textRu: 'Каждый, кто завершит курс, получит именной сертификат.', textEn: 'Everyone who completes a course receives a personal certificate.' },
  "Qanday o'qiymiz?": { titleRu: 'Как проходит обучение?', titleEn: 'How do we learn?', textRu: 'Видеоуроки, рецепты и закрытая группа с куратором. В любое время, в удобном темпе.', textEn: 'Video lessons, recipes and a private group with a curator. Any time, at your own pace.' },
};

const courses = [
  {
    title: 'Makaronterapiya',
    category: 'Desertlar',
    badge: 'Hit',
    level: "Boshlang'ich",
    duration: '3 hafta',
    lessonsCount: 12,
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
    price: 2490000,
    imageUrl: IMG.celebration,
    description: "Qandolatchilikni boshidan oxirigacha: biskvitlar, mualliflik kremi, tortni yig'ish va bezash. Uyda o'zingiz va yaqinlaringiz uchun mazali, chiroyli tortlar pishirishni o'rganing.",
    program: [
      'Biskvit turlari va ularning sirlari',
      'Kremlar: krem-chiz, ganash, plombir kremi',
      "Tortni yig'ish va tekislash",
      'Bezash: gullar, shokolad dekor, yozuvlar',
      'Bayram va to\'y tortlari',
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

  // Tarjimalarni to'ldirish: faqat bo'sh maydonlar
  let filled = 0;
  for (const c of await prisma.course.findMany()) {
    const tr = COURSE_TR[c.title];
    if (!tr) continue;
    const data = {};
    for (const [k, v] of Object.entries(tr)) {
      const cur = c[k];
      if (cur == null || (Array.isArray(cur) && cur.length === 0)) data[k] = v;
    }
    if (Object.keys(data).length) { await prisma.course.update({ where: { id: c.id }, data }); filled += 1; }
  }
  for (const st of await prisma.story.findMany()) {
    const tr = STORY_TR[st.title];
    if (!tr) continue;
    const data = Object.fromEntries(Object.entries(tr).filter(([k]) => st[k] == null));
    if (Object.keys(data).length) { await prisma.story.update({ where: { id: st.id }, data }); filled += 1; }
  }
  if (filled) console.log(`✅ ${filled} ta yozuvga rus/ingliz tarjimasi qo'shildi.`);

  await catalogV2();
  await noDiscounts();
  await creamPrograms();
  await academyDescription();
  await readyCoursesOnly();
}

/* Katalog v2 (bir marta): har bir desert alohida kurs; Bento va Muss yashiriladi.
   Bajarilgani Setting jadvalida belgilanadi — keyin Admin Panelda qilingan o'zgarishlar qayta yozilmaydi. */
async function catalogV2() {
  const FLAG = 'catalog_v2_done';
  if (await prisma.setting.findUnique({ where: { key: FLAG } })) return;

  const hidden = await prisma.course.updateMany({ where: { title: { in: REMOVE_TITLES } }, data: { isActive: false } });
  const existing = new Set((await prisma.course.findMany({ select: { title: true } })).map((c) => c.title));
  let added = 0;
  for (const c of buildCourses()) {
    if (existing.has(c.title)) continue;
    await prisma.course.create({ data: c });
    added += 1;
  }
  await prisma.setting.create({ data: { key: FLAG, value: new Date().toISOString() } });
  console.log(`✅ Katalog v2: ${added} ta yangi kurs qo'shildi, ${hidden.count} ta kurs yashirildi.`);
}

/* Chegirmalar olib tashlandi (bir marta): barcha kurslarning eski narxi tozalanadi. */
async function noDiscounts() {
  const FLAG = 'no_discounts_done';
  if (await prisma.setting.findUnique({ where: { key: FLAG } })) return;
  const r = await prisma.course.updateMany({ where: { oldPrice: { not: null } }, data: { oldPrice: null } });
  await prisma.story.updateMany({ where: { title: 'Chegirmalar' }, data: { isActive: false } });
  await prisma.setting.create({ data: { key: FLAG, value: new Date().toISOString() } });
  console.log(`✅ ${r.count} ta kursdan eski narx (chegirma) olib tashlandi, «Chegirmalar» hikoyasi yashirildi.`);
}

/* Dasturlar (bir marta): «Saqlash, qadoqlash...» bandi olib tashlanadi, krem bandlari — «Mualliflik kremi». */
async function creamPrograms() {
  const FLAG = 'programs_v2_done'; // tannarx bandi ham olib tashlanadi (qayta ishlatish xavfsiz)
  if (await prisma.setting.findUnique({ where: { key: FLAG } })) return;
  let n = 0;
  for (const c of await prisma.course.findMany({ select: { id: true, program: true, programRu: true, programEn: true } })) {
    const fixed = fixProgram(c);
    if (JSON.stringify(fixed) !== JSON.stringify({ program: c.program, programRu: c.programRu, programEn: c.programEn })) {
      await prisma.course.update({ where: { id: c.id }, data: fixed });
      n += 1;
    }
  }
  await prisma.setting.create({ data: { key: FLAG, value: new Date().toISOString() } });
  console.log(`✅ ${n} ta kurs dasturi yangilandi (Mualliflik kremi).`);
}

/* Tortlar akademiyasi tavsifi (bir marta): tannarx va biznes haqidagi gaplar olib tashlandi — kurs uyda pishirish uchun.
   Faqat eski matn o'zgarmagan bo'lsa yangilanadi (Admin Panelda tahrirlangan matnga tegmaydi). */
const ACADEMY_OLD = {"description": "Qandolatchilikni boshidan oxirigacha: biskvitlar, kremlar, tortni yig'ish, bezash va tannarxni hisoblash. Uydan biznes boshlamoqchi bo'lganlar uchun.", "descriptionRu": "Кондитерское дело от А до Я: бисквиты, кремы, сборка торта, декор и расчёт себестоимости. Для тех, кто хочет начать бизнес из дома.", "descriptionEn": "Pastry from A to Z: sponges, creams, cake assembly, decorating and costing. For those who want to start a home bakery business."};
const ACADEMY_NEW = {"description": "Qandolatchilikni boshidan oxirigacha: biskvitlar, mualliflik kremi, tortni yig'ish va bezash. Uyda o'zingiz va yaqinlaringiz uchun mazali, chiroyli tortlar pishirishni o'rganing.", "descriptionRu": "Кондитерское дело от А до Я: бисквиты, авторский крем, сборка и декор торта. Научитесь печь вкусные и красивые торты дома — для себя и своих близких.", "descriptionEn": "Pastry from A to Z: sponges, signature cream, cake assembly and decorating. Learn to bake delicious, beautiful cakes at home for yourself and your loved ones."};
async function academyDescription() {
  const FLAG = 'academy_desc_done';
  if (await prisma.setting.findUnique({ where: { key: FLAG } })) return;
  let n = 0;
  for (const field of Object.keys(ACADEMY_OLD)) {
    const r = await prisma.course.updateMany({ where: { [field]: ACADEMY_OLD[field] }, data: { [field]: ACADEMY_NEW[field] } });
    n += r.count;
  }
  await prisma.setting.create({ data: { key: FLAG, value: new Date().toISOString() } });
  console.log(`✅ Tortlar akademiyasi tavsifi yangilandi (${n} ta maydon).`);
}

/* Tayyor darslar (bir marta): faqat darsi tayyor 10 ta kurs ko'rinadi, qolganlari yashiriladi.
   Yashirilgan kursni sotib olganlar unga kirishni yo'qotmaydi. Keyin Admin Panelda istalgan kursni yoqish mumkin. */
const READY_TITLES = [
  'Lastochka klassik', 'Lastochka choco', 'Spartak', 'Muraveynik', 'Ptiche moloko klassik',
  'Ptiche moloko choco', 'Snikers tort', 'Maxroviy', 'Napoleon', 'Medovik',
];
async function readyCoursesOnly() {
  const FLAG = 'ready_courses_v1_done';
  if (await prisma.setting.findUnique({ where: { key: FLAG } })) return;
  const on = await prisma.course.updateMany({ where: { title: { in: READY_TITLES } }, data: { isActive: true } });
  const off = await prisma.course.updateMany({ where: { title: { notIn: READY_TITLES }, isActive: true }, data: { isActive: false } });
  await prisma.setting.create({ data: { key: FLAG, value: new Date().toISOString() } });
  console.log(`✅ Tayyor darslar: ${on.count} ta kurs ochiq, ${off.count} ta kurs yashirildi.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
