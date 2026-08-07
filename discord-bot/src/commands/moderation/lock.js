import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";
import { replyThenDelete } from "../../utils/tempReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kilitle")
    .setDescription("Kanalı kilitler (herkes yazamaz)")
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep (opsiyonel)"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const reason = interaction.options.getString("sebep");
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });
    await sendLog(interaction.guild, {
      title: "🔒 Kanal Kilitlendi",
      description: [
        `${interaction.channel} · ${interaction.user}`,
        reason ? `Sebep: ${reason}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return replyThenDelete(
      interaction,
      {
        embeds: [
          successEmbed(reason ? `Kanal kilitlendi.\nSebep: ${reason}` : "Kanal kilitlendi."),
        ],
      },
      3000,
    );
  },
};
