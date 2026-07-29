import { SlashCommandBuilder } from "discord.js";
import { getInviteLeaderboard, getInviteStats } from "../../systems/invites.js";
import { premiumEmbed, brand } from "../../utils/brand.js";

export default {
  data: new SlashCommandBuilder()
    .setName("davetler")
    .setDescription("Davet istatistikleri ve liderlik")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye"))
    .addBooleanOption((opt) => opt.setName("liderlik").setDescription("Liderlik tablosu")),
  async execute(interaction) {
    const leaderboard = interaction.options.getBoolean("liderlik");
    if (leaderboard) {
      const rows = getInviteLeaderboard(interaction.guild.id, 10);
      const text = rows.length
        ? rows
            .map(
              (r, i) =>
                `**${i + 1}.** <@${r.user_id}> → **${r.regular}** davet (ayrılan: ${r.left_count})`,
            )
            .join("\n")
        : "Henüz davet verisi yok.";
      return interaction.reply({
        embeds: [
          premiumEmbed({
            title: "📨 Davet Liderliği",
            description: text,
            color: brand.colors.premium,
          }),
        ],
      });
    }

    const user = interaction.options.getUser("uye") || interaction.user;
    const stats = getInviteStats(interaction.guild.id, user.id);
    return interaction.reply({
      embeds: [
        premiumEmbed({
          title: `📨 ${user.username} Davetleri`,
          description: `Toplam: **${stats.regular}**\nAyrılan: **${stats.left_count}**\nNet: **${stats.regular - stats.left_count}**`,
          thumbnail: user.displayAvatarURL(),
          color: brand.colors.info,
        }),
      ],
    });
  },
};
