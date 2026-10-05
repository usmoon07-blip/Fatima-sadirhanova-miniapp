/* Bazaga boshlang'ich kategoriyalar, mahsulotlar va story'larni yozadi.
   Baza bo'sh bo'lsagina ishlaydi — qayta ishga tushirilsa ma'lumotlaringiz o'chmaydi. */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const categories = [
  { key: 'cakes', name: 'Tortlar', imageUrl: img('1578985545062-69928b1d9587'), sortOrder: 1 },
  { key: 'cupcakes', name: 'Keks va kapkeyklar', imageUrl: img('1587668178277-295251f900ce'), sortOrder: 2 },
  { key: 'pastries', name: 'Pishiriqlar', imageUrl: img('1555507036-ab1f4038808a'), sortOrder: 3 },
  { key: 'cookies', name: 'Pechenyelar', imageUrl: img('1499636136210-6f4ee915583e'), sortOrder: 4 },
  { key: 'desserts', name: 'Desertlar', imageUrl: img('1571877227200-a0d98ea607e9'), sortOrder: 5 },
  { key: 'drinks', name: 'Ichimliklar', imageUrl: img('1495474472287-4d71bcdd2085'), sortOrder: 6 },
];

const products = [
  {
    cat: 'cakes', name: 'Qulupnayli Shortcake', badge: 'Bestseller', isPopular: true,
    description: "Yengil biskvit, yangi qulupnay va qaymoqli krem — klassik retsept bo'yicha qo'lda tayyorlanadi.",
    imageUrl: img('1565958011703-44f9829ba187'), price: 249000, oldPrice: 290000, rating: 4.9, reviewsCount: 218,
    ingredients: ['Vanilli biskvit', 'Yangi qulupnay', 'Tabiiy qaymoq (33%)', 'Mascarpone kremi', 'Qulupnay konfityuri'],
    sizes: [{ label: '16 sm (6–8 kishi)', price: 249000 }, { label: '20 sm (10–12 kishi)', price: 349000 }, { label: '24 sm (14–16 kishi)', price: 449000 }],
  },
  {
    cat: 'cakes', name: 'Shokoladli Truffle tort', isPopular: true,
    description: "Belgiya shokoladidan tayyorlangan nam biskvit va ganash. Shokolad ishqibozlari uchun.",
    imageUrl: img('1578985545062-69928b1d9587'), price: 289000, rating: 4.8, reviewsCount: 164,
    ingredients: ['Belgiya qora shokoladi (70%)', 'Kakao biskvit', 'Shokoladli ganash', 'Sariyog\'', 'Fundukli krokant'],
    sizes: [{ label: '16 sm (6–8 kishi)', price: 289000 }, { label: '20 sm (10–12 kishi)', price: 389000 }],
  },
  {
    cat: 'cakes', name: 'Qizil baxmal (Red Velvet)',
    description: "Mayin qizil biskvit va krem-pishloq — bayram dasturxonining yulduzi.",
    imageUrl: img('1563729784474-d77dbb933a9e'), price: 269000, rating: 4.7, reviewsCount: 97,
    ingredients: ['Red velvet biskvit', 'Krem-pishloq', 'Oq shokolad', 'Vanil'],
    sizes: [{ label: '16 sm (6–8 kishi)', price: 269000 }, { label: '20 sm (10–12 kishi)', price: 369000 }],
  },
  {
    cat: 'cupcakes', name: 'Shokoladli kapkeyk', badge: 'Bestseller', isPopular: true,
    description: "Shokoladli keks va mayin shokoladli krem shapkasi.",
    imageUrl: img('1587668178277-295251f900ce'), price: 28000, oldPrice: 32000, rating: 4.8, reviewsCount: 312,
    ingredients: ['Kakao', 'Sut shokoladi', 'Sariyog\'li krem', 'Shokolad bo\'laklari'],
  },
  {
    cat: 'cupcakes', name: 'Rezavorli tartaletka', isPopular: true,
    description: "Qumli xamir, vanilli krem va yangi rezavorlar.",
    imageUrl: img('1488477181946-6428a0291777'), price: 39000, rating: 4.9, reviewsCount: 143,
    ingredients: ['Qumli xamir', 'Vanilli krem-patisser', 'Qulupnay', 'Ko\'k mevalar (chernika)', 'Malina'],
  },
  {
    cat: 'pastries', name: 'Sariyog\'li kruassan', badge: '-20%', isPopular: true,
    description: "Fransuz retsepti bo'yicha 27 qatlamli sariyog'li kruassan. Har tong yangi.",
    imageUrl: img('1555507036-ab1f4038808a'), price: 24000, oldPrice: 30000, rating: 4.7, reviewsCount: 201,
    ingredients: ['Fransuz sariyog\'i (82%)', 'Bug\'doy uni (oliy nav)', 'Sut', 'Tuxum'],
  },
  {
    cat: 'pastries', name: 'Daniya bulochkasi',
    description: "Qatlamli xamir, vanilli krem va mevali to'ldirma.",
    imageUrl: img('1509440159596-0249088772ff'), price: 29000, rating: 4.6, reviewsCount: 58,
    ingredients: ['Qatlamli xamir', 'Vanilli krem', 'O\'rik konfityuri'],
  },
  {
    cat: 'cookies', name: 'Shokoladli pechenye (6 dona)',
    description: "Tashqarisi qarsildoq, ichi yumshoq — shokolad bo'laklari bilan.",
    imageUrl: img('1499636136210-6f4ee915583e'), price: 45000, oldPrice: 64000, badge: '-30%', rating: 4.8, reviewsCount: 126,
    ingredients: ['Sariyog\'', 'Jigarrang shakar', 'Belgiya shokoladi bo\'laklari', 'Dengiz tuzi'],
  },
  {
    cat: 'cookies', name: 'Fransuz makaronlari (12 dona)', isPopular: true,
    description: "Bodom unidan tayyorlangan 6 xil ta'mli nafis makaronlar. Sovg'a qutisida.",
    imageUrl: img('1569864358642-9d1684040f43'), price: 119000, rating: 4.9, reviewsCount: 89,
    ingredients: ['Bodom uni', 'Tuxum oqi', 'Ganash va mevali to\'ldirmalar', 'Tabiiy bo\'yoqlar'],
  },
  {
    cat: 'desserts', name: 'Tiramisu',
    description: "Mascarpone, espresso va savoyardi — italyancha klassika.",
    imageUrl: img('1571877227200-a0d98ea607e9'), price: 55000, rating: 4.8, reviewsCount: 74,
    ingredients: ['Mascarpone', 'Espresso', 'Savoyardi pechenyesi', 'Kakao'],
  },
  {
    cat: 'desserts', name: 'Nyu-York chizkeyki',
    description: "Krem-pishloqli zich va mayin chizkeyk, rezavorli sous bilan.",
    imageUrl: img('1533134242443-d4fd215305ad'), price: 49000, rating: 4.7, reviewsCount: 66,
    ingredients: ['Krem-pishloq', 'Qumli asos', 'Rezavorli sous', 'Vanil'],
  },
  {
    cat: 'drinks', name: 'Kapuchino', isUpsell: true,
    description: "Arabika donlaridan tayyorlangan kapuchino — shirinlik uchun ideal juftlik.",
    imageUrl: img('1495474472287-4d71bcdd2085'), price: 5000, oldPrice: 25000, rating: 4.8, reviewsCount: 40,
    ingredients: ['Arabika espresso', 'Sut ko\'pigi'],
  },
];

