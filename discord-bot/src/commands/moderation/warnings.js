import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import db from "../../database/db.js";
import { infoEmbed, warnEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("uyarilar")
    .setDescription("Bir üyenin uyarılarını listeler")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const rows = db
      .prepare(
        `SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?
         ORDER BY created_at DESC LIMIT 15`,
      )
      .all(interaction.guild.id, user.id);

    if (!rows.length) {
      return interaction.reply({ embeds: [warnEmbed(`${user} için uyarı yok.`)] });
    }

    const list = rows
      .map(
        (row, i) =>
          `**${i + 1}.** ${row.reason} — <@${row.moderator_id}> • <t:${Math.floor(row.created_at / 1000)}:R>`,
      )
      .join("\n");

    return interaction.reply({
      embeds: [infoEmbed(list, `${user.tag} Uyarıları (${rows.length})`)],
    });
  },
};
