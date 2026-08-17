import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getSettings } from "../../database/settings.js";
import { brand, brandFooter, premiumEmbed } from "../../utils/brand.js";
import db from "../../database/db.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ozet")
    .setDescription("Sunucu ultra özet paneli")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const g = interaction.guild;
    const s = getSettings(g.id);
    const openTickets = db
      .prepare("SELECT COUNT(*) AS c FROM tickets WHERE guild_id = ? AND status = 'open'")
      .get(g.id).c;
    const levelRows = db
      .prepare("SELECT COUNT(*) AS c FROM levels WHERE guild_id = ?")
      .get(g.id).c;

    const embed = premiumEmbed({
      title: `✦ ${g.name} · Özet`,
      description: brand.tagline,
      color: brand.colors.gold,
      thumbnail: g.iconURL({ size: 256 }),
      fields: [
        {
          name: "Sunucu",
          value: [
            `Üye · **${g.memberCount}**`,
            `Kanal · **${g.channels.cache.size}**`,
            `Rol · **${g.roles.cache.size}**`,
            `Boost · **${g.premiumSubscriptionCount || 0}** (Lv ${g.premiumTier})`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "Sistem",
          value: [
            `Ticket açık · **${openTickets}**`,
            `Level kayıt · **${levelRows}**`,
            `Guard spam · ${s.anti_spam ? "✅" : "❌"}`,
            `Verify · ${s.verify_enabled ? "✅" : "❌"}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "Kanallar",
          value: [
            `Log · ${s.log_channel_id ? `<#${s.log_channel_id}>` : "—"}`,
            `Welcome · ${s.welcome_channel_id ? `<#${s.welcome_channel_id}>` : "—"}`,
            `Level · ${s.level_channel_id ? `<#${s.level_channel_id}>` : "—"}`,
            `Ticket · ${s.ticket_category_id ? `<#${s.ticket_category_id}>` : "—"}`,
          ].join("\n"),
        },
      ],
      footer: brandFooter("ozet"),
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
