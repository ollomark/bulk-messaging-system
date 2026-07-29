import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { buildReportModal, setReportChannel } from "../../systems/reports.js";
import { successEmbed, errorEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rapor")
    .setDescription("Üye bildir / rapor kanalı ayarla")
    .addSubcommand((sub) => sub.setName("et").setDescription("Bir üyeyi bildirir"))
    .addSubcommand((sub) =>
      sub
        .setName("kanal")
        .setDescription("Raporların gideceği kanal (yönetici)")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Kanal")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "kanal") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [errorEmbed("Yönetici gerekli.")],
          ephemeral: true,
        });
      }
      const channel = interaction.options.getChannel("kanal", true);
      setReportChannel(interaction.guild.id, channel.id);
      return interaction.reply({ embeds: [successEmbed(`Rapor kanalı: ${channel}`)] });
    }

    return interaction.showModal(buildReportModal());
  },
};