const stories = [
  { title: 'Yangi', imageUrl: img('1565958011703-44f9829ba187'), text: "Yangi mavsum: qulupnayli tortlar qaytdi! 🍓" },
  { title: 'Aksiya', imageUrl: img('1499636136210-6f4ee915583e'), text: "Pechenyelarga −30% chegirma faqat shu hafta!" },
  { title: 'Bayram', imageUrl: img('1464349095431-e9a21285b5f3'), text: "Tug'ilgan kun tortlarini 2 kun oldin buyurtma qiling 🎂" },
  { title: 'Tong', imageUrl: img('1555507036-ab1f4038808a'), text: 'Har tong 8:00 da yangi kruassanlar ☕' },
  { title: 'Sovg\'a', imageUrl: img('1569864358642-9d1684040f43'), text: "Makaronlar sovg'a qutisida — yaqinlaringizni xursand qiling 💝" },
];

async function main() {
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(`ℹ️  Bazada allaqachon ${existing} ta mahsulot bor — seed o'tkazib yuborildi.`);
    return;
  }

  const catIds = {};
  for (const { key, ...data } of categories) {
    const c = await prisma.category.create({ data });
    catIds[key] = c.id;
  }

  let sort = 0;
  for (const { cat, ...p } of products) {
    sort += 1;
    await prisma.product.create({ data: { ...p, sizes: p.sizes || [], categoryId: catIds[cat], sortOrder: sort } });
  }

  for (const [i, s] of stories.entries()) {
    await prisma.story.create({ data: { ...s, sortOrder: i + 1 } });
  }

  console.log(`✅ Seed tayyor: ${categories.length} kategoriya, ${products.length} mahsulot, ${stories.length} story.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
