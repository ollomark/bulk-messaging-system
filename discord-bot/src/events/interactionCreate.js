import { Events } from "discord.js";
import { errorEmbed } from "../utils/embeds.js";
import { openTicket, claimTicket, closeTicket } from "../systems/tickets.js";
import { addEntry, getGiveaway } from "../systems/giveaways.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          return interaction.reply({
            embeds: [errorEmbed("Bu komut bulunamadı.")],
            ephemeral: true,
          });
        }
        await command.execute(interaction, client);
        return;
      }

      if (interaction.isButton()) {
        switch (interaction.customId) {
          case "ticket_open":
            await openTicket(interaction);
            return;
          case "ticket_claim":
            await claimTicket(interaction);
            return;
          case "ticket_close":
            await closeTicket(interaction);
            return;
          case "giveaway_join": {
            const giveaway = getGiveaway(interaction.message.id);
            if (!giveaway || giveaway.ended) {
              return interaction.reply({
                embeds: [errorEmbed("Bu çekiliş artık aktif değil.")],
                ephemeral: true,
              });
            }
            const joined = addEntry(interaction.message.id, interaction.user.id);
            return interaction.reply({
              content: joined ? "🎉 Çekilişe katıldın!" : "Zaten bu çekilişe katılmışsın.",
              ephemeral: true,
            });
          }
          default:
            return;
        }
      }
    } catch (error) {
      console.error("Interaction hatası:", error);
      const payload = {
        embeds: [errorEmbed("Komut çalıştırılırken bir hata oluştu.")],
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => null);
      } else {
        await interaction.reply(payload).catch(() => null);
      }
    }
  },
};
