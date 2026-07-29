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

// Additive columns for Discord-parity features
const userCols = db.prepare("PRAGMA table_info(web_users)").all().map((c) => c.name);
for (const [col, type] of [
  ["tag", "TEXT"],
  ["bio", "TEXT"],
  ["status", "TEXT"],
  ["custom_status", "TEXT"],
  ["voice_channel_id", "TEXT"],
  ["muted", "INTEGER"],
  ["deafened", "INTEGER"],
]) {
  if (!userCols.includes(col)) {
    db.exec(`ALTER TABLE web_users ADD COLUMN ${col} ${type}`);
  }
}

const msgCols = db.prepare("PRAGMA table_info(web_messages)").all().map((c) => c.name);
for (const [col, type] of [
  ["reply_to_id", "TEXT"],
  ["edited_at", "INTEGER"],
  ["deleted", "INTEGER"],
  ["pinned", "INTEGER"],
]) {
  if (!msgCols.includes(col)) {
    db.exec(`ALTER TABLE web_messages ADD COLUMN ${col} ${type}`);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS web_reactions (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, user_id, emoji)
  );

  CREATE TABLE IF NOT EXISTS web_reads (
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    last_read_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, channel_id)
  );

  CREATE TABLE IF NOT EXISTS web_dm_peers (
    channel_id TEXT PRIMARY KEY,
    user_a TEXT NOT NULL,
    user_b TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
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

export const GUILDS = [
  {
    id: "xzon",
    name: "X Z O N #SORGU",
    short: "XZ",
    color: "#5865f2",
  },
  {
    id: "ifsaxd",
    name: "İFSAXD",
    short: "IF",
    color: "#ed4245",
  },
];

export const WEB_CHANNELS = [
  // XZON
  { id: "duyurular", guildId: "xzon", name: "duyurular", topic: "Resmi duyurular", category: "BİLGİ", type: "text" },
  { id: "kurallar", guildId: "xzon", name: "kurallar", topic: "Topluluk kuralları", category: "BİLGİ", type: "text" },
  { id: "genel", guildId: "xzon", name: "genel", topic: "Ana sohbet — herkes burada.", category: "SOHBET", type: "text" },
  { id: "sohbet", guildId: "xzon", name: "sohbet", topic: "Gündelik muhabbet", category: "SOHBET", type: "text" },
  { id: "medya", guildId: "xzon", name: "medya", topic: "Link / medya paylaşımı", category: "SOHBET", type: "text" },
  { id: "bot", guildId: "xzon", name: "bot-komut", topic: "Bot ve sistem", category: "SOHBET", type: "text" },
  { id: "lobby", guildId: "xzon", name: "Lobby", topic: "Sesli lobi", category: "SESLİ", type: "voice" },
  { id: "music", guildId: "xzon", name: "Music", topic: "Müzik odası", category: "SESLİ", type: "voice" },
  { id: "gaming", guildId: "xzon", name: "Gaming", topic: "Oyun sesi", category: "SESLİ", type: "voice" },
  // IFSAXD
  { id: "if-genel", guildId: "ifsaxd", name: "genel", topic: "İFSAXD ana sohbet", category: "GENEL", type: "text" },
  { id: "if-ifsa", guildId: "ifsaxd", name: "ifşa", topic: "Paylaşımlar", category: "GENEL", type: "text" },
  { id: "if-ss", guildId: "ifsaxd", name: "ss-paylaşım", topic: "Screenshot", category: "GENEL", type: "text" },
  { id: "if-voice", guildId: "ifsaxd", name: "Sesli Sohbet", topic: "Ses kanalı", category: "SESLİ", type: "voice" },
];

function now() {
  return Date.now();
}

function makeTag() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    tag: row.tag || "0000",
    bio: row.bio || "",
    status: row.status || "online",
    customStatus: row.custom_status || "",
    voiceChannelId: row.voice_channel_id || null,
    muted: Boolean(row.muted),
    deafened: Boolean(row.deafened),
    lastSeen: row.last_seen,
  };
}

