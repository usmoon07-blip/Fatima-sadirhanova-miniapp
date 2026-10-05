/* Bazaga boshlang'ich kategoriyalar, mahsulotlar, story'lar va kurslarni yozadi.
   Har bir bo'lim faqat bo'sh bo'lsa to'ldiriladi — qayta ishga tushirilsa ma'lumotlaringiz o'chmaydi. */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

// ====== Menyu — Fatima Sadirkhanova prayslisti asosida ======
// Rasmlar vaqtinchalik: Admin Panel > Mahsulotlar'dan haqiqiy suratlarni yuklang.
const IMG = {
  napoleon: img('1612203985729-70726954388c'),
  layered: img('1571877227200-a0d98ea607e9'),
  honey: img('1578985545062-69928b1d9587'),
  pie: img('1519915028121-7d3463d20b13'),
  cheesecake: img('1533134242443-d4fd215305ad'),
  berry: img('1488477181946-6428a0291777'),
  meringue: img('1464305795204-6f5bbfc7fb81'),
  mini: img('1587668178277-295251f900ce'),
  macarons: img('1569864358642-9d1684040f43'),
  chocolate: img('1606313564200-e75d5e30476c'),
  cake: img('1563729784474-d77dbb933a9e'),
  celebration: img('1464349095431-e9a21285b5f3'),
};

const categories = [
  { key: 'list', name: 'Listli pirojenniylar', nameRu: 'Пирожные листами', nameEn: 'Tray pastries', imageUrl: IMG.layered, sortOrder: 1 },
  { key: 'piece', name: 'Shtuchniy pirojenniylar', nameRu: 'Штучные пирожные', nameEn: 'Individual pastries', imageUrl: IMG.mini, sortOrder: 2 },
  { key: 'cakes', name: 'Tortlar', nameRu: 'Торты', nameEn: 'Cakes', imageUrl: IMG.cake, sortOrder: 3 },
  { key: 'celebration', name: 'Torjestvenniy tortlar', nameRu: 'Торжественные торты', nameEn: 'Celebration cakes', imageUrl: IMG.celebration, sortOrder: 4 },
];

const LIST = (price) => [{ label: '1 list', price }];
const PIECE = (price) => [{ label: '1 dona', price }];

/** Listli pirojenniylar — narx 1 list uchun */
const listItems = [
  ['Napoleon', 'Наполеон', 'Napoleon', 500000, IMG.napoleon, true],
  ['Avganskiy Napoleon', 'Афганский Наполеон', 'Afghan Napoleon', 500000, IMG.napoleon],
  ['Spartak', 'Спартак', 'Spartak', 500000, IMG.chocolate],
  ['Negr', 'Негр', 'Negr', 500000, IMG.chocolate],
  ['Medovik', 'Медовик', 'Honey cake (Medovik)', 480000, IMG.honey, true],
  ['Paxlava', 'Пахлава', 'Baklava', 480000, IMG.layered],
  ['Fruktoviy pirog', 'Фруктовый пирог', 'Fruit pie', 450000, IMG.pie],
  ['Yablochno limonniy pirog', 'Яблочно-лимонный пирог', 'Apple and lemon pie', 450000, IMG.pie],
  ['Tvorojnik klassik bezeli', 'Творожник классический с безе', 'Classic curd cake with meringue', 450000, IMG.meringue],
  ['Tvorojnik limonniy', 'Творожник лимонный', 'Lemon curd cake', 450000, IMG.cheesecake],
  ['Tvorojnik malinoviy', 'Творожник малиновый', 'Raspberry curd cake', 450000, IMG.berry],
  ["Ptich'e moloko", 'Птичье молоко', "Bird's milk", 480000, IMG.chocolate],
  ['Arini ini', 'Пчелиное гнездо', "Bee's nest", 600000, IMG.honey],
  ['Shokoladno vishnyoviy tvorojnik', 'Шоколадно-вишнёвый творожник', 'Chocolate cherry curd cake', 550000, IMG.chocolate],
  ['Chizkeyk klassik yagodali', 'Чизкейк классический с ягодами', 'Classic berry cheesecake', 850000, IMG.cheesecake],
  ['Chizkeyk olchali', 'Чизкейк вишнёвый', 'Cherry cheesecake', 850000, IMG.cheesecake],
].map(([name, nameRu, nameEn, price, imageUrl, isPopular = false]) => ({
  cat: 'list', name, nameRu, nameEn, price, imageUrl, isPopular, sizes: LIST(price),
}));

