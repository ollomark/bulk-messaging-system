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
        .setName("isim")
        .setDescription("Oluşturulacak kanal adı (varsayılan: xzon)")
        .setMaxLength(32),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("adet")
        .setDescription("Kaç kanal açılsın (varsayılan: 50)")
        .setMinValue(1)
        .setMaxValue(100),
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

    const baseName = String(interaction.options.getString("isim") || "xzon")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9ğüşıöç\-]/gi, "")
      .slice(0, 32) || "xzon";
    const count = interaction.options.getInteger("adet") || 50;

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

    for (const ch of channels) {
      const ok = await deleteChannel(ch, me);
      if (ok) deleted += 1;
      else failed += 1;
      await sleep(250);
    }

    let created = 0;
    let createFail = 0;
    const firstIds = [];

    for (let i = 1; i <= count; i += 1) {
      // Discord aynı isme izin verir; hepsi "xzon"
      try {
        const ch = await guild.channels.create({
          name: baseName,
          type: ChannelType.GuildText,
          reason: "sunucu-temizle — xzon doldurma",
        });
        created += 1;
        if (firstIds.length < 3) firstIds.push(`${ch}`);
        await sleep(300);
      } catch {
        createFail += 1;
        await sleep(600);
      }
    }

    await sendLog(guild, {
      title: "🧨 Sunucu Temizleme",
      description: `${interaction.user} tüm kanalları sildi.\nSilinen: **${deleted}** · Hata: **${failed}**\nAçılan: **${created}× #${baseName}**`,
      color: 0xed4245,
    }).catch(() => null);

    return interaction.editReply({
      embeds: [
        successEmbed(
          `**${deleted}** kanal silindi${failed ? ` · ${failed} atlandı` : ""}.\n**${created}** × \`#${baseName}\` açıldı${createFail ? ` · ${createFail} oluşmadı` : ""}.${firstIds.length ? `\nÖrnek: ${firstIds.join(" ")}` : ""}`,
        ),
      ],
    });
  },
};