function ensureSystemUser() {
  const systemId = "system";
  const exists = db.prepare("SELECT id FROM web_users WHERE id = ?").get(systemId);
  if (!exists) {
    db.prepare(
      `INSERT INTO web_users (id, name, color, created_at, last_seen, tag, bio, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(systemId, "Lexyxzon", "#5865f2", now(), now(), "3790", "Ultra Premium bot", "online");
  }
}

function seedIfEmpty() {
  ensureSystemUser();
  const count = db.prepare("SELECT COUNT(*) AS c FROM web_messages").get().c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO web_messages (id, channel_id, user_id, user_name, user_color, content, created_at, deleted, pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);

  const seeds = [
    ["genel", "XZON Live — Discord tarzı tam istemci. Mesaj, DM, tepki, ses, ayarlar.", 0],
    ["genel", "Sağ tık / hover ile yanıtla, tepki ekle, sabitle. Markdown: **kalın** *italik* `kod`", 0],
    ["kurallar", "1) Saygı  2) Spam yok  3) Reklam yasak  4) Küfür = ban", 1],
    ["duyurular", "v3 istemci yayında: DM · tepkiler · ses odaları · profiller · arama", 1],
    ["if-genel", "İFSAXD web sohbeti aktif.", 0],
  ];

  let t = now() - 120_000;
  for (const [channelId, content, pinned] of seeds) {
    insert.run(crypto.randomUUID(), channelId, "system", "Lexyxzon", "#5865f2", content, t, pinned);
    t += 8_000;
  }
}

seedIfEmpty();

export function createWebSession(rawName) {
  const name = String(rawName || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  if (name.length < 2) throw new Error("İsim en az 2 karakter olmalı");
  if (/[@#:`*]/.test(name)) throw new Error("İsimde geçersiz karakter var");

  const id = crypto.randomUUID();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const token = crypto.randomBytes(24).toString("hex");
  const created = now();
  const expires = created + 30 * 24 * 60 * 60 * 1000;
  const tag = makeTag();

  db.prepare(
    `INSERT INTO web_users
      (id, name, color, created_at, last_seen, tag, bio, status, custom_status, muted, deafened)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'online', '', 0, 0)`,
  ).run(id, name, color, created, created, tag, "XZON üyesi");

  db.prepare(
    "INSERT INTO web_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(token, id, created, expires);

  return { token, user: getUserById(id) };
}

export function getSessionUser(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.*, s.expires_at AS expires_at
       FROM web_sessions s
       JOIN web_users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token);
  if (!row || row.expires_at < now()) return null;
  db.prepare("UPDATE web_users SET last_seen = ? WHERE id = ?").run(now(), row.id);
  return mapUser(row);
}

export function getUserById(id) {
  return mapUser(db.prepare("SELECT * FROM web_users WHERE id = ?").get(id));
}

export function updateProfile(userId, patch = {}) {
  const user = getUserById(userId);
  if (!user) throw new Error("Kullanıcı yok");

  const name =
    patch.name !== undefined
      ? String(patch.name).trim().replace(/\s+/g, " ").slice(0, 24)
      : user.name;
  if (name.length < 2) throw new Error("İsim çok kısa");

  const bio = patch.bio !== undefined ? String(patch.bio).slice(0, 190) : user.bio;
  const status = ["online", "idle", "dnd", "invisible"].includes(patch.status)
    ? patch.status
    : user.status;
  const customStatus =
    patch.customStatus !== undefined
      ? String(patch.customStatus).slice(0, 80)
      : user.customStatus;

  db.prepare(
    `UPDATE web_users
     SET name = ?, bio = ?, status = ?, custom_status = ?, last_seen = ?
     WHERE id = ?`,
  ).run(name, bio, status, customStatus, now(), userId);

  // Keep message author names roughly in sync for recent identity
  db.prepare(
    `UPDATE web_messages SET user_name = ? WHERE user_id = ? AND deleted = 0 AND created_at > ?`,
  ).run(name, userId, now() - 7 * 24 * 60 * 60 * 1000);

  return getUserById(userId);
}

