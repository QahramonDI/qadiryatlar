/* =====================================================================
   platform-data.js
   "Qadriyatlar Kaledaskopi" — platforma ma'lumotlari:
   qadriyatlar, darajalar, yutuqlar (badge), reyting,
   viloyatlar (bilim xaritasi), o'yinlar konfiguratsiyasi,
   chatbot bilim bazasi, ota-onalar paneli ma'lumotlari.
   ===================================================================== */

/* ----------------------- 9 ta MILLIY QADRIYAT ----------------------- */
const BASE_VALUES = [
  { id: "halollik",         name: "Halollik",          icon: "fa-handshake",      color: "#e6821e", desc: "To'g'rilik, poklik va so'zida turish — insonni ulug'laydigan eng oliy fazilat." },
  { id: "mehnatsevarlik",   name: "Mehnatsevarlik",    icon: "fa-hammer",         color: "#c26b1a", desc: "Mehnatdan qochmaslik, ishni sevib bajarish va sabr bilan natijaga erishish." },
  { id: "vatanparvarlik",   name: "Vatanparvarlik",    icon: "fa-flag",           color: "#0b6b3a", desc: "Vatanni sevish, uni asrash va bilim hamda mehnat bilan obod qilish." },
  { id: "mehribonlik",      name: "Mehribonlik",       icon: "fa-heart",          color: "#d94f7a", desc: "Boshqalarga mehr ko'rsatish, g'amxo'rlik qilish va yordam berish." },
  { id: "saxovat",          name: "Saxovat",           icon: "fa-gift",           color: "#9e5bd6", desc: "Bor narsani beminnat baham ko'rish, ochiqko'ngillik va himmat." },
  { id: "ota-onaga-hurmat", name: "Ota-onaga hurmat",  icon: "fa-people-roof",    color: "#1a8fa3", desc: "Ota-onani e'zozlash, ularning nasihatiga quloq solish va xizmatini qilish." },
  { id: "dustlik",          name: "Do'stlik",          icon: "fa-user-group",     color: "#3a8fd6", desc: "Sadoqatli o'rtoqlik, hamkorlik va birlikda kuch topish." },
  { id: "masuliyat",        name: "Mas'uliyat",        icon: "fa-shield-halved",  color: "#4a9e5c", desc: "O'z ishi va so'ziga javobgar bo'lish, vazifani oxiriga yetkazish." },
  { id: "adolat",           name: "Adolat",            icon: "fa-scale-balanced", color: "#b8860b", desc: "Haqqoniylik, insof va hamma bilan teng, to'g'ri muomalada bo'lish." },
];
const VALUES = BASE_VALUES.map((v) => ({ ...v }));

function getValueById(id) {
  return VALUES.find((v) => v.id === id) || BASE_VALUES.find((v) => v.id === id) || { id, name: id, color: "#e6821e", icon: "fa-star", desc: "" };
}

/* --------------------------- DARAJALAR ------------------------------ */
/* 1000 XP = 1 daraja. Daraja nomlari Explorer -> Donishmand */
const LEVELS = [
  { min: 0,    name: "Yangi sayohatchi", emoji: "🌱", badge: "Explorer" },
  { min: 1000, name: "Izlanuvchi",       emoji: "🔎", badge: "Tadqiqotchi" },
  { min: 2000, name: "Bilimdon",         emoji: "📘", badge: "Bilimdon" },
  { min: 3000, name: "Zukko",            emoji: "💡", badge: "Zukko" },
  { min: 4000, name: "Dono shogird",     emoji: "🦉", badge: "Dono" },
  { min: 5000, name: "Donishmand",       emoji: "👑", badge: "Donishmand" },
];

function getLevel(xp) {
  let lvl = LEVELS[0];
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) { lvl = l; index = i; }
  });
  const next = LEVELS[index + 1] || null;
  const curBase = lvl.min;
  const nextBase = next ? next.min : lvl.min + 1000;
  const progress = Math.min(100, Math.round(((xp - curBase) / (nextBase - curBase)) * 100));
  return { level: index + 1, info: lvl, next, progress, curBase, nextBase, xp };
}

