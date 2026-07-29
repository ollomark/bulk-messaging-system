import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { buildApplyPanel, setApplyChannel } from "../../systems/applications.js";
import { successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("basvuru")
    .setDescription("Ultra premium staff başvuru sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Başvuru panelini bu kanala atar"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kanal")
        .setDescription("Başvuruların düşeceği kanal")
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
      const channel = interaction.options.getChannel("kanal", true);
      setApplyChannel(interaction.guild.id, channel.id);
      return interaction.reply({ embeds: [successEmbed(`Başvuru log kanalı: ${channel}`)] });
    }

    await interaction.channel.send(buildApplyPanel());
    return interaction.reply({
      embeds: [successEmbed("Başvuru paneli gönderildi.")],
      ephemeral: true,
    });
  },
};
