import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import db from "../database/db.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { baseEmbed, errorEmbed, successEmbed, warnEmbed } from "../utils/embeds.js";
import { config } from "../config.js";
import { ANON_AVATAR, getAnonWebhook } from "../utils/anonWebhook.js";

const DEFAULT_PANEL = {
  title: "🎫 Destek Talebi",
  description:
    "Yardım veya destek için aşağıdaki butona tıklayarak ticket açabilirsin.\nAnonim ticket’ta kimliğin gizli kalır — mesajların **Anonim** olarak gider.",
  button: "Ticket Aç",
  anonButton: "Anonim Ticket",
};

/** Build ticket panel from guild settings + optional overrides. */
export function buildTicketPanel(guildIdOrSettings = null, overrides = {}) {
  const settings =
    typeof guildIdOrSettings === "string"
      ? getSettings(guildIdOrSettings)
      : guildIdOrSettings && typeof guildIdOrSettings === "object"
        ? guildIdOrSettings
        : {};

  const title = overrides.title || settings.ticket_panel_title || DEFAULT_PANEL.title;
  const description =
    overrides.description || settings.ticket_panel_description || DEFAULT_PANEL.description;
  const buttonLabel = (
    overrides.button ||
    settings.ticket_panel_button ||
    DEFAULT_PANEL.button
  ).slice(0, 80);
  const anonLabel = (overrides.anonButton || DEFAULT_PANEL.anonButton).slice(0, 80);

  const embed = baseEmbed(title.slice(0, 256), description.slice(0, 4096));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_open")
      .setLabel(buttonLabel)
      .setEmoji("🎟️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_open_anon")
      .setLabel(anonLabel)
      .setEmoji("🕵️")
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

export function buildAgreementPanel(overrides = {}) {
  const title = (overrides.title || "Anlaşma Kur").slice(0, 256);
  const description = (
    overrides.description ||
    "Anlaşma kurmak için butona bas.\nOnayladıktan sonra talep sahip kişiye DM olarak iletilir."
  ).slice(0, 4096);

  const embed = baseEmbed(title, description);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("agreement_start")
      .setLabel((overrides.button || "Anlaşma Kur").slice(0, 80))
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

export function saveTicketPanelText(guildId, { title, description, button } = {}) {
  const patch = {};
  if (title != null) patch.ticket_panel_title = title.slice(0, 256);
  if (description != null) patch.ticket_panel_description = description.slice(0, 4000);
  if (button != null) patch.ticket_panel_button = button.slice(0, 80);
  if (Object.keys(patch).length) updateSettings(guildId, patch);
  return getSettings(guildId);
}

function openTicketRow(guildId, userId) {
  return db
    .prepare("SELECT * FROM tickets WHERE guild_id = ? AND opener_id = ? AND status = 'open'")
    .get(guildId, userId);
}

export async function openTicket(interaction, { anonymous = false } = {}) {
  const settings = getSettings(interaction.guild.id);
  const existing = openTicketRow(interaction.guild.id, interaction.user.id);

  if (existing) {
    const hint = existing.anonymous
      ? "Zaten açık bir **anonim** ticketın var — bota DM at."
      : `Zaten açık bir ticketın var: <#${existing.channel_id}>`;
    return interaction.reply({
      embeds: [errorEmbed(hint)],
      ephemeral: true,
    });
  }

  const overwrites = [
    {
      id: interaction.guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageWebhooks,
      ],
    },
  ];

  if (!anonymous) {
    overwrites.push({
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  if (settings.ticket_support_role_id) {
    overwrites.push({
      id: settings.ticket_support_role_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const shortId = Date.now().toString(36).slice(-5);
  const channelName = anonymous
    ? `anonim-${shortId}`
    : `ticket-${interaction.user.username}`
        .slice(0, 90)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: settings.ticket_category_id || undefined,
    permissionOverwrites: overwrites,
    topic: anonymous
      ? `Anonim ticket · ref ${shortId}`
      : `Ticket sahibi: ${interaction.user.id}`,
  });

  db.prepare(
    `INSERT INTO tickets (channel_id, guild_id, opener_id, status, created_at, anonymous)
     VALUES (?, ?, ?, 'open', ?, ?)`,
  ).run(
    channel.id,
    interaction.guild.id,
    interaction.user.id,
    Date.now(),
    anonymous ? 1 : 0,
  );

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

  if (anonymous) {
    await channel.send({
      content: settings.ticket_support_role_id
        ? `<@&${settings.ticket_support_role_id}>`
        : undefined,
      embeds: [
        baseEmbed(
          "🕵️ Anonim Ticket",
          [
            "Kullanıcı kimliği gizli.",
            "Mesajlar **Anonim** webhook ile gelecek.",
            "Bu kanala yazdığın yanıtlar kullanıcıya DM olarak iletilir.",
            "",
            "`Üstlen` / `Kapat` ile yönet.",
          ].join("\n"),
        ),
      ],
      components: [controls],
    });

    try {
      await interaction.user.send({
        embeds: [
          baseEmbed(
            "Anonim ticket açıldı",
            [
              `Sunucu: **${interaction.guild.name}**`,
              "Kimliğin destek ekibine gösterilmez.",
              "",
              "**Bu DM’ye yaz** — mesajın ticket kanalında **Anonim** olarak görünür.",
              "Destek yanıtları da buraya düşer.",
            ].join("\n"),
          ),
        ],
      });
    } catch {
      await channel.delete("Anonim ticket: DM kapalı").catch(() => null);
      db.prepare("DELETE FROM tickets WHERE channel_id = ?").run(channel.id);
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Anonim ticket için DM’lerin açık olmalı. Discord ayarlarından sunucu üyelerinden DM’e izin ver, sonra tekrar dene.",
          ),
        ],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [
        successEmbed(
          "Anonim ticket açıldı. Bota gelen DM’yi aç ve oraya yaz — mesajların **Anonim** olarak iletilir.",
        ),
      ],
      ephemeral: true,
    });
  }

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

async function buildTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (!messages) return "Transcript alınamadı.";
  const lines = [...messages.values()]
    .reverse()
    .map((msg) => {
      const time = new Date(msg.createdTimestamp).toISOString();
      const content = msg.content || (msg.embeds.length ? "[embed]" : "[ek/boş]");
      const who = msg.webhookId ? "Anonim" : msg.author?.tag || "?";
      return `[${time}] ${who}: ${content}`;
    });
  return lines.join("\n").slice(0, 1800) || "Boş ticket.";
}

export async function closeTicket(interaction) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [errorEmbed("Bu kanal bir ticket değil.")], ephemeral: true });
  }

  db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(interaction.channel.id);
  await interaction.deferReply();

  const transcript = await buildTranscript(interaction.channel);
  const settings = getSettings(interaction.guild.id);
  const logChannelId = settings.ticket_log_channel_id || settings.log_channel_id;
  const openerLabel = ticket.anonymous ? "Anonim kullanıcı" : `<@${ticket.opener_id}>`;

  if (logChannelId) {
    const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
    if (logChannel?.isTextBased()) {
      await logChannel.send({
        embeds: [
          baseEmbed(
            "🧾 Ticket Transcript",
            `Kanal: \`${interaction.channel.name}\`\nTür: ${ticket.anonymous ? "Anonim" : "Normal"}\nAçan: ${openerLabel}\nKapatan: ${interaction.user}\nÜstlenen: ${
              ticket.claimed_by ? `<@${ticket.claimed_by}>` : "Yok"
            }\n\n\`\`\`\n${transcript}\n\`\`\``,
          ),
        ],
      });
    }
  }

  if (ticket.anonymous) {
    const user = await interaction.client.users.fetch(ticket.opener_id).catch(() => null);
    if (user) {
      await user
        .send({
          embeds: [
            baseEmbed(
              "Anonim ticket kapatıldı",
              `**${interaction.guild.name}** sunucusundaki anonim ticketın kapatıldı.`,
            ),
          ],
        })
        .catch(() => null);
    }
  }

  await interaction.editReply({ embeds: [successEmbed("Transcript alındı. Ticket 5 sn içinde silinecek.")] });
  setTimeout(() => {
    interaction.channel.delete("Ticket kapatıldı").catch(() => null);
  }, 5000);
}

