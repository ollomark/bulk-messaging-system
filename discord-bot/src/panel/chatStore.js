import crypto from "node:crypto";
import bcrypt from "bcryptjs";
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

  CREATE TABLE IF NOT EXISTS web_guilds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short TEXT NOT NULL,
    color TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    boost_level INTEGER NOT NULL DEFAULT 0,
    boost_count INTEGER NOT NULL DEFAULT 0,
    banner TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS web_guild_channels (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'SOHBET',
    type TEXT NOT NULL DEFAULT 'text',
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (guild_id) REFERENCES web_guilds(id)
  );

  CREATE TABLE IF NOT EXISTS web_guild_members (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS web_invites (
    code TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (guild_id) REFERENCES web_guilds(id)
  );

  CREATE TABLE IF NOT EXISTS web_boosts (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS web_friends (
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS web_blocks (
    user_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, blocked_id)
  );

  CREATE TABLE IF NOT EXISTS web_notes (
    owner_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (owner_id, target_id)
  );

  CREATE TABLE IF NOT EXISTS web_mutes (
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    until_at INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, target_type, target_id)
  );

  CREATE TABLE IF NOT EXISTS web_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS web_channel_settings (
    channel_id TEXT PRIMARY KEY,
    slowmode INTEGER NOT NULL DEFAULT 0,
    nsfw INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS web_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'TRY',
    status TEXT NOT NULL,
    meta TEXT,
    created_at INTEGER NOT NULL,
    paid_at INTEGER
  );
`);

for (const [col, type] of [
  ["nitro_tier", "TEXT"],
  ["banner", "TEXT"],
  ["badge", "TEXT"],
  ["accent", "TEXT"],
  ["activity", "TEXT"],
  ["username", "TEXT"],
  ["password_hash", "TEXT"],
  ["nitro_expires_at", "INTEGER"],
]) {
  if (!userCols.includes(col)) {
    db.exec(`ALTER TABLE web_users ADD COLUMN ${col} ${type}`);
  }
}

try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_web_users_username ON web_users(username) WHERE username IS NOT NULL`);
} catch {
  /* index may already exist */
}

export const NITRO_PLANS = {
  classic: {
    id: "nitro_classic_month",
    tier: "classic",
    label: "XZON Nitro Classic",
    price: 49,
    currency: "TRY",
    days: 30,
    perks: ["Rozet", "Klasik banner", "1 sunucu boost"],
  },
  full: {
    id: "nitro_full_month",
    tier: "full",
    label: "XZON Nitro",
    price: 99,
    currency: "TRY",
    days: 30,
    perks: ["Aurora banner", "2 sunucu boost", "Özel accent", "Profil animasyonu"],
  },
};

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

function effectiveNitroTier(row) {
  const tier = row.nitro_tier || "none";
  if (tier === "none") return "none";
  if (row.nitro_expires_at && row.nitro_expires_at < Date.now()) {
    db.prepare(
      `UPDATE web_users SET nitro_tier = 'none', badge = '', banner = '' WHERE id = ?`,
    ).run(row.id);
    return "none";
  }
  return tier;
}

function mapUser(row) {
  if (!row) return null;
  const nitroTier = effectiveNitroTier(row);
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
    nitroTier,
    banner: nitroTier === "none" ? "" : row.banner || "",
    badge: nitroTier === "none" ? "" : row.badge || "",
    accent: row.accent || row.color,
    activity: row.activity || "",
    username: row.username || null,
    hasPassword: Boolean(row.password_hash),
    nitroExpiresAt: nitroTier === "none" ? null : row.nitro_expires_at || null,
    isGuest: !row.username,
  };
}

function shortFromName(name) {
  const clean = String(name || "")
    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ ]/g, "")
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return clean.slice(0, 2).toUpperCase() || "SV";
}

function inviteCode() {
  return crypto.randomBytes(4).toString("hex");
}

function mapGuild(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    short: row.short,
    color: row.color,
    ownerId: row.owner_id || null,
    boostLevel: row.boost_level || 0,
    boostCount: row.boost_count || 0,
    banner: row.banner || "",
    custom: !GUILDS.some((g) => g.id === row.id),
  };
}

function channelSettings(channelId) {
  return (
    db.prepare("SELECT * FROM web_channel_settings WHERE channel_id = ?").get(channelId) || {
      channel_id: channelId,
      slowmode: 0,
      nsfw: 0,
    }
  );
}

