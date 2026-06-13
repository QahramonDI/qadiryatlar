import path from "path";
import { DATA_DIR, deleteStorageMediaByUrl, saveOptimizedStorageMedia } from "./media-store.js";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const DATA_FILE = path.join(DATA_DIR, "map-config.json");
registerJsonStore("map-config", DATA_FILE, { regions: {} });

const REGION_IDS = [
  "qoraqalpogiston", "xorazm", "navoiy", "buxoro", "qashqadaryo", "surxondaryo",
  "samarqand", "jizzax", "sirdaryo", "toshkent", "namangan", "andijon", "fargona",
];

function normalizeRegionEntry(id, raw = {}) {
  const out = {};
  if (typeof raw.mapX === "number" && Number.isFinite(raw.mapX)) {
    out.mapX = Math.min(100, Math.max(0, +raw.mapX));
  }
  if (typeof raw.mapY === "number" && Number.isFinite(raw.mapY)) {
    out.mapY = Math.min(100, Math.max(0, +raw.mapY));
  }
  if (raw.workId) out.workId = String(raw.workId).trim();
  if (raw.value) out.value = String(raw.value).trim();
  if (raw.infographicUrl) out.infographicUrl = String(raw.infographicUrl).trim();
  if (raw.story != null) out.story = String(raw.story).trim().slice(0, 600);
  if (raw.tale != null) out.tale = String(raw.tale).trim().slice(0, 400);
  if (raw.tradition != null) out.tradition = String(raw.tradition).trim().slice(0, 400);
  if (raw.fact != null) out.fact = String(raw.fact).trim().slice(0, 400);
  return out;
}

function readDb() {
  try {
    const raw = readJsonStore("map-config");
    const regions = {};
    for (const [id, entry] of Object.entries(raw.regions || {})) {
      if (!REGION_IDS.includes(id)) continue;
      const norm = normalizeRegionEntry(id, entry);
      if (Object.keys(norm).length) regions[id] = norm;
    }
    const backgroundUrl = raw.backgroundUrl ? String(raw.backgroundUrl).trim() : null;
    return { regions, backgroundUrl: backgroundUrl || null };
  } catch {
    return { regions: {}, backgroundUrl: null };
  }
}

function writeDb(data) {
  const payload = { regions: data.regions || {} };
  if (data.backgroundUrl) payload.backgroundUrl = data.backgroundUrl;
  writeJsonStore("map-config", payload);
}

export function getMapConfigPublic() {
  return readDb();
}

export function saveMapConfig(payload) {
  const db = readDb();
  const regions = { ...db.regions };
  for (const [id, entry] of Object.entries(payload?.regions || {})) {
    if (!REGION_IDS.includes(id)) continue;
    const merged = { ...(db.regions[id] || {}), ...entry };
    const norm = normalizeRegionEntry(id, merged);
    if (Object.keys(norm).length) regions[id] = norm;
  }
  writeDb({ regions, backgroundUrl: db.backgroundUrl });
  return readDb();
}

export async function saveMapInfographic(regionId, imageBase64) {
  const id = String(regionId || "").trim();
  if (!REGION_IDS.includes(id)) throw new Error("INVALID_REGION");

  const db = readDb();
  const prev = db.regions[id]?.infographicUrl;
  const url = await saveOptimizedStorageMedia("map", id, imageBase64, {
    maxBytes: 6 * 1024 * 1024,
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 78,
  });

  db.regions[id] = { ...(db.regions[id] || {}), infographicUrl: url };
  writeDb({ regions: db.regions, backgroundUrl: db.backgroundUrl });

  if (prev && prev !== url) await deleteStorageMediaByUrl(prev);

  return { url, config: readDb() };
}

export async function removeMapInfographic(regionId) {
  const id = String(regionId || "").trim();
  if (!REGION_IDS.includes(id)) throw new Error("INVALID_REGION");
  const db = readDb();
  const prev = db.regions[id]?.infographicUrl;
  if (db.regions[id]) {
    delete db.regions[id].infographicUrl;
    if (!Object.keys(db.regions[id]).length) delete db.regions[id];
  }
  writeDb({ regions: db.regions, backgroundUrl: db.backgroundUrl });
  if (prev) await deleteStorageMediaByUrl(prev);
  return readDb();
}

async function saveMapImageFile(filename, imageBase64, maxBytes = 6 * 1024 * 1024) {
  const base = path.basename(filename, path.extname(filename));
  return saveOptimizedStorageMedia("map", base, imageBase64, {
    maxBytes,
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 78,
  });
}

async function removeMapUploadFile(url) {
  await deleteStorageMediaByUrl(url);
}

export async function saveMapBackground(imageBase64) {
  const db = readDb();
  const prev = db.backgroundUrl;
  const match = String(imageBase64 || "").match(/^data:image\/(jpeg|jpg|png|webp);base64,/i);
  const ext = match?.[1]?.toLowerCase() === "jpeg"
    ? "jpg"
    : (match?.[1]?.toLowerCase() === "svg+xml" ? "svg" : match?.[1]?.toLowerCase() || "png");
  const urlFinal = await saveMapImageFile(`background.${ext}`, imageBase64);
  writeDb({ regions: db.regions, backgroundUrl: urlFinal });
  if (prev && prev !== urlFinal) await removeMapUploadFile(prev);
  return { url: urlFinal, config: readDb() };
}

export async function removeMapBackground() {
  const db = readDb();
  const prev = db.backgroundUrl;
  writeDb({ regions: db.regions, backgroundUrl: null });
  await removeMapUploadFile(prev);
  return readDb();
}
