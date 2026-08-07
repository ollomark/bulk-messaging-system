import { SlashCommandBuilder } from "discord.js";
import { premiumEmbed, brand } from "../../utils/brand.js";

export default {
  data: new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("Lexyxzon Ultra Premium komutları"),
  async execute(interaction) {
    return interaction.reply({
      embeds: [
        premiumEmbed({
          title: `${brand.name} · Komutlar`,
          description: brand.tagline,
          color: brand.colors.gold,
          fields: [
            {
              name: "⚙️ Ayarlar",
              value: "`/ayarlar` `/panel` `/embed` `/istatistik`",
            },
            {
              name: "🛡️ Moderasyon",
              value:
                "`/ban` `/kick` `/timeout` `/warn` `/temizle` `/kilitle` `/kilidiac` `/yavasmod` `/rol` `/case`",
            },
            {
              name: "🎫 Destek",
              value: "`/ticket panel` `/ticket yazi` `/ticket kapat`",
            },
            {
              name: "🎵 Ses / Müzik",
              value: "`/muzik cal` `/muzik durdur` `/ses` `/gecicises`",
            },
            {
              name: "📈 Topluluk",
              value:
                "`/davetler` `/duyuru` `/dogrulama` `/emojirol` `/butonrol` `/cekilis` `/seviye` `/starboard`",
            },
            {
              name: "✨ Utility",
              value: "`/afk` `/hatirlat` `/anket` `/ping` `/snipe` `/avatar` `/kullanici` `/sunucu`",
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};
