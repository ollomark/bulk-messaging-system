import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import db from "../database/db.js";
import { config } from "../config.js";

export function buildGiveawayEmbed(prize, winners, endsAt, hostId, ended = false, winnerMentions = null) {
  const embed = new EmbedBuilder()
    .setColor(ended ? 0xed4245 : config.embedColor)
    .setTitle(ended ? "🎉 Çekiliş Sona Erdi" : "🎉 Çekiliş")
    .setDescription(
      [
        `**Ödül:** ${prize}`,
        `**Kazanan sayısı:** ${winners}`,
        `**Bitiş:** <t:${Math.floor(endsAt / 1000)}:R>`,
        `**Başlatan:** <@${hostId}>`,
        ended
          ? `**Kazananlar:** ${winnerMentions || "Yeterli katılım yok"}`
          : "Katılmak için 🎉 butonuna tıkla!",
      ].join("\n"),
    )
    .setTimestamp(endsAt);

  return embed;
}

export function buildGiveawayComponents(disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("giveaway_join")
        .setLabel("Katıl")
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
    ),
  ];
}

export function createGiveawayRecord({ messageId, channelId, guildId, hostId, prize, winners, endsAt }) {
  db.prepare(
    `INSERT INTO giveaways (message_id, channel_id, guild_id, host_id, prize, winners, ends_at, ended)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
  ).run(messageId, channelId, guildId, hostId, prize, winners, endsAt);
}

export function addEntry(messageId, userId) {
  const exists = db
    .prepare("SELECT 1 FROM giveaway_entries WHERE message_id = ? AND user_id = ?")
    .get(messageId, userId);
  if (exists) return false;
  db.prepare("INSERT INTO giveaway_entries (message_id, user_id) VALUES (?, ?)").run(messageId, userId);
  return true;
}

export function getEntries(messageId) {
  return db.prepare("SELECT user_id FROM giveaway_entries WHERE message_id = ?").all(messageId);
}

export function getActiveGiveaways() {
  return db.prepare("SELECT * FROM giveaways WHERE ended = 0").all();
}

export function getGiveaway(messageId) {
  return db.prepare("SELECT * FROM giveaways WHERE message_id = ?").get(messageId);
}

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (pool.length && winners.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}

export async function endGiveaway(client, messageId) {
  const giveaway = getGiveaway(messageId);
  if (!giveaway || giveaway.ended) return;

  db.prepare("UPDATE giveaways SET ended = 1 WHERE message_id = ?").run(messageId);
  const entries = getEntries(messageId).map((row) => row.user_id);
  const winners = pickWinners(entries, giveaway.winners);
  const mentions = winners.length ? winners.map((id) => `<@${id}>`).join(", ") : null;

  const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel?.isTextBased()) return;

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (message) {
    await message.edit({
      embeds: [
        buildGiveawayEmbed(
          giveaway.prize,
          giveaway.winners,
          giveaway.ends_at,
          giveaway.host_id,
          true,
          mentions,
        ),
      ],
      components: buildGiveawayComponents(true),
    });
  }

  await channel.send({
    content: mentions
      ? `🎉 Tebrikler ${mentions}! **${giveaway.prize}** kazandınız.`
      : `Çekiliş bitti ama yeterli katılım olmadı. Ödül: **${giveaway.prize}**`,
  });
}

export function startGiveawayScheduler(client) {
  setInterval(async () => {
    const active = getActiveGiveaways();
    const now = Date.now();
    for (const giveaway of active) {
      if (giveaway.ends_at <= now) {
        await endGiveaway(client, giveaway.message_id).catch(() => null);
      }
    }
  }, 15_000);
}
