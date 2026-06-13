import fs from "fs";
import path from "path";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase.js";

const stores = new Map();
const cache = new Map();
const pendingWrites = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

export function registerJsonStore(key, filePath, fallback) {
  stores.set(key, { filePath, fallback });
}

export async function initJsonStores() {
  if (!isSupabaseConfigured()) {
    for (const [key, store] of stores) {
      cache.set(key, readLocal(store.filePath, store.fallback));
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  for (const [key, store] of stores) {
    const localData = readLocal(store.filePath, store.fallback);
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
    if (data?.data) {
      cache.set(key, data.data);
      writeLocal(store.filePath, data.data);
    } else {
      cache.set(key, localData);
      const { error: upsertError } = await supabase
        .from("app_data")
        .upsert({ key, data: localData, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (upsertError) {
        const err = new Error(`Supabase app_data '${key}' yaratilmadi: ${upsertError.message}`);
        err.code = "SUPABASE_QUERY_ERROR";
        throw err;
      }
    }
  }
}

export function readJsonStore(key) {
  const store = stores.get(key);
  if (!store) throw new Error(`JSON store ro'yxatdan o'tmagan: ${key}`);
  if (!cache.has(key)) cache.set(key, readLocal(store.filePath, store.fallback));
  return clone(cache.get(key));
}

export function writeJsonStore(key, data) {
  const store = stores.get(key);
  if (!store) throw new Error(`JSON store ro'yxatdan o'tmagan: ${key}`);
  cache.set(key, clone(data));
  writeLocal(store.filePath, data);

  if (!isSupabaseConfigured()) return;
  const write = getSupabaseAdmin()
    .from("app_data")
    .upsert({ key, data, updated_at: new Date().toISOString() }, { onConflict: "key" })
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
