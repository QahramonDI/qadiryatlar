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
registerJsonStore("quiz-games", DATA_FILE, DEFAULTS);

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
  try {
    const raw = readJsonStore("quiz-games");
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
  const data = {
    guess: sanitizeSection(payload?.guess, "guess"),
    author: sanitizeSection(payload?.author, "author"),
    truefalse: sanitizeSection(payload?.truefalse, "truefalse"),
  };
  writeJsonStore("quiz-games", data);
  return data;
}

export function getQuizGamesPublic() {
  return readDb();
}

export function saveQuizGames(payload) {
  return writeDb(payload || {});
}
