import fs from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase.js";

const stores = new Map();
const cache = new Map();
const pendingWrites = new Map();

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fallbackNormalize(value, fallback) {
  if (Array.isArray(fallback)) return Array.isArray(value) ? value : clone(fallback);
  if (fallback && typeof fallback === "object") {
    return value && typeof value === "object" && !Array.isArray(value) ? value : clone(fallback);
  }
  return value ?? clone(fallback);
}

function normalizeStoreData(store, value) {
  const normalized = store.normalize
    ? store.normalize(value)
    : fallbackNormalize(value, store.fallback);
  return clone(normalized ?? store.fallback);
}

function readLocal(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch { /* ignore */ }
  return clone(fallback);
}

function writeLocal(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

export function registerJsonStore(key, filePath, fallback, normalize = null) {
  stores.set(key, { filePath, fallback, normalize });
}

export async function initJsonStores() {
  if (!isSupabaseConfigured()) {
    for (const [key, store] of stores) {
      const data = normalizeStoreData(store, readLocal(store.filePath, store.fallback));
      cache.set(key, data);
      writeLocal(store.filePath, data);
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  for (const [key, store] of stores) {
    const localData = normalizeStoreData(store, readLocal(store.filePath, store.fallback));
    const { data, error } = await supabase
      .from("app_data")
      .select("data")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      const err = new Error(`Supabase app_data '${key}' o'qilmadi: ${error.message}`);
      err.code = "SUPABASE_QUERY_ERROR";
      throw err;
    }
    if (data && Object.prototype.hasOwnProperty.call(data, "data")) {
      const normalized = normalizeStoreData(store, data.data);
      cache.set(key, normalized);
      writeLocal(store.filePath, normalized);
      if (!sameJson(normalized, data.data)) {
        const { error: upsertError } = await supabase
          .from("app_data")
          .upsert({ key, data: normalized, updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (upsertError) console.error(`[app_data] ${key} tuzatilgan data saqlanmadi:`, upsertError.message);
      }
    } else {
      cache.set(key, localData);
      const { error: upsertError } = await supabase
        .from("app_data")
        .upsert({ key, data: localData, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (upsertError) console.error(`[app_data] ${key} boshlang'ich data saqlanmadi:`, upsertError.message);
    }
  }
}

export function readJsonStore(key) {
  const store = stores.get(key);
  if (!store) throw new Error(`JSON store ro'yxatdan o'tmagan: ${key}`);
  if (!cache.has(key)) {
    const data = normalizeStoreData(store, readLocal(store.filePath, store.fallback));
    cache.set(key, data);
    writeLocal(store.filePath, data);
  }
  const data = normalizeStoreData(store, cache.get(key));
  if (!sameJson(data, cache.get(key))) {
    cache.set(key, data);
    writeLocal(store.filePath, data);
  }
  return clone(data);
}

export function writeJsonStore(key, data) {
  const store = stores.get(key);
  if (!store) throw new Error(`JSON store ro'yxatdan o'tmagan: ${key}`);
  const normalized = normalizeStoreData(store, data);
  cache.set(key, clone(normalized));
  writeLocal(store.filePath, normalized);

  if (!isSupabaseConfigured()) return;
  const write = getSupabaseAdmin()
    .from("app_data")
    .upsert({ key, data: normalized, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .then(({ error }) => {
      if (error) console.error(`[app_data] ${key} saqlanmadi:`, error.message);
    })
    .catch((e) => console.error(`[app_data] ${key} saqlanmadi:`, e.message));
  pendingWrites.set(key, write);
}

export async function flushJsonStoreWrites() {
  await Promise.allSettled([...pendingWrites.values()]);
  pendingWrites.clear();
}
