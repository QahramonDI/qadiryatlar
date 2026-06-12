/* =====================================================================
   app.js — "Qadriyatlar Kaledaskopi" asosiy mantiq
   Bo'limlar:
     1. Holat (Store) va localStorage
     2. Yordamchilar (toast, DOM)
     3. Gamifikatsiya (XP, daraja, yulduz, kunlik maqsad, badge)
     4. Marshrutlash (router / switchPage)
     5. Profil
     6. Bosh sahifa (mashhur asarlar, qadriyatlar daraxti, kunlik maqsad)
     7. Kutubxona (asarlar, filtrlar, modal)
    8. O'yinlar (krossvord, puzzle, asar topish, muallifni top, to'g'ri/noto'g'ri, juftlash, xarita)
     9. Testlar + sertifikat
    10. Yutuqlar / reyting
    11. Ota-onalar paneli + grafiklar
    12. Audio hikoyalar (nutq sintezi)
    13. Bilimdon Bobo chatbot
    14. Ishga tushirish
   ===================================================================== */

"use strict";

const BASE_TEXTBOOK_WORKS =
  typeof TEXTBOOK_WORKS !== "undefined" ? JSON.parse(JSON.stringify(TEXTBOOK_WORKS)) : [];
const BASE_VALUES_SNAPSHOT = JSON.parse(JSON.stringify(window.BASE_VALUES || VALUES || []));
let adminWorkCatalog = { works: [], overrides: {}, hiddenIds: [] };

/* ====================== 1. HOLAT & localStorage ====================== */
const PROGRESS_PREFIX = "qk_progress_v1_";   // har bir foydalanuvchi: prefix + username
const USERS_KEY = "qk_users_v1";             // {username: {pass, name, grade, avatar}}
const CURRENT_KEY = "qk_current_user_v1";    // joriy kirgan foydalanuvchi nomi

/* Joriy foydalanuvchi uchun progress kaliti */
function progressKey() {
  const u = Auth.current() || "_guest";
  return PROGRESS_PREFIX + u;
}

const DEFAULT_STATE = {
  name: "Asadbek",
  grade: 3,
  avatar: "🧒",
  avatarImg: null,           // profil rasmi (base64 dataURL) yoki null
  xp: 0,
  stars: 0,
  streak: 1,
  lastActive: null,          // ISO sana (kun)
  dailyDate: null,           // bugungi maqsad sanasi
  dailyDone: 0,              // bugun bajarilgan topshiriqlar
  dailyGoal: 5,
  readWorks: [],             // o'qilgan asar id'lari
  completedTests: {},        // {workId: bestPercent}
  certificates: [],          // [{work, percent, date}]
  badges: [],                // ochilgan badge id'lari
  openedValues: [],          // qadriyatlar daraxtida ochilganlar
  visitedRegions: [],        // bilim xaritasida tashrif buyurilgan viloyatlar
  playedGames: [],           // o'ynalgan o'yin id'lari
  activity: {},              // {ISOsana: xp} haftalik grafik uchun
  pendingWarning: null,      // admin ogohlantirishi { message, at, removeAvatar }
  avatarUploadBlocked: false,
};

const Store = {
  data: {},
  load() {
    try {
      const raw = localStorage.getItem(progressKey());
      this.data = raw ? Object.assign({}, DEFAULT_STATE, JSON.parse(raw)) : Object.assign({}, DEFAULT_STATE);
    } catch (e) {
      this.data = Object.assign({}, DEFAULT_STATE);
    }
    // Akkaunt ma'lumotlarini (ism, sinf, avatar) progressga sinxronlash
    const acc = Auth.account();
    if (acc) {
      this.data.name = acc.name || this.data.name;
      this.data.grade = acc.grade || this.data.grade;
      this.data.avatar = acc.avatar || this.data.avatar;
      this.data.avatarImg = acc.avatarImg || null;
    }
    this.checkDay();
  },
  save() {
    localStorage.setItem(progressKey(), JSON.stringify(this.data));
    if (typeof scheduleProgressSync === "function") scheduleProgressSync();
  },
  /* Kun almashinuvini tekshirish: streak va kunlik maqsad */
  checkDay() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.dailyDate !== today) {
      // Streak hisoblash
      if (this.data.lastActive) {
        const diff = (new Date(today) - new Date(this.data.lastActive)) / 86400000;
        if (diff === 1) this.data.streak = (this.data.streak || 0) + 1;
        else if (diff > 1) this.data.streak = 1;
      }
      this.data.dailyDate = today;
      this.data.dailyDone = 0;
      this.data.lastActive = today;
      this.save();
    }
  },
};

/* ====================== 1b. AUTH (login / parol) ======================
   Server mavjud bo'lsa SQLite bazasi, aks holda localStorage fallback. */
const Auth = {
  users() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch (e) { return {}; }
  },
  saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); },
  current() { return localStorage.getItem(CURRENT_KEY) || null; },
  account() {
    const u = this.current();
    return u ? this.users()[u] || null : null;
  },
  /* Parolni oddiy obfuskatsiya (xavfsizlik emas, faqat ochiq matnni yashirish) */
  hash(pass) { try { return btoa(unescape(encodeURIComponent("qk:" + pass))); } catch (e) { return "qk:" + pass; } },
  register({ user, pass, name, grade, avatar, avatarImg }) {
    user = (user || "").trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(user)) return { ok: false, msg: "Login 3–20 ta lotin harf/raqamdan iborat bo'lsin." };
    if ((pass || "").length < 4) return { ok: false, msg: "Parol kamida 4 ta belgidan iborat bo'lsin." };
    const users = this.users();
    if (users[user]) return { ok: false, msg: "Bu login band. Boshqasini tanlang." };
    users[user] = { pass: this.hash(pass), name: (name || "O'quvchi").trim(), grade: +grade || 3, avatar: avatar || "🧒", avatarImg: avatarImg || null };
    this.saveUsers(users);
    localStorage.setItem(CURRENT_KEY, user);
    return { ok: true };
  },
  login({ user, pass }) {
    user = (user || "").trim().toLowerCase();
    const users = this.users();
    if (!users[user]) return { ok: false, msg: "Bunday foydalanuvchi topilmadi." };
    if (users[user].pass !== this.hash(pass)) return { ok: false, msg: "Parol noto'g'ri." };
    localStorage.setItem(CURRENT_KEY, user);
    return { ok: true };
  },
  async loginAsync({ user, pass }) {
    user = (user || "").trim().toLowerCase();
    if (Api.online) {
      try {
        const res = await Api.login({ username: user, password: pass });
        if (!res.ok) return res;
        localStorage.setItem(CURRENT_KEY, res.user.username);
        return { ok: true, serverUser: res.user };
      } catch {
        return { ok: false, msg: "Server bilan aloqa yo'q. Keyinroq urinib ko'ring." };
      }
    }
    return this.login({ user, pass });
  },
  async registerAsync(payload) {
    const user = (payload.user || "").trim().toLowerCase();
    if (Api.online) {
      try {
        const res = await Api.register({
          username: user,
          password: payload.pass,
          name: payload.name,
          grade: payload.grade,
          avatar: payload.avatar,
          avatarImg: payload.avatarImg,
        });
        if (!res.ok) return res;
        localStorage.setItem(CURRENT_KEY, res.user.username);
        return { ok: true, serverUser: res.user };
      } catch {
        return { ok: false, msg: "Server bilan aloqa yo'q. Keyinroq urinib ko'ring." };
      }
    }
    return this.register(payload);
  },
  logout() {
    localStorage.removeItem(CURRENT_KEY);
    if (typeof Api !== "undefined") Api.clearSession();
  },
  /* Akkaunt profilini yangilash (ism/sinf/avatar) */
  updateAccount(patch) {
    const u = this.current();
    if (!u) return;
    const users = this.users();
    if (users[u]) { Object.assign(users[u], patch); this.saveUsers(users); }
  },
};

/* ====================== 2. YORDAMCHILAR ====================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rand = (n) => Math.floor(Math.random() * n);

function isVerseText(text) {
  if (!text || !text.includes("\n")) return false;
  const blocks = text.trim().split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const lineLen = (block) => block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (blocks.length > 1) {
    return blocks.every((block) => {
      const lines = lineLen(block);
      return lines.length > 0 && lines.every((l) => l.length < 120);
    });
  }
  const lines = lineLen(text);
  return lines.length >= 2 && lines.every((l) => l.length < 120);
}

function shouldRenderAsPoem(work) {
  if (work.genre === "she'r") return true;
  return isVerseText(work.fullText);
}

function renderPoemHtml(text) {
  const trimmed = text.trim();
  const blocks = trimmed.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
  const stanzas = blocks.length > 1
    ? blocks.map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    : (() => {
        const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
        const groups = [];
        for (let i = 0; i < lines.length; i += 4) groups.push(lines.slice(i, i + 4));
        return groups;
      })();
  return `<div class="work-poem">${stanzas
    .map((stanza) => `<div class="work-poem-stanza"><p>${stanza.map((l) => esc(l)).join("<br>")}</p></div>`)
    .join("")}</div>`;
}

function renderProseHtml(text) {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderWorkFullText(work) {
  if (!work.fullText) return "";
  return shouldRenderAsPoem(work) ? renderPoemHtml(work.fullText) : renderProseHtml(work.fullText);
}

/** Test savollari va javob variantlarini har safar aralashtirish */
function shuffleQuizQuestion(t) {
  const tagged = t.options.map((text, i) => ({ text, correct: i === t.correct }));
  const shuffled = shuffle(tagged);
  return {
    q: t.q,
    options: shuffled.map((o) => o.text),
    correct: shuffled.findIndex((o) => o.correct),
  };
}

function prepareQuiz(tests) {
  return shuffle(tests.map(shuffleQuizQuestion));
}

/** Asar modalidagi qisqa test: 10 tadan tasodifiy 5 ta savol */
function prepareInlineQuiz(tests, count = 5) {
  const pool = [...tests];
  const n = Math.min(count, pool.length);
  return prepareQuiz(shuffle(pool).slice(0, n));
}

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

function workViewsHtml(workId) {
  const n = WorkViews.get(workId);
  return `<span class="work-views"><i class="fa-solid fa-eye"></i> ${n}</span>`;
}

function workRatingPopMeta(workId) {
  const r = WorkRatings.get(workId);
  const avg = r.ratingCount ? r.averageRating.toFixed(1) : "—";
  return `<span class="star"><i class="fa-solid fa-star"></i> ${avg}</span> · ${workViewsHtml(workId)}`;
}

function renderWorkRatingStarsHtml(workId, stats, { interactive = false } = {}) {
  const avg = stats.averageRating || 0;
  const count = stats.ratingCount || 0;
  const highlight = stats.userRating || Math.round(avg);
  const canInteract = interactive && Api.online && !!Api.token;
  const stars = [1, 2, 3, 4, 5].map((n) => {
    const filled = n <= highlight;
    const cls = [
      "ijod-star",
      filled ? "filled" : "",
      canInteract ? "interactive" : "readonly",
    ].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-val="${n}" aria-label="${n} yulduz" ${canInteract ? "" : "tabindex=\"-1\""}>
      <i class="fa-${filled ? "solid" : "regular"} fa-star"></i>
    </button>`;
  }).join("");
  const meta = count
    ? `<span class="ijod-rating-meta"><b>${avg.toFixed(1)}</b> · ${count} ta baho</span>`
    : `<span class="ijod-rating-meta muted">Hali baho yo'q — birinchi bo'lib baholang!</span>`;
  const hint = interactive
    ? (canInteract
      ? `<p class="work-rating-hint muted">Asarni o'qib bo'lgach yulduz bilan baholang</p>`
      : `<p class="work-rating-hint muted"><i class="fa-solid fa-circle-info"></i> Baholash uchun tizimga kiring</p>`)
    : "";
  return `<div class="ijod-rating work-rating" data-work-id="${esc(workId)}">
    <div class="ijod-stars" role="group" aria-label="Asar bahosi">${stars}</div>
    ${meta}${hint ? `<div class="work-rating-hint-wrap">${hint}</div>` : ""}
  </div>`;
}

function refreshWorkRatingEl(el, workId, stats) {
  if (!el || !workId) return;
  el.innerHTML = renderWorkRatingStarsHtml(workId, stats, { interactive: true });
  bindWorkRatingWidget(el, workId);
}

async function submitWorkRating(workId, rating) {
  const session = await Api.ensureStudentSession();
  if (!session.ok) {
    toast(session.msg, "err");
    return null;
  }
  const res = await WorkRatings.rate(workId, rating);
  if (!res.ok) {
    toast(res.msg, "err");
    if (res.msg.includes("Sessiya") || res.msg.includes("Kirish")) Api.clearSession();
    return null;
  }
  return res.stats;
}

function bindWorkRatingWidget(host, workId) {
  const wrap = host?.matches?.(".work-rating") ? host : host?.querySelector?.(".work-rating");
  if (!wrap || wrap.dataset.bound) return;
  wrap.dataset.bound = "1";
  wrap.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest(".ijod-star.interactive");
    if (!btn) return;
    const val = +btn.dataset.val;
    if (!val) return;
    submitWorkRating(workId, val).then((stats) => {
      if (!stats) return;
      refreshWorkRatingEl($("#workReadRating"), workId, stats);
      if (!$("#page-bosh")?.hidden) renderPopularWorks();
      if (!$("#page-kutubxona")?.hidden) renderLibrary();
      toast(`${val} yulduz qo'yildi — rahmat!`, "win");
    });
  });
  wrap.querySelectorAll(".ijod-star.interactive").forEach((star) => {
    star.addEventListener("mouseenter", () => {
      const val = +star.dataset.val;
      wrap.querySelectorAll(".ijod-star").forEach((s) => {
        const n = +s.dataset.val;
        s.classList.toggle("filled", n <= val);
        const icon = s.querySelector("i");
        if (icon) icon.className = n <= val ? "fa-solid fa-star" : "fa-regular fa-star";
      });
    });
    star.addEventListener("mouseleave", () => {
      const stats = WorkRatings.get(workId);
      const highlight = stats.userRating || Math.round(stats.averageRating || 0);
      wrap.querySelectorAll(".ijod-star").forEach((s) => {
        const n = +s.dataset.val;
        s.classList.toggle("filled", n <= highlight);
        const icon = s.querySelector("i");
        if (icon) icon.className = n <= highlight ? "fa-solid fa-star" : "fa-regular fa-star";
      });
    });
  });
}

async function renderWorkReadRating(workId) {
  const host = $("#workReadRating");
  if (!host) return;
  let stats = WorkRatings.get(workId);
  if (Api.online) {
    const fresh = await WorkRatings.fetchWork(workId);
    if (fresh) stats = fresh;
  }
  host.innerHTML = renderWorkRatingStarsHtml(workId, stats, { interactive: true });
  bindWorkRatingWidget(host, workId);
}

function workItemTime(w) {
  const raw = w.createdAt ?? w.created_at;
  if (raw) {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
  }
  const idx = BASE_TEXTBOOK_WORKS.findIndex((b) => b.id === w.id);
  return idx >= 0 ? idx : 0;
}

function adminWorkSortTime(w) {
  for (const key of ["updated_at", "updatedAt", "created_at", "createdAt"]) {
    const t = Date.parse(w[key]);
    if (Number.isFinite(t)) return t;
  }
  const idx = BASE_TEXTBOOK_WORKS.findIndex((b) => b.id === w.id);
  return idx >= 0 ? idx : 0;
}

let adminWorksSortMode = "newest";
const ADMIN_WORKS_SORT_META = {
  newest: { icon: "fa-clock", status: "Eng yangi asarlar birinchi ko'rsatilmoqda" },
  title: { icon: "fa-arrow-down-a-z", status: "Asar nomi bo'yicha (A→Z) tartibda" },
  grade: { icon: "fa-graduation-cap", status: "Sinf bo'yicha tartibda" },
  value: { icon: "fa-seedling", status: "Qadriyat nomi bo'yicha tartibda" },
};

function sortAdminWorksItems(items) {
  const arr = [...items];
  const cmpTitle = (a, b) => (a.title || "").localeCompare(b.title || "", "uz");
  if (adminWorksSortMode === "title") {
    arr.sort(cmpTitle);
  } else if (adminWorksSortMode === "grade") {
    arr.sort((a, b) => a.grade - b.grade || cmpTitle(a, b));
  } else if (adminWorksSortMode === "value") {
    arr.sort((a, b) => {
      const va = getValueById(a.valueMain)?.name || "";
      const vb = getValueById(b.valueMain)?.name || "";
      return va.localeCompare(vb, "uz") || cmpTitle(a, b);
    });
  } else {
    arr.sort((a, b) => adminWorkSortTime(b) - adminWorkSortTime(a));
  }
  return arr;
}

