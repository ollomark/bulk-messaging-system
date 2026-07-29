import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
  buildGiveawayComponents,
  buildGiveawayEmbed,
  createGiveawayRecord,
  endGiveaway,
} from "../../systems/giveaways.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { parseDuration } from "../../utils/time.js";

export default {
  data: new SlashCommandBuilder()
    .setName("cekilis")
    .setDescription("Çekiliş sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("baslat")
        .setDescription("Yeni çekiliş başlatır")
        .addStringOption((opt) => opt.setName("odul").setDescription("Ödül").setRequired(true))
        .addStringOption((opt) =>
          opt.setName("sure").setDescription("Örn: 10m, 1h, 1d").setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("kazanan")
            .setDescription("Kazanan sayısı")
            .setMinValue(1)
            .setMaxValue(20),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("bitir")
        .setDescription("Çekilişi erken bitirir")
        .addStringOption((opt) =>
          opt.setName("mesaj_id").setDescription("Çekiliş mesaj ID").setRequired(true),
        ),
    ),
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === "baslat") {
      const prize = interaction.options.getString("odul", true);
      const duration = parseDuration(interaction.options.getString("sure", true));
      const winners = interaction.options.getInteger("kazanan") || 1;

      if (!duration) {
        return interaction.reply({
          embeds: [errorEmbed("Geçersiz süre. Örnek: `30m`, `2h`, `1d`")],
          ephemeral: true,
        });
      }

      const endsAt = Date.now() + duration;
      const message = await interaction.channel.send({
        embeds: [buildGiveawayEmbed(prize, winners, endsAt, interaction.user.id)],
        components: buildGiveawayComponents(),
      });

      createGiveawayRecord({
        messageId: message.id,
        channelId: interaction.channel.id,
        guildId: interaction.guild.id,
        hostId: interaction.user.id,
        prize,
        winners,
        endsAt,
      });

      return interaction.reply({
        embeds: [successEmbed(`Çekiliş başladı: [mesaja git](${message.url})`)],
        ephemeral: true,
      });
    }

    if (sub === "bitir") {
      const messageId = interaction.options.getString("mesaj_id", true);
      await endGiveaway(client, messageId);
      return interaction.reply({
        embeds: [successEmbed("Çekiliş sonlandırıldı.")],
        ephemeral: true,
      });
    }
  },
};
