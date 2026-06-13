import path from "path";
import { fileURLToPath } from "url";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "custom-values.json");
registerJsonStore("custom-values", DATA_FILE, { values: [], overrides: {}, hiddenIds: [] });

function readDb() {
  try {
    const raw = readJsonStore("custom-values");
    return {
      values: raw.values || [],
      overrides: raw.overrides || {},
      hiddenIds: raw.hiddenIds || [],
    };
  } catch {
    return { values: [], overrides: {}, hiddenIds: [] };
  }
}

function writeDb(data) {
  writeJsonStore("custom-values", {
    values: data.values || [],
    overrides: data.overrides || {},
    hiddenIds: data.hiddenIds || [],
  });
}

function slugId(name) {
  const base =
    String(name || "qadriyat")
      .toLowerCase()
      .replace(/o'/g, "o")
      .replace(/g'/g, "g")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "qadriyat";
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export function listValuesCatalog() {
  return readDb();
}

export function getCatalogPublic() {
  return readDb();
}

export function createCustomValue(payload) {
  const db = readDb();
  const name = String(payload.name || "").trim().slice(0, 60);
  if (!name) throw new Error("INVALID_NAME");
  let id = String(payload.id || slugId(name)).trim().toLowerCase().slice(0, 40);
  if (!/^[a-z0-9-]+$/.test(id)) id = slugId(name);
  const allIds = new Set([
    ...db.values.map((v) => v.id),
    ...Object.keys(db.overrides),
  ]);
  if (allIds.has(id)) throw new Error("VALUE_EXISTS");
  const value = {
    id,
    name,
    icon: String(payload.icon || "fa-star").trim().slice(0, 40),
    color: String(payload.color || "#e6821e").trim().slice(0, 20),
    desc: String(payload.desc || "").trim().slice(0, 300),
    custom: true,
  };
  db.values.push(value);
  writeDb(db);
  return value;
}

export function updateValue(id, payload, { isTextbook = false } = {}) {
  const db = readDb();
  const patch = {
    name: payload.name != null ? String(payload.name).trim().slice(0, 60) : undefined,
    icon: payload.icon != null ? String(payload.icon).trim().slice(0, 40) : undefined,
    color: payload.color != null ? String(payload.color).trim().slice(0, 20) : undefined,
    desc: payload.desc != null ? String(payload.desc).trim().slice(0, 300) : undefined,
  };
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
  if (!Object.keys(patch).length) throw new Error("EMPTY_PATCH");

  if (isTextbook) {
    db.overrides[id] = { ...(db.overrides[id] || {}), ...patch };
    writeDb(db);
    return { kind: "override", id, patch: db.overrides[id] };
  }

  const idx = db.values.findIndex((v) => v.id === id);
  if (idx < 0) throw new Error("NOT_FOUND");
  db.values[idx] = { ...db.values[idx], ...patch };
  writeDb(db);
  return { kind: "custom", value: db.values[idx] };
}

export function deleteValue(id, { isTextbook = false } = {}) {
  const db = readDb();
  if (isTextbook) {
    if (!db.hiddenIds.includes(id)) db.hiddenIds.push(id);
    delete db.overrides[id];
    writeDb(db);
    return { ok: true, hidden: true };
  }
  const before = db.values.length;
  db.values = db.values.filter((v) => v.id !== id);
  if (db.values.length === before) throw new Error("NOT_FOUND");
  writeDb(db);
  return { ok: true, deleted: true };
}

export function restoreTextbookValue(id) {
  const db = readDb();
  db.hiddenIds = db.hiddenIds.filter((x) => x !== id);
  writeDb(db);
  return { ok: true };
}