function updateAdminWorksSortUi() {
  const meta = ADMIN_WORKS_SORT_META[adminWorksSortMode] || ADMIN_WORKS_SORT_META.newest;
  ["newest", "title", "grade", "value"].forEach((mode) => {
    const btn = $(`#adminWorksSort${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (!btn) return;
    const active = adminWorksSortMode === mode;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  const status = $("#adminWorksSortStatus");
  const statusText = $("#adminWorksSortStatusText");
  if (status) status.dataset.sort = adminWorksSortMode;
  if (statusText) statusText.textContent = meta.status;
  const iconEl = status?.querySelector("i.fa-solid");
  if (iconEl) iconEl.className = `fa-solid ${meta.icon}`;
}

function setAdminWorksSortMode(mode) {
  if (!ADMIN_WORKS_SORT_META[mode] || adminWorksSortMode === mode) return;
  adminWorksSortMode = mode;
  updateAdminWorksSortUi();
  renderAdminWorksTable();
}

async function recordWorkView(workId) {
  await WorkViews.record(workId);
  if (!$("#page-kutubxona")?.hidden) renderLibrary();
  if (!$("#page-bosh")?.hidden) renderPopularWorks();
}

function toast(msg, type = "") {
  const wrap = $("#toastWrap");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML = msg;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(20px)"; el.style.transition = "0.4s"; }, 2400);
  setTimeout(() => el.remove(), 2900);
}

/* Rasmni markazidan kvadrat qilib kesib, 256px JPEG base64'ga aylantirish
   (localStorage hajmi cheklangani uchun kichraytiriladi) */
function fileToAvatar(file, cb) {
  if (!file || !file.type.startsWith("image/")) { toast("Iltimos, rasm fayl tanlang."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      cb(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => toast("Rasmni o'qib bo'lmadi.");
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function fileToIjodImage(file, cb) {
  if (!file || !file.type.startsWith("image/")) {
    toast("Iltimos, rasm fayl tanlang.", "err");
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => toast("Rasm faylini o'qib bo'lmadi.", "err");
  reader.onload = (e) => {
    const raw = e.target.result;
    const img = new Image();
    img.onload = () => {
      try {
        const max = 900;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          const ratio = Math.min(max / w, max / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        if (typeof raw === "string" && raw.length < 2_800_000) cb(raw);
        else toast("Rasmni qayta ishlashda xatolik. Boshqa rasm tanlang.", "err");
      }
    };
    img.onerror = () => toast("Rasm formati qo'llab-quvvatlanmaydi. JPEG yoki PNG tanlang.", "err");
    img.src = raw;
  };
  reader.readAsDataURL(file);
}

/* Avatar elementiga rasm yoki emoji qo'yish */
function setAvatarEl(el, d) {
  if (!el) return;
  if (d && d.avatarImg) {
    el.textContent = "";
    el.style.backgroundImage = `url("${d.avatarImg}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  } else {
    el.style.backgroundImage = "";
    el.textContent = (d && d.avatar) || "🧒";
  }
}

/* ====================== 3. GAMIFIKATSIYA ====================== */
function addXP(amount, silent = false) {
  const before = getLevel(Store.data.xp).level;
  Store.data.xp += amount;
  const today = new Date().toISOString().slice(0, 10);
  Store.data.activity[today] = (Store.data.activity[today] || 0) + amount;
  Store.data.lastActive = today;
  Store.save();
  const after = getLevel(Store.data.xp).level;
  if (!silent) toast(`<i class="fa-solid fa-bolt"></i> +${amount} XP`, "xp");
  if (after > before) {
    const lv = getLevel(Store.data.xp).info;
    setTimeout(() => toast(`${lv.emoji} Yangi daraja: <b>${lv.name}</b>!`, "win"), 700);
  }
  renderProfile();
}

function addStars(n, silent = false) {
  Store.data.stars += n;
  Store.save();
  if (!silent) toast(`<i class="fa-solid fa-star" style="color:#ffd86b"></i> +${n} yulduz`, "xp");
  renderProfile();
}

function unlockBadge(id) {
  if (Store.data.badges.includes(id)) return;
  const b = getBadgeById(id);
  if (!b) return;
  Store.data.badges.push(id);
  addXP(b.xp, true);
  Store.save();
  toast(`🎁 Yangi mukofot: <b>${b.name}</b> (+${b.xp} XP)`, "win");
  renderProfile();
  if ($("#page-yutuqlar") && !$("#page-yutuqlar").hidden) renderAchievements();
}

/* Badge'larni avtomatik tekshirish */
function checkBadges() {
  const d = Store.data;
  if (d.readWorks.length >= 1) unlockBadge("first-read");
  if (d.readWorks.length >= 5) unlockBadge("reader-5");
  if (d.readWorks.length >= TEXTBOOK_WORKS.length) unlockBadge("reader-all");
  if (Object.values(d.completedTests).some((p) => p >= 100)) unlockBadge("test-ace");
  if (new Set(d.playedGames).size >= GAMES.length) unlockBadge("game-master");
  if (d.openedValues.length >= VALUES.length) unlockBadge("all-values");
}

/* Kunlik maqsad — faqat haqiqiy faollik orqali */
function completeDailyTaskSilent() {
  Store.checkDay();
  if (Store.data.dailyDone >= Store.data.dailyGoal) return;
  Store.data.dailyDone++;
  const reached = Store.data.dailyDone >= Store.data.dailyGoal;
  Store.save();
  if (reached) {
    addXP(40);
    addStars(3, true);
    toast("🏆 Kunlik maqsad bajarildi! +3 bonus yulduz!", "win");
  }
  renderDailyGoal();
}

function goDailyGoalAction() {
  Store.checkDay();
  if (Store.data.dailyDone >= Store.data.dailyGoal) {
    toast("🎉 Bugungi maqsad allaqachon bajarilgan! Ertaga davom eting.");
    return;
  }
  const d = Store.data;
  if (d.readWorks.length < 2) {
    location.hash = "kutubxona";
    toast("Asar o'qing — kunlik maqsadga yaqinlashtiradi!", "win");
  } else if (d.playedGames.length < 2) {
    location.hash = "oyinlar";
    toast("O'yin o'ynang — yana bir qadam!", "win");
  } else {
    location.hash = "testlar";
    toast("Test ishlang — maqsadni yakunlang!", "win");
  }
}

/* ====================== 4. MARSHRUTLASH ====================== */
const PAGES = ["bosh", "kutubxona", "oyinlar", "testlar", "ijod", "yutuqlar", "ota-ona", "oqituvchi", "audio", "asar", "biz-haqimizda"];

function switchPage(name, skipTeacherGuard = false) {
  if (name === "oqituvchi" && !skipTeacherGuard && !TeacherApi.isLoggedIn()) {
    openTeacherGate();
    return;
  }
  if (!PAGES.includes(name)) name = "bosh";
  $$(".page").forEach((p) => {
    resetRevealState(p);
    p.hidden = true;
  });
  const page = $("#page-" + name);
  if (page) page.hidden = false;
  $$(".navlink").forEach((l) => l.classList.toggle("active", l.dataset.nav === name));
  $("#mainnav").classList.remove("open");
  $("#hamburger")?.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Sahifaga kirishda render
  if (name === "bosh") {
    renderDashboard().then(() => scheduleSiteReveal(page));
    return;
  }
  if (name === "kutubxona") {
    updateLibrarySortUi();
    renderLibrary();
  }
  else if (name === "oyinlar") renderGamesHub();
  else if (name === "testlar") renderTestPicker();
  else if (name === "ijod") renderIjod();
  else if (name === "ota-ona") renderParent();
  else if (name === "audio") renderAudio();
  else if (name === "biz-haqimizda") renderAboutStats();

  const afterRender = () => scheduleSiteReveal(page);
  if (name === "yutuqlar") renderAchievements().then(afterRender);
  else if (name === "oqituvchi") renderTeacher().then(afterRender);
  else afterRender();
}

function openWorkFullPage(workId) {
  const w = getWorkById(workId);
  if (!w) {
    toast("Asar topilmadi", "err");
    location.hash = "kutubxona";
    return;
  }
  if (location.hash.replace("#", "") !== `asar/${workId}`) {
    location.hash = `asar/${workId}`;
    return;
  }
  recordWorkView(workId);
  closeModal();
  $$(".page").forEach((p) => (p.hidden = true));
  $("#page-asar").hidden = false;
  $$(".navlink").forEach((l) => l.classList.remove("active"));
  $("#mainnav").classList.remove("open");

  const heroImg = $("#workHeroImg");
  const scene = $("#workReadScene");
  const imgPath = workImgSrc(w);
  heroImg.style.display = "";
  if (scene) scene.style.background = "";
  heroImg.src = imgPath;
  heroImg.alt = w.title + " — illyustratsiya";
  heroImg.onerror = () => {
    heroImg.style.display = "none";
    if (scene) scene.style.background = w.illustration?.gradient || "linear-gradient(135deg,#e6821e,#7b3f00)";
  };
  heroImg.onload = () => {
    heroImg.style.display = "block";
    if (scene) scene.style.background = "";
  };

  $("#workFullTitle").textContent = w.title;
  $("#workFullMeta").textContent = `${w.author} · ${w.grade}-sinf · ${w.genre}`;

  const textEl = $("#workFullText");
  const missEl = $("#workFullMissing");
  const ratingWrap = $("#workReadRating");
  if (w.fullText) {
    textEl.hidden = false;
    missEl.hidden = true;
    textEl.classList.toggle("work-text-poem", shouldRenderAsPoem(w));
    textEl.innerHTML = renderWorkFullText(w);
    if (ratingWrap) ratingWrap.hidden = false;
    renderWorkReadRating(workId);
    if (!Store.data.readWorks.includes(workId)) {
      Store.data.readWorks.push(workId);
      Store.save();
      addXP(30);
      completeDailyTaskSilent();
      checkBadges();
    }
  } else {
    textEl.hidden = true;
    textEl.innerHTML = "";
    textEl.classList.remove("work-text-poem");
    missEl.hidden = false;
    if (ratingWrap) {
      ratingWrap.hidden = true;
      ratingWrap.innerHTML = "";
    }
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  scheduleSiteReveal($("#page-asar"));
}

function handleHash() {
  const hash = (location.hash.replace("#", "") || "bosh").trim();
  if (hash.startsWith("asar/")) {
    openWorkFullPage(hash.slice(5));
    return;
  }
  switchPage(hash);
}

/* ====================== 5. PROFIL ====================== */
function renderProfile() {
  const d = Store.data;
  const lv = getLevel(d.xp);
  // Topbar chip
  $("#chipName").textContent = d.name;
  $("#chipGrade").textContent = d.grade + "-sinf o'quvchisi";
  setAvatarEl($("#chipAvatar"), d);
  // Profil kartasi
  if ($("#pcGreet")) {
    setAvatarEl($("#pcAvatar"), d);
    $("#pcGreet").textContent = `Salom, ${d.name}! 👋`;
    $("#pcGrade").textContent = d.grade + "-sinf o'quvchisi";
    $("#pcLevelName").textContent = `${lv.info.badge} ${lv.info.emoji}`;
    $("#pcXpFill").style.width = lv.progress + "%";
    $("#pcXpText").textContent = `${d.xp} / ${lv.nextBase} XP`;
    $("#pcStars").textContent = d.stars;
    $("#pcStreak").textContent = d.streak;
    $("#pcBadges").textContent = d.badges.length;
  }
}

/* ====================== 6. BOSH SAHIFA ====================== */
function renderDashboard() {
  renderProfile();
  renderPopularGames();
  renderValueTree();
  renderDailyGoal();
  return ensureMapConfigReady().then(() => {
    renderPopularWorks();
    renderHomeMap();
    refreshActiveMapRegionPanel();
  });
}

/** Asar nomiga mos rasm fayllari (assets/works/) */
const WORK_COVER_FILES = {
  "temir-qoziq": "vatan-madhi-dillarda.png",
  "karim-polvon": "karim-polvon.png",
  "chin-va-yolgon": "chin-dost.png",
  "mehnat-bahosi": "mehnat-qurollari-nima-deydi.png",
  "dustlik-kemasi": "dostlik-yolagi.png",
  "saxiy-dehqon": "tabiat-zanjirl.png",
  "zardoz": "orolim.png",
  "halol-savdogar": "abu-rayhon-beruniy.png",
  "ota-nasihati": "bogbon-va-nihol.png",
  "mehribon-qiz": "keksalarni-hurmat-qil.png",
  "ona-qarzi": "ona-qarzi.png",
  "adolatli-qozi": "merosga-kim-munosib.png",
  "yolgonchi-cho'pon": "bir-butun-oy-on-ikki-yulduz.png",
  "navruz-bayrami": "mehr-urgi.png",
  "kitob-dosti": "kitob-kuch.png",
  "mardlik-qissasi": "kitobni-dost-bilganlar.png",
  "vatan-yoshlari": "yurt-madhi.png",
  "marvarid": "yagonadir-vataning-sening.png",
  "boburning-bolaligi": "sohibqiron-bobom-mening.png",
  "oltin-tarvuz": "vatan-jon-fidolikdir.png",
};

function workImgSrc(workOrId) {
  const id = typeof workOrId === "string" ? workOrId : workOrId?.id;
  const w = typeof workOrId === "object" && workOrId ? workOrId : getWorkById(id);
  if (w?.imageUrl) return w.imageUrl;
  const file = WORK_COVER_FILES[id] || `${id}.png`;
  return `assets/works/${file}`;
}

function renderTestItemThumb(w) {
  const v = getValueById(w.valueMain);
  const ring = w.illustration?.gradient || `linear-gradient(135deg, ${v.color}, #ffd76b)`;
  const emoji = w.illustration?.emoji || "📖";
  return `<div class="ti-cover" style="--ti-ring:${ring}">
    <div class="ti-cover-ring">
      <img class="ti-cover-img" src="${workImgSrc(w.id)}" alt="" loading="lazy"
        onerror="this.closest('.ti-cover').classList.add('ti-cover--fallback'); this.remove();">
      <span class="ti-cover-fallback" aria-hidden="true">${emoji}</span>
    </div>
  </div>`;
}

function renderWorkCover(w, kind = "grid", innerHtml = "") {
  const ill = w.illustration || {};
  const grad = ill.gradient || "linear-gradient(135deg,#e6821e,#7b3f00)";
  const emoji = ill.emoji || "📖";
  const cls =
    kind === "modal" ? "modal-hero work-cover" :
    kind === "pop" ? "pop-thumb work-cover" :
    kind === "small" ? "work-thumb work-cover work-cover--sm" :
    "work-thumb work-cover";
  const emojiHtml = kind === "modal" ? "" : `<span class="work-cover-emoji" aria-hidden="true">${emoji}</span>`;
  return `<div class="${cls}" style="background:${grad}">
    ${emojiHtml}
    <img class="work-cover-img" src="${workImgSrc(w.id)}" alt="" loading="lazy" draggable="false" onerror="this.remove()">
    ${innerHtml}
  </div>`;
}

function workThumb(work, big = false) {
  return renderWorkCover(work, big ? "modal" : "pop");
}

/* --- 6.1 BOSH SAHIFA: QADRIYATLAR XARITASI --- */
let homeMapSelectedId = null;

const MAP_BG_SRC = "assets/uz-map-kids.svg";
const MAP_ICON_BASE = "assets/map-icons";
const MAP_INFO_MAX_BYTES = 6 * 1024 * 1024;
const MAP_INFO_ACCEPT = ["image/jpeg", "image/png", "image/webp"];

function getMapBackgroundSrc() {
  return MapConfig.config?.backgroundUrl || MAP_BG_SRC;
}

function applyMapBackgroundImg(img) {
  if (!img) return;
  img.src = getMapBackgroundSrc();
}

function refreshActiveMapRegionPanel() {
  if (homeMapSelectedId) selectHomeRegion(homeMapSelectedId, { silent: true });
}

function refreshHomeMapBackground() {
  applyMapBackgroundImg($("#uzMapHost .uz-map-bg"));
  applyMapBackgroundImg($("#adminMapEditorStage .uz-map-bg"));
}

async function ensureMapConfigReady() {
  await MapConfig.load();
  rebuildMapRegionsList();
  refreshHomeMapBackground();
}

/** Server + platform-data birlashtirilgan viloyatlar */
let MAP_REGIONS = REGIONS.map((r) => ({ ...r }));

function mergeMapRegionBase(base, override = {}) {
  return {
    ...base,
    mapX: typeof override.mapX === "number" ? override.mapX : base.mapX,
    mapY: typeof override.mapY === "number" ? override.mapY : base.mapY,
    workId: override.workId || base.workId,
    value: override.value || base.value,
    story: override.story != null && override.story !== "" ? override.story : base.story,
    tale: override.tale != null && override.tale !== "" ? override.tale : base.tale,
    tradition: override.tradition != null && override.tradition !== "" ? override.tradition : base.tradition,
    fact: override.fact != null && override.fact !== "" ? override.fact : base.fact,
    infographicUrl: override.infographicUrl || null,
  };
}

function rebuildMapRegionsList() {
  const ovs = MapConfig.config?.regions || {};
  MAP_REGIONS = REGIONS.map((base) => mergeMapRegionBase(base, ovs[base.id] || {}));
}

function getMapRegionById(id) {
  const norm = normalizeRegionId(id);
  return MAP_REGIONS.find((r) => r.id === norm) || getRegionById(norm);
}

function regionMapIconSrc(id) {
  return `${MAP_ICON_BASE}/${id}.png`;
}

function regionMapIconFallback(id) {
  return `${MAP_ICON_BASE}/${id}.svg`;
}

function regionInfographicSrc(id) {
  const r = getMapRegionById(id);
  if (!r?.infographicUrl) return null;
  const url = r.infographicUrl;
  const v = MapConfig._cacheBust;
  if (!v) return url;
  return `${url}${url.includes("?") ? "&" : "?"}v=${v}`;
}

function validateMapInfographicFile(file) {
  if (!file) return { ok: false, msg: "Rasm tanlanmadi" };
  const type = (file.type || "").toLowerCase();
  const okType = MAP_INFO_ACCEPT.includes(type) || /\.(jpe?g|png|webp)$/i.test(file.name || "");
  if (!okType) return { ok: false, msg: "Faqat JPG, PNG yoki WEBP formatlari qabul qilinadi" };
  if (file.size > MAP_INFO_MAX_BYTES) {
    return { ok: false, msg: `Rasm juda katta (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 6 MB` };
  }
  return { ok: true };
}

function mapIconImgHtml(id, className = "uz-map-pin-img") {
  const src = regionMapIconSrc(id);
  const fb = regionMapIconFallback(id);
  return `<img class="${className}" src="${esc(src)}" alt="" loading="lazy" decoding="async" data-fallback="${esc(fb)}" onerror="if(this.dataset.fallback&&!this.dataset.fell){this.dataset.fell='1';this.src=this.dataset.fallback}">`;
}

function buildHomeMapPinsHtml() {
  return MAP_REGIONS.map((r) => {
    const visited = Store.data.visitedRegions.some((v) => normalizeRegionId(v) === r.id);
    const active = homeMapSelectedId === r.id;
    return `<button type="button" class="uz-map-pin${visited ? " is-visited" : ""}${active ? " is-active" : ""}"
      data-region="${esc(r.id)}" style="--pin-x:${r.mapX}%;--pin-y:${r.mapY}%"
      aria-label="${esc(r.name)}">
      <span class="uz-map-pin-ring" aria-hidden="true"></span>
      <span class="uz-map-pin-icon">${mapIconImgHtml(r.id)}</span>
      <span class="uz-map-pin-label">${esc(r.name)}</span>
      ${visited ? `<span class="uz-map-pin-check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>` : ""}
    </button>`;
  }).join("");
}

async function renderHomeMap() {
  const host = $("#uzMapHost");
  if (!host) return;

  if (!host.dataset.loaded) {
    host.innerHTML = `
      <div class="uz-map-stage">
        <img class="uz-map-bg" src="${esc(getMapBackgroundSrc())}" alt="O'zbekiston viloyatlari xaritasi" decoding="async" />
        <div class="uz-map-pins" id="uzMapPins">${buildHomeMapPinsHtml()}</div>
      </div>`;
    host.dataset.loaded = "1";
  } else {
    refreshHomeMapBackground();
    const pins = $("#uzMapPins");
    if (pins) pins.innerHTML = buildHomeMapPinsHtml();
    REGIONS.forEach((r) => {
      const mr = getMapRegionById(r.id);
      const btn = host.querySelector(`.uz-map-pin[data-region="${CSS.escape(r.id)}"]`);
      if (btn && mr) {
        btn.style.setProperty("--pin-x", `${mr.mapX}%`);
        btn.style.setProperty("--pin-y", `${mr.mapY}%`);
      }
    });
  }

  updateHomeMapProgress();
  bindHomeMapRegions();
  if (homeMapSelectedId) selectHomeRegion(homeMapSelectedId, { silent: true });
}

function refreshHomeMapPins() {
  const host = $("#uzMapHost");
  if (!host?.dataset.loaded) return;
  const pins = $("#uzMapPins");
  if (pins) pins.innerHTML = buildHomeMapPinsHtml();
  bindHomeMapRegions();
  if (homeMapSelectedId) selectHomeRegion(homeMapSelectedId, { silent: true });
}

function updateHomeMapProgress() {
  const el = $("#uzMapProgress");
  if (!el) return;
  const visited = Store.data.visitedRegions.length;
  const total = MAP_REGIONS.length;
  el.textContent = visited
    ? `${visited} / ${total} viloyat o'rganildi — davom eting!`
    : `0 / ${total} viloyat — belgini bosing!`;
}

function bindHomeMapRegions() {
  const onRegionPick = (el, id) => {
    el.classList.add("is-pressed");
    setTimeout(() => el.classList.remove("is-pressed"), 420);
    selectHomeRegion(id);
  };

  $$("#uzMapHost .uz-map-pin").forEach((btn) => {
    const id = normalizeRegionId(btn.dataset.region);
    btn.classList.toggle("is-visited", Store.data.visitedRegions.some((v) => normalizeRegionId(v) === id));
    btn.classList.toggle("is-active", homeMapSelectedId === id);
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => onRegionPick(btn, id));
  });
}

function renderHomeRegionPanel(r) {
  const v = getValueById(r.value);
  const work = r.workId ? getWorkById(r.workId) : null;
  const visited = Store.data.visitedRegions.some((id) => normalizeRegionId(id) === r.id);
  const infoSrc = regionInfographicSrc(r.id);
  const hasCustomInfo = !!infoSrc;

  return `
    <div class="uz-region-panel">
      <figure class="uz-region-info${hasCustomInfo ? "" : " is-placeholder"}" id="uzRegionInfo">
        ${hasCustomInfo ? `<img class="uz-region-info-img" src="${esc(infoSrc)}" alt="${esc(r.name)} — qadriyat infografikasi" loading="lazy">` : ""}
        <div class="uz-region-info-fallback">
          ${mapIconImgHtml(r.id, "uz-region-info-icon")}
          <figcaption>
            <h4>${esc(r.name)}</h4>
            <span class="value-tag uz-region-info-value" style="background:${v.color}"><i class="fa-solid ${v.icon}"></i> ${esc(v.name)}</span>
            <p class="muted uz-region-info-teaser">${esc(r.story)}</p>
            <p class="uz-region-info-soon"><i class="fa-solid fa-image"></i> Infografika tez orada qo'shiladi</p>
          </figcaption>
        </div>
      </figure>
      <div class="uz-region-panel-foot">
        ${visited ? `<span class="uz-passport-badge"><i class="fa-solid fa-check"></i> Tashrif</span>` : ""}
        <div class="uz-region-panel-actions">
          <button type="button" class="solid-btn uz-passport-open" data-region="${esc(r.id)}"><i class="fa-solid fa-compass"></i> Sayohatni boshlash</button>
          ${work ? `<button type="button" class="ghost-btn uz-passport-work" data-work="${esc(work.id)}"><i class="fa-solid fa-book-open"></i> Asarni o'qish</button>` : ""}
          <button type="button" class="ghost-btn uz-passport-value" data-value="${esc(r.value)}"><i class="fa-solid fa-seedling"></i> Qadriyatni o'rganish</button>
        </div>
      </div>
    </div>`;
}

function selectHomeRegion(id, opts = {}) {
  const r = getMapRegionById(id);
  if (!r) return;
  homeMapSelectedId = r.id;

  $$("#uzMapHost .uz-map-pin").forEach((p) => {
    p.classList.toggle("is-active", normalizeRegionId(p.dataset.region) === r.id);
  });

  const empty = $("#uzMapPanelEmpty");
  const body = $("#uzMapPanelBody");
  if (empty) empty.hidden = true;
  if (body) {
    body.hidden = false;
    body.innerHTML = renderHomeRegionPanel(r);
    const info = body.querySelector(".uz-region-info");
    const infoImg = info?.querySelector(".uz-region-info-img");
    if (info && infoImg) {
      const syncInfoState = () => {
        if (infoImg.naturalWidth > 0) info.classList.remove("is-placeholder");
        else info.classList.add("is-placeholder");
      };
      infoImg.addEventListener("load", syncInfoState);
      infoImg.addEventListener("error", () => info.classList.add("is-placeholder"));
      if (infoImg.complete) syncInfoState();
    }
    body.querySelector(".uz-passport-open")?.addEventListener("click", () => openRegion(r.id));
    body.querySelector(".uz-passport-work")?.addEventListener("click", (e) => {
      openWorkModal(e.currentTarget.dataset.work);
    });
    body.querySelector(".uz-passport-value")?.addEventListener("click", (e) => {
      openValueLesson(e.currentTarget.dataset.value);
    });
  }

  if (!opts.silent) {
    markRegionVisited(r.id);
    refreshHomeMapPins();
    updateHomeMapProgress();
  }
}

function markRegionVisited(id) {
  const norm = normalizeRegionId(id);
  if (!Store.data.visitedRegions.some((v) => normalizeRegionId(v) === norm)) {
    Store.data.visitedRegions.push(norm);
    Store.save();
    addXP(35);
    addStars(1, true);
    completeDailyTaskSilent();
    checkBadges();
    toast(`${getMapRegionById(norm)?.emoji || "🗺️"} ${getMapRegionById(norm)?.name} — yangi viloyat ochildi!`, "win");
  }
}

function renderPopularWorks() {
  const popular = TEXTBOOK_WORKS
    .slice()
    .sort((a, b) => {
      const ra = WorkRatings.get(a.id);
      const rb = WorkRatings.get(b.id);
      if (rb.averageRating !== ra.averageRating) return rb.averageRating - ra.averageRating;
      if (rb.ratingCount !== ra.ratingCount) return rb.ratingCount - ra.ratingCount;
      const diff = WorkViews.get(b.id) - WorkViews.get(a.id);
      if (diff !== 0) return diff;
      return workItemTime(b) - workItemTime(a);
    })
    .slice(0, 10);
  $("#popularWorks").innerHTML = popular.map((w) => {
    const done = Store.data.readWorks.includes(w.id);
    return `<div class="pop-work" data-work="${w.id}">
      ${renderWorkCover(w, "pop", `<span class="pop-grade">${w.grade}-sinf</span>${done ? '<span class="pop-grade" style="left:auto;right:8px;background:#d9f5e1;color:#2e8a4f"><i class="fa-solid fa-check"></i></span>' : ""}`)}
      <p class="pop-title">${esc(w.title)}</p>
      <div class="pop-meta">${workRatingPopMeta(w.id)}</div>
    </div>`;
  }).join("");
  bindPopularSlider({
    scroller: "#popularWorks",
    prev: "#popularPrev",
    next: "#popularNext",
    itemSelector: ".pop-work",
    onItemClick: (el) => { if (el.dataset.work) openWorkModal(el.dataset.work); },
  });
}

function renderPopularGames() {
  const host = $("#popularGames");
  if (!host) return;
  host.innerHTML = GAMES.map((g) => `
    <div class="pop-work pop-game" data-game="${g.id}">
      <div class="pop-thumb pop-game-thumb" style="background:linear-gradient(145deg, ${g.color}, color-mix(in srgb, ${g.color} 72%, #1a1a1a))">
        <i class="fa-solid ${g.icon}" aria-hidden="true"></i>
      </div>
      <p class="pop-title">${esc(g.name)}</p>
      <div class="pop-meta"><i class="fa-solid fa-gamepad"></i> ${esc(g.desc.split(".")[0])}</div>
    </div>`).join("");
  bindPopularSlider({
    scroller: "#popularGames",
    prev: "#popularGamesPrev",
    next: "#popularGamesNext",
    itemSelector: ".pop-game",
    onItemClick: (el) => {
      if (!el.dataset.game) return;
      location.hash = "oyinlar";
      setTimeout(() => launchGame(el.dataset.game), 200);
    },
  });
}

function bindPopularSlider({ scroller: scrollerSel, prev: prevSel, next: nextSel, itemSelector, onItemClick }) {
  const scroller = $(scrollerSel);
  if (!scroller) return;

  if (!scroller.dataset.bound) {
    scroller.dataset.bound = "1";
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let dragMoved = false;
    let activePointerId = null;

    const scrollByCard = (dir) => {
      const card = $(itemSelector, scroller);
      const gap = parseFloat(getComputedStyle(scroller).gap) || 16;
      const amount = card ? card.getBoundingClientRect().width + gap : 220;
      scroller.scrollBy({ left: dir * amount * 2, behavior: "smooth" });
    };

    const prev = $(prevSel);
    const next = $(nextSel);
    if (prev) prev.addEventListener("click", () => scrollByCard(-1));
    if (next) next.addEventListener("click", () => scrollByCard(1));

    const onPointerMove = (e) => {
      if (!isDown || (activePointerId != null && e.pointerId !== activePointerId)) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        if (!dragMoved) {
          dragMoved = true;
          scroller.classList.add("dragging");
        }
        e.preventDefault();
        scroller.scrollLeft = startLeft - dx;
      }
    };

    const stopDrag = (e) => {
      if (activePointerId != null && e?.pointerId != null && e.pointerId !== activePointerId) return;
      isDown = false;
      activePointerId = null;
      scroller.classList.remove("dragging");
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", stopDrag);
      document.removeEventListener("pointercancel", stopDrag);
      if (dragMoved) setTimeout(() => { dragMoved = false; }, 100);
    };

    scroller.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest(".popular-nav")) return;
      isDown = true;
      dragMoved = false;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startLeft = scroller.scrollLeft;
      scroller.setPointerCapture?.(e.pointerId);
      document.addEventListener("pointermove", onPointerMove, { passive: false });
      document.addEventListener("pointerup", stopDrag);
      document.addEventListener("pointercancel", stopDrag);
    });

    scroller.addEventListener("click", (e) => {
      if (dragMoved) {
        e.preventDefault();
        e.stopPropagation();
        dragMoved = false;
        return;
      }
      const card = e.target.closest(itemSelector);
      if (card) onItemClick?.(card);
    });
  }
}

function initValueTreeParticles() {
  const host = $("#valueTreeParticles");
  if (!host || host.dataset.ready) return;
  const stage = host.closest(".value-tree-stage");
  const stageH = stage?.offsetHeight || 480;
  if (stageH < 80 && !host.dataset.retried) {
    host.dataset.retried = "1";
    requestAnimationFrame(() => initValueTreeParticles());
    return;
  }
  host.dataset.ready = "1";
  const colors = ["#ffd76b", "#7ed56f", "#ffffff", "#2f86d6", "#e6821e", "#f2a93b", "#ffb347"];
  const count = 56;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = i % 3 === 0 ? "vt-particle vt-sparkle" : "vt-particle";
    const size = 6 + Math.random() * 12;
    const rise = Math.round(stageH * (0.75 + Math.random() * 0.55));
    p.style.cssText = [
      `left:${(8 + Math.random() * 84).toFixed(1)}%`,
      `bottom:${(Math.random() * 18).toFixed(1)}%`,
      `width:${size}px`,
      `height:${size}px`,
      `animation-duration:${5 + Math.random() * 6}s`,
      `animation-delay:${Math.random() * 7}s`,
      `--p-color:${colors[Math.floor(Math.random() * colors.length)]}`,
      `--p-drift:${(-32 + Math.random() * 64).toFixed(1)}px`,
      `--p-rise:-${rise}px`,
    ].join(";");
    host.appendChild(p);
  }
}

function renderValueTree() {
  initValueTreeParticles();
  const fruitImages = {
    halollik: "apple-halollik.png",
    mehnatsevarlik: "apple-mehnatsevarlik.png",
    vatanparvarlik: "apple-vatanparvarlik.png",
    mehribonlik: "apple-mehribonlik.png",
    saxovat: "apple-saxovat.png",
    "ota-onaga-hurmat": "apple-ota-onaga-hurmat.png",
    dustlik: "apple-dustlik.png",
    masuliyat: "apple-masuliyat.png",
    adolat: "apple-adolat.png",
  };
  const positions = {
    adolat: [50, 14],
    halollik: [32, 24],
    mehribonlik: [68, 24],
    dustlik: [22, 36],
    mehnatsevarlik: [76, 34],
    saxovat: [30, 50],
    masuliyat: [70, 48],
    "ota-onaga-hurmat": [42, 58],
    vatanparvarlik: [58, 56],
  };
  $("#pomegranates").innerHTML = VALUES.map((v, i) => {
    const [x, y] = positions[v.id] || [50, 50];
    const opened = Store.data.openedValues.includes(v.id);
    const fruitImg = fruitImages[v.id] || "qadriyat-olma-meva.png";
    return `<button type="button" class="pom ${opened ? "opened" : ""}" data-value="${v.id}"
      style="left:${x}%;top:${y}%;--fruit-color:${v.color}" aria-label="${esc(v.name)} qadriyatini ochish">
      <div class="pom-bob" style="animation-delay:${i * 0.2}s">
        <img class="pom-fruit" src="assets/${fruitImg}" alt="" width="512" height="512" loading="lazy" draggable="false">
        <span class="pom-label">${esc(v.name)}</span>
      </div>
    </button>`;
  }).join("");
  $$("#pomegranates .pom").forEach((el) => el.addEventListener("click", () => openValueLesson(el.dataset.value)));
}

function openValueLesson(valueId) {
  const v = getValueById(valueId);
  if (!Store.data.openedValues.includes(valueId)) {
    Store.data.openedValues.push(valueId);
    Store.save();
    addXP(25);
    renderValueTree();
    checkBadges();
  }
  const related = TEXTBOOK_WORKS.filter((w) => w.values.includes(valueId));
  openModal(`
    <div class="modal-hero" style="background:linear-gradient(135deg,${v.color},${shade(v.color)})">
      <i class="fa-solid ${v.icon}"></i>
    </div>
    <div class="modal-inner">
      <h2 style="color:${v.color}">${v.name}</h2>
      <p class="summary-text">${esc(v.desc)}</p>
      <div class="moral-box"><i class="fa-solid fa-lightbulb"></i> Bu qadriyatni quyidagi asarlarda uchratasiz:</div>
      <div class="works-grid" style="margin-top:14px">
        ${related.map((w) => `<div class="work-card" data-work="${w.id}">
          ${renderWorkCover(w, "small")}
          <div class="work-body" style="padding:10px 12px"><h4 style="font-size:0.92rem">${esc(w.title)}</h4></div>
        </div>`).join("")}
      </div>
    </div>
  `);
  $$("#modalBody .work-card").forEach((el) => el.addEventListener("click", () => openWorkModal(el.dataset.work)));
}

function shade(hex) {
  // rangni biroz to'qroq qilish
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) - 40, g = ((n >> 8) & 255) - 40, b = (n & 255) - 40;
  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  return `rgb(${r},${g},${b})`;
}

function renderDailyGoal() {
  Store.checkDay();
  const d = Store.data;
  const pct = Math.min(100, Math.round((d.dailyDone / d.dailyGoal) * 100));
  $("#goalCount").textContent = `${d.dailyDone} / ${d.dailyGoal}`;
  $("#goalFill").style.width = pct + "%";
  $("#goalRing").style.background = `conic-gradient(var(--orange) ${pct * 3.6}deg, #ffe6c8 0deg)`;
  const hints = [
    "Zo'r ish! Davom eting, bilim sizni yuksaltiradi!",
    "Ajoyib! Yana bir oz qoldi, qo'ymang!",
    "Bilim daraxtingiz gullamoqda! 🌳",
    "Siz bugun haqiqiy donishmandsiz! 👑",
  ];
  $("#goalHint").textContent = d.dailyDone >= d.dailyGoal
    ? "🎉 Barakalla! Bugungi maqsad to'liq bajarildi!"
    : hints[d.dailyDone % hints.length];
  const btn = $("#goalBtn");
  if (btn) {
    const done = d.dailyDone >= d.dailyGoal;
    btn.disabled = done;
    btn.innerHTML = done
      ? `<i class="fa-solid fa-check"></i> Maqsad bajarildi`
      : `<i class="fa-solid fa-arrow-right"></i> Davom etish`;
  }
}

/* ====================== 7. KUTUBXONA ====================== */
function fillValueFilters() {
  refreshValueSelects();
}

let librarySortMode = "newest";
let libraryRandomOrder = null;
let libraryRandomOrderSource = "";

const LIBRARY_SORT_META = {
  newest: { icon: "fa-clock", status: "Eng yangi asarlar birinchi ko'rsatilmoqda" },
  popular: { icon: "fa-star", status: "Eng yuqori baholangan asarlar birinchi ko'rsatilmoqda" },
  random: { icon: "fa-shuffle", status: "Asarlar tasodifiy tartibda ko'rsatilmoqda" },
};

function libraryRandomOrderKey(items) {
  return items.map((w) => w.id).sort().join("|");
}

function applyLibraryRandomOrder(items) {
  const key = libraryRandomOrderKey(items);
  if (libraryRandomOrderSource !== key || !libraryRandomOrder) {
    const shuffled = shuffle([...items]);
    libraryRandomOrder = new Map(shuffled.map((item, idx) => [item.id, idx]));
    libraryRandomOrderSource = key;
  }
  return [...items].sort((a, b) => (libraryRandomOrder.get(a.id) ?? 0) - (libraryRandomOrder.get(b.id) ?? 0));
}

function sortLibraryWorks(items) {
  if (librarySortMode === "random") return applyLibraryRandomOrder(items);
  const arr = [...items];
  if (librarySortMode === "popular") {
    arr.sort((a, b) => {
      const ra = WorkRatings.get(a.id);
      const rb = WorkRatings.get(b.id);
      if (rb.averageRating !== ra.averageRating) return rb.averageRating - ra.averageRating;
      if (rb.ratingCount !== ra.ratingCount) return rb.ratingCount - ra.ratingCount;
      const diff = WorkViews.get(b.id) - WorkViews.get(a.id);
      if (diff !== 0) return diff;
      return workItemTime(b) - workItemTime(a);
    });
  } else {
    arr.sort((a, b) => workItemTime(b) - workItemTime(a));
  }
  return arr;
}

function updateLibrarySortUi() {
  const meta = LIBRARY_SORT_META[librarySortMode] || LIBRARY_SORT_META.newest;
  $("#librarySortNewest")?.classList.toggle("active", librarySortMode === "newest");
  $("#librarySortPopular")?.classList.toggle("active", librarySortMode === "popular");
  $("#librarySortRandom")?.classList.toggle("active", librarySortMode === "random");
  $("#librarySortNewest")?.setAttribute("aria-pressed", librarySortMode === "newest" ? "true" : "false");
  $("#librarySortPopular")?.setAttribute("aria-pressed", librarySortMode === "popular" ? "true" : "false");
  $("#librarySortRandom")?.setAttribute("aria-pressed", librarySortMode === "random" ? "true" : "false");
  const status = $("#librarySortStatus");
  const statusText = $("#librarySortStatusText");
  if (status) status.dataset.sort = librarySortMode === "popular" ? "rating" : librarySortMode;
  if (statusText) statusText.textContent = meta.status;
  const iconEl = status?.querySelector("i.fa-solid");
  if (iconEl) iconEl.className = `fa-solid ${meta.icon}`;
}

function setLibrarySortMode(mode) {
  const reshuffleRandom = mode === "random" && librarySortMode === "random";
  if (librarySortMode === mode && !reshuffleRandom) return;
  librarySortMode = mode;
  if (mode === "random") {
    libraryRandomOrder = null;
    libraryRandomOrderSource = "";
  }
  updateLibrarySortUi();
  renderLibrary();
}

function renderLibrary() {
  const sub = $("#librarySubtitle");
  if (sub) sub.textContent = `3–4-sinf darsliklaridagi ${TEXTBOOK_WORKS.length} ta badiiy asar — o'qing, o'ynang, o'rganing.`;
  const q = ($("#searchInput").value || "").toLowerCase().trim();
  const grade = $("#gradeFilter").value;
  const val = $("#valueFilter").value;
  const genre = $("#genreFilter").value;

  const list = TEXTBOOK_WORKS.filter((w) => {
    if (grade && String(w.grade) !== grade) return false;
    if (val && !w.values.includes(val)) return false;
    if (genre && w.genre !== genre) return false;
    if (q) {
      const hay = (w.title + " " + w.author + " " + w.keywords.join(" ") + " " + w.summary).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = sortLibraryWorks(list);

  $("#worksEmpty").hidden = sorted.length > 0;
  $("#worksGrid").innerHTML = sorted.map((w) => {
    const v = getValueById(w.valueMain);
    const done = Store.data.readWorks.includes(w.id);
    return `<div class="work-card" data-work="${w.id}">
      ${renderWorkCover(w, "grid", `<div class="work-badges"><span class="chip">${w.grade}-sinf</span><span class="chip">${esc(w.genre)}</span></div>`)}
      <div class="work-body">
        <h4>${esc(w.title)}</h4>
        <p class="work-author">${esc(w.author)}</p>
        <span class="value-tag" style="background:${v.color}"><i class="fa-solid ${v.icon}"></i> ${v.name}</span>
        <div class="work-foot">
          <span class="work-foot-stats">
            <span><i class="fa-solid fa-list-check"></i> ${w.tests.length} test</span>
            ${workViewsHtml(w.id)}
          </span>
          ${done ? '<span class="done"><i class="fa-solid fa-circle-check"></i> O\'qilgan</span>' : '<span><i class="fa-solid fa-arrow-right"></i> Ochish</span>'}
        </div>
      </div>
    </div>`;
  }).join("");
  $$("#worksGrid .work-card").forEach((el) => el.addEventListener("click", () => openWorkModal(el.dataset.work)));
}

function openWorkModal(workId) {
  const w = getWorkById(workId);
  if (!w) return;
  recordWorkView(workId);
  // O'qildi deb belgilash
  if (!Store.data.readWorks.includes(workId)) {
    Store.data.readWorks.push(workId);
    Store.save();
    addXP(30);
    completeDailyTaskSilent();
    checkBadges();
  }
  const v = getValueById(w.valueMain);
  const valueChips = w.values.map((id) => {
    const vv = getValueById(id);
    return `<span class="value-tag" style="background:${vv.color}"><i class="fa-solid ${vv.icon}"></i> ${vv.name}</span>`;
  }).join("");

  const fullReadBtn = w.fullText
    ? `<button class="solid-btn work-read-full" type="button" data-work-full="${workId}"><i class="fa-solid fa-book-open-reader"></i> Asarni to'liq o'qish</button>`
    : `<p class="work-no-full muted"><i class="fa-solid fa-circle-info"></i> To'liq matn darslikdan hali qo'shilmagan</p>`;

  openModal(`
    ${renderWorkCover(w, "modal")}
    <div class="modal-inner">
      <h2>${esc(w.title)}</h2>
      <p class="work-author">${esc(w.author)} · ${w.grade}-sinf · ${esc(w.genre)} · ${w.part}-qism</p>
      <div class="value-list-modal">${valueChips}</div>
      ${fullReadBtn}
      <div class="modal-tabs">
        <button class="mtab active" data-tab="summary"><i class="fa-solid fa-book"></i> Mazmun</button>
        <button class="mtab" data-tab="test"><i class="fa-solid fa-clipboard-check"></i> Test</button>
        <button class="mtab" data-tab="games"><i class="fa-solid fa-gamepad"></i> O'yinlar</button>
      </div>
      <div class="mtab-panel active" data-panel="summary">
        <p class="summary-text">${esc(w.summary)}</p>
        <div class="moral-box"><i class="fa-solid fa-seedling"></i> <b>Saboq:</b> ${esc(w.moral)}</div>
      </div>
      <div class="mtab-panel" data-panel="test">
        <div id="modalTest"></div>
      </div>
      <div class="mtab-panel" data-panel="games">
        <p class="muted">Asar asosida o'yinlar:</p>
        <div class="games-grid" style="margin-top:12px">
          <div class="game-card" data-mgame="crossword"><div class="game-ico" style="background:#e6821e"><i class="fa-solid fa-table-cells"></i></div><h4>Krossvord</h4></div>
          <div class="game-card" data-mgame="puzzle"><div class="game-ico" style="background:#4a9e5c"><i class="fa-solid fa-puzzle-piece"></i></div><h4>Puzzle</h4></div>
        </div>
      </div>
    </div>
  `);

  const fullBtn = $("#modalBody .work-read-full");
  if (fullBtn) {
    fullBtn.addEventListener("click", () => {
      closeModal();
      location.hash = "asar/" + workId;
    });
  }
  // Tab almashtirish
  $$("#modalBody .mtab").forEach((tab) => tab.addEventListener("click", () => {
    $$("#modalBody .mtab").forEach((t) => t.classList.remove("active"));
    $$("#modalBody .mtab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`#modalBody .mtab-panel[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    if (tab.dataset.tab === "test") renderInlineTest(w);
  }));
  // Asar o'yinlari
  $$("#modalBody .game-card[data-mgame]").forEach((el) => el.addEventListener("click", () => {
    closeModal();
    switchPage("oyinlar");
    setTimeout(() => launchGame(el.dataset.mgame, w.id), 200);
  }));
}

/* Modal ichidagi qisqa test */
function renderInlineTest(w) {
  const box = $("#modalTest");
  if (!box) return;
  const questions = prepareInlineQuiz(w.tests || []);
  const total = questions.length;
  let answered = 0, correct = 0;
  box.innerHTML = `
    <p class="muted mini-test-hint"><i class="fa-solid fa-circle-info"></i> Qisqa test — ${total} ta savol (to'liq test uchun Test bo'limiga o'ting)</p>
    ${questions.map((t, ti) => `
    <div class="mini-test" data-ti="${ti}">
      <p class="mini-test-q">${ti + 1}. ${esc(t.q)}</p>
      <div class="quiz-opts">${t.options.map((o, oi) => `<button class="quiz-opt" data-oi="${oi}">${esc(o)}</button>`).join("")}</div>
    </div>`).join("")}`;
  $$("#modalTest .mini-test").forEach((block) => {
    const ti = +block.dataset.ti;
    const t = questions[ti];
    $$(".quiz-opt", block).forEach((btn) => btn.addEventListener("click", () => {
      if (block.dataset.done) return;
      block.dataset.done = "1";
      answered++;
      const oi = +btn.dataset.oi;
      if (oi === t.correct) { btn.classList.add("correct"); correct++; addXP(15, true); addStars(1, true); }
      else {
        btn.classList.add("wrong");
        $$(".quiz-opt", block)[t.correct].classList.add("correct");
      }
      if (answered === questions.length) {
        toast(`✅ Test tugadi: ${correct}/${questions.length} to'g'ri!`, "win");
        renderProfile();
      }
    }));
  });
}

/* ====================== MODAL boshqaruvi ====================== */
let modalLastFocus = null;

function openModal(html) {
  modalLastFocus = document.activeElement;
  $("#modalBody").innerHTML = html;
  $("#modalOverlay").hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => $("#modalClose")?.focus());
}
function closeModal() {
  $("#modalOverlay").hidden = true;
  document.body.style.overflow = "";
  if (modalLastFocus && typeof modalLastFocus.focus === "function") {
    try { modalLastFocus.focus(); } catch { /* ignore */ }
  }
  modalLastFocus = null;
}

let imageFsGallery = null;

function ensureImageFullscreenOverlay() {
  let overlay = $("#imageFullscreen");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "imageFullscreen";
  overlay.className = "image-fullscreen-overlay";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Rasmni to'liq ekranda ko'rish");
  overlay.innerHTML = `
    <button type="button" class="image-fullscreen-close" aria-label="Yopish">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <button type="button" class="image-fullscreen-nav image-fullscreen-prev" aria-label="Oldingi rasm" hidden>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    <button type="button" class="image-fullscreen-nav image-fullscreen-next" aria-label="Keyingi rasm" hidden>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
    <figure class="image-fullscreen-figure">
      <img class="image-fullscreen-img" alt="">
      <div class="image-fullscreen-fallback" hidden></div>
      <figcaption class="image-fullscreen-caption"></figcaption>
    </figure>
    <p class="image-fullscreen-counter" hidden></p>`;
  document.body.appendChild(overlay);

  overlay.querySelector(".image-fullscreen-close").addEventListener("click", closeImageFullscreen);
  overlay.querySelector(".image-fullscreen-prev").addEventListener("click", () => stepImageFullscreen(-1));
  overlay.querySelector(".image-fullscreen-next").addEventListener("click", () => stepImageFullscreen(1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeImageFullscreen();
  });
  overlay.querySelector(".image-fullscreen-img").addEventListener("click", (e) => e.stopPropagation());

  if (!overlay.dataset.keysBound) {
    overlay.dataset.keysBound = "1";
    document.addEventListener("keydown", imageFullscreenKeydown);
  }

  return overlay;
}

function imageFullscreenKeydown(e) {
  const overlay = $("#imageFullscreen");
  if (!overlay || overlay.hidden) return;
  if (e.key === "Escape") closeImageFullscreen();
  if (e.key === "ArrowLeft") stepImageFullscreen(-1);
  if (e.key === "ArrowRight") stepImageFullscreen(1);
}

function renderImageFullscreenSlide() {
  const overlay = ensureImageFullscreenOverlay();
  const img = overlay.querySelector(".image-fullscreen-img");
  const fallback = overlay.querySelector(".image-fullscreen-fallback");
  const caption = overlay.querySelector(".image-fullscreen-caption");
  const counter = overlay.querySelector(".image-fullscreen-counter");
  const prev = overlay.querySelector(".image-fullscreen-prev");
  const next = overlay.querySelector(".image-fullscreen-next");

  let imgUrl = overlay.dataset.singleUrl || "";
  let title = overlay.dataset.singleTitle || "";
  let grad = overlay.dataset.singleGrad || "linear-gradient(135deg,#e6821e,#7b3f00)";
  let emoji = overlay.dataset.singleEmoji || "📖";

  if (imageFsGallery?.items?.length) {
    const item = imageFsGallery.items[imageFsGallery.idx];
    imgUrl = item.imageUrl || item.imgUrl || imgUrl;
    title = item.title || title;
    grad = item.grad || grad;
    emoji = item.emoji || emoji;
    const multi = imageFsGallery.items.length > 1;
    prev.hidden = !multi;
    next.hidden = !multi;
    counter.hidden = !multi;
    counter.textContent = `${imageFsGallery.idx + 1} / ${imageFsGallery.items.length}`;
  } else {
    prev.hidden = true;
    next.hidden = true;
    counter.hidden = true;
  }

  caption.textContent = title;
  fallback.style.background = grad;
  fallback.textContent = emoji;
  fallback.hidden = true;
  img.hidden = false;
  img.alt = title;
  img.onerror = () => {
    img.hidden = true;
    fallback.hidden = false;
  };
  img.src = imgUrl;
}

function stepImageFullscreen(delta) {
  if (!imageFsGallery?.items?.length || imageFsGallery.items.length <= 1) return;
  const n = imageFsGallery.items.length;
  imageFsGallery.idx = (imageFsGallery.idx + delta + n) % n;
  renderImageFullscreenSlide();
}

function openImageFullscreen({ imgUrl, title, grad, emoji, galleryItems, galleryIndex }) {
  const overlay = ensureImageFullscreenOverlay();
  if (galleryItems?.length) {
    imageFsGallery = {
      items: galleryItems,
      idx: Math.max(0, Math.min(galleryIndex || 0, galleryItems.length - 1)),
    };
    overlay.dataset.singleUrl = "";
    overlay.dataset.singleTitle = "";
  } else {
    imageFsGallery = null;
    overlay.dataset.singleUrl = imgUrl || "";
    overlay.dataset.singleTitle = title || "";
    overlay.dataset.singleGrad = grad || "linear-gradient(135deg,#e6821e,#7b3f00)";
    overlay.dataset.singleEmoji = emoji || "📖";
  }
  renderImageFullscreenSlide();
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function openIjodImageFullscreen(item) {
  if (!item?.imageUrl) return;
  let list = sortIjodItems([...ijodItemsCache]);
  let idx = list.findIndex((x) => x.id === item.id);
  if (idx < 0) {
    list = [item, ...list];
    idx = 0;
  }
  openImageFullscreen({
    imgUrl: item.imageUrl,
    title: item.title,
    galleryItems: list,
    galleryIndex: idx,
  });
}

function closeImageFullscreen() {
  const overlay = $("#imageFullscreen");
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  imageFsGallery = null;
  const modalOpen = $("#modalOverlay") && !$("#modalOverlay").hidden;
  const lightboxOpen = $("#ijodLightbox") && !$("#ijodLightbox").hidden;
  if (!modalOpen && !lightboxOpen) document.body.style.overflow = "";
}

/* ====================== 8. O'YINLAR ====================== */
function renderGamesHub() {
  $("#gameStage").hidden = true;
  $("#gamesGrid").hidden = false;
  $("#gamesGrid").innerHTML = GAMES.map((g) => `
    <div class="game-card" data-game="${g.id}">
      <div class="game-ico" style="background:${g.color}"><i class="fa-solid ${g.icon}"></i></div>
      <h4>${g.name}</h4>
      <p>${esc(g.desc)}</p>
    </div>`).join("");
  $$("#gamesGrid .game-card").forEach((el) => el.addEventListener("click", () => launchGame(el.dataset.game)));
  scheduleSiteReveal($("#page-oyinlar"));
}

function launchGame(gameId, workId = null) {
  if (!Store.data.playedGames.includes(gameId)) {
    Store.data.playedGames.push(gameId);
    Store.save();
    checkBadges();
  }
  $("#gamesGrid").hidden = true;
  $("#gameStage").hidden = false;

  if (gameId === "puzzle" && !workId) {
    renderPuzzlePicker();
    return;
  }

  if (gameId === "crossword" && !workId) {
    renderCrosswordPicker();
    return;
  }

  const work = workId ? getWorkById(workId) : TEXTBOOK_WORKS[rand(TEXTBOOK_WORKS.length)];
  switch (gameId) {
    case "crossword": gameCrossword(work, { backFn: renderGamesHub }); break;
    case "puzzle": gamePuzzle(work, { backFn: renderGamesHub }); break;
    case "guess": gameGuessWork(); break;
    case "author": gameGuessAuthor(); break;
    case "truefalse": gameTrueFalse(); break;
    case "match": gameMatch(); break;
    default: renderGamesHub();
  }
}

function renderPuzzlePicker() {
  $("#gamesGrid").hidden = true;
  const stage = $("#gameStage");
  stage.hidden = false;
  stage.innerHTML = `
    ${gameHeader(
      `<i class="fa-solid fa-puzzle-piece"></i> Rasmli puzzle`,
      "Qaysi asar rasmini yig'moqchisan? Ro'yxatdan tanla."
    )}
    <div class="test-picker">
      ${TEXTBOOK_WORKS.map((w) => {
        const size = puzzleGridSize(w);
        return `<div class="test-item puzzle-pick-item" data-work="${w.id}">
          ${renderTestItemThumb(w)}
          <div>
            <h4>${esc(w.title)}</h4>
            <small>${w.grade}-sinf · ${size}×${size} bo'lak · ${esc(w.author || "Darslik")}</small>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  bindBack(renderGamesHub);
  $$(".puzzle-pick-item").forEach((el) =>
    el.addEventListener("click", () =>
      gamePuzzle(getWorkById(el.dataset.work), { backFn: renderPuzzlePicker })
    )
  );
  scheduleSiteReveal($("#page-oyinlar"));
}

function getWorksWithCrossword() {
  return TEXTBOOK_WORKS.filter((w) =>
    (w.crossword || []).some((c) => splitUzCwLetters(c.word).length >= 2 && String(c.clue || "").trim())
  );
}

function getCwPickPreviewMetrics(cols, rows) {
  const gap = 2;
  const boxW = 210;
  const boxH = 128;
  const minCell = 10;
  const maxCell = 30;
  const cellByW = (boxW - Math.max(0, cols - 1) * gap) / cols;
  const cellByH = (boxH - Math.max(0, rows - 1) * gap) / rows;
  let cellSize = Math.floor(Math.min(cellByW, cellByH));
  cellSize = Math.max(minCell, Math.min(maxCell, cellSize));
  const gridW = cols * cellSize + Math.max(0, cols - 1) * gap;
  const gridH = rows * cellSize + Math.max(0, rows - 1) * gap;
  const scale = Math.min(1, boxW / gridW, boxH / gridH);
  return { cellSize, scale, boxW, boxH };
}

function renderCrosswordPickCard(w) {
  const entries = (w.crossword || [])
    .filter((c) => splitUzCwLetters(c.word).length >= 2 && String(c.clue || "").trim())
    .map((c) => ({ word: c.word, clue: c.clue }));
  const layout = buildCrosswordLayout(entries);
  let preview;
  if (layout.rows && layout.cols) {
    const { cellSize, scale } = getCwPickPreviewMetrics(layout.cols, layout.rows);
    const gridHtml = renderCrosswordGridHtml(layout, { interactive: false, preview: true, cellSize });
    preview = `<div class="cw-pick-preview"><div class="cw-pick-preview-scale" style="transform:scale(${scale.toFixed(3)})">${gridHtml}</div></div>`;
  } else {
    preview = `<p class="muted cw-pick-empty">Ko'rinish yaratilmadi</p>`;
  }
  return `<button type="button" class="cw-pick-card" data-work="${esc(w.id)}">
    <h4 class="cw-pick-title">${esc(w.title)}</h4>
    ${preview}
  </button>`;
}

function renderCrosswordPicker() {
  $("#gamesGrid").hidden = true;
  const stage = $("#gameStage");
  stage.hidden = false;
  const list = getWorksWithCrossword();

  if (!list.length) {
    stage.innerHTML = `
      ${gameHeader(`<i class="fa-solid fa-table-cells"></i> Krossvord`, "Hozircha mavjud krossvord yo'q.")}
      <p class="muted">Admin panel orqali asarlarga krossvord qo'shilgach bu yerda paydo bo'ladi.</p>`;
    bindBack(renderGamesHub);
    scheduleSiteReveal($("#page-oyinlar"));
    return;
  }

  stage.innerHTML = `
    ${gameHeader(
      `<i class="fa-solid fa-table-cells"></i> Krossvord`,
      "Asar nomi va krossvord ko'rinishi — tanlab yechishni boshlang."
    )}
    <div class="cw-pick-grid">
      ${list.map((w) => renderCrosswordPickCard(w)).join("")}
    </div>`;
  bindBack(renderGamesHub);
  $$(".cw-pick-card").forEach((el) =>
    el.addEventListener("click", () =>
      gameCrossword(getWorkById(el.dataset.work), { backFn: renderCrosswordPicker })
    )
  );
  scheduleSiteReveal($("#page-oyinlar"));
}

function gameHeader(title, sub) {
  return `<div class="stage-head">
    <div><h3>${title}</h3><small class="muted">${sub}</small></div>
    <button class="back-btn" id="gameBack"><i class="fa-solid fa-arrow-left"></i> O'yinlarga qaytish</button>
  </div>`;
}
function bindBack(fn = renderGamesHub) {
  const b = $("#gameBack");
  if (b) b.addEventListener("click", fn);
}

/* --- 8.1 KROSSVORD --- */
let cwActiveDir = "h";

function getCwWordFillState(root, wordEntry, cellMap) {
  const keys = getCwWordCellKeys(wordEntry);
  let filled = true;
  let correct = true;
  for (const key of keys) {
    const inp = root.querySelector(`input[data-key="${key}"]`);
    const expected = cellMap[key];
    const val = normalizeCwInput(inp?.value, expected);
    if (val.length < expected.length) filled = false;
    if (!cwAnswersMatch(val, expected)) correct = false;
  }
  return { filled, correct, keys };
}

function showCrosswordWinPopup(work) {
  addXP(80);
  addStars(3);
  completeDailyTaskSilent();
  unlockBadge("crossword");
  if (typeof fireConfetti === "function") fireConfetti({ duration: 4500, perSide: 90 });
  openModal(`
    <div class="cw-win-modal">
      <div class="cw-win-emoji" aria-hidden="true">🎉</div>
      <h3>Tabriklaymiz!</h3>
      <p><b>"${esc(work.title)}"</b> krossvordini to'liq yechdingiz. Ajoyib ish!</p>
      <div class="cw-win-rewards">
        <span><i class="fa-solid fa-bolt"></i> +80 XP</span>
        <span><i class="fa-solid fa-star"></i> +3 yulduz</span>
      </div>
      <button type="button" class="solid-btn cw-win-close" id="cwWinClose"><i class="fa-solid fa-check"></i> Zo'r!</button>
    </div>`);
  $("#cwWinClose")?.addEventListener("click", closeModal);
}

function updateCrosswordWordStates(root, layout, state, work) {
  if (!root || state.completed) return;
  const solvedNow = new Set();

  for (const p of layout.placed) {
    const { filled, correct } = getCwWordFillState(root, p, layout.cellMap);
    if (filled && correct) solvedNow.add(p.num);
  }

  root.querySelectorAll(".cw-cell--solved").forEach((el) => el.classList.remove("cw-cell--solved"));
  root.querySelectorAll(".cw-clue--solved").forEach((el) => el.classList.remove("cw-clue--solved"));
  root.querySelectorAll(".cw-cell input.correct").forEach((inp) => inp.classList.remove("correct"));

  for (const p of layout.placed) {
    if (!solvedNow.has(p.num)) continue;
    const keys = getCwWordCellKeys(p);
    keys.forEach((key) => {
      const inp = root.querySelector(`input[data-key="${key}"]`);
      inp?.classList.add("correct");
      inp?.closest(".cw-cell")?.classList.add("cw-cell--solved");
    });
    root.querySelector(`.cw-clues-list li[data-cw-num="${p.num}"]`)?.classList.add("cw-clue--solved");

    if (!state.solvedWords.has(p.num)) {
      state.solvedWords.add(p.num);
      keys.forEach((key) => {
        const cell = root.querySelector(`input[data-key="${key}"]`)?.closest(".cw-cell");
        if (!cell) return;
        cell.classList.remove("cw-cell--glow");
        void cell.offsetWidth;
        cell.classList.add("cw-cell--glow");
        setTimeout(() => cell.classList.remove("cw-cell--glow"), 1200);
      });
    }
  }

  for (const num of [...state.solvedWords]) {
    if (!solvedNow.has(num)) state.solvedWords.delete(num);
  }

  if (solvedNow.size === layout.placed.length && layout.placed.length > 0) {
    state.completed = true;
    root.querySelectorAll(".cw-cell input").forEach((inp) => { inp.disabled = true; });
    showCrosswordWinPopup(work);
  }
}

function bindCrosswordInputs(root, layout, opts = {}) {
  const { cellMap } = layout;
  const onProgress = opts.onProgress;
  const inputs = [...(root?.querySelectorAll?.(".cw-cell input") || [])];
  if (!inputs.length) return;

  inputs.forEach((inp) => {
    inp.addEventListener("focus", () => {
      const dirs = (inp.dataset.dirs || "h").split(",");
      cwActiveDir = dirs.includes(cwActiveDir) ? cwActiveDir : (inp.dataset.primaryDir || "h");
    });
    inp.addEventListener("click", () => {
      const dirs = (inp.dataset.dirs || "h").split(",");
      if (dirs.length > 1) {
        cwActiveDir = cwActiveDir === "h" && dirs.includes("v") ? "v" : "h";
      } else {
        cwActiveDir = dirs[0] || "h";
      }
    });
    inp.addEventListener("keydown", (e) => {
      const key = inp.dataset.key;
      if (e.key === "Backspace" && !inp.value) {
        e.preventDefault();
        const prev = getCwNeighbor(key, cwActiveDir, cellMap, -1);
        if (prev) {
          const prevInp = root.querySelector(`input[data-key="${prev}"]`);
          prevInp?.focus();
          if (prevInp) prevInp.value = "";
          onProgress?.();
        }
      } else if (e.key === "ArrowRight") {
        cwActiveDir = "h";
        const next = getCwNeighbor(key, "h", cellMap, 1);
        root.querySelector(`input[data-key="${next}"]`)?.focus();
      } else if (e.key === "ArrowDown") {
        cwActiveDir = "v";
        const next = getCwNeighbor(key, "v", cellMap, 1);
        root.querySelector(`input[data-key="${next}"]`)?.focus();
      }
    });
    inp.addEventListener("input", () => {
      const ans = inp.dataset.ans || "";
      const maxLen = ans.length;
      inp.value = normalizeCwInput(inp.value, ans);
      onProgress?.();
      if (!inp.value || inp.value.length < maxLen || !cwAnswersMatch(inp.value, ans)) return;
      const dirs = (inp.dataset.dirs || "h").split(",");
      const dir = dirs.includes(cwActiveDir) ? cwActiveDir : (inp.dataset.primaryDir || "h");
      cwActiveDir = dir;
      const next = getCwNeighbor(inp.dataset.key, dir, cellMap, 1);
      if (next) {
        const nextInp = root.querySelector(`input[data-key="${next}"]`);
        nextInp?.focus();
        nextInp?.select();
      }
    });
  });
}

function gameCrossword(work, opts = {}) {
  const backFn = opts.backFn || renderCrosswordPicker;
  const entries = (work.crossword || []).map((c) => ({ word: c.word, clue: c.clue }));
  if (!entries.length) {
    $("#gameStage").innerHTML = gameHeader(`<i class="fa-solid fa-table-cells"></i> Krossvord — "${esc(work.title)}"`, "Hali tayyor emas") +
      `<p class="muted">Bu asar uchun krossvord admin paneldan qo'shilishi kerak.</p>`;
    bindBack(backFn);
    return;
  }
  const layout = buildCrosswordLayout(entries);
  const cwState = { solvedWords: new Set(), completed: false };
  const stageEl = $("#gameStage");
  let html = gameHeader(`<i class="fa-solid fa-table-cells"></i> Krossvord — "${esc(work.title)}"`, "Savollarga qarab rangli katakchalarni to'ldiring");
  html += `<div class="cw-wrap"><div class="cw-board">`;
  html += renderCrosswordGridHtml(layout, { interactive: true, cellSize: 46 });
  html += `<button class="solid-btn cw-check-btn" id="cwCheck" type="button"><i class="fa-solid fa-check"></i> Tekshirish</button></div>`;
  html += renderCrosswordCluesHtml(layout.placed, { playMode: true });
  html += `</div>`;

  stageEl.innerHTML = html;
  bindBack(backFn);
  const checkCw = () => updateCrosswordWordStates(stageEl, layout, cwState, work);
  bindCrosswordInputs(stageEl, layout, { onProgress: checkCw });
  $("#cwCheck")?.addEventListener("click", () => {
    if (cwState.completed) return;
    checkCw();
    if (!cwState.completed) toast("Hali ba'zi so'zlar to'liq emas yoki noto'g'ri. Davom eting!");
  });
}

/* --- 8.3 PUZZLE (3x3 / 4x4 asar rasmi, drag & drop) --- */
function puzzleGridSize(work) {
  return work.grade >= 4 ? 4 : 3;
}

function puzzlePieceHtml(imgUrl, pieceIndex, pos, size, useImage, grad, emoji) {
  if (!useImage) {
    return `<div class="puzzle-piece puzzle-piece--fallback" draggable="true" data-pos="${pos}" style="background:${grad}" aria-label="Puzzle bo'lagi ${pos + 1}">
      <span class="puzzle-fallback-num">${pieceIndex + 1}</span>
    </div>`;
  }
  const c = pieceIndex % size;
  const r = Math.floor(pieceIndex / size);
  const span = size * 100;
  return `<div class="puzzle-piece" draggable="true" data-pos="${pos}" aria-label="Puzzle bo'lagi ${pos + 1}">
    <img class="puzzle-slice" src="${imgUrl}" alt="" draggable="false"
      style="width:${span}%;height:${span}%;left:${-c * 100}%;top:${-r * 100}%">
  </div>`;
}

function shufflePuzzleOrder(size) {
  const total = size * size;
  let order = Array.from({ length: total }, (_, i) => i);
  do {
    order = shuffle([...order]);
  } while (order.every((v, i) => v === i));
  return order;
}

function renderPuzzleResultPopup(work, moves) {
  const meta = getTestResultMeta(100);
  const imgUrl = workImgSrc(work.id);
  const grad = work.illustration?.gradient || "linear-gradient(135deg,#e6821e,#7b3f00)";
  const emoji = work.illustration?.emoji || "📖";
  return `
    <div class="test-result-popup test-result--${meta.tier}">
      <div class="test-result-badge" style="background:${meta.ring}">
        <span class="test-result-emoji" aria-hidden="true">${meta.emoji}</span>
        <i class="fa-solid fa-puzzle-piece test-result-fa" aria-hidden="true"></i>
      </div>
      <p class="test-result-tier">Puzzle yig'ildi!</p>
      <h2 class="test-result-pct" style="color:${meta.pctColor}">Ajoyib!</h2>
      <button type="button" class="puzzle-result-image" id="puzzleResultImg" aria-label="Rasmni to'liq ko'rish">
        <img class="puzzle-result-img" src="${imgUrl}" alt="${esc(work.title)} — yig'ilgan puzzle"
          onerror="this.closest('.puzzle-result-image').classList.add('puzzle-result-image--fallback');this.remove();">
        <span class="puzzle-result-expand"><i class="fa-solid fa-expand"></i> To'liq ko'rish</span>
        <div class="puzzle-result-fallback" style="background:${grad}">${emoji}</div>
      </button>
      <p class="test-result-score">"${esc(work.title)}" rasmi to'liq tiklandi</p>
      <p class="test-result-hint">${moves} ta harakatda muvaffaqiyatli yakunladingiz. +70 XP va 3 yulduz!</p>
      <div class="puzzle-result-actions">
        <button class="ghost-btn test-result-btn" id="puzzleViewFull" type="button">
          <i class="fa-solid fa-maximize"></i> Rasmni to'liq ko'rish
        </button>
        <button class="solid-btn test-result-btn" id="puzzleAgain" type="button">Qayta o'ynash</button>
        <button class="ghost-btn test-result-btn" id="puzzleBack" type="button">O'yinlarga qaytish</button>
      </div>
    </div>`;
}

function gamePuzzle(work, opts = {}) {
  const backFn = opts.backFn || renderPuzzlePicker;
  const imgUrl = workImgSrc(work.id);
  const size = puzzleGridSize(work);
  let order = shufflePuzzleOrder(size);
  let moves = 0;
  let dragFrom = null;
  let useImage = true;
  const gridLabel = `${size}×${size}`;

  function isSolved() {
    return order.every((v, i) => v === i);
  }

  function swapPieces(a, b) {
    if (a === b) return;
    [order[a], order[b]] = [order[b], order[a]];
    moves++;
  }

  function finishPuzzle() {
    addXP(70);
    addStars(3);
    completeDailyTaskSilent();
    unlockBadge("puzzle");
    $("#gameStage").innerHTML =
      gameHeader(
        `<i class="fa-solid fa-puzzle-piece"></i> Puzzle — "${esc(work.title)}"`,
        "Tabriklaymiz! Rasim to'g'ri yig'ildi"
      ) + renderPuzzleResultPopup(work, moves);
    bindBack(backFn);
    const openWinImage = () =>
      openImageFullscreen({
        imgUrl: workImgSrc(work.id),
        title: work.title,
        grad: work.illustration?.gradient || "linear-gradient(135deg,#e6821e,#7b3f00)",
        emoji: work.illustration?.emoji || "📖",
      });
    $("#puzzleResultImg")?.addEventListener("click", openWinImage);
    $("#puzzleViewFull")?.addEventListener("click", openWinImage);
    $("#puzzleAgain").addEventListener("click", () => gamePuzzle(work, { backFn }));
    $("#puzzleBack").addEventListener("click", renderGamesHub);
    if (typeof fireConfetti === "function") fireConfetti({ duration: 6500, perSide: 120 });
    scheduleSiteReveal($("#page-oyinlar"));
  }

  function bindDragDrop() {
    $$("#gameStage .puzzle-piece").forEach((el) => {
      el.addEventListener("dragstart", (e) => {
        dragFrom = +el.dataset.pos;
        el.classList.add("dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(dragFrom));
        }
      });
      el.addEventListener("dragend", () => {
        el.classList.remove("dragging");
        $$("#gameStage .puzzle-piece").forEach((p) => p.classList.remove("drag-over"));
        dragFrom = null;
      });
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        el.classList.add("drag-over");
      });
      el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        el.classList.remove("drag-over");
        const to = +el.dataset.pos;
        const from = dragFrom ?? +(e.dataTransfer?.getData("text/plain") ?? -1);
        if (from < 0 || from === to) return;
        swapPieces(from, to);
        if (isSolved()) finishPuzzle();
        else render();
      });
    });
  }

  function render(withReveal = false) {
    const grad = work.illustration?.gradient || "linear-gradient(135deg,#e6821e,#7b3f00)";
    const emoji = work.illustration?.emoji || "📖";
    const pieceHtml = order
      .map((piece, pos) => puzzlePieceHtml(imgUrl, piece, pos, size, useImage, grad, emoji))
      .join("");

    $("#gameStage").innerHTML =
      gameHeader(
        `<i class="fa-solid fa-puzzle-piece"></i> Puzzle — "${esc(work.title)}"`,
        `${gridLabel} bo'lak — sudrab, rasmini to'g'ri yig'ing (${work.grade}-sinf)`
      ) +
      `<div class="puzzle-layout">
        <div class="puzzle-grid puzzle-grid--${size}" id="pz"
          style="grid-template-columns:repeat(${size},1fr);grid-template-rows:repeat(${size},1fr)">${pieceHtml}</div>
        <div class="puzzle-preview">
          <div class="puzzle-preview-frame">
            <img class="puzzle-preview-img" src="${imgUrl}" alt="${esc(work.title)} — namuna"
              onerror="this.closest('.puzzle-preview').classList.add('puzzle-preview--fallback');this.remove();">
            <div class="puzzle-preview-fallback" style="background:${grad}">${emoji}</div>
          </div>
          <p class="muted">Namuna — rasim bo'laklarini shu tartibda yig'ing.</p>
          <p class="puzzle-moves"><i class="fa-solid fa-arrows-up-down-left-right"></i> Harakat: <b id="pzMoves">${moves}</b></p>
        </div>
      </div>`;

    bindBack(backFn);
    bindDragDrop();

    if (useImage) {
      const probe = new Image();
      probe.onerror = () => {
        useImage = false;
        render(false);
      };
      probe.src = imgUrl;
    }
    if (withReveal) scheduleSiteReveal($("#page-oyinlar"));
  }

  render(true);
}

/* --- 8.4 ASAR TOPISH --- */
function buildGuessWorkPool() {
  return TEXTBOOK_WORKS.filter((w) => String(w.moral || w.summary || "").trim().length > 12);
}

function buildGuessWorkRound(answerWork, pool) {
  const others = shuffle(pool.filter((w) => w.id !== answerWork.id));
  const options = shuffle([answerWork, ...others.slice(0, 3)]);
  const source = String(answerWork.moral || answerWork.summary || "").trim();
  const clueType = answerWork.moral ? "saboq" : "mazmun";
  const clue = source.length > 150 ? `${source.slice(0, 147)}…` : source;
  return { answerId: answerWork.id, clue, clueType, options };
}

function prepareGuessWorkRounds(count = 8) {
  const cfg = QuizGames.config?.guess || {};
  const pickCount = cfg.pickCount || count;
  const custom = (cfg.items || []).filter((i) => i.workId && i.clue && getWorkById(i.workId));
  if (custom.length >= 4) {
    const pool = buildGuessWorkPool();
    return shuffle(custom)
      .slice(0, Math.min(pickCount, custom.length))
      .map((item) => {
        const answerWork = getWorkById(item.workId);
        const others = shuffle(pool.filter((w) => w.id !== item.workId));
        return {
          answerId: item.workId,
          clue: item.clue,
          clueType: item.clueType || "saboq",
          options: shuffle([answerWork, ...others.slice(0, 3)]),
        };
      });
  }
  const pool = buildGuessWorkPool();
  if (pool.length < 4) return [];
  const rounds = shuffle(pool).slice(0, Math.min(count, pool.length));
  return rounds.map((w) => buildGuessWorkRound(w, pool));
}

function gameGuessWork() {
  QuizGames.load().then(() => gameGuessWorkRun());
}

function gameGuessWorkRun() {
  const rounds = prepareGuessWorkRounds(8);
  const stage = $("#gameStage");
  if (!rounds.length) {
    stage.innerHTML = `${gameHeader('<i class="fa-solid fa-book-open-reader"></i> Asar topish', "Asarlar bazasidan savollar")}
      <p class="muted">Hozircha bu o'yin uchun yetarli asar ma'lumoti yo'q.</p>`;
    bindBack();
    return;
  }

  let idx = 0;
  let score = 0;
  const total = rounds.length;

  function renderRound() {
    if (idx >= total) return finish();
    const round = rounds[idx];
    const pct = Math.round((idx / total) * 100);
    stage.innerHTML = `
      ${gameHeader('<i class="fa-solid fa-book-open-reader"></i> Asar topish', "Saboq yoki mazmundan to\'g\'ri asarni tanlang")}
      <div class="test-progress"><div style="width:${pct}%"></div></div>
      <div class="quiz-bar"><span>Savol ${idx + 1} / ${total}</span><span><i class="fa-solid fa-star" style="color:#f2a93b"></i> ${score}</span></div>
      <div class="guess-clue-box">
        <span class="guess-clue-tag">${round.clueType === "saboq" ? "Saboq" : "Mazmun"}</span>
        <p class="guess-clue-text">${esc(round.clue)}</p>
      </div>
      <p class="guess-prompt muted">Qaysi asarga tegishli?</p>
      <div class="guess-opts" id="guessOpts">${round.options.map((w) => {
        const v = getValueById(w.valueMain);
        return `<button type="button" class="guess-opt" data-id="${esc(w.id)}">
          ${renderTestItemThumb(w)}
          <span class="guess-opt-body">
            <strong>${esc(w.title)}</strong>
            <small>${esc(w.author || "Darslik")} · ${w.grade}-sinf</small>
            ${v ? `<span class="value-tag guess-opt-value" style="background:${v.color}"><i class="fa-solid ${v.icon}"></i> ${esc(v.name)}</span>` : ""}
          </span>
        </button>`;
      }).join("")}</div>`;
    bindBack();
    $$("#guessOpts .guess-opt").forEach((btn) => btn.addEventListener("click", () => {
      if (stage.dataset.locked) return;
      stage.dataset.locked = "1";
      const ok = btn.dataset.id === round.answerId;
      $$("#guessOpts .guess-opt").forEach((b) => {
        b.disabled = true;
        if (b.dataset.id === round.answerId) b.classList.add("correct");
        else if (b === btn) b.classList.add("wrong");
      });
      if (ok) score++;
      idx++;
      setTimeout(() => {
        delete stage.dataset.locked;
        renderRound();
      }, ok ? 700 : 950);
    }));
  }

  function finish() {
    const pct = Math.round((score / total) * 100);
    const xp = score * 20;
    addXP(xp);
    addStars(Math.max(1, Math.round(score / 2)));
    completeDailyTaskSilent();
    checkBadges();
    stage.innerHTML = `
      ${gameHeader('<i class="fa-solid fa-book-open-reader"></i> Asar topish', "Natija")}
      <div class="guess-result">
        <div class="guess-result-badge">${pct >= 75 ? "🏆" : pct >= 50 ? "⭐" : "📚"}</div>
        <h4>${pct >= 75 ? "Ajoyib!" : pct >= 50 ? "Yaxshi!" : "Yana urinib ko'ring!"}</h4>
        <p class="guess-result-score"><b>${score}</b> / ${total} to'g'ri · <b>${pct}%</b></p>
        <p class="muted">${xp} XP va ${Math.max(1, Math.round(score / 2))} yulduz qo'shildi.</p>
        <button type="button" class="solid-btn" id="guessAgain"><i class="fa-solid fa-rotate-right"></i> Qayta o'ynash</button>
      </div>`;
    bindBack();
    $("#guessAgain")?.addEventListener("click", gameGuessWork);
    if (pct >= 75 && typeof fireConfetti === "function") fireConfetti({ duration: 3200, perSide: 48 });
    toast(`${score}/${total} to'g'ri — +${xp} XP`, pct >= 50 ? "win" : "info");
  }

  renderRound();
}

/* --- 8.5 MUALLIFNI TOP --- */
function buildAuthorGuessPool() {
  return TEXTBOOK_WORKS.filter((w) => String(w.author || "").trim().length > 2);
}

function getAuthorGuessAuthors(pool) {
  return [...new Set(pool.map((w) => String(w.author).trim()))];
}

function buildAuthorGuessRound(answerWork, authors) {
  const correct = String(answerWork.author).trim();
  const distractors = shuffle(authors.filter((a) => a !== correct)).slice(0, 3);
  const options = shuffle([correct, ...distractors]);
  return { work: answerWork, answerAuthor: correct, options };
}

function prepareAuthorGuessRounds(count = 8) {
  const cfg = QuizGames.config?.author || {};
  const pickCount = cfg.pickCount || count;
  const customIds = (cfg.items || []).map((i) => i.workId).filter((id) => getWorkById(id));
  if (customIds.length >= 4) {
    const pool = buildAuthorGuessPool();
    const authors = getAuthorGuessAuthors(pool);
    const works = shuffle([...new Set(customIds)].map((id) => getWorkById(id)).filter(Boolean))
      .slice(0, Math.min(pickCount, customIds.length));
    return works.map((w) => buildAuthorGuessRound(w, authors));
  }
  const pool = buildAuthorGuessPool();
  const authors = getAuthorGuessAuthors(pool);
  if (pool.length < 4 || authors.length < 4) return [];
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map((w) => buildAuthorGuessRound(w, authors));
}

function gameGuessAuthor() {
  QuizGames.load().then(() => gameGuessAuthorRun());
}

function gameGuessAuthorRun() {
  const rounds = prepareAuthorGuessRounds(8);
  const stage = $("#gameStage");
  if (!rounds.length) {
    stage.innerHTML = `${gameHeader('<i class="fa-solid fa-pen-nib"></i> Muallifni top', "Asarlar bazasidan savollar")}
      <p class="muted">Kamida 4 xil muallif kerak — hozircha o'yin boshlanmaydi.</p>`;
    bindBack();
    return;
  }

  let idx = 0;
  let score = 0;
  const total = rounds.length;

  function renderRound() {
    if (idx >= total) return finish();
    const round = rounds[idx];
    const w = round.work;
    const v = getValueById(w.valueMain);
    const pct = Math.round((idx / total) * 100);
    stage.innerHTML = `
      ${gameHeader('<i class="fa-solid fa-pen-nib"></i> Muallifni top', "Asarning muallifini to\'g\'ri tanlang")}
      <div class="test-progress"><div style="width:${pct}%"></div></div>
      <div class="quiz-bar"><span>Savol ${idx + 1} / ${total}</span><span><i class="fa-solid fa-star" style="color:#f2a93b"></i> ${score}</span></div>
      <div class="author-work-card">
        ${renderTestItemThumb(w)}
        <div class="author-work-meta">
          <h4>${esc(w.title)}</h4>
          <p class="muted">${esc(w.genre || "asar")} · ${w.grade}-sinf${w.part ? ` · ${w.part}-qism` : ""}</p>
          ${v ? `<span class="value-tag" style="background:${v.color}"><i class="fa-solid ${v.icon}"></i> ${esc(v.name)}</span>` : ""}
        </div>
      </div>
      <p class="guess-prompt muted">Bu asarning muallifi kim?</p>
      <div class="author-opts" id="authorOpts">${round.options.map((name) =>
        `<button type="button" class="author-opt" data-author="${esc(name)}">${esc(name)}</button>`
      ).join("")}</div>`;
    bindBack();
    $$("#authorOpts .author-opt").forEach((btn) => btn.addEventListener("click", () => {
      if (stage.dataset.locked) return;
      stage.dataset.locked = "1";
      const ok = btn.dataset.author === round.answerAuthor;
      $$("#authorOpts .author-opt").forEach((b) => {
        b.disabled = true;
        if (b.dataset.author === round.answerAuthor) b.classList.add("correct");
        else if (b === btn) b.classList.add("wrong");
      });
      if (ok) score++;
      idx++;
      setTimeout(() => {
        delete stage.dataset.locked;
        renderRound();
      }, ok ? 700 : 950);
    }));
  }

  function finish() {
    const pct = Math.round((score / total) * 100);
    const xp = score * 20;
    addXP(xp);
    addStars(Math.max(1, Math.round(score / 2)));
    completeDailyTaskSilent();
    checkBadges();
    stage.innerHTML = `
      ${gameHeader('<i class="fa-solid fa-pen-nib"></i> Muallifni top', "Natija")}
      <div class="guess-result">
        <div class="guess-result-badge">${pct >= 75 ? "🏆" : pct >= 50 ? "⭐" : "📚"}</div>
        <h4>${pct >= 75 ? "Ajoyib!" : pct >= 50 ? "Yaxshi!" : "Yana urinib ko'ring!"}</h4>
        <p class="guess-result-score"><b>${score}</b> / ${total} to'g'ri · <b>${pct}%</b></p>
        <p class="muted">${xp} XP va ${Math.max(1, Math.round(score / 2))} yulduz qo'shildi.</p>
        <button type="button" class="solid-btn" id="authorAgain"><i class="fa-solid fa-rotate-right"></i> Qayta o'ynash</button>
      </div>`;
    bindBack();
    $("#authorAgain")?.addEventListener("click", gameGuessAuthor);
    if (pct >= 75 && typeof fireConfetti === "function") fireConfetti({ duration: 3200, perSide: 48 });
    toast(`${score}/${total} to'g'ri — +${xp} XP`, pct >= 50 ? "win" : "info");
  }

  renderRound();
}

/* --- 8.6 TO'G'RI / NOTO'G'RI --- */
function pickOtherWorkForTf(current, pool) {
  const others = pool.filter((w) => w.id !== current.id);
  return others.length ? others[rand(others.length)] : current;
}

function buildTrueFalseStatements(pool) {
  const out = [];
  const seen = new Set();
  const add = (text, isTrue, workId) => {
    const t = String(text || "").trim();
    if (t.length < 18 || t.length > 240 || seen.has(t)) return;
    seen.add(t);
    out.push({ text: t, isTrue, workId });
  };

  const genrePool = ["she'r", "hikoya", "ertak", "masal", "matn"];

  for (const w of pool) {
    const title = w.title;
    const other = () => pickOtherWorkForTf(w, pool);

    if (w.author) {
      add(`«${title}» asari muallifi — ${w.author}.`, true, w.id);
      const ow = other();
      if (ow.author && ow.author !== w.author) {
        add(`«${title}» asari muallifi — ${ow.author}.`, false, w.id);
      }
    }

    add(`«${title}» ${w.grade}-sinf darsligida o'qiladi.`, true, w.id);
    add(`«${title}» ${w.grade === 3 ? 4 : 3}-sinf darsligida o'qiladi.`, false, w.id);

    const v = getValueById(w.valueMain);
    if (v?.name) {
      add(`«${title}» asarining asosiy qadriyati — ${v.name}.`, true, w.id);
      const ov = getValueById(other().valueMain);
      if (ov?.name && ov.id !== v.id) {
        add(`«${title}» asarining asosiy qadriyati — ${ov.name}.`, false, w.id);
      }
    }

    if (w.genre) {
      add(`«${title}» — ${w.genre} janrida.`, true, w.id);
      const wrongGenre = genrePool.find((g) => g !== w.genre);
      if (wrongGenre) add(`«${title}» — ${wrongGenre} janrida.`, false, w.id);
    }

    if (w.moral) {
      const moralShort = w.moral.length > 120 ? `${w.moral.slice(0, 117)}…` : w.moral;
      add(`«${title}» saboqi: ${moralShort}`, true, w.id);
      const om = other().moral;
      if (om && om !== w.moral) {
        const omShort = om.length > 120 ? `${om.slice(0, 117)}…` : om;
        add(`«${title}» saboqi: ${omShort}`, false, w.id);
      }
    }

    for (const t of w.tests || []) {
      if (!t.q || !Array.isArray(t.options) || t.correct == null) continue;
      const correct = t.options[t.correct];
      if (!correct) continue;
      const qClean = String(t.q).replace(/\?+$/, "").trim();
      add(`«${title}»: ${qClean} — ${correct}.`, true, w.id);
      const wrongIdx = t.options.findIndex((_, i) => i !== t.correct);
      if (wrongIdx >= 0 && t.options[wrongIdx]) {
        add(`«${title}»: ${qClean} — ${t.options[wrongIdx]}.`, false, w.id);
      }
    }

    const kw = (w.keywords || []).find(Boolean);
    if (kw) {
      add(`«${title}» asarida «${kw}» mavzusi bor.`, true, w.id);
      const okw = (other().keywords || []).find(Boolean);
      if (okw && okw !== kw) {
        add(`«${title}» asarida «${okw}» mavzusi bor.`, false, w.id);
      }
    }
  }

  return out;
}

function prepareTrueFalseRounds(count = 10) {
  const cfg = QuizGames.config?.truefalse || {};
  const pickCount = cfg.pickCount || count;
  const custom = (cfg.items || []).filter((i) => String(i.text || "").trim().length >= 10);
  if (custom.length >= 4) {
    return shuffle(custom).slice(0, Math.min(pickCount, custom.length)).map((i) => ({
      text: i.text,
      isTrue: !!i.isTrue,
      workId: i.workId || null,
    }));
  }
  const pool = TEXTBOOK_WORKS.filter((w) => w.title && (w.tests?.length || w.author || w.moral));
  if (!pool.length) return [];
  const statements = buildTrueFalseStatements(pool);
  if (statements.length < 4) return [];
  return shuffle(statements).slice(0, Math.min(count, statements.length));
}

function gameTrueFalse() {
  QuizGames.load().then(() => gameTrueFalseRun());
}

function gameTrueFalseRun() {
  const rounds = prepareTrueFalseRounds(10);
  const stage = $("#gameStage");
  if (!rounds.length) {
    stage.innerHTML = `${gameHeader('<i class="fa-solid fa-scale-balanced"></i> To\'g\'ri / Noto\'g\'ri', "Asarlar bazasidan gaplar")}
      <p class="muted">Hozircha bu o'yin uchun yetarli ma'lumot yo'q.</p>`;
    bindBack();
    return;
  }

  let idx = 0;
  let score = 0;
  const total = rounds.length;

  function renderRound() {
    if (idx >= total) return finish();
    const round = rounds[idx];
    const w = round.workId ? getWorkById(round.workId) : null;
    const pct = Math.round((idx / total) * 100);
    stage.innerHTML = `
      ${gameHeader('<i class="fa-solid fa-scale-balanced"></i> To\'g\'ri / Noto\'g\'ri', "Gap to\'g\'ri yoki noto\'g\'ri ekanini tanlang")}
      <div class="test-progress"><div style="width:${pct}%"></div></div>
      <div class="quiz-bar"><span>Savol ${idx + 1} / ${total}</span><span><i class="fa-solid fa-star" style="color:#f2a93b"></i> ${score}</span></div>
      ${w ? `<div class="tf-work-tag">${renderTestItemThumb(w)}<span>${esc(w.title)}</span></div>` : ""}
      <div class="tf-statement-box">
        <p class="tf-statement-text">${esc(round.text)}</p>
      </div>
      <div class="tf-actions" id="tfActions">
        <button type="button" class="tf-btn tf-btn--true" data-ans="true"><i class="fa-solid fa-circle-check"></i> To'g'ri</button>
        <button type="button" class="tf-btn tf-btn--false" data-ans="false"><i class="fa-solid fa-circle-xmark"></i> Noto'g'ri</button>
      </div>`;
    bindBack();
    $$("#tfActions .tf-btn").forEach((btn) => btn.addEventListener("click", () => {
      if (stage.dataset.locked) return;
      stage.dataset.locked = "1";
      const picked = btn.dataset.ans === "true";
      const ok = picked === round.isTrue;
      $$("#tfActions .tf-btn").forEach((b) => {
        b.disabled = true;
        const bTrue = b.dataset.ans === "true";
        if (bTrue === round.isTrue) b.classList.add("correct");
        else if (b === btn) b.classList.add("wrong");
      });
      if (ok) score++;
      idx++;
      setTimeout(() => {
        delete stage.dataset.locked;
        renderRound();
      }, ok ? 650 : 900);
    }));
  }

  function finish() {
    const pct = Math.round((score / total) * 100);
    const xp = score * 18;
    addXP(xp);
    addStars(Math.max(1, Math.round(score / 2)));
    completeDailyTaskSilent();
    checkBadges();
    stage.innerHTML = `
      ${gameHeader('<i class="fa-solid fa-scale-balanced"></i> To\'g\'ri / Noto\'g\'ri', "Natija")}
      <div class="guess-result">
        <div class="guess-result-badge">${pct >= 75 ? "🏆" : pct >= 50 ? "⭐" : "📚"}</div>
        <h4>${pct >= 75 ? "Ajoyib!" : pct >= 50 ? "Yaxshi!" : "Yana urinib ko'ring!"}</h4>
        <p class="guess-result-score"><b>${score}</b> / ${total} to'g'ri · <b>${pct}%</b></p>
        <p class="muted">${xp} XP va ${Math.max(1, Math.round(score / 2))} yulduz qo'shildi.</p>
        <button type="button" class="solid-btn" id="tfAgain"><i class="fa-solid fa-rotate-right"></i> Qayta o'ynash</button>
      </div>`;
    bindBack();
    $("#tfAgain")?.addEventListener("click", gameTrueFalse);
    if (pct >= 75 && typeof fireConfetti === "function") fireConfetti({ duration: 3200, perSide: 48 });
    toast(`${score}/${total} to'g'ri — +${xp} XP`, pct >= 50 ? "win" : "info");
  }

  renderRound();
}

/* --- 8.7 QADRIYAT JUFTLASH --- */
async function resolveMatchGamePairs() {
  if (!MatchPairs.config?.pairs?.length) await MatchPairs.load();
  const cfg = MatchPairs.config || { pairs: [], pickCount: 5 };
  const pickN = cfg.pickCount || 5;
  const valid = (cfg.pairs || []).filter((p) => getWorkById(p.workId) && getValueById(p.valueId));
  if (valid.length >= 3) return shuffle(valid).slice(0, pickN);
  return shuffle(TEXTBOOK_WORKS)
    .slice(0, pickN)
    .map((w) => ({ workId: w.id, valueId: w.valueMain }));
}

function matchBoardPoint(board, el, side) {
  const br = board.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  const y = er.top + er.height / 2 - br.top;
  const x = side === "left" ? er.right - br.left : er.left - br.left;
  return { x, y };
}

function syncMatchSvg(svg, board) {
  const r = board.getBoundingClientRect();
  svg.setAttribute("width", String(Math.max(1, r.width)));
  svg.setAttribute("height", String(Math.max(1, r.height)));
}

function showMatchWinPopup(total) {
  const stage = $("#gameStage");
  const board = stage?.querySelector(".match-board");
  if (!board) return;
  if (typeof fireConfetti === "function") fireConfetti({ duration: 2800, perSide: 42 });
  const overlay = document.createElement("div");
  overlay.className = "match-win-overlay";
  overlay.innerHTML = `
    <div class="match-win-card">
      <div style="font-size:2.4rem;margin-bottom:8px">🎉</div>
      <h4>Tabriklaymiz!</h4>
      <p>Barcha ${total} ta juftni to'g'ri bog'ladingiz. Ajoyib ish!</p>
      <button type="button" class="solid-btn" id="matchWinClose"><i class="fa-solid fa-check"></i> Zo'r!</button>
    </div>`;
  board.appendChild(overlay);
  overlay.querySelector("#matchWinClose")?.addEventListener("click", () => overlay.remove());
  setTimeout(() => overlay.remove(), 8000);
}

async function gameMatch() {
  const pairs = await resolveMatchGamePairs();
  const left = pairs.map((p) => {
    const w = getWorkById(p.workId);
    return { workId: p.workId, answer: p.valueId, label: w?.title || p.workId };
  });
  const right = shuffle(
    pairs.map((p) => {
      const v = getValueById(p.valueId);
      return { valueId: p.valueId, label: v.name, color: v.color, icon: v.icon };
    })
  );

  let doneCount = 0;
  let dragFrom = null;
  let tempLine = null;
  let activePointer = null;

  const leftHtml = left
    .map(
      (x) =>
        `<div class="match-item match-work" data-work-id="${esc(x.workId)}" data-answer="${esc(x.answer)}" role="button" tabindex="0">${esc(x.label)}</div>`
    )
    .join("");
  const rightHtml = right
    .map(
      (x) =>
        `<div class="match-item match-value" data-value-id="${esc(x.valueId)}" style="border-left-color:${esc(x.color)}" role="button" tabindex="0"><i class="fa-solid ${esc(x.icon)}" style="color:${esc(x.color)};margin-right:6px"></i>${esc(x.label)}</div>`
    )
    .join("");

  $("#gameStage").innerHTML =
    gameHeader('<i class="fa-solid fa-link"></i> Qadriyat juftlash', "Asarni qadriyatga ulang") +
    `<p class="match-hint"><i class="fa-solid fa-hand-pointer"></i> Asarni bosib ushlab, mos qadriyatga torting va qo'yib yuboring.</p>
    <div class="match-board" id="matchBoard">
      <svg class="match-lines-svg" id="matchLinesSvg" aria-hidden="true"></svg>
      <div class="match-columns">
        <div class="match-col-wrap">
          <h4 class="match-col-title"><i class="fa-solid fa-book"></i> Asar</h4>
          <div class="match-col" id="mLeft">${leftHtml}</div>
        </div>
        <div class="match-col-wrap">
          <h4 class="match-col-title match-col-title--value"><i class="fa-solid fa-seedling"></i> Qadriyat</h4>
          <div class="match-col" id="mRight">${rightHtml}</div>
        </div>
      </div>
    </div>`;

  bindBack();
  const board = $("#matchBoard");
  const svg = $("#matchLinesSvg");
  if (!board || !svg) return;

  const resize = () => syncMatchSvg(svg, board);
  resize();
  window.addEventListener("resize", resize);

  function clientToBoard(x, y) {
    const br = board.getBoundingClientRect();
    return { x: x - br.left, y: y - br.top };
  }

  function setTempLine(x2, y2) {
    if (!dragFrom) return;
    const p1 = matchBoardPoint(board, dragFrom.el, "left");
    if (!tempLine) {
      tempLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tempLine.classList.add("match-line", "match-line--temp");
      svg.appendChild(tempLine);
    }
    tempLine.setAttribute("x1", p1.x);
    tempLine.setAttribute("y1", p1.y);
    tempLine.setAttribute("x2", x2);
    tempLine.setAttribute("y2", y2);
  }

  function clearTempLine() {
    tempLine?.remove();
    tempLine = null;
  }

  function drawPermanentLine(fromEl, toEl) {
    const p1 = matchBoardPoint(board, fromEl, "left");
    const p2 = matchBoardPoint(board, toEl, "right");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("match-line", "match-line--ok");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    svg.appendChild(line);
  }

  function flashBadLine(fromEl, toEl) {
    const p1 = matchBoardPoint(board, fromEl, "left");
    const p2 = matchBoardPoint(board, toEl, "right");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add("match-line", "match-line--bad");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    svg.appendChild(line);
    setTimeout(() => line.remove(), 700);
  }

  function finishDrag(toEl) {
    if (!dragFrom) return;
    const fromEl = dragFrom.el;
    clearTempLine();
    fromEl.classList.remove("match-dragging");
    dragFrom = null;

    if (!toEl?.classList.contains("match-value") || toEl.classList.contains("match-done")) return;

    const answer = fromEl.dataset.answer;
    const picked = toEl.dataset.valueId;
    if (answer === picked) {
      fromEl.classList.add("match-done");
      toEl.classList.add("match-done");
      drawPermanentLine(fromEl, toEl);
      addXP(15, true);
      doneCount++;
      if (doneCount >= pairs.length) {
        addStars(2);
        completeDailyTaskSilent();
        renderProfile();
        showMatchWinPopup(pairs.length);
      }
    } else {
      flashBadLine(fromEl, toEl);
      toEl.classList.add("match-dragging");
      setTimeout(() => toEl.classList.remove("match-dragging"), 400);
    }
  }

  function onPointerMove(e) {
    if (!dragFrom) return;
    const pt = clientToBoard(e.clientX, e.clientY);
    setTempLine(pt.x, pt.y);
  }

  function onPointerUp(e) {
    if (!dragFrom) return;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const toEl = target?.closest?.(".match-value");
    finishDrag(toEl);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    activePointer = null;
  }

  $$("#mLeft .match-work").forEach((el) => {
    el.addEventListener("pointerdown", (e) => {
      if (el.classList.contains("match-done") || activePointer != null) return;
      e.preventDefault();
      activePointer = e.pointerId;
      el.setPointerCapture?.(e.pointerId);
      dragFrom = { el };
      el.classList.add("match-dragging");
      const pt = clientToBoard(e.clientX, e.clientY);
      setTempLine(pt.x, pt.y);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });
  });
}

/* --- 8.6 BILIM XARITASI --- */
function gameMap() {
  $("#gameStage").innerHTML = gameHeader('<i class="fa-solid fa-map-location-dot"></i> Bilim xaritasi', "O'zbekiston viloyatlari bo'ylab sayohat") +
    `<div class="map-grid" id="regionGrid">${MAP_REGIONS.map((r) => {
      const visited = Store.data.visitedRegions.some((v) => normalizeRegionId(v) === r.id);
      const v = getValueById(r.value);
      return `<div class="region-card ${visited ? "visited" : ""}" data-region="${r.id}">
        <div class="r-emoji">${r.emoji}</div>
        <h4>${r.name}</h4>
        <span class="value-tag" style="background:${v.color};font-size:0.68rem"><i class="fa-solid ${v.icon}"></i> ${v.name}</span>
      </div>`;
    }).join("")}</div>`;
  bindBack();
  $$("#regionGrid .region-card").forEach((el) => el.addEventListener("click", () => openRegion(el.dataset.region)));
}

function openRegion(id) {
  const norm = normalizeRegionId(id);
  const r = getMapRegionById(norm);
  if (!r) return;
  const v = getValueById(r.value);
  const work = r.workId ? getWorkById(r.workId) : null;
  markRegionVisited(norm);
  refreshHomeMapPins();
  updateHomeMapProgress();
  if (homeMapSelectedId !== norm) selectHomeRegion(norm, { silent: true });

  openModal(`
    <div class="region-modal">
      <div class="modal-hero region-modal-hero" style="background:linear-gradient(135deg,${v.color},${shade(v.color)})">${r.emoji}</div>
      <div class="modal-inner">
        <h2>${esc(r.name)}</h2>
        <span class="value-tag" style="background:${v.color}"><i class="fa-solid ${v.icon}"></i> ${esc(v.name)}</span>
        <p class="summary-text" style="margin-top:14px">${esc(r.story)}</p>
        ${r.tale ? `<div class="moral-box"><i class="fa-solid fa-book-open"></i> <b>Ertak / hikoya:</b> ${esc(r.tale)}</div>` : ""}
        ${r.tradition ? `<div class="moral-box" style="background:rgba(47,134,214,0.08)"><i class="fa-solid fa-landmark"></i> <b>An'ana:</b> ${esc(r.tradition)}</div>` : ""}
        <div class="moral-box"><i class="fa-solid fa-circle-info"></i> <b>Bilasizmi?</b> ${esc(r.fact)}</div>
        <div class="region-modal-actions">
          ${work ? `<button type="button" class="solid-btn" id="regionOpenWork"><i class="fa-solid fa-book-open"></i> "${esc(work.title)}" asarini o'qish</button>` : ""}
          <button type="button" class="ghost-btn" id="regionOpenValue"><i class="fa-solid fa-seedling"></i> ${esc(v.name)} qadriyatini o'rganish</button>
        </div>
      </div>
    </div>
  `);
  $("#regionOpenWork")?.addEventListener("click", () => {
    closeModal();
    openWorkModal(work.id);
  });
  $("#regionOpenValue")?.addEventListener("click", () => {
    closeModal();
    openValueLesson(r.value);
  });
}

/* ====================== 9. TESTLAR + SERTIFIKAT ====================== */
function getTestResultMeta(pct) {
  if (pct >= 90) {
    return {
      tier: "alo",
      label: "A'lo natija!",
      hint: "Ajoyib! Asarni juda yaxshi o'zlashtirdingiz!",
      icon: "fa-trophy",
      emoji: "🏆",
      ring: "linear-gradient(135deg, #ffd76b, #e6821e)",
      pctColor: "#2e8a4f",
    };
  }
  if (pct >= 75) {
    return {
      tier: "yaxshi",
      label: "Yaxshi natija!",
      hint: "Zo'r ish! Yana biroz mashq qilsangiz, a'lo darajaga yetasiz.",
      icon: "fa-star",
      emoji: "⭐",
      ring: "linear-gradient(135deg, #7ed56f, #2e8a4f)",
      pctColor: "#2e8a4f",
    };
  }
  if (pct >= 50) {
    return {
      tier: "qoniqarli",
      label: "Qoniqarli natija",
      hint: "Yaxshi boshlang'ich! Asarni qayta o'qib, bilimingizni mustahkamlang.",
      icon: "fa-thumbs-up",
      emoji: "👍",
      ring: "linear-gradient(135deg, #6eb5ff, #2f86d6)",
      pctColor: "#2f86d6",
    };
  }
  return {
    tier: "qoniqarsiz",
    label: "Qoniqarsiz natija",
    hint: "Xafa bo'lmang! Asarni diqqat bilan o'qib, qayta urinib ko'ring.",
    icon: "fa-book-open",
    emoji: "📖",
    ring: "linear-gradient(135deg, #f0a0b8, #c2456b)",
    pctColor: "#c2456b",
  };
}

function renderTestResultPopup(pct, score, total, workTitle, passed, certDate) {
  const meta = getTestResultMeta(pct);
  const certBlock = passed ? `
    <div class="cert test-result-cert">
      <div class="cert-seal"><i class="fa-solid fa-award"></i></div>
      <small class="muted">QADRIYATLAR KALEDASKOPI</small>
      <h2>Sertifikat</h2>
      <p>Ushbu sertifikat</p>
      <div class="cert-name">${esc(Store.data.name)}</div>
      <p>"${esc(workTitle)}" asari bo'yicha testni</p>
      <p><b style="color:#2e8a4f;font-size:1.15rem">${pct}%</b> natija bilan muvaffaqiyatli yakunlagani uchun beriladi.</p>
      <div class="cert-line"></div>
      <small class="muted">${certDate || ""} · Bilimdon Bobo muhri</small>
    </div>` : `
    <p class="test-result-fail muted">Sertifikat uchun kamida <b>60%</b> kerak. Asarni qayta o'qib, urinib ko'ring!</p>`;

  return `
    <div class="test-result-popup test-result--${meta.tier}">
      <div class="test-result-badge" style="background:${meta.ring}">
        <span class="test-result-emoji" aria-hidden="true">${meta.emoji}</span>
        <i class="fa-solid ${meta.icon} test-result-fa" aria-hidden="true"></i>
      </div>
      <p class="test-result-tier">${meta.label}</p>
      <h2 class="test-result-pct" style="color:${meta.pctColor}">Natija: ${pct}%</h2>
      <p class="test-result-score">${score} / ${total} to'g'ri javob</p>
      <p class="test-result-hint">${meta.hint}</p>
      ${certBlock}
      <button class="solid-btn test-result-btn" id="testAgain" type="button">${passed ? "Boshqa test" : "Qayta urinish"}</button>
    </div>`;
}
function renderTestPicker() {
  $("#testStage").hidden = true;
  $("#testPicker").hidden = false;
  $("#testPicker").innerHTML = TEXTBOOK_WORKS.map((w) => {
    const best = Store.data.completedTests[w.id];
    return `<div class="test-item" data-work="${w.id}">
      ${renderTestItemThumb(w)}
      <div>
        <h4>${esc(w.title)}</h4>
        <small>${w.tests.length} savol · ${w.grade}-sinf${best != null ? ` · <b style="color:#2e8a4f">Eng yaxshi: ${best}%</b>` : ""}</small>
      </div>
    </div>`;
  }).join("");
  $$("#testPicker .test-item").forEach((el) => el.addEventListener("click", () => runTest(el.dataset.work)));
}

function runTest(workId) {
  const w = getWorkById(workId);
  $("#testPicker").hidden = true;
  const stage = $("#testStage");
  stage.hidden = false;
  const questions = prepareQuiz([...w.tests]);
  let idx = 0, score = 0;
  const total = questions.length;

  function render() {
    if (idx >= total) return finish();
    const t = questions[idx];
    const pct = Math.round((idx / total) * 100);
    stage.innerHTML = `
      <div class="stage-head"><h3>${esc(w.title)} — test</h3>
      <button class="back-btn" id="testBack"><i class="fa-solid fa-arrow-left"></i> Orqaga</button></div>
      <div class="test-progress"><div style="width:${pct}%"></div></div>
      <div class="quiz-bar"><span>Savol ${idx + 1} / ${total}</span><span><i class="fa-solid fa-star" style="color:#f2a93b"></i> ${score}</span></div>
      <p class="quiz-q">${esc(t.q)}</p>
      <div class="quiz-opts">${t.options.map((o, oi) => `<button class="quiz-opt" data-oi="${oi}">${esc(o)}</button>`).join("")}</div>`;
    $("#testBack").addEventListener("click", renderTestPicker);
    $$("#testStage .quiz-opt").forEach((btn) => btn.addEventListener("click", () => {
      $$("#testStage .quiz-opt").forEach((b) => (b.disabled = true));
      const oi = +btn.dataset.oi;
      if (oi === t.correct) { btn.classList.add("correct"); score++; }
      else { btn.classList.add("wrong"); $$("#testStage .quiz-opt")[t.correct].classList.add("correct"); }
      idx++;
      setTimeout(render, 850);
    }));
  }

  function finish() {
    const pct = Math.round((score / total) * 100);
    const prev = Store.data.completedTests[workId] || 0;
    if (pct > prev) Store.data.completedTests[workId] = pct;
    const xp = score * 25;
    addXP(xp); addStars(score); completeDailyTaskSilent(); checkBadges();
    Store.save();

    const passed = pct >= 60;
    let certDate = "";
    if (passed) {
      const cert = { work: w.title, percent: pct, date: new Date().toISOString().slice(0, 10) };
      certDate = cert.date;
      if (!Store.data.certificates.some((c) => c.work === w.title && c.percent >= pct)) {
        Store.data.certificates = Store.data.certificates.filter((c) => c.work !== w.title);
        Store.data.certificates.push(cert);
        Store.save();
      }
    }

    stage.innerHTML = `
      <div class="stage-head"><h3>Test yakunlandi</h3>
      <button class="back-btn" id="testBack"><i class="fa-solid fa-arrow-left"></i> Testlarga qaytish</button></div>
      ${renderTestResultPopup(pct, score, total, w.title, passed, certDate)}`;
    $("#testBack").addEventListener("click", renderTestPicker);
    $("#testAgain").addEventListener("click", () => passed ? renderTestPicker() : runTest(workId));
    if (pct > 75 && typeof fireConfetti === "function") {
      fireConfetti({ duration: 6500, perSide: 120 });
    }
  }
  render();
}

/* ====================== 10. YUTUQLAR / REYTING ====================== */
function renderLbAvatar(row) {
  const img = row.avatarImg || row.avatar_img;
  if (img) {
    const safeSrc = String(img).replace(/"/g, "&quot;");
    return `<span class="lb-ava lb-ava-img"><img src="${safeSrc}" alt="" loading="lazy"></span>`;
  }
  return `<span class="lb-ava">${row.avatar || "🧒"}</span>`;
}

function buildLocalLeaderboard() {
  const users = Auth.users();
  const current = Auth.current();
  const rows = Object.entries(users).map(([username, acc]) => {
    let xp = 0;
    try {
      const raw = localStorage.getItem(PROGRESS_PREFIX + username);
      if (raw) xp = JSON.parse(raw).xp || 0;
    } catch (e) { /* ignore */ }
    const lv = getLevel(xp);
    return {
      username,
      name: acc.name,
      grade: acc.grade,
      xp,
      avatar: acc.avatar,
      avatarImg: acc.avatarImg || null,
      level: lv.level,
      levelName: lv.info.name,
      levelEmoji: lv.info.emoji,
      me: username === current,
    };
  });
  if (current) {
    const meRow = rows.find((r) => r.me);
    if (meRow) {
      meRow.name = Store.data.name;
      meRow.grade = Store.data.grade;
      meRow.xp = Store.data.xp;
      meRow.avatar = Store.data.avatar;
      meRow.avatarImg = Store.data.avatarImg;
      meRow.displayName = Store.data.name + " (Siz)";
    } else {
      const lv = getLevel(Store.data.xp);
      rows.push({
        username: current,
        name: Store.data.name,
        displayName: Store.data.name + " (Siz)",
        grade: Store.data.grade,
        xp: Store.data.xp,
        avatar: Store.data.avatar,
        avatarImg: Store.data.avatarImg,
        level: lv.level,
        levelName: lv.info.name,
        levelEmoji: lv.info.emoji,
        me: true,
      });
    }
  }
  return rows.sort((a, b) => b.xp - a.xp);
}

async function loadLeaderboard() {
  if (Api.online) {
    try {
      const rows = await Api.fetchLeaderboard();
      const current = Auth.current() || Api.username;
      return rows.map((r) => ({
        ...r,
        me: r.username === current,
        displayName: r.username === current ? r.name + " (Siz)" : r.name,
      }));
    } catch (e) {
      console.warn("Reyting API xatoligi, lokal rejimga o'tildi", e);
    }
  }
  return buildLocalLeaderboard().map((r) => ({
    ...r,
    displayName: r.displayName || (r.me ? r.name + " (Siz)" : r.name),
  }));
}

async function renderAchievements() {
  renderProfile();
  $("#badgeGrid").innerHTML = BADGES.map((b) => {
    const got = Store.data.badges.includes(b.id);
    return `<div class="badge ${got ? "" : "locked"}" title="${esc(b.desc)}">
      <div class="b-ico"><i class="fa-solid ${b.icon}"></i></div>
      <b>${b.name}</b><small>${got ? "Ochildi ✓" : "+" + b.xp + " XP"}</small>
    </div>`;
  }).join("");

  $("#leaderboard").innerHTML = `<li class="lb-row muted" style="justify-content:center">Reyting yuklanmoqda...</li>`;
  const board = await loadLeaderboard();
  $("#leaderboard").innerHTML = board.length ? board.map((row, i) => `
    <li class="lb-row ${row.me ? "me" : ""}">
      <span class="lb-rank ${i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""}">${i + 1}</span>
      ${renderLbAvatar(row)}
      <span class="lb-name">${esc(row.displayName || row.name)} <small>${row.grade}-sinf · ${row.levelEmoji || ""} ${esc(row.levelName || "")}</small></span>
      <span class="lb-xp">${row.xp} XP</span>
    </li>`).join("")
    : `<li class="lb-row muted" style="justify-content:center">Hali reytingda o'quvchi yo'q. Ro'yxatdan o'ting!</li>`;

  const certs = Store.data.certificates;
  $("#certList").innerHTML = certs.length ? certs.map((c) => `
    <div class="cert-mini"><b><i class="fa-solid fa-award" style="color:#e6821e"></i> ${esc(c.work)}</b>
    <small>Natija: ${c.percent}% · ${c.date}</small></div>`).join("")
    : `<p class="muted">Hali sertifikat yo'q. Testlardan kamida 60% to'plang va birinchi sertifikatingizni qo'lga kiriting!</p>`;
}

/* ====================== 11. ADMIN PANEL ====================== */
let teacherCharts = {};
let adminDashCache = null;
let adminIjodCache = [];
let adminCustomWorks = [];
let adminWorkEditId = null;
let adminWorkEditImageBase64 = null;
let adminPasswordsVisible = false;
let adminStudentEditId = null;
let adminStudentWarnId = null;
let adminValuesCatalog = { values: [], overrides: {}, hiddenIds: [] };
let adminValueEditId = null;
let adminValueEditIsTextbook = false;
let adminValueLinkedIds = [];
let adminValueInitialLinked = new Set();
let adminValueReassign = {};

function countWorksForValue(valueId) {
  return TEXTBOOK_WORKS.filter((w) => w.valueMain === valueId || (w.values || []).includes(valueId)).length;
}

function getWorksForValue(valueId) {
  return TEXTBOOK_WORKS.filter((w) => w.valueMain === valueId || (w.values || []).includes(valueId));
}

function rebuildValuesCatalog(catalog) {
  adminValuesCatalog = catalog || { values: [], overrides: {}, hiddenIds: [] };
  const hidden = new Set(adminValuesCatalog.hiddenIds || []);
  VALUES.length = 0;
  BASE_VALUES_SNAPSHOT.forEach((base) => {
    if (hidden.has(base.id)) return;
    const patch = adminValuesCatalog.overrides?.[base.id];
    VALUES.push(patch ? { ...base, ...patch, textbook: true } : { ...base, textbook: true });
  });
  (adminValuesCatalog.values || []).forEach((v) => {
    const idx = VALUES.findIndex((x) => x.id === v.id);
    if (idx >= 0) VALUES[idx] = { ...v, custom: true };
    else VALUES.push({ ...v, custom: true });
  });
  renderAboutStats();
  refreshValueSelects();
  if (typeof buildBotKnowledge === "function") {
    window.BOT_KNOWLEDGE = buildBotKnowledge();
  }
}

async function loadValuesIntoCatalog() {
  if (!Api.online) {
    rebuildValuesCatalog({ values: [], overrides: {}, hiddenIds: [] });
    return;
  }
  try {
    const catalog = await TeacherApi.fetchValuesCatalog();
    rebuildValuesCatalog(catalog);
  } catch {
    try {
      const res = await fetch("/api/values/catalog", { cache: "no-store" });
      if (res.ok) rebuildValuesCatalog(await res.json());
    } catch { /* ignore */ }
  }
}

function refreshValueSelects() {
  const opts = VALUES.map((v) => `<option value="${v.id}">${esc(v.name)}</option>`).join("");
  ["#valueFilter", "#ijodValueFilter"].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = '<option value="">Barcha qadriyatlar</option>' + opts;
    if (prev && [...el.options].some((o) => o.value === prev)) el.value = prev;
  });
  ["#adminWorkValue", "#adminWorkEditValue"].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = opts;
    if (prev && [...el.options].some((o) => o.value === prev)) el.value = prev;
  });
}

function renderAboutStats() {
  const host = $("#aboutStats");
  if (!host) return;
  const regionCount = typeof REGIONS !== "undefined" ? REGIONS.length : 13;
  host.innerHTML = `
    <div class="about-stat"><b>${TEXTBOOK_WORKS.length}</b><span>Badiiy asar</span></div>
    <div class="about-stat"><b>${VALUES.length}</b><span>Milliy qadriyat</span></div>
    <div class="about-stat"><b>${regionCount}</b><span>Viloyat xaritasi</span></div>
    <div class="about-stat"><b>∞</b><span>Ilhom va ijod</span></div>`;
}

function isTextbookValueId(id) {
  return BASE_VALUES_SNAPSHOT.some((v) => v.id === id);
}

function renderAdminValuesTable() {
  const table = $("#adminValuesTable");
  if (!table) return;
  const hidden = new Set(adminValuesCatalog.hiddenIds || []);
  const rows = [];
  BASE_VALUES_SNAPSHOT.forEach((base) => {
    if (hidden.has(base.id)) return;
    const v = VALUES.find((x) => x.id === base.id) || base;
    rows.push({ ...v, textbook: true });
  });
  (adminValuesCatalog.values || []).forEach((v) => {
    if (!rows.some((r) => r.id === v.id)) rows.push({ ...v, custom: true });
  });
  if (!rows.length) {
    table.innerHTML = `<tbody><tr><td class="muted">Qadriyat yo'q</td></tr></tbody>`;
    return;
  }
  table.innerHTML = `<thead><tr>
    <th>Qadriyat</th><th>Tavsif</th><th>Asarlar</th><th>Amallar</th>
  </tr></thead><tbody>${rows.map((v) => {
    const wc = countWorksForValue(v.id);
    const kind = v.custom ? `<span class="admin-badge-custom">Yangi</span>` : `<span class="admin-badge-textbook">Asosiy</span>`;
    return `<tr data-val-id="${esc(v.id)}" data-val-textbook="${v.textbook ? "1" : ""}">
      <td><span class="admin-value-swatch" style="background:${esc(v.color)}"></span> <b>${esc(v.name)}</b> ${kind}</td>
      <td><small class="muted">${esc((v.desc || "").slice(0, 80))}${(v.desc || "").length > 80 ? "…" : ""}</small></td>
      <td>${wc} ta</td>
      <td class="admin-actions">
        <button type="button" class="ghost-btn admin-mini-btn" data-val-edit="${esc(v.id)}" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="ghost-btn admin-mini-btn admin-danger" data-val-del="${esc(v.id)}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }).join("")}</tbody>`;
  table.querySelectorAll("[data-val-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openAdminValueEditor(btn.dataset.valEdit));
  });
  table.querySelectorAll("[data-val-del]").forEach((btn) => {
    btn.addEventListener("click", () => deleteAdminValue(btn.dataset.valDel));
  });
}

function closeAdminValueEditor() {
  const modal = $("#adminValueModal");
  if (modal) modal.hidden = true;
  adminValueEditId = null;
  adminValueLinkedIds = [];
  adminValueInitialLinked = new Set();
  adminValueReassign = {};
}

function defaultReassignValueId(excludeId) {
  return VALUES.find((v) => v.id !== excludeId)?.id || "halollik";
}

function renderAdminValueWorksEditor() {
  const worksBox = $("#adminValueEditWorks");
  if (!worksBox || !adminValueEditId) return;

  const valueId = adminValueEditId;
  const linkedItems = adminValueLinkedIds
    .map((id) => getWorkById(id))
    .filter(Boolean);

  const available = TEXTBOOK_WORKS.filter((w) => !adminValueLinkedIds.includes(w.id));
  const pendingReassign = Object.keys(adminValueReassign).filter(
    (id) => !adminValueLinkedIds.includes(id) && adminValueInitialLinked.has(id)
  );

  const valueOptions = (selId) =>
    VALUES.map((v) => `<option value="${esc(v.id)}"${v.id === selId ? " selected" : ""}>${esc(v.name)}</option>`).join("");

  worksBox.innerHTML = `
    <div class="admin-value-works-editor">
      <div class="admin-value-works-head">
        <p class="admin-field-label">Bog'langan asarlar (${linkedItems.length})</p>
        <p class="admin-field-hint">Asarni qo'shing yoki olib tashlang. Asosiy qadriyati bu bo'lgan asar olib tashlansa, yangi qadriyat tanlang.</p>
      </div>
      ${linkedItems.length ? `<ul class="admin-value-work-edit-list">${linkedItems.map((w) => {
        const isMain = w.valueMain === valueId;
        return `<li class="admin-value-work-edit-item">
          <div class="admin-value-work-edit-meta">
            <b>${esc(w.title)}</b>
            <small class="muted">${w.grade}-sinf · ${esc(w.author || "Darslik")}</small>
            ${isMain ? `<span class="admin-value-work-tag">Asosiy qadriyat</span>` : `<span class="admin-value-work-tag admin-value-work-tag--extra">Qo'shimcha</span>`}
          </div>
          <button type="button" class="ghost-btn admin-mini-btn admin-danger" data-val-work-del="${esc(w.id)}" title="Olib tashlash"><i class="fa-solid fa-xmark"></i></button>
        </li>`;
      }).join("")}</ul>` : `<p class="muted admin-value-works-empty">Hozircha asar bog'lanmagan.</p>`}
      ${pendingReassign.length ? `<div class="admin-value-reassign-block">
        <p class="admin-field-label">Yangi qadriyat tanlang</p>
        <p class="admin-field-hint">Olib tashlangan asarning asosiy qadriyati o'zgartiriladi.</p>
        ${pendingReassign.map((workId) => {
          const w = getWorkById(workId);
          if (!w) return "";
          return `<label class="admin-value-reassign-row">
            <span>${esc(w.title)}</span>
            <select class="filter-select admin-value-reassign-select" data-reassign-work="${esc(workId)}">${valueOptions(adminValueReassign[workId])}</select>
          </label>`;
        }).join("")}
      </div>` : ""}
      <div class="admin-value-work-add">
        <select id="adminValueAddWorkSelect" class="filter-select"${available.length ? "" : " disabled"}>
          ${available.length
            ? `<option value="">— Asar tanlang —</option>${available.map((w) => `<option value="${esc(w.id)}">${esc(w.title)} (${w.grade}-sinf)</option>`).join("")}`
            : `<option value="">Barcha asarlar bog'langan</option>`}
        </select>
        <button type="button" class="ghost-btn admin-form-btn" id="adminValueAddWorkBtn"${available.length ? "" : " disabled"}><i class="fa-solid fa-plus"></i> Asar qo'shish</button>
      </div>
    </div>`;

  worksBox.querySelectorAll("[data-val-work-del]").forEach((btn) => {
    btn.addEventListener("click", () => removeAdminValueLinkedWork(btn.dataset.valWorkDel));
  });
  worksBox.querySelectorAll(".admin-value-reassign-select").forEach((sel) => {
    sel.addEventListener("change", () => {
      adminValueReassign[sel.dataset.reassignWork] = sel.value;
    });
  });
  $("#adminValueAddWorkBtn")?.addEventListener("click", addAdminValueLinkedWork);
}

function addAdminValueLinkedWork() {
  const sel = $("#adminValueAddWorkSelect");
  const workId = sel?.value;
  if (!workId || adminValueLinkedIds.includes(workId)) return;
  adminValueLinkedIds.push(workId);
  delete adminValueReassign[workId];
  renderAdminValueWorksEditor();
}

function removeAdminValueLinkedWork(workId) {
  adminValueLinkedIds = adminValueLinkedIds.filter((id) => id !== workId);
  const w = getWorkById(workId);
  if (w?.valueMain === adminValueEditId) {
    adminValueReassign[workId] = adminValueReassign[workId] || defaultReassignValueId(adminValueEditId);
  } else {
    delete adminValueReassign[workId];
  }
  renderAdminValueWorksEditor();
}

async function syncAdminValueWorkLinks(valueId) {
  const toLink = adminValueLinkedIds.filter(Boolean);
  const initial = [...adminValueInitialLinked];
  const errors = [];

  for (const workId of toLink) {
    const w = getWorkById(workId);
    if (!w) continue;
    const extras = (w.values || []).filter((v) => v !== valueId && v !== w.valueMain);
    const res = await TeacherApi.updateWork(workId, {
      valueMain: valueId,
      values: [valueId, ...extras].filter((v, i, a) => a.indexOf(v) === i),
    });
    if (!res.ok) errors.push(w.title);
  }

  for (const workId of initial) {
    if (toLink.includes(workId)) continue;
    const w = getWorkById(workId);
    if (!w) continue;
    if (w.valueMain === valueId) {
      const newMain = adminValueReassign[workId] || defaultReassignValueId(valueId);
      const extras = (w.values || []).filter((v) => v !== valueId && v !== newMain);
      const res = await TeacherApi.updateWork(workId, {
        valueMain: newMain,
        values: [newMain, ...extras].filter((v, i, a) => a.indexOf(v) === i),
      });
      if (!res.ok) errors.push(w.title);
    } else {
      const newValues = (w.values || []).filter((v) => v !== valueId);
      const res = await TeacherApi.updateWork(workId, {
        values: newValues.length ? newValues : [w.valueMain],
      });
      if (!res.ok) errors.push(w.title);
    }
  }

  return errors;
}

function openAdminValueEditor(valueId) {
  const v = VALUES.find((x) => x.id === valueId);
  if (!v) return;
  adminValueEditId = valueId;
  adminValueEditIsTextbook = isTextbookValueId(valueId) && !v.custom;
  adminValueLinkedIds = getWorksForValue(valueId).map((w) => w.id);
  adminValueInitialLinked = new Set(adminValueLinkedIds);
  adminValueReassign = {};
  $("#adminValueEditName").value = v.name || "";
  $("#adminValueEditIcon").value = v.icon || "fa-star";
  $("#adminValueEditColor").value = v.color || "#e6821e";
  $("#adminValueEditDesc").value = v.desc || "";
  const meta = $("#adminValueEditMeta");
  if (meta) {
    meta.textContent = adminValueEditIsTextbook
      ? "Darslik qadriyati — nom, tavsif va bog'langan asarlarni tahrirlash mumkin."
      : "Qadriyat ma'lumotlari va bog'langan asarlarni boshqaring.";
  }
  renderAdminValueWorksEditor();
  const modal = $("#adminValueModal");
  if (modal) modal.hidden = false;
}

async function saveAdminValueEditor() {
  if (!adminValueEditId) return;
  const payload = {
    name: $("#adminValueEditName").value.trim(),
    icon: $("#adminValueEditIcon").value.trim() || "fa-star",
    color: $("#adminValueEditColor").value,
    desc: $("#adminValueEditDesc").value.trim(),
    isTextbook: adminValueEditIsTextbook,
  };
  if (!payload.name) { toast("Nom kiriting", "err"); return; }
  const res = await TeacherApi.updateValue(adminValueEditId, payload);
  if (!res.ok) { toast(res.msg, "err"); return; }

  const linkErrors = await syncAdminValueWorkLinks(adminValueEditId);
  if (linkErrors.length) {
    toast(`Qadriyat saqlandi, lekin ba'zi asarlarni yangilab bo'lmadi: ${linkErrors.slice(0, 3).join(", ")}`, "err");
  } else {
    toast("Qadriyat va asar bog'lanishlari saqlandi", "win");
  }
  closeAdminValueEditor();
  await Promise.all([loadValuesIntoCatalog(), loadCustomWorksIntoCatalog()]);
  renderAdminValuesTable();
  drawTeacherCharts();
}

async function deleteAdminValue(valueId) {
  const wc = countWorksForValue(valueId);
  const extra = wc ? `\n\n${wc} ta asar bog'langan — o'chirishdan oldin asarlarda boshqa qadriyat tanlang.` : "";
  if (!confirm(`Qadriyatni o'chirishni tasdiqlaysizmi?${extra}`)) return;
  const isTextbook = isTextbookValueId(valueId);
  const res = await TeacherApi.deleteValue(valueId, { isTextbook });
  if (!res.ok) { toast(res.msg, "err"); return; }
  toast("O'chirildi", "win");
  await loadValuesIntoCatalog();
  renderAdminValuesTable();
  drawTeacherCharts();
}

let adminCwWorkId = null;
let adminCwEntries = [];
let adminCwMode = "edit";

function workHasCrossword(w) {
  return (w?.crossword || []).some((c) => splitUzCwLetters(c.word).length >= 2 && String(c.clue || "").trim());
}

function formatCwWordStorage(raw) {
  return String(raw || "").trim().toUpperCase();
}

function blankAdminCwEntries(count = 3) {
  return Array.from({ length: count }, () => ({ clue: "", word: "" }));
}

function updateAdminCwModeUI() {
  const isNew = adminCwMode === "new";
  const heading = $("#adminCwHeading");
  const hint = $("#adminCwModeHint");
  const saveLabel = $("#adminCwSaveLabel");
  const editBtn = $("#adminCwModeEdit");
  const newBtn = $("#adminCwModeNew");
  const clearBtn = $("#adminCwClearRows");
  const editEmpty = $("#adminCwEditEmpty");
  const editorFields = $("#adminCwEditorFields");

  if (heading) {
    heading.innerHTML = isNew
      ? `<i class="fa-solid fa-table-cells"></i> Yangi krossvord yaratish`
      : `<i class="fa-solid fa-table-cells"></i> Krossvord tahrirlash`;
  }
  if (hint) {
    hint.textContent = isNew
      ? "Krossvordsiz asarni tanlang, savol va javoblarni kiriting yoki avtomatik yaratish tugmasini bosing."
      : "Mavjud krossvordli asarni tanlang va so'zlarni o'zgartiring.";
  }
  if (saveLabel) saveLabel.textContent = isNew ? "Yangi krossvordni saqlash" : "Krossvordni saqlash";
  editBtn?.classList.toggle("active", !isNew);
  newBtn?.classList.toggle("active", isNew);
  editBtn?.setAttribute("aria-pressed", !isNew ? "true" : "false");
  newBtn?.setAttribute("aria-pressed", isNew ? "true" : "false");
  if (clearBtn) clearBtn.hidden = !isNew;
  const hideEditor = adminCwMode === "edit" && editEmpty && !editEmpty.hidden;
  if (editorFields) editorFields.hidden = hideEditor;
}

function setAdminCwMode(mode) {
  if (adminCwMode === mode) return;
  adminCwMode = mode;
  renderAdminCrosswordPanel();
}

function startAdminCwBlank() {
  adminCwEntries = blankAdminCwEntries();
  syncAdminCwLinesTextarea();
  renderAdminCwEntriesTable();
  renderAdminCwPreview();
}

function fillAdminCwWorkSelect() {
  const sel = $("#adminCwWorkSelect");
  const editEmpty = $("#adminCwEditEmpty");
  if (!sel) return;

  const prev = sel.value;
  const withCw = TEXTBOOK_WORKS.filter(workHasCrossword);
  const withoutCw = TEXTBOOK_WORKS.filter((w) => !workHasCrossword(w));

  if (adminCwMode === "edit") {
    if (!withCw.length) {
      sel.innerHTML = `<option value="">Krossvordli asar yo'q</option>`;
      sel.disabled = true;
      if (editEmpty) editEmpty.hidden = false;
      adminCwWorkId = null;
      adminCwEntries = [];
      syncAdminCwLinesTextarea();
      renderAdminCwEntriesTable();
      renderAdminCwPreview();
      updateAdminCwModeUI();
      return;
    }
    if (editEmpty) editEmpty.hidden = true;
    sel.disabled = false;
    sel.innerHTML = withCw.map((w) => {
      const n = (w.crossword || []).filter((c) => c.word && c.clue).length;
      return `<option value="${esc(w.id)}">${esc(w.title)} (${w.grade}-sinf · ${n} so'z)</option>`;
    }).join("");
    if (prev && withCw.some((w) => w.id === prev)) sel.value = prev;
    else sel.value = withCw[0].id;
  } else {
    if (editEmpty) editEmpty.hidden = true;
    sel.disabled = false;
    const list = withoutCw.length ? withoutCw : TEXTBOOK_WORKS;
    sel.innerHTML = list.map((w) => {
      const tag = workHasCrossword(w) ? " · almashtirish" : " · yangi";
      return `<option value="${esc(w.id)}">${esc(w.title)} (${w.grade}-sinf${tag})</option>`;
    }).join("");
    if (prev && list.some((w) => w.id === prev)) sel.value = prev;
    else sel.value = list[0]?.id || "";
  }
  updateAdminCwModeUI();
}

function syncAdminCwLinesTextarea() {
  const ta = $("#adminCwLines");
  if (!ta) return;
  ta.value = adminCwEntries.map((e) => `${e.clue} | ${e.word}`).join("\n");
}

function loadAdminCrosswordForWork(workId, opts = {}) {
  adminCwWorkId = workId;
  if (adminCwMode === "new" && !opts.forceLoad) {
    startAdminCwBlank();
    return;
  }
  const w = getWorkById(workId);
  adminCwEntries = (w?.crossword || []).map((c) => ({
    word: formatCwWordStorage(c.word),
    clue: String(c.clue || "").trim(),
  })).filter((c) => splitUzCwLetters(c.word).length >= 2 && c.clue);
  if (!adminCwEntries.length && adminCwMode === "new") adminCwEntries = blankAdminCwEntries();
  syncAdminCwLinesTextarea();
  renderAdminCwEntriesTable();
  renderAdminCwPreview();
}

function renderAdminCrosswordPanel() {
  fillAdminCwWorkSelect();
  const id = $("#adminCwWorkSelect")?.value;
  if (!id) return;
  if (adminCwMode === "new") {
    adminCwWorkId = id;
    startAdminCwBlank();
  } else {
    loadAdminCrosswordForWork(id, { forceLoad: true });
  }
}

function renderAdminCwEntriesTable() {
  const host = $("#adminCwEntriesTable");
  if (!host) return;
  if (!adminCwEntries.length) {
    host.innerHTML = `<p class="muted">${adminCwMode === "new"
      ? "Savol va javoblarni kiriting yoki «Matndan yaratish» / «Asardan avtomatik» tugmalaridan foydalaning."
      : "Hali so'z yo'q. Yuqoridagi matndan yaratish yoki avtomatik tugmasini bosing."}</p>`;
    return;
  }
  host.innerHTML = `<div class="table-wrap"><table class="analysis-table admin-cw-table"><thead><tr>
    <th>#</th><th>Savol</th><th>Javob (harflar)</th><th></th>
  </tr></thead><tbody>${adminCwEntries.map((e, i) => `<tr>
    <td>${i + 1}</td>
    <td><input type="text" class="admin-cw-clue" data-idx="${i}" value="${esc(e.clue)}" maxlength="120" /></td>
    <td><input type="text" class="admin-cw-word" data-idx="${i}" value="${esc(e.word)}" maxlength="20" /></td>
    <td><button type="button" class="ghost-btn admin-mini-btn admin-danger" data-cw-del="${i}" title="O'chirish"><i class="fa-solid fa-trash"></i></button></td>
  </tr>`).join("")}</tbody></table></div>`;
  host.querySelectorAll(".admin-cw-clue").forEach((inp) => {
    inp.addEventListener("change", () => {
      adminCwEntries[+inp.dataset.idx].clue = inp.value.trim();
      syncAdminCwLinesTextarea();
      renderAdminCwPreview();
    });
  });
  host.querySelectorAll(".admin-cw-word").forEach((inp) => {
    inp.addEventListener("change", () => {
      adminCwEntries[+inp.dataset.idx].word = formatCwWordStorage(inp.value);
      inp.value = adminCwEntries[+inp.dataset.idx].word;
      syncAdminCwLinesTextarea();
      renderAdminCwPreview();
    });
  });
  host.querySelectorAll("[data-cw-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      adminCwEntries.splice(+btn.dataset.cwDel, 1);
      syncAdminCwLinesTextarea();
      renderAdminCwEntriesTable();
      renderAdminCwPreview();
    });
  });
}

function renderAdminCwPreview() {
  const host = $("#adminCwPreview");
  if (!host) return;
  const layout = buildCrosswordLayout(adminCwEntries);
  if (!layout.placed?.length) {
    host.innerHTML = `<p class="muted">Kamida 2 ta so'z kerak va ular bir-biri bilan kesishishi lozim.</p>`;
    return;
  }
  let warn = "";
  if (layout.unplaced?.length) {
    const list = layout.unplaced.map((e) => `<strong>${esc(e.word)}</strong>`).join(", ");
    warn = `<p class="admin-cw-unplaced-warn"><i class="fa-solid fa-triangle-exclamation"></i> ${layout.unplaced.length} ta so'z gridga sig'madi (boshqa so'zlar bilan umumiy harf yo'q): ${list}. Javoblarni o'zgartiring yoki qo'shimcha kesishuvli so'z qo'shing.</p>`;
  }
  host.innerHTML = `${warn}<div class="admin-cw-preview-inner cw-wrap">${renderCrosswordGridHtml(layout, { interactive: false, cellSize: 34 })}${renderCrosswordCluesHtml(layout.placed)}</div>`;
}

function applyAdminCwFromLines() {
  const text = $("#adminCwLines")?.value || "";
  const parsed = parseCrosswordLines(text);
  if (!parsed.length) {
    toast("Matndan so'z topilmadi. Format: Savol | JAVOB", "err");
    return;
  }
  adminCwEntries = parsed;
  renderAdminCwEntriesTable();
  renderAdminCwPreview();
  toast(`${parsed.length} ta so'z qo'shildi`, "win");
}

function applyAdminCwAutoGen() {
  const w = getWorkById(adminCwWorkId || $("#adminCwWorkSelect")?.value);
  if (!w) { toast("Asar tanlang", "err"); return; }
  adminCwEntries = generateCrosswordEntriesFromWork(w);
  syncAdminCwLinesTextarea();
  renderAdminCwEntriesTable();
  renderAdminCwPreview();
  toast("Asar asosida krossvord yaratildi", "win");
}

async function saveAdminCrossword() {
  if (!adminCwWorkId) { toast("Asar tanlang", "err"); return; }
  const w = getWorkById(adminCwWorkId);
  if (adminCwMode === "new" && workHasCrossword(w)) {
    if (!confirm(`"${w.title}" asarida allaqachon krossvord bor. Yangisi bilan almashtirishni tasdiqlaysizmi?`)) return;
  }
  const crossword = adminCwEntries
    .map((e) => ({ word: formatCwWordStorage(e.word), clue: e.clue.trim() }))
    .filter((e) => splitUzCwLetters(e.word).length >= 2 && e.clue);
  if (!crossword.length) { toast("Kamida bitta to'liq savol/javob kiriting", "err"); return; }
  const layout = buildCrosswordLayout(crossword);
  if (layout.unplaced?.length) {
    const names = layout.unplaced.map((e) => e.word).join(", ");
    toast(`Gridga sig'magan so'zlar: ${names}. Ularni o'zgartiring yoki o'chiring.`, "err");
    return;
  }
  const res = await TeacherApi.updateWork(adminCwWorkId, { crossword });
  if (!res.ok) { toast(res.msg, "err"); return; }
  await loadCustomWorksIntoCatalog();
  toast(adminCwMode === "new" ? "Yangi krossvord yaratildi!" : "Krossvord saqlandi!", "win");
  if (adminCwMode === "new") adminCwMode = "edit";
  renderAdminCrosswordPanel();
}

let adminMatchPairs = [];
let adminMatchPickCount = 5;

function buildAllWorkMatchPairs() {
  return TEXTBOOK_WORKS.map((w) => ({
    workId: w.id,
    valueId: w.valueMain || w.values?.[0] || VALUES[0]?.id || "",
  }));
}

function updateAdminMatchStatus() {
  const el = $("#adminMatchStatus");
  if (!el) return;
  const total = adminMatchPairs.filter((p) => p.workId && p.valueId).length;
  const pick = +($("#adminMatchPickCount")?.value || adminMatchPickCount || 5);
  el.textContent = total
    ? `Jami ${total} ta juft · o'yin ${Math.min(pick, total)} tasini tanlaydi`
    : "Juftlar yo'q";
}

async function renderAdminMatchPanel() {
  await Promise.all([loadCustomWorksIntoCatalog(), loadValuesIntoCatalog(), MatchPairs.load()]);
  const saved = (MatchPairs.config?.pairs || []).filter((p) => p.workId && p.valueId);
  adminMatchPairs = saved.length ? saved.map((p) => ({ ...p })) : buildAllWorkMatchPairs();
  adminMatchPickCount = MatchPairs.config?.pickCount || 5;
  const pickSel = $("#adminMatchPickCount");
  if (pickSel) pickSel.value = String(adminMatchPickCount);
  renderAdminMatchTable();
  updateAdminMatchStatus();
}

function renderAdminMatchTable() {
  const table = $("#adminMatchTable");
  if (!table) return;
  if (!adminMatchPairs.length) {
    table.innerHTML = `<tbody><tr><td class="muted" colspan="4">Juftlar yo'q. «Juft qo'shish» yoki «Barcha asarlardan to'ldirish» tugmasini bosing.</td></tr></tbody>`;
    updateAdminMatchStatus();
    return;
  }
  const workOptions = (selId) =>
    `<option value="">— Tanlang —</option>${TEXTBOOK_WORKS.map((w) => `<option value="${esc(w.id)}"${w.id === selId ? " selected" : ""}>${esc(w.title)} (${w.grade}-sinf)</option>`).join("")}`;
  const valueOptions = (selId) =>
    `<option value="">— Tanlang —</option>${VALUES.map((v) => `<option value="${esc(v.id)}"${v.id === selId ? " selected" : ""}>${esc(v.name)}</option>`).join("")}`;
  table.innerHTML = `<thead><tr><th>#</th><th>Asar</th><th>Qadriyat</th><th></th></tr></thead><tbody>${adminMatchPairs
    .map((p, i) => {
      const w = getWorkById(p.workId);
      const v = getValueById(p.valueId);
      return `<tr>
      <td>${i + 1}</td>
      <td>
        <select class="admin-match-work" data-idx="${i}">${workOptions(p.workId)}</select>
        ${w ? `<span class="admin-match-work-meta">${esc(w.author || "Darslik")}</span>` : ""}
      </td>
      <td>
        <select class="admin-match-value" data-idx="${i}">${valueOptions(p.valueId)}</select>
        ${v ? `<span class="admin-match-value-preview" style="background:${esc(v.color)}"><i class="fa-solid ${esc(v.icon)}"></i> ${esc(v.name)}</span>` : ""}
      </td>
      <td><button type="button" class="ghost-btn admin-mini-btn admin-danger" data-match-del="${i}" title="O'chirish"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`;
    })
    .join("")}</tbody>`;
  table.querySelectorAll(".admin-match-work").forEach((sel) => {
    sel.addEventListener("change", () => {
      adminMatchPairs[+sel.dataset.idx].workId = sel.value;
      renderAdminMatchTable();
    });
  });
  table.querySelectorAll(".admin-match-value").forEach((sel) => {
    sel.addEventListener("change", () => {
      adminMatchPairs[+sel.dataset.idx].valueId = sel.value;
      renderAdminMatchTable();
    });
  });
  table.querySelectorAll("[data-match-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      adminMatchPairs.splice(+btn.dataset.matchDel, 1);
      renderAdminMatchTable();
    });
  });
  updateAdminMatchStatus();
}

