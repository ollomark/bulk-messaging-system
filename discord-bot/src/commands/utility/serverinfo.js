import { SlashCommandBuilder } from "discord.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("sunucu").setDescription("Sunucu bilgilerini gösterir"),
  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch().catch(() => null);

    return interaction.reply({
      embeds: [
        infoEmbed(
          [
            `**Ad:** ${guild.name}`,
            `**ID:** ${guild.id}`,
            `**Sahip:** <@${guild.ownerId}>`,
            `**Üye:** ${guild.memberCount}`,
            `**Rol:** ${guild.roles.cache.size}`,
            `**Kanal:** ${guild.channels.cache.size}`,
            `**Oluşturulma:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          ].join("\n"),
          "Sunucu Bilgisi",
        ).setThumbnail(guild.iconURL({ size: 256 })),
      ],
    });
  },
};
