/* Kurslar katalogi v2: har bir desert — alohida kurs.
   Narxlar TAXMINIY (Admin Panelda o'zgartiriladi), rasmlar keyin qo'shiladi.
   [uz nomi, ru nomi, en nomi, kategoriya, daraja, narx (so'm), [o'ziga xos mavzular: uz, ru, en]] */

const CATS = {
  cakes: { uz: 'Tortlar', ru: 'Торты', en: 'Cakes' },
  pastry: { uz: 'Pirojniylar va rulet', ru: 'Пирожные и рулеты', en: 'Pastries & rolls' },
  cheese: { uz: 'Chizkeyk va tvorojnik', ru: 'Чизкейки и творожники', en: 'Cheesecakes' },
  pies: { uz: 'Pirog va sharqona', ru: 'Пироги и восточные', en: 'Pies & oriental' },
};

const LEVEL = {
  easy: { uz: "Boshlang'ich", ru: 'Начальный', en: 'Beginner' },
  mid: { uz: "O'rta", ru: 'Средний', en: 'Intermediate' },
  hard: { uz: 'Murakkab', ru: 'Продвинутый', en: 'Advanced' },
};

const PRICE = { easy: 190000, mid: 290000, hard: 390000 };
const LESSONS = { easy: 4, mid: 5, hard: 6 };
const DURATION = {
  easy: { uz: '1 hafta', ru: '1 неделя', en: '1 week' },
  mid: { uz: '1 hafta', ru: '1 неделя', en: '1 week' },
  hard: { uz: '2 hafta', ru: '2 недели', en: '2 weeks' },
};

// Har bir kurs oxirida — umumiy mavzular
const COMMON = {
  uz: ["Yig'ish, bezash va chiroyli taqdim etish", 'Saqlash, qadoqlash va tannarxni hisoblash'],
  ru: ['Сборка, декор и красивая подача', 'Хранение, упаковка и расчёт себестоимости'],
  en: ['Assembly, decorating and presentation', 'Storage, packaging and costing'],
};

const S = (uz, ru, en) => ({ uz, ru, en });

