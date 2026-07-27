import { Events } from "discord.js";
import { sendLog } from "../systems/logger.js";
import { setSnipe } from "../systems/snipe.js";

export default {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    if (message.author) {
      setSnipe(message.channel.id, {
        content: message.content,
        authorTag: message.author.tag,
        authorAvatar: message.author.displayAvatarURL(),
        deletedAt: Date.now(),
      });
    }

    await sendLog(message.guild, {
      title: "🗑️ Mesaj Silindi",
      description: `Kanal: ${message.channel}\nYazar: ${message.author || "Bilinmiyor"}`,
      color: 0xed4245,
      fields: [{ name: "İçerik", value: (message.content || "*embed/ek*").slice(0, 1000) }],
    });
  },
};
