import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "work-views.json");

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ counts: {} }, null, 2));
  }
}

function readDb() {
  ensureFile();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return raw.counts && typeof raw.counts === "object" ? raw.counts : {};
  } catch {
    return {};
  }
}

function writeDb(counts) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify({ counts }, null, 2));
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