/* --------------------------- YUTUQLAR (BADGE) ----------------------- */
const BADGES = [
  { id: "first-read",  name: "Ilk sahifa",        icon: "fa-book-open",       desc: "Birinchi asarni o'qib chiqdingiz",          xp: 50 },
  { id: "reader-5",    name: "Kitobsevar",        icon: "fa-book",            desc: "5 ta asarni o'rgandingiz",                  xp: 150 },
  { id: "reader-all",  name: "Kutubxona sultoni", icon: "fa-crown",           desc: "Barcha asarlarni o'qib chiqdingiz",          xp: 500 },
  { id: "test-ace",    name: "Test ustasi",       icon: "fa-clipboard-check", desc: "Bir testni 100% bilan yakunladingiz",        xp: 100 },
  { id: "game-master", name: "O'yin ustasi",      icon: "fa-gamepad",         desc: "Barcha o'yin turlarini o'ynadingiz",         xp: 150 },
  { id: "crossword",   name: "So'z sehrgari",     icon: "fa-table-cells",     desc: "Krossvordni to'liq yechdingiz",              xp: 120 },
  { id: "puzzle",      name: "Yig'uvchi",         icon: "fa-puzzle-piece",    desc: "Puzzle'ni yig'ib bo'ldingiz",                xp: 120 },
  { id: "all-values",  name: "Qadriyat bilimdoni",icon: "fa-tree",            desc: "Qadriyatlar daraxtidagi barcha mevani ochdingiz", xp: 250 },
];

function getBadgeById(id) {
  return BADGES.find((b) => b.id === id) || null;
}

/* --------------------- REYTING (server API orqali) ----------------- */
const LEADERBOARD_SEED = [];

