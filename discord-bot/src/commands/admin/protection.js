import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { updateSettings, getSettings } from "../../database/settings.js";
import { successEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("koruma")
    .setDescription("Sunucu koruma modüllerini yönetir")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("durum").setDescription("Koruma durumunu gösterir"))
    .addSubcommand((sub) =>
      sub
        .setName("ayarla")
        .setDescription("Bir koruma modülünü aç/kapat")
        .addStringOption((opt) =>
          opt
            .setName("modul")
            .setDescription("Modül")
            .setRequired(true)
            .addChoices(
              { name: "Anti-Spam", value: "anti_spam" },
              { name: "Anti-Invite", value: "anti_invite" },
              { name: "Anti-Link", value: "anti_link" },
              { name: "Anti-Raid", value: "anti_raid" },
              { name: "Anti-Caps", value: "anti_caps" },
              { name: "Mod Modu (sadece yetkililer yazar)", value: "mod_mode" },
            ),
        )
        .addBooleanOption((opt) =>
          opt.setName("aktif").setDescription("Açık mı?").setRequired(true),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `Anti-Spam: ${s.anti_spam ? "✅" : "❌"}`,
              `Anti-Invite: ${s.anti_invite ? "✅" : "❌"}`,
              `Anti-Link: ${s.anti_link ? "✅" : "❌"}`,
              `Anti-Raid: ${s.anti_raid ? "✅" : "❌"}`,
              `Anti-Caps: ${s.anti_caps ? "✅" : "❌"}`,
              `Mod Modu: ${s.mod_mode ? "✅" : "❌"}`,
            ].join("\n"),
            "Koruma Durumu",
          ),
        ],
      });
    }

    const modul = interaction.options.getString("modul", true);
    const aktif = interaction.options.getBoolean("aktif", true);
    updateSettings(interaction.guild.id, { [modul]: aktif ? 1 : 0 });
    return interaction.reply({
      embeds: [successEmbed(`\`${modul}\` ${aktif ? "açıldı" : "kapatıldı"}.`)],
    });
  },
};
