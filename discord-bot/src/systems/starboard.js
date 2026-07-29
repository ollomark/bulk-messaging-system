import db from "../database/db.js";
import { getSettings } from "../database/settings.js";
import { premiumEmbed, brand } from "../utils/brand.js";

export async function handleStarReaction(reaction) {
  if (reaction.emoji.name !== "⭐" && reaction.emoji.name !== "🌟") return;

  const message = reaction.message;
  if (!message.guild || message.author?.bot) return;

  const settings = getSettings(message.guild.id);
  if (!settings.starboard_channel_id) return;

  const count = reaction.count || 0;
  const limit = settings.starboard_limit || 3;
  const existing = db
    .prepare("SELECT * FROM starboard_map WHERE original_message_id = ?")
    .get(message.id);

  const channel = await message.guild.channels.fetch(settings.starboard_channel_id).catch(() => null);
  if (!channel?.isTextBased()) return;

  if (count < limit) {
    if (existing) {
      await channel.messages.delete(existing.starboard_message_id).catch(() => null);
      db.prepare("DELETE FROM starboard_map WHERE original_message_id = ?").run(message.id);
    }
    return;
  }

  const embed = premiumEmbed({
    title: `⭐ ${count} · Starboard`,
    description: message.content || "*medya / embed*",
    color: brand.colors.warn,
    fields: [
      { name: "Kaynak", value: `[Mesaja git](${message.url})`, inline: true },
      { name: "Kanal", value: `${message.channel}`, inline: true },
    ],
    author: {
      name: message.author?.tag || "Bilinmiyor",
      iconURL: message.author?.displayAvatarURL?.() || undefined,
    },
    image: message.attachments.first()?.url || null,
  });

  if (existing) {
    const starMsg = await channel.messages.fetch(existing.starboard_message_id).catch(() => null);
    if (starMsg) {
      await starMsg.edit({ content: `⭐ **${count}** | ${message.channel}`, embeds: [embed] });
      db.prepare("UPDATE starboard_map SET star_count = ? WHERE original_message_id = ?").run(
        count,
        message.id,
      );
      return;
    }
  }

  const sent = await channel.send({
    content: `⭐ **${count}** | ${message.channel}`,
    embeds: [embed],
  });
  db.prepare(
    `INSERT INTO starboard_map (original_message_id, starboard_message_id, guild_id, star_count)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(original_message_id) DO UPDATE SET
       starboard_message_id = excluded.starboard_message_id,
       star_count = excluded.star_count`,
  ).run(message.id, sent.id, message.guild.id, count);
}
