import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import db from "../database/db.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { baseEmbed, errorEmbed, successEmbed } from "../utils/embeds.js";

const RED = 0xb91c1c;
const GOLD = 0xc4a35a;

export function buildAgentEntryPanel() {
  const embed = baseEmbed(
    "XZON · GİRİŞ",
    [
      "Burası bir **ajan birimi**.",
      "İçerideki kanallar yalnızca onaylı operatiflere açıktır.",
      "",
      "**Başvur** — ekibe katılmak için ticket açılır, Handler’larla konuşursun.",
      "**Destek** — sorun / soru için ticket.",
      "",
      "Onaylanırsan erişim rolü verilir.",
      "Ardından `/yemin` komutu ile yemini tamamlarısın.",
      "",
      "Legal only. İzinsiz / illegal iş yok.",
    ].join("\n"),
  ).setColor(RED);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("agent_apply")
      .setLabel("Başvur")
      .setEmoji("🛰️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("agent_support")
      .setLabel("Destek")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Secondary),
  );

  return { embeds: [embed], components: [row] };
}

function ticketControls(kind) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_claim")
      .setLabel("Üstlen")
      .setStyle(ButtonStyle.Success),
  );

  if (kind === "agent_apply") {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("agent_approve")
        .setLabel("Onayla")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("agent_deny")
        .setLabel("Reddet")
        .setStyle(ButtonStyle.Secondary),
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("Kapat")
      .setStyle(ButtonStyle.Danger),
  );

  return row;
}