function adminMatchAutoFill() {
  adminMatchPairs = buildAllWorkMatchPairs();
  renderAdminMatchTable();
  toast(`${adminMatchPairs.length} ta juft ro'yxatga qo'shildi`, "win");
}

async function saveAdminMatchPairs() {
  adminMatchPickCount = +($("#adminMatchPickCount")?.value || 5);
  const pairs = adminMatchPairs.filter((p) => p.workId && p.valueId);
  if (pairs.length < 3) {
    toast("Kamida 3 ta to'liq juft kerak", "err");
    return;
  }
  const res = await MatchPairs.save({ pairs, pickCount: adminMatchPickCount });
  if (!res.ok) { toast(res.msg, "err"); return; }
  toast("Juftlash o'yini saqlandi!", "win");
  renderAdminMatchPanel();
}

/* --- Admin: Quiz o'yinlar (Asar topish, Muallifni top, To'g'ri/Noto'g'ri) --- */
let adminQuizTab = "guess";
let adminQuizGuess = [];
let adminQuizAuthor = [];
let adminQuizTrueFalse = [];

function adminQuizWorkOptions(selectedId = "") {
  return TEXTBOOK_WORKS.map((w) =>
    `<option value="${esc(w.id)}"${w.id === selectedId ? " selected" : ""}>${esc(w.title)} (${w.grade}-sinf)</option>`
  ).join("");
}

