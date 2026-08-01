import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { buildAgentEntryPanel, saveAgentSettings } from "../../systems/agentGate.js";
import { getSettings } from "../../database/settings.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ajan")
    .setDescription("Ajan giriş / doğrulama sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("panel").setDescription("Giriş paneli bu kanala gönderilir"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("ayarla")
        .setDescription("Ajan rollerini / kanalları kaydet")
        .addRoleOption((opt) =>
          opt.setName("giris-rol").setDescription("Sunucuya girince verilen rol").setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("erisim").setDescription("Onay sonrası erişim rolü").setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("handler").setDescription("Ticket yöneten rol").setRequired(true),
        )
        .addRoleOption((opt) =>
          opt.setName("yeminli").setDescription("Yemin sonrası rol (opsiyonel)"),
        )
        .addChannelOption((opt) =>
          opt
            .setName("giris")
            .setDescription("Giriş kanalı")
            .addChannelTypes(ChannelType.GuildText),
        )
        .addChannelOption((opt) =>
          opt
            .setName("yemin-log")
            .setDescription("Yeminlerin düşeceği kanal")
            .addChannelTypes(ChannelType.GuildText),
        )
        .addChannelOption((opt) =>
          opt
            .setName("ticket-kategori")
            .setDescription("Ticket kategorisi")
            .addChannelTypes(ChannelType.GuildCategory),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("durum").setDescription("Ajan sistemi durumunu gösterir"),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "panel") {
      await interaction.channel.send(buildAgentEntryPanel());
      return interaction.reply({
        embeds: [successEmbed("Giriş paneli gönderildi.")],
        ephemeral: true,
      });
    }

    if (sub === "ayarla") {
      const joinRole = interaction.options.getRole("giris-rol", true);
      const access = interaction.options.getRole("erisim", true);
      const handler = interaction.options.getRole("handler", true);
      const sworn = interaction.options.getRole("yeminli");
      const entry = interaction.options.getChannel("giris");
      const oathLog = interaction.options.getChannel("yemin-log");
      const ticketCat = interaction.options.getChannel("ticket-kategori");

      const patch = {
        agent_join_role_id: joinRole.id,
        auto_role_id: joinRole.id,
        agent_access_role_id: access.id,
        agent_handler_role_id: handler.id,
        ticket_support_role_id: handler.id,
      };
      if (sworn) patch.agent_sworn_role_id = sworn.id;
      if (entry) patch.agent_entry_channel_id = entry.id;
      if (oathLog) patch.agent_oath_channel_id = oathLog.id;
      if (ticketCat) patch.ticket_category_id = ticketCat.id;

      saveAgentSettings(interaction.guild.id, patch);
      return interaction.reply({
        embeds: [
          successEmbed(
            [
              `Giriş rolü: ${joinRole}`,
              `Erişim: ${access}`,
              `Handler: ${handler}`,
              sworn ? `Yeminli: ${sworn}` : "Yeminli: —",
              entry ? `Giriş: ${entry}` : "Giriş: —",
              oathLog ? `Yemin log: ${oathLog}` : "Yemin log: —",
              ticketCat ? `Ticket: ${ticketCat}` : "Ticket: —",
            ].join("\n"),
          ),
        ],
      });
    }

    if (sub === "durum") {
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        embeds: [
          successEmbed(
            [
              `Giriş rolü: ${s.agent_join_role_id ? `<@&${s.agent_join_role_id}>` : "Yok"}`,
              `Erişim: ${s.agent_access_role_id ? `<@&${s.agent_access_role_id}>` : "Yok"}`,
              `Handler: ${s.agent_handler_role_id ? `<@&${s.agent_handler_role_id}>` : "Yok"}`,
              `Yeminli: ${s.agent_sworn_role_id ? `<@&${s.agent_sworn_role_id}>` : "Yok"}`,
              `Giriş kanal: ${s.agent_entry_channel_id ? `<#${s.agent_entry_channel_id}>` : "Yok"}`,
              `Yemin log: ${s.agent_oath_channel_id ? `<#${s.agent_oath_channel_id}>` : "Yok"}`,
              `Ticket kategori: ${s.ticket_category_id ? `<#${s.ticket_category_id}>` : "Yok"}`,
            ].join("\n"),
          ),
        ],
        ephemeral: true,
      });
    }

    return interaction.reply({ embeds: [errorEmbed("Bilinmeyen alt komut.")], ephemeral: true });
  },
};
