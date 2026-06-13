import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { getSupabaseAdmin, getSupabaseBucket } from "./supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Ma'lumotlar papkasi — JSON va rasmlar shu yerda saqlanadi (deployda doimiy disk mount qiling) */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");

export const MEDIA_ROOT = path.join(DATA_DIR, "media");
export const LEGACY_UPLOADS_ROOT = path.join(__dirname, "uploads");
const BUNDLE_DATA_DIR = path.join(__dirname, "data");

fs.mkdirSync(MEDIA_ROOT, { recursive: true });

/** Render doimiy disk: birinchi marta repodagi data/ ni diskka nusxalaydi */
export function ensurePersistentDataDir() {
  if (!process.env.DATA_DIR) return;
  const target = path.resolve(process.env.DATA_DIR);
  if (target === path.resolve(BUNDLE_DATA_DIR)) return;
  fs.mkdirSync(target, { recursive: true });
  const marker = path.join(target, ".seeded");
  if (fs.existsSync(marker)) return;

  const copyInto = (src, dest) => {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const from = path.join(src, entry.name);
      const to = path.join(dest, entry.name);
      if (entry.isDirectory()) copyInto(from, to);
      else if (!fs.existsSync(to)) fs.copyFileSync(from, to);
    }
  };

  copyInto(BUNDLE_DATA_DIR, target);
  fs.writeFileSync(marker, new Date().toISOString());
  console.log(`[data] Render diskka boshlang'ich ma'lumotlar nusxalandi: ${target}`);
}

export function parseImageBase64(imageBase64, maxBytes = 6 * 1024 * 1024) {
  const match = String(imageBase64 || "").match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i);
  if (!match) throw new Error("INVALID_IMAGE");
  let ext = match[1].toLowerCase();
  if (ext === "jpeg") ext = "jpg";
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > maxBytes) throw new Error("IMAGE_TOO_LARGE");
  return { buf, ext };
}

function toDataUrl(buf, ext) {
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${buf.toString("base64")}`;
}

export async function optimizeImageBase64(imageBase64, {
  maxBytes = 6 * 1024 * 1024,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 78,
  format = "jpeg",
  fit = "inside",
  background = "#ffffff",
} = {}) {
  const { buf } = parseImageBase64(imageBase64, maxBytes);
  const pipeline = sharp(buf, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit,
      withoutEnlargement: true,
    });

  try {
    if (format === "webp") {
      const out = await pipeline.webp({ quality }).toBuffer();
      return { buf: out, ext: "webp", dataUrl: toDataUrl(out, "webp") };
    }

    const out = await pipeline
      .flatten({ background })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    return { buf: out, ext: "jpg", dataUrl: toDataUrl(out, "jpg") };
  } catch {
    throw new Error("INVALID_IMAGE");
  }
}

function filePathToDataUrl(category, filename) {
  const fp = resolveMediaFilePath(category, filename);
  if (!fp) return null;
  try {
    const buf = fs.readFileSync(fp);
    const ext = path.extname(filename).slice(1).toLowerCase() || "png";
    return toDataUrl(buf, ext === "jpeg" ? "jpg" : ext);
  } catch {
    return null;
  }
}

export function saveMedia(category, basename, imageBase64, maxBytes = 6 * 1024 * 1024) {
  const { buf, ext } = parseImageBase64(imageBase64, maxBytes);
  const safeBase = String(basename).replace(/[^a-zA-Z0-9_-]/g, "") || "image";
  const filename = `${safeBase}.${ext}`;
  const dir = path.join(MEDIA_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/api/media/${category}/${filename}`;
}

