import { saveOptimizedStorageMedia } from "./media-store.js";
import { getSupabaseAdmin } from "./supabase.js";

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
  return saveOptimizedStorageMedia("works", workId, imageBase64, {
    maxBytes: 5 * 1024 * 1024,
    maxWidth: 1200,
    maxHeight: 900,
    quality: 78,
  });
}

function hasNewWorkImage(payload) {
  return String(payload?.imageBase64 || "").startsWith("data:image/");
}

function rowToWork(row) {
  const data = row.data && typeof row.data === "object" ? row.data : {};
  const valueMain = row.value_main || data.valueMain || "halollik";
  return {
    id: row.id,
    title: row.title || data.title || "Yangi asar",
    author: row.author || data.author || "Noma'lum",
    grade: +row.grade === 4 ? 4 : 3,
    genre: row.genre || data.genre || "hikoya",
    part: +row.part || data.part || 1,
    valueMain,
    values: Array.isArray(data.values) ? data.values.map(String) : [valueMain],
    summary: row.summary || data.summary || "",
    moral: row.moral || data.moral || "",
    fullText: row.full_text || data.fullText || "",
    questions: Array.isArray(data.questions) ? data.questions : [],
    tests: Array.isArray(data.tests) ? data.tests : [],
    crossword: Array.isArray(data.crossword) ? data.crossword : [],
    illustration: data.illustration || { emoji: "📖", gradient: "linear-gradient(135deg,#e6821e,#7b3f00)" },
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    imageUrl: row.image_url || data.imageUrl || null,
    custom: data.custom !== false,
    created_at: row.created_at || data.created_at || new Date().toISOString(),
    updated_at: row.updated_at || data.updated_at || new Date().toISOString(),
  };
}

function workToRow(work, extraData = {}) {
  const data = {
    values: work.values || [work.valueMain],
    questions: work.questions || [],
    tests: work.tests || [],
    crossword: work.crossword || [],
    illustration: work.illustration || { emoji: "📖", gradient: "linear-gradient(135deg,#e6821e,#7b3f00)" },
    keywords: work.keywords || [],
    custom: work.custom !== false,
    ...extraData,
  };
  return {
    id: work.id,
    title: work.title,
    author: work.author,
    grade: work.grade,
    genre: work.genre,
    part: work.part,
    value_main: work.valueMain,
    summary: work.summary,
    moral: work.moral,
    full_text: work.fullText,
    image_url: work.imageUrl || null,
    data,
    updated_at: work.updated_at || new Date().toISOString(),
  };
}

async function fetchWorkRows() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("works")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    const err = new Error(`Supabase works jadvalidan o'qib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
  return data || [];
}

async function fetchWorkRow(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    const err = new Error(`Supabase works jadvalidan asar o'qib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
  return data || null;
}

async function upsertWorkRow(row) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("works").upsert(row, { onConflict: "id" });
  if (error) {
    const err = new Error(`Supabase works jadvaliga yozib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
}

function rowsToCatalog(rows) {
  const works = [];
  const overrides = {};
  const hiddenIds = [];
  for (const row of rows || []) {
    const data = row.data && typeof row.data === "object" ? row.data : {};
    if (data.hidden) {
      hiddenIds.push(row.id);
      continue;
    }
    const work = rowToWork(row);
    if (data.custom !== false) works.push(work);
    else overrides[row.id] = work;
  }
  return {
    works,
    overrides,
    hiddenIds,
  };
}

export async function getCatalogPublic() {
  return rowsToCatalog(await fetchWorkRows());
}

export async function listCustomWorks() {
  return (await fetchWorkRows())
    .filter((row) => {
      const data = row.data && typeof row.data === "object" ? row.data : {};
      return data.custom !== false && !data.hidden;
    })
    .map(rowToWork);
}

export async function findCustomWork(id) {
  const row = await fetchWorkRow(id);
  if (!row) return null;
  const data = row.data && typeof row.data === "object" ? row.data : {};
  if (data.custom === false || data.hidden) return null;
  return rowToWork(row);
}

export async function getWorkOverride(id) {
  const row = await fetchWorkRow(id);
  if (!row) return null;
  const data = row.data && typeof row.data === "object" ? row.data : {};
  if (data.custom !== false || data.hidden) return null;
  return rowToWork(row);
}

export async function createCustomWork(payload) {
  const id = payload.id?.trim() || slugId(payload.title);
  if (await fetchWorkRow(id)) throw new Error("WORK_EXISTS");

  let work = normalizeWork({ ...payload, id, custom: true });
  if (!work.tests.length) work.tests = generateTestsForWork(work);
  if (!work.crossword.length) work.crossword = generateCrosswordForWork(work);

  if (hasNewWorkImage(payload)) {
    work.imageUrl = await saveWorkImage(id, payload.imageBase64);
  }

  await upsertWorkRow({ ...workToRow(work), created_at: work.created_at });
  return work;
}

export async function updateWork(id, payload) {
  const row = await fetchWorkRow(id);
  const rowData = row?.data && typeof row.data === "object" ? row.data : {};

  if (row && rowData.custom !== false && !rowData.hidden) {
    const existing = rowToWork(row);
    let work = normalizeWork(payload, existing);
    if (payload.regenerateTests) work.tests = generateTestsForWork(work);
    if (payload.regenerateCrossword) work.crossword = generateCrosswordForWork(work);
    if (hasNewWorkImage(payload)) {
      work.imageUrl = await saveWorkImage(id, payload.imageBase64);
    } else if (!work.imageUrl && existing.imageUrl) {
      work.imageUrl = existing.imageUrl;
    }
    await upsertWorkRow(workToRow(work));
    return { work, kind: "custom" };
  }

  const prev = row && rowData.custom === false && !rowData.hidden ? rowToWork(row) : {};
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
    patch.imageUrl = await saveWorkImage(id, payload.imageBase64);
  } else if (prev.imageUrl) {
    patch.imageUrl = prev.imageUrl;
  } else if (patch.imageUrl === null) {
    delete patch.imageUrl;
  }

  const work = normalizeWork({ ...patch, id, custom: false }, { id });
  await upsertWorkRow(workToRow(work, { custom: false }));
  return { work: { id, ...work }, kind: "override" };
}

export async function deleteCustomWork(id) {
  const row = await fetchWorkRow(id);
  const supabase = getSupabaseAdmin();
  if (row) {
    const data = row.data && typeof row.data === "object" ? row.data : {};
    if (data.custom !== false) {
      const work = rowToWork(row);
      const { error } = await supabase.from("works").delete().eq("id", id);
      if (error) throw new Error(`Supabase works jadvalidan o'chirib bo'lmadi: ${error.message}`);
      return { removed: work, kind: "custom" };
    }
  }

  const hidden = normalizeWork({ id, title: id, custom: false }, { id });
  await upsertWorkRow(workToRow(hidden, { custom: false, hidden: true }));
  return { removed: { id }, kind: "hidden" };
}

export async function restoreTextbookWork(id) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("works").delete().eq("id", id);
  if (error) throw new Error(`Supabase works jadvalidan tiklab bo'lmadi: ${error.message}`);
  return true;
}