export function touchPresence(userId) {
  db.prepare("UPDATE web_users SET last_seen = ? WHERE id = ?").run(now(), userId);
}

export function listOnlineUsers(withinMs = 60_000) {
  const since = now() - withinMs;
  return db
    .prepare(
      `SELECT * FROM web_users
       WHERE last_seen >= ? AND id != 'system' AND IFNULL(status, 'online') != 'invisible'
       ORDER BY name COLLATE NOCASE ASC
       LIMIT 150`,
    )
    .all(since)
    .map(mapUser);
}

export function listOfflineRecent(limit = 20) {
  const since = now() - 60_000;
  return db
    .prepare(
      `SELECT * FROM web_users
       WHERE id != 'system' AND (last_seen < ? OR IFNULL(status,'online') = 'invisible')
       ORDER BY last_seen DESC
       LIMIT ?`,
    )
    .all(since, limit)
    .map(mapUser);
}

function reactionsForMessages(ids) {
  if (!ids.length) return {};
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT message_id AS messageId, emoji, user_id AS userId
       FROM web_reactions
       WHERE message_id IN (${placeholders})`,
    )
    .all(...ids);

  /** @type {Record<string, Array<{emoji:string,count:number,mine?:boolean,users:string[]}>>} */
  const map = {};
  for (const row of rows) {
    if (!map[row.messageId]) map[row.messageId] = [];
    let bucket = map[row.messageId].find((r) => r.emoji === row.emoji);
    if (!bucket) {
      bucket = { emoji: row.emoji, count: 0, users: [] };
      map[row.messageId].push(bucket);
    }
    bucket.count += 1;
    bucket.users.push(row.userId);
  }
  return map;
}

function replySnippet(replyToId) {
  if (!replyToId) return null;
  const row = db
    .prepare(
      `SELECT id, user_name AS userName, user_color AS userColor, content, deleted
       FROM web_messages WHERE id = ?`,
    )
    .get(replyToId);
  if (!row) return null;
  return {
    id: row.id,
    userName: row.userName,
    userColor: row.userColor,
    content: row.deleted ? "Mesaj silindi" : String(row.content).slice(0, 120),
  };
}

function hydrateMessages(rows, viewerId = null) {
  const reactionMap = reactionsForMessages(rows.map((r) => r.id));
  return rows.map((row) => {
    const reactions = (reactionMap[row.id] || []).map((r) => ({
      emoji: r.emoji,
      count: r.count,
      mine: viewerId ? r.users.includes(viewerId) : false,
    }));
    return {
      id: row.id,
      channelId: row.channel_id,
      userId: row.user_id,
      userName: row.user_name,
      userColor: row.user_color,
      content: row.deleted ? "Bu mesaj silindi." : row.content,
      createdAt: row.created_at,
      editedAt: row.edited_at || null,
      deleted: Boolean(row.deleted),
      pinned: Boolean(row.pinned),
      replyToId: row.reply_to_id || null,
      replyTo: replySnippet(row.reply_to_id),
      reactions,
    };
  });
}

export function channelExists(channelId) {
  if (WEB_CHANNELS.some((c) => c.id === channelId)) return true;
  if (String(channelId).startsWith("dm:")) {
    return Boolean(db.prepare("SELECT channel_id FROM web_dm_peers WHERE channel_id = ?").get(channelId));
  }
  return false;
}

export function getChannelMeta(channelId) {
  const ch = WEB_CHANNELS.find((c) => c.id === channelId);
  if (ch) return ch;
  if (String(channelId).startsWith("dm:")) {
    const peer = db.prepare("SELECT * FROM web_dm_peers WHERE channel_id = ?").get(channelId);
    if (!peer) return null;
    return {
      id: channelId,
      guildId: "dm",
      name: "dm",
      topic: "Direkt mesaj",
      category: "DM",
      type: "dm",
      userA: peer.user_a,
      userB: peer.user_b,
    };
  }
  return null;
}

export function getMessages(channelId, { after = 0, before = 0, limit = 80, viewerId = null } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 80, 1), 150);
  let rows;
  if (before) {
    // Older page (scroll up)
    rows = db
      .prepare(
        `SELECT * FROM web_messages
         WHERE channel_id = ? AND created_at < ?
         ORDER BY created_at DESC
         LIMIT ?`,
      )
      .all(channelId, Number(before), safeLimit)
      .reverse();
  } else if (after) {
    // Newer than cursor (live catch-up)
    rows = db
      .prepare(
        `SELECT * FROM web_messages
         WHERE channel_id = ? AND created_at > ?
         ORDER BY created_at ASC
         LIMIT ?`,
      )
      .all(channelId, Number(after), safeLimit);
  } else {
    // Initial open: newest page, chronological
    rows = db
      .prepare(
        `SELECT * FROM (
           SELECT * FROM web_messages
           WHERE channel_id = ?
           ORDER BY created_at DESC
           LIMIT ?
         ) recent
         ORDER BY created_at ASC`,
      )
      .all(channelId, safeLimit);
  }
  return hydrateMessages(rows, viewerId);
}

export function searchMessages(channelId, query, viewerId = null) {
  const q = `%${String(query || "").trim().slice(0, 80)}%`;
  if (q === "%%") return [];
  const rows = db
    .prepare(
      `SELECT * FROM web_messages
       WHERE channel_id = ? AND deleted = 0 AND content LIKE ?
       ORDER BY created_at DESC
       LIMIT 40`,
    )
    .all(channelId, q);
  return hydrateMessages(rows.reverse(), viewerId);
}

export function getPinnedMessages(channelId, viewerId = null) {
  const rows = db
    .prepare(
      `SELECT * FROM web_messages
       WHERE channel_id = ? AND pinned = 1 AND deleted = 0
       ORDER BY created_at DESC
       LIMIT 25`,
    )
    .all(channelId);
  return hydrateMessages(rows, viewerId);
}

const rateBuckets = new Map();

function assertRateLimit(userId) {
  const nowTs = now();
  const bucket = rateBuckets.get(userId) || [];
  const recent = bucket.filter((t) => nowTs - t < 5000);
  if (recent.length >= 6) {
    throw new Error("Çok hızlı yazıyorsun — biraz yavaşla");
  }
  recent.push(nowTs);
  rateBuckets.set(userId, recent);
}

export function postMessage(user, channelId, content, { replyToId = null } = {}) {
  const meta = getChannelMeta(channelId);
  if (!meta) throw new Error("Kanal bulunamadı");

  if (meta.type === "dm") {
    if (user.id !== meta.userA && user.id !== meta.userB) {
      throw new Error("Bu DM'ye erişimin yok");
    }
  }

  assertRateLimit(user.id);

  const text = String(content || "").trim().slice(0, 1800);
  if (!text) throw new Error("Boş mesaj gönderilemez");

  if (replyToId) {
    const parent = db.prepare("SELECT id, channel_id FROM web_messages WHERE id = ?").get(replyToId);
    if (!parent || parent.channel_id !== channelId) throw new Error("Yanıt hedefi geçersiz");
  }

  const messageId = crypto.randomUUID();
  const createdAt = now();

  db.prepare(
    `INSERT INTO web_messages
      (id, channel_id, user_id, user_name, user_color, content, created_at, reply_to_id, deleted, pinned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
  ).run(
    messageId,
    channelId,
    user.id,
    user.name,
    user.color,
    text,
    createdAt,
    replyToId || null,
  );

  touchPresence(user.id);
  markRead(user.id, channelId, createdAt);

  const [message] = hydrateMessages(
    db.prepare("SELECT * FROM web_messages WHERE id = ?").all(messageId),
    user.id,
  );
  return message;
}

