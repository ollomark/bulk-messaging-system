import { SlashCommandBuilder } from "discord.js";
import { infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Kullanıcı avatarını gösterir")
    .addUserOption((opt) => opt.setName("uye").setDescription("Üye")),
  async execute(interaction) {
    const user = interaction.options.getUser("uye") || interaction.user;
    const url = user.displayAvatarURL({ size: 1024 });
    return interaction.reply({
      embeds: [infoEmbed(`[Avatar linki](${url})`, `${user.tag}`).setImage(url)],
    });
  },
};
