import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { updateSettings, getSettings } from "../../database/settings.js";
import { successEmbed, infoEmbed } from "../../utils/embeds.js";
import { sendLog } from "../../systems/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ayarlar")
    .setDescription("Sunucu bot ayarlarını yönetir")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("goruntule")
        .setDescription("Mevcut ayarları gösterir"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("log")
        .setDescription("Log kanalını ayarlar")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Log kanalı")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("hosgeldin")
        .setDescription("Hoş geldin kanalı ve mesajı")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Hoş geldin kanalı")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("mesaj")
            .setDescription("Değişkenler: {user} {username} {server} {memberCount}"),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("sil_saniye")
            .setDescription("Mesaj kaç sn sonra silinsin (0 = silme)")
            .setMinValue(0)
            .setMaxValue(600),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("vedamesaji")
        .setDescription("Görüşürüz kanalı")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Kanal")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        )
        .addStringOption((opt) => opt.setName("mesaj").setDescription("Mesaj şablonu")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("otorol")
        .setDescription("Katılınca verilecek rol")
        .addRoleOption((opt) => opt.setName("rol").setDescription("Rol").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("duyuru-kanal")
        .setDescription("Varsayılan duyuru kanalı")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Kanal")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("seviye-kanal")
        .setDescription("Seviye atlama bildirim kanalı")
        .addChannelOption((opt) =>
          opt
            .setName("kanal")
            .setDescription("Kanal")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ticket")
        .setDescription("Ticket sistem ayarları")
        .addChannelOption((opt) =>
          opt
            .setName("kategori")
            .setDescription("Ticket kategorisi")
            .addChannelTypes(ChannelType.GuildCategory),
        )
        .addRoleOption((opt) => opt.setName("destek_rolu").setDescription("Destek ekibi rolü"))
        .addChannelOption((opt) =>
          opt
            .setName("log")
            .setDescription("Ticket log kanalı")
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "goruntule") {
      const s = getSettings(interaction.guild.id);
      const envLog = process.env.LOG_CHANNEL_ID;
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `**Log:** ${s.log_channel_id ? `<#${s.log_channel_id}>` : "Yok"}`,
              envLog && s.log_channel_id !== envLog
                ? `_(Env LOG_CHANNEL_ID var ama slash ayarı öncelikli)_`
                : envLog && !s.log_channel_id
                  ? `_(Env seed: <#${envLog}>)_`
                  : null,
              `**Hoş geldin:** ${s.welcome_channel_id ? `<#${s.welcome_channel_id}>` : "Yok"} (sil: ${s.welcome_delete_after}s)`,
              `**Veda:** ${s.goodbye_channel_id ? `<#${s.goodbye_channel_id}>` : "Yok"}`,
              `**Oto rol:** ${s.auto_role_id ? `<@&${s.auto_role_id}>` : "Yok"}`,
              `**Duyuru:** ${s.announce_channel_id ? `<#${s.announce_channel_id}>` : "Yok"}`,
              `**Seviye kanal:** ${s.level_channel_id ? `<#${s.level_channel_id}>` : "Mesaj kanalı"}`,
              `**Ticket kategori:** ${s.ticket_category_id ? `<#${s.ticket_category_id}>` : "Yok"}`,
              `**Ticket log:** ${s.ticket_log_channel_id ? `<#${s.ticket_log_channel_id}>` : "Yok"}`,
              `**Destek rolü:** ${s.ticket_support_role_id ? `<@&${s.ticket_support_role_id}>` : "Yok"}`,
              `**Ticket panel:** ${s.ticket_panel_title || "varsayılan"}`,
              `**Koruma:** spam=${s.anti_spam} invite=${s.anti_invite} link=${s.anti_link} raid=${s.anti_raid} caps=${s.anti_caps}`,
              `**Mod modu:** ${s.mod_mode ? "AÇIK" : "Kapalı"}`,
              `**Ses 7/24:** ${s.voice_24_7 ? "Açık" : "Kapalı"} ${s.voice_channel_id ? `<#${s.voice_channel_id}>` : ""}`,
            ]
              .filter(Boolean)
              .join("\n"),
            "Sunucu Ayarları",
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "log") {
      const channel = interaction.options.getChannel("kanal", true);
      updateSettings(interaction.guild.id, { log_channel_id: channel.id });

      const me = interaction.guild.members.me;
      const perms = channel.permissionsFor(me);
      const canWrite = perms?.has(["ViewChannel", "SendMessages", "EmbedLinks"]);

      // Smoke test — immediately write a log so user sees it works
      const ok = await sendLog(interaction.guild, {
        title: "✅ Log kanalı ayarlandı",
        description: `${channel} artık log kanalı.\nAyarlayan: ${interaction.user}`,
        color: 0x57f287,
      });

      return interaction.reply({
        embeds: [
          successEmbed(
            [
              `Log kanalı ${channel} olarak ayarlandı.`,
              canWrite ? null : "⚠️ Botun bu kanalda **Görüntüle / Mesaj Gönder / Embed** izni yok.",
              ok ? "Test log gönderildi." : "⚠️ Test log gönderilemedi — kanalı / izinleri kontrol et.",
            ]
              .filter(Boolean)
              .join("\n"),
          ),
        ],
      });
    }

    if (sub === "hosgeldin") {
      const channel = interaction.options.getChannel("kanal", true);
      const message = interaction.options.getString("mesaj");
      const deleteAfter = interaction.options.getInteger("sil_saniye");
      const patch = {
        welcome_channel_id: channel.id,
        welcome_enabled: 1,
      };
      if (message) patch.welcome_message = message;
      if (deleteAfter !== null) patch.welcome_delete_after = deleteAfter;
      updateSettings(interaction.guild.id, patch);
      return interaction.reply({
        embeds: [
          successEmbed(
            `Hoş geldin kanalı ${channel}.\nMesaj belirli süre sonra otomatik silinebilir.`,
          ),
        ],
      });
    }

    if (sub === "vedamesaji") {
      const channel = interaction.options.getChannel("kanal", true);
      const message = interaction.options.getString("mesaj");
      const patch = { goodbye_channel_id: channel.id };
      if (message) patch.goodbye_message = message;
      updateSettings(interaction.guild.id, patch);
      return interaction.reply({ embeds: [successEmbed(`Veda kanalı ${channel} olarak ayarlandı.`)] });
    }

    if (sub === "otorol") {
      const role = interaction.options.getRole("rol", true);
      updateSettings(interaction.guild.id, { auto_role_id: role.id });
      return interaction.reply({ embeds: [successEmbed(`Oto rol: ${role}`)] });
    }

    if (sub === "duyuru-kanal") {
      const channel = interaction.options.getChannel("kanal", true);
      updateSettings(interaction.guild.id, { announce_channel_id: channel.id });
      return interaction.reply({ embeds: [successEmbed(`Duyuru kanalı: ${channel}`)] });
    }

    if (sub === "seviye-kanal") {
      const channel = interaction.options.getChannel("kanal", true);
      updateSettings(interaction.guild.id, { level_channel_id: channel.id, level_enabled: 1 });
      return interaction.reply({ embeds: [successEmbed(`Seviye bildirim kanalı: ${channel}`)] });
    }

    if (sub === "ticket") {
      const category = interaction.options.getChannel("kategori");
      const role = interaction.options.getRole("destek_rolu");
      const log = interaction.options.getChannel("log");
      const patch = {};
      if (category) patch.ticket_category_id = category.id;
      if (role) patch.ticket_support_role_id = role.id;
      if (log) patch.ticket_log_channel_id = log.id;
      updateSettings(interaction.guild.id, patch);
      return interaction.reply({ embeds: [successEmbed("Ticket ayarları güncellendi.")] });
    }
  },
};
