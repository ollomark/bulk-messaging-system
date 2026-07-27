import { PermissionFlagsBits } from "discord.js";
import { config } from "../config.js";

export function isOwner(userId) {
  return Boolean(config.ownerId && config.ownerId === userId);
}

export function hasModPerms(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return (
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ManageMessages)
  );
}

export function hasAdminPerms(member) {
  if (!member) return false;
  if (isOwner(member.id)) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export async function safeReply(interaction, options) {
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(options);
  }
  return interaction.reply(options);
}
