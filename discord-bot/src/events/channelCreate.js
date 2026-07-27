import { AuditLogEvent, Events } from "discord.js";
import { findExecutor, sendLog } from "../systems/logger.js";

export default {
  name: Events.ChannelCreate,
  async execute(channel) {
    if (!channel.guild) return;
    const executor = await findExecutor(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
    await sendLog(channel.guild, {
      title: "📁 Kanal Oluşturuldu",
      description: `${channel} (\`${channel.name}\`)`,
      color: 0x57f287,
      fields: [{ name: "Yetkili", value: executor ? `${executor}` : "Bilinmiyor", inline: true }],
    });
  },
};
