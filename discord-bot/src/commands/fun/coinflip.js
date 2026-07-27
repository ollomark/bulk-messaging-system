import { SlashCommandBuilder } from "discord.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("yazi-tura").setDescription("Yazı tura atar"),
  async execute(interaction) {
    const result = Math.random() < 0.5 ? "Yazı" : "Tura";
    return interaction.reply({ embeds: [infoEmbed(`Sonuç: **${result}**`, "🪙 Yazı Tura")] });
  },
};