/** DM → anonim ticket kanalı (webhook). */
export async function relayAnonDmToTicket(message, client) {
  if (message.guild || message.author.bot) return false;

  const ticket = db
    .prepare(
      `SELECT * FROM tickets
       WHERE opener_id = ? AND status = 'open' AND anonymous = 1
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(message.author.id);
  if (!ticket) return false;

  const guild = await client.guilds.fetch(ticket.guild_id).catch(() => null);
  if (!guild) return false;
  const channel = await guild.channels.fetch(ticket.channel_id).catch(() => null);
  if (!channel?.isTextBased?.()) {
    await message.reply("Ticket kanalı bulunamadı — yeniden açmayı dene.").catch(() => null);
    return true;
  }

  try {
    const webhook = await getAnonWebhook(channel);
    const files = [...message.attachments.values()].map((a) => ({
      attachment: a.url,
      name: a.name,
    }));
    await webhook.send({
      username: "Anonim",
      avatarURL: ANON_AVATAR,
      content: message.content?.slice(0, 2000) || (files.length ? undefined : "_(ek)_"),
      files: files.length ? files : undefined,
      allowedMentions: { parse: [] },
    });
    await message.react("✅").catch(() => null);
  } catch (e) {
    await message.reply(`İletilemedi: ${e.message}`).catch(() => null);
  }
  return true;
}

/** Staff mesajı → opener DM. */
export async function relayAnonTicketToDm(message) {
  if (!message.guild || message.author.bot || message.webhookId) return false;

  const ticket = db
    .prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open' AND anonymous = 1")
    .get(message.channel.id);
  if (!ticket) return false;
  if (message.author.id === ticket.opener_id) return false;

  const user = await message.client.users.fetch(ticket.opener_id).catch(() => null);
  if (!user) return false;

  const files = [...message.attachments.values()].map((a) => a.url);
  try {
    await user.send({
      content: [
        `**Destek · ${message.guild.name}** (${message.author.username}):`,
        message.content || (files.length ? "" : "_(ek)_"),
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000),
      files: files.length ? files : undefined,
    });
  } catch {
    await message.reply({
      embeds: [errorEmbed("Kullanıcıya DM iletilemedi (DM kapalı olabilir).")],
    }).catch(() => null);
  }
  return true;
}

export async function startAgreementConfirm(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("agreement_confirm")
      .setLabel("Evet, eminim")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("agreement_cancel")
      .setLabel("İptal")
      .setStyle(ButtonStyle.Secondary),
  );

  return interaction.reply({
    embeds: [
      warnEmbed(
        "Emin misin?\n\nOnaylarsan **anlaşma talebin** bot sahibine DM olarak gider.",
        "Anlaşma Kur — Onay",
      ),
    ],
    components: [row],
    ephemeral: true,
  });
}

export async function confirmAgreement(interaction, client) {
  const ownerId = config.ownerId;
  if (!ownerId) {
    return interaction.update({
      embeds: [errorEmbed("Sahip (OWNER_ID) ayarlı değil.")],
      components: [],
    });
  }

  const owner = await client.users.fetch(ownerId).catch(() => null);
  if (!owner) {
    return interaction.update({
      embeds: [errorEmbed("Sahip kullanıcısı bulunamadı.")],
      components: [],
    });
  }

  try {
    await owner.send({
      embeds: [
        baseEmbed(
          "Anlaşma talebi",
          [
            `**Kullanıcı:** ${interaction.user} (\`${interaction.user.id}\`)`,
            `**Tag:** ${interaction.user.tag}`,
            `**Sunucu:** ${interaction.guild?.name || "?"} (\`${interaction.guild?.id || "?"}\`)`,
            `**Kanal:** ${interaction.channel}`,
            `**Zaman:** <t:${Math.floor(Date.now() / 1000)}:F>`,
          ].join("\n"),
        ),
      ],
    });
  } catch {
    return interaction.update({
      embeds: [errorEmbed("Sahibe DM gönderilemedi (DM kapalı olabilir).")],
      components: [],
    });
  }

  return interaction.update({
    embeds: [successEmbed("Talebin iletildi. Sahip kişi DM’den dönüş yapacak.")],
    components: [],
  });
}

export async function cancelAgreement(interaction) {
  return interaction.update({
    embeds: [baseEmbed("İptal", "Anlaşma talebi iptal edildi.")],
    components: [],
  });
}
