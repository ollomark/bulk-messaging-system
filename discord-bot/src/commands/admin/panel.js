import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { hqPanelPayload } from "../../utils/brand.js";

export default {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("SORGUTR Ultimate kontrol merkezi")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    return interaction.reply({
      ...hqPanelPayload(interaction.guild),
      ephemeral: true,
    });
  },
};
