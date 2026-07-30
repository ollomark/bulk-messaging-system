import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { hasAdminPerms } from "../../utils/permissions.js";
import { sendLog } from "../../systems/logger.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function deleteChannel(ch, me) {
  try {
    if (ch.permissionOverwrites?.edit && me) {
      await ch.permissionOverwrites
        .edit(me.id, { ViewChannel: true, ManageChannels: true, Connect: true })
        .catch(() => null);
    }
    await ch.delete("sunucu-temizle");
    return true;
  } catch {
    return false;
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName("sunucu-temizle")
    .setDescription("Tüm kanalları anında siler (Yönetici)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption((opt) =>
      opt
        .setName("birak")
        .setDescription("Sonda kalacak kanal adı (varsayılan: genel)")
        .setMaxLength(32),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        embeds: [errorEmbed("Bu komut sadece sunucuda kullanılır.")],
        ephemeral: true,
      });
    }

    if (!hasAdminPerms(interaction.member)) {
      return interaction.reply({
        embeds: [errorEmbed("Bu komut sadece yöneticiler içindir.")],
        ephemeral: true,
      });
    }

    const me = interaction.guild.members.me || (await interaction.guild.members.fetchMe());
    if (!me.permissions.has(PermissionFlagsBits.Administrator) && !me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        embeds: [errorEmbed("Botun Kanalları Yönet / Administrator yetkisi yok.")],
        ephemeral: true,
      });
    }

    const keepName = String(interaction.options.getString("birak") || "genel")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9ğüşıöç\-]/gi, "")
      .slice(0, 32) || "genel";

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    await guild.channels.fetch();

    if (guild.features.includes("COMMUNITY")) {
      try {
        await guild.edit({
          features: guild.features.filter((f) => f !== "COMMUNITY"),
          rulesChannel: null,
          publicUpdatesChannel: null,
          reason: "sunucu-temizle",
        });
        await sleep(400);
        await guild.channels.fetch();
      } catch {
        /* community kapanmazsa devam */
      }
    }

    const channels = [...guild.channels.cache.values()].sort((a, b) => {
      if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
      if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
      return 0;
    });

    let deleted = 0;
    let failed = 0;

    // Paralel değil — rate limit; ama gecikme kısa (anında his)
    for (const ch of channels) {
      const ok = await deleteChannel(ch, me);
      if (ok) deleted += 1;
      else failed += 1;
      await sleep(250);
    }

    let landing = null;
    try {
      landing = await guild.channels.create({
        name: keepName,
        type: ChannelType.GuildText,
        reason: "sunucu-temizle — kalan kanal",
      });
    } catch (error) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            `Kanallar silindi (${deleted}) ama kalan kanal açılamadı: ${error.message}`,
          ),
        ],
      });
    }

    await sendLog(guild, {
      title: "🧨 Sunucu Temizleme",
      description: `${interaction.user} tüm kanalları sildi.\nSilinen: **${deleted}** · Hata: **${failed}**\nKalan: ${landing}`,
      color: 0xed4245,
    }).catch(() => null);

    return interaction.editReply({
      embeds: [
        successEmbed(
          `**${deleted}** kanal silindi${failed ? ` · ${failed} atlandı` : ""}.\nKalan kanal: ${landing}`,
        ),
      ],
    });
  },
};
