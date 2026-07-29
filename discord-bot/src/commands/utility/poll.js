import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { baseEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("anket")
    .setDescription("Hızlı anket oluşturur")
    .addStringOption((opt) => opt.setName("soru").setDescription("Soru").setRequired(true))
    .addStringOption((opt) => opt.setName("secenek1").setDescription("Seçenek 1").setRequired(true))
    .addStringOption((opt) => opt.setName("secenek2").setDescription("Seçenek 2").setRequired(true))
    .addStringOption((opt) => opt.setName("secenek3").setDescription("Seçenek 3"))
    .addStringOption((opt) => opt.setName("secenek4").setDescription("Seçenek 4"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const question = interaction.options.getString("soru", true);
    const options = [
      interaction.options.getString("secenek1", true),
      interaction.options.getString("secenek2", true),
      interaction.options.getString("secenek3"),
      interaction.options.getString("secenek4"),
    ].filter(Boolean);

    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
    const body = options.map((opt, i) => `${emojis[i]} ${opt}`).join("\n");

    const message = await interaction.reply({
      embeds: [baseEmbed(`📊 ${question}`, body)],
      fetchReply: true,
    });

    for (let i = 0; i < options.length; i += 1) {
      await message.react(emojis[i]);
    }
  },
};
