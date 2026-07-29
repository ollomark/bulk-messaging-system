import db from "../database/db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS afk_users (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT,
    since INTEGER NOT NULL,
    PRIMARY KEY (guild_id, user_id)
  );
`);

export function setAfk(guildId, userId, reason) {
  db.prepare(
    `INSERT INTO afk_users (guild_id, user_id, reason, since)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(guild_id, user_id) DO UPDATE SET reason = excluded.reason, since = excluded.since`,
  ).run(guildId, userId, reason || "AFK", Date.now());
}

export function getAfk(guildId, userId) {
  return db.prepare("SELECT * FROM afk_users WHERE guild_id = ? AND user_id = ?").get(guildId, userId);
}

export function clearAfk(guildId, userId) {
  const result = db.prepare("DELETE FROM afk_users WHERE guild_id = ? AND user_id = ?").run(guildId, userId);
  return result.changes > 0;
}

export async function clearAfkIfTalking(message) {
  const cleared = clearAfk(message.guild.id, message.author.id);
  if (!cleared) return;
  await message.reply({
    content: `Hoş geldin ${message.author}, AFK modun kapatıldı.`,
    allowedMentions: { users: [] },
  }).then((msg) => setTimeout(() => msg.delete().catch(() => null), 5000));
}

export async function maybeNotifyAfkMention(message) {
  if (!message.mentions.users.size) return;
  const notes = [];
  for (const user of message.mentions.users.values()) {
    if (user.bot) continue;
    const afk = getAfk(message.guild.id, user.id);
    if (afk) {
      notes.push(
        `💤 **${user.username}** AFK · ${afk.reason} · <t:${Math.floor(afk.since / 1000)}:R>`,
      );
    }
  }
  if (!notes.length) return;
  await message.reply({ content: notes.join("\n"), allowedMentions: { repliedUser: false } }).then((msg) =>
    setTimeout(() => msg.delete().catch(() => null), 8000),
  );
}
