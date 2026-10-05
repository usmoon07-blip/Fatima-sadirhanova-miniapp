/* Bazaga boshlang'ich kategoriyalar, mahsulotlar, story'lar va promokodlarni yozadi.
   Har bir bo'lim faqat bo'sh bo'lsa to'ldiriladi — qayta ishga tushirilsa ma'lumotlaringiz o'chmaydi. */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const categories = [
  { key: 'cakes', name: 'Tortlar', nameRu: 'Торты', nameEn: 'Cakes', imageUrl: img('1578985545062-69928b1d9587'), sortOrder: 1 },
  { key: 'cupcakes', name: 'Keks va kapkeyklar', nameRu: 'Кексы и капкейки', nameEn: 'Cupcakes', imageUrl: img('1587668178277-295251f900ce'), sortOrder: 2 },
  { key: 'pastries', name: 'Pishiriqlar', nameRu: 'Выпечка', nameEn: 'Pastries', imageUrl: img('1555507036-ab1f4038808a'), sortOrder: 3 },
  { key: 'cookies', name: 'Pechenyelar', nameRu: 'Печенье', nameEn: 'Cookies', imageUrl: img('1499636136210-6f4ee915583e'), sortOrder: 4 },
  { key: 'desserts', name: 'Desertlar', nameRu: 'Десерты', nameEn: 'Desserts', imageUrl: img('1571877227200-a0d98ea607e9'), sortOrder: 5 },
  { key: 'drinks', name: 'Ichimliklar', nameRu: 'Напитки', nameEn: 'Drinks', imageUrl: img('1495474472287-4d71bcdd2085'), sortOrder: 6 },
];

