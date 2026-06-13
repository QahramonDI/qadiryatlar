import path from "path";
import { DATA_DIR } from "./media-store.js";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const DATA_FILE = path.join(DATA_DIR, "ijod.json");
registerJsonStore("ijod", DATA_FILE, { items: [] });

export const IJOD_MAX_ITEMS_PER_USER = 100;
export const IJOD_MAX_BYTES_PER_USER = 100 * 1024 * 1024;
export const IJOD_COUNT_LIMIT_MESSAGE = "Maksimal 100 ta rasm yuklash mumkin.";
export const IJOD_STORAGE_LIMIT_MESSAGE = "Sizning ijodiy ishlaringiz uchun ajratilgan 100 MB joy to‘lib bo‘lgan.";

function readDb() {
  return readJsonStore("ijod");
}

function writeDb(data) {
  writeJsonStore("ijod", data);
}

function ratingStats(item, userId = null) {
  const ratings = item.ratings || {};
  const entries = Object.values(ratings);
  const ratingCount = entries.length;
  const averageRating = ratingCount
    ? Math.round((entries.reduce((s, r) => s + r, 0) / ratingCount) * 10) / 10
    : 0;
  const out = { averageRating, ratingCount };
  if (userId != null) {
    const key = String(userId);
    out.userRating = ratings[key] ?? null;
  }
  return out;
}

function enrichItem(item, userId = null) {
  const { ratings, ...rest } = item;
  return { ...rest, ...ratingStats(item, userId) };
}

function itemBytes(item) {
  const n = Number(item?.image_bytes ?? item?.imageBytes ?? item?.size_bytes ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function getIjodUsageByUserId(userId) {
  const uid = Number(userId);
  const items = (readDb().items || []).filter((i) => Number(i.user_id) === uid);
  const count = items.length;
  const usedBytes = items.reduce((sum, item) => sum + itemBytes(item), 0);
  return {
    count,
    maxItems: IJOD_MAX_ITEMS_PER_USER,
    usedBytes,
    maxBytes: IJOD_MAX_BYTES_PER_USER,
    usedMb: Math.round((usedBytes / 1024 / 1024) * 10) / 10,
    maxMb: Math.round(IJOD_MAX_BYTES_PER_USER / 1024 / 1024),
    remainingItems: Math.max(0, IJOD_MAX_ITEMS_PER_USER - count),
    remainingBytes: Math.max(0, IJOD_MAX_BYTES_PER_USER - usedBytes),
  };
}

export function getIjodUsageByUserIds(userIds = []) {
  const wanted = new Set(userIds.map((id) => String(id)));
  const out = {};
  for (const id of wanted) {
    out[id] = {
      count: 0,
      maxItems: IJOD_MAX_ITEMS_PER_USER,
      usedBytes: 0,
      maxBytes: IJOD_MAX_BYTES_PER_USER,
      usedMb: 0,
      maxMb: Math.round(IJOD_MAX_BYTES_PER_USER / 1024 / 1024),
      remainingItems: IJOD_MAX_ITEMS_PER_USER,
      remainingBytes: IJOD_MAX_BYTES_PER_USER,
    };
  }
  for (const item of readDb().items || []) {
    const key = String(item.user_id);
    if (!wanted.has(key)) continue;
    out[key].count += 1;
    out[key].usedBytes += itemBytes(item);
  }
  for (const usage of Object.values(out)) {
    usage.usedMb = Math.round((usage.usedBytes / 1024 / 1024) * 10) / 10;
    usage.remainingItems = Math.max(0, IJOD_MAX_ITEMS_PER_USER - usage.count);
    usage.remainingBytes = Math.max(0, IJOD_MAX_BYTES_PER_USER - usage.usedBytes);
  }
  return out;
}

export function assertIjodQuota(userId, nextImageBytes = 0) {
  const usage = getIjodUsageByUserId(userId);
  if (usage.count >= IJOD_MAX_ITEMS_PER_USER) {
    const err = new Error("IJOD_COUNT_LIMIT");
    err.publicMessage = IJOD_COUNT_LIMIT_MESSAGE;
    throw err;
  }
  const incoming = Math.max(0, Math.round(Number(nextImageBytes) || 0));
  if (usage.usedBytes >= IJOD_MAX_BYTES_PER_USER || usage.usedBytes + incoming > IJOD_MAX_BYTES_PER_USER) {
    const err = new Error("IJOD_STORAGE_LIMIT");
    err.publicMessage = IJOD_STORAGE_LIMIT_MESSAGE;
    throw err;
  }
  return usage;
}

export function listIjod({ grade, valueId, sortBy = "newest", userId = null, limit = 200 } = {}) {
  let items = [...(readDb().items || [])].filter((i) => !i.hidden);
  if (grade) items = items.filter((i) => +i.grade === +grade);
  if (valueId) items = items.filter((i) => i.value_id === valueId);

  if (sortBy === "rating") {
    items.sort((a, b) => {
      const sa = ratingStats(a);
      const sb = ratingStats(b);
      if (sb.averageRating !== sa.averageRating) return sb.averageRating - sa.averageRating;
      if (sb.ratingCount !== sa.ratingCount) return sb.ratingCount - sa.ratingCount;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  } else {
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return items.slice(0, limit).map((i) => enrichItem(i, userId));
}

export function createIjod(entry) {
  const db = readDb();
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    ratings: {},
    ...entry,
  };
  db.items.unshift(item);
  writeDb(db);
  return enrichItem(item);
}

export function deleteIjod(id, userId) {
  const db = readDb();
  const idx = db.items.findIndex((i) => i.id === id && +i.user_id === +userId);
  if (idx < 0) return null;
  const [removed] = db.items.splice(idx, 1);
  writeDb(db);
  return removed;
}

export function adminDeleteIjod(id) {
  const db = readDb();
  const idx = db.items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const [removed] = db.items.splice(idx, 1);
  writeDb(db);
  return removed;
}

export function adminUpdateIjod(id, patch) {
  const db = readDb();
  const idx = db.items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const item = db.items[idx];
  if (patch.title != null) item.title = String(patch.title).trim().slice(0, 80);
  if (patch.description != null) item.description = String(patch.description).trim().slice(0, 280);
  if (patch.value_id != null) item.value_id = String(patch.value_id).trim();
  if (patch.hidden != null) item.hidden = !!patch.hidden;
  writeDb(db);
  return enrichItem(item);
}

export function listIjodAdmin({ limit = 500 } = {}) {
  const items = [...(readDb().items || [])];
  items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return items.slice(0, limit).map((i) => enrichItem(i));
}

export function getIjodCountByUserId() {
  const map = {};
  for (const item of readDb().items || []) {
    const uid = item.user_id;
    map[uid] = (map[uid] || 0) + 1;
  }
  return map;
}

export function getIjodById(id, userId = null) {
  const item = readDb().items.find((i) => i.id === id) || null;
  return item ? enrichItem(item, userId) : null;
}

export function rateIjod(id, userId, rating) {
  const db = readDb();
  const idx = db.items.findIndex((i) => i.id === id);
  if (idx < 0) return { error: "not_found" };
  const item = db.items[idx];
  if (+item.user_id === +userId) return { error: "own_item" };
  if (!item.ratings) item.ratings = {};
  item.ratings[String(userId)] = rating;
  writeDb(db);
  return { item: enrichItem(item, userId) };
}
