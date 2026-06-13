import { createClient } from "@supabase/supabase-js";

let client = null;

function getSupabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "works";
  return { url, serviceRoleKey, bucket };
}

export function isSupabaseConfigured() {
  const { url, serviceRoleKey } = getSupabaseEnv();
  return !!(url && serviceRoleKey);
}

export function getSupabaseConfigError() {
  const missing = [];
  const { url, serviceRoleKey } = getSupabaseEnv();
  if (!url) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!missing.length) return null;
  return `Supabase sozlanmagan: Render Environment Variables ichiga ${missing.join(", ")} qo'shing.`;
}

export function getSupabaseBucket() {
  return getSupabaseEnv().bucket;
}

export function getSupabaseAdmin() {
  const error = getSupabaseConfigError();
  if (error) {
    const err = new Error(error);
    err.code = "SUPABASE_NOT_CONFIGURED";
    throw err;
  }
  if (!client) {
    const { url, serviceRoleKey } = getSupabaseEnv();
    client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}
