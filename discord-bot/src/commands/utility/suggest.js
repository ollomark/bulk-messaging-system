import { SlashCommandBuilder } from "discord.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";
import { createSuggestion } from "../../systems/suggestions.js";
import { updateSettings } from "../../database/settings.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("oneri")
    .setDescription("Öneri gönder / öneri sistemi")
    .addSubcommand((sub) =>
      sub
        .setName("gonder")
        .setDescription("Yeni öneri gönderir")
        .addStringOption((opt) =>
          opt.setName("icerik").setDescription("Önerin").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kanal")
        .setDescription("Öneri kanalını ayarlar (yönetici)")
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
          embeds: [errorEmbed("Bu işlem için yönetici gerekli.")],
          ephemeral: true,
        });
      }
      const channel = interaction.options.getChannel("kanal", true);
      updateSettings(interaction.guild.id, { suggest_channel_id: channel.id });
      return interaction.reply({ embeds: [successEmbed(`Öneri kanalı: ${channel}`)] });
    }

    const content = interaction.options.getString("icerik", true);
    await interaction.deferReply({ ephemeral: true });
    try {
      const message = await createSuggestion(interaction, content);
      return interaction.editReply({
        embeds: [successEmbed(`Önerin yayınlandı: [git](${message.url})`)],
      });
    } catch (error) {
      return interaction.editReply({ embeds: [errorEmbed(error.message)] });
    }
  },
};
