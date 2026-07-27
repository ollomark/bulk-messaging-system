import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import db from "../../database/db.js";
import { successEmbed } from "../../utils/embeds.js";
import { createCase, logCase } from "../../systems/cases.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Üyeye uyarı verir (case kayıtlı)")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const reason = interaction.options.getString("sebep", true);

    db.prepare(
      `INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(interaction.guild.id, user.id, interaction.user.id, reason, Date.now());

    const caseNumber = createCase({
      guildId: interaction.guild.id,
      type: "WARN",
      userId: user.id,
      moderatorId: interaction.user.id,
      reason,
    });

    const count = db
      .prepare("SELECT COUNT(*) AS c FROM warnings WHERE guild_id = ? AND user_id = ?")
      .get(interaction.guild.id, user.id).c;

    await user
      .send(
        `**${interaction.guild.name}** · Case #${caseNumber}\nUyarı aldın.\nSebep: ${reason}\nToplam uyarı: ${count}`,
      )
      .catch(() => null);

    await logCase(interaction.guild, {
      caseNumber,
      type: "WARN",
      user,
      moderator: interaction.user,
      reason,
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user} uyarıldı.\n**Case #${caseNumber}** · Toplam uyarı: **${count}**\nSebep: ${reason}`,
        ),
      ],
    });
  },
};
