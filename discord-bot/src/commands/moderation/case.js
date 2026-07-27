import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getCase, listCases } from "../../systems/cases.js";
import { errorEmbed, infoEmbed } from "../../utils/embeds.js";
import { premiumEmbed, brand } from "../../utils/brand.js";

export default {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Moderasyon case kayıtlarını görüntüler")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addIntegerOption((opt) =>
      opt.setName("no").setDescription("Case numarası").setMinValue(1),
    )
    .addUserOption((opt) => opt.setName("uye").setDescription("Üyenin case geçmişi")),
  async execute(interaction) {
    const no = interaction.options.getInteger("no");
    const user = interaction.options.getUser("uye");

    if (no) {
      const row = getCase(interaction.guild.id, no);
      if (!row) {
        return interaction.reply({ embeds: [errorEmbed(`Case #${no} yok.`)], ephemeral: true });
      }
      return interaction.reply({
        embeds: [
          premiumEmbed({
            title: `📁 Case #${row.case_number}`,
            description: [
              `**Tip:** ${row.type}`,
              `**Kullanıcı:** <@${row.user_id}>`,
              `**Yetkili:** <@${row.moderator_id}>`,
              `**Sebep:** ${row.reason}`,
              `**Tarih:** <t:${Math.floor(row.created_at / 1000)}:F>`,
            ].join("\n"),
            color: brand.colors.danger,
          }),
        ],
      });
    }

    const rows = listCases(interaction.guild.id, user?.id || null, 10);
    if (!rows.length) {
      return interaction.reply({ embeds: [infoEmbed("Kayıt yok.")], ephemeral: true });
    }

    return interaction.reply({
      embeds: [
        premiumEmbed({
          title: user ? `📁 ${user.username} Case Geçmişi` : "📁 Son Case'ler",
          description: rows
            .map(
              (r) =>
                `\`#${r.case_number}\` **${r.type}** <@${r.user_id}> — ${r.reason || "-"}`,
            )
            .join("\n"),
          color: brand.colors.dark,
        }),
      ],
    });
  },
};