listItems.push(
  {
    cat: 'list', name: 'Chizkeyk fistashka', nameRu: 'Фисташковый чизкейк', nameEn: 'Pistachio cheesecake',
    imageUrl: IMG.cheesecake, price: 850000, isPopular: true,
    sizes: [{ label: 'Yagodasiz — 1 list', price: 850000 }, { label: 'Yagodali — 1 list', price: 900000 }],
  },
  { cat: 'list', name: 'Merengoviy rulet', nameRu: 'Меренговый рулет', nameEn: 'Meringue roll', imageUrl: IMG.meringue, price: 300000, sizes: PIECE(300000) },
);

/** Shtuchniy pirojenniylar — narx 1 dona uchun */
const pieceItems = [
  {
    name: 'Mini pirojenniy', nameRu: 'Мини-пирожное', nameEn: 'Mini pastry', price: 30000, imageUrl: IMG.mini,
    description: 'Listda 24 dona.', descriptionRu: 'В листе 24 шт.', descriptionEn: '24 pieces per tray.', sizes: PIECE(30000),
  },
  {
    name: 'Pavlova pirojenniysi', nameRu: 'Пирожное Павлова', nameEn: 'Pavlova', price: 25000, imageUrl: IMG.meringue,
    description: 'Listda 24 dona.', descriptionRu: 'В листе 24 шт.', descriptionEn: '24 pieces per tray.', sizes: PIECE(25000),
  },
  {
    name: 'Medoviy mini', nameRu: 'Медовик мини', nameEn: 'Mini honey cake', price: 30000, imageUrl: IMG.honey,
    description: 'Listda 24 dona.', descriptionRu: 'В листе 24 шт.', descriptionEn: '24 pieces per tray.', sizes: PIECE(30000),
  },
  {
    name: 'Makaronlar', nameRu: 'Макаруны', nameEn: 'Macarons', price: 15000, imageUrl: IMG.macarons, isPopular: true,
    description: 'Listda 56 dona.', descriptionRu: 'В листе 56 шт.', descriptionEn: '56 pieces per tray.', sizes: PIECE(15000),
  },
  {
    name: 'Lastochka', nameRu: 'Ласточка', nameEn: 'Lastochka', price: 12000, imageUrl: IMG.chocolate,
    sizes: [{ label: '1 dona', price: 12000 }, { label: '1 list', price: 576000 }],
  },
  {
    name: 'Muraveynik', nameRu: 'Муравейник', nameEn: 'Anthill (Muraveynik)', price: 12000, imageUrl: IMG.honey,
    sizes: [{ label: '1 dona', price: 12000 }, { label: '1 list', price: 576000 }],
  },
  {
    name: 'Kartoshka', nameRu: 'Картошка', nameEn: 'Kartoshka', price: 10000, imageUrl: IMG.chocolate, isPopular: true,
    sizes: [{ label: '1 dona', price: 10000 }, { label: '1 list', price: 480000 }],
  },
  { name: 'Fruktovaya podushka', nameRu: 'Фруктовая подушка', nameEn: 'Fruit pillow', price: 12000, imageUrl: IMG.pie, sizes: PIECE(12000) },
  { name: 'Vishnyovaya trubochka', nameRu: 'Вишнёвая трубочка', nameEn: 'Cherry roll', price: 12000, imageUrl: IMG.pie, sizes: PIECE(12000) },
].map((p) => ({ cat: 'piece', ...p }));

/** Tortlar — narx 1 dona tort uchun */
const cakeItems = [
  ['Merengoviy tort', 'Меренговый торт', 'Meringue cake', 800000, IMG.meringue],
  ['Maxroviy tort', 'Махровый торт', 'Makhroviy cake', 650000, IMG.cake],
  ['Orexoviy tort', 'Ореховый торт', 'Walnut cake', 800000, IMG.honey],
  ['Domashniy tort', 'Домашний торт', 'Homemade cake', 1000000, IMG.cake],
  ['Chococherry torti', 'Торт Чоко-черри', 'Choco-cherry cake', 800000, IMG.chocolate],
  ['Snikers tort', 'Торт Сникерс', 'Snickers cake', 1000000, IMG.chocolate, true],
].map(([name, nameRu, nameEn, price, imageUrl, isPopular = false]) => ({
  cat: 'cakes', name, nameRu, nameEn, price, imageUrl, isPopular,
}));

/** Torjestvenniy tortlar — porsiyasi 60 000 – 65 000 so'mdan (dizaynga qarab) */
const PORTION = 60000;
const celebration = {
  cat: 'celebration', isPopular: true, badge: 'Buyurtma',
  name: 'Torjestvenniy tort', nameRu: 'Торжественный торт', nameEn: 'Celebration cake',
  description: "Porsiyasi 60 000 – 65 000 so'mdan (dizaynga qarab). Masalan, 20 kishilik tort — 1 200 000 so'm. Yakuniy narx dizayn kelishilgach aniqlanadi.",
  descriptionRu: 'Порция от 60 000 – 65 000 сум (в зависимости от дизайна). Например, торт на 20 человек — 1 200 000 сум. Итоговая цена определяется после согласования дизайна.',
  descriptionEn: 'From 60,000 – 65,000 UZS per portion (depending on design). For example, a cake for 20 people is 1,200,000 UZS. The final price is confirmed once the design is agreed.',
  imageUrl: IMG.celebration, price: 10 * PORTION,
  sizes: [10, 15, 20, 25, 30, 40, 50].map((n) => ({ label: `${n} kishilik`, price: n * PORTION })),
};