export async function openAgentTicket(interaction, kind) {
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

  if (kind === "agent_apply" && settings.agent_access_role_id) {
    if (interaction.member.roles.cache.has(settings.agent_access_role_id)) {
      return interaction.reply({
        embeds: [
          errorEmbed(
            "Zaten erişim rolün var. Yemini tamamlamak için `/yemin` kullan.",
          ),
        ],
        ephemeral: true,
      });
    }
  }

  const overwrites = [
    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
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
        PermissionFlagsBits.ManageRoles,
      ],
    },
  ];

  const handlerRole = settings.agent_handler_role_id || settings.ticket_support_role_id;
  if (handlerRole) {
    overwrites.push({
      id: handlerRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const prefix = kind === "agent_apply" ? "basvuru" : "destek";
  const channel = await interaction.guild.channels.create({
    name: `${prefix}-${interaction.user.username}`
      .slice(0, 90)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-"),
    type: ChannelType.GuildText,
    parent: settings.ticket_category_id || undefined,
    permissionOverwrites: overwrites,
    topic: `${kind}:${interaction.user.id}`,
  });

  db.prepare(
    `INSERT INTO tickets (channel_id, guild_id, opener_id, status, created_at, kind)
     VALUES (?, ?, ?, 'open', ?, ?)`,
  ).run(channel.id, interaction.guild.id, interaction.user.id, Date.now(), kind);

  const title = kind === "agent_apply" ? "Başvuru Ticket" : "Destek Ticket";
  const body =
    kind === "agent_apply"
      ? [
          `${interaction.user} başvuru açtı.`,
          "",
          "**Aday şunları yazsın:**",
          "• Yaş / timezone",
          "• Güçlü yan (kod / AI / başka)",
          "• Portfolyo / GitHub (varsa)",
          "• Neden XZON?",
          "",
          "Handler: konuşun → **Onayla** veya **Reddet**.",
          "Onay sonrası aday `/yemin` kullanır.",
        ].join("\n")
      : [
          `${interaction.user} destek istedi.`,
          "Sorunu detaylı yazın. Handler yardımcı olacak.",
        ].join("\n");

  await channel.send({
    content: handlerRole
      ? `<@${interaction.user.id}> <@&${handlerRole}>`
      : `<@${interaction.user.id}>`,
    embeds: [baseEmbed(title, body).setColor(kind === "agent_apply" ? RED : GOLD)],
    components: [ticketControls(kind)],
  });

  return interaction.reply({
    embeds: [successEmbed(`Ticket açıldı: ${channel}`)],
    ephemeral: true,
  });
}

function isHandler(interaction, settings) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;
  const handlerRole = settings.agent_handler_role_id || settings.ticket_support_role_id;
  return Boolean(handlerRole && interaction.member.roles.cache.has(handlerRole));
}

export async function approveAgentTicket(interaction) {
  const settings = getSettings(interaction.guild.id);
  if (!isHandler(interaction, settings)) {
    return interaction.reply({ embeds: [errorEmbed("Bunu sadece Handler yapabilir.")], ephemeral: true });
  }

  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(interaction.channel.id);
  if (!ticket || ticket.status !== "open") {
    return interaction.reply({ embeds: [errorEmbed("Açık ticket değil.")], ephemeral: true });
  }
  if (ticket.kind && ticket.kind !== "agent_apply") {
    return interaction.reply({
      embeds: [errorEmbed("Onay sadece başvuru ticketlarında.")],
      ephemeral: true,
    });
  }

  const roleId = settings.agent_access_role_id;
  if (!roleId) {
    return interaction.reply({
      embeds: [errorEmbed("Erişim rolü ayarlı değil. `/ajan kur` çalıştırın.")],
      ephemeral: true,
    });
  }

  const member = await interaction.guild.members.fetch(ticket.opener_id).catch(() => null);
  if (!member) {
    return interaction.reply({ embeds: [errorEmbed("Aday sunucuda bulunamadı.")], ephemeral: true });
  }

  await member.roles.add(roleId, `Agent onay · ${interaction.user.tag}`);

  await interaction.reply({
    embeds: [
      successEmbed(
        [
          `${member} **onaylandı** → erişim rolü verildi.`,
          "",
          `${member}: şimdi **/yemin** yaz ve yemini tamamla.`,
          "Yeminsiz tam operatif sayılmazsın.",
        ].join("\n"),
      ),
    ],
  });

  await member
    .send(
      [
        `**${interaction.guild.name}** — başvurun onaylandı.`,
        "Erişim rolün açıldı.",
        "Son adım: sunucuda `/yemin` komutunu kullan.",
      ].join("\n"),
    )
    .catch(() => null);
}

export async function denyAgentTicket(interaction) {
  const settings = getSettings(interaction.guild.id);
  if (!isHandler(interaction, settings)) {
    return interaction.reply({ embeds: [errorEmbed("Bunu sadece Handler yapabilir.")], ephemeral: true });
  }

  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ?").get(interaction.channel.id);
  if (!ticket || ticket.status !== "open") {
    return interaction.reply({ embeds: [errorEmbed("Açık ticket değil.")], ephemeral: true });
  }

  await interaction.reply({
    embeds: [errorEmbed(`Başvuru reddedildi · ${interaction.user}`).setColor(RED)],
  });

  const user = await interaction.client.users.fetch(ticket.opener_id).catch(() => null);
  if (user) {
    await user
      .send(`**${interaction.guild.name}** ajan başvurun şu an reddedildi.`)
      .catch(() => null);
  }
}

export async function swearOath(interaction) {
  const settings = getSettings(interaction.guild.id);
  const accessRole = settings.agent_access_role_id;
  if (!accessRole) {
    return interaction.reply({
      embeds: [errorEmbed("Sistem kurulu değil. Yetkili `/ajan kur` çalıştırsın.")],
      ephemeral: true,
    });
  }

  if (!interaction.member.roles.cache.has(accessRole)) {
    return interaction.reply({
      embeds: [
        errorEmbed(
          "Önce başvurun onaylanmalı.\n`#giriş` → **Başvur** → ticket → onay.",
        ),
      ],
      ephemeral: true,
    });
  }

  const already = db
    .prepare("SELECT sworn_at FROM agent_oaths WHERE guild_id = ? AND user_id = ?")
    .get(interaction.guild.id, interaction.user.id);

  if (already) {
    return interaction.reply({
      embeds: [errorEmbed("Yemini zaten verdin. Tekrar gerekmez.")],
      ephemeral: true,
    });
  }

  db.prepare(
    "INSERT INTO agent_oaths (guild_id, user_id, sworn_at) VALUES (?, ?, ?)",
  ).run(interaction.guild.id, interaction.user.id, Date.now());

  if (settings.agent_sworn_role_id) {
    await interaction.member.roles
      .add(settings.agent_sworn_role_id, "Agent yemini")
      .catch(() => null);
  }

  const oathText = [
    `**${interaction.user} yemin etti.**`,
    "",
    "```",
    " YEMİN",
    " 1. Legal only — izinsiz hedef yok",
    " 2. Birlik — ekibi satmam",
    " 3. Sır — token/client sızdırmaz",
    " 4. Saygı — ego yok",
    "```",
    "Artık tam operatif.",
  ].join("\n");

  const oathChannelId = settings.agent_oath_channel_id;
  if (oathChannelId) {
    const ch = await interaction.guild.channels.fetch(oathChannelId).catch(() => null);
    if (ch?.isTextBased()) {
      await ch.send({
        embeds: [baseEmbed("YEMİN", oathText).setColor(GOLD)],
      });
    }
  }

  return interaction.reply({
    embeds: [
      successEmbed(
        "Yemin kaydedildi. Hoş geldin, Operative.\nKanallar artık senin.",
      ),
    ],
  });
}

export function saveAgentSettings(guildId, patch) {
  return updateSettings(guildId, patch);
}
