import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { getSettings } from "../database/settings.js";
import { config } from "../config.js";

export async function sendLog(guild, payload) {
  try {
    const settings = getSettings(guild.id);
    if (!settings.log_channel_id) return;

    const channel = await guild.channels.fetch(settings.log_channel_id).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(payload.color ?? config.embedColor)
      .setTitle(payload.title)
      .setDescription(payload.description || null)
      .setTimestamp();

    if (payload.fields?.length) embed.addFields(payload.fields);
    if (payload.thumbnail) embed.setThumbnail(payload.thumbnail);
    if (payload.footer) embed.setFooter({ text: payload.footer });

    await channel.send({ embeds: [embed] });
  } catch {
    // Log kanalı yoksa veya izin yoksa sessizce geç
  }
}

export async function findExecutor(guild, type, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 5 });
    const entry = logs.entries.find(
      (item) => item.target?.id === targetId && Date.now() - item.createdTimestamp < 15000,
    );
    return entry?.executor ?? null;
  } catch {
    return null;
  }
}

export { AuditLogEvent };
