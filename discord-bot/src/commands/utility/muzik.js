import { ChannelType, SlashCommandBuilder } from "discord.js";
import {
  leaveMusic,
  musicStatus,
  playInChannel,
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
        .setDescription("Şarkı adı veya link ile çal (boşsa lofi radyo)")
        .addStringOption((opt) =>
          opt
            .setName("sarki")
            .setDescription("Sanatçı + şarkı yaz (örn: Duman Senden Daha Güzel)")
            .setRequired(false),
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
              `**Şarkı:** ${s.title || "—"}`,
              `**Player:** ${s.playerStatus}`,
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

    const channel = interaction.member.voice?.channel || null;
    if (
      !channel ||
      (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)
    ) {
      return interaction.reply({
        embeds: [errorEmbed("Önce bir ses kanalına gir, sonra `/muzik cal` yaz.")],
        ephemeral: true,
      });
    }

    const query = interaction.options.getString("sarki")?.trim() || "";
    await interaction.deferReply();

    try {
      const playing = await playInChannel(channel, query);
      const note = playing.preview
        ? "_(Kaynak kısıtı · 30sn önizleme)_"
        : query
          ? `Arama: \`${query.slice(0, 80)}\``
          : "Lo-fi radyo";
      return interaction.editReply({
        embeds: [
          successEmbed(
            [`${channel} · **${playing.title}**`, note, "", "`/muzik durdur` · `/muzik ayril`"].join(
              "\n",
            ),
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
