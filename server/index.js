import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  createUser,
  findUserByUsername,
  findUserById,
  updateUserProfile,
  getProgress,
  saveProgress,
  getLeaderboard,
  userToClient,
  getAllStudentsDetailed,
  adminResetStudentPassword,
  setPasswordNote,
  adminUpdateStudent,
  adminDeleteStudent,
  adminRemoveStudentAvatar,
  adminWarnStudent,
  dismissStudentWarning,
} from "./db.js";
import {
  createTeacher,
  findTeacherByUsername,
  findTeacherById,
  teacherToClient,
  getStudentsOverview,
  getStudentsStats,
  ensureBootstrapAdmin,
  listTeachers,
} from "./teachers-db.js";
import { listIjod, createIjod, deleteIjod, rateIjod, listIjodAdmin, adminDeleteIjod, adminUpdateIjod, getIjodCountByUserId } from "./ijod-db.js";
import { listCustomWorks, createCustomWork, deleteCustomWork, updateWork, getCatalogPublic, findCustomWork, getWorkOverride } from "./works-db.js";
import { getAllViewCounts, incrementWorkView } from "./work-views-db.js";
import { getAllWorkRatingStats, getWorkRatingStats, rateWork } from "./work-ratings-db.js";
import { parseCrosswordLines, generateCrosswordEntriesFromWork } from "./crossword-gen.js";
import { getMatchConfigPublic, saveMatchConfig } from "./match-pairs-db.js";
import { getQuizGamesPublic, saveQuizGames } from "./quiz-games-db.js";
import {
  getMapConfigPublic,
  saveMapConfig,
  saveMapInfographic,
  removeMapInfographic,
  saveMapBackground,
  removeMapBackground,
} from "./map-config-db.js";
import { sendContactMessage } from "./contact-mail.js";
import {
  getCatalogPublic as getValuesCatalogPublic,
  createCustomValue,
  updateValue,
  deleteValue,
  restoreTextbookValue,
} from "./values-db.js";
import {
  resolveMediaFilePath,
  migrateLegacyUploads,
  saveOptimizedStorageMedia,
  optimizeImageBase64,
  deleteStorageMediaByUrl,
  MEDIA_ROOT,
  LEGACY_UPLOADS_ROOT,
  ensurePersistentDataDir,
} from "./media-store.js";
import { flushJsonStoreWrites, initJsonStores } from "./json-store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}
loadEnvFile();
ensurePersistentDataDir();
try {
  await initJsonStores();
  ensureBootstrapAdmin();
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
migrateLegacyUploads();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "qk-dev-secret-change-in-production";

function handleSupabaseError(res, e, fallbackMessage) {
  if (e.code === "SUPABASE_NOT_CONFIGURED") {
    return res.status(500).json({ error: e.message });
  }
  if (e.code === "SUPABASE_QUERY_ERROR" || e.code === "SUPABASE_STORAGE_ERROR") {
    return res.status(500).json({ error: e.message });
  }
  console.error(e);
  return res.status(500).json({ error: fallbackMessage });
}

async function optimizeAvatarDataUrl(avatarImg) {
  if (!avatarImg) return null;
  if (!String(avatarImg).startsWith("data:image/")) return avatarImg;
  const optimized = await optimizeImageBase64(avatarImg, {
    maxBytes: 3 * 1024 * 1024,
    maxWidth: 256,
    maxHeight: 256,
    quality: 76,
    fit: "cover",
  });
  return optimized.dataUrl;
}

const LEVELS = [
  { min: 0, name: "Yangi sayohatchi", emoji: "🌱" },
  { min: 1000, name: "Izlanuvchi", emoji: "🔎" },
  { min: 2000, name: "Bilimdon", emoji: "📘" },
  { min: 3000, name: "Zukko", emoji: "💡" },
  { min: 4000, name: "Dono shogird", emoji: "🦉" },
  { min: 5000, name: "Donishmand", emoji: "👑" },
];

function getLevel(xp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) idx = i;
  }
  return { ...LEVELS[idx], level: idx + 1 };
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

