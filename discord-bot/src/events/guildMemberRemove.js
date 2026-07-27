import { Events } from "discord.js";
import { getSettings } from "../database/settings.js";
import { sendLog } from "../systems/logger.js";
import { baseEmbed } from "../utils/embeds.js";

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const settings = getSettings(member.guild.id);

    if (settings.goodbye_channel_id) {
      const channel = await member.guild.channels.fetch(settings.goodbye_channel_id).catch(() => null);
      if (channel?.isTextBased()) {
        const text = (settings.goodbye_message || "{user} sunucudan ayrıldı.")
          .replaceAll("{user}", member.user.tag)
          .replaceAll("{username}", member.user.username)
          .replaceAll("{server}", member.guild.name)
          .replaceAll("{memberCount}", String(member.guild.memberCount));
        await channel.send({ embeds: [baseEmbed("Görüşürüz", text)] }).catch(() => null);
      }
    }

    await sendLog(member.guild, {
      title: "🚪 Üye Ayrıldı",
      description: `${member.user.tag} (\`${member.id}\`) sunucudan ayrıldı.`,
      color: 0xed4245,
      thumbnail: member.user.displayAvatarURL(),
    });
  },
};
