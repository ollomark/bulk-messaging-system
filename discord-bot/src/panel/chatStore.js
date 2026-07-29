import crypto from "node:crypto";
import db from "../database/db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS web_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS web_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES web_users(id)
  );

  CREATE TABLE IF NOT EXISTS web_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_color TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_web_messages_channel_created
    ON web_messages(channel_id, created_at);
`);

const COLORS = [
  "#ed4245",
  "#3ba55c",
  "#faa61a",
  "#5865f2",
  "#eb459e",
  "#57f287",
  "#00a8fc",
  "#f47b67",
  "#9b59b6",
  "#1abc9c",
];

export const WEB_CHANNELS = [
  {
    id: "duyurular",
    name: "duyurular",
    topic: "Resmi duyurular — saygılı kal.",
    category: "BİLGİ",
    readonly: false,
  },
  {
    id: "kurallar",
    name: "kurallar",
    topic: "Topluluk kuralları",
    category: "BİLGİ",
    readonly: false,
  },
  {
    id: "genel",
    name: "genel",
    topic: "Ana sohbet — herkes burada.",
    category: "SOHBET",
  },
  {
    id: "sohbet",
    name: "sohbet",
    topic: "Gündelik muhabbet",
    category: "SOHBET",
  },
  {
    id: "medya",
    name: "medya",
    topic: "Link / medya paylaşımı",
    category: "SOHBET",
  },
  {
    id: "bot",
    name: "bot-komut",
    topic: "Bot ve sistem sohbeti",
    category: "SOHBET",
  },
];

function now() {
  return Date.now();
}

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM web_messages").get().c;
  if (count > 0) return;

  const systemId = "system";
  const exists = db.prepare("SELECT id FROM web_users WHERE id = ?").get(systemId);
  if (!exists) {
    db.prepare(
      "INSERT INTO web_users (id, name, color, created_at, last_seen) VALUES (?, ?, ?, ?, ?)",
    ).run(systemId, "Lexyxzon", "#5865f2", now(), now());
  }

  const insert = db.prepare(`
    INSERT INTO web_messages (id, channel_id, user_id, user_name, user_color, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seeds = [
    ["genel", "XZON Web Chat canlı. Mesajların herkese anlık düşer."],
    ["genel", "Sol kanallardan gez, sağda kimler online gör."],
    ["kurallar", "1) Saygı  2) Spam yok  3) Reklam yasak  4) Küfür = ban"],
    ["duyurular", "Web istemci v2 aktif — gerçek zamanlı sohbet açık."],
  ];

  let t = now() - 60_000;
  for (const [channelId, content] of seeds) {
    insert.run(crypto.randomUUID(), channelId, systemId, "Lexyxzon", "#5865f2", content, t);
    t += 5_000;
  }
}

seedIfEmpty();

export function createWebSession(rawName) {
  const name = String(rawName || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  if (name.length < 2) {
    throw new Error("İsim en az 2 karakter olmalı");
  }
  if (/[@#:`*]/.test(name)) {
    throw new Error("İsimde geçersiz karakter var");
  }

  const id = crypto.randomUUID();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const token = crypto.randomBytes(24).toString("hex");
  const created = now();
  const expires = created + 30 * 24 * 60 * 60 * 1000;

  db.prepare(
    "INSERT INTO web_users (id, name, color, created_at, last_seen) VALUES (?, ?, ?, ?, ?)",
  ).run(id, name, color, created, created);
  db.prepare(
    "INSERT INTO web_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(token, id, created, expires);

  return {
    token,
    user: { id, name, color },
  };
}

export function getSessionUser(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `
      SELECT u.id, u.name, u.color, s.expires_at
      FROM web_sessions s
      JOIN web_users u ON u.id = s.user_id
      WHERE s.token = ?
    `,
    )
    .get(token);
  if (!row) return null;
  if (row.expires_at < now()) return null;
  db.prepare("UPDATE web_users SET last_seen = ? WHERE id = ?").run(now(), row.id);
  return { id: row.id, name: row.name, color: row.color };
}

export function touchPresence(userId) {
  db.prepare("UPDATE web_users SET last_seen = ? WHERE id = ?").run(now(), userId);
}

export function listOnlineUsers(withinMs = 45_000) {
  const since = now() - withinMs;
  return db
    .prepare(
      `
      SELECT id, name, color, last_seen
      FROM web_users
      WHERE last_seen >= ? AND id != 'system'
      ORDER BY name COLLATE NOCASE ASC
      LIMIT 100
    `,
    )
    .all(since);
}

export function getMessages(channelId, { after = 0, limit = 80 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 80, 1), 150);
  return db
    .prepare(
      `
      SELECT id, channel_id AS channelId, user_id AS userId, user_name AS userName,
             user_color AS userColor, content, created_at AS createdAt
      FROM web_messages
      WHERE channel_id = ? AND created_at > ?
      ORDER BY created_at ASC
      LIMIT ?
    `,
    )
    .all(channelId, Number(after) || 0, safeLimit);
}

export function postMessage(user, channelId, content) {
  const channel = WEB_CHANNELS.find((c) => c.id === channelId);
  if (!channel) throw new Error("Kanal bulunamadı");

  const text = String(content || "").trim().slice(0, 1800);
  if (!text) throw new Error("Boş mesaj gönderilemez");

  const message = {
    id: crypto.randomUUID(),
    channelId,
    userId: user.id,
    userName: user.name,
    userColor: user.color,
    content: text,
    createdAt: now(),
  };

  db.prepare(
    `
    INSERT INTO web_messages (id, channel_id, user_id, user_name, user_color, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    message.id,
    message.channelId,
    message.userId,
    message.userName,
    message.userColor,
    message.content,
    message.createdAt,
  );

  touchPresence(user.id);
  return message;
}

export function channelExists(channelId) {
  return WEB_CHANNELS.some((c) => c.id === channelId);
}
