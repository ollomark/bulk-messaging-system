import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import db from "../database/db.js";
import { getSettings } from "../database/settings.js";
import { baseEmbed, errorEmbed, successEmbed } from "../utils/embeds.js";

export function buildTicketPanel() {
  const embed = baseEmbed(
    "🎫 Destek Talebi",
    "Yardım veya destek için aşağıdaki butona tıklayarak ticket açabilirsin.\nDestek ekibi en kısa sürede dönüş yapacaktır.",
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel("Ticket Aç")
      .setEmoji("🎟️")
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

export async function openTicket(interaction) {
  const settings = getSettings(interaction.guild.id);
  const existing = db
    .prepare("SELECT * FROM tickets WHERE guild_id = ? AND opener_id = ? AND status = 'open'")
    .get(interaction.guild.id, interaction.user.id);

  if (existing) {
    return interaction.reply({
      embeds: [errorEmbed(`Zaten açık bir ticketın var: <#${existing.channel_id}>`)],
      ephemeral: true,
    });
  }

  const overwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
      ],
    },
  ];

  if (settings.ticket_support_role_id) {
    overwrites.push({
      id: settings.ticket_support_role_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.slice(0, 90).toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    type: ChannelType.GuildText,
    parent: settings.ticket_category_id || undefined,
    permissionOverwrites: overwrites,
    topic: `Ticket sahibi: ${interaction.user.id}`,
  });

  db.prepare(
    `INSERT INTO tickets (channel_id, guild_id, opener_id, status, created_at)
     VALUES (?, ?, ?, 'open', ?)`,
  ).run(channel.id, interaction.guild.id, interaction.user.id, Date.now());

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Üstlen")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Kapat")
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: settings.ticket_support_role_id
      ? `<@${interaction.user.id}> <@&${settings.ticket_support_role_id}>`
      : `<@${interaction.user.id}>`,
    embeds: [
      baseEmbed(
        "Ticket Oluşturuldu",
        "Sorununuzu detaylı yazın. Destek ekibi buradan yardımcı olacak.\n\n`Üstlen` ile ticketı alın, `Kapat` ile kapatın.",
      ),
    ],
    components: [controls],
  });

  return interaction.reply({
    embeds: [successEmbed(`Ticket oluşturuldu: ${channel}`)],
    ephemeral: true,
  });
}

export async function claimTicket(interaction) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(interaction.channel.id);
  if (!ticket || ticket.status !== "open") {
    return interaction.reply({ embeds: [errorEmbed("Bu kanal bir açık ticket değil.")], ephemeral: true });
  }

  db.prepare("UPDATE tickets SET claimed_by = ? WHERE channel_id = ?").run(
    interaction.user.id,
    interaction.channel.id,
  );

  await interaction.reply({
    embeds: [successEmbed(`Ticket ${interaction.user} tarafından üstlenildi.`)],
  });
}

export async function closeTicket(interaction) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed("Bu kanal bir ticket değil.")], ephemeral: true });
  }

  db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(interaction.channel.id);

  const settings = getSettings(interaction.guild.id);
  if (settings.ticket_log_channel_id) {
    const logChannel = await interaction.guild.channels
      .fetch(settings.ticket_log_channel_id)
      .catch(() => null);
    if (logChannel?.isTextBased()) {
      await logChannel.send({
        embeds: [
          baseEmbed(
            "Ticket Kapatıldı",
            `Kanal: \`${interaction.channel.name}\`\nAçan: <@${ticket.opener_id}>\nKapatan: ${interaction.user}\nÜstlenen: ${
              ticket.claimed_by ? `<@${ticket.claimed_by}>` : "Yok"
            }`,
          ),
        ],
      });
    }
  }

  await interaction.reply({ embeds: [successEmbed("Ticket 5 saniye içinde silinecek.")] });
  setTimeout(() => {
    interaction.channel.delete("Ticket kapatıldı").catch(() => null);
  }, 5000);
}
