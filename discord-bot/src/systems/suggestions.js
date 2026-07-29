import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import db from "../database/db.js";
import { getSettings } from "../database/settings.js";
import { premiumEmbed, brand } from "../utils/brand.js";

export function buildSuggestionComponents(up = 0, down = 0) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("suggest_up")
        .setLabel(`Evet ${up}`)
        .setStyle(ButtonStyle.Success)
        .setEmoji("👍"),
      new ButtonBuilder()
        .setCustomId("suggest_down")
        .setLabel(`Hayır ${down}`)
        .setStyle(ButtonStyle.Danger)
        .setEmoji("👎"),
    ),
  ];
}

export async function createSuggestion(interaction, content) {
  const settings = getSettings(interaction.guild.id);
  const channel = settings.suggest_channel_id
    ? await interaction.guild.channels.fetch(settings.suggest_channel_id).catch(() => null)
    : interaction.channel;

  if (!channel?.isTextBased()) {
    throw new Error("Öneri kanalı ayarlı değil. `/onerisistemi kanal` kullan.");
  }

  const embed = premiumEmbed({
    title: "💡 Yeni Öneri",
    description: content,
    color: brand.colors.info,
    fields: [
      { name: "Durum", value: "🟢 Açık", inline: true },
      { name: "Oylama", value: "👍 0 · 👎 0", inline: true },
    ],
    author: {
      name: interaction.user.tag,
      iconURL: interaction.user.displayAvatarURL(),
    },
    footer: "Topluluk önerisi · Lexyxzon",
  });

  const message = await channel.send({
    embeds: [embed],
    components: buildSuggestionComponents(0, 0),
  });

  db.prepare(
    `INSERT INTO suggestions (message_id, guild_id, user_id, content, upvotes, downvotes, status, created_at)
     VALUES (?, ?, ?, ?, 0, 0, 'open', ?)`,
  ).run(message.id, interaction.guild.id, interaction.user.id, content, Date.now());

  return message;
}

const votes = new Map(); // messageId:userId -> up/down

export async function handleSuggestionVote(interaction, direction) {
  const row = db.prepare("SELECT * FROM suggestions WHERE message_id = ?").get(interaction.message.id);
  if (!row || row.status !== "open") {
    return interaction.reply({ content: "Bu öneri oylanamaz.", ephemeral: true });
  }

  const key = `${interaction.message.id}:${interaction.user.id}`;
  const prev = votes.get(key);
  let up = row.upvotes;
  let down = row.downvotes;

  if (prev === direction) {
    return interaction.reply({ content: "Zaten bu şekilde oy verdin.", ephemeral: true });
  }

  if (prev === "up") up -= 1;
  if (prev === "down") down -= 1;
  if (direction === "up") up += 1;
  if (direction === "down") down += 1;

  votes.set(key, direction);
  db.prepare("UPDATE suggestions SET upvotes = ?, downvotes = ? WHERE message_id = ?").run(
    up,
    down,
    interaction.message.id,
  );

  const embed = premiumEmbed({
    title: "💡 Yeni Öneri",
    description: row.content,
    color: brand.colors.info,
    fields: [
      { name: "Durum", value: "🟢 Açık", inline: true },
      { name: "Oylama", value: `👍 ${up} · 👎 ${down}`, inline: true },
    ],
    author: interaction.message.embeds[0]?.author || undefined,
    footer: "Topluluk önerisi · Lexyxzon",
  });

  await interaction.update({
    embeds: [embed],
    components: buildSuggestionComponents(up, down),
  });
}