/* ------------------ BILIM XARITASI (viloyatlar) --------------------- */
const REGIONS = [
  {
    id: "qoraqalpogiston", name: "Qoraqalpog'iston", emoji: "🐟", mapX: 18.9, mapY: 36.6, value: "dustlik",
    workId: "dustlik-kemasi", tradition: "Baliq ovi, kashtachilik va do'stlik dasturxonlari",
    tale: "Do'stlik yo'lagi hikoyasida qo'shnilar bir-biriga yo'l ochib, saxovat ko'rsatadi.",
    story: "Qoraqalpog'iston — Aral dengizi bo'yi, kashtachilik va do'stlik yurti. Bu yerda odamlar qo'shnilar bilan birga ishlaydi, kemada ham, hayotda ham qo'l beradi.",
    fact: "Nukus — Xo'jayli Nurullayev nomidagi Davlat san'at muzeyi bilan mashhur.",
  },
  {
    id: "xorazm", name: "Xorazm", emoji: "🏰", mapX: 30.7, mapY: 56.1, aliases: ["xiva"], value: "masuliyat",
    workId: "kitob-dosti", tradition: "Ichan qal'a, xiva palovi va hunarmandchilik",
    tale: "Xiva devorlari asrlar davomida shaharni asrab kelgan — mas'uliyat va mehnat ramzi.",
    story: "Xorazm — Xiva qal'asi, ilm va mas'uliyat diyori. Bu yerda har bir inson o'z vazifasini oxirigacha bajarishni o'rganadi.",
    fact: "Ichan qal'a butun shahar ko'rinishida YuNESKO Jahon merosi ro'yxatida.",
  },
  {
    id: "navoiy", name: "Navoiy", emoji: "⛰️", mapX: 48.8, mapY: 50.1, value: "mehnatsevarlik",
    workId: "zardoz", tradition: "G'ilam va zardo'zlik, cho'l karvonlari",
    tale: "Orolim she'rida tabiat va Orol muammosi haqida xavotir bildiriladi.",
    story: "Navoiy — cho'l va tog'lar o'rtasidagi mehnatsevar insonlar yurti. Bu yerda zardo'zlik va kasb-hunar avlodlar davomida o'tadi.",
    fact: "Navoiy shahrida Alisher Navoiy nomidagi katta bog' barpo etilgan.",
  },
  {
    id: "buxoro", name: "Buxoro", emoji: "🕌", mapX: 45.3, mapY: 66.8, value: "halollik",
    workId: "halol-savdogar", tradition: "Ilm maskanlari, savdo va mehmondo'stlik",
    tale: "Abu Rayhon Beruniy yoshlikda ilm va osmon sirlarini o'rganadi.",
    story: "Buxoroi sharif — ilm va halollik shahri. Imom Buxoriy yurtida to'g'ri so'z va pok yurak qadrlanadi.",
    fact: "Buxoroda 140 dan ortiq madaniy meros obidalari saqlangan.",
  },
  {
    id: "qashqadaryo", name: "Qashqadaryo", emoji: "🐎", mapX: 58.3, mapY: 79.1, value: "dustlik",
    workId: "boburning-bolaligi", tradition: "Shahrisabz mehmonxonalari va ot sporti",
    tale: "Sohibqiron bobom she'rida Amir Temur va bobolar merosi madh etiladi.",
    story: "Qashqadaryo — keng dashtlar va do'stparvar insonlar diyori. Shahrisabz — buyuk allomalar tug'ilgan maskan.",
    fact: "Shahrisabz — Amir Temur va Bobur tarixiy merosi bilan mashhur.",
  },
  {
    id: "surxondaryo", name: "Surxondaryo", emoji: "🌿", mapX: 65.7, mapY: 86.7, value: "adolat",
    workId: "adolatli-qozi", tradition: "Termiz qadimiy shahri va bahor bayramlari",
    tale: "Merosga kim munosib? rivoyatida haqiqiy halollik sinovdan o'tadi.",
    story: "Surxondaryo — janubiy darvoza, adolat va ilm yurti. Bu yerda haqqoniylik va insof yuksak qadriyat.",
    fact: "Termiz — qadimiy Bactria madaniyati markazlaridan biri.",
  },
  {
    id: "samarqand", name: "Samarqand", emoji: "🕌", mapX: 60, mapY: 70, value: "saxovat",
    workId: "saxiy-dehqon", tradition: "Registon, non va anor bayramlari",
    tale: "Tabiat zanjiri rivoyatida daryo va odamlar o'rtasidagi munosabat tasvirlanadi.",
    story: "Samarqand — Registon va buyuk sivilizatsiya markazi. Ajdodlarimiz saxovat va mehnat bilan shu shaharni obod qilgan.",
    fact: "Registon maydoni 600 yildan ortiq tarixga ega.",
  },
  {
    id: "jizzax", name: "Jizzax", emoji: "🌄", mapX: 66.9, mapY: 65.1, value: "ota-onaga-hurmat",
    workId: "ota-nasihati", tradition: "Tog' o'roqlari, uzumzorlar va oilaviy dasturxon",
    tale: "Bog'bon va nihol rivoyatida to'g'ri tarbiya vaqtida berilishi kerakligi o'rgatiladi.",
    story: "Jizzax — tog' va vodiy o'rtasidagi mehrli oilalar yurti. Bu yerda ota-onaga hurmat kundalik hayotning bir qismi.",
    fact: "Jizzax viloyati Zaamin milliy bog'i bilan mashhur.",
  },
  {
    id: "sirdaryo", name: "Sirdaryo", emoji: "🌊", mapX: 72.2, mapY: 63.9, value: "masuliyat",
    workId: "temir-qoziq", tradition: "Daryo bo'yi dehqonchilik va cho'ponchilik",
    tale: "Vatan madhi dillarda matnida Vatanni sevish va ardoqlash haqida gapiriladi.",
    story: "Sirdaryo — daryo bo'ylab yashovchi mehnatkash odamlar diyori. Bu yerda vazifani vaqtida bajarish qadrlanadi.",
    fact: "Guliston — viloyat markazi, paxta va bog'dorchilik markazi.",
  },
  {
    id: "toshkent", name: "Toshkent", emoji: "🏙️", mapX: 78.2, mapY: 56.9, value: "mehnatsevarlik",
    workId: "mehnat-bahosi", tradition: "Poytaxt madaniyati, hunarmandchilik va ilm-fan",
    tale: "Mehnat qurollari nima deydi? she'rida har bir asbob o'z mehnatidan gapiradi.",
    story: "Toshkent — mehnat, ilm va zamonaviy hayot uyg'unlashgan poytaxt. Bu yerda har bir kasb o'z qadriyatiga ega.",
    fact: "Toshkent metrosi Markaziy Osiyodagi birinchi metro tizimi.",
  },
  {
    id: "namangan", name: "Namangan", emoji: "🌷", mapX: 86.3, mapY: 58.8, value: "mehribonlik",
    workId: "mehribon-qiz", tradition: "Gul yetishtirish va mehribon qo'llar",
    tale: "Keksalarni hurmat qil she'rida katta yoshlarga mehr o'rgatiladi.",
    story: "Namangan — gullar va mehribon insonlar shahri. Bu yerda qo'l yordami va g'amxo'rlik yuqori qadriyat.",
    fact: "Namangan an'anaviy gul bayrami bilan mashhur.",
  },
  {
    id: "andijon", name: "Andijon", emoji: "📜", mapX: 90.5, mapY: 61.5, value: "vatanparvarlik",
    workId: "vatan-yoshlari", tradition: "Bobur merosi va vodiysi mevalari",
    tale: "Yurt madhi she'rida viloyatlar va Ulug' O'zbekiston maqtovga olinadi.",
    story: "Andijon — Bobur Mirzo vatani. Bu yer farzandlari vatanparvarlik va ilm bilan dunyoga tanilgan.",
    fact: "Zahiriddin Muhammad Bobur Andijonda tug'ilgan.",
  },
  {
    id: "fargona", name: "Farg'ona", emoji: "🌸", mapX: 86.4, mapY: 64.3, value: "saxovat",
    workId: "marvarid", tradition: "Atlas to'qimachilik, anor va do'stlik dasturxoni",
    tale: "Yagonadir Vataning sening! matnida Vatan yagona va muqaddas ekanligi tasvirlanadi.",
    story: "Farg'ona vodiysi — atlas, gullar va mehmondo'stlik diyori. Bu yer odamlari hosil va mehrni baham ko'radi.",
    fact: "Farg'ona vodiysi O'zbekistonning eng serhosil mintaqasi.",
  },
];