function mapChannel(row) {
  const settings = channelSettings(row.id || row.channel_id);
  return {
    id: row.id,
    guildId: row.guild_id,
    name: row.name,
    topic: row.topic || "",
    category: row.category || "SOHBET",
    type: row.type || "text",
    custom: true,
    slowmode: settings.slowmode || 0,
    nsfw: Boolean(settings.nsfw),
  };
}

function customGuildRows() {
  return db.prepare("SELECT * FROM web_guilds ORDER BY created_at ASC").all();
}

function customChannelRows(guildId = null) {
  if (guildId) {
    return db
      .prepare(
        `SELECT * FROM web_guild_channels WHERE guild_id = ? ORDER BY position ASC, created_at ASC`,
      )
      .all(guildId);
  }
  return db
    .prepare("SELECT * FROM web_guild_channels ORDER BY position ASC, created_at ASC")
    .all();
}

function isStaticGuild(guildId) {
  return GUILDS.some((g) => g.id === guildId);
}

export function userInGuild(userId, guildId) {
  if (!guildId || guildId === "dm") return false;
  if (isStaticGuild(guildId)) return true;
  return Boolean(
    db
      .prepare("SELECT 1 FROM web_guild_members WHERE guild_id = ? AND user_id = ?")
      .get(guildId, userId),
  );
}

export function listGuildsForUser(userId) {
  const customs = customGuildRows()
    .filter((g) => userInGuild(userId, g.id))
    .map(mapGuild);
  return [
    ...GUILDS.map((g) => ({
      ...g,
      ownerId: null,
      boostLevel: 3,
      boostCount: 14,
      banner: "",
      custom: false,
    })),
    ...customs,
  ];
}

function enrichStaticChannel(ch) {
  const settings = channelSettings(ch.id);
  return {
    ...ch,
    custom: false,
    slowmode: settings.slowmode || 0,
    nsfw: Boolean(settings.nsfw),
  };
}

export function listChannelsForUser(userId) {
  const customGuildIds = new Set(
    customGuildRows().filter((g) => userInGuild(userId, g.id)).map((g) => g.id),
  );
  const customs = customChannelRows()
    .filter((c) => customGuildIds.has(c.guild_id))
    .map(mapChannel);
  return [...WEB_CHANNELS.map(enrichStaticChannel), ...customs];
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

function issueSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  const created = now();
  const expires = created + 30 * 24 * 60 * 60 * 1000;
  db.prepare(
    "INSERT INTO web_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(token, userId, created, expires);
  db.prepare("UPDATE web_users SET last_seen = ? WHERE id = ?").run(created, userId);
  return { token, user: getUserById(userId) };
}

function normalizeUsername(raw) {
  const username = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\.]/g, "")
    .slice(0, 24);
  if (username.length < 3) throw new Error("Kullanıcı adı en az 3 karakter olmalı");
  if (!/^[a-z]/.test(username)) throw new Error("Kullanıcı adı harfle başlamalı");
  return username;
}

