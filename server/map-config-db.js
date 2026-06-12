import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "map-config.json");
export const MAP_UPLOAD_DIR = path.join(__dirname, "uploads", "map");
fs.mkdirSync(MAP_UPLOAD_DIR, { recursive: true });

const REGION_IDS = [
  "qoraqalpogiston", "xorazm", "navoiy", "buxoro", "qashqadaryo", "surxondaryo",
  "samarqand", "jizzax", "sirdaryo", "toshkent", "namangan", "andijon", "fargona",
];

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ regions: {} }, null, 2));
  }
}

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
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
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
  ensureFile();
  const payload = { regions: data.regions || {} };
  if (data.backgroundUrl) payload.backgroundUrl = data.backgroundUrl;
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
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

export function saveMapInfographic(regionId, imageBase64) {
  const id = String(regionId || "").trim();
  if (!REGION_IDS.includes(id)) throw new Error("INVALID_REGION");

  const match = String(imageBase64 || "").match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!match) throw new Error("INVALID_IMAGE");
  const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > 6 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");

  const db = readDb();
  const prev = db.regions[id]?.infographicUrl;
  const filename = `${id}.${ext}`;
  fs.writeFileSync(path.join(MAP_UPLOAD_DIR, filename), buf);
  const url = `/uploads/map/${filename}`;

  db.regions[id] = { ...(db.regions[id] || {}), infographicUrl: url };
  writeDb({ regions: db.regions, backgroundUrl: db.backgroundUrl });

  if (prev?.startsWith("/uploads/map/") && prev !== url) {
    try {
      const fp = path.join(MAP_UPLOAD_DIR, path.basename(prev));
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch { /* ignore */ }
  }

  return { url, config: readDb() };
}

export function removeMapInfographic(regionId) {
  const id = String(regionId || "").trim();
  if (!REGION_IDS.includes(id)) throw new Error("INVALID_REGION");
  const db = readDb();
  const prev = db.regions[id]?.infographicUrl;
  if (db.regions[id]) {
    delete db.regions[id].infographicUrl;
    if (!Object.keys(db.regions[id]).length) delete db.regions[id];
  }
  writeDb({ regions: db.regions, backgroundUrl: db.backgroundUrl });
  if (prev?.startsWith("/uploads/map/")) {
    try {
      const fp = path.join(MAP_UPLOAD_DIR, path.basename(prev));
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch { /* ignore */ }
  }
  return readDb();
}

function saveMapImageFile(filename, imageBase64, maxBytes = 6 * 1024 * 1024) {
  const match = String(imageBase64 || "").match(/^data:image\/(jpeg|jpg|png|webp|svg\+xml);base64,(.+)$/i);
  if (!match) throw new Error("INVALID_IMAGE");
  let ext = match[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  if (ext === "svg+xml") ext = "svg";
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > maxBytes) throw new Error("IMAGE_TOO_LARGE");
  fs.writeFileSync(path.join(MAP_UPLOAD_DIR, filename), buf);
  return `/uploads/map/${filename}`;
}

function removeMapUploadFile(url) {
  if (!url?.startsWith("/uploads/map/")) return;
  try {
    const fp = path.join(MAP_UPLOAD_DIR, path.basename(url));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch { /* ignore */ }
}

export function saveMapBackground(imageBase64) {
  const db = readDb();
  const prev = db.backgroundUrl;
  const match = String(imageBase64 || "").match(/^data:image\/(jpeg|jpg|png|webp|svg\+xml);base64,/i);
  const ext = match?.[1]?.toLowerCase() === "jpeg"
    ? "jpg"
    : (match?.[1]?.toLowerCase() === "svg+xml" ? "svg" : match?.[1]?.toLowerCase() || "png");
  const urlFinal = saveMapImageFile(`background.${ext}`, imageBase64);
  writeDb({ regions: db.regions, backgroundUrl: urlFinal });
  if (prev && prev !== urlFinal) removeMapUploadFile(prev);
  return { url: urlFinal, config: readDb() };
}

export function removeMapBackground() {
  const db = readDb();
  const prev = db.backgroundUrl;
  writeDb({ regions: db.regions, backgroundUrl: null });
  removeMapUploadFile(prev);
  return readDb();
}
