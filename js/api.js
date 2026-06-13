/* Server API — o'quvchilar bazasi va reyting (Express + SQLite) */
"use strict";

const Api = {
  online: false,
  ijodApi: false,
  token: localStorage.getItem("qk_token") || null,
  username: localStorage.getItem("qk_api_user") || null,

  setSession(token, username) {
    this.token = token;
    this.username = username;
    if (token) localStorage.setItem("qk_token", token);
    else localStorage.removeItem("qk_token");
    if (username) localStorage.setItem("qk_api_user", username);
    else localStorage.removeItem("qk_api_user");
  },

  clearSession() {
    this.setSession(null, null);
  },

  async ping() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      this.online = res.ok;
      this.ijodApi = false;
      if (res.ok) {
        try {
          const data = await res.json();
          if (data.ijod) this.ijodApi = true;
        } catch { /* ignore */ }
      }
      if (this.online && !this.ijodApi) {
        try {
          const ij = await fetch("/api/ijod", { cache: "no-store" });
          if (ij.ok) {
            const ct = ij.headers.get("content-type") || "";
            if (ct.includes("application/json")) this.ijodApi = true;
          }
        } catch { /* ignore */ }
      }
      return this.online;
    } catch {
      this.online = false;
      this.ijodApi = false;
      return false;
    }
  },

  async ensureStudentSession() {
    if (!this.online) {
      return { ok: false, msg: "Server ishlamayapti. Terminalda: npm start" };
    }
    if (!this.ijodApi) {
      return { ok: false, msg: "Server eski versiya. Qayta ishga tushiring: npm start" };
    }
    if (!this.token) {
      return { ok: false, msg: "Serverga qayta kiring (chiqib, login/parol bilan kiring)", needLogin: true };
    }
    try {
      const res = await fetch("/api/auth/me", { headers: this.headers(), cache: "no-store" });
      if (res.ok) return { ok: true };
      this.clearSession();
      return { ok: false, msg: "Sessiya tugagan. Chiqib, qayta kiring.", needLogin: true };
    } catch {
      return { ok: false, msg: "Server bilan aloqa uzildi" };
    }
  },

  headers() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  },

  async register(payload) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
      this.setSession(data.token, data.user.username);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, msg: "Server bilan aloqa yo'q" };
    }
  },

  async login(payload) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await res.json(); } catch { /* ignore */ }
      if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
      this.setSession(data.token, data.user.username);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, msg: "Server bilan aloqa yo'q" };
    }
  },

  async syncProgress(state) {
    if (!this.online || !this.token) return;
    try {
      await fetch("/api/progress", {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({
          name: state.name,
          grade: state.grade,
          avatar: state.avatar,
          avatarImg: state.avatarImg,
          xp: state.xp,
          stars: state.stars,
          streak: state.streak,
          lastActive: state.lastActive,
          dailyDate: state.dailyDate,
          dailyDone: state.dailyDone,
          dailyGoal: state.dailyGoal,
          readWorks: state.readWorks,
          completedTests: state.completedTests,
          certificates: state.certificates,
          badges: state.badges,
          openedValues: state.openedValues,
          visitedRegions: state.visitedRegions,
          playedGames: state.playedGames,
          activity: state.activity,
        }),
      });
    } catch (e) {
      console.warn("Progress sinxronlash xatoligi:", e);
    }
  },

  async fetchLeaderboard() {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (!res.ok) throw new Error("Reyting yuklanmadi");
    return res.json();
  },

  async sendContact(payload) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, msg: data.error || "Xabar yuborilmadi" };
      return { ok: true, emailed: !!data.emailed };
    } catch {
      return { ok: false, msg: "Server bilan aloqa yo'q. Sayt server orqali ochilgan bo'lishi kerak." };
    }
  },

  applyServerProgress(user) {
    if (!user?.progress) return;
    const p = user.progress;
    Object.assign(Store.data, {
      name: user.name,
      grade: user.grade,
      avatar: user.avatar,
      avatarImg: user.avatarImg,
      pendingWarning: user.warning || null,
      avatarUploadBlocked: !!user.avatarUploadBlocked,
      xp: p.xp ?? 0,
      stars: p.stars ?? 0,
      streak: p.streak ?? 1,
      lastActive: p.lastActive,
      dailyDate: p.dailyDate,
      dailyDone: p.dailyDone ?? 0,
      dailyGoal: p.dailyGoal ?? 5,
      readWorks: p.readWorks ?? [],
      completedTests: p.completedTests ?? {},
      certificates: p.certificates ?? [],
      badges: p.badges ?? [],
      openedValues: p.openedValues ?? [],
      visitedRegions: p.visitedRegions ?? [],
      playedGames: p.playedGames ?? [],
      activity: p.activity ?? {},
    });
    Store.save();
  },

  async dismissWarning() {
    if (!this.online || !this.token) return { ok: false };
    try {
      const res = await fetch("/api/auth/warning/dismiss", {
        method: "POST",
        headers: this.headers(),
      });
      if (!res.ok) return { ok: false };
      Store.data.pendingWarning = null;
      Store.data.avatarUploadBlocked = false;
      Store.save();
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
};

const TeacherApi = {
  token: localStorage.getItem("qk_teacher_token") || null,
  teacher: null,

  setSession(token, teacher) {
    this.token = token;
    this.teacher = teacher || null;
    if (token) localStorage.setItem("qk_teacher_token", token);
    else localStorage.removeItem("qk_teacher_token");
    if (teacher) localStorage.setItem("qk_teacher_user", JSON.stringify(teacher));
    else localStorage.removeItem("qk_teacher_user");
  },

  clearSession() {
    this.setSession(null, null);
  },

  loadCachedTeacher() {
    try {
      const raw = localStorage.getItem("qk_teacher_user");
      this.teacher = raw ? JSON.parse(raw) : null;
    } catch {
      this.teacher = null;
    }
    return this.teacher;
  },

  isLoggedIn() {
    return !!this.token;
  },

  headers() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  },

  async register(payload) {
    return { ok: false, msg: "Ro'yxatdan o'tish o'chirilgan. Admin bilan bog'laning." };
  },

  async login(payload) {
    const res = await fetch("/api/teacher/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    this.setSession(data.token, data.teacher);
    return { ok: true, teacher: data.teacher };
  },

  async me() {
    const res = await fetch("/api/teacher/auth/me", { headers: this.headers() });
    if (!res.ok) return null;
    const teacher = await res.json();
    this.teacher = teacher;
    localStorage.setItem("qk_teacher_user", JSON.stringify(teacher));
    return teacher;
  },

  async fetchStudents() {
    const res = await fetch("/api/teacher/students", { headers: this.headers(), cache: "no-store" });
    if (!res.ok) throw new Error("O'quvchilar ma'lumoti yuklanmadi");
    return res.json();
  },

  async fetchDashboard() {
    const res = await fetch("/api/teacher/dashboard", { headers: this.headers(), cache: "no-store" });
    if (!res.ok) throw new Error("Dashboard yuklanmadi");
    return res.json();
  },

  async createStudent(payload) {
    const res = await fetch("/api/teacher/students", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, user: data.user };
  },

  async resetStudentPassword(id, password) {
    const res = await fetch(`/api/teacher/students/${encodeURIComponent(id)}/password`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, passwordNote: data.passwordNote };
  },

  async updateStudent(id, payload) {
    const res = await fetch(`/api/teacher/students/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, student: data.student };
  },

  async syncStudentPasswords(items) {
    const res = await fetch("/api/teacher/students/sync-passwords", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik", synced: 0 };
    return { ok: true, synced: data.synced || 0 };
  },

  async deleteStudent(id) {
    const res = await fetch(`/api/teacher/students/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true };
  },

  async removeStudentAvatar(id) {
    const res = await fetch(`/api/teacher/students/${encodeURIComponent(id)}/avatar`, {
      method: "DELETE",
      headers: this.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, student: data.student };
  },

  async warnStudent(id, payload) {
    const res = await fetch(`/api/teacher/students/${encodeURIComponent(id)}/warn`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, student: data.student };
  },

  async fetchIjodAdmin() {
    const res = await fetch("/api/teacher/ijod", { headers: this.headers(), cache: "no-store" });
    if (!res.ok) throw new Error("Rasmlar yuklanmadi");
    return res.json();
  },

  async updateIjodAdmin(id, payload) {
    const res = await fetch(`/api/teacher/ijod/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, item: data };
  },

  async deleteIjodAdmin(id) {
    const res = await fetch(`/api/teacher/ijod/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true };
  },

  async fetchCustomWorks() {
    const res = await fetch("/api/works/custom", { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  },

  async fetchWorksCatalog() {
    const res = await fetch("/api/works/catalog", { cache: "no-store" });
    if (!res.ok) return { works: [], overrides: {}, hiddenIds: [] };
    return res.json();
  },

  async fetchValuesCatalog() {
    const res = await fetch("/api/values/catalog", { cache: "no-store" });
    if (!res.ok) return { values: [], overrides: {}, hiddenIds: [] };
    return res.json();
  },

  async createValue(payload) {
    const res = await fetch("/api/teacher/values", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, value: data.value };
  },

  async updateValue(id, payload) {
    const res = await fetch(`/api/teacher/values/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, ...data };
  },

  async deleteValue(id, { isTextbook = false } = {}) {
    const qs = isTextbook ? "?kind=textbook" : "";
    const res = await fetch(`/api/teacher/values/${encodeURIComponent(id)}${qs}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, ...data };
  },

  async fetchWork(id) {
    const res = await fetch(`/api/teacher/works/${encodeURIComponent(id)}`, {
      headers: this.headers(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Asar yuklanmadi");
    return res.json();
  },

  async createWork(payload) {
    const res = await fetch("/api/teacher/works", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, work: data };
  },

  async updateWork(id, payload) {
    const res = await fetch(`/api/teacher/works/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, ...data };
  },

  async deleteWork(id) {
    const res = await fetch(`/api/teacher/works/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true };
  },

  async fetchStaff() {
    const res = await fetch("/api/teacher/teachers", { headers: this.headers(), cache: "no-store" });
    if (!res.ok) throw new Error("Xodimlar ro'yxati yuklanmadi");
    return res.json();
  },

  async createTeacher(payload) {
    const res = await fetch("/api/teacher/teachers", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Xatolik" };
    return { ok: true, teacher: data.teacher };
  },
};

const IjodApi = {
  localKey: "qk_ijod_local_v1",

  getLocal() {
    try {
      return JSON.parse(localStorage.getItem(this.localKey) || "[]");
    } catch {
      return [];
    }
  },

  saveLocal(items) {
    localStorage.setItem(this.localKey, JSON.stringify(items));
  },

  async fetchAll(filters = {}) {
    const qs = new URLSearchParams();
    if (filters.grade) qs.set("grade", filters.grade);
    if (filters.valueId) qs.set("value_id", filters.valueId);
    if (filters.sort) qs.set("sort", filters.sort);
    const url = qs.toString() ? `/api/ijod?${qs}` : "/api/ijod";
    const res = await fetch(url, { cache: "no-store", headers: Api.headers() });
    if (!res.ok) throw new Error("Ijod yuklanmadi");
    return res.json();
  },

  async quota() {
    const res = await fetch("/api/ijod/quota", { cache: "no-store", headers: Api.headers() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Limit ma'lumoti yuklanmadi" };
    return { ok: true, quota: data };
  },

  async upload(payload) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const res = await fetch("/api/ijod", {
        method: "POST",
        headers: Api.headers(),
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        return { ok: false, msg: data.error || `Server xatoligi (${res.status})` };
      }
      return { ok: true, item: data };
    } catch (e) {
      if (e.name === "AbortError") {
        return { ok: false, msg: "Vaqt tugadi — internetni tekshirib qayta urinib ko'ring" };
      }
      return { ok: false, msg: "Server bilan aloqa yo'q. Keyinroq qayta urinib ko'ring." };
    } finally {
      clearTimeout(timer);
    }
  },

  async remove(id) {
    const res = await fetch(`/api/ijod/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: Api.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "O'chirib bo'lmadi" };
    return { ok: true };
  },

  async rate(id, rating) {
    const res = await fetch(`/api/ijod/${encodeURIComponent(id)}/rate`, {
      method: "PUT",
      headers: Api.headers(),
      body: JSON.stringify({ rating }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok) {
      return { ok: false, msg: data.error || `Server xatoligi (${res.status})` };
    }
    return { ok: true, item: data };
  },
};

let syncTimer = null;
function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => Api.syncProgress(Store.data), 700);
}

const WorkViews = {
  counts: {},

  async load() {
    try {
      const res = await fetch("/api/works/views", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        this.counts = data.counts || {};
      }
    } catch { /* offline */ }
    return this.counts;
  },

  get(workId) {
    return this.counts[workId] || 0;
  },

  async record(workId) {
    if (!workId) return 0;
    const prev = this.counts[workId] || 0;
    if (!Api.online) return prev;
    try {
      const res = await fetch(`/api/works/${encodeURIComponent(workId)}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        this.counts[workId] = data.count ?? prev + 1;
      }
    } catch { /* ignore */ }
    return this.counts[workId] || prev;
  },
};

const WorkRatings = {
  stats: {},

  async load() {
    try {
      const res = await fetch("/api/works/ratings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        this.stats = data.stats || {};
      }
    } catch { /* offline */ }
    return this.stats;
  },

  get(workId) {
    return this.stats[workId] || { averageRating: 0, ratingCount: 0, userRating: null };
  },

  set(workId, data) {
    if (!workId || !data) return;
    this.stats[workId] = {
      averageRating: data.averageRating ?? 0,
      ratingCount: data.ratingCount ?? 0,
      userRating: data.userRating ?? null,
    };
  },

  async fetchWork(workId) {
    if (!workId) return null;
    try {
      const res = await fetch(`/api/works/${encodeURIComponent(workId)}/rating`, {
        headers: Api.token ? Api.headers() : { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json();
      this.set(workId, data);
      return data;
    } catch {
      return null;
    }
  },

  async rate(workId, rating) {
    const res = await fetch(`/api/works/${encodeURIComponent(workId)}/rate`, {
      method: "PUT",
      headers: Api.headers(),
      body: JSON.stringify({ rating }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Bahoni saqlab bo'lmadi" };
    this.set(workId, data);
    return { ok: true, stats: data };
  },
};

const MatchPairs = {
  config: { pairs: [], pickCount: 5 },

  async load() {
    try {
      const res = await fetch("/api/match-pairs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        this.config = { pairs: data.pairs || [], pickCount: data.pickCount || 5 };
      }
    } catch { /* offline */ }
    return this.config;
  },

  async save(payload) {
    const res = await fetch("/api/teacher/match-pairs", {
      method: "PUT",
      headers: TeacherApi.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Saqlashda xatolik" };
    this.config = { pairs: data.pairs || [], pickCount: data.pickCount || 5 };
    return { ok: true, config: this.config };
  },
};

const QuizGames = {
  config: {
    guess: { pickCount: 8, items: [] },
    author: { pickCount: 8, items: [] },
    truefalse: { pickCount: 10, items: [] },
  },

  async load() {
    try {
      const res = await fetch("/api/quiz-games", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        this.config = {
          guess: { pickCount: data.guess?.pickCount || 8, items: data.guess?.items || [] },
          author: { pickCount: data.author?.pickCount || 8, items: data.author?.items || [] },
          truefalse: { pickCount: data.truefalse?.pickCount || 10, items: data.truefalse?.items || [] },
        };
      }
    } catch { /* offline */ }
    return this.config;
  },

  async save(payload) {
    const res = await fetch("/api/teacher/quiz-games", {
      method: "PUT",
      headers: TeacherApi.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Saqlashda xatolik" };
    this.config = {
      guess: { pickCount: data.guess?.pickCount || 8, items: data.guess?.items || [] },
      author: { pickCount: data.author?.pickCount || 8, items: data.author?.items || [] },
      truefalse: { pickCount: data.truefalse?.pickCount || 10, items: data.truefalse?.items || [] },
    };
    return { ok: true, config: this.config };
  },
};

const MapConfig = {
  config: { regions: {}, backgroundUrl: null },

  async load() {
    try {
      const res = await fetch("/api/map-config", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        this.config = { regions: data.regions || {}, backgroundUrl: data.backgroundUrl || null };
        this._cacheBust = Date.now();
      }
    } catch { /* offline */ }
    return this.config;
  },

  async save(payload) {
    const res = await fetch("/api/teacher/map-config", {
      method: "PUT",
      headers: TeacherApi.headers(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Saqlashda xatolik" };
    this.config = { regions: data.regions || {}, backgroundUrl: data.backgroundUrl || this.config.backgroundUrl || null };
    return { ok: true, config: this.config };
  },

  async uploadInfographic(regionId, imageBase64) {
    const res = await fetch(`/api/teacher/map-config/${encodeURIComponent(regionId)}/infographic`, {
      method: "POST",
      headers: TeacherApi.headers(),
      body: JSON.stringify({ imageBase64 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Rasm yuklanmadi" };
    this.config = { regions: data.regions || {}, backgroundUrl: this.config.backgroundUrl || null };
    this._cacheBust = Date.now();
    return { ok: true, infographicUrl: data.infographicUrl, config: this.config };
  },

  async deleteInfographic(regionId) {
    const res = await fetch(`/api/teacher/map-config/${encodeURIComponent(regionId)}/infographic`, {
      method: "DELETE",
      headers: TeacherApi.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "O'chirib bo'lmadi" };
    this.config = { regions: data.regions || {}, backgroundUrl: this.config.backgroundUrl || null };
    return { ok: true, config: this.config };
  },

  async uploadBackground(imageBase64) {
    const res = await fetch("/api/teacher/map-config/background", {
      method: "POST",
      headers: TeacherApi.headers(),
      body: JSON.stringify({ imageBase64 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "Fon yuklanmadi" };
    this.config = { regions: data.regions || this.config.regions || {}, backgroundUrl: data.backgroundUrl || null };
    this._cacheBust = Date.now();
    return { ok: true, backgroundUrl: data.backgroundUrl, config: this.config };
  },

  async deleteBackground() {
    const res = await fetch("/api/teacher/map-config/background", {
      method: "DELETE",
      headers: TeacherApi.headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, msg: data.error || "O'chirib bo'lmadi" };
    this.config = { regions: data.regions || this.config.regions || {}, backgroundUrl: null };
    return { ok: true, config: this.config };
  },
};

if (typeof window !== "undefined") {
  window.Api = Api;
  window.TeacherApi = TeacherApi;
  window.IjodApi = IjodApi;
  window.WorkViews = WorkViews;
  window.WorkRatings = WorkRatings;
  window.MatchPairs = MatchPairs;
  window.QuizGames = QuizGames;
  window.MapConfig = MapConfig;
  window.scheduleProgressSync = scheduleSync;
}
