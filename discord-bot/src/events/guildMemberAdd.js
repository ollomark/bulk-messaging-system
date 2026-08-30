import { Events } from "discord.js";
import { getSettings } from "../database/settings.js";
import { handleRaidJoin } from "../systems/protection.js";
import { sendLog } from "../systems/logger.js";
import { premiumEmbed, brand } from "../utils/brand.js";
import { config } from "../config.js";
import { resolveInviter, trackInvite } from "../systems/invites.js";
import { sendJoinPing } from "../systems/joinPing.js";

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
    await sendJoinPing(member);

    const settings = getSettings(member.guild.id);
    const inviter = await resolveInviter(member);
    if (inviter) {
      trackInvite(member.guild.id, inviter.id, member.id, null);
    }

    // verify aktifken auto_role verme (verify rolü ayrı)
    if (settings.auto_role_id && !settings.verify_enabled) {
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
        const embed = premiumEmbed({
          title: `✦ ${member.guild.name}'e Hoş Geldin`,
          description: [
            text,
            "",
            `Üye sayısı · **${member.guild.memberCount}**`,
            brand.invite ? `Davet · \`${brand.invite}\`` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          thumbnail: member.user.displayAvatarURL({ size: 256 }),
          color: brand.colors.success,
          fields: [
            ...(inviter
              ? [{ name: "Davet eden", value: `${inviter}`, inline: true }]
              : []),
            {
              name: "Hesap",
              value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
              inline: true,
            },
          ],
          footer: `${brand.name} · welcome`,
        });
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
        { name: "Hesap", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Üye", value: String(member.guild.memberCount), inline: true },
        { name: "Davet", value: inviter ? `${inviter}` : "Bilinmiyor", inline: true },
      ],
    });
  },
};
