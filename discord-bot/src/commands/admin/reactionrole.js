import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { baseEmbed, errorEmbed, successEmbed, infoEmbed } from "../../utils/embeds.js";
import {
  addReactionRole,
  buildPanelDescription,
  getLatestPanel,
  listByMessage,
  listReactionRoles,
  normalizeEmojiInput,
  parseMessageId,
  removeReactionRole,
} from "../../systems/reactionRoles.js";

async function refreshPanelEmbed(message) {
  const rows = listByMessage(message.id);
  const embed = message.embeds[0]
    ? baseEmbed(message.embeds[0].title || "🎭 Rol Seçimi", buildPanelDescription(rows))
    : baseEmbed("🎭 Rol Seçimi", buildPanelDescription(rows));

  if (message.embeds[0]?.footer?.text) {
    embed.setFooter({ text: message.embeds[0].footer.text });
  } else {
    embed.setFooter({ text: "Emojiye bas = rol al · Tekrar bas / kaldır = rol sil" });
  }

  await message.edit({ embeds: [embed] }).catch(() => null);
}

export default {
  data: new SlashCommandBuilder()
    .setName("emojirol")
    .setDescription("Emojiye basınca rol veren sistemi yönetir")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Emoji-rol paneli oluşturur")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Panelin gideceği kanal")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("baslik").setDescription("Panel başlığı").setRequired(false),
        )
        .addStringOption((opt) =>
          opt.setName("aciklama").setDescription("Üst açıklama").setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ekle")
        .setDescription("Bir panele emoji + rol ekler")
        .addStringOption((opt) =>
          opt
            .setName("emoji")
            .setDescription("Emoji (ör: ✅ veya :ozel: )")
            .setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("rol").setDescription("Verilecek rol").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("mesaj_id")
            .setDescription("Opsiyonel: mesaj ID veya mesaj linki (boşsa son panel)"),
        )
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Mesajın olduğu kanal (boşsa bu kanal)")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kur")
        .setDescription("Tek seferde mesaj atar, emoji ekler, rol bağlar")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Kanal")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("emoji").setDescription("Emoji").setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("rol").setDescription("Rol").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("baslik").setDescription("Başlık"),
        )
        .addStringOption((opt) =>
          opt.setName("aciklama").setDescription("Açıklama"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kaldir")
        .setDescription("Emoji-rol eşleşmesini siler")
        .addStringOption((opt) =>
          opt.setName("emoji").setDescription("Emoji").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("mesaj_id")
            .setDescription("Opsiyonel: mesaj ID / link (boşsa son panel)"),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("liste").setDescription("Sunucudaki emoji-rol listesini gösterir"),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const me = interaction.guild.members.me;

    if (sub === "liste") {
      const rows = listReactionRoles(interaction.guild.id);
      if (!rows.length) {
        return interaction.reply({
          embeds: [infoEmbed("Henüz emoji-rol yok. `/emojirol kur` ile başla.")],
          ephemeral: true,
        });
      }

      const text = rows
        .map(
          (row, i) =>
            `**${i + 1}.** ${row.emoji_raw} → <@&${row.role_id}> · [mesaj](https://discord.com/channels/${row.guild_id}/${row.channel_id}/${row.message_id})`,
        )
        .join("\n")
        .slice(0, 3900);

      return interaction.reply({
        embeds: [infoEmbed(text, "Emoji-Rol Listesi")],
        ephemeral: true,
      });
    }

    if (sub === "panel") {
      const channel = interaction.options.getChannel("kanal", true);
      const title = interaction.options.getString("baslik") || "🎭 Rol Seçimi";
      const description =
        interaction.options.getString("aciklama") ||
        "Aşağıdaki emojilere basarak rol alabilirsin.\nEmojiyi kaldırırsan rolün de alınır.";

      const message = await channel.send({
        embeds: [
          baseEmbed(title, `${description}\n\n*Henüz emoji eklenmedi. \`/emojirol ekle\` kullan.*`).setFooter({
            text: "Emojiye bas = rol al · Emojiyi kaldır = rol sil",
          }),
        ],
      });

      return interaction.reply({
        embeds: [
          successEmbed(
            `Panel oluşturuldu: [mesaja git](${message.url})\nŞimdi:\n\`/emojirol ekle mesaj_id:${message.id} emoji:✅ rol:@Rol\``,
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "kur") {
      const channel = interaction.options.getChannel("kanal", true);
      const role = interaction.options.getRole("rol", true);
      const emojiInput = interaction.options.getString("emoji", true);
      const title = interaction.options.getString("baslik") || "🎭 Rol Seçimi";
      const description =
        interaction.options.getString("aciklama") ||
        "Emojiye basarak rol al, tekrar kaldırarak rolü bırak.";

      const parsed = normalizeEmojiInput(emojiInput, interaction.guild);
      if (!parsed) {
        return interaction.reply({
          embeds: [errorEmbed("Geçersiz emoji. Örnek: `✅` veya sunucu emojisi.")],
          ephemeral: true,
        });
      }

      if (role.managed || role.position >= me.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed("Bu rolü veremem. Bot rolünü yukarı taşı.")],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const message = await channel.send({
        embeds: [
          baseEmbed(title, `${description}\n\n${parsed.display} → ${role}`).setFooter({
            text: "Emojiye bas = rol al · Emojiyi kaldır = rol sil",
          }),
        ],
      });

      try {
        await message.react(parsed.reactValue);
      } catch {
        await message.delete().catch(() => null);
        return interaction.editReply({
          embeds: [errorEmbed("Emojiye tepki eklenemedi. Botun emojiyi kullanabildiğinden emin ol.")],
        });
      }

      addReactionRole({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: message.id,
        emojiKey: parsed.emojiKey,
        emojiRaw: parsed.display,
        roleId: role.id,
      });

      return interaction.editReply({
        embeds: [successEmbed(`Hazır! ${parsed.display} → ${role}\n[Mesaja git](${message.url})`)],
      });
    }

    if (sub === "ekle") {
      const emojiInput = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("rol", true);
      const channel =
        interaction.options.getChannel("kanal") || interaction.channel;
      let messageId = parseMessageId(interaction.options.getString("mesaj_id"));

      if (!messageId) {
        const latest = getLatestPanel(interaction.guild.id, channel.id) || getLatestPanel(interaction.guild.id);
        messageId = latest?.message_id || null;
      }

      const parsed = normalizeEmojiInput(emojiInput, interaction.guild);
      if (!parsed) {
        return interaction.reply({
          embeds: [errorEmbed("Geçersiz emoji.")],
          ephemeral: true,
        });
      }

      if (role.managed || role.position >= me.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed("Bu rolü veremem. Bot rolünü yukarı taşı.")],
          ephemeral: true,
        });
      }

      if (!messageId) {
        return interaction.reply({
          embeds: [
            errorEmbed(
              "Panel bulunamadı.\nEn kolayı: `/emojirol kur` (mesaj ID istemez)\nveya önce `/emojirol panel` oluştur.",
            ),
          ],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      let message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        const latest = getLatestPanel(interaction.guild.id);
        if (latest) {
          const other = await interaction.guild.channels.fetch(latest.channel_id).catch(() => null);
          if (other?.isTextBased()) {
            message = await other.messages.fetch(messageId).catch(() => null);
          }
        }
      }
      if (!message) {
        return interaction.editReply({
          embeds: [errorEmbed("Mesaj bulunamadı. `/emojirol kur` kullanman daha kolay.")],
        });
      }

      try {
        await message.react(parsed.reactValue);
      } catch {
        return interaction.editReply({
          embeds: [errorEmbed("Bu emojiye tepki eklenemedi.")],
        });
      }

      addReactionRole({
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: message.id,
        emojiKey: parsed.emojiKey,
        emojiRaw: parsed.display,
        roleId: role.id,
      });

      await refreshPanelEmbed(message);

      return interaction.editReply({
        embeds: [successEmbed(`Eklendi: ${parsed.display} → ${role}`)],
      });
    }

    if (sub === "kaldir") {
      const emojiInput = interaction.options.getString("emoji", true);
      let messageId = parseMessageId(interaction.options.getString("mesaj_id"));
      if (!messageId) {
        messageId = getLatestPanel(interaction.guild.id)?.message_id || null;
      }

      const parsed = normalizeEmojiInput(emojiInput, interaction.guild);
      if (!parsed) {
        return interaction.reply({
          embeds: [errorEmbed("Geçersiz emoji.")],
          ephemeral: true,
        });
      }

      if (!messageId) {
        return interaction.reply({
          embeds: [errorEmbed("Silinecek panel bulunamadı.")],
          ephemeral: true,
        });
      }

      const removed = removeReactionRole(messageId, parsed.emojiKey);
      return interaction.reply({
        embeds: [
          removed
            ? successEmbed("Emoji-rol eşleşmesi silindi.")
            : errorEmbed("Böyle bir eşleşme bulunamadı."),
        ],
        ephemeral: true,
      });
    }
  },
};
