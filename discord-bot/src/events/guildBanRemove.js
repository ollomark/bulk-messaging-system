import { AuditLogEvent, Events } from "discord.js";
import { findExecutor, sendLog } from "../systems/logger.js";

export default {
  name: Events.GuildBanRemove,
  async execute(ban) {
    const executor = await findExecutor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
    await sendLog(ban.guild, {
      title: "✅ Yasak Kaldırıldı",
      description: `${ban.user.tag} (\`${ban.user.id}\`)`,
      color: 0x57f287,
      fields: [{ name: "Yetkili", value: executor ? `${executor}` : "Bilinmiyor", inline: true }],
      thumbnail: ban.user.displayAvatarURL(),
    });
  },
};
