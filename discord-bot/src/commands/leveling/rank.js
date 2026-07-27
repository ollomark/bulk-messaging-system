import { SlashCommandBuilder } from "discord.js";
import { getLevelRow, xpForLevel } from "../../systems/leveling.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("seviye")
    .setDescription("Seviye ve XP bilgisini gösterir")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye")),
  async execute(interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const row = getLevelRow(interaction.guild.id, user.id);
    const needed = xpForLevel(row.level + 1);

    return interaction.reply({
      embeds: [
        infoEmbed(
          [
            `**Kullanıcı:** ${user}`,
            `**Seviye:** ${row.level}`,
            `**XP:** ${row.xp} / ${needed}`,
            `**Toplam mesaj:** ${row.total_messages}`,
          ].join("\n"),
          "Seviye Kartı",
        ).setThumbnail(user.displayAvatarURL()),
      ],
    });
  },
};
