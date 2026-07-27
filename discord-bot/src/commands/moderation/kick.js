import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

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
    if (!member.kickable) {
      return interaction.reply({ embeds: [errorEmbed("Bu üyeyi atamıyorum.")], ephemeral: true });
    }

    await member.kick(`${interaction.user.tag}: ${reason}`);
    await sendLog(interaction.guild, {
      title: "👢 Kick",
      description: `${user.tag} atıldı.`,
      color: 0xfaa61a,
      fields: [
        { name: "Moderatör", value: `${interaction.user}`, inline: true },
        { name: "Sebep", value: reason },
      ],
    });

    return interaction.reply({ embeds: [successEmbed(`${user.tag} atıldı.\nSebep: ${reason}`)] });
  },
};
