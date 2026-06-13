import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { saveMedia, deleteMediaByUrl, DATA_DIR } from "./media-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(DATA_DIR, "custom-works.json");
export const WORKS_UPLOAD_DIR = path.join(__dirname, "uploads", "works");
fs.mkdirSync(WORKS_UPLOAD_DIR, { recursive: true });

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ works: [], overrides: {}, hiddenIds: [] }, null, 2));
  }
}

function readDb() {
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {
      works: raw.works || [],
      overrides: raw.overrides || {},
      hiddenIds: raw.hiddenIds || [],
    };
  } catch {
    return { works: [], overrides: {}, hiddenIds: [] };
  }
}

function writeDb(data) {
  ensureFile();
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        works: data.works || [],
        overrides: data.overrides || {},
        hiddenIds: data.hiddenIds || [],
      },
      null,
      2
    )
  );
}

function slugId(title) {
  const base =
    String(title || "asar")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "asar";
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqOptions(correct, distractors) {
  const seen = new Set();
  const out = [];
  for (const o of [correct, ...distractors]) {
    const s = String(o || "").trim();
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
  }
  while (out.length < 4) out.push(`Variant ${out.length + 1}`);
  const shuffled = shuffle(out.slice(0, 4));
  return { options: shuffled, correct: shuffled.indexOf(correct) >= 0 ? shuffled.indexOf(correct) : 0 };
}

const GENRE_LABELS = {
  hikoya: "Hikoya",
  "she'r": "She'r",
  ertak: "Ertak",
  masal: "Masal",
  matn: "Matn",
};

const VALUE_LABELS = {
  halollik: "Halollik",
  saxovat: "Saxovat",
  mehribonlik: "Mehribonlik",
  masuliyat: "Mas'uliyat",
  vatanparvarlik: "Vatanparvarlik",
  hurmat: "Hurmat",
  mehnatsevarlik: "Mehnatsevarlik",
  oila: "Oila qadriyati",
  bilim: "Bilimga intilish",
  "do'stlik": "Do'stlik",
};

export function generateTestsForWork(work) {
  const tests = [];
  const title = String(work.title || "Asar").trim();
  const author = String(work.author || "Noma'lum").trim();
  const summary = String(work.summary || "").trim();
  const moral = String(work.moral || "").trim();
  const grade = +work.grade === 4 ? 4 : 3;
  const genre = String(work.genre || "hikoya");
  const valueMain = String(work.valueMain || "halollik");
  const valueLabel = VALUE_LABELS[valueMain] || valueMain;

  const add = (q, correct, distractors) => {
    if (!q || tests.some((t) => t.q === q)) return;
    const { options, correct: c } = uniqOptions(correct, distractors);
    tests.push({ q, options, correct: c });
  };

  add(`"${title}" asarining muallifi kim?`, author, ["Noma'lum muallif", "Turli mualliflar", "Anonim"]);
  add(`"${title}" qaysi sinf darsligi uchun mos?`, `${grade}-sinf`, ["1-sinf", "2-sinf", "5-sinf"]);
  add(`"${title}" asari qaysi janrga kiradi?`, GENRE_LABELS[genre] || genre, ["Roman", "Drama", "Publicistik matn"]);
  add(`"${title}" asarining asosiy qadriyati qaysi?`, valueLabel, ["Baxt", "Boylik", "Shovqin"]);
  if (summary) {
    add(`"${title}" asari haqida qaysi gap to'g'ri?`, summary.slice(0, 90), [
      "Asar mazmuni hali kiritilmagan",
      "Bu asar faqat o'yin uchun",
      "Asar qisqacha emas, uzun roman",
    ]);
    const words = summary.split(/\s+/).filter((w) => w.length > 4);
    if (words.length >= 3) {
      add(`Asar qisqacha mazmunida qaysi so'z uchraydi?`, words[0].replace(/[.,!?]/g, ""), ["Hech qanday", "Faqat raqamlar", "Chet tilida"]);
    }
  }
  if (moral) {
    add(`"${title}" asaridan olinadigan saboq qaysi?`, moral.slice(0, 100), [
      "Hech narsa o'rganilmaydi",
      "Faqat boylik muhim",
      "Asarni o'qish shart emas",
    ]);
  }
  (work.questions || []).slice(0, 3).forEach((q) => {
    add(String(q), moral || summary.slice(0, 60) || valueLabel, ["Bilmayman", "Hech biri", "Boshqa javob"]);
  });

  const fillers = [
    [`Puzzle o'yini "${title}" rasmi bilan bog'liqmi?`, "Ha, asar rasmi yig'iladi", ["Yo'q", "Faqat musiqa bilan", "Faqat xaritada"]],
    [`Test "${title}" bo'yicha nechta savoldan iborat bo'lishi mumkin?`, "10 ta savol", ["1 ta", "100 ta", "0 ta"]],
    [`"${title}" ni o'qigach nima qilish foydali?`, "Asar saboqini tushunish", ["Unutish", "Faqat rasm chizish", "Hech narsa"]],
    [`Asar qadriyati "${valueLabel}" nima o'rgatadi?`, "Yaxshi xulq-atvor", ["Yomonlik", "Dangasalik", "Yolg'on"]],
    [`"${title}" — darslik asarimi yoki qo'shimcha?`, work.custom ? "Admin qo'shgan asar" : "Darslik asari", ["Ikkalasi ham emas", "Faqat video", "Faqat audio"]],
  ];
  fillers.forEach(([q, c, d]) => add(q, c, d));

  while (tests.length < 10) {
    const n = tests.length + 1;
    add(`"${title}" bo'yicha ${n}-savol: asarni kim yozgan?`, author, ["Boshqa muallif", "Noma'lum", "Hech kim"]);
  }

  return tests.slice(0, 10);
}

export function generateCrosswordForWork(work) {
  const entries = [];
  const title = String(work.title || "").trim();
  const valueMain = String(work.valueMain || "");
  const valueLabel = (VALUE_LABELS[valueMain] || valueMain).toUpperCase().replace(/[^A-Z\u0400-\u04FF']/g, "");

  const addWord = (word, clue) => {
    const w = String(word || "")
      .toUpperCase()
      .replace(/[^A-Z\u0400-\u04FF']/g, "");
    if (w.length < 3 || entries.some((e) => e.word === w)) return;
    entries.push({ word: w, clue: String(clue).slice(0, 120) });
  };

  addWord(title.replace(/\s+/g, ""), `"${title}" asari nomi`);
  (work.keywords || []).slice(0, 3).forEach((kw) => addWord(kw, `"${title}" kalit so'zi`));
  if (valueLabel.length >= 3) addWord(valueLabel, "Asar qadriyati");
  addWord(String(work.author || "").split(/\s+/).pop(), `"${title}" muallifi familiyasi`);
  addWord(`${work.grade || 3}SINF`, "Darslik sinfi");

  return entries.slice(0, 6);
}

function normalizeWork(payload, existing = null) {
  const valueMain = String(payload.valueMain || payload.value_main || existing?.valueMain || "halollik").trim();
  return {
    id: existing?.id || payload.id?.trim() || slugId(payload.title),
    title: String(payload.title ?? existing?.title ?? "Yangi asar").trim().slice(0, 120),
    author: String(payload.author ?? existing?.author ?? "Noma'lum").trim().slice(0, 80),
    grade: +payload.grade === 4 ? 4 : 3,
    genre: String(payload.genre ?? existing?.genre ?? "hikoya").trim().slice(0, 24),
    part: +payload.part || existing?.part || 1,
    valueMain,
    values: Array.isArray(payload.values)
      ? payload.values.map(String)
      : existing?.values || [valueMain],
    summary: String(payload.summary ?? existing?.summary ?? "").trim().slice(0, 600),
    moral: String(payload.moral ?? existing?.moral ?? "").trim().slice(0, 280),
    fullText: String(payload.fullText ?? payload.full_text ?? existing?.fullText ?? "").trim(),
    questions: Array.isArray(payload.questions)
      ? payload.questions.map(String)
      : existing?.questions || [],
    tests: Array.isArray(payload.tests) ? payload.tests : existing?.tests || [],
    crossword: Array.isArray(payload.crossword) ? payload.crossword : existing?.crossword || [],
    illustration:
      payload.illustration ||
      existing?.illustration ||
      { emoji: "📖", gradient: "linear-gradient(135deg,#e6821e,#7b3f00)" },
    keywords: Array.isArray(payload.keywords) ? payload.keywords.map(String) : existing?.keywords || [],
    imageUrl: payload.imageUrl ?? existing?.imageUrl ?? null,
    custom: existing?.custom ?? !!payload.custom,
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function saveWorkImage(workId, imageBase64) {
  return saveMedia("works", workId, imageBase64, 5 * 1024 * 1024);
}

function hasNewWorkImage(payload) {
  return String(payload?.imageBase64 || "").startsWith("data:image/");
}

export function getCatalogPublic() {
  const db = readDb();
  return {
    works: db.works,
    overrides: db.overrides,
    hiddenIds: db.hiddenIds,
  };
}

export function listCustomWorks() {
  return readDb().works || [];
}

export function findCustomWork(id) {
  return readDb().works.find((w) => w.id === id) || null;
}

export function getWorkOverride(id) {
  return readDb().overrides[id] || null;
}

export function createCustomWork(payload) {
  const db = readDb();
  const id = payload.id?.trim() || slugId(payload.title);
  if (db.works.some((w) => w.id === id)) throw new Error("WORK_EXISTS");
  if (db.hiddenIds.includes(id)) throw new Error("WORK_EXISTS");

  let work = normalizeWork({ ...payload, id, custom: true });
  if (!work.tests.length) work.tests = generateTestsForWork(work);
  if (!work.crossword.length) work.crossword = generateCrosswordForWork(work);

  if (hasNewWorkImage(payload)) {
    work.imageUrl = saveWorkImage(id, payload.imageBase64);
  }

  db.works.unshift(work);
  writeDb(db);
  return work;
}

export function updateWork(id, payload) {
  const db = readDb();
  const customIdx = db.works.findIndex((w) => w.id === id);

  if (customIdx >= 0) {
    const existing = db.works[customIdx];
    let work = normalizeWork(payload, existing);
    if (payload.regenerateTests) work.tests = generateTestsForWork(work);
    if (payload.regenerateCrossword) work.crossword = generateCrosswordForWork(work);
    if (hasNewWorkImage(payload)) {
      work.imageUrl = saveWorkImage(id, payload.imageBase64);
    } else if (!work.imageUrl && existing.imageUrl) {
      work.imageUrl = existing.imageUrl;
    }
    db.works[customIdx] = work;
    writeDb(db);
    return { work, kind: "custom" };
  }

  const prev = db.overrides[id] || {};
  const patch = { ...prev, updated_at: new Date().toISOString() };

  const setIfPresent = (key, fn = (v) => v) => {
    if (payload[key] !== undefined) patch[key] = fn(payload[key]);
  };

  setIfPresent("title", (v) => String(v).trim().slice(0, 120));
  setIfPresent("author", (v) => String(v).trim().slice(0, 80));
  setIfPresent("grade", (v) => (+v === 4 ? 4 : 3));
  setIfPresent("genre", (v) => String(v).trim().slice(0, 24));
  setIfPresent("part", (v) => +v || 1);
  setIfPresent("valueMain", (v) => String(v).trim());
  setIfPresent("values", (v) => (Array.isArray(v) ? v.map(String) : patch.values));
  setIfPresent("summary", (v) => String(v).trim().slice(0, 600));
  setIfPresent("moral", (v) => String(v).trim().slice(0, 280));
  setIfPresent("fullText", (v) => String(v).trim());
  setIfPresent("questions", (v) => (Array.isArray(v) ? v.map(String) : patch.questions));
  setIfPresent("tests", (v) => (Array.isArray(v) ? v : patch.tests));
  setIfPresent("crossword", (v) => (Array.isArray(v) ? v : patch.crossword));
  setIfPresent("keywords", (v) => (Array.isArray(v) ? v.map(String) : patch.keywords));
  setIfPresent("illustration");

  if (payload.regenerateTests) {
    patch.tests = generateTestsForWork({ id, ...prev, ...patch });
  }
  if (payload.regenerateCrossword) {
    patch.crossword = generateCrosswordForWork({ id, ...prev, ...patch });
  }
  if (hasNewWorkImage(payload)) {
    patch.imageUrl = saveWorkImage(id, payload.imageBase64);
  } else if (prev.imageUrl) {
    patch.imageUrl = prev.imageUrl;
  } else if (patch.imageUrl === null) {
    delete patch.imageUrl;
  }

  db.overrides[id] = patch;
  writeDb(db);
  return { work: { id, ...db.overrides[id] }, kind: "override" };
}

export function deleteCustomWork(id) {
  const db = readDb();
  const idx = db.works.findIndex((w) => w.id === id);
  if (idx >= 0) {
    const [removed] = db.works.splice(idx, 1);
    writeDb(db);
    removeWorkImage(removed.imageUrl);
    return { removed, kind: "custom" };
  }

  if (!db.hiddenIds.includes(id)) {
    db.hiddenIds.push(id);
    writeDb(db);
    return { removed: { id }, kind: "hidden" };
  }
  return null;
}

function removeWorkImage(imageUrl) {
  deleteMediaByUrl(imageUrl);
}

export function restoreTextbookWork(id) {
  const db = readDb();
  db.hiddenIds = db.hiddenIds.filter((x) => x !== id);
  delete db.overrides[id];
  writeDb(db);
  return true;
}
