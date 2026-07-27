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

export function buildApplyPanel() {
  const embed = premiumEmbed({
    title: "📋 Staff Başvuru",
    description: [
      "Ekibimize katılmak ister misin?",
      "Aşağıdaki butona tıkla ve formu doldur.",
      "",
      "Başvurular yetkili ekibe iletilir.",
    ].join("\n"),
    color: brand.colors.gold,
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("apply_open")
      .setLabel("Başvuru Yap")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

export function buildApplyModal() {
  return new ModalBuilder()
    .setCustomId("apply_modal")
    .setTitle("Staff Başvuru Formu")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("age")
          .setLabel("Yaş")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("experience")
          .setLabel("Deneyimin")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("why")
          .setLabel("Neden sen?")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true),
      ),
    );
}

export async function submitApplication(interaction) {
  const settings = getSettings(interaction.guild.id);
  const channelId = settings.apply_channel_id || settings.log_channel_id;
  if (!channelId) {
    return interaction.reply({
      content: "Başvuru kanalı ayarlı değil. `/basvuru kanal` kullanın.",
      ephemeral: true,
    });
  }

  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return interaction.reply({ content: "Başvuru kanalı bulunamadı.", ephemeral: true });
  }

  const age = interaction.fields.getTextInputValue("age");
  const experience = interaction.fields.getTextInputValue("experience");
  const why = interaction.fields.getTextInputValue("why");

  const embed = premiumEmbed({
    title: "📋 Yeni Staff Başvurusu",
    description: [
      `**Aday:** ${interaction.user} (\`${interaction.user.id}\`)`,
      `**Yaş:** ${age}`,
      `**Deneyim:** ${experience}`,
      `**Neden:** ${why}`,
    ].join("\n"),
    color: brand.colors.gold,
    thumbnail: interaction.user.displayAvatarURL(),
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`apply_accept_${interaction.user.id}`)
      .setLabel("Kabul")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`apply_deny_${interaction.user.id}`)
      .setLabel("Red")
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({ embeds: [embed], components: [row] });
  return interaction.reply({ content: "Başvurun iletildi ✅", ephemeral: true });
}

export function setApplyChannel(guildId, channelId) {
  updateSettings(guildId, { apply_channel_id: channelId });
}
