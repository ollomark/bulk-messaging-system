import db from "../database/db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS reaction_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    emoji_key TEXT NOT NULL,
    emoji_raw TEXT NOT NULL,
    role_id TEXT NOT NULL,
    UNIQUE(message_id, emoji_key)
  );
`);

export function normalizeEmojiInput(input, guild) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  const custom = raw.match(/^<a?:([\w~]+):(\d+)>$/);
  if (custom) {
    return {
      emojiKey: custom[2],
      emojiRaw: raw,
      reactValue: custom[2],
      display: raw,
    };
  }

  // Sadece custom emoji id verilmişse
  if (/^\d{15,22}$/.test(raw)) {
    const emoji = guild.emojis.cache.get(raw);
    if (!emoji) return null;
    const formatted = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
    return {
      emojiKey: emoji.id,
      emojiRaw: formatted,
      reactValue: emoji.id,
      display: formatted,
    };
  }

  // Unicode / varsayılan emoji
  return {
    emojiKey: raw,
    emojiRaw: raw,
    reactValue: raw,
    display: raw,
  };
}

export function emojiKeyFromReaction(reaction) {
  return reaction.emoji.id || reaction.emoji.name;
}

export function addReactionRole({ guildId, channelId, messageId, emojiKey, emojiRaw, roleId }) {
  db.prepare(
    `INSERT INTO reaction_roles (guild_id, channel_id, message_id, emoji_key, emoji_raw, role_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(message_id, emoji_key)
     DO UPDATE SET role_id = excluded.role_id, emoji_raw = excluded.emoji_raw, channel_id = excluded.channel_id`,
  ).run(guildId, channelId, messageId, emojiKey, emojiRaw, roleId);
}

export function removeReactionRole(messageId, emojiKey) {
  const result = db
    .prepare("DELETE FROM reaction_roles WHERE message_id = ? AND emoji_key = ?")
    .run(messageId, emojiKey);
  return result.changes > 0;
}

export function getReactionRole(messageId, emojiKey) {
  return db
    .prepare("SELECT * FROM reaction_roles WHERE message_id = ? AND emoji_key = ?")
    .get(messageId, emojiKey);
}

export function listReactionRoles(guildId) {
  return db
    .prepare(
      `SELECT * FROM reaction_roles WHERE guild_id = ?
       ORDER BY message_id, id`,
    )
    .all(guildId);
}

export function listByMessage(messageId) {
  return db.prepare("SELECT * FROM reaction_roles WHERE message_id = ?").all(messageId);
}

export function getLatestPanel(guildId, channelId = null) {
  if (channelId) {
    return db
      .prepare(
        `SELECT * FROM reaction_roles
         WHERE guild_id = ? AND channel_id = ?
         ORDER BY id DESC LIMIT 1`,
      )
      .get(guildId, channelId);
  }
  return db
    .prepare(
      `SELECT * FROM reaction_roles
       WHERE guild_id = ?
       ORDER BY id DESC LIMIT 1`,
    )
    .get(guildId);
}

/** Mesaj ID veya Discord mesaj linkinden ID çıkarır */
export function parseMessageId(input) {
  if (!input) return null;
  const raw = String(input).trim();
  const link = raw.match(/channels\/\d+\/\d+\/(\d{15,22})/);
  if (link) return link[1];
  if (/^\d{15,22}$/.test(raw)) return raw;
  return null;
}

export function buildPanelDescription(rows) {
  if (!rows.length) {
    return "Bu mesaja tepki eklenince roller burada listelenecek.";
  }
  return rows.map((row) => `${row.emoji_raw} → <@&${row.role_id}>`).join("\n");
}
