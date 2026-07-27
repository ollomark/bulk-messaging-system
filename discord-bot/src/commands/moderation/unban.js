import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Yasağı kaldırır")
    .addStringOption((opt) =>
      opt.setName("kullanici_id").setDescription("Kullanıcı ID").setRequired(true),
    )
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const userId = interaction.options.getString("kullanici_id", true);
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";

    try {
      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);
    } catch {
      return interaction.reply({
        embeds: [errorEmbed("Yasak kaldırılamadı. ID hatalı veya kullanıcı yasaklı değil.")],
        ephemeral: true,
      });
    }

    await sendLog(interaction.guild, {
      title: "✅ Unban",
      description: `\`${userId}\` yasağı kaldırıldı.`,
      fields: [
        { name: "Moderatör", value: `${interaction.user}`, inline: true },
        { name: "Sebep", value: reason },
      ],
    });

    return interaction.reply({ embeds: [successEmbed(`\`${userId}\` yasağı kaldırıldı.`)] });
  },
};