function resolveStudentUser(payload) {
  if (!payload) return null;
  let user = findUserById(payload.id);
  if (!user && payload.username) {
    user = findUserByUsername(payload.username);
  }
  return user;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Kirish talab qilinadi" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role === "teacher") {
      return res.status(403).json({ error: "O'qituvchi tokeni — o'quvchi API uchun mos emas" });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Sessiya muddati tugagan" });
  }
}

function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.role !== "teacher") req.user = payload;
    } catch { /* ignore */ }
  }
  next();
}

function teacherAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "O'qituvchi kirishi talab qilinadi" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "teacher") {
      return res.status(403).json({ error: "O'qituvchi huquqi talab qilinadi" });
    }
    const teacher = findTeacherById(payload.id);
    if (!teacher) return res.status(401).json({ error: "O'qituvchi topilmadi" });
    req.teacher = { ...payload, isAdmin: !!teacher.is_admin };
    next();
  } catch {
    res.status(401).json({ error: "Sessiya muddati tugagan" });
  }
}

function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "O'qituvchi kirishi talab qilinadi" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "teacher") {
      return res.status(403).json({ error: "O'qituvchi huquqi talab qilinadi" });
    }
    const teacher = findTeacherById(payload.id);
    if (!teacher) return res.status(401).json({ error: "O'qituvchi topilmadi" });
    if (!teacher.is_admin) return res.status(403).json({ error: "Faqat admin uchun" });
    req.teacher = { ...payload, isAdmin: true };
    next();
  } catch {
    res.status(401).json({ error: "Sessiya muddati tugagan" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "qadriyatlar-kaledaskopi", ijod: true, version: 2 });
});

app.post("/api/contact", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim();
    const message = String(req.body.message || "").trim();
    if (message.length < 5) {
      return res.status(400).json({ error: "Xabar kamida 5 ta belgidan iborat bo'lsin." });
    }
    const result = await sendContactMessage({ name, email, message });
    res.json(result);
  } catch (e) {
    if (e.message === "EMPTY_MESSAGE") {
      return res.status(400).json({ error: "Xabar matnini yozing." });
    }
    console.error("Contact xatolik:", e);
    res.status(500).json({ error: "Xabar yuborilmadi. Keyinroq urinib ko'ring." });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const name = String(req.body.name || "O'quvchi").trim();
    const grade = +req.body.grade || 3;
    const avatar = req.body.avatar || "🧒";
    const avatarImg = await optimizeAvatarDataUrl(req.body.avatarImg || null);

    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Login 3–20 ta lotin harf/raqamdan iborat bo'lsin." });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lsin." });
    }
    if (findUserByUsername(username)) {
      return res.status(409).json({ error: "Bu login band. Boshqasini tanlang." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createUser({ username, passwordHash, passwordNote: password, name, grade, avatar, avatarImg });
    const user = findUserById(userId);
    const progress = getProgress(userId);
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: userToClient(user, progress) });
  } catch (e) {
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Profil rasmi formati noto'g'ri." });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Profil rasmi 3 MB dan kichik bo'lsin." });
    console.error(e);
    res.status(500).json({ error: "Ro'yxatdan o'tishda xatolik" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = findUserByUsername(username);
    if (!user) return res.status(401).json({ error: "Bunday foydalanuvchi topilmadi." });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Parol noto'g'ri." });
    if (!user.password_note) setPasswordNote(user.id, password);
    const progress = getProgress(user.id);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: userToClient(user, progress) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Kirishda xatolik" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = resolveStudentUser(req.user);
  if (!user) return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });
  res.json(userToClient(user, getProgress(user.id)));
});

