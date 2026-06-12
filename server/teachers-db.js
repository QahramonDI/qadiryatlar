import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { getLeaderboard } from "./db.js";
import { listIjod } from "./ijod-db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const teachersPath = path.join(dataDir, "teachers.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function loadTeachersDb() {
  if (!fs.existsSync(teachersPath)) {
    return { teachers: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(teachersPath, "utf8"));
  } catch {
    return { teachers: [] };
  }
}

function saveTeachersDb(db) {
  fs.writeFileSync(teachersPath, JSON.stringify(db, null, 2), "utf8");
}

function nextId(list) {
  return list.length ? Math.max(...list.map((x) => x.id)) + 1 : 1;
}

export function ensureBootstrapAdmin() {
  const db = loadTeachersDb();
  let admin = db.teachers.find((t) => t.username.toLowerCase() === "madina");
  const hash = bcrypt.hashSync("9699", 10);
  if (!admin) {
    admin = {
      id: nextId(db.teachers),
      username: "madina",
      password_hash: hash,
      name: "Madinaxon Abdullayeva",
      school: "Farg'ona davlat universiteti",
      is_admin: true,
      created_at: new Date().toISOString(),
    };
    db.teachers.push(admin);
  } else {
    admin.password_hash = hash;
    admin.is_admin = true;
    admin.name = admin.name || "Madinaxon Abdullayeva";
  }
  saveTeachersDb(db);
  return admin;
}

export function createTeacher({ username, passwordHash, name, school, isAdmin = false }) {
  const db = loadTeachersDb();
  if (db.teachers.some((t) => t.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("TEACHER_EXISTS");
  }
  const id = nextId(db.teachers);
  const teacher = {
    id,
    username,
    password_hash: passwordHash,
    name,
    school: school || "",
    is_admin: !!isAdmin,
    created_at: new Date().toISOString(),
  };
  db.teachers.push(teacher);
  saveTeachersDb(db);
  return id;
}

export function findTeacherByUsername(username) {
  const db = loadTeachersDb();
  return db.teachers.find((t) => t.username.toLowerCase() === username.toLowerCase()) || null;
}

export function findTeacherById(id) {
  const db = loadTeachersDb();
  return db.teachers.find((t) => t.id === id) || null;
}

export function listTeachers() {
  const db = loadTeachersDb();
  return db.teachers.map((t) => ({
    id: t.id,
    username: t.username,
    name: t.name,
    school: t.school || "",
    isAdmin: !!t.is_admin,
    createdAt: t.created_at,
  }));
}

export function teacherToClient(teacher) {
  return {
    username: teacher.username,
    name: teacher.name,
    school: teacher.school || "",
    role: "teacher",
    isAdmin: !!teacher.is_admin,
  };
}

export function getStudentsOverview(limit = 100) {
  return getLeaderboard(limit).map((r) => ({
    username: r.username,
    name: r.name,
    grade: r.grade,
    xp: r.xp,
    avatar: r.avatar,
    avatarImg: r.avatar_img,
  }));
}

export function getStudentsStats() {
  const rows = getLeaderboard(1000);
  const total = rows.length;
  const grade3 = rows.filter((r) => r.grade === 3).length;
  const grade4 = rows.filter((r) => r.grade === 4).length;
  const totalXp = rows.reduce((s, r) => s + (r.xp || 0), 0);
  const ijodItems = listIjod({ limit: 5000 });
  return {
    total,
    grade3,
    grade4,
    totalXp,
    avgXp: total ? Math.round(totalXp / total) : 0,
    totalIjod: ijodItems.length,
  };
}
