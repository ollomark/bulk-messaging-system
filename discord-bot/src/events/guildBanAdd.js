import { AuditLogEvent, Events } from "discord.js";
import { findExecutor, sendLog } from "../systems/logger.js";

export default {
  name: Events.GuildBanAdd,
  async execute(ban) {
    const executor = await findExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    await sendLog(ban.guild, {
      title: "🔨 Üye Yasaklandı",
      description: `${ban.user.tag} (\`${ban.user.id}\`)`,
      color: 0xed4245,
      fields: [
        { name: "Yetkili", value: executor ? `${executor}` : "Bilinmiyor", inline: true },
        { name: "Sebep", value: ban.reason || "Belirtilmedi" },
      ],
      thumbnail: ban.user.displayAvatarURL(),
    });
  },
};
