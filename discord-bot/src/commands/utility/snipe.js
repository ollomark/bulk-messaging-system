import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getSnipe } from "../../systems/snipe.js";
import { infoEmbed, warnEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("Son silinen mesajı gösterir")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const data = getSnipe(interaction.channel.id);
    if (!data) {
      return interaction.reply({
        embeds: [warnEmbed("Bu kanalda yakalanmış silinen mesaj yok.")],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [
        infoEmbed(data.content || "*içerik yok*", "🕵️ Snipe")
          .setAuthor({ name: data.authorTag, iconURL: data.authorAvatar || undefined })
          .setFooter({ text: `Silinme: ${new Date(data.deletedAt).toLocaleString("tr-TR")}` }),
      ],
    });
  },
};
