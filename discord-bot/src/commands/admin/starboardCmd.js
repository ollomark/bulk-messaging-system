import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { updateSettings, getSettings } from "../../database/settings.js";
import { successEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("starboard")
    .setDescription("Yıldızlanan mesajlar vitrini")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("ayarla")
        .setDescription("Starboard kanalını ayarlar")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Starboard kanalı")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("limit")
            .setDescription("Kaç yıldız gerekli? (varsayılan 3)")
            .setMinValue(1)
            .setMaxValue(25),
        ),
    )
    .addSubcommand((sub) => sub.setName("durum").setDescription("Starboard durumu")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        embeds: [
          infoEmbed(
            `Kanal: ${s.starboard_channel_id ? `<#${s.starboard_channel_id}>` : "Yok"}\nLimit: ${s.starboard_limit || 3} ⭐`,
            "Starboard",
          ),
        ],
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel("kanal", true);
    const limit = interaction.options.getInteger("limit") || 3;
    updateSettings(interaction.guild.id, {
      starboard_channel_id: channel.id,
      starboard_limit: limit,
    });
    return interaction.reply({
      embeds: [successEmbed(`Starboard ${channel} · limit **${limit}** ⭐`)],
    });
  },
};
