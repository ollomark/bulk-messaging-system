import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { setupVerify, verifyLockHint } from "../../systems/verify.js";
import { updateSettings, getSettings } from "../../database/settings.js";
import { successEmbed, infoEmbed, errorEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dogrulama")
    .setDescription("Butonlu doğrulama kapısı")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("kur")
        .setDescription("Doğrulama paneli kurar")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Panel kanalı")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("rol").setDescription("Doğrulama sonrası verilecek rol").setRequired(true),
        ),
    )
    .addSubcommand((sub) => sub.setName("durum").setDescription("Doğrulama durumu"))
    .addSubcommand((sub) =>
      sub
        .setName("kapat")
        .setDescription("Doğrulamayı kapatır"),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `Aktif: ${s.verify_enabled ? "Evet" : "Hayır"}`,
              `Kanal: ${s.verify_channel_id ? `<#${s.verify_channel_id}>` : "Yok"}`,
              `Rol: ${s.verify_role_id ? `<@&${s.verify_role_id}>` : "Yok"}`,
              "",
              verifyLockHint(),
            ].join("\n"),
            "Doğrulama",
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "kapat") {
      updateSettings(interaction.guild.id, { verify_enabled: 0 });
      return interaction.reply({ embeds: [successEmbed("Doğrulama kapatıldı.")], ephemeral: true });
    }

    const channel = interaction.options.getChannel("kanal", true);
    const role = interaction.options.getRole("rol", true);
    if (role.managed) {
      return interaction.reply({ embeds: [errorEmbed("Bu rol kullanılamaz.")], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const message = await setupVerify(interaction.guild, channel, role);
    return interaction.editReply({
      embeds: [
        successEmbed(
          `Doğrulama paneli kuruldu: [mesaj](${message.url})\nRol: ${role}\n${verifyLockHint()}`,
        ),
      ],
    });
  },
};
