/* =====================================================================
   bot-brain.js
   "Bilimdon Bobo" — kengaytirilgan bilim bazasi va aqlli javob tizimi.
   textbook-data.js va platform-data.js ma'lumotlaridan foydalanadi.
   ===================================================================== */

const VALUE_SYNONYMS = {
  halollik: ["halol", "rost", "to'g'ri", "yolg'on", "chin"],
  mehnatsevarlik: ["mehnat", "ish", "hunar", "mehnatsevar"],
  vatanparvarlik: ["vatan", "yurt", "ozbekiston", "o'zbekiston", "vatandosh"],
  mehribonlik: ["mehr", "mehribon", "ezgulik", "rahmdil"],
  saxovat: ["saxiy", "ochiqko'ngil", "himmat", "baham"],
  "ota-onaga-hurmat": ["ota", "ona", "ota-ona", "hurmat", "nasihat"],
  dustlik: ["dost", "do'st", "do'stlik", "hamkorlik", "birlik"],
  masuliyat: ["mas'uliyat", "javobgar", "vazifa"],
  adolat: ["adolatli", "haqqoniy", "insof", "tarozi"],
};

const PLATFORM_FAQS = [
  {
    keys: ["test", "imtihon", "sinov", "test maslahati", "test qanday"],
    reply:
      "<b>Test maslahati:</b> Avval asarni diqqat bilan o'qib chiq. Savolni oxirigacha o'qi, shoshmasdan javob ber. " +
      "Har bir to'g'ri javob XP va yulduz beradi. 60% dan yuqori natija — sertifikat! ✅",
  },
  {
    keys: ["xp", "daraja", "ball", "yulduz", "level"],
    reply:
      "<b>XP va darajalar:</b> O'qilgan asar, test va o'yinlar XP beradi. 1000 XP = yangi daraja! " +
      "Yangi sayohatchi → Izlanuvchi → Bilimdon → Zukko → Dono shogird → Donishmand 👑",
  },
  {
    keys: ["badge", "yutuq", "nishon", "medal"],
    reply:
      "<b>Yutuqlar (badge):</b> Ilk sahifa, Kitobsevar, Kutubxona sultoni, Test ustasi, O'yin ustasi, " +
      "So'z sehrgari, Yig'uvchi, Qadriyat bilimdoni — har biri alohida XP beradi!",
  },
  {
    keys: ["kutubxona", "asarlar", "kitob", "o'qish"],
    reply:
      "<b>Kutubxona:</b> 20 ta badiiy asar (3–4-sinf darsliklari asosida). Har birida to'liq matn, test, krossvord va puzzle bor. " +
      "'Barcha asarlar' deb yozsang, ro'yxatni beraman!",
  },
  {
    keys: ["daraxt", "qadriyatlar daraxti", "anor"],
    reply:
      "<b>Qadriyatlar daraxti:</b> 9 ta milliy qadriyat — anor mevalari sifatida. Har birini ochsang saboq va XP olasan. " +
      "Masalan, 'halollik nima?' deb so'rab ko'r!",
  },
  {
    keys: ["sertifikat", "guvohnoma"],
    reply:
      "<b>Sertifikat:</b> Asar bo'yicha testni kamida 60% natija bilan topshirsang, Bilimdon Bobo muhri bilan sertifikat olasan!",
  },
  {
    keys: ["reyting", "lider", "peshqadamlar", "leaderboard"],
    reply:
      "<b>Reyting:</b> Platformadagi eng faol o'quvchilar XP bo'yicha saralangan. Ko'proq o'qi, o'yna va test topshir — yuqoriga chiq!",
  },
];

