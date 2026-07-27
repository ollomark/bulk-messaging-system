import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { updateSettings, getSettings } from "../../database/settings.js";
import { joinVoice, leaveVoice } from "../../systems/voice.js";
import { errorEmbed, successEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ses")
    .setDescription("7/24 ses kanalı sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("katil")
        .setDescription("Bota ses kanalına katılmasını sağlar (7/24 kalır)")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Ses kanalı (boşsa bulunduğun kanal)")
            .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("ayril").setDescription("Bottan sesten ayrılmasını ister (7/24 kapanır)"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ayarla")
        .setDescription("7/24 ses kanalını ayarlar ve bağlanır")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Ses kanalı")
            .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) => sub.setName("durum").setDescription("Ses durumu")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      const voice = interaction.guild.members.me?.voice?.channel;
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `**7/24:** ${s.voice_24_7 ? "Açık" : "Kapalı"}`,
              `**Kayıtlı kanal:** ${s.voice_channel_id ? `<#${s.voice_channel_id}>` : "Yok"}`,
              `**Şu an:** ${voice ? `${voice}` : "Seste değil"}`,
            ].join("\n"),
            "Ses Durumu",
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "ayril") {
      await leaveVoice(interaction.guild.id, { disable247: true });
      return interaction.reply({
        embeds: [successEmbed("Sesten ayrıldım. 7/24 ses kapatıldı.")],
      });
    }

    let channel = interaction.options.getChannel("kanal");
    if (!channel && sub === "katil") {
      channel = interaction.member.voice?.channel || null;
    }

    if (!channel) {
      return interaction.reply({
        embeds: [errorEmbed("Bir ses kanalı seç veya önce bir ses kanalına gir.")],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      await joinVoice(channel, { persist: true, enabled247: true });
      updateSettings(interaction.guild.id, {
        voice_channel_id: channel.id,
        voice_24_7: 1,
      });

      return interaction.editReply({
        embeds: [
          successEmbed(
            `${channel} kanalına katıldım.\n7/24 aktif — düşersem otomatik geri dönerim.\n\nKalıcı olsun diye Railway'e \`VOICE_CHANNEL_ID=${channel.id}\` da eklenecek.`,
          ),
        ],
      });
    } catch (error) {
      console.error("Ses katılma hatası:", error);
      return interaction.editReply({
        embeds: [
          errorEmbed(
            `Sese katılamadım: ${error.message}\nBotun kanala **Bağlan** ve **Görüntüle** izni olduğundan emin ol.`,
          ),
        ],
      });
    }
  },
};
