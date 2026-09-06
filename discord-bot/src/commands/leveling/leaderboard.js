import { SlashCommandBuilder } from "discord.js";
import { getLeaderboard, xpForLevel } from "../../systems/leveling.js";
import { brand, brandFooter, premiumEmbed, progressBar } from "../../utils/brand.js";
import { warnEmbed } from "../../utils/embeds.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export default {
  data: new SlashCommandBuilder()
    .setName("liderlik")
    .setDescription("Premium seviye sıralaması"),
  async execute(interaction) {
    const rows = getLeaderboard(interaction.guild.id, 10);
    if (!rows.length) {
      return interaction.reply({ embeds: [warnEmbed("Henüz seviye verisi yok.")] });
    }

    const list = rows
      .map((row, index) => {
        const medal = MEDALS[index] || `\`#${index + 1}\``;
        const needed = xpForLevel(row.level + 1);
        const ratio = needed > 0 ? row.xp / needed : 0;
        return `${medal} <@${row.user_id}>\n└ Lv **${row.level}** · ${row.xp} XP · \`${progressBar(ratio, 8)}\``;
      })
      .join("\n\n");

    return interaction.reply({
      embeds: [
        premiumEmbed({
          title: "🏆 Liderlik Tablosu",
          description: list,
          color: brand.colors.gold,
          thumbnail: interaction.guild.iconURL({ size: 256 }),
          footer: brandFooter("liderlik"),
        }),
      ],
    });
  },
};