app.put("/api/progress", authMiddleware, async (req, res) => {
  try {
    const user = resolveStudentUser(req.user);
    if (!user) return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });
    const p = { ...(req.body || {}) };
    if (p.avatarImg !== undefined && user.avatar_upload_blocked && p.avatarImg && p.avatarImg !== user.avatar_img) {
      return res.status(403).json({
        error: "Profil rasmini hozircha o'zgartira olmaysiz. Admin ogohlantirishini o'qing va tasdiqlang.",
      });
    }
    if (p.avatarImg !== undefined) {
      p.avatarImg = p.avatarImg ? await optimizeAvatarDataUrl(p.avatarImg) : null;
    }
    saveProgress(user.id, p);
    if (p.name || p.grade || p.avatar || p.avatarImg !== undefined) {
      updateUserProfile(user.id, {
        name: p.name || user.name,
        grade: p.grade || user.grade,
        avatar: p.avatar || user.avatar,
        avatarImg: p.avatarImg !== undefined ? p.avatarImg : user.avatar_img,
      });
    }
    res.json({ ok: true });
  } catch (e) {
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Profil rasmi formati noto'g'ri." });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Profil rasmi 3 MB dan kichik bo'lsin." });
    console.error(e);
    res.status(500).json({ error: "Profilni saqlashda xatolik" });
  }
});

app.post("/api/auth/warning/dismiss", authMiddleware, (req, res) => {
  const user = resolveStudentUser(req.user);
  if (!user) return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });
  dismissStudentWarning(user.id);
  res.json({ ok: true });
});

app.get("/api/leaderboard", (_req, res) => {
  const rows = getLeaderboard(100).map((r) => {
    const lv = getLevel(r.xp);
    return {
      username: r.username,
      name: r.name,
      grade: r.grade,
      xp: r.xp,
      avatar: r.avatar,
      avatarImg: r.avatar_img,
      level: lv.level,
      levelName: lv.name,
      levelEmoji: lv.emoji,
    };
  });
  res.json(rows);
});

/* -------------------- O'QITUVCHILAR / ADMIN -------------------- */
app.post("/api/teacher/auth/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const teacher = findTeacherByUsername(username);
    if (!teacher) return res.status(401).json({ error: "Login yoki parol noto'g'ri." });
    const ok = await bcrypt.compare(password, teacher.password_hash);
    if (!ok) return res.status(401).json({ error: "Login yoki parol noto'g'ri." });
    const token = jwt.sign(
      { id: teacher.id, username: teacher.username, role: "teacher", isAdmin: !!teacher.is_admin },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ token, teacher: teacherToClient(teacher) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Kirishda xatolik" });
  }
});

app.get("/api/teacher/auth/me", teacherAuthMiddleware, (req, res) => {
  const teacher = findTeacherById(req.teacher.id);
  if (!teacher) return res.status(404).json({ error: "O'qituvchi topilmadi" });
  res.json(teacherToClient(teacher));
});

app.get("/api/teacher/dashboard", teacherAuthMiddleware, (_req, res) => {
  const ijodCounts = getIjodCountByUserId();
  const students = getAllStudentsDetailed(200).map((s) => ({
    ...s,
    avatarImg: s.avatar_img,
    hasPendingWarning: s.hasPendingWarning,
    ijodCount: ijodCounts[s.id] || 0,
  }));
  res.json({
    stats: getStudentsStats(),
    students,
    isAdmin: !!_req.teacher.isAdmin,
  });
});