function buildAdminQuizGuessFromWorks() {
  return buildGuessWorkPool().map((w) => {
    const source = String(w.moral || w.summary || "").trim();
    return {
      workId: w.id,
      clue: source.length > 150 ? `${source.slice(0, 147)}…` : source,
      clueType: w.moral ? "saboq" : "mazmun",
    };
  });
}

function buildAdminQuizAuthorFromWorks() {
  return buildAuthorGuessPool().map((w) => ({ workId: w.id }));
}

function buildAdminQuizTfFromWorks() {
  const pool = TEXTBOOK_WORKS.filter((w) => w.title && (w.tests?.length || w.author || w.moral));
  return buildTrueFalseStatements(pool).map((s) => ({
    workId: s.workId || "",
    text: s.text,
    isTrue: s.isTrue,
  }));
}

function updateAdminQuizStatus(kind) {
  const map = {
    guess: { items: adminQuizGuess, pick: "#adminQuizGuessPick", status: "#adminQuizGuessStatus" },
    author: { items: adminQuizAuthor, pick: "#adminQuizAuthorPick", status: "#adminQuizAuthorStatus" },
    truefalse: { items: adminQuizTrueFalse, pick: "#adminQuizTfPick", status: "#adminQuizTfStatus" },
  };
  const cfg = map[kind];
  if (!cfg) return;
  const n = cfg.items.length;
  const pick = +($(cfg.pick)?.value || QuizGames.config?.[kind]?.pickCount || 8);
  const el = $(cfg.status);
  if (!el) return;
  if (n === 0) {
    el.textContent = "Avtomatik rejim — darslikdan yaratiladi";
    el.classList.remove("is-custom");
  } else {
    el.textContent = `Maxsus: ${n} ta yozuv · O'yinda ${Math.min(pick, n)} tasi ishlatiladi`;
    el.classList.add("is-custom");
  }
}

