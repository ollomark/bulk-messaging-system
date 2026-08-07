import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";
import { createCase } from "../../systems/cases.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Bir üyeyi sunucudan atar")
    .addUserOption((opt) => opt.setName("uye").setDescription("Atılacak üye").setRequired(true))
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ embeds: [errorEmbed("Üye bulunamadı.")], ephemeral: true });
    }
    if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed("Kendini atamazsın.")], ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ embeds: [errorEmbed("Bu üyeyi atamıyorum.")], ephemeral: true });
    }

    await member.kick(`${interaction.user.tag}: ${reason}`);

    const caseNo = createCase({
      guildId: interaction.guild.id,
      type: "kick",
      userId: user.id,
      moderatorId: interaction.user.id,
      reason,
    });

    await sendLog(interaction.guild, {
      title: `👢 Kick · Case #${caseNo}`,
      description: `${user} (\`${user.tag}\`) atıldı.`,
      color: 0xfaa61a,
      fields: [
        { name: "Moderatör", value: `${interaction.user}`, inline: true },
        { name: "Case", value: `#${caseNo}`, inline: true },
        { name: "Sebep", value: reason },
      ],
    });

    return interaction.reply({
      embeds: [successEmbed(`${user.tag} atıldı.\nCase **#${caseNo}** · ${reason}`)],
    });
  },
};
