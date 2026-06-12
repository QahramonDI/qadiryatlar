import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "students.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function loadDb() {
  if (!fs.existsSync(dbPath)) {
    return { users: [], progress: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return { users: [], progress: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
}

function nextId(list) {
  return list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}

export function createUser({ username, passwordHash, passwordNote, name, grade, avatar, avatarImg }) {
  const db = loadDb();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("USER_EXISTS");
  }
  const id = nextId(db.users);
  const user = {
    id,
    username,
    password_hash: passwordHash,
    password_note: passwordNote || null,
    name,
    grade,
    avatar: avatar || "🧒",
    avatar_img: avatarImg || null,
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  db.progress.push({
    user_id: id,
    xp: 0,
    stars: 0,
    streak: 1,
    last_active: null,
    daily_date: null,
    daily_done: 0,
    daily_goal: 5,
    read_works: [],
    completed_tests: {},
    certificates: [],
    badges: [],
    opened_values: [],
    visited_regions: [],
    played_games: [],
    activity: {},
    updated_at: new Date().toISOString(),
  });
  saveDb(db);
  return id;
}

export function findUserByUsername(username) {
  const db = loadDb();
  return db.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function findUserById(id) {
  const db = loadDb();
  const uid = Number(id);
  if (!Number.isFinite(uid)) return null;
  return db.users.find((u) => u.id === uid) || null;
}

export function updateUserProfile(id, { name, grade, avatar, avatarImg }) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return;
  user.name = name;
  user.grade = grade;
  user.avatar = avatar;
  user.avatar_img = avatarImg ?? null;
  saveDb(db);
}

export function adminRemoveStudentAvatar(userId) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === +userId);
  if (!user) return null;
  user.avatar_img = null;
  saveDb(db);
  return user;
}

export function adminWarnStudent(userId, { message, removeAvatar = false }) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === +userId);
  if (!user) return null;
  if (removeAvatar) user.avatar_img = null;
  user.admin_warning = {
    message: String(message || "").trim().slice(0, 500),
    at: new Date().toISOString(),
    remove_avatar: !!removeAvatar,
    seen: false,
  };
  if (removeAvatar) user.avatar_upload_blocked = true;
  saveDb(db);
  return user;
}

export function dismissStudentWarning(userId) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === +userId);
  if (!user) return null;
  if (user.admin_warning) user.admin_warning.seen = true;
  user.avatar_upload_blocked = false;
  saveDb(db);
  return user;
}

export function getActiveWarning(user) {
  if (!user?.admin_warning || user.admin_warning.seen) return null;
  return user.admin_warning;
}

export function getProgress(userId) {
  const db = loadDb();
  const uid = Number(userId);
  const row = db.progress.find((p) => p.user_id === uid);
  if (!row) return null;
  return {
    xp: row.xp,
    stars: row.stars,
    streak: row.streak,
    lastActive: row.last_active,
    dailyDate: row.daily_date,
    dailyDone: row.daily_done,
    dailyGoal: row.daily_goal,
    readWorks: row.read_works,
    completedTests: row.completed_tests,
    certificates: row.certificates,
    badges: row.badges,
    openedValues: row.opened_values,
    visitedRegions: row.visited_regions,
    playedGames: row.played_games,
    activity: row.activity,
  };
}

export function saveProgress(userId, data) {
  const db = loadDb();
  const uid = Number(userId);
  const row = db.progress.find((p) => p.user_id === uid);
  if (!row) return;
  row.xp = data.xp ?? 0;
  row.stars = data.stars ?? 0;
  row.streak = data.streak ?? 1;
  row.last_active = data.lastActive ?? null;
  row.daily_date = data.dailyDate ?? null;
  row.daily_done = data.dailyDone ?? 0;
  row.daily_goal = data.dailyGoal ?? 5;
  row.read_works = data.readWorks ?? [];
  row.completed_tests = data.completedTests ?? {};
  row.certificates = data.certificates ?? [];
  row.badges = data.badges ?? [];
  row.opened_values = data.openedValues ?? [];
  row.visited_regions = data.visitedRegions ?? [];
  row.played_games = data.playedGames ?? [];
  row.activity = data.activity ?? {};
  row.updated_at = new Date().toISOString();
  saveDb(db);
}

export function getLeaderboard(limit = 50) {
  const db = loadDb();
  return db.users
    .map((u) => {
      const p = db.progress.find((pr) => pr.user_id === u.id);
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        grade: u.grade,
        avatar: u.avatar,
        avatar_img: u.avatar_img,
        hasPendingWarning: !!(u.admin_warning && !u.admin_warning.seen),
        xp: p?.xp ?? 0,
        stars: p?.stars ?? 0,
        streak: p?.streak ?? 0,
        badges: p?.badges?.length ?? 0,
        readWorks: p?.read_works?.length ?? 0,
        testsPassed: Object.keys(p?.completed_tests ?? {}).length,
        openedValues: p?.opened_values?.length ?? 0,
        playedGames: p?.played_games?.length ?? 0,
        lastActive: p?.last_active ?? null,
        createdAt: u.created_at ?? null,
        passwordNote: u.password_note ?? null,
      };
    })
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function getAllStudentsDetailed(limit = 200) {
  return getLeaderboard(limit);
}

export function setPasswordNote(userId, passwordNote) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === +userId);
  if (!user) return null;
  user.password_note = passwordNote;
  saveDb(db);
  return user;
}

export function adminUpdateStudent(userId, { name, username, passwordHash, passwordNote, grade }) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === +userId);
  if (!user) return null;
  if (name != null) user.name = String(name).trim().slice(0, 80) || user.name;
  if (grade != null) user.grade = +grade === 4 ? 4 : 3;
  if (username != null) {
    const un = String(username).trim().toLowerCase();
    if (!/^[a-z0-9_.]{3,20}$/.test(un)) throw new Error("INVALID_USERNAME");
    if (db.users.some((u) => u.id !== user.id && u.username.toLowerCase() === un)) {
      throw new Error("USER_EXISTS");
    }
    user.username = un;
  }
  if (passwordHash != null) user.password_hash = passwordHash;
  if (passwordNote != null) user.password_note = passwordNote;
  saveDb(db);
  return user;
}

export function adminResetStudentPassword(userId, passwordHash, passwordNote) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === +userId);
  if (!user) return null;
  user.password_hash = passwordHash;
  if (passwordNote != null) user.password_note = passwordNote;
  saveDb(db);
  return user;
}

export function adminDeleteStudent(userId) {
  const db = loadDb();
  const uid = +userId;
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== uid);
  db.progress = db.progress.filter((p) => p.user_id !== uid);
  if (db.users.length === before) return false;
  saveDb(db);
  return true;
}

export function userToClient(user, progress) {
  const warning = getActiveWarning(user);
  return {
    username: user.username,
    name: user.name,
    grade: user.grade,
    avatar: user.avatar,
    avatarImg: user.avatar_img,
    avatarUploadBlocked: !!user.avatar_upload_blocked,
    warning: warning
      ? { message: warning.message, at: warning.at, removeAvatar: !!warning.remove_avatar }
      : null,
    progress: progress || getProgress(user.id),
  };
}
