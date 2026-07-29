import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("isimdegistir")
    .setDescription("Üyenin sunucu takma adını değiştirir")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
    .addStringOption((opt) =>
      opt.setName("isim").setDescription("Yeni isim (boş = sıfırla)"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const nick = interaction.options.getString("isim");
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member || !member.manageable) {
      return interaction.reply({
        embeds: [errorEmbed("Bu üyenin ismini değiştiremiyorum.")],
        ephemeral: true,
      });
    }

    await member.setNickname(nick || null);
    return interaction.reply({
      embeds: [successEmbed(`${user} için takma ad güncellendi.`)],
    });
  },
};
