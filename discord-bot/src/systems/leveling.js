import db from "../database/db.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { brand, brandFooter, premiumEmbed, progressBar } from "../utils/brand.js";

const cooldowns = new Map();

/** SORGUTR sohbet-i-muhabbet — varsayılan XP / seviye kanalı */
const DEFAULT_LEVEL_CHANNEL_ID = "1538505806738104461";

export function xpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

function resolveLevelChannelId(settings) {
  return (
    process.env.LEVEL_CHANNEL_ID ||
    settings.level_channel_id ||
    DEFAULT_LEVEL_CHANNEL_ID
  );
}

export function getLevelRow(guildId, userId) {
  let row = db
    .prepare("SELECT * FROM levels WHERE guild_id = ? AND user_id = ?")
    .get(guildId, userId);
  if (!row) {
    db.prepare(
      "INSERT INTO levels (guild_id, user_id, xp, level, total_messages) VALUES (?, ?, 0, 0, 0)",
    ).run(guildId, userId);
    row = db
      .prepare("SELECT * FROM levels WHERE guild_id = ? AND user_id = ?")
      .get(guildId, userId);
  }
  return row;
}

export function buildRankEmbed(user, row) {
  const needed = xpForLevel(row.level + 1);
  const ratio = needed > 0 ? row.xp / needed : 0;
  const bar = progressBar(ratio, 14);
  const pct = Math.floor(ratio * 100);

  return premiumEmbed({
    title: "✦ Seviye Kartı",
    description: [
      `**${user.username}**`,
      "",
      `Seviye **${row.level}**`,
      `\`${bar}\` **${pct}%**`,
      `XP · **${row.xp}** / **${needed}**`,
      `Mesaj · **${row.total_messages}**`,
    ].join("\n"),
    color: brand.colors.gold,
    thumbnail: user.displayAvatarURL({ size: 256 }),
    footer: brandFooter("level"),
  });
}

export async function handleLevelMessage(message) {
  if (!message.guild || message.author.bot) return;

  const settings = getSettings(message.guild.id);
  if (!settings.level_enabled) return;

  const levelChannelId = resolveLevelChannelId(settings);
  if (message.channel.id !== levelChannelId) return;

  if (!settings.level_channel_id || settings.level_channel_id !== levelChannelId) {
    updateSettings(message.guild.id, { level_channel_id: levelChannelId });
  }

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

  const needed = xpForLevel(level + 1);
  const embed = premiumEmbed({
    title: "🎉 Seviye Atladın!",
    description: [
      `${message.author} tebrikler — **${level}. seviye**`,
      "",
      `\`${progressBar(0, 14)}\` yeni etap`,
      `Sonraki · **${needed} XP**`,
    ].join("\n"),
    color: brand.colors.gold,
    thumbnail: message.author.displayAvatarURL({ size: 256 }),
    footer: brandFooter("level-up"),
  });

  await message.channel.send({ embeds: [embed] }).catch(() => null);
}

export function getLeaderboard(guildId, limit = 10) {
  return db
    .prepare(
      `SELECT * FROM levels WHERE guild_id = ?
       ORDER BY level DESC, xp DESC LIMIT ?`,
    )
    .all(guildId, limit);
}

export function getLeaderboardRank(guildId, userId) {
  const rows = db
    .prepare(
      `SELECT user_id FROM levels WHERE guild_id = ?
       ORDER BY level DESC, xp DESC`,
    )
    .all(guildId);
  const idx = rows.findIndex((r) => r.user_id === userId);
  return idx === -1 ? null : idx + 1;
}