function getRegionById(id) {
  if (!id) return null;
  const norm = id === "xiva" ? "xorazm" : id;
  return REGIONS.find((r) => r.id === norm || (r.aliases || []).includes(id)) || null;
}

function normalizeRegionId(id) {
  return id === "xiva" ? "xorazm" : id;
}

/* --------------------------- O'YINLAR HUB --------------------------- */
const GAMES = [
  { id: "crossword", name: "Krossvord",      icon: "fa-table-cells",   color: "#e6821e", desc: "Asar mazmunidan avtomatik tuzilgan krossvordni yeching." },
  { id: "puzzle",    name: "Rasmli puzzle",  icon: "fa-puzzle-piece",  color: "#4a9e5c", desc: "Asar rasmini tanlab, bo'laklardan yig'ing." },
  { id: "guess",     name: "Asar topish",    icon: "fa-book-open-reader", color: "#9e5bd6", desc: "Saboq yoki qisqa mazmundan qaysi asar ekanini toping." },
  { id: "author",    name: "Muallifni top",  icon: "fa-pen-nib",       color: "#2f86d6", desc: "Asarni ko'rib, uning muallifini tanlang." },
  { id: "truefalse", name: "To'g'ri / Noto'g'ri", icon: "fa-scale-balanced", color: "#0ca678", desc: "Asarlar haqidagi gap to'g'rimi? Tezda javob bering." },
  { id: "match",     name: "Qadriyat juftlash", icon: "fa-link",       color: "#d94f7a", desc: "Asarni to'g'ri qadriyat bilan birlashtiring." },
];

