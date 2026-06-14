/* Krossvord: savol/javoblardan yaratish va grid joylashtirish */
"use strict";

const CW_PALETTE = [
  { bg: "#fff4e6", border: "#ff9f43", focus: "#ffe8cc", num: "#c56a00" },
  { bg: "#e8f7ff", border: "#48cae4", focus: "#ccefff", num: "#0077a8" },
  { bg: "#f3ecff", border: "#b185db", focus: "#e8dcff", num: "#6b3fa0" },
  { bg: "#e8fbf0", border: "#52b788", focus: "#ccf5dd", num: "#2d6a4f" },
  { bg: "#fff0f5", border: "#f284a5", focus: "#ffd6e4", num: "#b4235a" },
  { bg: "#fff9db", border: "#ffd43b", focus: "#fff3bf", num: "#a67c00" },
];

function normalizeCwWord(raw) {
  return splitUzCwLetters(raw).join("");
}

/** O'zbek lotin alifbosi: CH, SH, NG, G', O' — bitta harf */
function normalizeCwCell(raw) {
  const t = String(raw || "").trim().toUpperCase();
  if (/^G[''`ʻʼ]?$/i.test(t)) return "G'";
  if (/^O[''`ʻʼ]?$/i.test(t)) return "O'";
  if (t === "CH") return "CH";
  if (t === "SH") return "SH";
  if (t === "NG") return "NG";
  return t.replace(/[^A-Z0-9]/g, "").slice(0, 1);
}

