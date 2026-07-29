import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Botun adına mesaj gönderir")
    .addStringOption((opt) => opt.setName("mesaj").setDescription("Mesaj").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const message = interaction.options.getString("mesaj", true);
    await interaction.channel.send({ content: message });
    return interaction.reply({
      embeds: [successEmbed("Mesaj gönderildi.")],
      ephemeral: true,
    });
  },
};