app.post("/api/teacher/students", teacherAuthMiddleware, async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const name = String(req.body.name || "O'quvchi").trim();
    const grade = +req.body.grade || 3;
    const avatar = req.body.avatar || "🧒";

    if (!/^[a-z0-9_.]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Login 3–20 ta lotin harf/raqamdan iborat bo'lsin." });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lsin." });
    }
    if (findUserByUsername(username)) {
      return res.status(409).json({ error: "Bu login band." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = createUser({ username, passwordHash, passwordNote: password, name, grade, avatar, avatarImg: null });
    const user = findUserById(userId);
    res.json({ ok: true, user: userToClient(user, getProgress(userId)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "O'quvchi yaratishda xatolik" });
  }
});

app.put("/api/teacher/students/:id", teacherAuthMiddleware, async (req, res) => {
  try {
    const name = req.body.name != null ? String(req.body.name).trim() : null;
    const username = req.body.username != null ? String(req.body.username).trim().toLowerCase() : null;
    const password = req.body.password != null ? String(req.body.password) : null;
    const grade = req.body.grade != null ? +req.body.grade : null;

    if (username && !/^[a-z0-9_.]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "Login 3–20 ta lotin harf/raqamdan iborat bo'lsin." });
    }
    if (password && password.length > 0 && password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lsin." });
    }

    const payload = {};
    if (name) payload.name = name;
    if (username) payload.username = username;
    if (grade != null) payload.grade = grade;
    if (password && password.length >= 4) {
      payload.passwordHash = await bcrypt.hash(password, 10);
      payload.passwordNote = password;
    }

    const user = adminUpdateStudent(req.params.id, payload);
    if (!user) return res.status(404).json({ error: "O'quvchi topilmadi" });
    res.json({
      ok: true,
      student: {
        id: user.id,
        username: user.username,
        name: user.name,
        grade: user.grade,
        passwordNote: user.password_note,
      },
    });
  } catch (e) {
    if (e.message === "USER_EXISTS") return res.status(409).json({ error: "Bu login band." });
    if (e.message === "INVALID_USERNAME") {
      return res.status(400).json({ error: "Login 3–20 ta lotin harf/raqamdan iborat bo'lsin." });
    }
    console.error(e);
    res.status(500).json({ error: "O'quvchini yangilashda xatolik" });
  }
});

app.put("/api/teacher/students/:id/password", teacherAuthMiddleware, async (req, res) => {
  try {
    const password = String(req.body.password || "");
    if (password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lsin." });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = adminResetStudentPassword(req.params.id, hash, password);
    if (!user) return res.status(404).json({ error: "O'quvchi topilmadi" });
    res.json({ ok: true, username: user.username, passwordNote: user.password_note });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Parol yangilashda xatolik" });
  }
});

app.post("/api/teacher/students/sync-passwords", teacherAuthMiddleware, async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    let synced = 0;
    for (const raw of items) {
      const username = String(raw.username || "").trim().toLowerCase();
      const password = String(raw.password || "");
      if (!username || password.length < 4) continue;
      const user = findUserByUsername(username);
      if (!user || user.password_note) continue;
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) continue;
      setPasswordNote(user.id, password);
      synced++;
    }
    res.json({ ok: true, synced });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Parollarni sinxronlashda xatolik" });
  }
});

app.delete("/api/teacher/students/:id", adminAuthMiddleware, (req, res) => {
  const ok = adminDeleteStudent(req.params.id);
  if (!ok) return res.status(404).json({ error: "O'quvchi topilmadi" });
  res.json({ ok: true });
});

app.delete("/api/teacher/students/:id/avatar", teacherAuthMiddleware, (req, res) => {
  const user = adminRemoveStudentAvatar(req.params.id);
  if (!user) return res.status(404).json({ error: "O'quvchi topilmadi" });
  res.json({ ok: true, student: { id: user.id, avatar: user.avatar, avatarImg: user.avatar_img } });
});

app.post("/api/teacher/students/:id/warn", teacherAuthMiddleware, (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ error: "Ogohlantirish sababini yozing." });
  const removeAvatar = !!req.body.removeAvatar;
  const user = adminWarnStudent(req.params.id, { message, removeAvatar });
  if (!user) return res.status(404).json({ error: "O'quvchi topilmadi" });
  res.json({
    ok: true,
    student: {
      id: user.id,
      avatar: user.avatar,
      avatarImg: user.avatar_img,
      hasPendingWarning: !!(user.admin_warning && !user.admin_warning.seen),
    },
  });
});

app.get("/api/teacher/ijod", teacherAuthMiddleware, (_req, res) => {
  res.json(listIjodAdmin({ limit: 500 }));
});

app.put("/api/teacher/ijod/:id", teacherAuthMiddleware, (req, res) => {
  const item = adminUpdateIjod(req.params.id, {
    title: req.body.title,
    description: req.body.description,
    value_id: req.body.valueId || req.body.value_id,
    hidden: req.body.hidden,
  });
  if (!item) return res.status(404).json({ error: "Rasm topilmadi" });
  res.json(item);
});

