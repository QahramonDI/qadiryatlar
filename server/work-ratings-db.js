import path from "path";
import { fileURLToPath } from "url";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "work-ratings.json");
registerJsonStore("work-ratings", DATA_FILE, { works: {} });

function readDb() {
  const raw = readJsonStore("work-ratings");
  return raw.works && typeof raw.works === "object" ? raw.works : {};
}

function writeDb(works) {
  writeJsonStore("work-ratings", { works });
}

function statsForRatings(ratings, userId = null) {
  const entries = Object.values(ratings || {});
  const ratingCount = entries.length;
  const averageRating = ratingCount
    ? Math.round((entries.reduce((s, r) => s + r, 0) / ratingCount) * 10) / 10
    : 0;
  const out = { averageRating, ratingCount };
  if (userId != null) {
    out.userRating = ratings[String(userId)] ?? null;
  }
  return out;
}

export function getAllWorkRatingStats() {
  const works = readDb();
  const out = {};
  for (const [workId, ratings] of Object.entries(works)) {
    out[workId] = statsForRatings(ratings);
  }
  return out;
}

export function getWorkRatingStats(workId, userId = null) {
  const id = String(workId || "").trim();
  const works = readDb();
  const ratings = works[id] || {};
  return { workId: id, ...statsForRatings(ratings, userId) };
}

export function rateWork(workId, userId, rating) {
  const id = String(workId || "").trim();
  if (!id || !/^[a-zA-Z0-9_'-]+$/.test(id)) throw new Error("INVALID_ID");
  const works = readDb();
  if (!works[id]) works[id] = {};
  works[id][String(userId)] = rating;
  writeDb(works);
  return getWorkRatingStats(id, userId);
}
