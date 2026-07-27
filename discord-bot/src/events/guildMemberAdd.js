import { Events } from "discord.js";
import { getSettings } from "../database/settings.js";
import { handleRaidJoin } from "../systems/protection.js";
import { sendLog } from "../systems/logger.js";
import { baseEmbed } from "../utils/embeds.js";
import { config } from "../config.js";

function formatWelcome(template, member) {
  return template
    .replaceAll("{user}", `${member}`)
    .replaceAll("{username}", member.user.username)
    .replaceAll("{tag}", member.user.tag)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{memberCount}", String(member.guild.memberCount));
}

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    await handleRaidJoin(member);

    const settings = getSettings(member.guild.id);

    if (settings.auto_role_id) {
      const role = member.guild.roles.cache.get(settings.auto_role_id);
      if (role) await member.roles.add(role).catch(() => null);
    }

    if (settings.welcome_enabled && settings.welcome_channel_id) {
      const channel = await member.guild.channels.fetch(settings.welcome_channel_id).catch(() => null);
      if (channel?.isTextBased()) {
        const text = formatWelcome(
          settings.welcome_message ||
            "Hoş geldin {user}! **{server}** sunucusuna katıldın.",
          member,
        );
        const embed = baseEmbed("Hoş Geldin!", text).setThumbnail(member.user.displayAvatarURL());
        const sent = await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => null);

        const deleteAfter =
          Number(settings.welcome_delete_after ?? config.welcomeDeleteAfter) || 0;
        if (sent && deleteAfter > 0) {
          setTimeout(() => sent.delete().catch(() => null), deleteAfter * 1000);
        }
      }
    }

    await sendLog(member.guild, {
      title: "👋 Üye Katıldı",
      description: `${member} (\`${member.user.tag}\`) sunucuya katıldı.`,
      color: 0x57f287,
      thumbnail: member.user.displayAvatarURL(),
      fields: [
        { name: "Hesap Oluşturma", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Üye Sayısı", value: String(member.guild.memberCount), inline: true },
      ],
    });
  },
};
