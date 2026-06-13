import path from "path";
import { fileURLToPath } from "url";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "work-views.json");
function normalizeWorkViewsDb(raw) {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    counts: data.counts && typeof data.counts === "object" && !Array.isArray(data.counts) ? data.counts : {},
  };
}

registerJsonStore("work-views", DATA_FILE, { counts: {} }, normalizeWorkViewsDb);

function readDb() {
  const raw = normalizeWorkViewsDb(readJsonStore("work-views"));
  return raw.counts && typeof raw.counts === "object" ? raw.counts : {};
}

function writeDb(counts) {
  writeJsonStore("work-views", normalizeWorkViewsDb({ counts }));
}

export function getAllViewCounts() {
  return readDb();
}

export function incrementWorkView(workId) {
  const id = String(workId || "").trim();
  if (!id || !/^[a-zA-Z0-9_'-]+$/.test(id)) throw new Error("INVALID_ID");
  const counts = readDb();
  counts[id] = (counts[id] || 0) + 1;
  writeDb(counts);
  return counts[id];
}
