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
  tagline: "Premium Discord Guard & Engagement Suite",
  color: config.embedColor || 0x5865f2,
  colors: {
    primary: 0x5865f2,
    success: 0x3ba55d,
    danger: 0xed4245,
    warn: 0xfaa81a,
    info: 0x00b0f4,
    dark: 0x2b2d31,
    premium: 0x9b59b6,
  },
};

export function premiumEmbed({
  title,
  description,
  color = brand.colors.primary,
  fields = [],
  thumbnail,
  image,
  footer = `${brand.name} · Professional Suite`,
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
    title: `${brand.name} Control Center`,
    description: [
      `**${guild.name}** için profesyonel yönetim paneli.`,
      "",
      "Aşağıdan modül seç → anında kurulum / yönetim.",
      "Sıradan bot komutları değil; **tek merkezden** operasyon.",
      "",
      "**Modüller**",
      "🛡️ Koruma & Moderasyon",
      "✅ Doğrulama Kapısı",
      "📨 Davet Takibi",
      "⭐ Starboard",
      "💡 Öneri Sistemi",
      "🔊 Geçici Ses Odaları",
      "🤖 Oto Yanıt",
      "🎭 Buton Rol",
      "📊 Sunucu Analitiği",
    ].join("\n"),
    color: brand.colors.premium,
    thumbnail: guild.iconURL({ size: 256 }),
    author: { name: brand.tagline },
  });

  const menu = new StringSelectMenuBuilder()
    .setCustomId("hq_module")
    .setPlaceholder("Yönetmek istediğin modülü seç")
    .addOptions(
      { label: "Koruma Durumu", value: "protection", emoji: "🛡️" },
      { label: "Doğrulama Paneli Kur", value: "verify", emoji: "✅" },
      { label: "Davet Liderliği", value: "invites", emoji: "📨" },
      { label: "Starboard Bilgi", value: "starboard", emoji: "⭐" },
      { label: "Öneri Sistemi", value: "suggest", emoji: "💡" },
      { label: "Geçici Ses", value: "tempvoice", emoji: "🔊" },
      { label: "Oto Yanıtlar", value: "autorespond", emoji: "🤖" },
      { label: "Analitik", value: "stats", emoji: "📊" },
    );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("hq_refresh")
      .setLabel("Yenile")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel("Destek")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com"),
  );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu), buttons],
  };
}