export function editMessage(userId, messageId, content) {
  const row = db.prepare("SELECT * FROM web_messages WHERE id = ?").get(messageId);
  if (!row || row.deleted) throw new Error("Mesaj yok");
  if (row.user_id !== userId) throw new Error("Sadece kendi mesajını düzenleyebilirsin");
  const text = String(content || "").trim().slice(0, 1800);
  if (!text) throw new Error("Boş olamaz");
  const editedAt = now();
  db.prepare("UPDATE web_messages SET content = ?, edited_at = ? WHERE id = ?").run(
    text,
    editedAt,
    messageId,
  );
  return hydrateMessages(db.prepare("SELECT * FROM web_messages WHERE id = ?").all(messageId), userId)[0];
}

export function deleteMessage(userId, messageId) {
  const row = db.prepare("SELECT * FROM web_messages WHERE id = ?").get(messageId);
  if (!row || row.deleted) throw new Error("Mesaj yok");
  if (row.user_id !== userId && userId !== "system") {
    throw new Error("Sadece kendi mesajını silebilirsin");
  }
  db.prepare(
    `UPDATE web_messages SET deleted = 1, content = 'Bu mesaj silindi.', pinned = 0 WHERE id = ?`,
  ).run(messageId);
  db.prepare("DELETE FROM web_reactions WHERE message_id = ?").run(messageId);
  return hydrateMessages(db.prepare("SELECT * FROM web_messages WHERE id = ?").all(messageId), userId)[0];
}

