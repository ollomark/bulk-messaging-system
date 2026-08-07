import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { successEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";
import { replyThenDelete } from "../../utils/tempReply.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kilidiac")
    .setDescription("Kanal kilidini açar")
    .addStringOption((opt) => opt.setName("sebep").setDescription("Sebep (opsiyonel)"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const reason = interaction.options.getString("sebep");
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });
    await sendLog(interaction.guild, {
      title: "🔓 Kanal Kilidi Açıldı",
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
          successEmbed(
            reason ? `Kanal kilidi açıldı.\nSebep: ${reason}` : "Kanal kilidi açıldı.",
          ),
        ],
      },
      3000,
    );
  },
};
