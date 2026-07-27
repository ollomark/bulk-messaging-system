import { SlashCommandBuilder } from "discord.js";
import { premiumEmbed, brand } from "../../utils/brand.js";

export default {
  data: new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("Lexyxzon Professional Suite komutları"),
  async execute(interaction) {
    return interaction.reply({
      embeds: [
        premiumEmbed({
          title: `${brand.name} · Komut Merkezi`,
          description: brand.tagline,
          color: brand.colors.premium,
          fields: [
            {
              name: "🎛️ Kontrol",
              value: "`/panel` tek merkezden tüm modüller",
            },
            {
              name: "🛡️ Güvenlik",
              value: "`/koruma` `/dogrulama` `/ayarlar` moderasyon komutları + `/case`",
            },
            {
              name: "📣 Büyüme",
              value: "`/davetler` `/duyuru` `/dm` `/oneri` `/starboard`",
            },
            {
              name: "🎧 Deneyim",
              value: "`/ses` `/gecicises` `/ticket` `/cekilis` `/seviye` `/emojirol` `/butonrol`",
            },
            {
              name: "⚙️ Otomasyon",
              value: "`/otoyanit` `/istatistik` `/anket`",
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};