app.delete("/api/teacher/ijod/:id", teacherAuthMiddleware, async (req, res) => {
  try {
    const removed = adminDeleteIjod(req.params.id);
    if (!removed) return res.status(404).json({ error: "Rasm topilmadi" });
    if (removed.image_url) await deleteStorageMediaByUrl(removed.image_url);
    res.json({ ok: true });
  } catch (e) {
    handleSupabaseError(res, e, "Rasmni o'chirishda xatolik");
  }
});

app.get("/api/works/custom", async (_req, res) => {
  try {
    res.json(await listCustomWorks());
  } catch (e) {
    handleSupabaseError(res, e, "Asarlar yuklanmadi");
  }
});

app.get("/api/works/catalog", async (_req, res) => {
  try {
    res.json(await getCatalogPublic());
  } catch (e) {
    handleSupabaseError(res, e, "Asarlar katalogi yuklanmadi");
  }
});

app.get("/api/works/views", (_req, res) => {
  res.json({ counts: getAllViewCounts() });
});

app.post("/api/works/:id/view", (req, res) => {
  try {
    const count = incrementWorkView(req.params.id);
    res.json({ ok: true, count });
  } catch (e) {
    if (e.message === "INVALID_ID") return res.status(400).json({ error: "Noto'g'ri asar ID" });
    console.error(e);
    res.status(500).json({ error: "Ko'rishni saqlashda xatolik" });
  }
});

app.get("/api/works/ratings", (_req, res) => {
  res.json({ stats: getAllWorkRatingStats() });
});

app.get("/api/works/:id/rating", optionalAuthMiddleware, (req, res) => {
  const user = req.user ? resolveStudentUser(req.user) : null;
  res.json(getWorkRatingStats(req.params.id, user?.id ?? null));
});

app.put("/api/works/:id/rate", authMiddleware, (req, res) => {
  const user = resolveStudentUser(req.user);
  if (!user) return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });
  const rating = +req.body.rating;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Reyting 1 dan 5 gacha bo'lishi kerak" });
  }
  try {
    const stats = rateWork(req.params.id, user.id, rating);
    res.json(stats);
  } catch (e) {
    if (e.message === "INVALID_ID") return res.status(400).json({ error: "Noto'g'ri asar ID" });
    console.error(e);
    res.status(500).json({ error: "Bahoni saqlashda xatolik" });
  }
});

app.get("/api/values/catalog", (_req, res) => {
  res.json(getValuesCatalogPublic());
});

app.get("/api/teacher/values", teacherAuthMiddleware, (_req, res) => {
  res.json(getValuesCatalogPublic());
});

app.post("/api/teacher/values", teacherAuthMiddleware, (req, res) => {
  try {
    const value = createCustomValue(req.body || {});
    res.json({ ok: true, value });
  } catch (e) {
    if (e.message === "INVALID_NAME") return res.status(400).json({ error: "Qadriyat nomini kiriting." });
    if (e.message === "VALUE_EXISTS") return res.status(409).json({ error: "Bu ID band." });
    console.error(e);
    res.status(500).json({ error: "Qadriyat yaratishda xatolik" });
  }
});

app.put("/api/teacher/values/:id", teacherAuthMiddleware, (req, res) => {
  try {
    const isTextbook = !!req.body.isTextbook;
    const result = updateValue(req.params.id, req.body || {}, { isTextbook });
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e.message === "NOT_FOUND") return res.status(404).json({ error: "Qadriyat topilmadi" });
    console.error(e);
    res.status(500).json({ error: "Saqlashda xatolik" });
  }
});

app.delete("/api/teacher/values/:id", teacherAuthMiddleware, (req, res) => {
  try {
    const isTextbook = req.query.kind === "textbook" || req.body?.isTextbook;
    const result = deleteValue(req.params.id, { isTextbook });
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e.message === "NOT_FOUND") return res.status(404).json({ error: "Qadriyat topilmadi" });
    console.error(e);
    res.status(500).json({ error: "O'chirishda xatolik" });
  }
});

