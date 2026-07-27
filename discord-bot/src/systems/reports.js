import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { premiumEmbed, brand } from "../utils/brand.js";
import { createCase } from "./cases.js";

export function buildReportModal() {
  return new ModalBuilder()
    .setCustomId("report_modal")
    .setTitle("Üye Bildir")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("target")
          .setLabel("Kullanıcı ID veya etiket")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Sebep / kanıt")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
    );
}

export async function submitReport(interaction) {
  const targetRaw = interaction.fields.getTextInputValue("target").trim();
  const reason = interaction.fields.getTextInputValue("reason").trim();
  const idMatch = targetRaw.match(/\d{15,22}/);
  const targetId = idMatch?.[0];
  if (!targetId) {
    return interaction.reply({ content: "Geçerli bir kullanıcı ID'si gir.", ephemeral: true });
  }

  const settings = getSettings(interaction.guild.id);
  const channelId = settings.report_channel_id || settings.log_channel_id;
  if (!channelId) {
    return interaction.reply({
      content: "Rapor kanalı yok. Yönetici `/rapor kanal` ayarlamalı.",
      ephemeral: true,
    });
  }

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return interaction.reply({ content: "Rapor kanalı bulunamadı.", ephemeral: true });
  }

  const caseNumber = createCase({
    guildId: interaction.guild.id,
    type: "REPORT",
    userId: targetId,
    moderatorId: interaction.user.id,
    reason,
  });

  const embed = premiumEmbed({
    title: `🚨 Yeni Rapor · Case #${caseNumber}`,
    description: [
      `**Bildiren:** ${interaction.user}`,
      `**Hedef:** <@${targetId}> (\`${targetId}\`)`,
      `**Sebep:** ${reason}`,
    ].join("\n"),
    color: brand.colors.danger,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`report_ack_${caseNumber}`)
      .setLabel("İncelendi")
      .setStyle(ButtonStyle.Success),
  );

  await channel.send({ embeds: [embed], components: [row] });
  return interaction.reply({
    content: `Raporun alındı. Case #${caseNumber}`,
    ephemeral: true,
  });
}

export function setReportChannel(guildId, channelId) {
  updateSettings(guildId, { report_channel_id: channelId });
}
