import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rol")
    .setDescription("Rol ver / al")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("ver")
        .setDescription("Rol verir")
        .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
        .addRoleOption((opt) => opt.setName("rol").setDescription("Rol").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("al")
        .setDescription("Rol alır")
        .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
        .addRoleOption((opt) => opt.setName("rol").setDescription("Rol").setRequired(true)),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("uye", true);
    const role = interaction.options.getRole("rol", true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ embeds: [errorEmbed("Üye bulunamadı.")], ephemeral: true });
    }
    if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        embeds: [errorEmbed("Bu rolü yönetemiyorum. Bot rolünü yukarı taşı.")],
        ephemeral: true,
      });
    }

    if (sub === "ver") {
      await member.roles.add(role);
      await sendLog(interaction.guild, {
        title: "➕ Rol Verildi",
        description: `${role} → ${user}\nMod: ${interaction.user}`,
      });
      return interaction.reply({ embeds: [successEmbed(`${user} kullanıcısına ${role} verildi.`)] });
    }

    await member.roles.remove(role);
    await sendLog(interaction.guild, {
      title: "➖ Rol Alındı",
      description: `${role} ← ${user}\nMod: ${interaction.user}`,
    });
    return interaction.reply({ embeds: [successEmbed(`${user} kullanıcısından ${role} alındı.`)] });
  },
};
