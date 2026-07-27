import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("temizle")
    .setDescription("Belirtilen sayıda mesaj siler")
    .addIntegerOption((opt) =>
      opt.setName("adet").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100),
    )
    .addUserOption((opt) => opt.setName("uye").setDescription("Sadece bu üyenin mesajları"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const amount = interaction.options.getInteger("adet", true);
    const user = interaction.options.getUser("uye");

    await interaction.deferReply({ ephemeral: true });

    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    let messages = [...fetched.values()].filter(
      (msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000,
    );
    if (user) messages = messages.filter((msg) => msg.author.id === user.id);
    messages = messages.slice(0, amount);

    if (!messages.length) {
      return interaction.editReply({ embeds: [errorEmbed("Silinecek uygun mesaj bulunamadı.")] });
    }

    const deleted = await interaction.channel.bulkDelete(messages, true);
    await sendLog(interaction.guild, {
      title: "🧹 Mesaj Temizleme",
      description: `${interaction.user} ${interaction.channel} kanalında **${deleted.size}** mesaj sildi.`,
      color: 0x5865f2,
    });

    return interaction.editReply({
      embeds: [successEmbed(`**${deleted.size}** mesaj silindi.`)],
    });
  },
};
