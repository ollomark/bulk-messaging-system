import { Events } from "discord.js";
import { emojiKeyFromReaction, getReactionRole } from "../systems/reactionRoles.js";
import { sendLog } from "../systems/logger.js";

export default {
  name: Events.MessageReactionAdd,
  async execute(reaction, user, client) {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch {
      return;
    }

    const message = reaction.message;
    if (!message.guild) return;

    const row = getReactionRole(message.id, emojiKeyFromReaction(reaction));
    if (!row) return;

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = message.guild.roles.cache.get(row.role_id);
    if (!role) return;

    if (member.roles.cache.has(role.id)) return;

    try {
      await member.roles.add(role, "Emoji-rol sistemi");
      await sendLog(message.guild, {
        title: "🎭 Emoji Rol Verildi",
        description: `${user} → ${role}\nEmoji: ${row.emoji_raw}`,
        color: 0x57f287,
      });
    } catch (error) {
      console.error("Emoji-rol verilemedi:", error.message);
    }
  },
};
