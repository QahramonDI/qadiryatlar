import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "quiz-games.json");

const DEFAULTS = {
  guess: { pickCount: 8, items: [] },
  author: { pickCount: 8, items: [] },
  truefalse: { pickCount: 10, items: [] },
};

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULTS, null, 2));
  }
}

function clampPick(n, min = 3, max = 12) {
  return Math.min(max, Math.max(min, +n || min));
}

function sanitizeGuessItem(item) {
  const workId = String(item?.workId || "").trim();
  const clue = String(item?.clue || "").trim().slice(0, 240);
  if (!workId || !clue) return null;
  return {
    workId,
    clue,
    clueType: item?.clueType === "mazmun" ? "mazmun" : "saboq",
  };
}

function sanitizeAuthorItem(item) {
  const workId = String(item?.workId || "").trim();
  if (!workId) return null;
  return { workId };
}

function sanitizeTrueFalseItem(item) {
  const text = String(item?.text || "").trim().slice(0, 240);
  if (text.length < 10) return null;
  return {
    workId: String(item?.workId || "").trim(),
    text,
    isTrue: !!item?.isTrue,
  };
}

function sanitizeSection(section, kind) {
  const pickCount = clampPick(section?.pickCount, 3, 12);
  const raw = Array.isArray(section?.items) ? section.items : [];
  let items = [];
  if (kind === "guess") items = raw.map(sanitizeGuessItem).filter(Boolean);
  else if (kind === "author") items = raw.map(sanitizeAuthorItem).filter(Boolean);
  else items = raw.map(sanitizeTrueFalseItem).filter(Boolean);
  return { pickCount, items };
}

function readDb() {
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {
      guess: sanitizeSection(raw.guess, "guess"),
      author: sanitizeSection(raw.author, "author"),
      truefalse: sanitizeSection(raw.truefalse, "truefalse"),
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function writeDb(payload) {
  ensureFile();
  const data = {
    guess: sanitizeSection(payload?.guess, "guess"),
    author: sanitizeSection(payload?.author, "author"),
    truefalse: sanitizeSection(payload?.truefalse, "truefalse"),
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  return data;
}

export function getQuizGamesPublic() {
  return readDb();
}

export function saveQuizGames(payload) {
  return writeDb(payload || {});
}