const COURSES = [
  ['Napoleon', 'Наполеон', 'Napoleon', 'cakes', 'mid', [
    S("Qatlamli xamir: yupqa korjlar sirlari", 'Слоёное тесто: секреты тонких коржей', 'Puff pastry: secrets of thin layers'),
    S("Korjlarni bir tekis pishirish", 'Равномерная выпечка коржей', 'Baking even layers'),
    S("Plombir kremi va qaymoqli krem", 'Пломбирный и заварной крем', 'Ice-cream cream and custard'),
  ]],
  ['Medovik', 'Медовик', 'Honey cake', 'cakes', 'mid', [
    S("Asalli xamir va korjlarni yoyish", 'Медовое тесто и раскатка коржей', 'Honey dough and rolling the layers'),
    S('Smetanali va karamelli krem', 'Сметанный и карамельный крем', 'Sour-cream and caramel cream'),
    S("Korjlarni namlash va tindirish", 'Пропитка и выстаивание коржей', 'Soaking and resting the layers'),
  ]],
  ['Spartak', 'Спартак', 'Spartak', 'cakes', 'mid', [
    S("Shokoladli asalli korjlar", 'Шоколадно-медовые коржи', 'Chocolate honey layers'),
    S('Shokoladli qaymoqli krem', 'Шоколадный заварной крем', 'Chocolate custard cream'),
    S('Shokolad glazur', 'Шоколадная глазурь', 'Chocolate glaze'),
  ]],
  ['Nejniy', 'Нежный', 'Nezhny cake', 'cakes', 'mid', [
    S("Havodor biskvit tayyorlash", 'Воздушный бисквит', 'Airy sponge cake'),
    S('Yengil qaymoqli krem', 'Лёгкий сливочный крем', 'Light whipped cream'),
    S("Biskvitni namlash va qatlamlash", 'Пропитка и сборка слоёв', 'Soaking and layering the sponge'),
  ]],
  ['Maxroviy', 'Махровый', 'Makhrovy cake', 'cakes', 'mid', [
    S("Shokoladli va oq biskvit", 'Шоколадный и белый бисквит', 'Chocolate and vanilla sponge'),
    S("«Maxroviy» ko'rinishni berish texnikasi", 'Техника «махрового» покрытия', 'The signature "terry" coating technique'),
    S('Smetanali krem', 'Сметанный крем', 'Sour-cream cream'),
  ]],
  ['Ptiche moloko klassik', 'Птичье молоко классическое', "Bird's milk classic", 'cakes', 'hard', [
    S("Agar-agarli suflye", 'Суфле на агар-агаре', 'Agar-agar soufflé'),
    S("Yupqa biskvit asos", 'Тонкая бисквитная основа', 'Thin sponge base'),
    S('Shokolad qoplama', 'Шоколадное покрытие', 'Chocolate coating'),
  ]],
  ['Ptiche moloko choco', 'Птичье молоко шоколадное', "Bird's milk chocolate", 'cakes', 'hard', [
    S("Shokoladli suflye", 'Шоколадное суфле', 'Chocolate soufflé'),
    S("Kakaoli biskvit asos", 'Шоколадная бисквитная основа', 'Cocoa sponge base'),
    S('Ganash qoplama', 'Покрытие ганашем', 'Ganache coating'),
  ]],
  ['Lastochka klassik', 'Ласточка классическая', 'Lastochka classic', 'pastry', 'mid', [
    S("Lastochka uchun biskvit va forma", 'Бисквит и формовка «Ласточки»', 'Sponge and shaping'),
    S("Kremli to'ldirma", 'Кремовая начинка', 'Cream filling'),
    S('Glazur bilan qoplash', 'Покрытие глазурью', 'Glazing'),
  ]],
  ['Lastochka choco', 'Ласточка шоколадная', 'Lastochka chocolate', 'pastry', 'mid', [
    S("Shokoladli biskvit", 'Шоколадный бисквит', 'Chocolate sponge'),
    S("Shokoladli kremli to'ldirma", 'Шоколадная кремовая начинка', 'Chocolate cream filling'),
    S('Shokolad glazur', 'Шоколадная глазурь', 'Chocolate glaze'),
  ]],
  ['Chizkeyk klassik', 'Чизкейк классический', 'Classic cheesecake', 'cheese', 'mid', [
    S("Pechenyeli asos", 'Основа из печенья', 'Biscuit base'),
    S("Kremli pishloq massasi", 'Сливочная сырная масса', 'Cream cheese filling'),
    S("Yorilmasdan pishirish (suv hammomi)", 'Выпечка без трещин (водяная баня)', 'Crack-free baking (water bath)'),
  ]],
  ['Chizkeyk fistashkoviy', 'Чизкейк фисташковый', 'Pistachio cheesecake', 'cheese', 'mid', [
    S("Pista pastasi tayyorlash", 'Приготовление фисташковой пасты', 'Making pistachio paste'),
    S("Pistali pishloq massasi", 'Фисташковая сырная масса', 'Pistachio cheese filling'),
    S("Rezavor mevalar bilan bezash", 'Декор ягодами', 'Decorating with berries'),
  ]],
  ['Chizkeyk choco', 'Чизкейк шоколадный', 'Chocolate cheesecake', 'cheese', 'mid', [
    S("Shokoladli asos", 'Шоколадная основа', 'Chocolate base'),
    S("Shokoladli pishloq massasi", 'Шоколадная сырная масса', 'Chocolate cheese filling'),
    S('Ganash bilan qoplash', 'Покрытие ганашем', 'Ganache topping'),
  ]],
  ['Tvorojnik klassik', 'Творожник классический', 'Classic curd cake', 'cheese', 'easy', [
    S("Tvorog massasini to'g'ri tayyorlash", 'Правильная творожная масса', 'Making the curd filling'),
    S("Qumli asos", 'Песочная основа', 'Shortcrust base'),
    S("Tvorojnikni pishirish rejimi", 'Режим выпечки творожника', 'Baking the curd cake'),
  ]],
  ['Tvorojnik limonniy', 'Творожник лимонный', 'Lemon curd cake', 'cheese', 'easy', [
    S("Limonli tvorog massasi", 'Лимонная творожная масса', 'Lemon curd filling'),
    S("Limon kurdi tayyorlash", 'Приготовление лимонного курда', 'Making lemon curd'),
    S("Qumli asos", 'Песочная основа', 'Shortcrust base'),
  ]],
  ['Tvorojnik malinoviy', 'Творожник малиновый', 'Raspberry curd cake', 'cheese', 'easy', [
    S("Malinali tvorog massasi", 'Малиновая творожная масса', 'Raspberry curd filling'),
    S("Malina konfiti", 'Малиновый конфитюр', 'Raspberry confit'),
    S("Qumli asos", 'Песочная основа', 'Shortcrust base'),
  ]],
  ['Tvorojnik shokoladno-vishnyoviy', 'Творожник шоколадно-вишнёвый', 'Chocolate-cherry curd cake', 'cheese', 'mid', [
    S("Shokoladli tvorog massasi", 'Шоколадная творожная масса', 'Chocolate curd filling'),
    S("Olcha to'ldirmasi", 'Вишнёвая начинка', 'Cherry filling'),
    S("Shokoladli qumli asos", 'Шоколадная песочная основа', 'Chocolate shortcrust base'),
  ]],
  ['Merengoviy rulet', 'Меренговый рулет', 'Meringue roulade', 'pastry', 'mid', [
    S("Barqaror meringa tayyorlash", 'Стабильная меренга', 'Stable meringue'),
    S("Rulet qatlamini pishirish", 'Выпечка рулетного пласта', 'Baking the roulade sheet'),
    S("Krem va mevalar bilan o'rash", 'Сворачивание с кремом и ягодами', 'Rolling with cream and berries'),
  ]],
  ['Merengoviy tort', 'Меренговый торт', 'Meringue cake', 'cakes', 'mid', [
    S("Meringa korjlari", 'Меренговые коржи', 'Meringue layers'),
    S("Qaymoqli krem", 'Сливочный крем', 'Whipped cream'),
    S("Yong'oq va mevalar bilan yig'ish", 'Сборка с орехами и ягодами', 'Assembling with nuts and berries'),
  ]],
  ['Pavlova', 'Павлова', 'Pavlova', 'pastry', 'easy', [
    S("Ichi yumshoq, usti qarsildoq meringa", 'Меренга: хрустящая снаружи, мягкая внутри', 'Crisp outside, soft inside meringue'),
    S("Maskarpone kremi", 'Крем на маскарпоне', 'Mascarpone cream'),
    S("Yangi mevalar bilan bezash", 'Декор свежими ягодами', 'Decorating with fresh fruit'),
  ]],
  ['Domashniy tort', 'Домашний торт', 'Homemade cake', 'cakes', 'easy', [
    S("Oddiy va mazali biskvit", 'Простой и вкусный бисквит', 'Simple, tasty sponge'),
    S("Uy kremi", 'Домашний крем', 'Homemade cream'),
    S("Tez bezash usullari", 'Быстрые способы декора', 'Quick decorating ideas'),
  ]],
  ['Snikers tort', 'Торт Сникерс', 'Snickers cake', 'cakes', 'hard', [
    S("Shokoladli biskvit", 'Шоколадный бисквит', 'Chocolate sponge'),
    S("Tuzli karamel va yerfistiq", 'Солёная карамель и арахис', 'Salted caramel and peanuts'),
    S("Nuga kremi va shokolad glazur", 'Крем-нуга и шоколадная глазурь', 'Nougat cream and chocolate glaze'),
  ]],
  ['Arini ini', 'Пчелиное гнездо', "Bee's nest", 'pies', 'mid', [
    S("Xamirturushli yumshoq xamir", 'Мягкое дрожжевое тесто', 'Soft yeast dough'),
    S("Asal-bodomli qoplama", 'Медово-миндальная заливка', 'Honey-almond topping'),
    S("Kremli to'ldirma", 'Кремовая начинка', 'Cream filling'),
  ]],
  ['Negr', 'Негр', 'Negr cake', 'cakes', 'easy', [
    S("Kakaoli nam biskvit", 'Влажный шоколадный бисквит', 'Moist cocoa sponge'),
    S("Smetanali krem", 'Сметанный крем', 'Sour-cream cream'),
    S("Shokolad glazur", 'Шоколадная глазурь', 'Chocolate glaze'),
  ]],
  ['Chococherry', 'Шоко-черри', 'Choco-cherry', 'cakes', 'hard', [
    S("Shokoladli biskvit", 'Шоколадный бисквит', 'Chocolate sponge'),
    S("Olcha konfiti", 'Вишнёвый конфи', 'Cherry confit'),
    S("Shokoladli mus va qoplama", 'Шоколадный мусс и покрытие', 'Chocolate mousse and coating'),
  ]],
  ['Mini pirojenniylar', 'Мини-пирожные', 'Mini pastries', 'pastry', 'mid', [
    S("Mini desertlar uchun asoslar", 'Основы для мини-десертов', 'Bases for mini desserts'),
    S("Turli kremlar va to'ldirmalar", 'Разные кремы и начинки', 'Different creams and fillings'),
    S("Bir xil o'lchamda yig'ish", 'Сборка одинакового размера', 'Assembling in equal sizes'),
  ]],
  ['Fruktoviy pirog', 'Фруктовый пирог', 'Fruit pie', 'pies', 'easy', [
    S("Pirog uchun qumli xamir", 'Песочное тесто для пирога', 'Shortcrust pastry for pie'),
    S("Mevali to'ldirma", 'Фруктовая начинка', 'Fruit filling'),
    S("Pishirish va jele bilan qoplash", 'Выпечка и покрытие желе', 'Baking and glazing with jelly'),
  ]],
  ['Limonnik', 'Лимонник', 'Lemon pie', 'pies', 'easy', [
    S("Qumli xamir", 'Песочное тесто', 'Shortcrust pastry'),
    S("Limonli to'ldirma", 'Лимонная начинка', 'Lemon filling'),
    S("Kesish va taqdim etish", 'Нарезка и подача', 'Cutting and serving'),
  ]],
  ['Kartoshechki', 'Картошка', 'Kartoshka', 'pastry', 'easy', [
    S("Biskvit qoldiqlaridan asos", 'Основа из бисквитной крошки', 'Base from sponge crumbs'),
    S("Kakaoli krem va forma berish", 'Шоколадный крем и формовка', 'Cocoa cream and shaping'),
    S("Bezash variantlari", 'Варианты декора', 'Decorating options'),
  ]],
  ['Muraveynik', 'Муравейник', 'Anthill cake', 'pastry', 'easy', [
    S("Mayda pechenye xamiri", 'Тесто для мелкого печенья', 'Crumbly cookie dough'),
    S("Quyultirilgan sutli krem", 'Крем со сгущёнкой', 'Condensed-milk cream'),
    S("Yong'oq va mak bilan yig'ish", 'Сборка с орехами и маком', 'Assembling with nuts and poppy seeds'),
  ]],
  ['Paxlava', 'Пахлава', 'Baklava', 'pies', 'hard', [
    S("Yupqa xamirni yoyish", 'Раскатка тончайшего теста', 'Rolling paper-thin dough'),
    S("Yong'oqli to'ldirma", 'Ореховая начинка', 'Nut filling'),
    S("Shirin sharbat (sirop) va pishirish", 'Медовый сироп и выпечка', 'Syrup and baking'),
  ]],
];