export async function saveOptimizedMedia(category, basename, imageBase64, options = {}) {
  const { buf, ext } = await optimizeImageBase64(imageBase64, options);
  const safeBase = String(basename).replace(/[^a-zA-Z0-9_-]/g, "") || "image";
  const filename = `${safeBase}.${ext}`;
  const dir = path.join(MEDIA_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/api/media/${category}/${filename}`;
}

export async function saveOptimizedStorageMedia(category, basename, imageBase64, options = {}) {
  const { buf, ext } = await optimizeImageBase64(imageBase64, options);
  return uploadStorageMediaBuffer(category, basename, buf, ext);
}

export async function saveOptimizedStorageMediaWithMeta(category, basename, imageBase64, options = {}) {
  const { buf, ext } = await optimizeImageBase64(imageBase64, options);
  const url = await uploadStorageMediaBuffer(category, basename, buf, ext);
  return { url, sizeBytes: buf.length, ext };
}

export function parseAudioBase64(audioBase64, maxBytes = 50 * 1024 * 1024) {
  const match = String(audioBase64 || "").match(/^data:audio\/(mpeg|mp3|mp4|m4a|x-m4a|wav|wave|ogg|webm);base64,(.+)$/i);
  if (!match) throw new Error("INVALID_AUDIO");
  let ext = match[1].toLowerCase();
  if (ext === "mpeg") ext = "mp3";
  if (ext === "mp4" || ext === "x-m4a") ext = "m4a";
  if (ext === "wave") ext = "wav";
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > maxBytes) throw new Error("AUDIO_TOO_LARGE");
  return { buf, ext };
}

export async function saveStorageAudio(category, basename, audioBase64, options = {}) {
  const { buf, ext } = parseAudioBase64(audioBase64, options.maxBytes);
  const url = await uploadStorageMediaBuffer(category, basename, buf, ext);
  return { url, sizeBytes: buf.length, ext };
}

async function uploadStorageMediaBuffer(category, basename, buf, ext) {
  const safeCategory = String(category).replace(/[^a-zA-Z0-9_-]/g, "") || "media";
  const safeBase = String(basename).replace(/[^a-zA-Z0-9_-]/g, "") || "image";
  const objectPath = `${safeCategory}/${safeBase}.${ext}`;
  const bucket = getSupabaseBucket();
  const supabase = getSupabaseAdmin();
  const contentTypes = {
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    wav: "audio/wav",
    ogg: "audio/ogg",
    webm: "audio/webm",
  };
  const contentType = contentTypes[ext] || "application/octet-stream";
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buf, {
      contentType,
      upsert: true,
    });
  if (error) {
    const err = new Error(`Supabase Storage upload xatoligi: ${error.message}`);
    err.code = "SUPABASE_STORAGE_ERROR";
    throw err;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function deleteStorageMediaByUrl(url) {
  if (!url || url.startsWith("data:image/")) return;
  if (url.startsWith("/api/media/") || url.startsWith("/uploads/")) {
    deleteMediaByUrl(url);
    return;
  }

  const bucket = getSupabaseBucket();
  let objectPath = "";
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx >= 0) {
      objectPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    }
  } catch {
    return;
  }
  if (!objectPath) return;
  const { error } = await getSupabaseAdmin().storage.from(bucket).remove([objectPath]);
  if (error) console.error(`[storage] ${objectPath} o'chirilmadi: ${error.message}`);
}

export function deleteMediaByUrl(url) {
  if (!url || url.startsWith("data:image/")) return;
  if (url.startsWith("/api/media/")) {
    const rel = url.slice("/api/media/".length);
    const fp = path.join(MEDIA_ROOT, rel);
    try {
      if (fp.startsWith(MEDIA_ROOT) && fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch { /* ignore */ }
    return;
  }
  if (url.startsWith("/uploads/")) {
    const rel = url.slice("/uploads/".length);
    const fp = path.join(LEGACY_UPLOADS_ROOT, rel);
    try {
      if (fp.startsWith(LEGACY_UPLOADS_ROOT) && fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch { /* ignore */ }
  }
}

export function resolveMediaFilePath(category, filename) {
  const safeCat = String(category).replace(/[^a-z0-9_-]/gi, "");
  const safeFile = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safeCat || !safeFile) return null;

  const mediaFp = path.join(MEDIA_ROOT, safeCat, safeFile);
  if (mediaFp.startsWith(MEDIA_ROOT) && fs.existsSync(mediaFp)) return mediaFp;

  const legacyFp = path.join(LEGACY_UPLOADS_ROOT, safeCat, safeFile);
  if (legacyFp.startsWith(LEGACY_UPLOADS_ROOT) && fs.existsSync(legacyFp)) return legacyFp;

  return null;
}

function copyLegacyFileToMedia(category, filename) {
  const legacyFp = path.join(LEGACY_UPLOADS_ROOT, category, filename);
  if (!legacyFp.startsWith(LEGACY_UPLOADS_ROOT) || !fs.existsSync(legacyFp)) return null;
  const destDir = path.join(MEDIA_ROOT, category);
  fs.mkdirSync(destDir, { recursive: true });
  const destFp = path.join(destDir, filename);
  if (!fs.existsSync(destFp)) fs.copyFileSync(legacyFp, destFp);
  return `/api/media/${category}/${filename}`;
}

function migrateApiMediaUrl(url) {
  if (!url?.startsWith("/api/media/")) return url;
  const parts = url.slice("/api/media/".length).split("/").filter(Boolean);
  if (parts.length !== 2) return url;
  const [category, filename] = parts;
  if (category !== "works") return url;
  return resolveMediaFilePath(category, filename) ? url : filePathToDataUrl(category, filename) || url;
}

function migrateUploadUrl(url) {
  if (!url?.startsWith("/uploads/")) return url;
  const parts = url.slice("/uploads/".length).split("/").filter(Boolean);
  if (parts.length !== 2) return url;
  const [category, filename] = parts;
  const newUrl = copyLegacyFileToMedia(category, filename);
  return newUrl || url;
}

function migrateDataUrlToMedia(category, basename, imageBase64) {
  if (!String(imageBase64 || "").startsWith("data:image/")) return imageBase64;
  try {
    return saveMedia(category, basename, imageBase64);
  } catch {
    return imageBase64;
  }
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/** Eski uploads/ papkasidagi rasmlarni data/media/ ga ko'chiradi va JSON URL larni yangilaydi */
export function migrateLegacyUploads() {
  let changed = 0;

  const worksFile = path.join(DATA_DIR, "custom-works.json");
  const worksDb = readJsonFile(worksFile, null);
  if (worksDb) {
    let worksChanged = false;
    for (const work of worksDb.works || []) {
      if (work.imageUrl?.startsWith("/uploads/")) {
        const next = migrateUploadUrl(work.imageUrl);
        if (next !== work.imageUrl) {
          work.imageUrl = next;
          worksChanged = true;
        }
      } else if (work.imageUrl?.startsWith("/api/media/works/")) {
        const next = migrateApiMediaUrl(work.imageUrl);
        if (next !== work.imageUrl) {
          work.imageUrl = next;
          worksChanged = true;
        }
      } else if (work.imageUrl?.startsWith("data:image/")) {
        const next = migrateDataUrlToMedia("works", work.id || work.title || "work", work.imageUrl);
        if (next !== work.imageUrl) {
          work.imageUrl = next;
          worksChanged = true;
        }
      }
    }
    for (const id of Object.keys(worksDb.overrides || {})) {
      const patch = worksDb.overrides[id];
      if (patch?.imageUrl?.startsWith("/uploads/")) {
        const next = migrateUploadUrl(patch.imageUrl);
        if (next !== patch.imageUrl) {
          patch.imageUrl = next;
          worksChanged = true;
        }
      } else if (patch?.imageUrl?.startsWith("/api/media/works/")) {
        const next = migrateApiMediaUrl(patch.imageUrl);
        if (next !== patch.imageUrl) {
          patch.imageUrl = next;
          worksChanged = true;
        }
      } else if (patch?.imageUrl?.startsWith("data:image/")) {
        const next = migrateDataUrlToMedia("works", id, patch.imageUrl);
        if (next !== patch.imageUrl) {
          patch.imageUrl = next;
          worksChanged = true;
        }
      }
    }
    if (worksChanged) {
      writeJsonFile(worksFile, worksDb);
      changed++;
    }
  }

  const mapFile = path.join(DATA_DIR, "map-config.json");
  const mapDb = readJsonFile(mapFile, null);
  if (mapDb) {
    let mapChanged = false;
    if (mapDb.backgroundUrl?.startsWith("/uploads/")) {
      const next = migrateUploadUrl(mapDb.backgroundUrl);
      if (next !== mapDb.backgroundUrl) {
        mapDb.backgroundUrl = next;
        mapChanged = true;
      }
    }
    for (const id of Object.keys(mapDb.regions || {})) {
      const region = mapDb.regions[id];
      if (region?.infographicUrl?.startsWith("/uploads/")) {
        const next = migrateUploadUrl(region.infographicUrl);
        if (next !== region.infographicUrl) {
          region.infographicUrl = next;
          mapChanged = true;
        }
      }
    }
    if (mapChanged) {
      writeJsonFile(mapFile, mapDb);
      changed++;
    }
  }

  const ijodFile = path.join(DATA_DIR, "ijod.json");
  const ijodDb = readJsonFile(ijodFile, null);
  if (ijodDb?.items?.length) {
    let ijodChanged = false;
    for (const item of ijodDb.items) {
      const url = item.image_url || item.imageUrl;
      if (url?.startsWith("/uploads/")) {
        const next = migrateUploadUrl(url);
        if (next !== url) {
          item.image_url = next;
          delete item.imageUrl;
          ijodChanged = true;
        }
      }
    }
    if (ijodChanged) {
      writeJsonFile(ijodFile, ijodDb);
      changed++;
    }
  }

  if (changed) {
    console.log(`[media] ${changed} ta ma'lumot faylida rasm URL lari yangilandi (uploads → data/media)`);
  }

}
