import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { config } from "../config.js";

export const brand = {
  name: "Lexyxzon",
  tagline: "Ultra Premium Discord Operating System",
  invite: "discord.gg/sorgutr",
  color: config.embedColor || 0x7c3aed,
  colors: {
    primary: 0x7c3aed,
    success: 0x22c55e,
    danger: 0xef4444,
    warn: 0xf59e0b,
    info: 0x38bdf8,
    dark: 0x0f172a,
    premium: 0xa855f7,
    gold: 0xfbbf24,
  },
};

export function premiumEmbed({
  title,
  description,
  color = brand.colors.premium,
  fields = [],
  thumbnail,
  image,
  footer = `${brand.name} · ${brand.invite}`,
  author,
}) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (footer) embed.setFooter({ text: footer });
  if (author) embed.setAuthor(author);
  return embed;
}

export function hqPanelPayload(guild) {
  const embed = premiumEmbed({
    title: `${brand.name} Ultra Control`,
    description: [
      `✦ **${guild.name}** için ultra premium operasyon merkezi`,
      "",
      "Tek panel · tüm sistemler · kurumsal kalite",
      "",
      "**Aktif Suite**",
      "🛡️ Smart Guard · ✅ Verify · 📨 Invites",
      "⭐ Starboard · 💡 Suggestions · 🔊 Temp Voice",
      "🎭 Button Roles · 📋 Applications · 🚨 Reports",
      "⏰ Reminders · 💤 AFK · 🎨 Embed Studio",
      "📁 Case System · 📊 Analytics · 🧾 Transcripts",
    ].join("\n"),
    color: brand.colors.gold,
    thumbnail: guild.iconURL({ size: 256 }),
    author: { name: brand.tagline },
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("hq_module")
    .setPlaceholder("Ultra modül seç")
    .addOptions(
      { label: "Smart Guard", value: "protection", emoji: "🛡️" },
      { label: "Verify Gate", value: "verify", emoji: "✅" },
      { label: "Invite Engine", value: "invites", emoji: "📨" },
      { label: "Starboard", value: "starboard", emoji: "⭐" },
      { label: "Suggestions", value: "suggest", emoji: "💡" },
      { label: "Temp Voice", value: "tempvoice", emoji: "🔊" },
      { label: "Applications", value: "apply", emoji: "📋" },
      { label: "Analytics", value: "stats", emoji: "📊" },
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("hq_refresh")
      .setLabel("Yenile")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("hq_status")
      .setLabel("Sistem Durumu")
      .setStyle(ButtonStyle.Primary),
  );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu), buttons],
  };
}