app.post("/api/teacher/values/:id/restore", teacherAuthMiddleware, (req, res) => {
  restoreTextbookValue(req.params.id);
  res.json({ ok: true });
});

app.get("/api/teacher/works/:id", teacherAuthMiddleware, async (req, res) => {
  try {
    const custom = await findCustomWork(req.params.id);
    if (custom) return res.json({ work: custom, kind: "custom" });
    const override = await getWorkOverride(req.params.id);
    if (override) return res.json({ work: { id: req.params.id, ...override }, kind: "override" });
    res.json({ work: null, kind: "textbook" });
  } catch (e) {
    handleSupabaseError(res, e, "Asar yuklanmadi");
  }
});

app.put("/api/teacher/works/:id", teacherAuthMiddleware, async (req, res) => {
  try {
    const result = await updateWork(req.params.id, req.body || {});
    res.json({ ok: true, ...result });
  } catch (e) {
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Rasm formati noto'g'ri." });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Rasm 5 MB dan kichik bo'lsin." });
    handleSupabaseError(res, e, "Asarni saqlashda xatolik");
  }
});

app.post("/api/teacher/works", teacherAuthMiddleware, async (req, res) => {
  try {
    const work = await createCustomWork(req.body || {});
    res.json(work);
  } catch (e) {
    if (e.message === "WORK_EXISTS") return res.status(409).json({ error: "Bu ID band" });
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Rasm formati noto'g'ri." });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Rasm 5 MB dan kichik bo'lsin." });
    handleSupabaseError(res, e, "Asar qo'shishda xatolik");
  }
});

app.post("/api/teacher/crossword/parse", teacherAuthMiddleware, (req, res) => {
  const lines = String(req.body?.lines ?? "");
  res.json({ entries: parseCrosswordLines(lines) });
});

app.post("/api/teacher/works/:id/crossword/auto", teacherAuthMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    let work = await findCustomWork(id);
    if (!work) {
      const override = await getWorkOverride(id);
      work = override ? { id, ...override } : req.body?.work || null;
    }
    if (!work) {
      return res.status(404).json({ error: "Asar topilmadi — avval asar ma'lumotini yuboring" });
    }
    res.json({ entries: generateCrosswordEntriesFromWork(work) });
  } catch (e) {
    handleSupabaseError(res, e, "Krossvord yaratishda xatolik");
  }
});

app.get("/api/match-pairs", (_req, res) => {
  res.json(getMatchConfigPublic());
});

app.get("/api/teacher/match-pairs", teacherAuthMiddleware, (_req, res) => {
  res.json(getMatchConfigPublic());
});

app.put("/api/teacher/match-pairs", teacherAuthMiddleware, (req, res) => {
  try {
    const config = saveMatchConfig(req.body || {});
    res.json({ ok: true, ...config });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Saqlashda xatolik" });
  }
});

app.get("/api/quiz-games", (_req, res) => {
  res.json(getQuizGamesPublic());
});

app.get("/api/teacher/quiz-games", teacherAuthMiddleware, (_req, res) => {
  res.json(getQuizGamesPublic());
});

app.put("/api/teacher/quiz-games", teacherAuthMiddleware, (req, res) => {
  try {
    const config = saveQuizGames(req.body || {});
    res.json({ ok: true, ...config });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Saqlashda xatolik" });
  }
});

app.get("/api/map-config", (_req, res) => {
  res.json(getMapConfigPublic());
});

app.get("/api/teacher/map-config", teacherAuthMiddleware, (_req, res) => {
  res.json(getMapConfigPublic());
});

app.put("/api/teacher/map-config", teacherAuthMiddleware, (req, res) => {
  try {
    const config = saveMapConfig(req.body || {});
    res.json({ ok: true, ...config });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Saqlashda xatolik" });
  }
});

app.post("/api/teacher/map-config/:regionId/infographic", teacherAuthMiddleware, async (req, res) => {
  try {
    const { url, config } = await saveMapInfographic(req.params.regionId, req.body?.imageBase64);
    res.json({ ok: true, infographicUrl: url, regions: config.regions });
  } catch (e) {
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Rasm formati noto'g'ri" });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Rasm 6 MB dan katta" });
    if (e.message === "INVALID_REGION") return res.status(400).json({ error: "Viloyat topilmadi" });
    handleSupabaseError(res, e, "Rasm saqlanmadi");
  }
});