const products = [...listItems, ...pieceItems, ...cakeItems, celebration].map((p) => ({
  description: '', rating: 5, reviewsCount: 0, ...p,
}));

const stories = [
  { title: 'Prayslist', titleRu: 'Прайс', titleEn: 'Prices', imageUrl: IMG.layered,
    text: "Listli pirojenniylar 300 000 so'mdan, tortlar 650 000 so'mdan.",
    textRu: 'Пирожные листами от 300 000 сум, торты от 650 000 сум.',
    textEn: 'Tray pastries from 300,000 UZS, cakes from 650,000 UZS.' },
  { title: 'Bayram', titleRu: 'Праздник', titleEn: 'Party', imageUrl: IMG.celebration,
    text: "Torjestvenniy tortlar — porsiyasi 60 000 so'mdan. 20 kishilik tort — 1 200 000 so'm.",
    textRu: 'Торжественные торты — порция от 60 000 сум. Торт на 20 человек — 1 200 000 сум.',
    textEn: 'Celebration cakes from 60,000 UZS per portion. A cake for 20 people is 1,200,000 UZS.' },
  { title: 'Makaron', titleRu: 'Макаруны', titleEn: 'Macarons', imageUrl: IMG.macarons,
    text: "Makaronlar — 15 000 so'mdan. Listda 56 dona.",
    textRu: 'Макаруны — от 15 000 сум. В листе 56 шт.',
    textEn: 'Macarons from 15,000 UZS. 56 pieces per tray.' },
  { title: 'Buyurtma', titleRu: 'Заказ', titleEn: 'Orders', imageUrl: IMG.cake,
    text: 'Buyurtmalarni 4–7 kun avvaldan bering 🎂',
    textRu: 'Заказывайте за 4–7 дней 🎂',
    textEn: 'Please order 4–7 days in advance 🎂' },
];

