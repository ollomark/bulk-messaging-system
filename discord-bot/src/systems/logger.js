import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { config } from "../config.js";

let warnedMissing = new Set();

export function ensureLogChannelFromEnv(guildId) {
  if (!process.env.LOG_CHANNEL_ID || !guildId) return;
  const settings = getSettings(guildId);
  if (!settings.log_channel_id) {
    updateSettings(guildId, { log_channel_id: process.env.LOG_CHANNEL_ID });
  } else if (settings.log_channel_id !== process.env.LOG_CHANNEL_ID) {
    // Env her zaman öncelikli (Railway kalıcılığı)
    updateSettings(guildId, { log_channel_id: process.env.LOG_CHANNEL_ID });
  }
}

export async function sendLog(guild, payload) {
  try {
    if (!guild) return;

    if (config.guildId === guild.id || process.env.LOG_CHANNEL_ID) {
      ensureLogChannelFromEnv(guild.id);
    }

    const settings = getSettings(guild.id);
    if (!settings.log_channel_id) {
      if (!warnedMissing.has(guild.id)) {
        warnedMissing.add(guild.id);
        console.warn(
          `⚠️ Log kanalı ayarlı değil (${guild.name}). /ayarlar log veya LOG_CHANNEL_ID kullan.`,
        );
      }
      return;
    }

    const channel = await guild.channels.fetch(settings.log_channel_id).catch(() => null);
    if (!channel?.isTextBased()) {
      console.warn(`⚠️ Log kanalı bulunamadı: ${settings.log_channel_id}`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(payload.color ?? config.embedColor)
      .setTitle(payload.title)
      .setTimestamp();

    if (payload.description) embed.setDescription(payload.description);
    if (payload.fields?.length) {
      embed.addFields(
        payload.fields.map((field) => ({
          name: String(field.name).slice(0, 256),
          value: String(field.value || "-").slice(0, 1024) || "-",
          inline: Boolean(field.inline),
        })),
      );
    }
    if (payload.thumbnail) embed.setThumbnail(payload.thumbnail);
    if (payload.footer) embed.setFooter({ text: String(payload.footer).slice(0, 2048) });
    if (payload.image) embed.setImage(payload.image);

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Log gönderilemedi:", error.message);
  }
}

export async function findExecutor(guild, type, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 6 });
    const entry = logs.entries.find(
      (item) => item.target?.id === targetId && Date.now() - item.createdTimestamp < 20_000,
    );
    return entry?.executor ?? null;
  } catch {
    return null;
  }
}

export { AuditLogEvent };