function setAdminQuizTab(tab) {
  adminQuizTab = tab;
  $$("[data-quiz-tab]").forEach((btn) => {
    const on = btn.dataset.quizTab === tab;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  $$("[data-quiz-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.quizPanel !== tab;
  });
}

function renderAdminQuizGuessTable() {
  const table = $("#adminQuizGuessTable");
  if (!table) return;
  if (!adminQuizGuess.length) {
    table.innerHTML = `<tbody><tr><td colspan="5" class="muted">Ro'yxat bo'sh — o'yin darslikdan avtomatik savol yaratadi.</td></tr></tbody>`;
    updateAdminQuizStatus("guess");
    return;
  }
  table.innerHTML = `<thead><tr><th>#</th><th>Asar</th><th>Turi</th><th>Savol / saboq matni</th><th></th></tr></thead><tbody>${adminQuizGuess
    .map((row, i) => `<tr>
      <td>${i + 1}</td>
      <td><select class="admin-quiz-work" data-kind="guess" data-idx="${i}">${adminQuizWorkOptions(row.workId)}</select></td>
      <td><select class="admin-quiz-cluetype" data-idx="${i}">
        <option value="saboq"${row.clueType !== "mazmun" ? " selected" : ""}>Saboq</option>
        <option value="mazmun"${row.clueType === "mazmun" ? " selected" : ""}>Mazmun</option>
      </select></td>
      <td><input type="text" class="admin-quiz-clue" data-idx="${i}" value="${esc(row.clue)}" maxlength="240" /></td>
      <td><button type="button" class="ghost-btn admin-mini-btn admin-danger" data-quiz-del="guess" data-idx="${i}"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`)
    .join("")}</tbody>`;
  bindAdminQuizTableEvents("guess");
  updateAdminQuizStatus("guess");
}

function renderAdminQuizAuthorTable() {
  const table = $("#adminQuizAuthorTable");
  if (!table) return;
  if (!adminQuizAuthor.length) {
    table.innerHTML = `<tbody><tr><td colspan="4" class="muted">Ro'yxat bo'sh — barcha asarlardan avtomatik tanlanadi.</td></tr></tbody>`;
    updateAdminQuizStatus("author");
    return;
  }
  table.innerHTML = `<thead><tr><th>#</th><th>Asar</th><th>Muallif (avtomatik)</th><th></th></tr></thead><tbody>${adminQuizAuthor
    .map((row, i) => {
      const w = getWorkById(row.workId);
      return `<tr>
        <td>${i + 1}</td>
        <td><select class="admin-quiz-work" data-kind="author" data-idx="${i}">${adminQuizWorkOptions(row.workId)}</select></td>
        <td class="muted">${esc(w?.author || "—")}</td>
        <td><button type="button" class="ghost-btn admin-mini-btn admin-danger" data-quiz-del="author" data-idx="${i}"><i class="fa-solid fa-trash"></i></button></td>
      </tr>`;
    })
    .join("")}</tbody>`;
  bindAdminQuizTableEvents("author");
  updateAdminQuizStatus("author");
}

function renderAdminQuizTfTable() {
  const table = $("#adminQuizTfTable");
  if (!table) return;
  if (!adminQuizTrueFalse.length) {
    table.innerHTML = `<tbody><tr><td colspan="5" class="muted">Ro'yxat bo'sh — gaplar darslikdan avtomatik yaratiladi.</td></tr></tbody>`;
    updateAdminQuizStatus("truefalse");
    return;
  }
  table.innerHTML = `<thead><tr><th>#</th><th>Asar</th><th>Gap matni</th><th>Javob</th><th></th></tr></thead><tbody>${adminQuizTrueFalse
    .map((row, i) => `<tr>
      <td>${i + 1}</td>
      <td><select class="admin-quiz-work" data-kind="truefalse" data-idx="${i}">
        <option value=""${!row.workId ? " selected" : ""}>—</option>${adminQuizWorkOptions(row.workId)}
      </select></td>
      <td><input type="text" class="admin-quiz-tf-text" data-idx="${i}" value="${esc(row.text)}" maxlength="240" /></td>
      <td><select class="admin-quiz-tf-ans" data-idx="${i}">
        <option value="true"${row.isTrue ? " selected" : ""}>To'g'ri</option>
        <option value="false"${!row.isTrue ? " selected" : ""}>Noto'g'ri</option>
      </select></td>
      <td><button type="button" class="ghost-btn admin-mini-btn admin-danger" data-quiz-del="truefalse" data-idx="${i}"><i class="fa-solid fa-trash"></i></button></td>
    </tr>`)
    .join("")}</tbody>`;
  bindAdminQuizTableEvents("truefalse");
  updateAdminQuizStatus("truefalse");
}

function bindAdminQuizTableEvents(kind) {
  const panel = kind === "guess" ? "#adminQuizGuessTable" : kind === "author" ? "#adminQuizAuthorTable" : "#adminQuizTfTable";
  const host = $(panel);
  if (!host) return;
  host.querySelectorAll(".admin-quiz-work").forEach((sel) => {
    sel.addEventListener("change", () => {
      const idx = +sel.dataset.idx;
      if (kind === "guess") adminQuizGuess[idx].workId = sel.value;
      else if (kind === "author") adminQuizAuthor[idx].workId = sel.value;
      else adminQuizTrueFalse[idx].workId = sel.value;
      if (kind === "author") renderAdminQuizAuthorTable();
    });
  });
  host.querySelectorAll(".admin-quiz-cluetype").forEach((sel) => {
    sel.addEventListener("change", () => {
      adminQuizGuess[+sel.dataset.idx].clueType = sel.value;
    });
  });
  host.querySelectorAll(".admin-quiz-clue").forEach((inp) => {
    inp.addEventListener("change", () => {
      adminQuizGuess[+inp.dataset.idx].clue = inp.value.trim();
    });
  });
  host.querySelectorAll(".admin-quiz-tf-text").forEach((inp) => {
    inp.addEventListener("change", () => {
      adminQuizTrueFalse[+inp.dataset.idx].text = inp.value.trim();
    });
  });
  host.querySelectorAll(".admin-quiz-tf-ans").forEach((sel) => {
    sel.addEventListener("change", () => {
      adminQuizTrueFalse[+sel.dataset.idx].isTrue = sel.value === "true";
    });
  });
  host.querySelectorAll("[data-quiz-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      if (kind === "guess") adminQuizGuess.splice(idx, 1);
      else if (kind === "author") adminQuizAuthor.splice(idx, 1);
      else adminQuizTrueFalse.splice(idx, 1);
      if (kind === "guess") renderAdminQuizGuessTable();
      else if (kind === "author") renderAdminQuizAuthorTable();
      else renderAdminQuizTfTable();
    });
  });
}

async function renderAdminQuizPanel() {
  await QuizGames.load();
  adminQuizGuess = (QuizGames.config.guess?.items || []).map((i) => ({ ...i }));
  adminQuizAuthor = (QuizGames.config.author?.items || []).map((i) => ({ ...i }));
  adminQuizTrueFalse = (QuizGames.config.truefalse?.items || []).map((i) => ({ ...i }));
  const gp = $("#adminQuizGuessPick");
  const ap = $("#adminQuizAuthorPick");
  const tp = $("#adminQuizTfPick");
  if (gp) gp.value = String(QuizGames.config.guess?.pickCount || 8);
  if (ap) ap.value = String(QuizGames.config.author?.pickCount || 8);
  if (tp) tp.value = String(QuizGames.config.truefalse?.pickCount || 10);
  setAdminQuizTab(adminQuizTab);
  renderAdminQuizGuessTable();
  renderAdminQuizAuthorTable();
  renderAdminQuizTfTable();
}

async function saveAdminQuizGames() {
  const payload = {
    guess: {
      pickCount: +($("#adminQuizGuessPick")?.value || 8),
      items: adminQuizGuess.filter((i) => i.workId && i.clue),
    },
    author: {
      pickCount: +($("#adminQuizAuthorPick")?.value || 8),
      items: adminQuizAuthor.filter((i) => i.workId),
    },
    truefalse: {
      pickCount: +($("#adminQuizTfPick")?.value || 10),
      items: adminQuizTrueFalse.filter((i) => String(i.text || "").trim().length >= 10),
    },
  };
  const res = await QuizGames.save(payload);
  if (!res.ok) { toast(res.msg, "err"); return; }
  toast("Quiz o'yinlar saqlandi!", "win");
  renderAdminQuizPanel();
}

let adminMapDraft = { regions: {} };
let adminMapSelectedId = null;
let adminMapDrag = null;

function adminMapDraftEntry(id) {
  const norm = normalizeRegionId(id);
  if (!adminMapDraft.regions[norm]) {
    const r = getMapRegionById(norm) || getRegionById(norm);
    if (!r) return null;
    adminMapDraft.regions[norm] = {
      mapX: r.mapX,
      mapY: r.mapY,
      workId: r.workId || "",
      value: r.value || "",
      story: r.story || "",
      tale: r.tale || "",
      tradition: r.tradition || "",
      fact: r.fact || "",
      infographicUrl: r.infographicUrl || null,
    };
  }
  return adminMapDraft.regions[norm];
}

function adminMapPointerToPct(clientX, clientY) {
  const stage = $("#adminMapEditorStage");
  if (!stage) return { mapX: 50, mapY: 50 };
  const rect = stage.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return { mapX: 50, mapY: 50 };
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return {
    mapX: Math.min(100, Math.max(0, +x.toFixed(1))),
    mapY: Math.min(100, Math.max(0, +y.toFixed(1))),
  };
}

function syncAdminMapFormToDraft() {
  if (!adminMapSelectedId) return;
  const entry = adminMapDraftEntry(adminMapSelectedId);
  if (!entry) return;
  entry.mapX = +($("#adminMapPosX")?.value || entry.mapX);
  entry.mapY = +($("#adminMapPosY")?.value || entry.mapY);
  entry.workId = $("#adminMapWorkSelect")?.value || "";
  entry.value = $("#adminMapValueSelect")?.value || "";
  entry.story = $("#adminMapStory")?.value?.trim() || "";
  entry.tale = $("#adminMapTale")?.value?.trim() || "";
  entry.tradition = $("#adminMapTradition")?.value?.trim() || "";
  entry.fact = $("#adminMapFact")?.value?.trim() || "";
}

function fillAdminMapForm(id) {
  const entry = adminMapDraftEntry(id);
  if (!entry) return;
  const xInp = $("#adminMapPosX");
  const yInp = $("#adminMapPosY");
  if (xInp) xInp.value = String(entry.mapX);
  if (yInp) yInp.value = String(entry.mapY);
  const valSel = $("#adminMapValueSelect");
  if (valSel) valSel.value = entry.value || "";
  const workSel = $("#adminMapWorkSelect");
  if (workSel) workSel.value = entry.workId || "";
  const story = $("#adminMapStory");
  if (story) story.value = entry.story || "";
  const tale = $("#adminMapTale");
  if (tale) tale.value = entry.tale || "";
  const tradition = $("#adminMapTradition");
  if (tradition) tradition.value = entry.tradition || "";
  const fact = $("#adminMapFact");
  if (fact) fact.value = entry.fact || "";
  updateAdminMapInfoPreview(entry.infographicUrl, id);
}

function updateAdminMapInfoPreview(url, regionId) {
  const preview = $("#adminMapInfoPreview");
  const removeBtn = $("#adminMapInfoRemove");
  const fileInp = $("#adminMapInfoImage");
  if (fileInp) fileInp.value = "";
  if (!preview) return;
  if (url) {
    preview.src = url;
    preview.alt = `${getMapRegionById(regionId)?.name || regionId} infografikasi`;
    preview.hidden = false;
    if (removeBtn) removeBtn.hidden = false;
  } else {
    preview.removeAttribute("src");
    preview.hidden = true;
    if (removeBtn) removeBtn.hidden = true;
  }
}

function updateAdminMapPinEl(id) {
  const entry = adminMapDraftEntry(id);
  const pin = $(`#adminMapEditorPins .admin-map-pin[data-region="${CSS.escape(id)}"]`);
  if (!entry || !pin) return;
  pin.style.setProperty("--pin-x", `${entry.mapX}%`);
  pin.style.setProperty("--pin-y", `${entry.mapY}%`);
  pin.classList.toggle("is-selected", adminMapSelectedId === id);
}

function buildAdminMapPinsHtml() {
  return MAP_REGIONS.map((r) => {
    const entry = adminMapDraftEntry(r.id);
    const mx = entry?.mapX ?? r.mapX;
    const my = entry?.mapY ?? r.mapY;
    const active = adminMapSelectedId === r.id;
    return `<button type="button" class="admin-map-pin uz-map-pin${active ? " is-selected" : ""}"
      data-region="${esc(r.id)}" style="--pin-x:${mx}%;--pin-y:${my}%"
      aria-label="${esc(r.name)}" aria-pressed="${active ? "true" : "false"}">
      <span class="uz-map-pin-ring" aria-hidden="true"></span>
      <span class="uz-map-pin-icon">${mapIconImgHtml(r.id, "uz-map-pin-img")}</span>
      <span class="uz-map-pin-label">${esc(r.name)}</span>
    </button>`;
  }).join("");
}

function renderAdminMapPins() {
  const host = $("#adminMapEditorPins");
  if (!host) return;
  host.innerHTML = buildAdminMapPinsHtml();
}

function selectAdminMapRegion(id, opts = {}) {
  const norm = normalizeRegionId(id);
  if (!getRegionById(norm)) return;
  if (!opts.skipSync && adminMapSelectedId && adminMapSelectedId !== norm) {
    syncAdminMapFormToDraft();
  }
  adminMapSelectedId = norm;
  const sel = $("#adminMapRegionSelect");
  if (sel && sel.value !== norm) sel.value = norm;
  fillAdminMapForm(norm);
  $$("#adminMapEditorPins .admin-map-pin").forEach((p) => {
    const rid = normalizeRegionId(p.dataset.region);
    p.classList.toggle("is-selected", rid === norm);
    p.setAttribute("aria-pressed", rid === norm ? "true" : "false");
  });
}

function fillAdminMapSelects() {
  const regionSel = $("#adminMapRegionSelect");
  if (regionSel) {
    regionSel.innerHTML = MAP_REGIONS.map((r) =>
      `<option value="${esc(r.id)}">${esc(r.emoji)} ${esc(r.name)}</option>`).join("");
  }
  const valueSel = $("#adminMapValueSelect");
  if (valueSel) {
    valueSel.innerHTML = `<option value="">— Tanlang —</option>${VALUES.map((v) =>
      `<option value="${esc(v.id)}">${esc(v.name)}</option>`).join("")}`;
  }
  const workSel = $("#adminMapWorkSelect");
  if (workSel) {
    workSel.innerHTML = `<option value="">— Tanlang —</option>${TEXTBOOK_WORKS.map((w) =>
      `<option value="${esc(w.id)}">${esc(w.title)} (${w.grade}-sinf)</option>`).join("")}`;
  }
}

async function renderAdminMapPanel() {
  await MapConfig.load();
  rebuildMapRegionsList();
  adminMapDraft = { regions: {} };
  MAP_REGIONS.forEach((r) => {
    adminMapDraft.regions[r.id] = {
      mapX: r.mapX,
      mapY: r.mapY,
      workId: r.workId || "",
      value: r.value || "",
      story: r.story || "",
      tale: r.tale || "",
      tradition: r.tradition || "",
      fact: r.fact || "",
      infographicUrl: r.infographicUrl || null,
    };
  });
  fillAdminMapSelects();
  renderAdminMapPins();
  const firstId = adminMapSelectedId && adminMapDraft.regions[adminMapSelectedId]
    ? adminMapSelectedId
    : MAP_REGIONS[0]?.id;
  if (firstId) selectAdminMapRegion(firstId, { skipSync: true });
  updateAdminMapBgUI();
}

function updateAdminMapBgUI() {
  const url = MapConfig.config?.backgroundUrl;
  const preview = $("#adminMapBgPreview");
  const removeBtn = $("#adminMapBgRemove");
  const hint = $("#adminMapBgDefaultHint");
  applyMapBackgroundImg($("#adminMapEditorStage .uz-map-bg"));
  if (preview) {
    if (url) {
      preview.src = url;
      preview.hidden = false;
    } else {
      preview.removeAttribute("src");
      preview.hidden = true;
    }
  }
  if (removeBtn) removeBtn.hidden = !url;
  if (hint) hint.hidden = !!url;
}

async function uploadAdminMapBackground(file) {
  if (!file) return;
  let imageBase64;
  try {
    imageBase64 = await readImageFileAsBase64(file);
  } catch {
    toast("Rasm o'qib bo'lmadi", "err");
    return;
  }
  const res = await MapConfig.uploadBackground(imageBase64);
  if (!res.ok) { toast(res.msg, "err"); return; }
  updateAdminMapBgUI();
  refreshHomeMapBackground();
  toast("Xarita fon rasmi yuklandi", "win");
}

async function removeAdminMapBackground() {
  if (!MapConfig.config?.backgroundUrl) return;
  if (!confirm("Xarita fon rasmini o'chirib, standart fonni qaytarishni tasdiqlaysizmi?")) return;
  const res = await MapConfig.deleteBackground();
  if (!res.ok) { toast(res.msg, "err"); return; }
  updateAdminMapBgUI();
  refreshHomeMapBackground();
  toast("Standart fon qaytarildi", "win");
}

function onAdminMapPinPointerDown(e) {
  const pin = e.target.closest(".admin-map-pin");
  if (!pin || e.button !== 0) return;
  const id = normalizeRegionId(pin.dataset.region);
  if (adminMapSelectedId !== id) selectAdminMapRegion(id);
  adminMapDrag = { id, pointerId: e.pointerId, moved: false };
  pin.setPointerCapture(e.pointerId);
  pin.classList.add("is-dragging");
  e.preventDefault();
}

function onAdminMapPinPointerMove(e) {
  if (!adminMapDrag || e.pointerId !== adminMapDrag.pointerId) return;
  const { mapX, mapY } = adminMapPointerToPct(e.clientX, e.clientY);
  const entry = adminMapDraftEntry(adminMapDrag.id);
  if (!entry) return;
  entry.mapX = mapX;
  entry.mapY = mapY;
  adminMapDrag.moved = true;
  updateAdminMapPinEl(adminMapDrag.id);
  const xInp = $("#adminMapPosX");
  const yInp = $("#adminMapPosY");
  if (xInp) xInp.value = String(mapX);
  if (yInp) yInp.value = String(mapY);
}

function onAdminMapPinPointerUp(e) {
  if (!adminMapDrag || e.pointerId !== adminMapDrag.pointerId) return;
  const pin = $(`#adminMapEditorPins .admin-map-pin[data-region="${CSS.escape(adminMapDrag.id)}"]`);
  pin?.classList.remove("is-dragging");
  pin?.releasePointerCapture?.(e.pointerId);
  if (!adminMapDrag.moved) selectAdminMapRegion(adminMapDrag.id, { skipSync: true });
  adminMapDrag = null;
}