// Narxlar namuna sifatida — Admin Panel > Kurslar bo'limida o'zgartiring
const courses = [
  {
    title: 'Makaronterapiya', titleRu: 'Макаронтерапия', titleEn: 'Macaron Therapy',
    badge: 'Hit',
    description: "Fransuz makaronlarini noldan o'rganing: silliq qopqoqlar, «yubka» va mukammal to'ldirmalar. Kurs oxirida o'z sovg'a qutingizni tayyorlaysiz.",
    descriptionRu: 'Научитесь готовить французские макаруны с нуля: гладкие крышечки, «юбочка» и идеальные начинки. В конце курса соберёте свою подарочную коробку.',
    descriptionEn: 'Learn French macarons from scratch: smooth shells, perfect "feet" and fillings. You will assemble your own gift box at the end.',
    program: ["Bodom uni va shakar tanlash", "Italyan va fransuz merengi", "Makaronaj — xamirni to'g'ri aralashtirish", "Qopqoqlarni quyish va pishirish", "Ganash, kurd va mevali to'ldirmalar", "Bo'yash, bezatish va qadoqlash"],
    programRu: ['Выбор миндальной муки и сахара', 'Итальянская и французская меренга', 'Макаронаж — правильное смешивание', 'Отсадка и выпекание крышечек', 'Ганаш, курд и фруктовые начинки', 'Окрашивание, декор и упаковка'],
    programEn: ['Choosing almond flour and sugar', 'Italian and French meringue', 'Macaronage — mixing the batter right', 'Piping and baking the shells', 'Ganache, curd and fruit fillings', 'Colouring, decorating and packaging'],
    duration: '2 kun · 8 soat', durationRu: '2 дня · 8 часов', durationEn: '2 days · 8 hours',
    imageUrl: img('1569864358642-9d1684040f43'), onlinePrice: 790000, offlinePrice: 1490000, sortOrder: 1,
  },
  {
    title: 'Mukammal kurs', titleRu: 'Полный курс', titleEn: 'Complete Course',
    badge: 'Premium',
    description: "Qandolatchilikni boshidan oxirigacha: biskvitlar, kremlar, muss tortlar, bezash va tannarxni hisoblash. Uydan biznes boshlamoqchi bo'lganlar uchun.",
    descriptionRu: 'Кондитерское дело от А до Я: бисквиты, кремы, муссовые торты, декор и расчёт себестоимости. Для тех, кто хочет начать бизнес из дома.',
    descriptionEn: 'Pastry from A to Z: sponges, creams, mousse cakes, decorating and costing. For those who want to start a home bakery business.',
    program: ['Biskvit turlari va ularning sirlari', 'Kremlar: krem-chiz, ganash, plombir kremi', "Tortni yig'ish va tekislash", 'Muss tortlar va glazur (zerkalo)', 'Bezash: gullar, shokolad dekor, yozuvlar', 'Tannarx, narx qo\'yish va mijoz topish'],
    programRu: ['Виды бисквитов и их секреты', 'Кремы: крем-чиз, ганаш, пломбирный', 'Сборка и выравнивание торта', 'Муссовые торты и зеркальная глазурь', 'Декор: цветы, шоколад, надписи', 'Себестоимость, ценообразование и поиск клиентов'],
    programEn: ['Types of sponge and their secrets', 'Creams: cream cheese, ganache, ice-cream cream', 'Assembling and levelling a cake', 'Mousse cakes and mirror glaze', 'Decorating: flowers, chocolate, lettering', 'Costing, pricing and finding customers'],
    duration: '10 kun · 40 soat', durationRu: '10 дней · 40 часов', durationEn: '10 days · 40 hours',
    imageUrl: img('1464349095431-e9a21285b5f3'), onlinePrice: 2490000, offlinePrice: 4900000, sortOrder: 2,
  },
  {
    title: 'Individual kurs (1 kishi uchun)', titleRu: 'Индивидуальный курс (для 1 человека)', titleEn: 'Private Course (1 person)',
    description: "Ustoz bilan yakkama-yakka offline dars. Dasturni o'zingiz tanlaysiz — siz xohlagan desert va texnikalar, qulay vaqtda.",
    descriptionRu: 'Индивидуальное офлайн-занятие с мастером. Программу выбираете вы — любые десерты и техники в удобное время.',
    descriptionEn: 'One-to-one offline lesson with the chef. You choose the programme — any desserts and techniques, at a time that suits you.',
    program: ["Dastur siz bilan kelishiladi", "Barcha ingredientlar va jihozlar bizdan", "Tayyorlagan shirinliklaringizni olib ketasiz", 'Retseptlar va texnik kartalar', "Kursdan keyin 1 oy savol-javob qo'llab-quvvatlash"],
    programRu: ['Программа согласовывается с вами', 'Все ингредиенты и оборудование — наши', 'Приготовленные десерты забираете с собой', 'Рецепты и технологические карты', 'Поддержка с вопросами 1 месяц после курса'],
    programEn: ['Programme agreed with you', 'All ingredients and equipment provided', 'Take home everything you make', 'Recipes and technical sheets', '1 month of Q&A support after the course'],
    duration: 'Kelishiladi', durationRu: 'По договорённости', durationEn: 'By arrangement',
    imageUrl: img('1556910103-1c02745aae4d'), onlinePrice: null, offlinePrice: 3500000, sortOrder: 3,
  },
];


// `npm run db:menu` — mavjud menyuni (kategoriya, mahsulot, story) o'chirib, prayslist bo'yicha qayta yozadi.
// Buyurtmalar tarixi saqlanadi (ular mahsulot nusxasini o'zida saqlaydi).
const REPLACE_MENU = process.argv.includes('--menu');

async function main() {
  if (REPLACE_MENU) {
    await prisma.$transaction([prisma.product.deleteMany(), prisma.category.deleteMany(), prisma.story.deleteMany()]);
    console.log("🗑  Eski menyu o'chirildi.");
  }

  if ((await prisma.product.count()) === 0) {
    const catIds = {};
    for (const { key, ...data } of categories) {
      const c = await prisma.category.create({ data });
      catIds[key] = c.id;
    }
    for (const [i, { cat, ...p }] of products.entries()) {
      await prisma.product.create({ data: { ...p, sizes: p.sizes || [], categoryId: catIds[cat], sortOrder: i + 1 } });
    }
    console.log(`✅ ${categories.length} kategoriya va ${products.length} mahsulot qo'shildi.`);
  } else {
    console.log("ℹ️  Mahsulotlar allaqachon bor — o'tkazib yuborildi.");
  }

  if ((await prisma.story.count()) === 0) {
    for (const [i, s] of stories.entries()) await prisma.story.create({ data: { ...s, sortOrder: i + 1 } });
    console.log(`✅ ${stories.length} story qo'shildi.`);
  }

  if ((await prisma.course.count()) === 0) {
    for (const c of courses) await prisma.course.create({ data: c });
    console.log(`✅ ${courses.length} ta kurs qo'shildi.`);
  }

}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
