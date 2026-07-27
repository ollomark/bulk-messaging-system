import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kilidiac")
    .setDescription("Kanal kilidini açar")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });
    await sendLog(interaction.guild, {
      title: "🔓 Kanal Kilidi Açıldı",
      description: `${interaction.channel} ${interaction.user} tarafından açıldı.`,
    });
    return interaction.reply({ embeds: [successEmbed("Kanal kilidi açıldı.")] });
  },
};
