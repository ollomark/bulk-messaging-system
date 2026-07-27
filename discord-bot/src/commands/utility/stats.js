import { ChannelType, SlashCommandBuilder } from "discord.js";
import { premiumEmbed, brand } from "../../utils/brand.js";
import { getInviteLeaderboard } from "../../systems/invites.js";
import { getLeaderboard } from "../../systems/leveling.js";
import db from "../../database/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("istatistik")
    .setDescription("Sunucu analitiği ve bot özeti"),
  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => null);

    const humans = guild.members.cache.filter((m) => !m.user.bot).size;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const text = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voice = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const boosts = guild.premiumSubscriptionCount || 0;
    const cases = db
      .prepare("SELECT COUNT(*) AS c FROM mod_cases WHERE guild_id = ?")
      .get(guild.id).c;
    const tickets = db
      .prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ?")
      .get(guild.id).c;
    const topInv = getInviteLeaderboard(guild.id, 1)[0];
    const topLvl = getLeaderboard(guild.id, 1)[0];

    return interaction.reply({
      embeds: [
        premiumEmbed({
          title: `📊 ${guild.name} Analitik`,
          description: "Lexyxzon Professional Suite · canlı özet",
          color: brand.colors.premium,
          thumbnail: guild.iconURL({ size: 256 }),
          fields: [
            { name: "Üyeler", value: `${humans} insan · ${bots} bot`, inline: true },
            { name: "Toplam", value: `${guild.memberCount}`, inline: true },
            { name: "Boost", value: `${boosts}`, inline: true },
            { name: "Kanallar", value: `${text} yazı · ${voice} ses`, inline: true },
            { name: "Mod Case", value: `${cases}`, inline: true },
            { name: "Ticket", value: `${tickets}`, inline: true },
            {
              name: "Top Davet",
              value: topInv ? `<@${topInv.user_id}> (${topInv.regular})` : "—",
              inline: true,
            },
            {
              name: "Top Seviye",
              value: topLvl ? `<@${topLvl.user_id}> (Lv.${topLvl.level})` : "—",
              inline: true,
            },
          ],
        }),
      ],
    });
  },
};
