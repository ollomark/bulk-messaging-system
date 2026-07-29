import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed, warnEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("DM gönderim araçları")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("gonder")
        .setDescription("Tek bir kullanıcıya DM gönderir")
        .addUserOption((opt) => opt.setName("uye").setDescription("Üye").setRequired(true))
        .addStringOption((opt) =>
          opt.setName("mesaj").setDescription("Mesaj").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("herkes")
        .setDescription("Sunucudaki üyelere toplu DM (yavaş ve dikkatli kullan)")
        .addStringOption((opt) =>
          opt.setName("mesaj").setDescription("Mesaj").setRequired(true),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("botlari_atla")
            .setDescription("Botları atla (varsayılan: true)"),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "gonder") {
      const user = interaction.options.getUser("uye", true);
      const message = interaction.options.getString("mesaj", true);
      try {
        await user.send(`📩 **${interaction.guild.name}**\n${message}`);
        await sendLog(interaction.guild, {
          title: "✉️ DM Gönderildi",
          description: `${interaction.user} → ${user}`,
          fields: [{ name: "Mesaj", value: message.slice(0, 1000) }],
        });
        return interaction.reply({
          embeds: [successEmbed(`${user} kullanıcısına DM gönderildi.`)],
          ephemeral: true,
        });
      } catch {
        return interaction.reply({
          embeds: [errorEmbed("DM gönderilemedi. Kullanıcının DM'leri kapalı olabilir.")],
          ephemeral: true,
        });
      }
    }

    if (sub === "herkes") {
      const message = interaction.options.getString("mesaj", true);
      const skipBots = interaction.options.getBoolean("botlari_atla");
      const shouldSkipBots = skipBots !== false;

      await interaction.reply({
        embeds: [
          warnEmbed(
            "Toplu DM başlatıldı. Discord limitleri nedeniyle işlem yavaş ilerler.\nBazı kullanıcılar DM kapalı olduğu için ulaşamayabilir.",
          ),
        ],
        ephemeral: true,
      });

      await interaction.guild.members.fetch();
      const members = interaction.guild.members.cache.filter((member) => {
        if (member.id === interaction.client.user.id) return false;
        if (shouldSkipBots && member.user.bot) return false;
        return true;
      });

      let ok = 0;
      let fail = 0;

      for (const member of members.values()) {
        try {
          await member.send(`📢 **${interaction.guild.name} duyurusu**\n${message}`);
          ok += 1;
        } catch {
          fail += 1;
        }
        await sleep(1200);
      }

      await sendLog(interaction.guild, {
        title: "📣 Toplu DM Tamamlandı",
        description: `${interaction.user} toplu DM gönderdi.`,
        fields: [
          { name: "Başarılı", value: String(ok), inline: true },
          { name: "Başarısız", value: String(fail), inline: true },
          { name: "Mesaj", value: message.slice(0, 900) },
        ],
      });

      return interaction.followUp({
        embeds: [successEmbed(`Toplu DM bitti. Başarılı: **${ok}** | Başarısız: **${fail}**`)],
        ephemeral: true,
      });
    }
  },
};
