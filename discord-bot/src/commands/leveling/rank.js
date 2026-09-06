import { SlashCommandBuilder } from "discord.js";
import { buildRankEmbed, getLevelRow, getLeaderboardRank } from "../../systems/leveling.js";
import { brandFooter } from "../../utils/brand.js";

export default {
  data: new SlashCommandBuilder()
    .setName("seviye")
    .setDescription("Premium seviye kartı")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye")),
  async execute(interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const row = getLevelRow(interaction.guild.id, user.id);
    const embed = buildRankEmbed(user, row);
    const rank = getLeaderboardRank(interaction.guild.id, user.id);

    embed.addFields({
      name: "Sıralama",
      value: rank ? `#**${rank}**` : "Henüz yok",
      inline: true,
    });
    embed.setFooter({ text: brandFooter("seviye") });

    return interaction.reply({ embeds: [embed] });
  },
};
