import { Events, PermissionFlagsBits } from "discord.js";
import { errorEmbed, infoEmbed, successEmbed } from "../utils/embeds.js";
import {
  openTicket,
  claimTicket,
  closeTicket,
  startAgreementConfirm,
  confirmAgreement,
  cancelAgreement,
} from "../systems/tickets.js";
import { addEntry, getGiveaway } from "../systems/giveaways.js";
import { handleVerify } from "../systems/verify.js";
import { handleSuggestionVote } from "../systems/suggestions.js";
import { handleButtonRole } from "../systems/buttonRoles.js";
import { hqPanelPayload, premiumEmbed, brand } from "../utils/brand.js";
import { getSettings } from "../database/settings.js";
import { getInviteLeaderboard } from "../systems/invites.js";
import { buildApplyModal, submitApplication } from "../systems/applications.js";
import { submitReport } from "../systems/reports.js";
import { handleDmFormButton, handleDmFormModal } from "../systems/dmForm.js";

async function handleHqSelect(interaction) {
  const value = interaction.values[0];
  const s = getSettings(interaction.guild.id);

  const pages = {
    protection: premiumEmbed({
      title: "🛡️ Smart Guard",
      description: [
        `Anti-Spam: ${s.anti_spam ? "✅" : "❌"}`,
        `Anti-Invite: ${s.anti_invite ? "✅" : "❌"}`,
        `Anti-Link: ${s.anti_link ? "✅" : "❌"}`,
        `Anti-Raid: ${s.anti_raid ? "✅" : "❌"}`,
        `Mod Modu: ${s.mod_mode ? "✅" : "❌"}`,
        "",
        "`/koruma ayarla` ile yönet.",
      ].join("\n"),
    }),
    verify: premiumEmbed({
      title: "✅ Verify Gate",
      description: `${s.verify_enabled ? "Aktif" : "Kapalı"}\n\`/dogrulama kur\``,
      color: brand.colors.success,
    }),
    invites: (() => {
      const rows = getInviteLeaderboard(interaction.guild.id, 5);
      return premiumEmbed({
        title: "📨 Invite Engine",
        description: rows.length
          ? rows.map((r, i) => `**${i + 1}.** <@${r.user_id}> · ${r.regular}`).join("\n")
          : "Veri yok.",
        color: brand.colors.info,
      });
    })(),
    starboard: infoEmbed(
      `Kanal: ${s.starboard_channel_id ? `<#${s.starboard_channel_id}>` : "Yok"}\nLimit: ${s.starboard_limit || 3}\n\`/starboard ayarla\``,
      "⭐ Starboard",
    ),
    suggest: infoEmbed(
      `Kanal: ${s.suggest_channel_id ? `<#${s.suggest_channel_id}>` : "Yok"}\n\`/oneri gonder\``,
      "💡 Suggestions",
    ),
    tempvoice: infoEmbed(
      `Lobby: ${s.temp_voice_channel_id ? `<#${s.temp_voice_channel_id}>` : "Yok"}\n\`/gecicises kur\``,
      "🔊 Temp Voice",
    ),
    apply: infoEmbed(
      `Log: ${s.apply_channel_id ? `<#${s.apply_channel_id}>` : "Yok"}\n\`/basvuru panel\` · \`/basvuru kanal\``,
      "📋 Applications",
    ),
    stats: successEmbed("Detay için `/istatistik`", "📊 Analytics"),
  };

  return interaction.update({
    embeds: [pages[value] || infoEmbed("Modül bulunamadı.")],
    components: hqPanelPayload(interaction.guild).components,
  });
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

      if (interaction.isModalSubmit()) {
        if (interaction.customId === "report_modal") {
          await submitReport(interaction);
          return;
        }
        if (interaction.customId === "apply_modal") {
          await submitApplication(interaction);
          return;
        }
        if (await handleDmFormModal(interaction, client)) {
          return;
        }
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "hq_module") {
          await handleHqSelect(interaction);
          return;
        }
      }

      if (interaction.isButton()) {
        if (await handleDmFormButton(interaction)) {
          return;
        }
        if (interaction.customId === "hq_refresh") {
          return interaction.update(hqPanelPayload(interaction.guild));
        }
        if (interaction.customId === "hq_status") {
          return interaction.update({
            embeds: [
              premiumEmbed({
                title: `${brand.name} System Status`,
                description: [
                  `Sunucu: **${interaction.guild.name}**`,
                  `Ping: **${client.ws.ping}ms**`,
                  `Uptime: **${Math.floor(process.uptime() / 60)} dk**`,
                  `Komut: **${client.commands.size}**`,
                  "Durum: 🟢 Ultra Premium Online",
                ].join("\n"),
                color: brand.colors.gold,
              }),
            ],
            components: hqPanelPayload(interaction.guild).components,
          });
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
        if (interaction.customId === "apply_open") {
          return interaction.showModal(buildApplyModal());
        }
        if (interaction.customId.startsWith("report_ack_")) {
          if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
          }
          return interaction.update({
            content: `İncelendi · ${interaction.user}`,
            components: [],
          });
        }
        if (interaction.customId.startsWith("apply_accept_") || interaction.customId.startsWith("apply_deny_")) {
          if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: "Yetkin yok.", ephemeral: true });
          }
          const accepted = interaction.customId.startsWith("apply_accept_");
          const userId = interaction.customId.split("_").pop();
          await interaction.update({
            content: `${accepted ? "✅ Kabul" : "❌ Red"} · ${interaction.user} → <@${userId}>`,
            components: [],
          });
          const user = await client.users.fetch(userId).catch(() => null);
          if (user) {
            await user
              .send(
                accepted
                  ? `🎉 **${interaction.guild.name}** staff başvurun kabul edildi!`
                  : `**${interaction.guild.name}** staff başvurun reddedildi.`,
              )
              .catch(() => null);
          }
          return;
        }
        if (interaction.customId.startsWith("brole_")) {
          await handleButtonRole(interaction);
          return;
        }

        switch (interaction.customId) {
          case "ticket_open":
            await openTicket(interaction, { anonymous: false });
            return;
          case "ticket_open_anon":
            await openTicket(interaction, { anonymous: true });
            return;
          case "ticket_claim":
            await claimTicket(interaction);
            return;
          case "ticket_close":
            await closeTicket(interaction);
            return;
          case "agreement_start":
            await startAgreementConfirm(interaction);
            return;
          case "agreement_confirm":
            await confirmAgreement(interaction, client);
            return;
          case "agreement_cancel":
            await cancelAgreement(interaction);
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
