import { Events } from "discord.js";
import { getSettings } from "../database/settings.js";
import { sendLog } from "../systems/logger.js";
import { premiumEmbed, brand } from "../utils/brand.js";
import { markInviteLeft } from "../systems/invites.js";

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    markInviteLeft(member.guild.id, member.id);
    const settings = getSettings(member.guild.id);

    if (settings.goodbye_channel_id) {
      const channel = await member.guild.channels.fetch(settings.goodbye_channel_id).catch(() => null);
      if (channel?.isTextBased()) {
        const text = (settings.goodbye_message || "{user} sunucudan ayrıldı.")
          .replaceAll("{user}", member.user.tag)
          .replaceAll("{username}", member.user.username)
          .replaceAll("{server}", member.guild.name)
          .replaceAll("{memberCount}", String(member.guild.memberCount));
        await channel
          .send({
            embeds: [
              premiumEmbed({
                title: "Görüşürüz",
                description: text,
                color: brand.colors.danger,
              }),
            ],
          })
          .catch(() => null);
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
