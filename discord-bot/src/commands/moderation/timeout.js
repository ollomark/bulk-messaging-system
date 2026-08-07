import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { parseDuration, formatDuration } from "../../utils/time.js";
import { sendLog } from "../../systems/logger.js";
import { createCase } from "../../systems/cases.js";

export default {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Üyeye süreyle susturma (timeout) uygular")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
    .addStringOption((opt) =>
      opt.setName("sure").setDescription("Örn: 10m, 1h, 1d").setRequired(true),
    )
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("uye", true);
    const durationRaw = interaction.options.getString("sure", true);
    const reason = interaction.options.getString("sebep") || "Sebep belirtilmedi";
    const duration = parseDuration(durationRaw);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!duration || duration > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        embeds: [errorEmbed("Geçersiz süre. Max 28 gün. Örnek: `10m`, `2h`, `1d`")],
        ephemeral: true,
      });
    }
    if (!member?.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed("Bu üyeye timeout uygulayamıyorum.")],
        ephemeral: true,
      });
    }

    await member.timeout(duration, `${interaction.user.tag}: ${reason}`);

    const caseNo = createCase({
      guildId: interaction.guild.id,
      type: "timeout",
      userId: user.id,
      moderatorId: interaction.user.id,
      reason: `${formatDuration(duration)} · ${reason}`,
    });

    await sendLog(interaction.guild, {
      title: `⏳ Timeout · Case #${caseNo}`,
      description: `${user} ${formatDuration(duration)} susturuldu.`,
      color: 0xfee75c,
      fields: [
        { name: "Moderatör", value: `${interaction.user}`, inline: true },
        { name: "Case", value: `#${caseNo}`, inline: true },
        { name: "Sebep", value: reason },
      ],
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `${user} ${formatDuration(duration)} timeout.\nCase **#${caseNo}** · ${reason}`,
        ),
      ],
    });
  },
};