export function togglePin(userId, messageId) {
  const row = db.prepare("SELECT * FROM web_messages WHERE id = ?").get(messageId);
  if (!row || row.deleted) throw new Error("Mesaj yok");
  const pinned = row.pinned ? 0 : 1;
  db.prepare("UPDATE web_messages SET pinned = ? WHERE id = ?").run(pinned, messageId);
  return hydrateMessages(db.prepare("SELECT * FROM web_messages WHERE id = ?").all(messageId), userId)[0];
}

export function toggleReaction(userId, messageId, emoji) {
  const clean = String(emoji || "").trim().slice(0, 16);
  if (!clean) throw new Error("Emoji gerekli");
  const row = db.prepare("SELECT * FROM web_messages WHERE id = ?").get(messageId);
  if (!row || row.deleted) throw new Error("Mesaj yok");

  const existing = db
    .prepare("SELECT 1 FROM web_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?")
    .get(messageId, userId, clean);

  if (existing) {
    db.prepare("DELETE FROM web_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?").run(
      messageId,
      userId,
      clean,
    );
  } else {
    db.prepare(
      "INSERT INTO web_reactions (message_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)",
    ).run(messageId, userId, clean, now());
  }

  return hydrateMessages(db.prepare("SELECT * FROM web_messages WHERE id = ?").all(messageId), userId)[0];
}

export function markRead(userId, channelId, at = now()) {
  db.prepare(
    `INSERT INTO web_reads (user_id, channel_id, last_read_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, channel_id) DO UPDATE SET last_read_at = excluded.last_read_at`,
  ).run(userId, channelId, at);
}

export function getUnreadMap(userId) {
  const channels = [
    ...WEB_CHANNELS.filter((c) => c.type === "text").map((c) => c.id),
    ...db
      .prepare("SELECT channel_id AS id FROM web_dm_peers WHERE user_a = ? OR user_b = ?")
      .all(userId, userId)
      .map((r) => r.id),
  ];

  /** @type {Record<string, number>} */
  const map = {};
  for (const channelId of channels) {
    const read = db
      .prepare("SELECT last_read_at AS at FROM web_reads WHERE user_id = ? AND channel_id = ?")
      .get(userId, channelId);
    const lastRead = read?.at || 0;
    const count = db
      .prepare(
        `SELECT COUNT(*) AS c FROM web_messages
         WHERE channel_id = ? AND created_at > ? AND deleted = 0 AND user_id != ?`,
      )
      .get(channelId, lastRead, userId).c;
    if (count > 0) map[channelId] = count;
  }
  return map;
}

