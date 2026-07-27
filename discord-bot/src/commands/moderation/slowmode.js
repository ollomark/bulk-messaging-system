import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("yavasmod")
    .setDescription("Kanal yavaş modunu ayarlar")
    .addIntegerOption((opt) =>
      opt
        .setName("saniye")
        .setDescription("0-21600 (0 = kapat)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const seconds = interaction.options.getInteger("saniye", true);
    await interaction.channel.setRateLimitPerUser(seconds);
    return interaction.reply({
      embeds: [
        successEmbed(
          seconds === 0
            ? "Yavaş mod kapatıldı."
            : `Yavaş mod **${seconds} saniye** olarak ayarlandı.`,
        ),
      ],
    });
  },
};
