import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
  buildTicketPanel,
  buildAgreementPanel,
  closeTicket,
  saveTicketPanelText,
} from "../../systems/tickets.js";
import { getSettings, updateSettings } from "../../database/settings.js";
import { successEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Ticket + anonim ticket panelini gönderir")
        .addStringOption((opt) =>
          opt.setName("baslik").setDescription("Panel başlığı").setMaxLength(256),
        )
        .addStringOption((opt) =>
          opt.setName("aciklama").setDescription("Panel açıklama yazısı").setMaxLength(2000),
        )
        .addStringOption((opt) =>
          opt.setName("buton").setDescription("Normal ticket buton yazısı").setMaxLength(80),
        )
        .addBooleanOption((opt) =>
          opt
            .setName("kaydet")
            .setDescription("Bu yazıyı kalıcı ayar olarak kaydet (varsayılan: evet)"),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("anlasma")
        .setDescription("Anlaşma Kur panelini gönderir")
        .addStringOption((opt) =>
          opt.setName("baslik").setDescription("Panel başlığı").setMaxLength(256),
        )
        .addStringOption((opt) =>
          opt.setName("aciklama").setDescription("Panel açıklaması").setMaxLength(2000),
        )
        .addStringOption((opt) =>
          opt.setName("buton").setDescription("Buton yazısı").setMaxLength(80),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("yazi")
        .setDescription("Kayıtlı panel yazısını gösterir / sıfırlar")
        .addBooleanOption((opt) =>
          opt.setName("sifirla").setDescription("Varsayılan yazıya dön"),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("kapat").setDescription("Bulunduğun ticket kanalını kapatır"),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "yazi") {
      const reset = interaction.options.getBoolean("sifirla");
      if (reset) {
        updateSettings(interaction.guild.id, {
          ticket_panel_title: null,
          ticket_panel_description: null,
          ticket_panel_button: null,
        });
        return interaction.reply({
          embeds: [successEmbed("Panel yazısı varsayılana döndü.")],
          ephemeral: true,
        });
      }
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        embeds: [
          infoEmbed(
            [
              `**Başlık:** ${s.ticket_panel_title || "🎫 Destek Talebi _(varsayılan)_"}`,
              `**Açıklama:** ${s.ticket_panel_description || "_(varsayılan)_"}`,
              `**Buton:** ${s.ticket_panel_button || "Ticket Aç _(varsayılan)_"}`,
              "",
              "Değiştirmek için: `/ticket panel baslik:... aciklama:...`",
            ].join("\n"),
            "Ticket Panel Yazısı",
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "panel") {
      const title = interaction.options.getString("baslik");
      const description = interaction.options.getString("aciklama");
      const button = interaction.options.getString("buton");
      const persist = interaction.options.getBoolean("kaydet");
      const shouldSave = persist !== false && Boolean(title || description || button);

      if (shouldSave) {
        const patch = {};
        if (title) patch.title = title;
        if (description) patch.description = description;
        if (button) patch.button = button;
        saveTicketPanelText(interaction.guild.id, patch);
      }

      const overrides = {};
      if (title) overrides.title = title;
      if (description) overrides.description = description;
      if (button) overrides.button = button;

      await interaction.channel.send(buildTicketPanel(interaction.guild.id, overrides));
      return interaction.reply({
        embeds: [
          successEmbed(
            shouldSave
              ? "Ticket paneli gönderildi (normal + anonim) ve yazı kaydedildi."
              : "Ticket paneli gönderildi (normal + anonim).",
          ),
        ],
        ephemeral: true,
      });
    }

    if (sub === "anlasma") {
      const overrides = {};
      const title = interaction.options.getString("baslik");
      const description = interaction.options.getString("aciklama");
      const button = interaction.options.getString("buton");
      if (title) overrides.title = title;
      if (description) overrides.description = description;
      if (button) overrides.button = button;

      await interaction.channel.send(buildAgreementPanel(overrides));
      return interaction.reply({
        embeds: [successEmbed("Anlaşma Kur paneli gönderildi.")],
        ephemeral: true,
      });
    }

    if (sub === "kapat") {
      return closeTicket(interaction);
    }
  },
};
