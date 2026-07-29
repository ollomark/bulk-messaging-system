import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { createButtonRolePanel } from "../../systems/buttonRoles.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("butonrol")
    .setDescription("Modern buton ile rol alma paneli (emoji yerine)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addChannelOption((opt) =>
      opt
        .setName("kanal")
        .setDescription("Panel kanalı")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addRoleOption((opt) => opt.setName("rol1").setDescription("Rol 1").setRequired(true))
    .addStringOption((opt) => opt.setName("yazi1").setDescription("Buton yazısı 1").setRequired(true))
    .addRoleOption((opt) => opt.setName("rol2").setDescription("Rol 2"))
    .addStringOption((opt) => opt.setName("yazi2").setDescription("Buton yazısı 2"))
    .addRoleOption((opt) => opt.setName("rol3").setDescription("Rol 3"))
    .addStringOption((opt) => opt.setName("yazi3").setDescription("Buton yazısı 3"))
    .addStringOption((opt) => opt.setName("baslik").setDescription("Panel başlığı")),
  async execute(interaction) {
    const channel = interaction.options.getChannel("kanal", true);
    const title = interaction.options.getString("baslik") || "🎭 Rol Seçim Paneli";
    const roles = [];

    for (let i = 1; i <= 3; i += 1) {
      const role = interaction.options.getRole(`rol${i}`);
      const label = interaction.options.getString(`yazi${i}`);
      if (role && label) {
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
          return interaction.reply({
            embeds: [errorEmbed(`${role} için bot rolü yeterince yüksek değil.`)],
            ephemeral: true,
          });
        }
        roles.push({ roleId: role.id, label, style: i === 1 ? "Success" : "Primary" });
      }
    }

    if (!roles.length) {
      return interaction.reply({ embeds: [errorEmbed("En az 1 rol gerekli.")], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const message = await createButtonRolePanel(channel, title, null, roles);
    return interaction.editReply({
      embeds: [successEmbed(`Buton-rol paneli hazır: [mesaja git](${message.url})`)],
    });
  },
};
