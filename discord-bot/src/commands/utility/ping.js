import { SlashCommandBuilder } from "discord.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("Bot gecikmesini gösterir"),
  async execute(interaction) {
    const sent = await interaction.reply({
      embeds: [infoEmbed("Ölçülüyor...")],
      fetchReply: true,
    });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
      embeds: [
        infoEmbed(
          `📡 Gecikme: **${roundtrip}ms**\n💓 API: **${interaction.client.ws.ping}ms**`,
          "Pong!",
        ),
      ],
    });
  },
};