function normalizeDisplayName(raw) {
  const name = String(raw || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
  if (name.length < 2) throw new Error("Görünen ad en az 2 karakter olmalı");
  if (/[@#:`*]/.test(name)) throw new Error("Görünen adda geçersiz karakter var");
  return name;
}

function normalizePassword(raw) {
  const password = String(raw || "");
  if (password.length < 6) throw new Error("Şifre en az 6 karakter olmalı");
  if (password.length > 72) throw new Error("Şifre çok uzun");
  return password;
}

/** Guest join — limited account without password */
export function createWebSession(rawName) {
  const name = normalizeDisplayName(rawName);
  const id = crypto.randomUUID();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const created = now();
  const tag = makeTag();

  db.prepare(
    `INSERT INTO web_users
      (id, name, color, created_at, last_seen, tag, bio, status, custom_status, muted, deafened)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'online', '', 0, 0)`,
  ).run(id, name, color, created, created, tag, "XZON misafir");

  return issueSession(id);
}

export function registerAccount({ username, password, displayName }) {
  const user = normalizeUsername(username);
  const pass = normalizePassword(password);
  const name = normalizeDisplayName(displayName || username);
  const exists = db.prepare("SELECT id FROM web_users WHERE username = ?").get(user);
  if (exists) throw new Error("Bu kullanıcı adı alınmış");

  const id = crypto.randomUUID();
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const created = now();
  const tag = makeTag();
  const hash = bcrypt.hashSync(pass, 10);

  db.prepare(
    `INSERT INTO web_users
      (id, name, color, created_at, last_seen, tag, bio, status, custom_status, muted, deafened,
       username, password_hash, nitro_tier)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'online', '', 0, 0, ?, ?, 'none')`,
  ).run(id, name, color, created, created, tag, "XZON üyesi", user, hash);

  return issueSession(id);
}

export function loginAccount({ username, password }) {
  const user = normalizeUsername(username);
  const pass = normalizePassword(password);
  const row = db.prepare("SELECT * FROM web_users WHERE username = ?").get(user);
  if (!row?.password_hash) throw new Error("Hesap bulunamadı");
  if (!bcrypt.compareSync(pass, row.password_hash)) throw new Error("Şifre hatalı");
  return issueSession(row.id);
}

export function upgradeGuestToAccount(userId, { username, password, displayName }) {
  const current = db.prepare("SELECT * FROM web_users WHERE id = ?").get(userId);
  if (!current) throw new Error("Oturum yok");
  if (current.username) throw new Error("Zaten hesaplısın");
  const user = normalizeUsername(username);
  const pass = normalizePassword(password);
  const name = displayName ? normalizeDisplayName(displayName) : current.name;
  if (db.prepare("SELECT id FROM web_users WHERE username = ?").get(user)) {
    throw new Error("Bu kullanıcı adı alınmış");
  }
  const hash = bcrypt.hashSync(pass, 10);
  db.prepare(
    `UPDATE web_users
     SET username = ?, password_hash = ?, name = ?, bio = ?, last_seen = ?
     WHERE id = ?`,
  ).run(user, hash, name, "XZON üyesi", now(), userId);
  return getUserById(userId);
}

export function changePassword(userId, { currentPassword, newPassword }) {
  const row = db.prepare("SELECT * FROM web_users WHERE id = ?").get(userId);
  if (!row?.password_hash) throw new Error("Misafir hesapta şifre yok — önce hesap oluştur");
  if (!bcrypt.compareSync(String(currentPassword || ""), row.password_hash)) {
    throw new Error("Mevcut şifre hatalı");
  }
  const hash = bcrypt.hashSync(normalizePassword(newPassword), 10);
  db.prepare("UPDATE web_users SET password_hash = ?, last_seen = ? WHERE id = ?").run(
    hash,
    now(),
    userId,
  );
  return { ok: true };
}

export function listOrders(userId) {
  return db
    .prepare(
      `SELECT id, product, amount, currency, status, created_at AS createdAt, paid_at AS paidAt
       FROM web_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 40`,
    )
    .all(userId);
}

export function purchaseNitro(userId, tier, { cardLast4 } = {}) {
  const user = getUserById(userId);
  if (!user) throw new Error("Kullanıcı yok");
  if (user.isGuest) throw new Error("Nitro için hesap oluşturmalısın");
  const plan = NITRO_PLANS[tier];
  if (!plan) throw new Error("Geçersiz Nitro planı");

  const orderId = crypto.randomUUID();
  const created = now();
  db.prepare(
    `INSERT INTO web_orders (id, user_id, product, amount, currency, status, meta, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
  ).run(
    orderId,
    userId,
    plan.id,
    plan.price,
    plan.currency,
    JSON.stringify({ cardLast4: String(cardLast4 || "4242").slice(-4), gateway: "xzon_demo_pay" }),
    created,
  );

  // Demo ödeme ağ geçidi — gerçek banka/Stripe yok; sipariş ücretli kaydedilir
  const paidAt = now();
  db.prepare(
    `UPDATE web_orders SET status = 'paid', paid_at = ? WHERE id = ?`,
  ).run(paidAt, orderId);

  const row = db.prepare("SELECT nitro_expires_at AS exp FROM web_users WHERE id = ?").get(userId);
  const base = Math.max(row?.exp || 0, paidAt);
  const expires = base + plan.days * 24 * 60 * 60 * 1000;
  const badge = plan.tier === "full" ? "NITRO" : "CLASSIC";
  const banner = plan.tier === "full" ? "aurora" : "classic";
  db.prepare(
    `UPDATE web_users
     SET nitro_tier = ?, nitro_expires_at = ?, badge = ?, banner = ?, last_seen = ?
     WHERE id = ?`,
  ).run(plan.tier, expires, badge, banner, paidAt, userId);

  return {
    order: {
      id: orderId,
      product: plan.id,
      amount: plan.price,
      currency: plan.currency,
      status: "paid",
      paidAt,
    },
    user: getUserById(userId),
    plan,
  };
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

  // Nitro tier only changes via paid purchase — ignore client nitroTier patches
  const nitroTier = user.nitroTier || "none";
  const banner = user.banner || "";
  const badge = user.badge || "";
  const accent =
    patch.accent !== undefined ? String(patch.accent).slice(0, 32) : user.accent || user.color;
  const activity =
    patch.activity !== undefined ? String(patch.activity).slice(0, 80) : user.activity || "";

  db.prepare(
    `UPDATE web_users
     SET name = ?, bio = ?, status = ?, custom_status = ?, last_seen = ?,
         nitro_tier = ?, banner = ?, badge = ?, accent = ?, activity = ?
     WHERE id = ?`,
  ).run(name, bio, status, customStatus, now(), nitroTier, banner, badge, accent, activity, userId);

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
  return Boolean(
    db.prepare("SELECT id FROM web_guild_channels WHERE id = ?").get(channelId),
  );
}

export function getChannelMeta(channelId) {
  const ch = WEB_CHANNELS.find((c) => c.id === channelId);
  if (ch) return enrichStaticChannel(ch);
  const custom = db.prepare("SELECT * FROM web_guild_channels WHERE id = ?").get(channelId);
  if (custom) return mapChannel(custom);
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

export function listMentions(userId, limit = 30) {
  const user = getUserById(userId);
  if (!user) return [];
  const channels = listChannelsForUser(userId)
    .filter((c) => c.type === "text")
    .map((c) => c.id);
  const dmIds = db
    .prepare("SELECT channel_id AS id FROM web_dm_peers WHERE user_a = ? OR user_b = ?")
    .all(userId, userId)
    .map((r) => r.id);
  const all = [...new Set([...channels, ...dmIds])];
  if (!all.length) return [];
  const placeholders = all.map(() => "?").join(",");
  const needle = `%@${user.name}%`;
  const rows = db
    .prepare(
      `SELECT * FROM web_messages
       WHERE deleted = 0 AND channel_id IN (${placeholders})
         AND content LIKE ? AND user_id != ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(...all, needle, userId, Math.min(Math.max(limit, 1), 50));
  return hydrateMessages(rows, userId);
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

export function isBlockedEither(a, b) {
  return Boolean(
    db
      .prepare(
        `SELECT 1 FROM web_blocks
         WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)`,
      )
      .get(a, b, b, a),
  );
}

export function postMessage(user, channelId, content, { replyToId = null } = {}) {
  const meta = getChannelMeta(channelId);
  if (!meta) throw new Error("Kanal bulunamadı");

  if (meta.type === "dm") {
    if (user.id !== meta.userA && user.id !== meta.userB) {
      throw new Error("Bu DM'ye erişimin yok");
    }
    const peer = meta.userA === user.id ? meta.userB : meta.userA;
    if (isBlockedEither(user.id, peer)) throw new Error("Bu kullanıcıyla mesajlaşamazsın");
  }

  assertRateLimit(user.id);

  const slow = Number(meta.slowmode || 0);
  if (slow > 0) {
    const last = db
      .prepare(
        `SELECT created_at AS at FROM web_messages
         WHERE channel_id = ? AND user_id = ? AND deleted = 0
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(channelId, user.id);
    if (last && now() - last.at < slow * 1000) {
      const left = Math.ceil((slow * 1000 - (now() - last.at)) / 1000);
      throw new Error(`Yavaş mod: ${left}sn bekle`);
    }
  }

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
  const clean = String(emoji || "")
    .trim()
    .slice(0, 32)
    .replace(/[^a-zA-Z0-9_:\-]/g, "");
  if (!clean) throw new Error("Tepki gerekli");
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
    ...listChannelsForUser(userId)
      .filter((c) => c.type === "text")
      .map((c) => c.id),
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
  return [
    ...WEB_CHANNELS.filter((c) => c.guildId === guildId),
    ...customChannelRows(guildId).map(mapChannel),
  ];
}

export function createGuild(ownerId, { name, color } = {}) {
  const clean = String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
  if (clean.length < 2) throw new Error("Sunucu adı en az 2 karakter olmalı");
  const id = `g_${crypto.randomBytes(6).toString("hex")}`;
  const short = shortFromName(clean);
  const tint = String(color || COLORS[Math.floor(Math.random() * COLORS.length)]).slice(0, 32);
  const created = now();

  db.prepare(
    `INSERT INTO web_guilds (id, name, short, color, owner_id, boost_level, boost_count, banner, created_at)
     VALUES (?, ?, ?, ?, ?, 0, 0, '', ?)`,
  ).run(id, clean, short, tint, ownerId, created);

  db.prepare(
    `INSERT INTO web_guild_members (guild_id, user_id, role, joined_at) VALUES (?, ?, 'owner', ?)`,
  ).run(id, ownerId, created);

  const defaults = [
    ["duyurular", "Resmi duyurular", "BİLGİ", "text", 0],
    ["kurallar", "Sunucu kuralları", "BİLGİ", "text", 1],
    ["genel", "Ana sohbet kanalı", "SOHBET", "text", 2],
    ["sohbet", "Gündelik muhabbet", "SOHBET", "text", 3],
    ["Lobby", "Sesli lobi", "SESLİ", "voice", 4],
    ["Gaming", "Oyun sesi", "SESLİ", "voice", 5],
  ];
  const insertCh = db.prepare(
    `INSERT INTO web_guild_channels
      (id, guild_id, name, topic, category, type, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const [chName, topic, category, type, position] of defaults) {
    const chId = `${id}:${chName.toLowerCase().replace(/\s+/g, "-")}`;
    insertCh.run(chId, id, chName, topic, category, type, position, created);
  }

  const code = inviteCode();
  db.prepare(
    `INSERT INTO web_invites (code, guild_id, creator_id, uses, max_uses, created_at)
     VALUES (?, ?, ?, 0, 0, ?)`,
  ).run(code, id, ownerId, created);

  const guild = mapGuild(db.prepare("SELECT * FROM web_guilds WHERE id = ?").get(id));
  return {
    guild,
    channels: channelsForGuild(id),
    invite: code,
  };
}

export function createInvite(userId, guildId) {
  if (!userInGuild(userId, guildId)) throw new Error("Bu sunucuda değilsin");
  if (isStaticGuild(guildId)) {
    const code = `xzon-${guildId}`;
    return { code, guildId };
  }
  const code = inviteCode();
  db.prepare(
    `INSERT INTO web_invites (code, guild_id, creator_id, uses, max_uses, created_at)
     VALUES (?, ?, ?, 0, 0, ?)`,
  ).run(code, guildId, userId, now());
  return { code, guildId };
}

export function joinByInvite(userId, rawCode) {
  const code = String(rawCode || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^invite\//, "");
  if (!code) throw new Error("Davet kodu gerekli");

  if (code.startsWith("xzon-")) {
    const guildId = code.slice(5);
    if (!isStaticGuild(guildId)) throw new Error("Geçersiz davet");
    const guild = listGuildsForUser(userId).find((g) => g.id === guildId);
    return { guild, channels: channelsForGuild(guildId), invite: code };
  }

  const invite = db.prepare("SELECT * FROM web_invites WHERE lower(code) = ?").get(code);
  if (!invite) throw new Error("Davet bulunamadı");
  if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
    throw new Error("Davet limiti dolmuş");
  }

  const existing = db
    .prepare("SELECT 1 FROM web_guild_members WHERE guild_id = ? AND user_id = ?")
    .get(invite.guild_id, userId);
  if (!existing) {
    db.prepare(
      `INSERT INTO web_guild_members (guild_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)`,
    ).run(invite.guild_id, userId, now());
  }
  db.prepare("UPDATE web_invites SET uses = uses + 1 WHERE code = ?").run(invite.code);

  const guild = mapGuild(db.prepare("SELECT * FROM web_guilds WHERE id = ?").get(invite.guild_id));
  return {
    guild,
    channels: channelsForGuild(invite.guild_id),
    invite: invite.code,
  };
}

export function createChannel(userId, guildId, { name, type = "text", topic = "", category } = {}) {
  if (!userInGuild(userId, guildId)) throw new Error("Bu sunucuda değilsin");
  if (isStaticGuild(guildId)) throw new Error("Varsayılan sunucularda kanal açılamaz");
  const member = db
    .prepare("SELECT role FROM web_guild_members WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId);
  if (!member || !["owner", "admin"].includes(member.role)) {
    throw new Error("Kanal oluşturmak için yetkin yok");
  }
  const clean = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ğüşıöç\-]/gi, "")
    .slice(0, 32);
  if (clean.length < 2) throw new Error("Kanal adı geçersiz");
  const chType = type === "voice" ? "voice" : "text";
  const id = `${guildId}:${clean}-${crypto.randomBytes(2).toString("hex")}`;
  const cat = category || (chType === "voice" ? "SESLİ" : "SOHBET");
  const pos =
    db.prepare("SELECT COUNT(*) AS c FROM web_guild_channels WHERE guild_id = ?").get(guildId).c;
  db.prepare(
    `INSERT INTO web_guild_channels
      (id, guild_id, name, topic, category, type, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, guildId, clean, String(topic || "").slice(0, 120), cat, chType, pos, now());
  return getChannelMeta(id);
}

export function boostGuild(userId, guildId) {
  const user = assertNitroActive(userId);
  if (!user) throw new Error("Kullanıcı yok");
  if (!userInGuild(userId, guildId)) throw new Error("Bu sunucuda değilsin");
  if (isStaticGuild(guildId)) {
    return { guild: listGuildsForUser(userId).find((g) => g.id === guildId), boosted: true };
  }
  const already = db
    .prepare("SELECT 1 FROM web_boosts WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId);
  if (!already) {
    db.prepare("INSERT INTO web_boosts (guild_id, user_id, created_at) VALUES (?, ?, ?)").run(
      guildId,
      userId,
      now(),
    );
  }
  const count = db.prepare("SELECT COUNT(*) AS c FROM web_boosts WHERE guild_id = ?").get(guildId).c;
  const level = count >= 14 ? 3 : count >= 7 ? 2 : count >= 1 ? 1 : 0;
  db.prepare("UPDATE web_guilds SET boost_count = ?, boost_level = ? WHERE id = ?").run(
    count,
    level,
    guildId,
  );
  return {
    guild: mapGuild(db.prepare("SELECT * FROM web_guilds WHERE id = ?").get(guildId)),
    boosted: true,
  };
}

export function activateNitro(_userId, _tier = "full") {
  throw new Error("Nitro artık ücretli — Ödeme ile satın al");
}

export function assertNitroActive(userId) {
  const user = getUserById(userId);
  if (!user || user.nitroTier === "none") throw new Error("Aktif Nitro gerekli");
  return user;
}

export function sendFriendRequest(fromId, toId) {
  if (fromId === toId) throw new Error("Kendine istek atılamaz");
  const peer = getUserById(toId);
  if (!peer || toId === "system") throw new Error("Kullanıcı yok");
  if (isBlockedEither(fromId, toId)) throw new Error("Engelli kullanıcı");
  const existing = db
    .prepare("SELECT status FROM web_friends WHERE user_id = ? AND friend_id = ?")
    .get(fromId, toId);
  if (existing?.status === "accepted") throw new Error("Zaten arkadaşsınız");
  const reverse = db
    .prepare("SELECT status FROM web_friends WHERE user_id = ? AND friend_id = ?")
    .get(toId, fromId);
  if (reverse?.status === "pending") {
    db.prepare("UPDATE web_friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?").run(
      toId,
      fromId,
    );
    db.prepare(
      `INSERT INTO web_friends (user_id, friend_id, status, created_at)
       VALUES (?, ?, 'accepted', ?)
       ON CONFLICT(user_id, friend_id) DO UPDATE SET status = 'accepted'`,
    ).run(fromId, toId, now());
    return { status: "accepted", user: peer };
  }
  db.prepare(
    `INSERT INTO web_friends (user_id, friend_id, status, created_at)
     VALUES (?, ?, 'pending', ?)
     ON CONFLICT(user_id, friend_id) DO UPDATE SET status = 'pending', created_at = excluded.created_at`,
  ).run(fromId, toId, now());
  return { status: "pending", user: peer };
}

export function respondFriendRequest(userId, fromId, accept) {
  const row = db
    .prepare("SELECT * FROM web_friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'")
    .get(fromId, userId);
  if (!row) throw new Error("İstek bulunamadı");
  if (!accept) {
    db.prepare("DELETE FROM web_friends WHERE user_id = ? AND friend_id = ?").run(fromId, userId);
    return { status: "declined" };
  }
  db.prepare("UPDATE web_friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?").run(
    fromId,
    userId,
  );
  db.prepare(
    `INSERT INTO web_friends (user_id, friend_id, status, created_at)
     VALUES (?, ?, 'accepted', ?)
     ON CONFLICT(user_id, friend_id) DO UPDATE SET status = 'accepted'`,
  ).run(userId, fromId, now());
  return { status: "accepted", user: getUserById(fromId) };
}

export function removeFriend(userId, friendId) {
  db.prepare("DELETE FROM web_friends WHERE user_id = ? AND friend_id = ?").run(userId, friendId);
  db.prepare("DELETE FROM web_friends WHERE user_id = ? AND friend_id = ?").run(friendId, userId);
  return { ok: true };
}

export function listFriends(userId) {
  const accepted = db
    .prepare(
      `SELECT friend_id AS id FROM web_friends WHERE user_id = ? AND status = 'accepted'`,
    )
    .all(userId)
    .map((r) => getUserById(r.id))
    .filter(Boolean);
  const incoming = db
    .prepare(
      `SELECT user_id AS id FROM web_friends WHERE friend_id = ? AND status = 'pending'`,
    )
    .all(userId)
    .map((r) => getUserById(r.id))
    .filter(Boolean);
  const outgoing = db
    .prepare(
      `SELECT friend_id AS id FROM web_friends WHERE user_id = ? AND status = 'pending'`,
    )
    .all(userId)
    .map((r) => getUserById(r.id))
    .filter(Boolean);
  return { friends: accepted, incoming, outgoing };
}

export function blockUser(userId, targetId) {
  if (userId === targetId) throw new Error("Kendini engelleyemezsin");
  if (!getUserById(targetId)) throw new Error("Kullanıcı yok");
  db.prepare(
    `INSERT INTO web_blocks (user_id, blocked_id, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, blocked_id) DO NOTHING`,
  ).run(userId, targetId, now());
  removeFriend(userId, targetId);
  return { ok: true };
}

export function unblockUser(userId, targetId) {
  db.prepare("DELETE FROM web_blocks WHERE user_id = ? AND blocked_id = ?").run(userId, targetId);
  return { ok: true };
}

export function listBlocks(userId) {
  return db
    .prepare("SELECT blocked_id AS id FROM web_blocks WHERE user_id = ?")
    .all(userId)
    .map((r) => getUserById(r.id))
    .filter(Boolean);
}

export function setNote(ownerId, targetId, note) {
  const text = String(note || "").trim().slice(0, 240);
  if (!text) {
    db.prepare("DELETE FROM web_notes WHERE owner_id = ? AND target_id = ?").run(ownerId, targetId);
    return { note: "" };
  }
  db.prepare(
    `INSERT INTO web_notes (owner_id, target_id, note, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(owner_id, target_id) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at`,
  ).run(ownerId, targetId, text, now());
  return { note: text };
}

export function getNote(ownerId, targetId) {
  const row = db
    .prepare("SELECT note FROM web_notes WHERE owner_id = ? AND target_id = ?")
    .get(ownerId, targetId);
  return row?.note || "";
}

export function toggleMute(userId, targetType, targetId) {
  if (!["channel", "guild"].includes(targetType)) throw new Error("Geçersiz hedef");
  const existing = db
    .prepare(
      "SELECT 1 FROM web_mutes WHERE user_id = ? AND target_type = ? AND target_id = ?",
    )
    .get(userId, targetType, targetId);
  if (existing) {
    db.prepare(
      "DELETE FROM web_mutes WHERE user_id = ? AND target_type = ? AND target_id = ?",
    ).run(userId, targetType, targetId);
    return { muted: false };
  }
  db.prepare(
    `INSERT INTO web_mutes (user_id, target_type, target_id, until_at, created_at)
     VALUES (?, ?, ?, 0, ?)`,
  ).run(userId, targetType, targetId, now());
  return { muted: true };
}

export function listMutes(userId) {
  return db
    .prepare(
      `SELECT target_type AS targetType, target_id AS targetId, until_at AS untilAt
       FROM web_mutes WHERE user_id = ?`,
    )
    .all(userId);
}

export function isMuted(userId, channelId, guildId = null) {
  const ch = db
    .prepare(
      `SELECT 1 FROM web_mutes WHERE user_id = ? AND target_type = 'channel' AND target_id = ?`,
    )
    .get(userId, channelId);
  if (ch) return true;
  if (guildId) {
    return Boolean(
      db
        .prepare(
          `SELECT 1 FROM web_mutes WHERE user_id = ? AND target_type = 'guild' AND target_id = ?`,
        )
        .get(userId, guildId),
    );
  }
  return false;
}

export function reportMessage(reporterId, messageId, reason) {
  const row = db.prepare("SELECT id FROM web_messages WHERE id = ?").get(messageId);
  if (!row) throw new Error("Mesaj yok");
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO web_reports (id, reporter_id, message_id, reason, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, reporterId, messageId, String(reason || "Uygunsuz").slice(0, 200), now());
  return { id, ok: true };
}

export function setChannelSettings(userId, channelId, { slowmode, nsfw } = {}) {
  const meta = getChannelMeta(channelId);
  if (!meta || meta.type === "dm") throw new Error("Kanal yok");
  if (meta.custom) {
    const member = db
      .prepare("SELECT role FROM web_guild_members WHERE guild_id = ? AND user_id = ?")
      .get(meta.guildId, userId);
    if (!member || !["owner", "admin"].includes(member.role)) {
      throw new Error("Yetkin yok");
    }
  }
  const prev = channelSettings(channelId);
  const nextSlow =
    slowmode !== undefined ? Math.min(120, Math.max(0, Number(slowmode) || 0)) : prev.slowmode;
  const nextNsfw = nsfw !== undefined ? (nsfw ? 1 : 0) : prev.nsfw ? 1 : 0;
  db.prepare(
    `INSERT INTO web_channel_settings (channel_id, slowmode, nsfw)
     VALUES (?, ?, ?)
     ON CONFLICT(channel_id) DO UPDATE SET slowmode = excluded.slowmode, nsfw = excluded.nsfw`,
  ).run(channelId, nextSlow, nextNsfw);
  return getChannelMeta(channelId);
}

export function markAllRead(userId) {
  const channels = listChannelsForUser(userId)
    .filter((c) => c.type === "text")
    .map((c) => c.id);
  const dms = db
    .prepare("SELECT channel_id AS id FROM web_dm_peers WHERE user_a = ? OR user_b = ?")
    .all(userId, userId)
    .map((r) => r.id);
  const at = now();
  for (const id of [...new Set([...channels, ...dms])]) markRead(userId, id, at);
  return getUnreadMap(userId);
}

export function forwardMessage(userId, messageId, toChannelId) {
  const row = db.prepare("SELECT * FROM web_messages WHERE id = ? AND deleted = 0").get(messageId);
  if (!row) throw new Error("Mesaj yok");
  const user = getUserById(userId);
  const content = `↪ ${row.user_name}: ${row.content}`.slice(0, 1800);
  return postMessage(user, toChannelId, content);
}

export function discoverGuilds(userId) {
  const mine = new Set(listGuildsForUser(userId).map((g) => g.id));
  const publicStatic = GUILDS.filter((g) => !mine.has(g.id)).map((g) => ({
    ...g,
    custom: false,
    memberCount: listOnlineUsers().length,
    invite: `xzon-${g.id}`,
  }));
  const customs = customGuildRows()
    .filter((g) => !mine.has(g.id))
    .slice(0, 30)
    .map((g) => {
      const mapped = mapGuild(g);
      const invite = db
        .prepare("SELECT code FROM web_invites WHERE guild_id = ? ORDER BY created_at DESC LIMIT 1")
        .get(g.id);
      const members = db
        .prepare("SELECT COUNT(*) AS c FROM web_guild_members WHERE guild_id = ?")
        .get(g.id).c;
      return { ...mapped, memberCount: members, invite: invite?.code || null };
    })
    .filter((g) => g.invite);
  return [...publicStatic, ...customs];
}

export function searchUsers(query, limit = 20) {
  const q = `%${String(query || "").trim().slice(0, 40)}%`;
  if (q === "%%") return [];
  return db
    .prepare(
      `SELECT * FROM web_users
       WHERE id != 'system' AND name LIKE ?
       ORDER BY last_seen DESC LIMIT ?`,
    )
    .all(q, Math.min(Math.max(limit, 1), 40))
    .map(mapUser);
}

export function leaveGuild(userId, guildId) {
  if (isStaticGuild(guildId)) throw new Error("Varsayılan sunucudan çıkılamaz");
  const g = db.prepare("SELECT * FROM web_guilds WHERE id = ?").get(guildId);
  if (!g) throw new Error("Sunucu yok");
  if (g.owner_id === userId) throw new Error("Sahip sunucudan çıkamaz — önce devret");
  db.prepare("DELETE FROM web_guild_members WHERE guild_id = ? AND user_id = ?").run(
    guildId,
    userId,
  );
  return { ok: true };
}
