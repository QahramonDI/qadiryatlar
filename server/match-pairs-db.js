import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "match-pairs.json");

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ pairs: [], pickCount: 5 }, null, 2)
    );
  }
}

function readDb() {
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {
      pairs: Array.isArray(raw.pairs) ? raw.pairs : [],
      pickCount: Math.min(10, Math.max(3, +raw.pickCount || 5)),
    };
  } catch {
    return { pairs: [], pickCount: 5 };
  }
}

function writeDb(data) {
  ensureFile();
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        pairs: (data.pairs || []).map((p) => ({
          workId: String(p.workId || "").trim(),
          valueId: String(p.valueId || "").trim(),
        })).filter((p) => p.workId && p.valueId),
        pickCount: Math.min(10, Math.max(3, +data.pickCount || 5)),
      },
      null,
      2
    )
  );
}

export function getMatchConfigPublic() {
  return readDb();
}

export function saveMatchConfig(payload) {
  writeDb(payload || {});
  return readDb();
}
