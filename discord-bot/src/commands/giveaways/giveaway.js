import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
  buildGiveawayComponents,
  buildGiveawayEmbed,
  createGiveawayRecord,
  endGiveaway,
  getGiveaway,
  setFixedWinner,
} from "../../systems/giveaways.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { parseDuration } from "../../utils/time.js";
import { isOwner } from "../../utils/permissions.js";

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
        )
        .addUserOption((opt) =>
          opt
            .setName("kisi")
            .setDescription("Gizli kazanan (sadece bot sahibi)"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("sabitle")
        .setDescription("Aktif çekilişin gizli kazananını ayarlar (sadece bot sahibi)")
        .addStringOption((opt) =>
          opt.setName("mesaj_id").setDescription("Çekiliş mesaj ID").setRequired(true),
        )
        .addUserOption((opt) =>
          opt.setName("kisi").setDescription("Kazanacak kişi").setRequired(true),
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
      const fixedUser = interaction.options.getUser("kisi");

      if (fixedUser && !isOwner(interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed("Gizli kazanan ayarı sadece bot sahibi içindir.")],
          ephemeral: true,
        });
      }

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
        fixedWinnerId: fixedUser?.id || null,
      });

      const extra = fixedUser
        ? `\n🔒 Gizli kazanan: ${fixedUser} (\`${fixedUser.id}\`)`
        : "";

      return interaction.reply({
        embeds: [successEmbed(`Çekiliş başladı: [mesaja git](${message.url})${extra}`)],
        ephemeral: true,
      });
    }

    if (sub === "sabitle") {
      if (!isOwner(interaction.user.id)) {
        return interaction.reply({
          embeds: [errorEmbed("Bu komut sadece bot sahibi içindir.")],
          ephemeral: true,
        });
      }

      const messageId = interaction.options.getString("mesaj_id", true);
      const user = interaction.options.getUser("kisi", true);
      const giveaway = getGiveaway(messageId);

      if (!giveaway || giveaway.guild_id !== interaction.guild.id) {
        return interaction.reply({
          embeds: [errorEmbed("Bu sunucuda aktif çekiliş bulunamadı.")],
          ephemeral: true,
        });
      }
      if (giveaway.ended) {
        return interaction.reply({
          embeds: [errorEmbed("Bu çekiliş zaten bitmiş.")],
          ephemeral: true,
        });
      }

      setFixedWinner(messageId, user.id);
      return interaction.reply({
        embeds: [
          successEmbed(
            `Gizli kazanan ayarlandı: ${user} (\`${user.id}\`)\nMesaj: \`${messageId}\``,
          ),
        ],
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
