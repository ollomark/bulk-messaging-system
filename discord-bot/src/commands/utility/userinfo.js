import { SlashCommandBuilder } from "discord.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kullanici")
    .setDescription("Kullanıcı bilgilerini gösterir")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye")),
  async execute(interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    return interaction.reply({
      embeds: [
        infoEmbed(
          [
            `**Kullanıcı:** ${user.tag}`,
            `**ID:** ${user.id}`,
            `**Hesap:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            member
              ? `**Katılım:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
              : "**Katılım:** -",
            member
              ? `**Roller:** ${member.roles.cache
                  .filter((role) => role.id !== interaction.guild.id)
                  .map((role) => `${role}`)
                  .slice(0, 15)
                  .join(" ") || "Yok"}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
          "Kullanıcı Bilgisi",
        ).setThumbnail(user.displayAvatarURL({ size: 256 })),
      ],
    });
  },
};
