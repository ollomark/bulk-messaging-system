import { ChannelType, SlashCommandBuilder } from "discord.js";
import db from "../../database/db.js";
import { isOwner } from "../../utils/permissions.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { premiumEmbed, brand } from "../../utils/brand.js";

const ANON_WEBHOOK_NAME = "Anonim";
const ANON_AVATAR =
  "https://cdn.discordapp.com/embed/avatars/1.png";

db.exec(`
  CREATE TABLE IF NOT EXISTS anonymous_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT,
    owner_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

async function getAnonWebhook(channel) {
  const hooks = await channel.fetchWebhooks();
  let hook = hooks.find((h) => h.name === ANON_WEBHOOK_NAME && h.owner?.id === channel.client.user.id);
  if (!hook) {
    hook = await channel.createWebhook({
      name: ANON_WEBHOOK_NAME,
      avatar: ANON_AVATAR,
      reason: "Anonim mesaj sistemi",
    });
  }
  return hook;
}

export default {
  data: new SlashCommandBuilder()
    .setName("anonim")
    .setDescription("Gizli anonim mesaj gönder (sadece bot sahibi)")
    .addSubcommand((sub) =>
      sub
        .setName("gonder")
        .setDescription("Kanala anonim mesaj atar (webhook ile, bot görünmez)")
        .addStringOption((opt) =>
          opt.setName("mesaj").setDescription("Gönderilecek metin").setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Hedef kanal (boşsa bu kanal)")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        )
        .addStringOption((opt) =>
          opt
            .setName("isim")
            .setDescription("Görünecek isim (varsayılan: Anonim)")
            .setMaxLength(80),
        )
        .addBooleanOption((opt) =>
          opt.setName("embed").setDescription("Embed olarak mı gitsin? (varsayılan: hayır)"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("gecmis")
        .setDescription("Sadece senin görebileceğin anonim geçmiş (son 10)"),
    ),
  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed("Bu komutu sadece bot sahibi kullanabilir.")],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "gecmis") {
      const rows = db
        .prepare(
          `SELECT * FROM anonymous_messages
           WHERE guild_id = ? AND owner_id = ?
           ORDER BY id DESC LIMIT 10`,
        )
        .all(interaction.guild.id, interaction.user.id);

      if (!rows.length) {
        return interaction.reply({
          embeds: [successEmbed("Henüz anonim mesaj yok.")],
          ephemeral: true,
        });
      }

      const text = rows
        .map(
          (r) =>
            `\`#${r.id}\` <#${r.channel_id}> · <t:${Math.floor(r.created_at / 1000)}:R>\n${r.content.slice(0, 120)}`,
        )
        .join("\n\n");

      return interaction.reply({
        embeds: [
          premiumEmbed({
            title: "🕵️ Anonim Geçmiş (gizli)",
            description: text,
            color: brand.colors.dark,
            footer: "Bu listeyi sadece sen görürsün",
          }),
        ],
        ephemeral: true,
      });
    }

    const content = interaction.options.getString("mesaj", true).replaceAll("\\n", "\n");
    const channel = interaction.options.getChannel("kanal") || interaction.channel;
    const displayName = interaction.options.getString("isim") || ANON_WEBHOOK_NAME;
    const useEmbed = interaction.options.getBoolean("embed") === true;

    if (!channel?.isTextBased?.() || typeof channel.fetchWebhooks !== "function") {
      return interaction.reply({
        embeds: [errorEmbed("Bu kanalda webhook ile anonim mesaj atılamaz.")],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    let webhook;
    try {
      webhook = await getAnonWebhook(channel);
    } catch (error) {
      return interaction.editReply({
        embeds: [
          errorEmbed(
            `Webhook oluşturulamadı: ${error.message}\nBota **Webhook Yönet** izni ver.`,
          ),
        ],
      });
    }

    const payload = {
      username: displayName.slice(0, 80),
      avatarURL: ANON_AVATAR,
      allowedMentions: { parse: [] },
    };

    if (useEmbed) {
      payload.embeds = [
        premiumEmbed({
          description: content,
          color: brand.colors.dark,
          footer: "Anonim",
        }),
      ];
    } else {
      payload.content = content;
    }

    let sent;
    try {
      sent = await webhook.send(payload);
    } catch (error) {
      return interaction.editReply({
        embeds: [errorEmbed(`Mesaj gönderilemedi: ${error.message}`)],
      });
    }

    db.prepare(
      `INSERT INTO anonymous_messages
       (guild_id, channel_id, message_id, owner_id, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      interaction.guild.id,
      channel.id,
      sent.id,
      interaction.user.id,
      content,
      Date.now(),
    );

    return interaction.editReply({
      embeds: [
        successEmbed(
          `Anonim mesaj **webhook** ile gitti (Lexyxzon görünmez).\nGörünen isim: **${displayName}**\nKanal: ${channel}\n[Mesaja git](${sent.url})`,
        ),
      ],
    });
  },
};
