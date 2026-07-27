import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kilitle")
    .setDescription("Kanalı kilitler (herkes yazamaz)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });
    await sendLog(interaction.guild, {
      title: "🔒 Kanal Kilitlendi",
      description: `${interaction.channel} ${interaction.user} tarafından kilitlendi.`,
    });
    return interaction.reply({ embeds: [successEmbed("Kanal kilitlendi.")] });
  },
};
