import { Events } from "discord.js";
import { handleProtectionMessage } from "../systems/protection.js";
import { handleLevelMessage } from "../systems/leveling.js";

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const blocked = await handleProtectionMessage(message);
    if (blocked) return;

    await handleLevelMessage(message);
  },
};
