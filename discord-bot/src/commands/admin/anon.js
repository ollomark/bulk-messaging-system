import { ChannelType, SlashCommandBuilder } from "discord.js";
import db from "../../database/db.js";
import { isOwner } from "../../utils/permissions.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import { premiumEmbed, brand } from "../../utils/brand.js";

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

export default {
  data: new SlashCommandBuilder()
    .setName("anonim")
    .setDescription("Gizli anonim mesaj gönder (sadece bot sahibi)")
    .addSubcommand((sub) =>
      sub
        .setName("gonder")
        .setDescription("Kanala anonim mesaj atar")
        .addStringOption((opt) =>
          opt.setName("mesaj").setDescription("Gönderilecek metin").setRequired(true),
        )
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Hedef kanal (boşsa bu kanal)")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        )
        .addBooleanOption((opt) =>
          opt.setName("embed").setDescription("Embed olarak mı gitsin? (varsayılan: evet)"),
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

    const content = interaction.options.getString("mesaj", true);
    const channel = interaction.options.getChannel("kanal") || interaction.channel;
    const asEmbed = interaction.options.getBoolean("embed");
    const useEmbed = asEmbed !== false;

    if (!channel?.isTextBased()) {
      return interaction.reply({
        embeds: [errorEmbed("Geçersiz kanal.")],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    let sent;
    if (useEmbed) {
      sent = await channel.send({
        embeds: [
          premiumEmbed({
            title: "🕵️ Anonim Mesaj",
            description: content.replaceAll("\\n", "\n"),
            color: brand.colors.dark,
            footer: "Gönderen gizli",
          }),
        ],
      });
    } else {
      sent = await channel.send({
        content: `🕵️ **Anonim Mesaj**\n${content.replaceAll("\\n", "\n")}`,
        allowedMentions: { parse: [] },
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
          `Anonim mesaj gönderildi.\nKanal: ${channel}\n[Mesaja git](${sent.url})\n\nKimse senin gönderdiğini görmez.`,
        ),
      ],
    });
  },
};
