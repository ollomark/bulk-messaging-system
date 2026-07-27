import { Events } from "discord.js";
import { sendLog } from "../systems/logger.js";

export default {
  name: Events.MessageBulkDelete,
  async execute(messages, channel) {
    if (!channel.guild) return;

    await sendLog(channel.guild, {
      title: "🧹 Toplu Mesaj Silindi",
      description: `${channel} kanalında **${messages.size}** mesaj silindi.`,
      color: 0xed4245,
    });
  },
};
