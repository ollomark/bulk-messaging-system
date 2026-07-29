import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { buildTicketPanel, closeTicket } from "../../systems/tickets.js";
import { successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("panel").setDescription("Ticket açma panelini bu kanala gönderir"),
    )
    .addSubcommand((sub) =>
      sub.setName("kapat").setDescription("Bulunduğun ticket kanalını kapatır"),
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "panel") {
      await interaction.channel.send(buildTicketPanel());
      return interaction.reply({
        embeds: [successEmbed("Ticket paneli gönderildi.")],
        ephemeral: true,
      });
    }
    if (sub === "kapat") {
      return closeTicket(interaction);
    }
  },
};
