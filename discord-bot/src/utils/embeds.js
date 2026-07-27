import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";

export function baseEmbed(title, description) {
  const embed = new EmbedBuilder().setColor(config.embedColor).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  return embed;
}

export function successEmbed(description, title = "Başarılı") {
  return baseEmbed(title, description).setColor(0x57f287);
}

export function errorEmbed(description, title = "Hata") {
  return baseEmbed(title, description).setColor(0xed4245);
}

export function warnEmbed(description, title = "Uyarı") {
  return baseEmbed(title, description).setColor(0xfee75c);
}

export function infoEmbed(description, title = "Bilgi") {
  return baseEmbed(title, description).setColor(0x5865f2);
}
