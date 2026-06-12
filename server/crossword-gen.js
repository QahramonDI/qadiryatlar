/** Savol/javob matnini krossvord yozuvlariga aylantirish (server + admin) */

export function normalizeCwCell(raw) {
  const t = String(raw || "").trim().toUpperCase();
  if (/^G[''`ʻʼ]?$/i.test(t)) return "G'";
  if (/^O[''`ʻʼ]?$/i.test(t)) return "O'";
  if (t === "CH") return "CH";
  if (t === "SH") return "SH";
  if (t === "NG") return "NG";
  return t.replace(/[^A-Z0-9]/g, "").slice(0, 1);
}

export function splitUzCwLetters(raw) {
  const s = String(raw || "").trim();
  if (!s) return [];
  if (/[\s|·]/.test(s)) {
    return s.split(/[\s|·]+/).map((p) => normalizeCwCell(p)).filter(Boolean);
  }
  let i = 0;
  const upper = s.toUpperCase();
  const letters = [];
  while (i < upper.length) {
    const rest = upper.slice(i);
    if (rest.startsWith("NG")) { letters.push("NG"); i += 2; continue; }
    if (/^G[''`ʻʼ]/.test(rest)) { letters.push("G'"); i += 2; continue; }
    if (/^O[''`ʻʼ]/.test(rest)) { letters.push("O'"); i += 2; continue; }
    if (rest.startsWith("SH")) { letters.push("SH"); i += 2; continue; }
    if (rest.startsWith("CH")) { letters.push("CH"); i += 2; continue; }
    if (/[A-Z0-9]/.test(rest[0])) { letters.push(rest[0]); i += 1; continue; }
    i += 1;
  }
  return letters;
}

export function normalizeCwWord(raw) {
  return splitUzCwLetters(raw).join("");
}

export function parseCrosswordLines(text) {
  const entries = [];
  const seen = new Set();
  String(text || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      let clue = "";
      let word = "";
      if (trimmed.includes("|")) {
        const parts = trimmed.split("|").map((s) => s.trim());
        if (parts.length >= 2) {
          const left = parts[0];
          const right = parts.slice(1).join("|").trim();
          const leftLetters = splitUzCwLetters(left);
          const rightLetters = splitUzCwLetters(right);
          const rightLooksLikeAnswer = rightLetters.length >= 2 && rightLetters.length <= 24 && !left.includes(" ");
          const leftLooksLikeAnswer = leftLetters.length >= 2 && leftLetters.length <= 24 && !right.includes(" ");
          if (rightLooksLikeAnswer && (!leftLooksLikeAnswer || left.includes(" "))) {
            clue = left;
            word = right;
          } else if (leftLooksLikeAnswer && !rightLooksLikeAnswer) {
            word = left;
            clue = right;
          } else {
            clue = left;
            word = right;
          }
        }
      } else if (trimmed.includes(" - ")) {
        const parts = trimmed.split(" - ").map((s) => s.trim());
        clue = parts[0];
        word = parts.slice(1).join(" - ");
      } else if (/[:：]/.test(trimmed)) {
        const idx = trimmed.search(/[:：]/);
        clue = trimmed.slice(0, idx).trim();
        word = trimmed.slice(idx + 1).trim();
      } else {
        const tokens = trimmed.split(/\s+/);
        word = tokens.pop() || "";
        clue = tokens.join(" ");
      }
      const letters = splitUzCwLetters(word);
      word = letters.join("");
      const wordKey = letters.join("\u00B7");
      clue = String(clue || "").trim().slice(0, 120);
      if (letters.length < 2 || !clue || seen.has(wordKey)) return;
      seen.add(wordKey);
      entries.push({ word, clue });
    });
  return entries;
}

const VALUE_LABELS = {
  halollik: "HALOLLIK",
  mehnatsevarlik: "MEHNAT",
  vatanparvarlik: "VATAN",
  mehribonlik: "MEHR",
  saxovat: "SAXOVAT",
  "ota-onaga-hurmat": "HURMAT",
  dustlik: "DOSTLIK",
  masuliyat: "MASULIYAT",
  adolat: "ADOLAT",
};

export function generateCrosswordEntriesFromWork(work) {
  const entries = [];
  const title = String(work?.title || "").trim();
  const valueMain = String(work?.valueMain || "");
  const valueLabel = (VALUE_LABELS[valueMain] || valueMain).toUpperCase().replace(/[^A-Z\u0400-\u04FF']/g, "");

  const addWord = (word, clue) => {
    const w = normalizeCwWord(word);
    if (w.length < 3 || entries.some((e) => e.word === w)) return;
    entries.push({ word: w, clue: String(clue).slice(0, 120) });
  };

  addWord(title.replace(/\s+/g, ""), `"${title}" asari nomi`);
  (work?.keywords || []).slice(0, 3).forEach((kw) => addWord(kw, `"${title}" kalit so'zi`));
  if (valueLabel.length >= 3) addWord(valueLabel, "Asar qadriyati");
  addWord(String(work?.author || "").split(/\s+/).pop(), `"${title}" muallifi familiyasi`);
  addWord(`${work?.grade || 3}SINF`, "Darslik sinfi");
  return entries.slice(0, 8);
}
