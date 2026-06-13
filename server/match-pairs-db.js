import path from "path";
import { fileURLToPath } from "url";
import { readJsonStore, registerJsonStore, writeJsonStore } from "./json-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "match-pairs.json");
function normalizeMatchPairsDb(raw) {
  const data = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  return {
    pairs: Array.isArray(data.pairs) ? data.pairs : [],
    pickCount: Math.min(10, Math.max(3, +data.pickCount || 5)),
  };
}

registerJsonStore("match-pairs", DATA_FILE, { pairs: [], pickCount: 5 }, normalizeMatchPairsDb);

function readDb() {
  try {
    return normalizeMatchPairsDb(readJsonStore("match-pairs"));
  } catch {
    return { pairs: [], pickCount: 5 };
  }
}

function writeDb(data) {
  writeJsonStore("match-pairs", normalizeMatchPairsDb({
    pairs: (data.pairs || []).map((p) => ({
      workId: String(p.workId || "").trim(),
      valueId: String(p.valueId || "").trim(),
    })).filter((p) => p.workId && p.valueId),
    pickCount: Math.min(10, Math.max(3, +data.pickCount || 5)),
  }));
}

export function getMatchConfigPublic() {
  return readDb();
}

export function saveMatchConfig(payload) {
  writeDb(payload || {});
  return readDb();
}
