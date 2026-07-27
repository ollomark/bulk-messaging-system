import { Events } from "discord.js";
import { sendLog } from "../systems/logger.js";
import { setSnipe } from "../systems/snipe.js";

export default {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild) return;

    // Cache'de olmayan silinen mesajları da yakala
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        await sendLog(message.guild, {
          title: "🗑️ Mesaj Silindi",
          description: `Kanal: ${message.channel}\nYazar: Bilinmiyor (önbellekte yok)\nMesaj ID: \`${message.id}\``,
          color: 0xed4245,
        });
        return;
      }
    }

    if (message.author?.bot) return;

    if (message.author) {
      setSnipe(message.channel.id, {
        content: message.content,
        authorTag: message.author.tag,
        authorAvatar: message.author.displayAvatarURL(),
        deletedAt: Date.now(),
      });
    }

    const attachments =
      message.attachments?.size > 0
        ? [...message.attachments.values()].map((a) => a.url).join("\n")
        : null;

    await sendLog(message.guild, {
      title: "🗑️ Mesaj Silindi",
      description: `Kanal: ${message.channel}\nYazar: ${message.author || "Bilinmiyor"} (\`${message.author?.id || "?"}\`)`,
      color: 0xed4245,
      fields: [
        { name: "İçerik", value: (message.content || "*embed/ek/boş*").slice(0, 1000) },
        ...(attachments ? [{ name: "Ekler", value: attachments.slice(0, 1000) }] : []),
      ],
      thumbnail: message.author?.displayAvatarURL?.() || null,
    });
  },
};
