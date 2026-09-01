import { SlashCommandBuilder } from "discord.js";
import { startGuildResetConfirm } from "../../systems/guildReset.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sunucu-sifirla")
    .setDescription("Tüm kanalları silip yeni kanallar açar (sadece bot sahibi)")
    .addIntegerOption((opt) =>
      opt
        .setName("sayi")
        .setDescription("Açılacak kanal sayısı (varsayılan 10)")
        .setMinValue(1)
        .setMaxValue(50),
    )
    .addStringOption((opt) =>
      opt
        .setName("isim")
        .setDescription('Kanal adı (varsayılan "sk-keyfı")'),
    ),
  async execute(interaction) {
    await startGuildResetConfirm(interaction);
  },
};
