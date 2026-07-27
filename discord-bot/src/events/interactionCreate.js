import { Events } from "discord.js";
import { errorEmbed, infoEmbed, successEmbed } from "../utils/embeds.js";
import { openTicket, claimTicket, closeTicket } from "../systems/tickets.js";
import { addEntry, getGiveaway } from "../systems/giveaways.js";
import { handleVerify } from "../systems/verify.js";
import { handleSuggestionVote } from "../systems/suggestions.js";
import { handleButtonRole } from "../systems/buttonRoles.js";
import { hqPanelPayload, premiumEmbed, brand } from "../utils/brand.js";
import { getSettings } from "../database/settings.js";
import { getInviteLeaderboard } from "../systems/invites.js";
import { listResponders } from "../systems/autoresponder.js";

async function handleHqSelect(interaction) {
  const value = interaction.values[0];
  const s = getSettings(interaction.guild.id);

  if (value === "protection") {
    return interaction.update({
      embeds: [
        premiumEmbed({
          title: "🛡️ Koruma",
          description: [
            `Anti-Spam: ${s.anti_spam ? "✅" : "❌"}`,
            `Anti-Invite: ${s.anti_invite ? "✅" : "❌"}`,
            `Anti-Link: ${s.anti_link ? "✅" : "❌"}`,
            `Anti-Raid: ${s.anti_raid ? "✅" : "❌"}`,
            `Mod Modu: ${s.mod_mode ? "✅" : "❌"}`,
            "",
            "Değiştirmek için `/koruma ayarla` kullan.",
          ].join("\n"),
          color: brand.colors.primary,
        }),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "verify") {
    return interaction.update({
      embeds: [
        premiumEmbed({
          title: "✅ Doğrulama",
          description: `${s.verify_enabled ? "Aktif" : "Kapalı"}\nKurulum: \`/dogrulama kur\``,
          color: brand.colors.success,
        }),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "invites") {
    const rows = getInviteLeaderboard(interaction.guild.id, 5);
    const text = rows.length
      ? rows.map((r, i) => `**${i + 1}.** <@${r.user_id}> · ${r.regular}`).join("\n")
      : "Veri yok. Üyeler geldikçe dolacak.";
    return interaction.update({
      embeds: [premiumEmbed({ title: "📨 Davet Top 5", description: text, color: brand.colors.info })],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "starboard") {
    return interaction.update({
      embeds: [
        infoEmbed(
          `Kanal: ${s.starboard_channel_id ? `<#${s.starboard_channel_id}>` : "Yok"}\nLimit: ${s.starboard_limit || 3}\nAyar: \`/starboard ayarla\``,
          "⭐ Starboard",
        ),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "suggest") {
    return interaction.update({
      embeds: [
        infoEmbed(
          `Kanal: ${s.suggest_channel_id ? `<#${s.suggest_channel_id}>` : "Yok"}\nÜyeler: \`/oneri gonder\`\nAyar: \`/oneri kanal\``,
          "💡 Öneri",
        ),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "tempvoice") {
    return interaction.update({
      embeds: [
        infoEmbed(
          `Lobby: ${s.temp_voice_channel_id ? `<#${s.temp_voice_channel_id}>` : "Yok"}\nKur: \`/gecicises kur\``,
          "🔊 Geçici Ses",
        ),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "autorespond") {
    const rows = listResponders(interaction.guild.id).slice(0, 8);
    return interaction.update({
      embeds: [
        infoEmbed(
          rows.length
            ? rows.map((r) => `\`#${r.id}\` ${r.trigger_text}`).join("\n")
            : "Yok. `/otoyanit ekle` ile ekle.",
          "🤖 Oto Yanıt",
        ),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }

  if (value === "stats") {
    return interaction.update({
      embeds: [
        successEmbed("Detaylı analitik için `/istatistik` komutunu kullan.", "📊 Analitik"),
      ],
      components: hqPanelPayload(interaction.guild).components,
    });
  }
}

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

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "hq_module") {
          await handleHqSelect(interaction);
          return;
        }
      }

      if (interaction.isButton()) {
        if (interaction.customId === "hq_refresh") {
          return interaction.update(hqPanelPayload(interaction.guild));
        }
        if (interaction.customId === "verify_pass") {
          await handleVerify(interaction);
          return;
        }
        if (interaction.customId === "suggest_up") {
          await handleSuggestionVote(interaction, "up");
          return;
        }
        if (interaction.customId === "suggest_down") {
          await handleSuggestionVote(interaction, "down");
          return;
        }
        if (interaction.customId.startsWith("brole_")) {
          await handleButtonRole(interaction);
          return;
        }

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