app.delete("/api/teacher/map-config/:regionId/infographic", teacherAuthMiddleware, async (req, res) => {
  try {
    const config = await removeMapInfographic(req.params.regionId);
    res.json({ ok: true, regions: config.regions });
  } catch (e) {
    handleSupabaseError(res, e, "O'chirib bo'lmadi");
  }
});

app.post("/api/teacher/map-config/background", teacherAuthMiddleware, async (req, res) => {
  try {
    const { url, config } = await saveMapBackground(req.body?.imageBase64);
    res.json({ ok: true, backgroundUrl: url, regions: config.regions });
  } catch (e) {
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Rasm formati noto'g'ri" });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Rasm 6 MB dan katta" });
    handleSupabaseError(res, e, "Fon rasmi saqlanmadi");
  }
});

app.delete("/api/teacher/map-config/background", teacherAuthMiddleware, async (_req, res) => {
  try {
    const config = await removeMapBackground();
    res.json({ ok: true, regions: config.regions, backgroundUrl: config.backgroundUrl });
  } catch (e) {
    handleSupabaseError(res, e, "Fon rasmini o'chirib bo'lmadi");
  }
});

app.delete("/api/teacher/works/:id", teacherAuthMiddleware, async (req, res) => {
  try {
    const removed = await deleteCustomWork(req.params.id);
    if (!removed) return res.status(404).json({ error: "Asar topilmadi" });
    res.json({ ok: true, kind: removed.kind });
  } catch (e) {
    handleSupabaseError(res, e, "Asarni o'chirishda xatolik");
  }
});

app.get("/api/teacher/teachers", adminAuthMiddleware, (_req, res) => {
  res.json(listTeachers());
});

app.post("/api/teacher/teachers", adminAuthMiddleware, async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const name = String(req.body.name || "O'qituvchi").trim();
    const school = String(req.body.school || "").trim();

    if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
      return res.status(400).json({ error: "Login 3–24 ta lotin harf/raqamdan iborat bo'lsin." });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Parol kamida 4 ta belgidan iborat bo'lsin." });
    }
    if (findTeacherByUsername(username)) {
      return res.status(409).json({ error: "Bu login band." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teacherId = createTeacher({ username, passwordHash, name, school, isAdmin: false });
    const teacher = findTeacherById(teacherId);
    res.json({ ok: true, teacher: teacherToClient(teacher) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "O'qituvchi yaratishda xatolik" });
  }
});

/* Legacy endpoint */
app.get("/api/teacher/students", teacherAuthMiddleware, (_req, res) => {
  const ijodCounts = getIjodCountByUserId();
  res.json({
    stats: getStudentsStats(),
    students: getAllStudentsDetailed(100).map((s) => ({
      username: s.username,
      name: s.name,
      grade: s.grade,
      xp: s.xp,
      avatar: s.avatar,
      avatarImg: s.avatar_img,
      stars: s.stars,
      ijodCount: ijodCounts[s.id] || 0,
    })),
  });
});

/* -------------------- IJOD (o'quvchi rasmlari) -------------------- */
const VALID_VALUE_IDS = new Set([
  "halollik", "mehnatsevarlik", "vatanparvarlik", "mehribonlik", "saxovat",
  "ota-onaga-hurmat", "dustlik", "masuliyat", "adolat",
]);

function optionalStudentAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role === "teacher") return null;
    const user = resolveStudentUser(payload);
    return user || null;
  } catch {
    return null;
  }
}

app.get("/api/ijod", (req, res) => {
  const grade = req.query.grade ? +req.query.grade : null;
  const valueId = req.query.value_id ? String(req.query.value_id) : null;
  const sortBy = req.query.sort === "rating" ? "rating" : "newest";
  const user = optionalStudentAuth(req);
  res.json(listIjod({ grade, valueId, sortBy, userId: user?.id ?? null }));
});

