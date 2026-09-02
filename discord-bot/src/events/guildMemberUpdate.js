import { Events } from "discord.js";
import { getSettings } from "../database/settings.js";
import { sendLog } from "../systems/logger.js";
import { brand, brandFooter, premiumEmbed } from "../utils/brand.js";

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember, newMember) {
    const wasBoost = Boolean(oldMember.premiumSince);
    const isBoost = Boolean(newMember.premiumSince);
    if (wasBoost || !isBoost) return;

    const settings = getSettings(newMember.guild.id);
    const channelId = settings.announce_channel_id || settings.welcome_channel_id;
    if (channelId) {
      const channel = await newMember.guild.channels.fetch(channelId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel
          .send({
            content: `${newMember}`,
            embeds: [
              premiumEmbed({
                title: "💎 Sunucu Boost!",
                description: [
                  `**${newMember.user.username}** sunucuyu boostladı.`,
                  "",
                  `${brand.name} ailesine katkı için teşekkürler.`,
                ].join("\n"),
                color: brand.colors.violet,
                thumbnail: newMember.user.displayAvatarURL({ size: 256 }),
                footer: brandFooter("boost"),
              }),
            ],
          })
          .catch(() => null);
      }
    }

    await sendLog(newMember.guild, {
      title: "💎 Boost",
      description: `${newMember} (\`${newMember.user.tag}\`) boostladı.`,
      color: brand.colors.violet,
      thumbnail: newMember.user.displayAvatarURL(),
    });
  },
};
