import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inboxPath = path.join(__dirname, "data", "contact-messages.json");

function loadInbox() {
  try {
    if (fs.existsSync(inboxPath)) return JSON.parse(fs.readFileSync(inboxPath, "utf8"));
  } catch { /* ignore */ }
  return [];
}

function saveInbox(rows) {
  fs.writeFileSync(inboxPath, JSON.stringify(rows, null, 2), "utf8");
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: +(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  };
}

export async function sendContactMessage({ name, email, message }) {
  const row = {
    id: Date.now(),
    name: String(name || "Mehmon").trim().slice(0, 80),
    email: String(email || "").trim().slice(0, 120),
    message: String(message || "").trim().slice(0, 2000),
    at: new Date().toISOString(),
    emailed: false,
  };
  if (!row.message) throw new Error("EMPTY_MESSAGE");

  const inbox = loadInbox();
  inbox.unshift(row);
  saveInbox(inbox.slice(0, 200));

  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  const smtp = getSmtpConfig();
  if (!smtp || !to) return { ok: true, saved: true, emailed: false };

  const transporter = nodemailer.createTransport(smtp);
  const from = process.env.SMTP_FROM || `"Qadriyatlar Kaledaskopi" <${smtp.auth.user}>`;
  const subject = `Saytdan xabar: ${row.name}`;
  const text = [
    `Ism: ${row.name}`,
    row.email ? `Email: ${row.email}` : "Email: ko'rsatilmagan",
    `Vaqt: ${row.at}`,
    "",
    row.message,
  ].join("\n");

  await transporter.sendMail({
    from,
    to,
    replyTo: row.email || undefined,
    subject,
    text,
  });

  row.emailed = true;
  inbox[0] = row;
  saveInbox(inbox.slice(0, 200));
  return { ok: true, saved: true, emailed: true };
}