function normalizeQuery(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[''`ʻʼ]/g, "")
    .replace(/o['']|oʻ|ö/g, "o")
    .replace(/g['']|gʻ|ğ/g, "g")
    .replace(/sh/g, "sh")
    .replace(/ch/g, "ch")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeQuery(text)
    .split(" ")
    .filter((t) => t.length > 1);
}

function scoreEntry(query, entry) {
  const q = normalizeQuery(query);
  const tokens = tokenize(q);
  let score = 0;

  for (const key of entry.keys) {
    const nk = normalizeQuery(key);
    if (!nk) continue;

    if (q.includes(nk)) {
      score += nk.length * 2 + (nk.includes(" ") ? 6 : 0);
      continue;
    }

    const keyTokens = tokenize(nk);
    for (const kt of keyTokens) {
      if (kt.length < 3) continue;
      for (const t of tokens) {
        if (t === kt) score += kt.length + 2;
        else if (t.includes(kt) || kt.includes(t)) score += Math.min(t.length, kt.length);
      }
    }
  }
  return score;
}

function listWorksByGrade(grade) {
  const works = TEXTBOOK_WORKS.filter((w) => w.grade === grade);
  if (!works.length) return `${grade}-sinf asarlari topilmadi.`;
  const list = works.map((w) => `• <b>${w.title}</b> (${w.author})`).join("<br>");
  return `<b>${grade}-sinf asarlari</b> (${works.length} ta):<br>${list}<br><br>Kutubxonadan istalganini tanlab o'qishing mumkin!`;
}

function listAllWorks() {
  const g3 = TEXTBOOK_WORKS.filter((w) => w.grade === 3);
  const g4 = TEXTBOOK_WORKS.filter((w) => w.grade === 4);
  const fmt = (arr) => arr.map((w) => `• ${w.title}`).join("<br>");
  return (
    `<b>Barcha ${TEXTBOOK_WORKS.length} ta asar:</b><br><br>` +
    `<b>3-sinf (${g3.length} ta):</b><br>${fmt(g3)}<br><br>` +
    `<b>4-sinf (${g4.length} ta):</b><br>${fmt(g4)}`
  );
}

function workReply(w) {
  const valueNames = w.values.map((id) => getValueById(id).name).join(", ");
  const mainValue = getValueById(w.valueMain).name;
  return (
    `<b>${w.title}</b> — ${w.author} (${w.grade}-sinf, ${w.genre})<br>` +
    `${w.summary}<br>` +
    `<i>Saboq:</i> ${w.moral}<br>` +
    `Qadriyatlar: ${valueNames} (asosiy: <b>${mainValue}</b>)<br>` +
    `Kutubxonadan to'liq o'qib, test va o'yinlarni ham sinab ko'r!`
  );
}

function valueReply(v) {
  const related = TEXTBOOK_WORKS.filter((w) => w.values.includes(v.id) || w.valueMain === v.id);
  const titles = related.map((w) => w.title).join(", ");
  return (
    `<b>${v.name}</b> — ${v.desc}<br><br>` +
    `Platformadagi asarlar: ${titles || "—"}<br>` +
    `Qadriyatlar daraxtidan bu anorni ham ochib ko'r!`
  );
}

function buildBotKnowledge() {
  const entries = [];

  for (const w of TEXTBOOK_WORKS) {
    const authorParts = w.author.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
    entries.push({
      type: "work",
      keys: [w.title, w.id, w.author, ...authorParts, ...(w.keywords || [])],
      reply: workReply(w),
    });
  }

  for (const v of VALUES) {
    entries.push({
      type: "value",
      keys: [v.name, v.id, ...(VALUE_SYNONYMS[v.id] || [])],
      reply: valueReply(v),
    });
  }

  for (const r of REGIONS) {
    const valName = getValueById(r.value).name;
    entries.push({
      type: "region",
      keys: [r.name, r.id, r.name.replace(/'/g, "")],
      reply:
        `${r.emoji} <b>${r.name}</b> — ${r.story}<br>` +
        `<i>Qiziq fakt:</i> ${r.fact}<br>` +
        `Bog'liq qadriyat: <b>${valName}</b>. Bilim xaritasidan ham ko'r!`,
    });
  }

  for (const g of GAMES) {
    entries.push({
      type: "game",
      keys: [g.name, g.id, g.name.toLowerCase()],
      reply: `<b>${g.name}</b> — ${g.desc} O'yinlar bo'limidan boshla!`,
    });
  }

  entries.push(
    { type: "game", keys: ["o'yin", "oyin", "krossvord", "puzzle", "asar topish", "muallif", "to'g'ri", "noto'g'ri", "juftlash"], reply: "<b>O'yinlar:</b> Krossvord, Rasmli puzzle, Asar topish, Muallifni top, To'g'ri/Noto'g'ri va Qadriyat juftlash. O'ynab o'rgan — XP ham beradi!" },
    { type: "author", keys: ["bobur", "boburning", "zahiriddin"], reply: workReply(getWorkById("boburning-bolaligi")) + "<br><br>💡 Bobur Andijonda tug'ilgan — 'Andijon' deb yozib ko'r!" },
    { type: "author", keys: ["zafar diyor", "diyor"], reply: workReply(getWorkById("vatan-yoshlari")) },
    { type: "author", keys: ["anvar obidjon", "obidjon"], reply: workReply(getWorkById("ona-qarzi")) },
    { type: "author", keys: ["mirkarim osim", "osim"], reply: workReply(getWorkById("zardoz")) },
    { type: "author", keys: ["xudoyberdi", "to'xtaboyev"], reply: workReply(getWorkById("karim-polvon")) }
  );

  for (const faq of PLATFORM_FAQS) {
    entries.push({ type: "faq", keys: faq.keys, reply: faq.reply });
  }

  return entries;
}

let BOT_KNOWLEDGE = [];

function matchIntents(text) {
  const t = normalizeQuery(text);
  for (const intent of BOT_INTENTS) {
    if (intent.keys.some((k) => t.includes(normalizeQuery(k)))) return intent.reply;
  }
  return null;
}

function extractTopic(text) {
  const patterns = [
    /(.+?)\s+haqida\b/i,
    /(.+?)\s+nima\b/i,
    /(.+?)\s+kim\b/i,
    /(.+?)\s+qanday\b/i,
    /(.+?)\s+necha\b/i,
    /(.+?)\s+nega\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const topic = m[1].replace(/^(bu|shu|qaysi|kimning)\s+/i, "").trim();
      if (topic.length > 1) return topic;
    }
  }
  return null;
}

function findBestEntries(query, minScore) {
  const scored = BOT_KNOWLEDGE.map((e) => ({ entry: e, score: scoreEntry(query, e) }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score);
  return scored;
}

function botReply(text) {
  const raw = (text || "").trim();
  if (!raw) return "Savolingizni yozing — men yordam beraman!";

  const intentReply = matchIntents(raw);
  if (intentReply) return intentReply;

  const t = normalizeQuery(raw);

  if (/bugungi\s+maslahat|maslahat\s+ber|kunlik\s+maslahat/.test(t)) {
    return "<b>Bugungi maslahat:</b> " + BOT_TIPS[Math.floor(Math.random() * BOT_TIPS.length)];
  }

  if (/barcha\s+asar|asarlar\s+royxati|20\s+ta\s+asar/.test(t)) {
    return listAllWorks();
  }

  if (/3[\s-]*sinf|uchinchi\s+sinf/.test(t)) return listWorksByGrade(3);
  if (/4[\s-]*sinf|to'rtinchi\s+sinf|tortinchi\s+sinf/.test(t)) return listWorksByGrade(4);

  const topic = extractTopic(raw);
  const searchText = topic || raw;
  const results = findBestEntries(searchText, 3);

  if (results.length) {
    const best = results[0];
    if (best.score >= 8 || results.length === 1 || best.score - (results[1]?.score || 0) >= 3) {
      return best.entry.reply;
    }
    if (best.entry.type === "value" && results.filter((r) => r.entry.type === "work").length > 1) {
      const works = results.filter((r) => r.entry.type === "work").slice(0, 5);
      return (
        `<b>${normalizeQuery(searchText)}</b> bo'yicha topilgan asarlar:<br>` +
        works.map((w) => `• ${w.entry.keys[0]}`).join("<br>") +
        "<br><br>Birini tanlab, 'X haqida' deb so'rang!"
      );
    }
    return best.entry.reply;
  }

  const fallbackResults = findBestEntries(raw, 2);
  if (fallbackResults.length && fallbackResults[0].score >= 4) {
    return fallbackResults[0].entry.reply;
  }

  return (
    `Qiziqarli savol! Men <b>${TEXTBOOK_WORKS.length} ta asar</b>, <b>${VALUES.length} ta qadriyat</b>, ${REGIONS.length} ta hudud, testlar va o'yinlar bo'yicha yordam bera olaman. ` +
    "Masalan: <i>Vatan haqida</i>, <i>halollik nima?</i>, <i>3-sinf asarlari</i>, <i>Samarqand</i> yoki <i>test maslahati</i> deb yozib ko'r.<br><br>" +
    "<b>Maslahat:</b> " + BOT_TIPS[Math.floor(Math.random() * BOT_TIPS.length)]
  );
}

BOT_KNOWLEDGE = buildBotKnowledge();

if (typeof window !== "undefined") {
  Object.assign(window, { botReply, buildBotKnowledge, BOT_KNOWLEDGE, normalizeQuery, scoreEntry });
}
