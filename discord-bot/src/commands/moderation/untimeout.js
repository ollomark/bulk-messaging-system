import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Üyenin timeoutunu kaldırır")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member?.moderatable) {
      return interaction.reply({ embeds: [errorEmbed("Timeout kaldırılamıyor.")], ephemeral: true });
    }

    await member.timeout(null);
    await sendLog(interaction.guild, {
      title: "✅ Timeout Kaldırıldı",
      description: `${user} kullanıcısının timeoutu kaldırıldı.`,
      fields: [{ name: "Moderatör", value: `${interaction.user}`, inline: true }],
    });

    return interaction.reply({ embeds: [successEmbed(`${user} artık konuşabilir.`)] });
  },
};
