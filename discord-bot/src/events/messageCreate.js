import { Events } from "discord.js";
import { handleProtectionMessage } from "../systems/protection.js";
import { handleLevelMessage } from "../systems/leveling.js";
import { matchResponder } from "../systems/autoresponder.js";

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const blocked = await handleProtectionMessage(message);
    if (blocked) return;

    const responder = matchResponder(message.guild.id, message.content || "");
    if (responder) {
      await message.reply({ content: responder.response_text }).catch(() => null);
    }

    await handleLevelMessage(message);
  },
};
