import { Events } from "discord.js";
import { sendLog } from "../systems/logger.js";

export default {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await sendLog(newMessage.guild, {
      title: "✏️ Mesaj Düzenlendi",
      description: `Kanal: ${newMessage.channel}\nYazar: ${newMessage.author}\n[Mesaja git](${newMessage.url})`,
      color: 0xfee75c,
      fields: [
        { name: "Eski", value: (oldMessage.content || "-").slice(0, 900) },
        { name: "Yeni", value: (newMessage.content || "-").slice(0, 900) },
      ],
    });
  },
};
