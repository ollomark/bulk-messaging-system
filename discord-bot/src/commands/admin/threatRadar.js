import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
  getLiveRadarEvents,
  getRadarPublicUrl,
  postRadarAlerts,
  refreshRadarCache,
  setupThreatRadar,
} from "../../systems/threatRadar.js";
import { getSettings } from "../../database/settings.js";
import { errorEmbed, successEmbed, infoEmbed } from "../../utils/embeds.js";
import { isOwner } from "../../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("radar")
    .setDescription("Canlı hacker tehdit haritası (egexzon radar)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("kur").setDescription("Kilitli egexzon-radar kanalını açar + harita aktif"),
    )
    .addSubcommand((sub) => sub.setName("yenile").setDescription("Tehdit verisini hemen güncelle"))
    .addSubcommand((sub) => sub.setName("durum").setDescription("Radar durumu")),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const isAdmin =
      isOwner(interaction.user.id) ||
      interaction.memberPermissions.has(PermissionFlagsBits.Administrator);

    if (sub === "kur") {
      if (!isAdmin) {
        return interaction.reply({
          embeds: [errorEmbed("Yönetici yetkisi gerekir.")],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      const channel = await setupThreatRadar(interaction.guild);
      const posted = await postRadarAlerts(client, interaction.guild.id, { limit: 4 });
      const mapUrl = getRadarPublicUrl();

      return interaction.editReply({
        embeds: [
          successEmbed(
            [
              `Kanal: ${channel} (kilitli)`,
              `İlk uyarı: **${posted}** saldırı vektörü`,
              mapUrl ? `🗺️ **Canlı harita:** ${mapUrl}` : "",
              "",
              "Haritada ülkelerden **egexzon** ağına çubuklar çıkar.",
            ]
              .filter(Boolean)
              .join("\n"),
            "🗺️ EGEXZON THREAT RADAR",
          ),
        ],
      });
    }

    if (sub === "yenile") {
      if (!isAdmin) {
        return interaction.reply({
          embeds: [errorEmbed("Yönetici yetkisi gerekir.")],
          ephemeral: true,
        });
      }
      await interaction.deferReply({ ephemeral: true });
      const added = await refreshRadarCache();
      const posted = await postRadarAlerts(client, interaction.guild.id, { limit: 4 });
      return interaction.editReply({
        embeds: [
          successEmbed(`Cache +${added} · Discord +${posted} uyarı`),
        ],
      });
    }

    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      const live = getLiveRadarEvents(5);
      const mapUrl = getRadarPublicUrl();
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `Kanal: ${s.threat_radar_channel_id ? `<#${s.threat_radar_channel_id}>` : "Kurulmadı — `/radar kur`"}`,
              `Canlı vektör: **${live.total}** yakalanan`,
              mapUrl ? `Harita: ${mapUrl}` : "Harita: panel `/radar`",
              "",
              "Hedef ağ: **egexzon** · Türkiye",
            ].join("\n"),
            "🗺️ Threat Radar",
          ),
        ],
        ephemeral: true,
      });
    }
  },
};
