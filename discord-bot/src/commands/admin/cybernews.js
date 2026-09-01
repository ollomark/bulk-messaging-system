import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
  postCyberNews,
  setupCyberNews,
} from "../../systems/cyberNews.js";
import { getSettings } from "../../database/settings.js";
import { errorEmbed, successEmbed, infoEmbed } from "../../utils/embeds.js";
import { isOwner } from "../../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("siber")
    .setDescription("Siber istihbarat kanalı (kilitli haber akışı)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("kur").setDescription("Kilitli siber-ajans kanalını açar ve akışı başlatır"),
    )
    .addSubcommand((sub) =>
      sub.setName("yenile").setDescription("Hemen güncel haberleri çeker"),
    )
    .addSubcommand((sub) => sub.setName("durum").setDescription("Siber kanal durumu")),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === "kur") {
      if (!isOwner(interaction.user.id) && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [errorEmbed("Bu komut için yönetici yetkisi gerekir.")],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      const channel = await setupCyberNews(interaction.guild);
      const posted = await postCyberNews(client, interaction.guild.id, { limit: 5 });

      return interaction.editReply({
        embeds: [
          successEmbed(
            [
              `Kanal: ${channel} (kilitli — sadece bot yazar)`,
              `İlk tarama: **${posted}** haber basıldı`,
              "",
              "Akış otomatik devam eder (~10 dk aralık).",
            ].join("\n"),
            "🔒 Siber İstihbarat Aktif",
          ),
        ],
      });
    }

    if (sub === "yenile") {
      if (!isOwner(interaction.user.id) && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          embeds: [errorEmbed("Bu komut için yönetici yetkisi gerekir.")],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      const posted = await postCyberNews(client, interaction.guild.id, { limit: 5 });
      return interaction.editReply({
        embeds: [
          successEmbed(
            posted
              ? `**${posted}** yeni haber basıldı.`
              : "Yeni haber yok (hepsi daha önce paylaşılmış).",
          ),
        ],
      });
    }

    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      const channel = s.cyber_news_channel_id
        ? `<#${s.cyber_news_channel_id}>`
        : "Henüz kurulmadı — `/siber kur`";
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `Kanal: ${channel}`,
              "Kaynaklar: THN · BleepingComputer · Krebs · CISA",
              "Stil: dark ajan · canlı siber gelişmeler",
              "Kanal kilitli — üyeler sadece okur.",
            ].join("\n"),
            "🔒 Siber İstihbarat",
          ),
        ],
        ephemeral: true,
      });
    }
  },
};