function splitUzCwLetters(raw) {
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

function normalizeCwInput(raw, expected) {
  const exp = String(expected || "").toUpperCase();
  let s = String(raw || "").trim().toUpperCase();
  s = s.replace(/G[''`ʻʼ]/g, "G'").replace(/O[''`ʻʼ]/g, "O'");
  if (exp === "G'" || exp === "O'") {
    if (s === exp[0]) return s;
    if (s.startsWith(exp)) return exp;
    return s.slice(0, exp.length);
  }
  return s.replace(/[^A-Z0-9]/g, "").slice(0, exp.length);
}

function cwAnswersMatch(inputRaw, expected) {
  const exp = String(expected || "").toUpperCase();
  return normalizeCwInput(inputRaw, exp) === exp;
}

function prepareCwEntry(raw) {
  const letters = splitUzCwLetters(raw.word);
  return {
    word: letters.join(""),
    letters,
    clue: String(raw.clue || "").trim(),
  };
}

function parseCrosswordLines(text) {
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

function generateCrosswordEntriesFromWork(work) {
  const entries = [];
  const title = String(work?.title || "").trim();
  const valueMain = String(work?.valueMain || "");
  let valueLabel = "";
  if (typeof getValueById === "function") {
    valueLabel = getValueById(valueMain).name || valueMain;
  } else {
    valueLabel = valueMain;
  }
  valueLabel = valueLabel.toUpperCase().replace(/[^A-Z\u0400-\u04FF']/g, "");

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

function buildCrosswordLayout(rawEntries, maxWords = 8) {
  const words = (rawEntries || [])
    .map((c) => prepareCwEntry(c))
    .filter((c) => c.letters.length > 1 && c.clue)
    .sort((a, b) => b.letters.length - a.letters.length)
    .slice(0, maxWords);

  const grid = {};
  const placed = [];
  const cellMeta = {};

  function markCell(r, c, letter, wordIdx, dir) {
    const key = `${r},${c}`;
    grid[key] = letter;
    if (!cellMeta[key]) cellMeta[key] = { dirs: new Set(), colors: new Set() };
    cellMeta[key].dirs.add(dir);
    cellMeta[key].colors.add(wordIdx);
  }

  function canPlace(w, r, c, dir) {
    for (let k = 0; k < w.letters.length; k++) {
      const rr = dir === "h" ? r : r + k;
      const cc = dir === "h" ? c + k : c;
      const key = `${rr},${cc}`;
      if (grid[key] && grid[key] !== w.letters[k]) return false;
    }
    return true;
  }

  function placeWord(w) {
    const colorIdx = placed.length % CW_PALETTE.length;
    if (placed.length === 0) {
      for (let i = 0; i < w.letters.length; i++) markCell(0, i, w.letters[i], 0, "h");
      placed.push({ ...w, r: 0, c: 0, dir: "h", colorIdx });
      return true;
    }
    for (const p of placed) {
      for (let pi = 0; pi < p.letters.length; pi++) {
        for (let wi = 0; wi < w.letters.length; wi++) {
          if (p.letters[pi] !== w.letters[wi]) continue;
          let r;
          let c;
          let dir;
          if (p.dir === "h") {
            dir = "v";
            r = p.r - wi;
            c = p.c + pi;
          } else {
            dir = "h";
            r = p.r + pi;
            c = p.c - wi;
          }
          if (!canPlace(w, r, c, dir)) continue;
          if (r < -5 || c < -5) continue;
          const wordIdx = placed.length;
          for (let k = 0; k < w.letters.length; k++) {
            const rr = dir === "h" ? r : r + k;
            const cc = dir === "h" ? c + k : c;
            markCell(rr, cc, w.letters[k], wordIdx, dir);
          }
          placed.push({ ...w, r, c, dir, colorIdx });
          return true;
        }
      }
    }
    return false;
  }

  const pending = [...words];
  let madeProgress = true;
  while (madeProgress && pending.length) {
    madeProgress = false;
    const retry = [];
    for (const w of pending) {
      if (placeWord(w)) madeProgress = true;
      else retry.push(w);
    }
    pending.length = 0;
    pending.push(...retry);
  }

  function forcePlaceWord(w) {
    const rows = Object.keys(grid).map((k) => +k.split(",")[0]);
    const r = rows.length ? Math.max(...rows) + 2 : 0;
    const c = 0;
    const wordIdx = placed.length;
    const colorIdx = wordIdx % CW_PALETTE.length;
    for (let i = 0; i < w.letters.length; i++) markCell(r, c + i, w.letters[i], wordIdx, "h");
    placed.push({ ...w, r, c, dir: "h", colorIdx });
  }

  while (pending.length) forcePlaceWord(pending.shift());
  const unplaced = [];

  placed.forEach((p, i) => {
    p.num = i + 1;
  });

  if (!Object.keys(grid).length) {
    return { rows: 0, cols: 0, cellMap: {}, numMap: {}, placed: [], cellMeta: {}, words, unplaced };
  }

  const rs = Object.keys(grid).map((k) => +k.split(",")[0]);
  const cs = Object.keys(grid).map((k) => +k.split(",")[1]);
  const minR = Math.min(...rs);
  const minC = Math.min(...cs);
  const maxR = Math.max(...rs);
  const maxC = Math.max(...cs);
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const cellMap = {};
  const metaOut = {};
  Object.keys(grid).forEach((k) => {
    const [r, c] = k.split(",").map(Number);
    const nk = `${r - minR},${c - minC}`;
    cellMap[nk] = grid[k];
    if (cellMeta[k]) {
      metaOut[nk] = {
        dirs: [...cellMeta[k].dirs],
        colorIdx: Math.min(...cellMeta[k].colors) % CW_PALETTE.length,
      };
    }
  });

  const numMap = {};
  placed.forEach((p) => {
    numMap[`${p.r - minR},${p.c - minC}`] = p.num;
  });

  const placedNorm = placed.map((p) => ({
    ...p,
    r: p.r - minR,
    c: p.c - minC,
  }));

  return { rows, cols, cellMap, numMap, placed: placedNorm, cellMeta: metaOut, words, unplaced };
}

function getCwCellPrimaryDir(meta) {
  if (!meta?.dirs?.length) return "h";
  if (meta.dirs.includes("h")) return "h";
  return meta.dirs[0];
}

function getCwNeighbor(key, dir, cellMap, delta = 1) {
  const [r, c] = key.split(",").map(Number);
  const nr = dir === "h" ? r : r + delta;
  const nc = dir === "h" ? c + delta : c;
  const nk = `${nr},${nc}`;
  return cellMap[nk] ? nk : null;
}

function renderCrosswordGridHtml(layout, { interactive = true, cellSize = 46, preview = false } = {}) {
  const { rows, cols, cellMap, numMap, cellMeta } = layout;
  if (!rows || !cols) {
    return `<p class="muted">Krossvord yaratish uchun kamida 2 ta so'z va kesishish kerak.</p>`;
  }
  let html = `<div class="cw-grid cw-grid--play" style="--cw-cell:${cellSize}px;grid-template-columns:repeat(${cols},var(--cw-cell))">`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (cellMap[key]) {
        const meta = cellMeta[key] || { dirs: ["h"], colorIdx: 0 };
        const pal = CW_PALETTE[meta.colorIdx % CW_PALETTE.length];
        const primaryDir = getCwCellPrimaryDir(meta);
        const dirs = meta.dirs.join(",");
        html += `<div class="cw-cell cw-cell--color" style="--cw-bg:${pal.bg};--cw-border:${pal.border};--cw-focus:${pal.focus};--cw-num-color:${pal.num}">`;
        if (numMap[key]) html += `<span class="cw-num">${numMap[key]}</span>`;
        if (interactive) {
          const ans = cellMap[key];
          const wide = ans.length > 1 ? " cw-input--wide" : "";
          html += `<input maxlength="${ans.length}" autocomplete="off" spellcheck="false" class="${wide.trim()}" data-ans="${cwEsc(ans)}" data-key="${key}" data-dirs="${dirs}" data-primary-dir="${primaryDir}" aria-label="Katak ${r + 1}-${c + 1}" />`;
        } else if (preview) {
          html += `<span class="cw-letter-preview cw-letter-preview--empty" aria-hidden="true"></span>`;
        } else {
          html += `<span class="cw-letter-preview">${cellMap[key]}</span>`;
        }
        html += `</div>`;
      } else {
        html += `<div class="cw-cell block"></div>`;
      }
    }
  }
  html += `</div>`;
  return html;
}

function cwEsc(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function getCwWordCellKeys(wordEntry) {
  const len = wordEntry.letters?.length || wordEntry.word?.length || 0;
  const keys = [];
  for (let i = 0; i < len; i++) {
    const r = wordEntry.dir === "h" ? wordEntry.r : wordEntry.r + i;
    const c = wordEntry.dir === "h" ? wordEntry.c + i : wordEntry.c;
    keys.push(`${r},${c}`);
  }
  return keys;
}

function renderCrosswordCluesHtml(placed, { playMode = false } = {}) {
  if (!placed?.length) return "";
  const sorted = [...placed].sort((a, b) => a.num - b.num);
  return `<div class="cw-clues${playMode ? " cw-clues--play" : ""}"><h4>Savollar:</h4><ul class="cw-clues-list">${sorted
    .map((p) => `<li data-cw-num="${p.num}"><b>${p.num}.</b> ${cwEsc(p.clue)} <small class="muted">(${(p.letters || splitUzCwLetters(p.word)).length} harf)</small></li>`)
    .join("")}</ul></div>`;
}

if (typeof window !== "undefined") {
  Object.assign(window, {
    CW_PALETTE,
    normalizeCwWord,
    splitUzCwLetters,
    normalizeCwInput,
    cwAnswersMatch,
    prepareCwEntry,
    parseCrosswordLines,
    generateCrosswordEntriesFromWork,
    buildCrosswordLayout,
    getCwCellPrimaryDir,
    getCwNeighbor,
    getCwWordCellKeys,
    renderCrosswordGridHtml,
    renderCrosswordCluesHtml,
  });
}
