import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import db from "../../database/db.js";
import { successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Üyeye uyarı verir")
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

    const count = db
      .prepare("SELECT COUNT(*) AS c FROM warnings WHERE guild_id = ? AND user_id = ?")
      .get(interaction.guild.id, user.id).c;

    await user
      .send(`**${interaction.guild.name}** sunucusunda uyarı aldın.\nSebep: ${reason}\nToplam uyarı: ${count}`)
      .catch(() => null);

    await sendLog(interaction.guild, {
      title: "⚠️ Uyarı",
      description: `${user} uyarıldı.`,
      color: 0xfee75c,
      fields: [
        { name: "Moderatör", value: `${interaction.user}`, inline: true },
        { name: "Toplam", value: String(count), inline: true },
        { name: "Sebep", value: reason },
      ],
    });

    return interaction.reply({
      embeds: [successEmbed(`${user} uyarıldı. Toplam uyarı: **${count}**\nSebep: ${reason}`)],
    });
  },
};