async function saveAdminMapConfig() {
  syncAdminMapFormToDraft();
  const res = await MapConfig.save(adminMapDraft);
  if (!res.ok) { toast(res.msg, "err"); return; }
  rebuildMapRegionsList();
  refreshHomeMapBackground();
  const host = $("#uzMapHost");
  if (host?.dataset.loaded) {
    refreshHomeMapPins();
    refreshActiveMapRegionPanel();
  }
  toast("Xarita sozlamalari saqlandi!", "win");
  renderAdminMapPanel();
}

async function uploadAdminMapInfographic(file) {
  if (!adminMapSelectedId || !file) return;
  const check = validateMapInfographicFile(file);
  if (!check.ok) { toast(check.msg, "err"); return; }
  syncAdminMapFormToDraft();
  let imageBase64;
  try {
    imageBase64 = await readImageFileAsBase64(file);
  } catch {
    toast("Rasm o'qib bo'lmadi", "err");
    return;
  }
  const res = await MapConfig.uploadInfographic(adminMapSelectedId, imageBase64);
  if (!res.ok) { toast(res.msg, "err"); return; }
  rebuildMapRegionsList();
  const entry = adminMapDraftEntry(adminMapSelectedId);
  if (entry) entry.infographicUrl = res.infographicUrl || MapConfig.config?.regions?.[adminMapSelectedId]?.infographicUrl || null;
  updateAdminMapInfoPreview(entry?.infographicUrl, adminMapSelectedId);
  rebuildMapRegionsList();
  refreshHomeMapBackground();
  refreshActiveMapRegionPanel();
  toast("Infografika yuklandi", "win");
}

function hostMapLoaded() {
  return !!$("#uzMapHost")?.dataset.loaded;
}

async function removeAdminMapInfographic() {
  if (!adminMapSelectedId) return;
  if (!confirm("Infografika rasmini o'chirishni tasdiqlaysizmi?")) return;
  syncAdminMapFormToDraft();
  const res = await MapConfig.deleteInfographic(adminMapSelectedId);
  if (!res.ok) { toast(res.msg, "err"); return; }
  rebuildMapRegionsList();
  const entry = adminMapDraftEntry(adminMapSelectedId);
  if (entry) entry.infographicUrl = null;
  updateAdminMapInfoPreview(null, adminMapSelectedId);
  if (hostMapLoaded() && homeMapSelectedId === adminMapSelectedId) {
    selectHomeRegion(adminMapSelectedId, { silent: true });
  }
  toast("Infografika o'chirildi", "win");
}

function renderAdminStudentNameCell(s) {
  const warnBadge = s.hasPendingWarning
    ? ` <span class="admin-warn-badge" title="Ogohlantirish yuborilgan — o'quvchi hali ko'rmagan"><i class="fa-solid fa-bell"></i></span>`
    : "";
  return `<div class="admin-stu-name-cell">${renderLbAvatar(s)}<div><b>${esc(s.name)}</b>${warnBadge}</div></div>`;
}

function closeAdminStudentWarning() {
  const modal = $("#adminStudentWarnModal");
  if (modal) modal.hidden = true;
  adminStudentWarnId = null;
}

function openAdminStudentWarning(studentId) {
  const s = adminDashCache?.students?.find((x) => String(x.id) === String(studentId));
  if (!s) return;
  adminStudentWarnId = s.id;
  const target = $("#adminStuWarnTarget");
  if (target) target.textContent = `${s.name} (@${s.username}) uchun ogohlantirish`;
  const msg = $("#adminStuWarnMessage");
  if (msg) msg.value = "";
  const chk = $("#adminStuWarnRemoveAvatar");
  if (chk) chk.checked = !!s.avatarImg;
  const modal = $("#adminStudentWarnModal");
  if (modal) modal.hidden = false;
  $$("#adminStudentWarnModal .admin-warn-preset").forEach((btn) => {
    btn.onclick = () => {
      const ta = $("#adminStuWarnMessage");
      if (ta) ta.value = btn.dataset.warnPreset || "";
    };
  });
}

async function sendAdminStudentWarning() {
  if (!adminStudentWarnId) return;
  const message = $("#adminStuWarnMessage")?.value.trim();
  if (!message) { toast("Ogohlantirish sababini yozing", "err"); return; }
  const removeAvatar = !!$("#adminStuWarnRemoveAvatar")?.checked;
  const res = await TeacherApi.warnStudent(adminStudentWarnId, { message, removeAvatar });
  if (!res.ok) { toast(res.msg, "err"); return; }
  toast("Ogohlantirish yuborildi", "win");
  closeAdminStudentWarning();
  renderTeacher();
}

async function removeAdminStudentAvatar(studentId) {
  if (!confirm("O'quvchi profil rasmini o'chirishni tasdiqlaysizmi?")) return;
  const res = await TeacherApi.removeStudentAvatar(studentId);
  if (!res.ok) { toast(res.msg, "err"); return; }
  toast("Profil rasmi o'chirildi", "win");
  const s = adminDashCache?.students?.find((x) => String(x.id) === String(studentId));
  if (s) { s.avatarImg = null; s.avatar_img = null; }
  if (String(adminStudentEditId) === String(studentId)) {
    setAvatarEl($("#adminStuEditAvatar"), { avatar: s?.avatar || "🧒", avatarImg: null });
  }
  renderAdminStudentsTable(adminDashCache?.students || [], !!adminDashCache?.isAdmin);
}

function showStudentWarningIfNeeded(onDone) {
  const w = Store.data.pendingWarning;
  if (!w?.message) {
    if (typeof onDone === "function") onDone();
    return;
  }
  if ($("#modalOverlay") && !$("#modalOverlay").hidden) return;
  openModal(`
    <div class="modal-inner student-warning-modal">
      <div class="student-warning-icon" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h2>Admin ogohlantirishi</h2>
      <p class="student-warning-text">${esc(w.message)}</p>
      ${w.removeAvatar ? `<p class="student-warning-note"><i class="fa-solid fa-image"></i> Profil rasmingiz sayt qoidalariga mos emasligi sababli olib tashlandi.</p>` : ""}
      <p class="muted student-warning-note">Iltimos, qoidalarga rioya qiling va hurmatli rasm yoki emoji ishlating.</p>
      <button type="button" class="solid-btn" id="studentWarningOk">Tushundim</button>
    </div>`);
  $("#studentWarningOk").addEventListener("click", async () => {
    if (w.removeAvatar) {
      Store.data.avatarImg = null;
      Auth.updateAccount({ avatarImg: null });
    }
    if (Api.online && Api.token) await Api.dismissWarning();
    else {
      Store.data.pendingWarning = null;
      Store.data.avatarUploadBlocked = false;
      Store.save();
    }
    closeModal();
    renderProfile();
    if (typeof onDone === "function") onDone();
  });
}

async function refreshStudentSessionFromServer() {
  if (!Api.online || !Api.token) return;
  try {
    const res = await fetch("/api/auth/me", { headers: Api.headers(), cache: "no-store" });
    if (!res.ok) return;
    const user = await res.json();
    Api.applyServerProgress(user);
    if (user.warning) showStudentWarningIfNeeded();
    else renderProfile();
  } catch { /* ignore */ }
}

function decodeLocalStudentPassword(stored) {
  if (!stored) return null;
  try {
    const decoded = decodeURIComponent(escape(atob(stored)));
    if (decoded.startsWith("qk:")) return decoded.slice(3);
  } catch { /* ignore */ }
  return null;
}

async function syncLocalPasswordsToServer() {
  if (!TeacherApi.isLoggedIn() || !Api.online) return 0;
  try {
    const users = Auth.users();
    const items = Object.entries(users)
      .map(([username, data]) => {
        const password = decodeLocalStudentPassword(data.pass);
        return password ? { username, password } : null;
      })
      .filter(Boolean);
    if (!items.length) return 0;
    const res = await TeacherApi.syncStudentPasswords(items);
    return res.synced || 0;
  } catch {
    return 0;
  }
}

function formatAdminPasswordDisplay(pass) {
  if (!pass) return `<span class="muted">Parol yo'q — tahrirlang</span>`;
  if (adminPasswordsVisible) return `<code class="admin-pass-code">${esc(pass)}</code>`;
  const len = Math.max(String(pass).length, 6);
  return `<code class="admin-pass-code admin-pass-masked">${"•".repeat(Math.min(len, 10))}</code>`;
}

function updateAdminPasswordToggleBtn() {
  const btn = $("#adminTogglePasswords");
  if (!btn) return;
  btn.setAttribute("aria-pressed", adminPasswordsVisible ? "true" : "false");
  btn.innerHTML = adminPasswordsVisible
    ? `<i class="fa-solid fa-eye-slash"></i> Parollarni yashirish`
    : `<i class="fa-solid fa-eye"></i> Parollarni ko'rsatish`;
}

function closeAdminStudentEditor() {
  const modal = $("#adminStudentModal");
  if (modal) modal.hidden = true;
  adminStudentEditId = null;
}

function openAdminStudentEditor(studentId) {
  const s = adminDashCache?.students?.find((x) => String(x.id) === String(studentId));
  if (!s) return;
  adminStudentEditId = s.id;
  $("#adminStuEditName").value = s.name || "";
  $("#adminStuEditUser").value = s.username || "";
  $("#adminStuEditPass").value = s.passwordNote || "";
  $("#adminStuEditGrade").value = String(s.grade || 3);
  setAvatarEl($("#adminStuEditAvatar"), { avatar: s.avatar || "🧒", avatarImg: s.avatarImg || s.avatar_img || null });
  const removeBtn = $("#adminStuRemoveAvatar");
  if (removeBtn) removeBtn.disabled = !(s.avatarImg || s.avatar_img);
  const modal = $("#adminStudentModal");
  if (modal) modal.hidden = false;
}

async function saveAdminStudentEditor() {
  if (!adminStudentEditId) return;
  const name = $("#adminStuEditName").value.trim();
  const username = $("#adminStuEditUser").value.trim().toLowerCase();
  const password = $("#adminStuEditPass").value;
  const grade = +$("#adminStuEditGrade").value;
  if (!name) { toast("Ism kiriting", "err"); return; }
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) { toast("Login 3–20 ta lotin harf/raqam", "err"); return; }
  if (password && password.length < 4) { toast("Parol kamida 4 belgi", "err"); return; }
  const payload = { name, username, grade };
  if (password) payload.password = password;
  const res = await TeacherApi.updateStudent(adminStudentEditId, payload);
  if (!res.ok) { toast(res.msg, "err"); return; }
  toast("O'quvchi yangilandi", "win");
  closeAdminStudentEditor();
  renderTeacher();
}

function mergeWorkPatch(base, patch) {
  if (!patch || !Object.keys(patch).length) return { ...base };
  const phTitle = !patch.title || /^yangi asar$/i.test(String(patch.title).trim());
  const phAuthor = !patch.author || /^noma[''`ʻʼ]?lum$/i.test(String(patch.author).trim());
  return {
    ...base,
    ...patch,
    title: phTitle ? base.title : patch.title,
    author: phAuthor ? base.author : patch.author,
    genre: phTitle && !String(patch.summary || "").trim() ? base.genre : (patch.genre || base.genre),
    grade: phTitle ? base.grade : (patch.grade ?? base.grade),
    part: phTitle ? base.part : (patch.part ?? base.part),
    valueMain: phTitle && patch.valueMain === "new-uhsg" ? base.valueMain : (patch.valueMain || base.valueMain),
    values: phTitle ? base.values : (patch.values?.length ? patch.values : base.values),
    summary: String(patch.summary || "").trim() ? patch.summary : base.summary,
    moral: String(patch.moral || "").trim() ? patch.moral : base.moral,
    fullText: String(patch.fullText || "").trim() ? patch.fullText : base.fullText,
    tests: patch.tests?.length ? patch.tests : base.tests,
    crossword: patch.crossword?.length ? patch.crossword : base.crossword,
    questions: patch.questions?.length ? patch.questions : base.questions,
    illustration: phTitle && patch.illustration?.emoji === "📖" ? base.illustration : (patch.illustration || base.illustration),
    keywords: patch.keywords?.length ? patch.keywords : base.keywords,
    imageUrl: patch.imageUrl ?? base.imageUrl ?? null,
  };
}

function rebuildWorksCatalog(catalog) {
  adminWorkCatalog = catalog || { works: [], overrides: {}, hiddenIds: [] };
  const hidden = new Set(adminWorkCatalog.hiddenIds || []);
  TEXTBOOK_WORKS.length = 0;
  BASE_TEXTBOOK_WORKS.forEach((base) => {
    if (hidden.has(base.id)) return;
    const patch = adminWorkCatalog.overrides?.[base.id];
    TEXTBOOK_WORKS.push(mergeWorkPatch(base, patch));
  });
  (adminWorkCatalog.works || []).forEach((w) => {
    const idx = TEXTBOOK_WORKS.findIndex((x) => x.id === w.id);
    if (idx >= 0) TEXTBOOK_WORKS[idx] = { ...w };
    else TEXTBOOK_WORKS.push({ ...w });
  });
  adminCustomWorks = adminWorkCatalog.works || [];
  renderAboutStats();
  if (typeof buildBotKnowledge === "function") {
    window.BOT_KNOWLEDGE = buildBotKnowledge();
  }
}

async function loadCustomWorksIntoCatalog() {
  if (!Api.online) return;
  try {
    const catalog = await TeacherApi.fetchWorksCatalog();
    rebuildWorksCatalog(catalog);
  } catch {
    try {
      const rows = await TeacherApi.fetchCustomWorks();
      rebuildWorksCatalog({ works: rows, overrides: {}, hiddenIds: [] });
    } catch { /* ignore */ }
  }
}

function setAdminTab(tabName) {
  $$(".admin-tab").forEach((t) => t.classList.toggle("active", t.dataset.adminTab === tabName));
  $$(".admin-panel").forEach((p) => {
    const active = p.dataset.adminPanel === tabName;
    p.classList.toggle("active", active);
    p.hidden = !active;
  });
  if (tabName === "crossword") renderAdminCrosswordPanel();
  if (tabName === "match") renderAdminMatchPanel();
  if (tabName === "quiz") renderAdminQuizPanel();
  if (tabName === "map") renderAdminMapPanel();
}

function renderAdminStats(stats) {
  const row = $("#adminStatsRow");
  if (!row || !stats) return;
  row.innerHTML = `
    <div class="admin-stat-card"><b>${stats.total}</b><span>O'quvchi</span></div>
    <div class="admin-stat-card accent-blue"><b>${stats.totalIjod ?? 0}</b><span>Ijod rasmi</span></div>
    <div class="admin-stat-card accent-green"><b>${stats.avgXp}</b><span>O'rtacha XP</span></div>
    <div class="admin-stat-card accent-purple"><b>${stats.grade3}/${stats.grade4}</b><span>3/4-sinf</span></div>`;
}

function renderAdminLeaderPreview(students) {
  const host = $("#adminLeaderPreview");
  if (!host) return;
  if (!students?.length) {
    host.innerHTML = `<p class="muted">Hali o'quvchi yo'q.</p>`;
    return;
  }
  host.innerHTML = students.slice(0, 5).map((s, i) => `
    <div class="admin-leader-item">
      <span class="admin-leader-rank">${i + 1}</span>
      ${renderLbAvatar(s)}
      <div class="admin-leader-meta">
        <b>${esc(s.name)}</b>
        <small class="muted">@${esc(s.username)} · ${s.grade}-sinf</small>
      </div>
      <span class="admin-leader-xp">${s.xp} XP</span>
    </div>`).join("");
}

function renderAdminStudentsTable(students, isAdmin) {
  const table = $("#adminStudentsTable");
  const empty = $("#teacherStudentsEmpty");
  if (!table) return;
  updateAdminPasswordToggleBtn();
  if (!students?.length) {
    table.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  table.innerHTML = `<thead><tr>
    <th>O'quvchi</th><th>Login</th><th>Parol</th><th>Sinf</th><th>XP</th><th>⭐</th><th>Asar</th><th>Rasm</th><th>Amallar</th>
  </tr></thead><tbody>${students.map((s) => `
    <tr data-stu-id="${s.id}">
      <td class="admin-stu-cell">${renderAdminStudentNameCell(s)}</td>
      <td><code class="admin-login-code">@${esc(s.username)}</code></td>
      <td>${formatAdminPasswordDisplay(s.passwordNote)}</td>
      <td>${s.grade}-sinf</td>
      <td>${s.xp}</td>
      <td>${s.stars ?? 0}</td>
      <td>${s.readWorks ?? 0}</td>
      <td>${s.ijodCount ?? 0}</td>
      <td class="admin-actions">
        <button type="button" class="ghost-btn admin-mini-btn" data-stu-edit="${s.id}" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="ghost-btn admin-mini-btn admin-warn-btn" data-stu-warn="${s.id}" title="Ogohlantirish yuborish"><i class="fa-solid fa-triangle-exclamation"></i></button>
        ${isAdmin ? `<button type="button" class="ghost-btn admin-mini-btn admin-danger" data-stu-del="${s.id}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>` : ""}
      </td>
    </tr>`).join("")}</tbody>`;

  table.querySelectorAll("[data-stu-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openAdminStudentEditor(btn.dataset.stuEdit));
  });
  table.querySelectorAll("[data-stu-warn]").forEach((btn) => {
    btn.addEventListener("click", () => openAdminStudentWarning(btn.dataset.stuWarn));
  });
  if (isAdmin) {
    table.querySelectorAll("[data-stu-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("O'quvchini o'chirishni tasdiqlaysizmi?")) return;
        const res = await TeacherApi.deleteStudent(btn.dataset.stuDel);
        if (res.ok) { toast("O'chirildi", "win"); renderTeacher(); }
        else toast(res.msg, "err");
      });
    });
  }
}

async function renderAdminIjodGrid() {
  const grid = $("#adminIjodGrid");
  const empty = $("#adminIjodEmpty");
  if (!grid) return;
  try {
    adminIjodCache = await TeacherApi.fetchIjodAdmin();
  } catch {
    grid.innerHTML = "";
    if (empty) { empty.hidden = false; empty.textContent = "Rasmlarni yuklab bo'lmadi."; }
    return;
  }
  if (!adminIjodCache.length) {
    grid.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  grid.innerHTML = adminIjodCache.map((item) => {
    const v = getValueById(item.value_id || item.valueId);
    const hidden = item.hidden ? " admin-ijod-hidden" : "";
    return `<article class="admin-ijod-card${hidden}" data-ijod-id="${esc(item.id)}">
      <img src="${esc(item.image_url || item.imageUrl)}" alt="${esc(item.title)}" loading="lazy">
      <div class="admin-ijod-body">
        <input type="text" class="admin-ijod-title" value="${esc(item.title)}" aria-label="Sarlavha">
        <select class="admin-ijod-value">${VALUES.map((val) => `<option value="${val.id}"${val.id === (item.value_id || item.valueId) ? " selected" : ""}>${esc(val.name)}</option>`).join("")}</select>
        <p class="muted admin-ijod-meta">${esc(item.author_name || item.authorName || item.username)} · ${item.grade}-sinf · ⭐ ${item.averageRating || 0} (${item.ratingCount || 0})</p>
        <div class="admin-ijod-actions">
          <button type="button" class="ghost-btn admin-mini-btn" data-ijod-save="${esc(item.id)}"><i class="fa-solid fa-floppy-disk"></i> Saqlash</button>
          <button type="button" class="ghost-btn admin-mini-btn" data-ijod-hide="${esc(item.id)}">${item.hidden ? "Ko'rsatish" : "Yashirish"}</button>
          <button type="button" class="ghost-btn admin-mini-btn admin-danger" data-ijod-del="${esc(item.id)}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll("[data-ijod-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".admin-ijod-card");
      const id = btn.dataset.ijodSave;
      const res = await TeacherApi.updateIjodAdmin(id, {
        title: card.querySelector(".admin-ijod-title").value,
        valueId: card.querySelector(".admin-ijod-value").value,
      });
      toast(res.ok ? "Saqlandi" : res.msg, res.ok ? "win" : "err");
    });
  });
  grid.querySelectorAll("[data-ijod-hide]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".admin-ijod-card");
      const id = btn.dataset.ijodHide;
      const hide = !card.classList.contains("admin-ijod-hidden");
      const res = await TeacherApi.updateIjodAdmin(id, { hidden: hide });
      if (res.ok) renderAdminIjodGrid();
      else toast(res.msg, "err");
    });
  });
  grid.querySelectorAll("[data-ijod-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Rasmni o'chirishni tasdiqlaysizmi?")) return;
      const res = await TeacherApi.deleteIjodAdmin(btn.dataset.ijodDel);
      if (res.ok) { toast("O'chirildi", "win"); renderAdminIjodGrid(); renderTeacher(); }
      else toast(res.msg, "err");
    });
  });
}

function renderAdminWorksTable() {
  const table = $("#adminWorksTable");
  if (!table) return;
  updateAdminWorksSortUi();
  const rows = sortAdminWorksItems(TEXTBOOK_WORKS).map((w) => {
    const v = getValueById(w.valueMain);
    const custom = w.custom ? `<span class="admin-badge-custom">Yangi</span>` : `<span class="admin-badge-textbook">Darslik</span>`;
    const imgSrc = workImgSrc(w);
    const testCount = w.tests?.length || 0;
    return `<tr data-work-id="${esc(w.id)}">
      <td class="admin-work-thumb-cell"><img src="${esc(imgSrc)}" alt="" class="admin-work-thumb" onerror="this.classList.add('admin-work-thumb--fallback')"></td>
      <td><b>${esc(w.title)}</b> ${custom}<br><small class="muted">${testCount} test · puzzle rasm</small></td>
      <td>${esc(w.author)}</td>
      <td>${w.grade}</td>
      <td>${esc(v.name)}</td>
      <td class="admin-actions">
        <button type="button" class="ghost-btn admin-mini-btn" data-work-edit="${esc(w.id)}" title="Tahrirlash"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="ghost-btn admin-mini-btn admin-danger" data-work-del="${esc(w.id)}" title="O'chirish"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }).join("");
  table.innerHTML = `<thead><tr><th>Rasm</th><th>Asar</th><th>Muallif</th><th>Sinf</th><th>Qadriyat</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  table.querySelectorAll("[data-work-edit]").forEach((btn) => {
    btn.addEventListener("click", () => openAdminWorkEditor(btn.dataset.workEdit));
  });
  table.querySelectorAll("[data-work-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Asarni o'chirishni tasdiqlaysizmi? Saytdan ham yashiriladi.")) return;
      const res = await TeacherApi.deleteWork(btn.dataset.workDel);
      if (res.ok) {
        await loadCustomWorksIntoCatalog();
        toast("Asar o'chirildi", "win");
        renderAdminWorksTable();
        drawTeacherCharts();
      } else toast(res.msg, "err");
    });
  });
}

function readImageFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function collectAdminWorkTestsFromEditor() {
  const host = $("#adminWorkTestsEditor");
  if (!host) return [];
  return [...host.querySelectorAll(".admin-test-row")].map((row) => {
    const options = [...row.querySelectorAll(".admin-test-opt")].map((inp) => inp.value.trim());
    const correct = +row.querySelector(".admin-test-correct")?.value || 0;
    return {
      q: row.querySelector(".admin-test-q")?.value.trim() || "",
      options: options.length >= 4 ? options : [...options, "", "", ""].slice(0, 4),
      correct: Math.min(Math.max(correct, 0), 3),
    };
  }).filter((t) => t.q);
}

function renderAdminWorkTestsEditor(tests) {
  const host = $("#adminWorkTestsEditor");
  if (!host) return;
  const list = tests?.length ? tests : [{ q: "", options: ["", "", "", ""], correct: 0 }];
  host.innerHTML = list.map((t, i) => `
    <div class="admin-test-row" data-test-idx="${i}">
      <label class="admin-test-label">Savol ${i + 1}</label>
      <input type="text" class="admin-test-q" value="${esc(t.q)}" placeholder="Savol matni" />
      <div class="admin-test-options">
        ${(t.options || ["", "", "", ""]).slice(0, 4).map((opt, oi) => `
          <label class="admin-test-opt-row">
            <span class="admin-test-opt-num">${oi + 1}.</span>
            <input type="text" class="admin-test-opt" value="${esc(opt)}" placeholder="Javob matni" aria-label="Variant ${oi + 1}" />
          </label>`).join("")}
      </div>
      <label class="admin-test-correct-wrap">To'g'ri javob:
        <select class="admin-test-correct">
          ${[0, 1, 2, 3].map((n) => `<option value="${n}" ${t.correct === n ? "selected" : ""}>${n + 1}-variant</option>`).join("")}
        </select>
      </label>
    </div>`).join("");
}

function closeAdminWorkEditor() {
  const modal = $("#adminWorkModal");
  if (modal) modal.hidden = true;
  adminWorkEditId = null;
  adminWorkEditImageBase64 = null;
}

function openAdminWorkEditor(workId) {
  const w = getWorkById(workId);
  if (!w) return;
  adminWorkEditId = workId;
  adminWorkEditImageBase64 = null;
  const modal = $("#adminWorkModal");
  if (!modal) return;
  $("#adminWorkEditTitle").value = w.title || "";
  $("#adminWorkEditAuthor").value = w.author || "";
  $("#adminWorkEditGrade").value = String(w.grade || 3);
  $("#adminWorkEditGenre").value = w.genre || "hikoya";
  $("#adminWorkEditValue").value = w.valueMain || "halollik";
  $("#adminWorkEditSummary").value = w.summary || "";
  $("#adminWorkEditMoral").value = w.moral || "";
  $("#adminWorkEditFullText").value = w.fullText || "";
  const preview = $("#adminWorkEditImgPreview");
  if (preview) {
    preview.src = workImgSrc(w);
    preview.onerror = () => preview.classList.add("admin-work-preview--fallback");
  }
  renderAdminWorkTestsEditor(w.tests || []);
  modal.hidden = false;
}

async function saveAdminWorkEditor() {
  if (!adminWorkEditId) return;
  const payload = {
    title: $("#adminWorkEditTitle").value.trim(),
    author: $("#adminWorkEditAuthor").value.trim(),
    grade: +$("#adminWorkEditGrade").value,
    genre: $("#adminWorkEditGenre").value,
    valueMain: $("#adminWorkEditValue").value,
    values: [$("#adminWorkEditValue").value],
    summary: $("#adminWorkEditSummary").value.trim(),
    moral: $("#adminWorkEditMoral").value.trim(),
    fullText: $("#adminWorkEditFullText").value.trim(),
    tests: collectAdminWorkTestsFromEditor(),
  };
  if (adminWorkEditImageBase64) payload.imageBase64 = adminWorkEditImageBase64;
  const res = await TeacherApi.updateWork(adminWorkEditId, payload);
  if (!res.ok) { toast(res.msg, "err"); return; }
  await loadCustomWorksIntoCatalog();
  toast("Asar saqlandi", "win");
  closeAdminWorkEditor();
  renderAdminWorksTable();
  drawTeacherCharts();
}

async function renderAdminStaffTable() {
  const table = $("#adminStaffTable");
  if (!table) return;
  try {
    const staff = await TeacherApi.fetchStaff();
    table.innerHTML = `<thead><tr><th>Ism</th><th>Login</th><th>Maktab</th><th>Rol</th></tr></thead><tbody>${
      staff.map((t) => `<tr><td><b>${esc(t.name)}</b></td><td>@${esc(t.username)}</td><td>${esc(t.school || "—")}</td><td>${t.isAdmin ? "Admin" : "Moderator"}</td></tr>`).join("")
    }</tbody>`;
  } catch {
    table.innerHTML = `<tbody><tr><td class="muted">Yuklab bo'lmadi</td></tr></tbody>`;
  }
}

function drawTeacherCharts() {
  if (typeof Chart === "undefined") return;
  const counts = valuesDistribution();
  const labels = VALUES.map((v) => v.name);
  const data = VALUES.map((v) => counts[v.id]);
  const colors = VALUES.map((v) => v.color);

  if (teacherCharts.values) teacherCharts.values.destroy();
  teacherCharts.values = new Chart($("#valuesChart"), {
    type: "polarArea",
    data: { labels, datasets: [{ data, backgroundColor: colors.map((c) => c + "cc") }] },
    options: { plugins: { legend: { position: "bottom", labels: { font: { family: "Quicksand" } } }, title: { display: true, text: "Qadriyatlar bo'yicha asarlar" } } },
  });

  const g3 = TEXTBOOK_WORKS.filter((w) => w.grade === 3).length;
  const g4 = TEXTBOOK_WORKS.filter((w) => w.grade === 4).length;
  if (teacherCharts.grade) teacherCharts.grade.destroy();
  teacherCharts.grade = new Chart($("#gradeChart"), {
    type: "doughnut",
    data: { labels: ["3-sinf", "4-sinf"], datasets: [{ data: [g3, g4], backgroundColor: ["#e6821e", "#3a8fd6"] }] },
    options: { plugins: { legend: { position: "bottom" }, title: { display: true, text: "Sinflar bo'yicha asarlar" } } },
  });
}

function valuesDistribution() {
  const counts = {};
  VALUES.forEach((v) => (counts[v.id] = 0));
  TEXTBOOK_WORKS.forEach((w) => w.values.forEach((id) => { if (counts[id] != null) counts[id]++; }));
  return counts;
}

async function renderTeacher() {
  const t = TeacherApi.teacher || TeacherApi.loadCachedTeacher();
  const welcome = $("#teacherWelcome");
  const title = $("#adminWelcomeTitle");
  if (title && t) title.textContent = `Salom, ${t.name}!`;
  if (welcome && t) {
    welcome.textContent = t.isAdmin
      ? "Siz admin sifatida saytni to'liq boshqarasiz — o'quvchilar, rasmlar va asarlar."
      : "Moderator sifatida o'quvchilar va ijod galereyasini kuzatishingiz mumkin.";
  }

  const staffTab = $(".admin-tab-admin-only");
  if (staffTab) staffTab.hidden = !(t?.isAdmin);

  if (!Api.online || !TeacherApi.isLoggedIn()) {
    renderAdminStats({ total: 0, totalIjod: 0, avgXp: 0, grade3: 0, grade4: 0 });
    return;
  }

  await Promise.all([loadCustomWorksIntoCatalog(), loadValuesIntoCatalog()]);

  const synced = await syncLocalPasswordsToServer();

  try {
    adminDashCache = await TeacherApi.fetchDashboard();
    renderAdminStats(adminDashCache.stats);
    renderAdminLeaderPreview(adminDashCache.students);
    renderAdminStudentsTable(adminDashCache.students, !!adminDashCache.isAdmin);
    if (synced > 0) toast(`${synced} ta o'quvchi paroli topildi va saqlandi`, "win");
  } catch {
    toast("Dashboard yuklanmadi", "err");
  }

  drawTeacherCharts();
  renderAdminWorksTable();
  renderAdminValuesTable();
  renderAdminCrosswordPanel();
  renderAdminMatchPanel();
  renderAdminQuizPanel();
  renderAdminMapPanel();
  await renderAdminIjodGrid();
  if (t?.isAdmin) await renderAdminStaffTable();
}

