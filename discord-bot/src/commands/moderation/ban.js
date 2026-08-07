import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";
import { createCase } from "../../systems/cases.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bir üyeyi sunucudan yasaklar")
    .addUserOption((opt) => opt.setName("uye").setDescription("Yasaklanacak üye").setRequired(true))
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep"))
    .addIntegerOption((opt) =>
      opt
        .setName("mesaj_sil")
        .setDescription("Kaç günlük mesajlar silinsin (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";
    const deleteDays = interaction.options.getInteger("mesaj_sil") ?? 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed("Kendini yasaklayamazsın.")], ephemeral: true });
    }
    if (member && !member.bannable) {
      return interaction.reply({ embeds: [errorEmbed("Bu üyeyi yasaklayamıyorum.")], ephemeral: true });
    }

    await interaction.guild.members.ban(user.id, {
      reason: `${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: deleteDays * 24 * 60 * 60,
    });

    const caseNo = createCase({
      guildId: interaction.guild.id,
      type: "ban",
      userId: user.id,
      moderatorId: interaction.user.id,
      reason,
    });

    await sendLog(interaction.guild, {
      title: `🔨 Ban · Case #${caseNo}`,
      description: `${user} (\`${user.tag}\`) yasaklandı.`,
      color: 0xed4245,
      fields: [
        { name: "Moderatör", value: `${interaction.user}`, inline: true },
        { name: "Case", value: `#${caseNo}`, inline: true },
        { name: "Sebep", value: reason },
      ],
    });

    return interaction.reply({
      embeds: [successEmbed(`${user.tag} yasaklandı.\nCase **#${caseNo}** · ${reason}`)],
    });
  },
};
