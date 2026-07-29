import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { updateSettings, getSettings } from "../../database/settings.js";
import { successEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("gecicises")
    .setDescription("Katılınca oda oluşan geçici ses sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("kur")
        .setDescription("Join-to-create ses kanalını ayarlar")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("+ Oda Oluştur kanalı")
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("kategori")
            .setDescription("Odaların oluşacağı kategori")
            .addChannelTypes(ChannelType.GuildCategory),
        ),
    )
    .addSubcommand((sub) => sub.setName("durum").setDescription("Geçici ses durumu"))
    .addSubcommand((sub) => sub.setName("kapat").setDescription("Sistemi kapatır")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        embeds: [
          infoEmbed(
            `Lobby: ${s.temp_voice_channel_id ? `<#${s.temp_voice_channel_id}>` : "Yok"}\nKategori: ${
              s.temp_voice_category_id ? `<#${s.temp_voice_category_id}>` : "Otomatik"
            }`,
            "Geçici Ses",
          ),
        ],
        ephemeral: true,
      });
    }
    if (sub === "kapat") {
      updateSettings(interaction.guild.id, {
        temp_voice_channel_id: null,
        temp_voice_category_id: null,
      });
      return interaction.reply({ embeds: [successEmbed("Geçici ses kapatıldı.")] });
    }

    const channel = interaction.options.getChannel("kanal", true);
    const category = interaction.options.getChannel("kategori");
    updateSettings(interaction.guild.id, {
      temp_voice_channel_id: channel.id,
      temp_voice_category_id: category?.id || channel.parentId || null,
    });
    return interaction.reply({
      embeds: [
        successEmbed(
          `${channel} artık **+ Oda Oluştur** lobisi.\nBiri katılınca özel ses odası açılır, boşalınca silinir.`,
        ),
      ],
    });
  },
};