function bindAdminPanelEvents() {
  if ($("#adminTabs")?.dataset.bound) return;
  $("#adminTabs").dataset.bound = "1";

  $$(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => setAdminTab(tab.dataset.adminTab));
  });

  $("#adminCreateStudentForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await TeacherApi.createStudent({
      name: $("#adminStuName").value.trim(),
      username: $("#adminStuUser").value.trim(),
      password: $("#adminStuPass").value,
      grade: +$("#adminStuGrade").value,
    });
    if (!res.ok) { toast(res.msg, "err"); return; }
    toast("O'quvchi qo'shildi!", "win");
    e.target.reset();
    renderTeacher();
  });

  $("#adminTogglePasswords")?.addEventListener("click", () => {
    adminPasswordsVisible = !adminPasswordsVisible;
    if (adminDashCache?.students) renderAdminStudentsTable(adminDashCache.students, !!adminDashCache.isAdmin);
  });

  $("#adminStudentModalBackdrop")?.addEventListener("click", closeAdminStudentEditor);
  $("#adminStuEditClose")?.addEventListener("click", closeAdminStudentEditor);
  $("#adminStuEditCancel")?.addEventListener("click", closeAdminStudentEditor);
  $("#adminStuEditSave")?.addEventListener("click", saveAdminStudentEditor);
  $("#adminStuRemoveAvatar")?.addEventListener("click", () => {
    if (adminStudentEditId) removeAdminStudentAvatar(adminStudentEditId);
  });
  $("#adminStudentWarnBackdrop")?.addEventListener("click", closeAdminStudentWarning);
  $("#adminStuWarnClose")?.addEventListener("click", closeAdminStudentWarning);
  $("#adminStuWarnCancel")?.addEventListener("click", closeAdminStudentWarning);
  $("#adminStuWarnSend")?.addEventListener("click", sendAdminStudentWarning);

  $("#adminCreateWorkForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const valueMain = $("#adminWorkValue").value;
    let imageBase64 = null;
    const fileInput = $("#adminWorkImage");
    if (fileInput?.files?.[0]) {
      try {
        imageBase64 = await readImageFileAsBase64(fileInput.files[0]);
      } catch {
        toast("Rasm yuklanmadi", "err");
        return;
      }
    }
    const res = await TeacherApi.createWork({
      title: $("#adminWorkTitle").value.trim(),
      author: $("#adminWorkAuthor").value.trim(),
      grade: +$("#adminWorkGrade").value,
      genre: $("#adminWorkGenre").value,
      valueMain,
      values: [valueMain],
      summary: $("#adminWorkSummary").value.trim(),
      moral: $("#adminWorkMoral").value.trim(),
      fullText: $("#adminWorkFullText")?.value?.trim() || "",
      imageBase64,
    });
    if (!res.ok) { toast(res.msg, "err"); return; }
    await loadCustomWorksIntoCatalog();
    toast(`Asar qo'shildi! 10 ta test va puzzle rasmi yaratildi.`, "win");
    e.target.reset();
    if ($("#adminWorkImagePreview")) $("#adminWorkImagePreview").removeAttribute("src");
    renderAdminWorksTable();
    drawTeacherCharts();
  });

  $("#adminWorkImage")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    const preview = $("#adminWorkImagePreview");
    if (!file || !preview) return;
    try {
      preview.src = await readImageFileAsBase64(file);
      preview.hidden = false;
    } catch { /* ignore */ }
  });

  $("#adminWorkModalBackdrop")?.addEventListener("click", closeAdminWorkEditor);
  $("#adminWorkEditClose")?.addEventListener("click", closeAdminWorkEditor);
  $("#adminWorkEditCancel")?.addEventListener("click", closeAdminWorkEditor);
  $("#adminWorkEditSave")?.addEventListener("click", saveAdminWorkEditor);
  $("#adminWorkEditImage")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      adminWorkEditImageBase64 = await readImageFileAsBase64(file);
      const preview = $("#adminWorkEditImgPreview");
      if (preview) { preview.src = adminWorkEditImageBase64; preview.classList.remove("admin-work-preview--fallback"); }
    } catch {
      toast("Rasm yuklanmadi", "err");
    }
  });
  $("#adminWorkRegenTests")?.addEventListener("click", async () => {
    if (!adminWorkEditId) return;
    if (!confirm("Testlar qayta avtomatik yaratilsinmi? Joriy testlar o'chadi.")) return;
    const res = await TeacherApi.updateWork(adminWorkEditId, {
      title: $("#adminWorkEditTitle").value.trim(),
      author: $("#adminWorkEditAuthor").value.trim(),
      grade: +$("#adminWorkEditGrade").value,
      genre: $("#adminWorkEditGenre").value,
      valueMain: $("#adminWorkEditValue").value,
      summary: $("#adminWorkEditSummary").value.trim(),
      moral: $("#adminWorkEditMoral").value.trim(),
      regenerateTests: true,
    });
    if (res.ok && res.work?.tests) {
      renderAdminWorkTestsEditor(res.work.tests);
      toast("10 ta test yaratildi", "win");
    } else toast(res.msg || "Xatolik", "err");
  });
  $("#adminWorkAddTest")?.addEventListener("click", () => {
    const tests = collectAdminWorkTestsFromEditor();
    tests.push({ q: "", options: ["", "", "", ""], correct: 0 });
    renderAdminWorkTestsEditor(tests);
  });

  $("#adminCreateTeacherForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await TeacherApi.createTeacher({
      name: $("#adminTchName").value.trim(),
      username: $("#adminTchUser").value.trim(),
      password: $("#adminTchPass").value,
      school: $("#adminTchSchool").value.trim(),
    });
    if (!res.ok) { toast(res.msg, "err"); return; }
    toast("Yangi login yaratildi!", "win");
    e.target.reset();
    renderAdminStaffTable();
  });

  $("#adminCreateValueForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await TeacherApi.createValue({
      name: $("#adminValName").value.trim(),
      icon: $("#adminValIcon").value.trim() || "fa-star",
      color: $("#adminValColor").value,
      desc: $("#adminValDesc").value.trim(),
    });
    if (!res.ok) { toast(res.msg, "err"); return; }
    toast("Qadriyat qo'shildi!", "win");
    e.target.reset();
    $("#adminValIcon").value = "fa-star";
    $("#adminValColor").value = "#e6821e";
    await loadValuesIntoCatalog();
    renderAdminValuesTable();
    drawTeacherCharts();
  });

  $("#adminValueModalBackdrop")?.addEventListener("click", closeAdminValueEditor);
  $("#adminValueEditClose")?.addEventListener("click", closeAdminValueEditor);
  $("#adminValueEditCancel")?.addEventListener("click", closeAdminValueEditor);
  $("#adminValueEditSave")?.addEventListener("click", saveAdminValueEditor);

  $("#adminCwWorkSelect")?.addEventListener("change", (e) => loadAdminCrosswordForWork(e.target.value));
  $("#adminCwModeEdit")?.addEventListener("click", () => setAdminCwMode("edit"));
  $("#adminCwModeNew")?.addEventListener("click", () => setAdminCwMode("new"));
  $("#adminCwClearRows")?.addEventListener("click", startAdminCwBlank);
  $("#adminCwParseLines")?.addEventListener("click", applyAdminCwFromLines);
  $("#adminCwAutoGen")?.addEventListener("click", applyAdminCwAutoGen);
  $("#adminCwAddRow")?.addEventListener("click", () => {
    adminCwEntries.push({ clue: "", word: "" });
    renderAdminCwEntriesTable();
    renderAdminCwPreview();
  });
  $("#adminCwSave")?.addEventListener("click", saveAdminCrossword);

  $("#adminMatchAddRow")?.addEventListener("click", () => {
    const w = TEXTBOOK_WORKS[0];
    adminMatchPairs.push({ workId: w?.id || "", valueId: w?.valueMain || VALUES[0]?.id || "" });
    renderAdminMatchTable();
  });
  $("#adminMatchPickCount")?.addEventListener("change", updateAdminMatchStatus);
  $("#adminMatchAutoFill")?.addEventListener("click", adminMatchAutoFill);
  $("#adminMatchSave")?.addEventListener("click", saveAdminMatchPairs);

  $$("[data-quiz-tab]").forEach((btn) => btn.addEventListener("click", () => setAdminQuizTab(btn.dataset.quizTab)));
  $("#adminQuizSave")?.addEventListener("click", saveAdminQuizGames);
  $("#adminQuizGuessPick")?.addEventListener("change", () => updateAdminQuizStatus("guess"));
  $("#adminQuizAuthorPick")?.addEventListener("change", () => updateAdminQuizStatus("author"));
  $("#adminQuizTfPick")?.addEventListener("change", () => updateAdminQuizStatus("truefalse"));
  $("#adminQuizGuessAdd")?.addEventListener("click", () => {
    const w = TEXTBOOK_WORKS[0];
    adminQuizGuess.push({ workId: w?.id || "", clue: "", clueType: "saboq" });
    renderAdminQuizGuessTable();
  });
  $("#adminQuizGuessAuto")?.addEventListener("click", () => {
    adminQuizGuess = buildAdminQuizGuessFromWorks();
    renderAdminQuizGuessTable();
    toast(`${adminQuizGuess.length} ta savol qo'shildi`, "win");
  });
  $("#adminQuizGuessClear")?.addEventListener("click", () => {
    adminQuizGuess = [];
    renderAdminQuizGuessTable();
    toast("Asar topish — avtomatik rejim", "info");
  });
  $("#adminQuizAuthorAdd")?.addEventListener("click", () => {
    const w = TEXTBOOK_WORKS[0];
    adminQuizAuthor.push({ workId: w?.id || "" });
    renderAdminQuizAuthorTable();
  });
  $("#adminQuizAuthorAuto")?.addEventListener("click", () => {
    adminQuizAuthor = buildAdminQuizAuthorFromWorks();
    renderAdminQuizAuthorTable();
    toast(`${adminQuizAuthor.length} ta asar qo'shildi`, "win");
  });
  $("#adminQuizAuthorClear")?.addEventListener("click", () => {
    adminQuizAuthor = [];
    renderAdminQuizAuthorTable();
    toast("Muallifni top — avtomatik rejim", "info");
  });
  $("#adminQuizTfAdd")?.addEventListener("click", () => {
    adminQuizTrueFalse.push({ workId: TEXTBOOK_WORKS[0]?.id || "", text: "", isTrue: true });
    renderAdminQuizTfTable();
  });
  $("#adminQuizTfAuto")?.addEventListener("click", () => {
    adminQuizTrueFalse = buildAdminQuizTfFromWorks();
    renderAdminQuizTfTable();
    toast(`${adminQuizTrueFalse.length} ta gap yaratildi`, "win");
  });
  $("#adminQuizTfClear")?.addEventListener("click", () => {
    adminQuizTrueFalse = [];
    renderAdminQuizTfTable();
    toast("To'g'ri/Noto'g'ri — avtomatik rejim", "info");
  });

  $("#adminMapSave")?.addEventListener("click", saveAdminMapConfig);
  $("#adminMapRegionSelect")?.addEventListener("change", (e) => {
    selectAdminMapRegion(e.target.value);
  });
  ["adminMapPosX", "adminMapPosY"].forEach((id) => {
    $("#" + id)?.addEventListener("input", () => {
      if (!adminMapSelectedId) return;
      const entry = adminMapDraftEntry(adminMapSelectedId);
      if (!entry) return;
      entry.mapX = +($("#adminMapPosX")?.value || entry.mapX);
      entry.mapY = +($("#adminMapPosY")?.value || entry.mapY);
      updateAdminMapPinEl(adminMapSelectedId);
    });
  });
  ["adminMapWorkSelect", "adminMapValueSelect", "adminMapStory", "adminMapTale", "adminMapTradition", "adminMapFact"].forEach((id) => {
    $("#" + id)?.addEventListener("change", syncAdminMapFormToDraft);
    $("#" + id)?.addEventListener("input", syncAdminMapFormToDraft);
  });
  $("#adminMapInfoImage")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAdminMapInfographic(file);
  });
  $("#adminMapInfoRemove")?.addEventListener("click", removeAdminMapInfographic);
  $("#adminMapBgImage")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAdminMapBackground(file);
  });
  $("#adminMapBgRemove")?.addEventListener("click", removeAdminMapBackground);
  const adminMapPins = $("#adminMapEditorPins");
  if (adminMapPins && !adminMapPins.dataset.bound) {
    adminMapPins.dataset.bound = "1";
    adminMapPins.addEventListener("pointerdown", onAdminMapPinPointerDown);
    adminMapPins.addEventListener("pointermove", onAdminMapPinPointerMove);
    adminMapPins.addEventListener("pointerup", onAdminMapPinPointerUp);
    adminMapPins.addEventListener("pointercancel", onAdminMapPinPointerUp);
  }

  $("#adminWorksSortNewest")?.addEventListener("click", () => setAdminWorksSortMode("newest"));
  $("#adminWorksSortTitle")?.addEventListener("click", () => setAdminWorksSortMode("title"));
  $("#adminWorksSortGrade")?.addEventListener("click", () => setAdminWorksSortMode("grade"));
  $("#adminWorksSortValue")?.addEventListener("click", () => setAdminWorksSortMode("value"));
}

/* ====================== 12. OTA-ONALAR PANELI ====================== */
let parentCharts = {};
function renderParent() {
  const d = Store.data;
  const lv = getLevel(d.xp);
  $("#parentStats").innerHTML = `
    <div class="pstat"><div class="ps-ico"><i class="fa-solid fa-book-open"></i></div><b>${d.readWorks.length}/${TEXTBOOK_WORKS.length}</b><span>O'qilgan asarlar</span></div>
    <div class="pstat"><div class="ps-ico"><i class="fa-solid fa-award"></i></div><b>${d.certificates.length}</b><span>Sertifikatlar</span></div>
    <div class="pstat"><div class="ps-ico"><i class="fa-solid fa-fire"></i></div><b>${d.streak}</b><span>Kunlik seriya</span></div>
    <div class="pstat"><div class="ps-ico"><i class="fa-solid fa-ranking-star"></i></div><b>${lv.info.badge}</b><span>Joriy daraja</span></div>`;

  drawParentCharts();

  // Tavsiyalar
  const weakValues = computeChildValues();
  const lowest = Object.entries(weakValues).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([id]) => getValueById(id).name);
  const tips = [
    `Farzandingiz <b>${d.readWorks.length}</b> ta asarni o'qigan. Birga o'qib, mazmunini muhokama qiling.`,
    `<b>${lowest.join(" va ")}</b> qadriyatlariga oid asarlarni ko'proq o'qishni taklif qiling.`,
    d.streak >= 3 ? `Ajoyib! Farzandingiz ${d.streak} kun ketma-ket shug'ullanmoqda — bu odatni rag'batlantiring. 🔥` : "Har kuni 10 daqiqa o'qish odatini shakllantiring.",
    "Test natijalarini birga ko'rib chiqing va sertifikatlar bilan tabriklang.",
  ];
  $("#parentTips").innerHTML = tips.map((t) => `<li><i class="fa-solid fa-circle-check"></i> <span>${t}</span></li>`).join("");
}

function computeChildValues() {
  // o'qilgan asarlar bo'yicha qadriyatlar qamrovi
  const counts = {};
  VALUES.forEach((v) => (counts[v.id] = 0));
  Store.data.readWorks.forEach((wid) => {
    const w = getWorkById(wid);
    if (w) w.values.forEach((id) => { if (counts[id] != null) counts[id] += 1; });
  });
  return counts;
}

function drawParentCharts() {
  if (typeof Chart === "undefined") return;
  // Haftalik faollik (oxirgi 7 kun)
  const days = [], xpData = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    days.push(["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"][dt.getDay()]);
    xpData.push(Store.data.activity[key] || 0);
  }
  if (parentCharts.activity) parentCharts.activity.destroy();
  parentCharts.activity = new Chart($("#activityChart"), {
    type: "bar",
    data: { labels: days, datasets: [{ label: "XP", data: xpData, backgroundColor: "#e6821e", borderRadius: 8 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });

  const cv = computeChildValues();
  if (parentCharts.values) parentCharts.values.destroy();
  parentCharts.values = new Chart($("#parentValuesChart"), {
    type: "radar",
    data: { labels: VALUES.map((v) => v.name), datasets: [{ label: "O'zlashtirish", data: VALUES.map((v) => cv[v.id]), backgroundColor: "rgba(230,130,30,0.25)", borderColor: "#e6821e", pointBackgroundColor: "#c26b1a" }] },
    options: { plugins: { legend: { display: false } }, scales: { r: { beginAtZero: true, ticks: { stepSize: 1 } } } },
  });
}

/* ====================== 13. AUDIO HIKOYALAR ====================== */
function renderAudio() {
  $("#audioGrid").innerHTML = TEXTBOOK_WORKS.map((w) => `
    <div class="audio-item" data-work="${w.id}">
      <button type="button" class="a-play" aria-label="${esc(w.title)} — eshitish"><i class="fa-solid fa-play"></i></button>
      <div><h4>${esc(w.title)}</h4><small>${esc(w.author)} · ${w.grade}-sinf</small></div>
    </div>`).join("");
  $$("#audioGrid .audio-item").forEach((el) => {
    el.querySelector(".a-play").addEventListener("click", () => playAudio(el, el.dataset.work));
  });
}

function playAudio(el, workId) {
  const w = getWorkById(workId);
  if (!w) { toast("Asar topilmadi", "err"); return; }
  if (!("speechSynthesis" in window)) { toast("Brauzer ovozli o'qishni qo'llab-quvvatlamaydi."); return; }
  const synth = window.speechSynthesis;
  if (el.classList.contains("playing")) {
    synth.cancel();
    el.classList.remove("playing");
    el.querySelector(".a-play i").className = "fa-solid fa-play";
    return;
  }
  synth.cancel();
  $$("#audioGrid .audio-item").forEach((x) => { x.classList.remove("playing"); x.querySelector(".a-play i").className = "fa-solid fa-play"; });
  const text = `${w.title}. ${w.author}. ${w.summary} Saboq: ${w.moral}`;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "uz-UZ";
  if (!u.lang || u.lang === "") u.lang = "tr-TR";
  u.rate = 0.95;
  u.onend = () => { el.classList.remove("playing"); el.querySelector(".a-play i").className = "fa-solid fa-play"; };
  el.classList.add("playing");
  el.querySelector(".a-play i").className = "fa-solid fa-pause";
  synth.speak(u);
  if (!Store.data.readWorks.includes(workId)) { addXP(10, true); }
}

/* ====================== 14. IJOD GALEREYASI ====================== */
let ijodItemsCache = [];
let ijodSortMode = "newest";
const IJOD_PAGE_SIZE = 30;
let ijodPage = 1;
let ijodRandomOrder = null;
let ijodRandomOrderSource = "";

const IJOD_SORT_META = {
  newest: {
    icon: "fa-clock",
    status: "Eng yangi rasmlar birinchi ko'rsatilmoqda",
  },
  rating: {
    icon: "fa-star",
    status: "Eng yuqori baholangan rasmlar birinchi ko'rsatilmoqda",
  },
  random: {
    icon: "fa-shuffle",
    status: "Rasmlar tasodifiy tartibda ko'rsatilmoqda",
  },
};

function ijodItemTime(item) {
  const raw = item?.createdAt ?? item?.created_at;
  if (raw) {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return t;
  }
  const m = String(item?.id ?? "").match(/^(\d{13})/);
  if (m) return Number(m[1]);
  return 0;
}

function ijodRandomOrderKey(items) {
  return items.map((i) => i.id).sort().join("|");
}

function applyIjodRandomOrder(items) {
  const key = ijodRandomOrderKey(items);
  if (ijodRandomOrderSource !== key || !ijodRandomOrder) {
    const shuffled = shuffle([...items]);
    ijodRandomOrder = new Map(shuffled.map((item, idx) => [item.id, idx]));
    ijodRandomOrderSource = key;
  }
  const arr = [...items];
  arr.sort((a, b) => (ijodRandomOrder.get(a.id) ?? 0) - (ijodRandomOrder.get(b.id) ?? 0));
  return arr;
}

function resetIjodRandomOrder() {
  ijodRandomOrder = null;
  ijodRandomOrderSource = "";
}

function getIjodSortedItems() {
  return sortIjodItems(ijodItemsCache);
}

function getIjodPageCount(total) {
  if (!total) return 1;
  return Math.ceil(total / IJOD_PAGE_SIZE);
}

function getIjodPageSlice(sortedItems, page) {
  const total = sortedItems.length;
  if (!total) {
    return { items: [], page: 1, totalPages: 1, total: 0, from: 0, to: 0 };
  }
  const totalPages = getIjodPageCount(total);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * IJOD_PAGE_SIZE;
  const end = Math.min(start + IJOD_PAGE_SIZE, total);
  return {
    items: sortedItems.slice(start, end),
    page: safePage,
    totalPages,
    total,
    from: start + 1,
    to: end,
  };
}

function buildIjodPageNumbers(current, totalPages) {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set([1, totalPages, current, current - 1, current + 1]);
  const nums = [...set].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  nums.forEach((p) => {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  });
  return out;
}

function renderIjodPagination(slice) {
  const host = $("#ijodPagination");
  if (!host) return;

  if (!slice.total || slice.total <= IJOD_PAGE_SIZE) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }

  host.hidden = false;
  const pageNums = buildIjodPageNumbers(slice.page, slice.totalPages);
  host.innerHTML = `
    <button type="button" class="ghost-btn ijod-page-btn" data-page="prev"${slice.page <= 1 ? " disabled" : ""}>
      <i class="fa-solid fa-chevron-left" aria-hidden="true"></i> Oldingi
    </button>
    <div class="ijod-page-list" role="group" aria-label="Sahifa raqamlari">
      ${pageNums.map((p) => {
        if (p === "…") return `<span class="ijod-page-gap" aria-hidden="true">…</span>`;
        const active = p === slice.page ? " active" : "";
        return `<button type="button" class="ijod-page-num${active}" data-page="${p}" aria-current="${p === slice.page ? "page" : "false"}">${p}</button>`;
      }).join("")}
    </div>
    <button type="button" class="ghost-btn ijod-page-btn" data-page="next"${slice.page >= slice.totalPages ? " disabled" : ""}>
      Keyingi <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
    </button>`;
}

function bindIjodPagination() {
  const host = $("#ijodPagination");
  if (!host || host.dataset.bound) return;
  host.dataset.bound = "1";
  host.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    const val = btn.dataset.page;
    if (val === "prev") goIjodPage(ijodPage - 1, { stagger: true });
    else if (val === "next") goIjodPage(ijodPage + 1, { stagger: true });
    else goIjodPage(+val, { stagger: true });
  });
}

function goIjodPage(page, options = {}) {
  const slice = getIjodPageSlice(getIjodSortedItems(), page);
  ijodPage = slice.page;
  paintIjodGrid(slice.items, { ...options, slice });
  if (options.scroll !== false) {
    $("#ijodGrid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function updateIjodCountText(countEl, items, slice) {
  if (!countEl) return;
  if (!slice || !slice.total) {
    countEl.textContent = "0 ta rasm";
    return;
  }
  if (slice.total > IJOD_PAGE_SIZE) {
    countEl.textContent = `${slice.total} ta rasm · ${slice.from}–${slice.to} · sahifa ${slice.page}/${slice.totalPages}`;
  } else {
    countEl.textContent = `${items.length} ta rasm`;
  }
}

function updateIjodSortUI() {
  const meta = IJOD_SORT_META[ijodSortMode] || IJOD_SORT_META.newest;
  const sortNewest = $("#ijodSortNewest");
  const sortRating = $("#ijodSortRating");
  const sortRandom = $("#ijodSortRandom");
  sortNewest?.classList.toggle("active", ijodSortMode === "newest");
  sortRating?.classList.toggle("active", ijodSortMode === "rating");
  sortRandom?.classList.toggle("active", ijodSortMode === "random");
  sortNewest?.setAttribute("aria-pressed", ijodSortMode === "newest" ? "true" : "false");
  sortRating?.setAttribute("aria-pressed", ijodSortMode === "rating" ? "true" : "false");
  sortRandom?.setAttribute("aria-pressed", ijodSortMode === "random" ? "true" : "false");

  const status = $("#ijodSortStatus");
  const statusText = $("#ijodSortStatusText");
  if (status) {
    status.dataset.sort = ijodSortMode;
    const icon = status.querySelector("i");
    if (icon) icon.className = `fa-solid ${meta.icon}`;
  }
  if (statusText) statusText.textContent = meta.status;
}

function fillIjodValueFilter() {
  refreshValueSelects();
}

function normalizeIjodItem(item) {
  return {
    id: item.id,
    userId: item.user_id ?? item.userId,
    username: item.username,
    authorName: item.author_name ?? item.authorName ?? "O'quvchi",
    grade: item.grade,
    title: item.title || "Mening ijodim",
    description: item.description || "",
    valueId: item.value_id ?? item.valueId,
    imageUrl: item.image_url ?? item.imageUrl,
    createdAt: item.created_at ?? item.createdAt,
    averageRating: item.averageRating ?? 0,
    ratingCount: item.ratingCount ?? 0,
    userRating: item.userRating ?? null,
    local: !!item.local,
  };
}

async function syncLocalIjodQueue() {
  const session = await Api.ensureStudentSession();
  if (!session.ok) return 0;
  const pending = IjodApi.getLocal();
  if (!pending.length) return 0;
  const left = [];
  let synced = 0;
  for (const item of pending) {
    const res = await IjodApi.upload({
      title: item.title,
      description: item.description || "",
      valueId: item.valueId,
      imageBase64: item.imageUrl,
    });
    if (res.ok) synced += 1;
    else left.push(item);
  }
  IjodApi.saveLocal(left);
  return synced;
}

async function loadIjodItems() {
  const grade = $("#ijodGradeFilter")?.value || "";
  const valueId = $("#ijodValueFilter")?.value || "";
  const filters = {};
  if (grade) filters.grade = grade;
  if (valueId) filters.valueId = valueId;

  let serverItems = [];
  if (Api.online) {
    try {
      const rows = await IjodApi.fetchAll(filters);
      serverItems = rows.map(normalizeIjodItem);
    } catch (e) {
      console.warn("Ijod server:", e);
    }
  }

  let local = IjodApi.getLocal().map((i) => normalizeIjodItem({ ...i, local: true }));
  if (grade) local = local.filter((i) => +i.grade === +grade);
  if (valueId) local = local.filter((i) => i.valueId === valueId);

  const serverIds = new Set(serverItems.map((i) => i.id));
  const pendingLocal = local.filter((i) => !serverIds.has(i.id));
  ijodItemsCache = [...serverItems, ...pendingLocal];
  return ijodItemsCache;
}

function sortIjodItems(items) {
  if (ijodSortMode === "random") return applyIjodRandomOrder(items);

  const arr = [...items];
  if (ijodSortMode === "rating") {
    arr.sort((a, b) => {
      const ar = a.averageRating || 0;
      const br = b.averageRating || 0;
      if (br !== ar) return br - ar;
      const cr = (b.ratingCount || 0) - (a.ratingCount || 0);
      if (cr !== 0) return cr;
      return ijodItemTime(b) - ijodItemTime(a);
    });
  } else {
    arr.sort((a, b) => ijodItemTime(b) - ijodItemTime(a));
  }
  return arr;
}

function ijodItemIsOwn(item) {
  return (Api.username && item.username === Api.username)
    || (Auth.current() && item.username === Auth.current())
    || (item.local && item.userId === Auth.current());
}

function renderIjodStarsHtml(item) {
  const isOwn = ijodItemIsOwn(item);
  const canInteract = !isOwn && !item.local && Api.online;
  const avg = item.averageRating || 0;
  const count = item.ratingCount || 0;
  const highlight = item.userRating || Math.round(avg);
  const stars = [1, 2, 3, 4, 5].map((n) => {
    const filled = n <= highlight;
    const cls = [
      "ijod-star",
      filled ? "filled" : "",
      canInteract ? "interactive" : "readonly",
    ].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-val="${n}" aria-label="${n} yulduz" ${canInteract ? "" : "tabindex=\"-1\""}>
      <i class="fa-${filled ? "solid" : "regular"} fa-star"></i>
    </button>`;
  }).join("");
  const meta = count
    ? `<span class="ijod-rating-meta"><b>${avg.toFixed(1)}</b> · ${count} ta baho</span>`
    : `<span class="ijod-rating-meta muted">Baholar yo'q</span>`;
  return `<div class="ijod-rating" data-id="${esc(item.id)}">
    <div class="ijod-stars" role="group" aria-label="Reyting">${stars}</div>
    ${meta}
  </div>`;
}

function renderIjodCard(item) {
  const v = getValueById(item.valueId);
  const isOwn = ijodItemIsOwn(item);
  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })
    : "";
  return `<article class="ijod-card" data-id="${esc(item.id)}" tabindex="0" role="button"
    aria-label="${esc(item.title)} — ${esc(item.authorName)}">
    <div class="ijod-card-img-wrap">
      <img class="ijod-card-img" src="${esc(item.imageUrl)}" alt="${esc(item.title)}" loading="lazy">
      <span class="ijod-card-expand" aria-hidden="true"><i class="fa-solid fa-expand"></i> To'liq ekran</span>
      <span class="ijod-card-value" style="--ijod-ring:${v.color}"><i class="fa-solid ${v.icon}"></i> ${esc(v.name)}</span>
    </div>
    <div class="ijod-card-body">
      <h4 class="ijod-card-title">${esc(item.title)}</h4>
      <div class="ijod-card-meta">
        <span class="ijod-author"><i class="fa-solid fa-user"></i> ${esc(item.authorName)}</span>
        <span class="chip ijod-grade">${item.grade}-sinf</span>
      </div>
      ${renderIjodStarsHtml(item)}
      ${dateStr ? `<small class="muted ijod-date">${dateStr}${isOwn ? " · Sizniki" : ""}</small>` : ""}
    </div>
  </article>`;
}

function openIjodDetail(item) {
  const v = getValueById(item.valueId);
  const isOwn = ijodItemIsOwn(item);
  openModal(`
    <div class="ijod-detail">
      <button type="button" class="ijod-detail-img-btn" id="ijodDetailFullscreen" aria-label="To'liq ekranda ko'rish">
        <img class="ijod-detail-img" src="${esc(item.imageUrl)}" alt="${esc(item.title)}">
        <span class="ijod-detail-zoom"><i class="fa-solid fa-expand"></i> To'liq ekran</span>
      </button>
      <div class="modal-inner ijod-detail-inner">
        <span class="ijod-detail-value" style="background:${v.color}"><i class="fa-solid ${v.icon}"></i> ${esc(v.name)}</span>
        <h2>${esc(item.title)}</h2>
        <p class="ijod-detail-meta"><i class="fa-solid fa-user"></i> ${esc(item.authorName)} · ${item.grade}-sinf o'quvchisi</p>
        ${renderIjodStarsHtml(item)}
        ${item.description ? `<p class="ijod-detail-desc">${esc(item.description)}</p>` : ""}
        <p class="muted ijod-detail-section"><i class="fa-solid fa-layer-group"></i> Bo'lim: <b>Ijod</b> · Qadriyat: ${esc(v.name)}</p>
        <button type="button" class="solid-btn ijod-fullscreen-btn" id="ijodDetailFullscreenBtn">
          <i class="fa-solid fa-images"></i> Galereyada ko'rish (baho + ma'lumot)
        </button>
        ${isOwn ? `<button type="button" class="ghost-btn ijod-delete-btn" id="ijodDeleteBtn"><i class="fa-solid fa-trash"></i> O'chirish</button>` : ""}
      </div>
    </div>`);
  bindIjodStarWidgets($(".ijod-detail .ijod-rating"));
  const openFs = () => openIjodImageFullscreen(item);
  const openGallery = () => openIjodLightbox(item);
  $("#ijodDetailFullscreen")?.addEventListener("click", openFs);
  $("#ijodDetailFullscreenBtn")?.addEventListener("click", openGallery);
  const del = $("#ijodDeleteBtn");
  if (del) {
    del.addEventListener("click", async () => {
      if (!confirm("Rasmni o'chirmoqchimisiz?")) return;
      if (item.local) {
        IjodApi.saveLocal(IjodApi.getLocal().filter((x) => x.id !== item.id));
      } else if (Api.online && Api.token) {
        const res = await IjodApi.remove(item.id);
        if (!res.ok) { toast(res.msg, "err"); return; }
      }
      closeModal();
      toast("Rasm o'chirildi");
      renderIjod({ fetch: true });
    });
  }
}

let ijodLightboxList = [];
let ijodLightboxIdx = 0;
let ijodLightboxKeyHandler = null;

function bindIjodLightboxFullscreenActions(overlay) {
  if (overlay.dataset.fsBound) return;
  overlay.dataset.fsBound = "1";

  const frame = overlay.querySelector(".ijod-lightbox-frame");
  let expandBtn = overlay.querySelector(".ijod-lightbox-expand-btn");
  if (!expandBtn && frame) {
    expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "ijod-lightbox-expand-btn";
    expandBtn.setAttribute("aria-label", "Rasmni to'liq ekranda ko'rish");
    expandBtn.innerHTML = `<i class="fa-solid fa-expand"></i> To'liq ekran`;
    frame.appendChild(expandBtn);
  }

  const lbImg = overlay.querySelector(".ijod-lightbox-img");
  if (lbImg) {
    lbImg.setAttribute("role", "button");
    lbImg.setAttribute("tabindex", "0");
    lbImg.title = "To'liq ekranda ochish";
  }

  expandBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const item = ijodLightboxList[ijodLightboxIdx];
    if (item) openIjodImageFullscreen(item);
  });
  lbImg?.addEventListener("click", (e) => {
    e.stopPropagation();
    const item = ijodLightboxList[ijodLightboxIdx];
    if (item) openIjodImageFullscreen(item);
  });
  lbImg?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const item = ijodLightboxList[ijodLightboxIdx];
      if (item) openIjodImageFullscreen(item);
    }
  });
}

function ensureIjodLightbox() {
  let overlay = $("#ijodLightbox");
  if (overlay) {
    bindIjodLightboxFullscreenActions(overlay);
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "ijodLightbox";
  overlay.className = "ijod-lightbox";
  overlay.hidden = true;
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Ijod rasmini to'liq ekranda ko'rish");
  overlay.innerHTML = `
    <div class="ijod-lightbox-wall" aria-hidden="true"></div>
    <button type="button" class="ijod-lightbox-close" aria-label="Yopish"><i class="fa-solid fa-xmark"></i></button>
    <button type="button" class="ijod-lightbox-nav ijod-lightbox-prev" aria-label="Oldingi rasm"><i class="fa-solid fa-chevron-left"></i></button>
    <button type="button" class="ijod-lightbox-nav ijod-lightbox-next" aria-label="Keyingi rasm"><i class="fa-solid fa-chevron-right"></i></button>
    <div class="ijod-lightbox-stage">
      <div class="ijod-lightbox-frame">
        <div class="ijod-lightbox-tape" aria-hidden="true"></div>
        <img class="ijod-lightbox-img" alt="" role="button" tabindex="0" title="To'liq ekranda ochish">
        <button type="button" class="ijod-lightbox-expand-btn" aria-label="Rasmni to'liq ekranda ko'rish">
          <i class="fa-solid fa-expand"></i> To'liq ekran
        </button>
      </div>
      <div class="ijod-lightbox-note">
        <span class="ijod-lightbox-value"></span>
        <h3 class="ijod-lightbox-title"></h3>
        <p class="ijod-lightbox-meta"></p>
        <div class="ijod-lightbox-rating"></div>
      </div>
    </div>
    <p class="ijod-lightbox-counter"></p>`;
  document.body.appendChild(overlay);

  overlay.querySelector(".ijod-lightbox-close").addEventListener("click", closeIjodLightbox);
  overlay.querySelector(".ijod-lightbox-prev").addEventListener("click", () => stepIjodLightbox(-1));
  overlay.querySelector(".ijod-lightbox-next").addEventListener("click", () => stepIjodLightbox(1));
  bindIjodLightboxFullscreenActions(overlay);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.classList.contains("ijod-lightbox-wall")) closeIjodLightbox();
  });

  return overlay;
}

function renderIjodLightboxSlide() {
  const overlay = ensureIjodLightbox();
  const item = ijodLightboxList[ijodLightboxIdx];
  if (!item) return;

  const v = getValueById(item.valueId);
  const img = overlay.querySelector(".ijod-lightbox-img");
  img.src = item.imageUrl;
  img.alt = item.title;

  overlay.querySelector(".ijod-lightbox-value").innerHTML =
    `<i class="fa-solid ${v.icon}"></i> ${esc(v.name)}`;
  overlay.querySelector(".ijod-lightbox-value").style.background = v.color;
  overlay.querySelector(".ijod-lightbox-title").textContent = item.title;
  overlay.querySelector(".ijod-lightbox-meta").innerHTML =
    `<i class="fa-solid fa-user"></i> ${esc(item.authorName)} · ${item.grade}-sinf`;
  overlay.querySelector(".ijod-lightbox-rating").innerHTML = renderIjodStarsHtml(item);
  overlay.querySelector(".ijod-lightbox-counter").textContent =
    `${ijodLightboxIdx + 1} / ${ijodLightboxList.length}`;

  overlay.querySelector(".ijod-lightbox-prev").hidden = ijodLightboxList.length <= 1;
  overlay.querySelector(".ijod-lightbox-next").hidden = ijodLightboxList.length <= 1;

  bindIjodStarWidgets(overlay.querySelector(".ijod-lightbox-rating"));
}

function stepIjodLightbox(delta) {
  if (!ijodLightboxList.length) return;
  ijodLightboxIdx = (ijodLightboxIdx + delta + ijodLightboxList.length) % ijodLightboxList.length;
  renderIjodLightboxSlide();
  const overlay = $("#ijodLightbox");
  if (overlay) overlay.scrollTop = 0;
}

function openIjodLightbox(item) {
  ijodLightboxList = sortIjodItems([...ijodItemsCache]);
  ijodLightboxIdx = ijodLightboxList.findIndex((x) => x.id === item.id);
  if (ijodLightboxIdx < 0) {
    ijodLightboxList = [item];
    ijodLightboxIdx = 0;
  }

  const overlay = ensureIjodLightbox();
  renderIjodLightboxSlide();
  overlay.hidden = false;
  overlay.scrollTop = 0;
  document.body.style.overflow = "hidden";

  if (ijodLightboxKeyHandler) document.removeEventListener("keydown", ijodLightboxKeyHandler);
  ijodLightboxKeyHandler = (e) => {
    if (overlay.hidden) return;
    if (e.key === "Escape") closeIjodLightbox();
    if (e.key === "ArrowLeft") stepIjodLightbox(-1);
    if (e.key === "ArrowRight") stepIjodLightbox(1);
  };
  document.addEventListener("keydown", ijodLightboxKeyHandler);
}

function closeIjodLightbox() {
  const overlay = $("#ijodLightbox");
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  const modalOpen = $("#modalOverlay") && !$("#modalOverlay").hidden;
  if (!modalOpen) document.body.style.overflow = "";
}

async function submitIjodRating(itemId, rating) {
  const session = await Api.ensureStudentSession();
  if (!session.ok) {
    toast(session.msg, "err");
    return null;
  }
  const item = ijodItemsCache.find((x) => x.id === itemId);
  if (item && ijodItemIsOwn(item)) {
    toast("O'z rasmingizga baho bera olmaysiz", "err");
    return null;
  }
  const res = await IjodApi.rate(itemId, rating);
  if (!res.ok) {
    toast(res.msg, "err");
    if (res.msg.includes("Sessiya") || res.msg.includes("Kirish")) Api.clearSession();
    return null;
  }
  const updated = normalizeIjodItem(res.item);
  const idx = ijodItemsCache.findIndex((x) => x.id === itemId);
  if (idx >= 0) ijodItemsCache[idx] = updated;
  return updated;
}

function refreshIjodRatingEl(el, item) {
  if (!el || !item) return;
  const parent = el.parentElement;
  el.outerHTML = renderIjodStarsHtml(item);
  const next = parent?.querySelector(`.ijod-rating[data-id="${item.id}"]`);
  if (next) {
    delete next.dataset.bound;
    bindIjodStarWidgets(next);
  }
}

function bindIjodStarWidgets(root) {
  const containers = root
    ? (root.matches?.(".ijod-rating") ? [root] : [...(root.querySelectorAll?.(".ijod-rating") || [])])
    : $$("#ijodGrid .ijod-rating, .ijod-detail .ijod-rating, #ijodLightbox .ijod-rating");
  containers.forEach((wrap) => {
    if (wrap.dataset.bound) return;
    wrap.dataset.bound = "1";
    const itemId = wrap.dataset.id;
    const item = () => ijodItemsCache.find((x) => x.id === itemId);
    wrap.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = e.target.closest(".ijod-star.interactive");
      if (!btn) return;
      const val = +btn.dataset.val;
      if (!val) return;
      submitIjodRating(itemId, val).then((updated) => {
        if (!updated) return;
        refreshIjodRatingEl(wrap, updated);
        const cardRating = $(`#ijodGrid .ijod-rating[data-id="${CSS.escape(itemId)}"]`);
        if (cardRating && cardRating !== wrap) refreshIjodRatingEl(cardRating, updated);
        const detailRating = $(".ijod-detail .ijod-rating");
        if (detailRating && detailRating !== wrap) refreshIjodRatingEl(detailRating, updated);
        const lightboxRating = $("#ijodLightbox .ijod-rating");
        if (lightboxRating && lightboxRating !== wrap) refreshIjodRatingEl(lightboxRating, updated);
        toast(`${val} yulduz qo'yildi`, "win");
        if (ijodSortMode === "rating") repaintIjodFromCache({ stagger: true });
      });
    });
    wrap.querySelectorAll(".ijod-star.interactive").forEach((star) => {
      star.addEventListener("mouseenter", () => {
        const val = +star.dataset.val;
        wrap.querySelectorAll(".ijod-star").forEach((s) => {
          const n = +s.dataset.val;
          s.classList.toggle("filled", n <= val);
          const icon = s.querySelector("i");
          if (icon) icon.className = n <= val ? "fa-solid fa-star" : "fa-regular fa-star";
        });
      });
      star.addEventListener("mouseleave", () => {
        const cur = item();
        if (!cur) return;
        const highlight = cur.userRating || Math.round(cur.averageRating || 0);
        wrap.querySelectorAll(".ijod-star").forEach((s) => {
          const n = +s.dataset.val;
          s.classList.toggle("filled", n <= highlight);
          const icon = s.querySelector("i");
          if (icon) icon.className = n <= highlight ? "fa-solid fa-star" : "fa-regular fa-star";
        });
      });
    });
  });
}

