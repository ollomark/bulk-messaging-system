import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";
import { replyThenDelete } from "../../utils/tempReply.js";

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
    await sendLog(interaction.guild, {
      title: "🐢 Yavaş Mod",
      description:
        seconds === 0
          ? `${interaction.channel} yavaş mod kapatıldı · ${interaction.user}`
          : `${interaction.channel} → **${seconds}s** · ${interaction.user}`,
    });
    return replyThenDelete(
      interaction,
      {
        embeds: [
          successEmbed(
            seconds === 0
              ? "Yavaş mod kapatıldı."
              : `Yavaş mod **${seconds} saniye** olarak ayarlandı.`,
          ),
        ],
      },
      3000,
    );
  },
};