app.post("/api/ijod", authMiddleware, async (req, res) => {
  try {
    const user = resolveStudentUser(req.user);
    if (!user) {
      return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });
    }

    const title = String(req.body.title || "Mening ijodim").trim().slice(0, 80);
    const description = String(req.body.description || "").trim().slice(0, 280);
    const valueId = String(req.body.valueId || req.body.value_id || "").trim();
    const imageBase64 = String(req.body.imageBase64 || "");

    if (!VALID_VALUE_IDS.has(valueId)) {
      return res.status(400).json({ error: "Qadriyatni tanlang" });
    }
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(imageBase64)) {
      return res.status(400).json({ error: "Rasm yuklang (JPEG yoki PNG)" });
    }

    const imageUrl = await saveOptimizedStorageMedia("ijod", `${user.id}_${Date.now()}`, imageBase64, {
      maxBytes: 5 * 1024 * 1024,
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 78,
    });

    const item = createIjod({
      user_id: user.id,
      username: user.username,
      author_name: user.name,
      grade: user.grade,
      title,
      description,
      value_id: valueId,
      image_url: imageUrl,
    });
    res.json(item);
  } catch (e) {
    if (e.message === "INVALID_IMAGE") return res.status(400).json({ error: "Rasm yuklang (JPEG yoki PNG)" });
    if (e.message === "IMAGE_TOO_LARGE") return res.status(400).json({ error: "Rasm hajmi juda katta (max ~5MB)" });
    handleSupabaseError(res, e, "Rasm yuklashda xatolik");
  }
});

app.delete("/api/ijod/:id", authMiddleware, async (req, res) => {
  try {
    const user = resolveStudentUser(req.user);
    if (!user) return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });
    const removed = deleteIjod(req.params.id, user.id);
    if (!removed) return res.status(404).json({ error: "Topilmadi yoki o'chirish huquqi yo'q" });
    if (removed.image_url) await deleteStorageMediaByUrl(removed.image_url);
    res.json({ ok: true });
  } catch (e) {
    handleSupabaseError(res, e, "Rasmni o'chirishda xatolik");
  }
});

app.put("/api/ijod/:id/rate", authMiddleware, (req, res) => {
  const user = resolveStudentUser(req.user);
  if (!user) return res.status(401).json({ error: "Sessiya eskirgan — qayta kiring" });

  const rating = +req.body.rating;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Reyting 1 dan 5 gacha bo'lishi kerak" });
  }

  const result = rateIjod(req.params.id, user.id, rating);
  if (result.error === "not_found") {
    return res.status(404).json({ error: "Rasm topilmadi" });
  }
  if (result.error === "own_item") {
    return res.status(403).json({ error: "O'z rasmingizga baho bera olmaysiz" });
  }
  res.json(result.item);
});

app.get("/api/media/:category/:filename", (req, res) => {
  const fp = resolveMediaFilePath(req.params.category, req.params.filename);
  if (!fp) return res.status(404).end();
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");
  res.sendFile(fp);
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API topilmadi — serverni qayta ishga tushiring (npm start)" });
  }
  next();
});

/** Eski /uploads/ URL lar uchun: avval uploads, keyin data/media dan qidiradi */
app.use("/uploads", (req, res, next) => {
  const legacyPath = path.join(LEGACY_UPLOADS_ROOT, req.path);
  if (legacyPath.startsWith(LEGACY_UPLOADS_ROOT) && fs.existsSync(legacyPath)) return next();
  const parts = req.path.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const mediaPath = path.join(MEDIA_ROOT, ...parts);
    if (mediaPath.startsWith(MEDIA_ROOT) && fs.existsSync(mediaPath)) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.sendFile(mediaPath);
    }
  }
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(ROOT));

app.get("*", (req, res, next) => {
  if (/\.(png|jpe?g|webp|svg|gif|ico|woff2?|mp3|mp4|pdf)$/i.test(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Qadriyatlar Kaledaskopi: http://localhost:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await flushJsonStoreWrites();
    process.exit(0);
  });
}