function openIjodUploadModal() {
  if (!Auth.current()) {
    toast("Rasm yuklash uchun avval tizimga kiring.", "err");
    return;
  }
  const valueOptions = VALUES.map(
    (v) => `<option value="${v.id}">${esc(v.name)}</option>`
  ).join("");
  openModal(`
    <div class="modal-inner ijod-upload-modal">
      <h2><i class="fa-solid fa-palette" style="color:var(--orange)"></i> Ijodingizni ulashing</h2>
      <p class="muted">Chizgan rasmingizni yuklang va qaysi qadriyatga tegishli ekanini tanlang.</p>
      <label class="ijod-dropzone" id="ijodDropzone">
        <input type="file" id="ijodFileInput" accept="image/*" hidden>
        <div class="ijod-dropzone-inner" id="ijodDropPreview">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <b>Rasmni tanlang yoki bu yerga tashlang</b>
          <small>JPEG, PNG · max ~3MB</small>
        </div>
      </label>
      <label class="ijod-field-label">Sarlavha</label>
      <input type="text" class="auth-select ijod-input" id="ijodTitle" maxlength="80" placeholder="Masalan: Vatanim go'zali">
      <label class="ijod-field-label">Qaysi qadriyatga tegishli?</label>
      <select class="auth-select ijod-input" id="ijodValuePick" required>
        <option value="">Tanlang...</option>
        ${valueOptions}
      </select>
      <label class="ijod-field-label">Qisqa tavsif (ixtiyoriy)</label>
      <textarea class="auth-select ijod-textarea" id="ijodDesc" maxlength="280" rows="3" placeholder="Rasmingiz haqida bir-ikki gap..."></textarea>
      <p class="muted ijod-upload-hint"><i class="fa-solid fa-circle-info"></i> Rasm va qadriyat tanlanganidan keyin tugma faollashadi.</p>
      <button type="button" class="solid-btn ijod-submit-btn" id="ijodSubmitBtn" disabled>
        <i class="fa-solid fa-paper-plane"></i> Galereyaga joylash
      </button>
      ${!Api.online ? `<p class="muted ijod-offline-note"><i class="fa-solid fa-circle-info"></i> Server o'chiq — rasm saqlanmaydi.</p>` : !Api.token ? `<p class="muted ijod-offline-note"><i class="fa-solid fa-circle-info"></i> Barcha uchun saqlash: profildan chiqib, login/parol bilan qayta kiring.</p>` : ""}
    </div>`);

  let previewData = null;
  const preview = $("#ijodDropPreview");
  const submitBtn = $("#ijodSubmitBtn");
  const fileInput = $("#ijodFileInput");
  const dropzone = $("#ijodDropzone");
  const valuePick = $("#ijodValuePick");
  if (!preview || !submitBtn || !fileInput || !dropzone || !valuePick) return;

  function updateIjodSubmitState() {
    const ready = !!previewData && !!valuePick.value;
    submitBtn.disabled = !ready;
  }

  function setPreview(dataUrl) {
    previewData = dataUrl;
    preview.innerHTML = `<img src="${dataUrl}" alt="Ko'rinish">`;
    updateIjodSubmitState();
  }

  fileInput.addEventListener("change", () => {
    const f = fileInput.files?.[0];
    if (f) fileToIjodImage(f, setPreview);
  });

  valuePick.addEventListener("change", updateIjodSubmitState);

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    const f = e.dataTransfer?.files?.[0];
    if (f) fileToIjodImage(f, setPreview);
  });

  submitBtn.addEventListener("click", async () => {
    const valueId = valuePick.value;
    if (!previewData) { toast("Rasm tanlang", "err"); return; }
    if (!valueId) { toast("Qadriyatni tanlang", "err"); return; }

    const prevHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Yuklanmoqda...`;

    const payload = {
      title: $("#ijodTitle").value.trim() || "Mening ijodim",
      description: $("#ijodDesc").value.trim(),
      valueId,
      imageBase64: previewData,
    };

    try {
      let serverSaved = false;

      const session = await Api.ensureStudentSession();
      if (session.ok) {
        const res = await IjodApi.upload(payload);
        if (res.ok) {
          serverSaved = true;
          IjodApi.saveLocal(
            IjodApi.getLocal().filter(
              (x) => !(x.title === payload.title && x.imageUrl === previewData)
            )
          );
        } else {
          toast(res.msg, "err");
          if (res.msg.includes("401") || res.msg.includes("Sessiya") || res.msg.includes("Kirish")) {
            Api.clearSession();
          }
        }
      } else {
        toast(session.msg, "err");
        if (session.needLogin) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = prevHtml;
          updateIjodSubmitState();
          return;
        }
      }

      if (!serverSaved) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = prevHtml;
        updateIjodSubmitState();
        return;
      }

      closeModal();
      addXP(25);
      addStars(1);
      toast("🎨 Ijodingiz hammaga ko'rinadigan galereyaga qo'shildi!", "win");
      if (typeof fireConfetti === "function") fireConfetti({ duration: 2500, perSide: 40 });
      renderIjod({ fetch: true });
    } catch (e) {
      console.error(e);
      toast("Yuklashda xatolik. Qayta urinib ko'ring.", "err");
      submitBtn.disabled = false;
      submitBtn.innerHTML = prevHtml;
      updateIjodSubmitState();
    }
  });
}

function bindIjodCards(root) {
  const scope = root || $("#ijodGrid");
  if (!scope) return;
  $$(".ijod-card", scope).forEach((el) => {
    const id = el.dataset.id;
    const item = () => ijodItemsCache.find((x) => x.id === id);
    const openDetail = () => {
      const it = item();
      if (it) openIjodDetail(it);
    };
    const openFull = (e) => {
      e.stopPropagation();
      const it = item();
      if (it) openIjodImageFullscreen(it);
    };
    el.querySelector(".ijod-card-img-wrap")?.addEventListener("click", openFull);
    el.addEventListener("click", openDetail);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(); }
    });
  });
}

function paintIjodGrid(items, options = {}) {
  const grid = $("#ijodGrid");
  const empty = $("#ijodEmpty");
  const countEl = $("#ijodCount");
  const pagination = $("#ijodPagination");
  if (!grid) return;

  clearTimeout(grid._ijodStaggerTimer);
  if (grid._ijodStaggerRaf) cancelAnimationFrame(grid._ijodStaggerRaf);

  grid.classList.remove("ijod-grid-loading");

  if (!items.length) {
    grid.innerHTML = "";
    grid.classList.remove("ijod-grid-stagger");
    if (empty) empty.hidden = false;
    if (pagination) {
      pagination.hidden = true;
      pagination.innerHTML = "";
    }
    updateIjodCountText(countEl, [], options.slice || { total: 0 });
    return;
  }

  if (empty) empty.hidden = true;
  grid.innerHTML = items.map(renderIjodCard).join("");
  updateIjodCountText(countEl, items, options.slice || { total: items.length });
  bindIjodStarWidgets(grid);
  bindIjodCards(grid);

  if (options.slice) {
    renderIjodPagination(options.slice);
  }

  if (options.stagger) {
    animateIjodCardsStagger(grid);
  } else if (options.prepareStagger) {
    prepareIjodCardsStagger(grid);
  } else {
    $$(".ijod-card", grid).forEach((el) => el.classList.add("ijod-card-shown"));
  }
}

function setIjodGridLoading(loading) {
  const grid = $("#ijodGrid");
  if (!grid) return;
  grid.classList.toggle("ijod-grid-loading", loading);
}

function repaintIjodFromCache(options = {}) {
  if (options.resetPage) ijodPage = 1;
  const slice = getIjodPageSlice(getIjodSortedItems(), ijodPage);
  ijodPage = slice.page;
  paintIjodGrid(slice.items, { ...options, slice });
}

const IJOD_CARD_STAGGER_STEP = 70;
const IJOD_CARD_STAGGER_MAX = 1800;

function prepareIjodCardsStagger(grid) {
  if (!grid) return;
  const cards = $$(".ijod-card", grid);
  if (!cards.length) return;
  grid.classList.add("ijod-grid-stagger");
  cards.forEach((el, i) => {
    el.classList.remove("ijod-card-shown");
    const delay = Math.min(i * IJOD_CARD_STAGGER_STEP, IJOD_CARD_STAGGER_MAX);
    el.style.setProperty("--ijod-card-delay", `${delay}ms`);
  });
}

function scheduleIjodPageIntro(pageEl) {
  if (!pageEl) return;
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => {
    animateSiteIn(pageEl);

    const grid = $("#ijodGrid");
    if (!grid || !grid.classList.contains("ijod-grid-stagger")) return;

    if (typeof motionReduced === "function" && motionReduced()) {
      animateIjodCardsStagger(grid);
      return;
    }

    const toolbar = pageEl.querySelector(".ijod-toolbar");
    let waitMs = 860;
    if (toolbar) {
      const delayRaw = toolbar.style.getPropertyValue("--reveal-delay") || "0ms";
      const delayMs = parseFloat(delayRaw) || 0;
      waitMs = delayMs + 860;
    }

    clearTimeout(pageEl._ijodGridStaggerDelay);
    pageEl._ijodGridStaggerDelay = setTimeout(() => {
      animateIjodCardsStagger(grid);
    }, waitMs);
  }, 60);
}

function animateIjodCardsStagger(grid) {
  if (!grid) return;
  const cards = $$(".ijod-card", grid);
  if (!cards.length) return;

  clearTimeout(grid._ijodStaggerTimer);
  if (grid._ijodStaggerRaf) cancelAnimationFrame(grid._ijodStaggerRaf);

  if (typeof motionReduced === "function" && motionReduced()) {
    grid.classList.remove("ijod-grid-stagger");
    cards.forEach((el) => {
      el.classList.add("ijod-card-shown");
      el.style.removeProperty("--ijod-card-delay");
    });
    return;
  }

  grid.classList.add("ijod-grid-stagger");
  cards.forEach((el, i) => {
    el.classList.remove("ijod-card-shown");
    const delay = Math.min(i * IJOD_CARD_STAGGER_STEP, IJOD_CARD_STAGGER_MAX);
    el.style.setProperty("--ijod-card-delay", `${delay}ms`);
  });

  void grid.offsetHeight;
  grid._ijodStaggerRaf = requestAnimationFrame(() => {
    grid._ijodStaggerRaf = requestAnimationFrame(() => {
      cards.forEach((el) => el.classList.add("ijod-card-shown"));
    });
  });

  const lastDelay = Math.min((cards.length - 1) * IJOD_CARD_STAGGER_STEP, IJOD_CARD_STAGGER_MAX);
  grid._ijodStaggerTimer = setTimeout(() => {
    grid.classList.remove("ijod-grid-stagger");
    cards.forEach((el) => el.style.removeProperty("--ijod-card-delay"));
  }, lastDelay + 540);
}

function setIjodSort(mode) {
  const reshuffleRandom = mode === "random" && ijodSortMode === "random";
  if (ijodSortMode === mode && !reshuffleRandom) return;
  ijodSortMode = mode;
  if (mode === "random") resetIjodRandomOrder();
  updateIjodSortUI();
  repaintIjodFromCache({ stagger: true, resetPage: true });
}

async function fetchAndPaintIjod(options = {}) {
  const grid = $("#ijodGrid");
  if (!grid) return;

  setIjodGridLoading(true);
  try {
    if (Api.online && Api.token && IjodApi.getLocal().length) {
      const synced = await syncLocalIjodQueue();
      if (synced > 0) toast(`${synced} ta rasm serverga yuborildi`, "win");
    }
    await loadIjodItems();
  } finally {
    setIjodGridLoading(false);
  }
  repaintIjodFromCache({
    stagger: !!options.stagger,
    prepareStagger: !!options.prepareStagger,
    resetPage: true,
  });
}

let ijodPageEventsBound = false;

function bindIjodPageEvents() {
  if (ijodPageEventsBound) return;
  ijodPageEventsBound = true;

  bindIjodPagination();

  const uploadBtn = $("#ijodOpenUpload");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", openIjodUploadModal);
  }

  const gradeF = $("#ijodGradeFilter");
  const valueF = $("#ijodValueFilter");
  const sortNewest = $("#ijodSortNewest");
  const sortRating = $("#ijodSortRating");
  const sortRandom = $("#ijodSortRandom");

  gradeF?.addEventListener("change", () => fetchAndPaintIjod({ stagger: true, resetPage: true }));
  valueF?.addEventListener("change", () => fetchAndPaintIjod({ stagger: true, resetPage: true }));
  sortNewest?.addEventListener("click", () => setIjodSort("newest"));
  sortRating?.addEventListener("click", () => setIjodSort("rating"));
  sortRandom?.addEventListener("click", () => setIjodSort("random"));
}

async function renderIjod(options = {}) {
  fillIjodValueFilter();
  bindIjodPageEvents();
  updateIjodSortUI();

  const grid = $("#ijodGrid");
  if (!grid) return;

  const isInitial = options.initial !== false && !grid.dataset.ready;

  if (isInitial) {
    grid.innerHTML = `<div class="ijod-loading"><i class="fa-solid fa-spinner fa-spin"></i> Yuklanmoqda...</div>`;
    await fetchAndPaintIjod({ prepareStagger: true });
    grid.dataset.ready = "1";
    scheduleIjodPageIntro($("#page-ijod"));
    return;
  }

  if (options.fetch) {
    await fetchAndPaintIjod({ stagger: !!options.stagger, resetPage: !!options.resetPage });
    return;
  }

  repaintIjodFromCache();
}

/* ====================== 15. BILIMDON BOBO CHATBOT ====================== */
function initBot() {
  const win = $("#botWindow"), msgs = $("#botMsgs");
  $("#botFab").addEventListener("click", () => {
    win.hidden = !win.hidden;
    if (!win.hidden && !msgs.dataset.init) {
      botSay(`Assalomu alaykum, aziz shogird! Men <b>Bilimdon Bobo</b>man. ${TEXTBOOK_WORKS.length} ta asar, ${VALUES.length} ta qadriyat, ${REGIONS.length} ta hudud, testlar va o'yinlar haqida savol berishing mumkin!`);
      msgs.dataset.init = "1";
    }
  });
  $("#botClose").addEventListener("click", () => (win.hidden = true));

  const quick = ["Vatan haqida", "Halollik nima?", "3-sinf asarlari", "Test maslahati", "Samarqand"];
  $("#botQuick").innerHTML = quick.map((q) => `<button>${q}</button>`).join("");
  $$("#botQuick button").forEach((b) => b.addEventListener("click", () => { userAsk(b.textContent); }));

  $("#botForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = $("#botInput").value.trim();
    if (!val) return;
    userAsk(val);
    $("#botInput").value = "";
  });
}

function botSay(html) {
  const el = document.createElement("div");
  el.className = "bmsg bot";
  el.innerHTML = html;
  $("#botMsgs").appendChild(el);
  $("#botMsgs").scrollTop = $("#botMsgs").scrollHeight;
}
function userAsk(text) {
  const el = document.createElement("div");
  el.className = "bmsg user";
  el.textContent = text;
  $("#botMsgs").appendChild(el);
  $("#botMsgs").scrollTop = $("#botMsgs").scrollHeight;
  setTimeout(() => botSay(botReply(text)), 450);
}

/* ====================== SCROLL REVEAL / SAHIFA ANIMATSIYASI ====================== */
const REVEAL_STEP = 70;
const REVEAL_MAX_DELAY = 1600;

function motionReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function collectChromeTargets() {
  const targets = [];
  const seen = new Set();
  const push = (el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    targets.push(el);
  };
  push(document.querySelector(".topbar .brand"));
  document.querySelectorAll(".mainnav .navlink").forEach(push);
  push(document.querySelector("#profileChip"));
  push(document.querySelector("#hamburger"));
  return targets;
}

function collectFooterTargets() {
  return [...document.querySelectorAll(".site-footer .footer-col")];
}

function collectPageTargets(pageEl) {
  if (!pageEl) return [];
  const targets = [];
  const seen = new Set();
  const push = (el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    targets.push(el);
  };

  if (pageEl.id === "page-bosh") {
    push(pageEl.querySelector(".hero-bg"));
    pageEl.querySelectorAll(".hero-content > *").forEach(push);
    pageEl.querySelectorAll(".home-parallax-panel .profile-card, .home-parallax-panel .popular-card, .home-parallax-panel .goal-card").forEach(push);
    pageEl.querySelectorAll(".pop-work, .pop-game").forEach(push);
    push(pageEl.querySelector(".uz-map-section"));
    pageEl.querySelectorAll(".quick-links .quick").forEach(push);
    push(pageEl.querySelector(".value-tree-intro"));
    push(pageEl.querySelector(".value-tree-section"));
    return targets;
  }

  if (pageEl.id === "page-asar") {
    push(pageEl.querySelector(".work-read-bg"));
    push(pageEl.querySelector(".work-back-btn"));
    push(pageEl.querySelector(".work-read-panel"));
    return targets;
  }

  if (pageEl.id === "page-ijod") {
    push(pageEl.querySelector(".ijod-hero"));
    push(pageEl.querySelector(".ijod-toolbar"));
    push(pageEl.querySelector("#ijodPagination"));
    push(pageEl.querySelector("#ijodEmpty"));
    return targets;
  }

  if (pageEl.id === "page-biz-haqimizda") {
    push(pageEl.querySelector(".about-hero"));
    pageEl.querySelectorAll(".about-card, .about-stat, .about-text-link").forEach(push);
    return targets;
  }

  push(pageEl.querySelector(".page-head"));
  push(pageEl.querySelector(".teacher-dash-head"));
  pageEl.querySelectorAll(".filters, .parent-stats, .teacher-stats").forEach(push);
  pageEl.querySelectorAll(
    ".card, .game-card, .test-item, .work-card, .audio-card, .badge, .ach-grid > *, .two-col > *, .pstat, .method-item, .steam-item"
  ).forEach(push);
  pageEl.querySelectorAll(
    "#worksGrid .work-card, #gamesGrid .game-card, #testPicker .test-item, #audioGrid .audio-card, #badgeGrid .badge"
  ).forEach(push);
  pageEl.querySelectorAll(
    "#gameStage .stage-head, #gameStage .test-picker, #gameStage .test-item, #gameStage .puzzle-layout, #gameStage .test-result-popup, #gameStage .puzzle-grid, #gameStage .puzzle-preview"
  ).forEach(push);
  pageEl.querySelectorAll("#testStage .stage-head, #testStage .quiz-q, #testStage .quiz-opts, #testStage .test-result-popup").forEach(push);
  return targets;
}

function collectAllRevealTargets(pageEl) {
  return [...collectChromeTargets(), ...collectPageTargets(pageEl), ...collectFooterTargets()];
}

function resetRevealState(container) {
  if (!container) return;
  container.querySelectorAll(".reveal, .reveal-fade").forEach((el) => {
    el.classList.remove("in", "reveal", "reveal-fade");
    el.style.removeProperty("--reveal-delay");
  });
}

function applyRevealClass(el) {
  if (
    el.closest(".hero-content") ||
    el.matches(".hero-bg, .hero-bg-img, .value-tree-section, .value-tree-img, .work-read-bg, .brand-logo, .hero-logo")
  ) {
    return "reveal-fade";
  }
  return "reveal";
}

function runRevealSequence(targets) {
  if (!targets.length) return;
  const reduced = motionReduced();

  targets.forEach((el, i) => {
    el.classList.remove("in");
    el.classList.add(applyRevealClass(el));
    const delay = reduced ? 0 : Math.min(i * REVEAL_STEP, REVEAL_MAX_DELAY);
    el.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (reduced) {
    targets.forEach((el) => el.classList.add("in"));
    return;
  }

  void document.body.offsetHeight;
  requestAnimationFrame(() => {
    setTimeout(() => {
      targets.forEach((el) => el.classList.add("in"));
    }, 40);
  });
}

let revealTimer = null;
function animateSiteIn(pageEl) {
  if (!pageEl || pageEl.hidden) return;
  resetRevealState(document.querySelector(".topbar"));
  resetRevealState(document.querySelector(".site-footer"));
  resetRevealState(pageEl);
  const targets = collectAllRevealTargets(pageEl);
  runRevealSequence(targets);
}

function scheduleSiteReveal(pageEl) {
  if (!pageEl) return;
  clearTimeout(revealTimer);
  const ms = pageEl.id === "page-bosh" ? 120 : 60;
  revealTimer = setTimeout(() => animateSiteIn(pageEl), ms);
}

function observeReveals() {
  const page = document.querySelector(".page:not([hidden])") || $("#page-bosh");
  scheduleSiteReveal(page);
}

/* ====================== DOWNLOAD MARKAZI ====================== */
function downloadMaterials() {
  let txt = "QADRIYATLAR KALEDASKOPI — METODIK MATERIALLAR\n";
  txt += "=".repeat(55) + "\n\nQADRIYAT TAHLILI JADVALI:\n\n";
  TEXTBOOK_WORKS.forEach((w, i) => {
    txt += `${i + 1}. ${w.title} (${w.author}) — ${w.grade}-sinf, ${w.genre}\n`;
    txt += `   Asosiy qadriyat: ${getValueById(w.valueMain).name}\n`;
    txt += `   Qadriyatlar: ${w.values.map((id) => getValueById(id).name).join(", ")}\n`;
    txt += `   Saboq: ${w.moral}\n\n`;
  });
  txt += "\nSTEAM LOYIHALAR:\n\n";
  STEAM_PROJECTS.forEach((p, i) => { txt += `${i + 1}. ${p.title} (${getValueById(p.value).name})\n   ${p.desc}\n   Fanlar: ${p.subjects.join(", ")}\n\n`; });
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "qadriyatlar-metodik-materiallar.txt";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("📥 Materiallar yuklab olindi!", "win");
}

/* ====================== BOG'LANISH ====================== */
function openContactForm() {
  if (!Api.online) {
    toast("Xabar yuborish uchun sayt server orqali ochilgan bo'lishi kerak.", "err");
    return;
  }
  openModal(`
    <div class="modal-inner contact-modal">
      <h2><i class="fa-solid fa-envelope" style="color:#e6821e"></i> Bog'lanish</h2>
      <p class="muted">Savol, taklif yoki fikringizni yozing — xabar loyiha muallifining pochtasiga yuboriladi.</p>
      <label for="contactName">Ismingiz</label>
      <input id="contactName" type="text" placeholder="Masalan: Dilnoza" maxlength="80" />
      <label for="contactEmail">Email (ixtiyoriy — javob olish uchun)</label>
      <input id="contactEmail" type="email" placeholder="siz@email.uz" maxlength="120" />
      <label for="contactMessage">Xabar *</label>
      <textarea id="contactMessage" placeholder="Xabaringizni shu yerga yozing..." required maxlength="2000"></textarea>
      <button type="button" class="solid-btn" id="contactSend"><i class="fa-solid fa-paper-plane"></i> Yuborish</button>
    </div>`);
  $("#contactSend").addEventListener("click", async () => {
    const message = $("#contactMessage").value.trim();
    const name = $("#contactName").value.trim();
    const email = $("#contactEmail").value.trim();
    if (message.length < 5) { toast("Xabar kamida 5 ta belgi bo'lsin", "err"); return; }
    $("#contactSend").disabled = true;
    const res = await Api.sendContact({ name, email, message });
    $("#contactSend").disabled = false;
    if (!res.ok) { toast(res.msg, "err"); return; }
    closeModal();
    toast(res.emailed ? "Xabaringiz yuborildi! Tez orada javob beramiz. ✉️" : "Xabar qabul qilindi! Tez orada javob beramiz.", "win");
  });
}

/* ====================== PROFIL TAHRIRI ====================== */
function openProfileEditor() {
  const renderEditor = () => {
  const d = Store.data;
  const avatars = ["🧒", "👦", "👧", "🦊", "🐯", "🦉", "🐻", "🦁"];
  const uploadBlocked = !!d.avatarUploadBlocked;
  openModal(`
    <div class="modal-inner">
      <h2><i class="fa-solid fa-user-pen" style="color:#e6821e"></i> Profilni tahrirlash</h2>

      <label style="display:block;margin:16px 0 6px;font-weight:700">Profil rasmi</label>
      ${uploadBlocked ? `<p class="profile-blocked-note"><i class="fa-solid fa-lock"></i> Profil rasmini o'zgartirish vaqtincha yopilgan. Admin ogohlantirishini o'qing va tasdiqlang.</p>` : ""}
      <div class="photo-edit">
        <span class="avatar lg photo-preview" id="photoPreview"></span>
        <div class="photo-actions">
          ${uploadBlocked ? "" : `<label class="ghost-btn photo-upload"><i class="fa-solid fa-camera"></i> Rasm yuklash
            <input type="file" id="photoInput" accept="image/*" hidden />
          </label>`}
          <button type="button" class="ghost-btn" id="photoRemove" style="color:var(--pink)" ${uploadBlocked ? "disabled" : ""}><i class="fa-solid fa-trash"></i> Rasmni olib tashlash</button>
        </div>
      </div>

      <label style="display:block;margin:16px 0 6px;font-weight:700">Ismingiz</label>
      <input id="editName" class="search-box" style="width:100%;border:2px solid #f0e2cf;border-radius:14px;padding:12px 16px" value="${esc(d.name)}" />
      <label style="display:block;margin:16px 0 6px;font-weight:700">Sinf</label>
      <select id="editGrade" class="filter-select" style="width:100%"><option value="3" ${d.grade == 3 ? "selected" : ""}>3-sinf</option><option value="4" ${d.grade == 4 ? "selected" : ""}>4-sinf</option></select>
      <label style="display:block;margin:16px 0 6px;font-weight:700">Yoki emoji avatar tanlang</label>
      <div style="display:flex;gap:10px;flex-wrap:wrap" id="avatarPick">
        ${avatars.map((a) => `<button class="avatar lg" data-av="${a}" style="${a === d.avatar ? "outline:3px solid #e6821e" : ""}">${a}</button>`).join("")}
      </div>
      ${Auth.current() ? `<p class="muted" style="margin-top:14px"><i class="fa-solid fa-user"></i> Login: <b>${esc(Auth.current())}</b></p>` : ""}
      <button class="solid-btn" id="saveProfile" style="margin-top:14px"><i class="fa-solid fa-check"></i> Saqlash</button>
      ${Auth.current() ? `<button class="ghost-btn" id="logoutBtn" style="margin-top:10px;color:var(--pink)"><i class="fa-solid fa-right-from-bracket"></i> Chiqish (Logout)</button>` : ""}
    </div>`);

  let chosen = d.avatar;
  let chosenImg = d.avatarImg || null;
  setAvatarEl($("#photoPreview"), { avatar: chosen, avatarImg: chosenImg });

  $$("#avatarPick button").forEach((b) => b.addEventListener("click", () => {
    chosen = b.dataset.av;
    chosenImg = null; // emoji tanlansa rasm bekor qilinadi
    $$("#avatarPick button").forEach((x) => (x.style.outline = "none"));
    b.style.outline = "3px solid #e6821e";
    setAvatarEl($("#photoPreview"), { avatar: chosen, avatarImg: chosenImg });
  }));

  $("#photoInput")?.addEventListener("change", (e) => {
    if (uploadBlocked) { toast("Profil rasmini hozir o'zgartira olmaysiz.", "err"); return; }
    const file = e.target.files[0];
    if (file) fileToAvatar(file, (dataUrl) => {
      chosenImg = dataUrl;
      setAvatarEl($("#photoPreview"), { avatar: chosen, avatarImg: chosenImg });
      toast("Rasm tayyor! Saqlashni unutmang.", "");
    });
  });

  $("#photoRemove").addEventListener("click", () => {
    chosenImg = null;
    setAvatarEl($("#photoPreview"), { avatar: chosen, avatarImg: null });
  });

  $("#saveProfile").addEventListener("click", () => {
    Store.data.name = $("#editName").value.trim() || "O'quvchi";
    Store.data.grade = +$("#editGrade").value;
    Store.data.avatar = chosen;
    Store.data.avatarImg = chosenImg;
    Auth.updateAccount({ name: Store.data.name, grade: Store.data.grade, avatar: chosen, avatarImg: chosenImg });
    Store.save();
    renderProfile();
    closeModal();
    toast("Profil yangilandi! 👋", "win");
  });
  const lo = $("#logoutBtn");
  if (lo) lo.addEventListener("click", () => { Auth.logout(); closeModal(); location.reload(); });
  };
  if (Store.data.pendingWarning?.message) showStudentWarningIfNeeded(renderEditor);
  else renderEditor();
}

/* ====================== 16. ISHGA TUSHIRISH ====================== */
function bindGlobalEvents() {
  // Navigatsiya (data-nav)
  document.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) { e.preventDefault(); location.hash = nav.dataset.nav; }
  });
  // Hash router
  window.addEventListener("hashchange", handleHash);
  const workBack = $("#workBackBtn");
  if (workBack) workBack.addEventListener("click", () => { location.hash = "kutubxona"; });
  // Hamburger
  const ham = $("#hamburger");
  const nav = $("#mainnav");
  if (ham && nav) {
    ham.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      ham.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  // Profil chip
  $("#profileChip").addEventListener("click", openProfileEditor);
  // Modal yopish
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalOverlay").addEventListener("click", (e) => { if (e.target.id === "modalOverlay") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  // Kunlik maqsad tugmasi
  $("#goalBtn")?.addEventListener("click", goDailyGoalAction);
  // Filtrlar
  ["searchInput", "gradeFilter", "valueFilter", "genreFilter"].forEach((id) => {
    const el = $("#" + id);
    if (el) el.addEventListener(id === "searchInput" ? "input" : "change", renderLibrary);
  });
  $("#librarySortNewest")?.addEventListener("click", () => setLibrarySortMode("newest"));
  $("#librarySortPopular")?.addEventListener("click", () => setLibrarySortMode("popular"));
  $("#librarySortRandom")?.addEventListener("click", () => setLibrarySortMode("random"));
  initScrollTop();
  initParallax();
  initTeacherGate();
}

function initScrollTop() {
  const btn = $("#scrollTopBtn");
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = "1";
  const toggle = () => {
    btn.hidden = window.scrollY < 420;
  };
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: motionReduced() ? "auto" : "smooth" });
  });
}

let teacherGateBound = false;

function openTeacherGate() {
  if (!Api.online) {
    toast("O'qituvchilar bazasi uchun server ishga tushiring: cd server && npm start", "err");
    return;
  }
  const gate = $("#teacherAuthGate");
  if (gate) gate.hidden = false;
  document.body.classList.add("locked");
  if (location.hash.replace("#", "") !== "oqituvchi") location.hash = "oqituvchi";
}

function closeTeacherGate() {
  const gate = $("#teacherAuthGate");
  if (gate) gate.hidden = true;
  document.body.classList.remove("locked");
  if (!TeacherApi.isLoggedIn() && location.hash.replace("#", "") === "oqituvchi") {
    location.hash = "bosh";
  }
}

function enterTeacherDashboard() {
  $("#teacherAuthGate").hidden = true;
  document.body.classList.remove("locked");
  switchPage("oqituvchi", true);
}

function initTeacherGate() {
  if (teacherGateBound) return;
  teacherGateBound = true;

  const openBtn = $("#teacherDashOpen");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      if (TeacherApi.isLoggedIn()) location.hash = "oqituvchi";
      else openTeacherGate();
    });
  }

  const closeBtn = $("#teacherGateClose");
  if (closeBtn) closeBtn.addEventListener("click", closeTeacherGate);

  const loginForm = $("#teacherLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#teacherLoginError");
      err.hidden = true;
      const res = await TeacherApi.login({
        username: $("#teacherLoginUser").value,
        password: $("#teacherLoginPass").value,
      });
      if (!res.ok) { err.textContent = res.msg; err.hidden = false; return; }
      toast(`Xush kelibsiz, ${res.teacher.name}!`, "win");
      enterTeacherDashboard();
    });
  }

  bindAdminPanelEvents();

  const logoutBtn = $("#teacherLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      TeacherApi.clearSession();
      toast("O'qituvchi panelidan chiqdingiz", "xp");
      location.hash = "bosh";
    });
  }
}

function initParallax() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) return;
  const layers = $$("[data-parallax]");
  if (!layers.length) return;

  let ticking = false;
  const update = () => {
    const y = window.scrollY || 0;
    layers.forEach((el) => {
      const speed = parseFloat(el.dataset.speed || "0");
      el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
    });
    ticking = false;
  };
  const requestUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

/* ====================== AUTH GATE BOSHQARUVI ====================== */
const AUTH_AVATARS = ["🧒", "👦", "👧", "🦊", "🐯", "🦉", "🐻", "🦁"];
let appBooted = false;

function showAuthGate() {
  document.documentElement.classList.remove("has-session", "app-booting");
  const gate = $("#authGate");
  gate.hidden = false;
  document.body.classList.add("locked");

  // Avatar tanlovi
  let regAvatar = "🧒";
  let regAvatarImg = null;
  $("#regAvatars").innerHTML = AUTH_AVATARS.map((a) => `<button type="button" class="${a === regAvatar ? "sel" : ""}" data-av="${a}">${a}</button>`).join("");
  $$("#regAvatars button").forEach((b) => b.addEventListener("click", () => {
    regAvatar = b.dataset.av;
    regAvatarImg = null;
    $$("#regAvatars button").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel");
    setAvatarEl($("#regPhotoPreview"), { avatar: regAvatar, avatarImg: null });
  }));

  // Ro'yxatdan o'tishda rasm yuklash
  $("#regPhotoInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) fileToAvatar(file, (dataUrl) => {
      regAvatarImg = dataUrl;
      setAvatarEl($("#regPhotoPreview"), { avatar: regAvatar, avatarImg: dataUrl });
    });
  });

  // Tablar
  $$(".auth-tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".auth-tab").forEach((t) => t.classList.remove("active"));
    $$(".auth-form").forEach((f) => { f.classList.remove("active"); f.hidden = true; });
    tab.classList.add("active");
    const f = $(`.auth-form[data-form="${tab.dataset.atab}"]`);
    f.classList.add("active"); f.hidden = false;
  }));

  // Kirish
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#loginError");
    err.hidden = true;
    const res = await Auth.loginAsync({ user: $("#loginUser").value, pass: $("#loginPass").value });
    if (!res.ok) { err.textContent = res.msg; err.hidden = false; return; }
    enterApp(false, res.serverUser);
  });

  // Ro'yxatdan o'tish
  $("#registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#regError");
    err.hidden = true;
    const res = await Auth.registerAsync({
      user: $("#regUser").value, pass: $("#regPass").value,
      name: $("#regName").value, grade: $("#regGrade").value, avatar: regAvatar, avatarImg: regAvatarImg,
    });
    if (!res.ok) { err.textContent = res.msg; err.hidden = false; return; }
    enterApp(true, res.serverUser);
  });
}

function enterApp(isNew = false, serverUser = null) {
  document.documentElement.classList.add("has-session");
  $("#authGate").hidden = true;
  document.body.classList.remove("locked");
  bootApp(serverUser).then(() => {
    if (Api.online && Api.token) {
      syncLocalIjodQueue().then((n) => {
        if (n > 0) {
          toast(`${n} ta ijod serverga yuborildi`, "win");
          if (location.hash.includes("ijod")) renderIjod({ fetch: true });
        }
      });
    }
    if (isNew) setTimeout(() => toast("🎉 Xush kelibsiz! Bilim sayohati boshlandi!", "win"), 600);
  });
}

/* Asosiy ilovani ishga tushirish (faqat login bo'lgach) */
async function bootApp(serverUser = null) {
  Store.load();
  if (serverUser) Api.applyServerProgress(serverUser);
  TeacherApi.loadCachedTeacher();
  if (!appBooted) {
    fillValueFilters();
    bindGlobalEvents();
    initBot();
    bindAdminPanelEvents();
    appBooted = true;
  }
  try {
    await Promise.all([
      loadCustomWorksIntoCatalog(),
      loadValuesIntoCatalog(),
      WorkViews.load(),
      WorkRatings.load(),
      MatchPairs.load(),
      QuizGames.load(),
      MapConfig.load(),
    ]);
    rebuildMapRegionsList();
    refreshHomeMapBackground();
    renderAboutStats();
    fillValueFilters();
  } catch { /* offline */ }
  renderProfile();
  handleHash();
  observeReveals();
  document.documentElement.classList.remove("app-booting");
  if (Store.data.pendingWarning?.message) {
    setTimeout(showStudentWarningIfNeeded, 600);
  }
  // Kirish bonusi (kuniga bir marta)
  const today = new Date().toISOString().slice(0, 10);
  if (Store.data._welcomed !== today) {
    Store.data._welcomed = today;
    Store.save();
    setTimeout(() => toast(`Xush kelibsiz, ${Store.data.name}! 🔥 ${Store.data.streak}-kunlik seriya`, "win"), 900);
  }
}

async function init() {
  await Api.ping();
  TeacherApi.loadCachedTeacher();
  if (Api.online && TeacherApi.token) {
    try {
      const teacher = await TeacherApi.me();
      if (!teacher) TeacherApi.clearSession();
    } catch {
      TeacherApi.clearSession();
    }
  }

  if (Api.online && Api.token) {
    try {
      const res = await fetch("/api/auth/me", { headers: Api.headers() });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem(CURRENT_KEY, user.username);
        document.documentElement.classList.add("has-session");
        $("#authGate").hidden = true;
        document.body.classList.remove("locked");
        await bootApp(user);
        return;
      }
      Api.clearSession();
    } catch (e) {
      console.warn("Sessiya tiklanmadi", e);
    }
  }

  if (Auth.current() && Auth.account()) {
    document.documentElement.classList.add("has-session");
    $("#authGate").hidden = true;
    document.body.classList.remove("locked");
    await bootApp();
  } else {
    showAuthGate();
  }
}

document.addEventListener("DOMContentLoaded", init);
