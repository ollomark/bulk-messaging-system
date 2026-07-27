import { SlashCommandBuilder } from "discord.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("Bot komutlarını ve özelliklerini listeler"),
  async execute(interaction) {
    return interaction.reply({
      embeds: [
        infoEmbed(
          [
            "**🛡️ Koruma:** `/koruma`",
            "**🔨 Moderasyon:** `/ban` `/unban` `/kick` `/timeout` `/untimeout` `/warn` `/uyarilar` `/temizle` `/yavasmod` `/kilitle` `/kilidiac` `/rol` `/isimdegistir`",
            "**⚙️ Ayarlar:** `/ayarlar`",
            "**📢 Duyuru / DM:** `/duyuru` `/dm`",
            "**🎫 Ticket:** `/ticket panel` `/ticket kapat`",
            "**🎉 Çekiliş:** `/cekilis baslat` `/cekilis bitir`",
            "**📈 Seviye:** `/seviye` `/liderlik`",
            "**🔊 Ses 7/24:** `/ses katil` `/ses ayarla` `/ses ayril` `/ses durum`",
            "**🎭 Emoji Rol:** `/emojirol kur` `/emojirol panel` `/emojirol ekle` `/emojirol kaldir` `/emojirol liste`",
            "**🧰 Diğer:** `/sunucu` `/kullanici` `/avatar` `/ping` `/say` `/anket` `/snipe`",
          ].join("\n"),
          "Guardian Bot — Yardım",
        ),
      ],
      ephemeral: true,
    });
  },
};