const products = [
  {
    cat: 'cakes', badge: 'Bestseller', isPopular: true,
    name: 'Qulupnayli Shortcake', nameRu: 'Клубничный шорткейк', nameEn: 'Strawberry Shortcake',
    description: "Yengil biskvit, yangi qulupnay va qaymoqli krem — klassik retsept bo'yicha qo'lda tayyorlanadi.",
    descriptionRu: 'Лёгкий бисквит, свежая клубника и сливочный крем — ручная работа по классическому рецепту.',
    descriptionEn: 'Light sponge, fresh strawberries and whipped cream — handmade from a classic recipe.',
    imageUrl: img('1565958011703-44f9829ba187'), price: 249000, oldPrice: 290000, rating: 4.9, reviewsCount: 218,
    ingredients: ['Vanilli biskvit', 'Yangi qulupnay', 'Tabiiy qaymoq (33%)', 'Mascarpone kremi', 'Qulupnay konfityuri'],
    ingredientsRu: ['Ванильный бисквит', 'Свежая клубника', 'Натуральные сливки (33%)', 'Крем маскарпоне', 'Клубничный конфитюр'],
    ingredientsEn: ['Vanilla sponge', 'Fresh strawberries', 'Natural cream (33%)', 'Mascarpone cream', 'Strawberry confiture'],
    sizes: [{ label: '16 sm (6–8)', price: 249000 }, { label: '20 sm (10–12)', price: 349000 }, { label: '24 sm (14–16)', price: 449000 }],
  },
  {
    cat: 'cakes', isPopular: true,
    name: 'Shokoladli Truffle tort', nameRu: 'Шоколадный торт Трюфель', nameEn: 'Chocolate Truffle Cake',
    description: 'Belgiya shokoladidan tayyorlangan nam biskvit va ganash. Shokolad ishqibozlari uchun.',
    descriptionRu: 'Влажный бисквит и ганаш из бельгийского шоколада. Для настоящих любителей шоколада.',
    descriptionEn: 'Moist sponge and ganache made with Belgian chocolate. For true chocolate lovers.',
    imageUrl: img('1578985545062-69928b1d9587'), price: 289000, rating: 4.8, reviewsCount: 164,
    ingredients: ['Belgiya qora shokoladi (70%)', 'Kakao biskvit', 'Shokoladli ganash', "Sariyog'", 'Fundukli krokant'],
    ingredientsRu: ['Бельгийский тёмный шоколад (70%)', 'Какао-бисквит', 'Шоколадный ганаш', 'Сливочное масло', 'Фундучный кракант'],
    ingredientsEn: ['Belgian dark chocolate (70%)', 'Cocoa sponge', 'Chocolate ganache', 'Butter', 'Hazelnut crunch'],
    sizes: [{ label: '16 sm (6–8)', price: 289000 }, { label: '20 sm (10–12)', price: 389000 }],
  },
  {
    cat: 'cakes',
    name: 'Qizil baxmal (Red Velvet)', nameRu: 'Красный бархат', nameEn: 'Red Velvet',
    description: 'Mayin qizil biskvit va krem-pishloq — bayram dasturxonining yulduzi.',
    descriptionRu: 'Нежный красный бисквит и крем-чиз — звезда праздничного стола.',
    descriptionEn: 'Tender red sponge with cream cheese — the star of any celebration.',
    imageUrl: img('1563729784474-d77dbb933a9e'), price: 269000, rating: 4.7, reviewsCount: 97,
    ingredients: ['Red velvet biskvit', 'Krem-pishloq', 'Oq shokolad', 'Vanil'],
    ingredientsRu: ['Бисквит red velvet', 'Крем-чиз', 'Белый шоколад', 'Ваниль'],
    ingredientsEn: ['Red velvet sponge', 'Cream cheese', 'White chocolate', 'Vanilla'],
    sizes: [{ label: '16 sm (6–8)', price: 269000 }, { label: '20 sm (10–12)', price: 369000 }],
  },
  {
    cat: 'cupcakes', badge: 'Bestseller', isPopular: true,
    name: 'Shokoladli kapkeyk', nameRu: 'Шоколадный капкейк', nameEn: 'Chocolate Cupcake',
    description: 'Shokoladli keks va mayin shokoladli krem shapkasi.',
    descriptionRu: 'Шоколадный кекс с нежной шапочкой из шоколадного крема.',
    descriptionEn: 'Chocolate cupcake topped with silky chocolate cream.',
    imageUrl: img('1587668178277-295251f900ce'), price: 28000, oldPrice: 32000, rating: 4.8, reviewsCount: 312,
    ingredients: ['Kakao', 'Sut shokoladi', "Sariyog'li krem", "Shokolad bo'laklari"],
    ingredientsRu: ['Какао', 'Молочный шоколад', 'Сливочный крем', 'Кусочки шоколада'],
    ingredientsEn: ['Cocoa', 'Milk chocolate', 'Butter cream', 'Chocolate chips'],
  },
  {
    cat: 'cupcakes', isPopular: true,
    name: 'Rezavorli tartaletka', nameRu: 'Тарталетка с ягодами', nameEn: 'Berry Tart',
    description: 'Qumli xamir, vanilli krem va yangi rezavorlar.',
    descriptionRu: 'Песочное тесто, ванильный крем и свежие ягоды.',
    descriptionEn: 'Shortcrust pastry, vanilla cream and fresh berries.',
    imageUrl: img('1488477181946-6428a0291777'), price: 39000, rating: 4.9, reviewsCount: 143,
    ingredients: ['Qumli xamir', 'Vanilli krem-patisser', 'Qulupnay', "Ko'k mevalar (chernika)", 'Malina'],
    ingredientsRu: ['Песочное тесто', 'Ванильный крем-патисьер', 'Клубника', 'Черника', 'Малина'],
    ingredientsEn: ['Shortcrust pastry', 'Vanilla crème pâtissière', 'Strawberries', 'Blueberries', 'Raspberries'],
  },
  {
    cat: 'pastries', badge: '-20%', isPopular: true,
    name: "Sariyog'li kruassan", nameRu: 'Сливочный круассан', nameEn: 'Butter Croissant',
    description: "Fransuz retsepti bo'yicha 27 qatlamli sariyog'li kruassan. Har tong yangi.",
    descriptionRu: 'Круассан из 27 слоёв на сливочном масле по французскому рецепту. Свежий каждое утро.',
    descriptionEn: 'A 27-layer butter croissant made the French way. Fresh every morning.',
    imageUrl: img('1555507036-ab1f4038808a'), price: 24000, oldPrice: 30000, rating: 4.7, reviewsCount: 201,
    ingredients: ["Fransuz sariyog'i (82%)", "Bug'doy uni (oliy nav)", 'Sut', 'Tuxum'],
    ingredientsRu: ['Французское сливочное масло (82%)', 'Пшеничная мука (высший сорт)', 'Молоко', 'Яйца'],
    ingredientsEn: ['French butter (82%)', 'Premium wheat flour', 'Milk', 'Eggs'],
  },
  {
    cat: 'pastries',
    name: 'Daniya bulochkasi', nameRu: 'Датская булочка', nameEn: 'Danish Pastry',
    description: "Qatlamli xamir, vanilli krem va mevali to'ldirma.",
    descriptionRu: 'Слоёное тесто, ванильный крем и фруктовая начинка.',
    descriptionEn: 'Flaky pastry with vanilla cream and fruit filling.',
    imageUrl: img('1509440159596-0249088772ff'), price: 29000, rating: 4.6, reviewsCount: 58,
    ingredients: ['Qatlamli xamir', 'Vanilli krem', "O'rik konfityuri"],
    ingredientsRu: ['Слоёное тесто', 'Ванильный крем', 'Абрикосовый конфитюр'],
    ingredientsEn: ['Puff pastry', 'Vanilla cream', 'Apricot confiture'],
  },
  {
    cat: 'cookies', badge: '-30%',
    name: 'Shokoladli pechenye (6 dona)', nameRu: 'Шоколадное печенье (6 шт)', nameEn: 'Chocolate Chip Cookies (6 pcs)',
    description: "Tashqarisi qarsildoq, ichi yumshoq — shokolad bo'laklari bilan.",
    descriptionRu: 'Хрустящее снаружи, мягкое внутри — с кусочками шоколада.',
    descriptionEn: 'Crispy outside, soft inside — loaded with chocolate chunks.',
    imageUrl: img('1499636136210-6f4ee915583e'), price: 45000, oldPrice: 64000, rating: 4.8, reviewsCount: 126,
    ingredients: ["Sariyog'", 'Jigarrang shakar', "Belgiya shokoladi bo'laklari", 'Dengiz tuzi'],
    ingredientsRu: ['Сливочное масло', 'Коричневый сахар', 'Кусочки бельгийского шоколада', 'Морская соль'],
    ingredientsEn: ['Butter', 'Brown sugar', 'Belgian chocolate chunks', 'Sea salt'],
  },
  {
    cat: 'cookies', isPopular: true,
    name: 'Fransuz makaronlari (12 dona)', nameRu: 'Французские макаруны (12 шт)', nameEn: 'French Macarons (12 pcs)',
    description: "Bodom unidan tayyorlangan 6 xil ta'mli nafis makaronlar. Sovg'a qutisida.",
    descriptionRu: 'Изысканные макаруны из миндальной муки, 6 вкусов. В подарочной коробке.',
    descriptionEn: 'Delicate almond-flour macarons in 6 flavours. In a gift box.',
    imageUrl: img('1569864358642-9d1684040f43'), price: 119000, rating: 4.9, reviewsCount: 89,
    ingredients: ['Bodom uni', 'Tuxum oqi', "Ganash va mevali to'ldirmalar", "Tabiiy bo'yoqlar"],
    ingredientsRu: ['Миндальная мука', 'Яичный белок', 'Ганаш и фруктовые начинки', 'Натуральные красители'],
    ingredientsEn: ['Almond flour', 'Egg whites', 'Ganache and fruit fillings', 'Natural colourings'],
  },
  {
    cat: 'desserts',
    name: 'Tiramisu', nameRu: 'Тирамису', nameEn: 'Tiramisu',
    description: 'Mascarpone, espresso va savoyardi — italyancha klassika.',
    descriptionRu: 'Маскарпоне, эспрессо и савоярди — итальянская классика.',
    descriptionEn: 'Mascarpone, espresso and savoiardi — an Italian classic.',
    imageUrl: img('1571877227200-a0d98ea607e9'), price: 55000, rating: 4.8, reviewsCount: 74,
    ingredients: ['Mascarpone', 'Espresso', 'Savoyardi pechenyesi', 'Kakao'],
    ingredientsRu: ['Маскарпоне', 'Эспрессо', 'Печенье савоярди', 'Какао'],
    ingredientsEn: ['Mascarpone', 'Espresso', 'Savoiardi biscuits', 'Cocoa'],
  },
  {
    cat: 'desserts',
    name: 'Nyu-York chizkeyki', nameRu: 'Чизкейк Нью-Йорк', nameEn: 'New York Cheesecake',
    description: 'Krem-pishloqli zich va mayin chizkeyk, rezavorli sous bilan.',
    descriptionRu: 'Плотный и нежный чизкейк из сливочного сыра с ягодным соусом.',
    descriptionEn: 'Rich, creamy cheesecake served with berry sauce.',
    imageUrl: img('1533134242443-d4fd215305ad'), price: 49000, rating: 4.7, reviewsCount: 66,
    ingredients: ['Krem-pishloq', 'Qumli asos', 'Rezavorli sous', 'Vanil'],
    ingredientsRu: ['Сливочный сыр', 'Песочная основа', 'Ягодный соус', 'Ваниль'],
    ingredientsEn: ['Cream cheese', 'Biscuit base', 'Berry sauce', 'Vanilla'],
  },
  {
    cat: 'drinks',
    name: 'Kapuchino', nameRu: 'Капучино', nameEn: 'Cappuccino',
    description: 'Arabika donlaridan tayyorlangan kapuchino — shirinlik uchun ideal juftlik.',
    descriptionRu: 'Капучино из зёрен арабики — идеальная пара к десерту.',
    descriptionEn: 'Arabica cappuccino — the perfect match for dessert.',
    imageUrl: img('1495474472287-4d71bcdd2085'), price: 25000, rating: 4.8, reviewsCount: 40,
    ingredients: ['Arabika espresso', "Sut ko'pigi"],
    ingredientsRu: ['Эспрессо арабика', 'Молочная пенка'],
    ingredientsEn: ['Arabica espresso', 'Milk foam'],
  },
];

