import { SlashCommandBuilder } from "discord.js";
import { setAfk } from "../../systems/afk.js";
import { successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("AFK moduna geç")
    .addStringOption((opt) => opt.setName("sebep").setDescription("AFK sebebi")),
  async execute(interaction) {
    const reason = interaction.options.getString("sebep") || "AFK";
    setAfk(interaction.guild.id, interaction.user.id, reason);
    return interaction.reply({
      embeds: [successEmbed(`AFK oldun: **${reason}**\nBirisi seni etiketlerse bildirilir.`)],
    });
  },
};
