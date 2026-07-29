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
          title: `${brand.name} · Ultra Command Deck`,
          description: brand.tagline,
          color: brand.colors.gold,
          fields: [
            { name: "🎛️ HQ", value: "`/panel` `/istatistik` `/embed`" },
            {
              name: "🛡️ Security",
              value: "`/koruma` `/dogrulama` `/rapor` `/case` + moderasyon",
            },
            {
              name: "📈 Growth",
              value: "`/davetler` `/duyuru` `/dm` `/oneri` `/starboard` `/basvuru`",
            },
            {
              name: "🎧 Experience",
              value: "`/ses` `/gecicises` `/ticket` `/cekilis` `/seviye` `/emojirol` `/butonrol`",
            },
            {
              name: "✨ Lifestyle",
              value: "`/afk` `/hatirlat` `/anket`",
            },
          ],
        }),
      ],
      ephemeral: true,
    });
  },
};
