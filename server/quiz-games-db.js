import path from "path";
import { fileURLToPath } from "url";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "quiz-games.json");

const DEFAULTS = {
  guess: { pickCount: 8, items: [] },
  author: { pickCount: 8, items: [] },
  truefalse: { pickCount: 10, items: [] },
};

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

function normalizeQuizGamesDb(raw) {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    guess: sanitizeSection(data.guess, "guess"),
    author: sanitizeSection(data.author, "author"),
    truefalse: sanitizeSection(data.truefalse, "truefalse"),
  };
}

registerJsonStore("quiz-games", DATA_FILE, DEFAULTS, normalizeQuizGamesDb);

function readDb() {
  try {
    return normalizeQuizGamesDb(readJsonStore("quiz-games"));
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function writeDb(payload) {
  const data = normalizeQuizGamesDb(payload);
  writeJsonStore("quiz-games", data);
  return data;
}

export function getQuizGamesPublic() {
  return readDb();
}

export function saveQuizGames(payload) {
  return writeDb(payload || {});
}
