import { AuditLogEvent, Events } from "discord.js";
import { findExecutor, sendLog } from "../systems/logger.js";

export default {
  name: Events.ChannelDelete,
  async execute(channel) {
    if (!channel.guild) return;
    const executor = await findExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    await sendLog(channel.guild, {
      title: "📁 Kanal Silindi",
      description: `#${channel.name} (\`${channel.id}\`)`,
      color: 0xed4245,
      fields: [{ name: "Yetkili", value: executor ? `${executor}` : "Bilinmiyor", inline: true }],
    });
  },
};