/* --------------- "BILIMDON BOBO" CHATBOT BILIM BAZASI --------------- */
const BOT_NAME = "Bilimdon Bobo";
const BOT_INTENTS = [
  { keys: ["salom", "assalom", "hayrli", "hello"], reply: "Vaalaykum assalom, aziz shogird! Men Bilimdon Bobo — bilim sayohatingda hamrohingman. 20 ta asar, 9 ta qadriyat, viloyatlar va testlar haqida so'rashing mumkin!" },
  { keys: ["rahmat", "tashakkur"], reply: "Sog' bo'l, aziz shogird! Bilim — eng katta boylik. Yana savoling bo'lsa, men shu yerdaman. Ilm yo'lida omad!" },
];

const BOT_TIPS = [
  "Har kuni kamida bitta asar o'qisang, XP va yulduz yig'asiz! 📚",
  "Krossvordni yechishdan oldin asar mazmunini eslab ol — so'zlar oson topiladi! 🧩",
  "Testda shoshmaslik kerak. Savolni ikki marta o'qib, keyin javob ber. ✅",
  "Qadriyatlar daraxtidagi har bir anorni ochsang, yangi saboq va XP olasan! 🍎",
  "Do'sting bilan birga o'qisang, bilim ikki barobar mustahkam bo'ladi! 🤝",
];

/* ---------------------- O'QITUVCHILAR: STEAM ------------------------ */
const STEAM_PROJECTS = [
  { title: "Anor bog'i loyihasi", value: "saxovat", desc: "O'quvchilar sinfda kichik anor ko'chati parvarish qiladi va hosilni baham ko'rish orqali saxovatni amalda o'rganadi.", subjects: ["Biologiya", "Mehnat", "Etika"] },
  { title: "Halollik tarozisi", value: "adolat", desc: "Oddiy tarozi yasab, og'irlik va muvozanat orqali adolat tushunchasini fizika bilan bog'lab tushuntirish.", subjects: ["Fizika", "Texnologiya", "Axloq"] },
  { title: "Vatan xaritasi", value: "vatanparvarlik", desc: "Karton va atlas matosidan O'zbekiston xaritasini yasash, viloyatlar va ularning qadriyatlarini belgilash.", subjects: ["Geografiya", "San'at", "Tarix"] },
  { title: "Do'stlik ko'prigi", value: "dustlik", desc: "Cho'p va ip yordamida ko'prik konstruksiyasi qurish — birlik qanday mustahkamlik berishini muhandislik orqali ko'rsatish.", subjects: ["Muhandislik", "Matematika", "Jamoaviy ish"] },
];

const TEACHER_METHODS = [
  { title: "Qadriyat tahlili jadvali", icon: "fa-table", desc: "20 ta asarning qadriyat bo'yicha tasnifi va dars rejasi." },
  { title: "Interaktiv dars ssenariysi", icon: "fa-chalkboard-user", desc: "Har bir asar uchun 45 daqiqalik o'yinli dars namunasi." },
  { title: "Baholash mezonlari", icon: "fa-list-check", desc: "O'quvchi qadriyat o'zlashtirishini baholash rubrikasi." },
  { title: "Uyga vazifa to'plami", icon: "fa-house-laptop", desc: "Oilada bajariladigan qadriyatga oid topshiriqlar." },
];

if (typeof window !== "undefined") {
  Object.assign(window, {
    BASE_VALUES, VALUES, getValueById, LEVELS, getLevel, BADGES, getBadgeById,
    LEADERBOARD_SEED, REGIONS, getRegionById, normalizeRegionId, GAMES,
    BOT_NAME, BOT_INTENTS, BOT_TIPS,
    STEAM_PROJECTS, TEACHER_METHODS,
  });
}
