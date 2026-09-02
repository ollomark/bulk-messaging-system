import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { config } from "../config.js";

export const brand = {
  name: process.env.BRAND_NAME || "SORGUTR",
  tagline: process.env.BRAND_TAGLINE || "Ultimate Discord Operating Suite",
  invite: process.env.BRAND_INVITE || "egexzon",
  presence: process.env.PRESENCE_TEXT || "egexzon",
  color: config.embedColor || 0x0ea5e9,
  colors: {
    primary: 0x0ea5e9,
    success: 0x10b981,
    danger: 0xf43f5e,
    warn: 0xf59e0b,
    info: 0x38bdf8,
    dark: 0x0b1220,
    premium: 0xfbbf24,
    gold: 0xfbbf24,
    violet: 0x818cf8,
  },
};

export function brandFooter(extra = "") {
  const base = `${brand.name} · ${brand.invite}`;
  return extra ? `${base} · ${extra}` : base;
}

export function premiumEmbed({
  title,
  description,
  color = brand.colors.premium,
  fields = [],
  thumbnail,
  image,
  footer = brandFooter(),
  author,
}) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (footer) embed.setFooter({ text: String(footer).slice(0, 2048) });
  if (author) embed.setAuthor(author);
  return embed;
}

/** 0–1 arası doluluk → ▓░ çubuğu */
export function progressBar(ratio, size = 12) {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  const filled = Math.round(clamped * size);
  return `${"▓".repeat(filled)}${"░".repeat(size - filled)}`;
}

export function hqPanelPayload(guild) {
  const embed = premiumEmbed({
    title: `${brand.name} Control Deck`,
    description: [
      `✦ **${guild.name}** · ultra operasyon merkezi`,
      "",
      "Tek panel · tüm sistemler · son seviye kalite",
      "",
      "**Suite**",
      "🛡️ Guard · ✅ Verify · 📨 Invites · ⭐ Starboard",
      "💡 Suggestions · 🔊 Temp Voice · 📋 Apply · 🚨 Reports",
      "🎫 Tickets · 📈 Levels · 🕵️ Status Role · 📊 Analytics",
    ].join("\n"),
    color: brand.colors.gold,
    thumbnail: guild.iconURL({ size: 256 }),
    author: { name: brand.tagline },
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("hq_module")
    .setPlaceholder("Modül seç")
    .addOptions(
      { label: "Smart Guard", value: "protection", emoji: "🛡️" },
      { label: "Verify Gate", value: "verify", emoji: "✅" },
      { label: "Invite Engine", value: "invites", emoji: "📨" },
      { label: "Starboard", value: "starboard", emoji: "⭐" },
      { label: "Suggestions", value: "suggest", emoji: "💡" },
      { label: "Temp Voice", value: "tempvoice", emoji: "🔊" },
      { label: "Applications", value: "apply", emoji: "📋" },
      { label: "Tickets", value: "tickets", emoji: "🎫" },
      { label: "Levels", value: "levels", emoji: "📈" },
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
