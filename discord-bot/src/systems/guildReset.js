import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from "discord.js";
import { isOwner } from "../utils/permissions.js";
import { errorEmbed, successEmbed, warnEmbed } from "../utils/embeds.js";
import { updateSettings } from "../database/settings.js";

const DELETE_BATCH = 8;
const BATCH_DELAY_MS = 200;
const DEFAULT_CHANNEL_NAME = "sk-keyfı";
const DEFAULT_CHANNEL_COUNT = 10;

/** guildId:userId → { count, name } */
const pendingReset = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugChannelName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 100);
}

function confirmRow(guildId, userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`guild_reset_confirm:${guildId}:${userId}`)
      .setLabel("Evet, sil ve aç")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("guild_reset_cancel")
      .setLabel("İptal")
      .setStyle(ButtonStyle.Secondary),
  );
}

async function deleteInBatches(channels) {
  let deleted = 0;
  let failed = 0;
  const list = [...channels];

  for (let i = 0; i < list.length; i += DELETE_BATCH) {
    const batch = list.slice(i, i + DELETE_BATCH);
    const results = await Promise.allSettled(
      batch.map((ch) => ch.delete("Sunucu sıfırlama")),
    );
    for (const r of results) {
      if (r.status === "fulfilled") deleted += 1;
      else failed += 1;
    }
    if (i + DELETE_BATCH < list.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return { deleted, failed };
}

function clearGuildChannelSettings(guildId) {
  updateSettings(guildId, {
    log_channel_id: null,
    welcome_channel_id: null,
    goodbye_channel_id: null,
    announce_channel_id: null,
    suggest_channel_id: null,
    starboard_channel_id: null,
    ticket_category_id: null,
    ticket_log_channel_id: null,
    temp_voice_category_id: null,
    temp_voice_channel_id: null,
    apply_channel_id: null,
    level_channel_id: null,
    verify_channel_id: null,
  });
}

export async function runGuildReset(guild, channelName, channelCount) {
  await guild.channels.fetch();
  const all = [...guild.channels.cache.values()];

  const categories = all.filter((ch) => ch.type === ChannelType.GuildCategory);
  const others = all.filter((ch) => ch.type !== ChannelType.GuildCategory);

  const deleteOthers = await deleteInBatches(others);
  const deleteCategories = await deleteInBatches(categories);

  const base = slugChannelName(channelName) || DEFAULT_CHANNEL_NAME;
  const createJobs = [];

  for (let i = 1; i <= channelCount; i += 1) {
    const name = i === 1 ? base : `${base}-${i}`;
    createJobs.push(
      guild.channels.create({
        name,
        type: ChannelType.GuildText,
        reason: "Sunucu sıfırlama",
      }),
    );
  }
  const created = await Promise.all(createJobs);

  clearGuildChannelSettings(guild.id);

  return {
    deleted: deleteOthers.deleted + deleteCategories.deleted,
    failed: deleteOthers.failed + deleteCategories.failed,
    created,
  };
}

export async function startGuildResetConfirm(interaction) {
  if (!isOwner(interaction.user.id)) {
    return interaction.reply({
      embeds: [errorEmbed("Bu komut sadece bot sahibi içindir.")],
      ephemeral: true,
    });
  }

  const count =
    interaction.options.getInteger("sayi") ?? DEFAULT_CHANNEL_COUNT;
  const rawName =
    interaction.options.getString("isim") ?? DEFAULT_CHANNEL_NAME;
  const name = slugChannelName(rawName) || DEFAULT_CHANNEL_NAME;

  pendingReset.set(`${interaction.guild.id}:${interaction.user.id}`, { count, name });

  return interaction.reply({
    embeds: [
      warnEmbed(
        [
          `**${interaction.guild.name}** sunucusundaki **tüm kanallar** silinecek.`,
          `Ardından **${count}** adet \`#${name}\` kanalı açılacak.`,
          "",
          "Log, ticket, hoş geldin vb. kanal ayarları sıfırlanır.",
          "",
          "**Emin misin?**",
        ].join("\n"),
        "⚠️ Sunucu sıfırlama",
      ),
    ],
    components: [confirmRow(interaction.guild.id, interaction.user.id)],
    ephemeral: true,
  });
}

export async function confirmGuildReset(interaction) {
  const parts = interaction.customId.split(":");
  const guildId = parts[1];
  const ownerId = parts[2];

  if (!isOwner(interaction.user.id) || interaction.user.id !== ownerId) {
    return interaction.reply({
      embeds: [errorEmbed("Bu işlemi sadece başlatan bot sahibi onaylayabilir.")],
      ephemeral: true,
    });
  }

  if (interaction.guild.id !== guildId) {
    return interaction.reply({
      embeds: [errorEmbed("Sunucu eşleşmiyor.")],
      ephemeral: true,
    });
  }

  await interaction.update({
    embeds: [
      warnEmbed("Kanallar siliniyor, yeni kanallar açılıyor…", "⏳ İşlem sürüyor"),
    ],
    components: [],
  });

  const pendingKey = `${guildId}:${ownerId}`;
  const pending = pendingReset.get(pendingKey) || {
    count: DEFAULT_CHANNEL_COUNT,
    name: DEFAULT_CHANNEL_NAME,
  };
  pendingReset.delete(pendingKey);

  try {
    const result = await runGuildReset(
      interaction.guild,
      pending.name,
      pending.count,
    );
    const channelMentions = result.created.map((ch) => `<#${ch.id}>`).join(" ");

    return interaction.followUp({
      embeds: [
        successEmbed(
          [
            `Silinen: **${result.deleted}** kanal`,
            result.failed ? `Başarısız: **${result.failed}**` : null,
            `Açılan: **${result.created.length}** kanal`,
            channelMentions,
          ]
            .filter(Boolean)
            .join("\n"),
          "✅ Sunucu sıfırlandı",
        ),
      ],
      ephemeral: true,
    });
  } catch (e) {
    console.error("guild-reset", e);
    return interaction.followUp({
      embeds: [errorEmbed(`Hata: ${e.message}`)],
      ephemeral: true,
    });
  }
}

export async function cancelGuildReset(interaction) {
  pendingReset.delete(`${interaction.guild.id}:${interaction.user.id}`);
  return interaction.update({
    embeds: [warnEmbed("Sunucu sıfırlama iptal edildi.")],
    components: [],
  });
}
