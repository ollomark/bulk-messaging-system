import { SlashCommandBuilder } from "discord.js";
import { addReminder } from "../../systems/reminders.js";
import { parseDuration, formatDuration } from "../../utils/time.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("hatirlat")
    .setDescription("Belirli süre sonra hatırlatma gönderir")
    .addStringOption((opt) =>
      opt.setName("sure").setDescription("Örn: 10m, 2h, 1d").setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName("mesaj").setDescription("Hatırlatma metni").setRequired(true),
    ),
  async execute(interaction) {
    const duration = parseDuration(interaction.options.getString("sure", true));
    const content = interaction.options.getString("mesaj", true);
    if (!duration || duration > 30 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        embeds: [errorEmbed("Geçersiz süre. Max 30 gün. Örnek: `20m`, `3h`, `1d`")],
        ephemeral: true,
      });
    }

    const id = addReminder({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      channelId: interaction.channel.id,
      content,
      remindAt: Date.now() + duration,
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          `Hatırlatma #${id} kuruldu.\nSüre: **${formatDuration(duration)}**\nMesaj: ${content}`,
        ),
      ],
      ephemeral: true,
    });
  },
};