const stories = [
  { title: 'Yangi', titleRu: 'Новинки', titleEn: 'New', imageUrl: img('1565958011703-44f9829ba187'),
    text: 'Yangi mavsum: qulupnayli tortlar qaytdi! 🍓', textRu: 'Новый сезон: клубничные торты вернулись! 🍓', textEn: 'New season: strawberry cakes are back! 🍓' },
  { title: 'Aksiya', titleRu: 'Акция', titleEn: 'Sale', imageUrl: img('1499636136210-6f4ee915583e'),
    text: 'Pechenyelarga −30% chegirma faqat shu hafta!', textRu: 'Скидка −30% на печенье только на этой неделе!', textEn: '−30% off cookies this week only!' },
  { title: 'Bayram', titleRu: 'Праздник', titleEn: 'Party', imageUrl: img('1464349095431-e9a21285b5f3'),
    text: "Tug'ilgan kun tortlarini 2 kun oldin buyurtma qiling 🎂", textRu: 'Заказывайте торты на день рождения за 2 дня 🎂', textEn: 'Order birthday cakes 2 days in advance 🎂' },
  { title: 'Tong', titleRu: 'Утро', titleEn: 'Morning', imageUrl: img('1555507036-ab1f4038808a'),
    text: 'Har tong 8:00 da yangi kruassanlar ☕', textRu: 'Свежие круассаны каждое утро в 8:00 ☕', textEn: 'Fresh croissants every morning at 8:00 ☕' },
  { title: "Sovg'a", titleRu: 'Подарок', titleEn: 'Gifts', imageUrl: img('1569864358642-9d1684040f43'),
    text: "Makaronlar sovg'a qutisida — yaqinlaringizni xursand qiling 💝", textRu: 'Макаруны в подарочной коробке — порадуйте близких 💝', textEn: 'Macarons in a gift box — delight your loved ones 💝' },
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

const promos = [
  { code: 'SHIRIN5', type: 'PERCENT', value: 5, maxDiscount: 30000, minOrder: 0,
    description: 'Har qanday buyurtmaga 5% chegirma', descriptionRu: 'Скидка 5% на любой заказ', descriptionEn: '5% off any order' },
  { code: 'YANGI20', type: 'FIXED', value: 20000, minOrder: 200000, firstOrderOnly: true,
    description: "Birinchi buyurtmangizga 20 000 so'm chegirma", descriptionRu: 'Скидка 20 000 сум на первый заказ', descriptionEn: '20,000 UZS off your first order' },
  { code: 'FATIMA10', type: 'PERCENT', value: 10, maxDiscount: 50000, minOrder: 150000,
    description: 'Barcha buyurtmalarga 10% chegirma', descriptionRu: 'Скидка 10% на все заказы', descriptionEn: '10% off all orders' },
];

async function main() {
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

  if ((await prisma.promoCode.count()) === 0) {
    for (const p of promos) await prisma.promoCode.create({ data: p });
    console.log(`✅ ${promos.length} promokod qo'shildi: ${promos.map((p) => p.code).join(', ')}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
