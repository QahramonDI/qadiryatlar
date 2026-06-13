import { deleteStorageMediaByUrl, saveStorageAudio } from "./media-store.js";
import { getSupabaseAdmin } from "./supabase.js";

const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

function slugId(title) {
  const base =
    String(title || "audio")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "audio";
  return `${base}-${Date.now().toString(36)}`;
}

function cleanText(value, fallback = "", max = 200) {
  const text = String(value ?? fallback ?? "").trim();
  return max ? text.slice(0, max) : text;
}

function normalizePayload(payload = {}, existing = null) {
  const title = cleanText(payload.title, existing?.title || "", 120);
  if (!title) throw new Error("INVALID_TITLE");
  const workId = cleanText(payload.workId ?? payload.storyId, existing?.workId || "", 120);
  const duration = payload.duration !== undefined
    ? Math.max(0, Math.round(Number(payload.duration) || 0))
    : existing?.duration || 0;
  const order = payload.order !== undefined
    ? Math.max(0, Math.round(Number(payload.order) || 0))
    : existing?.order || 0;
  return {
    title,
    description: cleanText(payload.description, existing?.description || "", 600),
    workId,
    duration,
    order,
    isActive: payload.isActive !== undefined ? !!payload.isActive : existing?.isActive ?? true,
  };
}

function rowToAudioStory(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title || "Audio hikoya",
    description: row.description || "",
    audioUrl: row.audio_url || "",
    workId: row.work_id || row.story_id || "",
    storyId: row.story_id || row.work_id || "",
    duration: Number(row.duration || 0),
    order: Number(row.sort_order || row.order || 0),
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function audioStoryToRow(story, extra = {}) {
  return {
    id: story.id,
    title: story.title,
    description: story.description || "",
    audio_url: story.audioUrl || "",
    work_id: story.workId || "",
    story_id: story.storyId || story.workId || "",
    duration: story.duration || 0,
    sort_order: story.order || 0,
    is_active: story.isActive !== false,
    data: extra.data || {},
    updated_at: new Date().toISOString(),
  };
}

async function fetchAudioStoryRow(id) {
  const { data, error } = await getSupabaseAdmin()
    .from("audio_stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    const err = new Error(`Supabase audio_stories jadvalidan o'qib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
  return data || null;
}

async function insertAudioStoryRow(row) {
  const { error } = await getSupabaseAdmin().from("audio_stories").insert(row);
  if (error) {
    const err = new Error(`Supabase audio_stories jadvaliga yozib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
}

async function updateAudioStoryRow(id, row) {
  const { error } = await getSupabaseAdmin().from("audio_stories").update(row).eq("id", id);
  if (error) {
    const err = new Error(`Supabase audio_stories jadvalini yangilab bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
}

export async function listAudioStories({ includeInactive = false } = {}) {
  let query = getSupabaseAdmin()
    .from("audio_stories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) {
    const err = new Error(`Supabase audio_stories jadvalidan o'qib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
  return (data || []).map(rowToAudioStory);
}

export async function findAudioStory(id, { includeInactive = false } = {}) {
  const story = rowToAudioStory(await fetchAudioStoryRow(id));
  if (!story) return null;
  if (!includeInactive && !story.isActive) return null;
  return story;
}

export async function createAudioStory(payload = {}) {
  const id = cleanText(payload.id, "", 120) || slugId(payload.title);
  if (await fetchAudioStoryRow(id)) throw new Error("AUDIO_STORY_EXISTS");
  if (!String(payload.audioBase64 || "").startsWith("data:audio/")) throw new Error("AUDIO_REQUIRED");

  const base = normalizePayload(payload);
  const uploaded = await saveStorageAudio("audio-stories", `${id}_${Date.now()}`, payload.audioBase64, {
    maxBytes: MAX_AUDIO_BYTES,
  });
  const story = {
    id,
    ...base,
    audioUrl: uploaded.url,
    storyId: base.workId,
  };

  try {
    await insertAudioStoryRow({
      ...audioStoryToRow(story, { data: { sizeBytes: uploaded.sizeBytes, ext: uploaded.ext } }),
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    await deleteStorageMediaByUrl(uploaded.url);
    throw e;
  }

  return story;
}

export async function updateAudioStory(id, payload = {}) {
  const existing = await findAudioStory(id, { includeInactive: true });
  if (!existing) throw new Error("NOT_FOUND");

  const base = normalizePayload(payload, existing);
  let nextAudioUrl = existing.audioUrl;
  let uploaded = null;
  if (payload.audioBase64) {
    uploaded = await saveStorageAudio("audio-stories", `${id}_${Date.now()}`, payload.audioBase64, {
      maxBytes: MAX_AUDIO_BYTES,
    });
    nextAudioUrl = uploaded.url;
  }

  const story = {
    ...existing,
    ...base,
    audioUrl: nextAudioUrl,
    storyId: base.workId,
  };

  try {
    await updateAudioStoryRow(id, audioStoryToRow(story, {
      data: uploaded ? { sizeBytes: uploaded.sizeBytes, ext: uploaded.ext } : {},
    }));
  } catch (e) {
    if (uploaded?.url) await deleteStorageMediaByUrl(uploaded.url);
    throw e;
  }

  if (uploaded?.url && existing.audioUrl && existing.audioUrl !== uploaded.url) {
    await deleteStorageMediaByUrl(existing.audioUrl);
  }
  return story;
}

export async function deleteAudioStory(id) {
  const story = await findAudioStory(id, { includeInactive: true });
  if (!story) return null;
  const { error } = await getSupabaseAdmin().from("audio_stories").delete().eq("id", id);
  if (error) {
    const err = new Error(`Supabase audio_stories jadvalidan o'chirib bo'lmadi: ${error.message}`);
    err.code = "SUPABASE_QUERY_ERROR";
    throw err;
  }
  if (story.audioUrl) await deleteStorageMediaByUrl(story.audioUrl);
  return story;
}
