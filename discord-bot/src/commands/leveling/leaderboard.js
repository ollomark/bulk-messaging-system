import { SlashCommandBuilder } from "discord.js";
import { getLeaderboard } from "../../systems/leveling.js";
import { infoEmbed, warnEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("liderlik")
    .setDescription("Seviye sıralamasını gösterir"),
  async execute(interaction) {
    const rows = getLeaderboard(interaction.guild.id, 10);
    if (!rows.length) {
      return interaction.reply({ embeds: [warnEmbed("Henüz seviye verisi yok.")] });
    }

    const list = rows
      .map((row, index) => `**${index + 1}.** <@${row.user_id}> — Seviye **${row.level}** (${row.xp} XP)`)
      .join("\n");

    return interaction.reply({
      embeds: [infoEmbed(list, "🏆 Liderlik Tablosu")],
    });
  },
};