export function getOrCreateDm(userId, peerId) {
  if (userId === peerId) throw new Error("Kendine DM açılamaz");
  const peer = getUserById(peerId);
  if (!peer || peerId === "system") throw new Error("Kullanıcı bulunamadı");

  const existing = db
    .prepare(
      `SELECT channel_id AS id FROM web_dm_peers
       WHERE (user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)`,
    )
    .get(userId, peerId, peerId, userId);

  if (existing) {
    return { channelId: existing.id, peer };
  }

  const channelId = `dm:${[userId, peerId].sort().join(":")}`;
  db.prepare(
    "INSERT INTO web_dm_peers (channel_id, user_a, user_b, created_at) VALUES (?, ?, ?, ?)",
  ).run(channelId, userId, peerId, now());

  return { channelId, peer };
}

export function listDms(userId) {
  const rows = db
    .prepare(
      `SELECT channel_id AS channelId, user_a AS userA, user_b AS userB, created_at AS createdAt
       FROM web_dm_peers
       WHERE user_a = ? OR user_b = ?
       ORDER BY created_at DESC`,
    )
    .all(userId, userId);

  return rows.map((row) => {
    const peerId = row.userA === userId ? row.userB : row.userA;
    const peer = getUserById(peerId);
    const last = db
      .prepare(
        `SELECT content, created_at AS createdAt, user_name AS userName
         FROM web_messages
         WHERE channel_id = ? AND deleted = 0
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(row.channelId);
    return {
      channelId: row.channelId,
      peer,
      lastMessage: last || null,
    };
  });
}

export function joinVoice(userId, channelId) {
  const meta = getChannelMeta(channelId);
  if (!meta || meta.type !== "voice") throw new Error("Ses kanalı değil");
  db.prepare(
    `UPDATE web_users
     SET voice_channel_id = ?, last_seen = ?, muted = IFNULL(muted,0), deafened = IFNULL(deafened,0)
     WHERE id = ?`,
  ).run(channelId, now(), userId);
  return getUserById(userId);
}

export function leaveVoice(userId) {
  db.prepare("UPDATE web_users SET voice_channel_id = NULL, last_seen = ? WHERE id = ?").run(
    now(),
    userId,
  );
  return getUserById(userId);
}

export function setVoiceFlags(userId, { muted, deafened } = {}) {
  const user = getUserById(userId);
  if (!user) throw new Error("Kullanıcı yok");
  const nextMuted = muted !== undefined ? (muted ? 1 : 0) : user.muted ? 1 : 0;
  let nextDeaf = deafened !== undefined ? (deafened ? 1 : 0) : user.deafened ? 1 : 0;
  if (nextDeaf) {
    // deaf implies mute visually
  }
  db.prepare("UPDATE web_users SET muted = ?, deafened = ?, last_seen = ? WHERE id = ?").run(
    nextMuted,
    nextDeaf,
    now(),
    userId,
  );
  return getUserById(userId);
}

export function voiceRoster() {
  return db
    .prepare(
      `SELECT id, name, color, voice_channel_id AS voiceChannelId, muted, deafened, status
       FROM web_users
       WHERE voice_channel_id IS NOT NULL AND last_seen > ?`,
    )
    .all(now() - 120_000)
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      voiceChannelId: r.voiceChannelId,
      muted: Boolean(r.muted),
      deafened: Boolean(r.deafened),
      status: r.status || "online",
    }));
}

export function channelsForGuild(guildId) {
  return WEB_CHANNELS.filter((c) => c.guildId === guildId);
}