function buildCourses() {
  return COURSES.map(([uz, ru, en, cat, level, specific], i) => ({
    title: uz,
    titleRu: ru,
    titleEn: en,
    category: CATS[cat].uz,
    categoryRu: CATS[cat].ru,
    categoryEn: CATS[cat].en,
    level: LEVEL[level].uz,
    levelRu: LEVEL[level].ru,
    levelEn: LEVEL[level].en,
    duration: DURATION[level].uz,
    durationRu: DURATION[level].ru,
    durationEn: DURATION[level].en,
    lessonsCount: LESSONS[level],
    price: PRICE[level],
    oldPrice: null,
    imageUrl: '',
    description: `«${uz}» — retseptdan tortib bezashgacha. Har bir bosqichni video darslarda ko'rsatamiz: xamir, krem, yig'ish va saqlash sirlari.`,
    descriptionRu: `«${ru}» — от рецепта до декора. Показываем каждый этап в видеоуроках: тесто, крем, сборка и секреты хранения.`,
    descriptionEn: `"${en}" — from recipe to decoration. Every step is shown in video lessons: dough, cream, assembly and storage tips.`,
    program: [...specific.map((x) => x.uz), ...COMMON.uz],
    programRu: [...specific.map((x) => x.ru), ...COMMON.ru],
    programEn: [...specific.map((x) => x.en), ...COMMON.en],
    sortOrder: 10 + i,
    isActive: true,
  }));
}

module.exports = { buildCourses, REMOVE_TITLES: ['Bento tortlar', 'Muss desertlar va zerkalo glazur'] };
