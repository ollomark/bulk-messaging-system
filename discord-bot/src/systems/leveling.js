import db from "../database/db.js";
import { getSettings } from "../database/settings.js";
import { baseEmbed } from "../utils/embeds.js";

const cooldowns = new Map();

export function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

export function getLevelRow(guildId, userId) {
  let row = db
    .prepare("SELECT * FROM levels WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId);
  if (!row) {
    db.prepare("INSERT INTO levels (guild_id, user_id, xp, level, total_messages) VALUES (?, ?, 0, 0, 0)").run(
      guildId,
      userId,
    );
    row = db
      .prepare("SELECT * FROM levels WHERE guild_id = ? AND user_id = ?")
      .get(guildId, userId);
  }
  return row;
}

export async function handleLevelMessage(message) {
  if (!message.guild || message.author.bot) return;

  const settings = getSettings(message.guild.id);
  if (!settings.level_enabled) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  if (cooldowns.has(key) && now - cooldowns.get(key) < 45_000) return;
  cooldowns.set(key, now);

  const row = getLevelRow(message.guild.id, message.author.id);
  const gained = Math.floor(Math.random() * 11) + 15;
  let xp = row.xp + gained;
  let level = row.level;
  let leveledUp = false;

  while (xp >= xpForLevel(level + 1)) {
    xp -= xpForLevel(level + 1);
    level += 1;
    leveledUp = true;
  }

  db.prepare(
    `UPDATE levels SET xp = ?, level = ?, total_messages = total_messages + 1
     WHERE guild_id = ? AND user_id = ?`,
  ).run(xp, level, message.guild.id, message.author.id);

  if (!leveledUp) return;

  const embed = baseEmbed(
    "🎉 Seviye Atladın!",
    `${message.author} tebrikler! Artık **${level}. seviye**sin.`,
  );

  let channel = message.channel;
  if (settings.level_channel_id) {
    const configured = await message.guild.channels.fetch(settings.level_channel_id).catch(() => null);
    if (configured?.isTextBased()) channel = configured;
  }

  await channel.send({ embeds: [embed] }).catch(() => null);
}

export function getLeaderboard(guildId, limit = 10) {
  return db
    .prepare(
      `SELECT * FROM levels WHERE guild_id = ?
       ORDER BY level DESC, xp DESC LIMIT ?`,
    )
    .all(guildId, limit);
}
