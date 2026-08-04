import { ChannelType, SlashCommandBuilder } from "discord.js";
import {
  DEFAULT_STREAM,
  leaveMusic,
  musicStatus,
  playInChannel,
  playUrl,
  stopMusic,
} from "../../systems/music.js";
import { errorEmbed, infoEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("muzik")
    .setDescription("Ses kanalında müzik / radyo")
    .addSubcommand((sub) =>
      sub
        .setName("cal")
        .setDescription("Bulunduğun sese girip müzik açar")
        .addStringOption((opt) =>
          opt
            .setName("url")
            .setDescription("Direkt mp3/radyo linki (boşsa lofi radyo)"),
        ),
    )
    .addSubcommand((sub) => sub.setName("durdur").setDescription("Müziği durdurur"))
    .addSubcommand((sub) => sub.setName("ayril").setDescription("Sesten çıkar"))
    .addSubcommand((sub) => sub.setName("durum").setDescription("Müzik durumu")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "durum") {
      const s = musicStatus(interaction.guild.id);
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `**Bağlı:** ${s.connected ? "Evet" : "Hayır"}`,
              `**Çalıyor:** ${s.playing ? "Evet" : "Hayır"}`,
              `**Player:** ${s.playerStatus}`,
              `**Kaynak:** ${s.url || "—"}`,
            ].join("\n"),
            "Müzik",
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "durdur") {
      stopMusic(interaction.guild.id);
      return interaction.reply({ embeds: [successEmbed("Müzik durduruldu.")] });
    }

    if (sub === "ayril") {
      leaveMusic(interaction.guild.id);
      return interaction.reply({ embeds: [successEmbed("Sesten çıktım.")] });
    }

    // cal
    const channel =
      interaction.member.voice?.channel ||
      interaction.options.getChannel?.("kanal") ||
      null;

    if (!channel || (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)) {
      return interaction.reply({
        embeds: [errorEmbed("Önce bir ses kanalına gir, sonra `/muzik cal` yaz.")],
        ephemeral: true,
      });
    }

    const url = interaction.options.getString("url")?.trim() || DEFAULT_STREAM;
    await interaction.deferReply();

    try {
      await playInChannel(channel, url);
      return interaction.editReply({
        embeds: [
          successEmbed(
            `${channel} kanalında çalıyor.\nKaynak: \`${url.slice(0, 80)}\`\n\n\`/muzik durdur\` · \`/muzik ayril\``,
          ),
        ],
      });
    } catch (error) {
      console.error("muzik cal:", error);
      return interaction.editReply({
        embeds: [errorEmbed(`Açılamadı: ${error.message}`)],
      });
    }
  },
};
