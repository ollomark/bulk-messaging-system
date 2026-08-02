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

/** Production self-heal: bind roles/channels by name if settings empty. */
export async function ensureAgentSettings(guild) {
  if (!guild) return getSettings("0");
  await guild.roles.fetch().catch(() => null);
  await guild.channels.fetch().catch(() => null);

  const s = getSettings(guild.id);
  const role = (name) => guild.roles.cache.find((r) => r.name === name);
  const ch = (name) =>
    [...guild.channels.cache.values()].find((c) => c.name === name && c.isTextBased?.());
  const cat = (part) =>
    [...guild.channels.cache.values()].find(
      (c) => c.type === 4 && c.name.toUpperCase().includes(part),
    );

  const patch = {};
  const join = role("Giriş");
  const access = role("Operative");
  const sworn = role("Sworn") || role("Ghost");
  const handler = role("Handler");
  const giris = ch("giriş");
  const handlerLog = ch("handler-log");
  const ticketCat =
    cat("BURN BAG") || cat("DEAD DROPS") || cat("TICKET") || cat("BURN");

  // Always refresh critical IDs from live names (production volume self-heal)
  if (access) patch.agent_access_role_id = access.id;
  if (join) {
    patch.agent_join_role_id = join.id;
    patch.auto_role_id = join.id;
  }
  if (handler) {
    patch.agent_handler_role_id = handler.id;
    patch.ticket_support_role_id = handler.id;
  }
  if (sworn) patch.agent_sworn_role_id = sworn.id;
  if (giris) patch.agent_entry_channel_id = giris.id;
  if (handlerLog) {
    patch.agent_oath_channel_id = handlerLog.id;
    patch.ticket_log_channel_id = handlerLog.id;
  }
  if (ticketCat) patch.ticket_category_id = ticketCat.id;

  if (Object.keys(patch).length) updateSettings(guild.id, patch);
  return getSettings(guild.id);
}

export function buildAgentEntryPanel() {
  const embed = baseEmbed(
    "BLACKSITE · ENTRY",
    [
      "```",
      " ██ ACCESS DENIED",
      " ██ CLEARANCE: NONE",
      " ██ LOCATION: UNKNOWN",
      "```",
      "",
      "Bu kapının arkasını görmüyorsun.",
      "Görmen de gerekmiyor.",
      "",
      "**Başvur** — burn bag açılır. Handler dinler. Sessiz kal.",
      "**Destek** — sinyal koptuysa.",
      "",
      "Onay → Operative → `/yemin`",
      "Yemin asla public düşmez. IMF seni tanır.",
    ].join("\n"),
  ).setColor(RED);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("agent_apply")
      .setLabel("Başvur")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("agent_support")
      .setLabel("Destek")
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
  const settings = await ensureAgentSettings(interaction.guild);

  // Panel sadece giriş kanalından
  if (
    settings.agent_entry_channel_id &&
    interaction.channelId !== settings.agent_entry_channel_id
  ) {
    return interaction.reply({
      embeds: [errorEmbed("Bu panel sadece `#giriş` kanalında kullanılır.")],
      ephemeral: true,
    });
  }

  // Eski "open" ama kanalı silinmiş kayıtları temizle (yanlış uyarı vermesin)
  const stale = db
    .prepare("SELECT channel_id FROM tickets WHERE guild_id = ? AND opener_id = ? AND status = 'open'")
    .all(interaction.guild.id, interaction.user.id);
  for (const row of stale) {
    const still = await interaction.guild.channels.fetch(row.channel_id).catch(() => null);
    if (!still) {
      db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(row.channel_id);
    }
  }

  // Limit yok — herkes istediği kadar ticket açabilir

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
  const suffix = Date.now().toString(36).slice(-4);
  const channel = await interaction.guild.channels.create({
    name: `${prefix}-${interaction.user.username}-${suffix}`
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
          "Handler burada konuşur → **Onayla** / **Reddet**.",
          "Onay sonrası aday `/yemin` kullanır.",
        ].join("\n")
      : [`${interaction.user} destek istedi.`, "Handler burada yardımcı olur."].join("\n");

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
  const settings = await ensureAgentSettings(interaction.guild);
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
      embeds: [
        errorEmbed(
          "Operative rolü sunucuda yok. Rol adının tam olarak `Operative` olduğundan emin ol.",
        ),
      ],
      ephemeral: true,
    });
  }

  const member = await interaction.guild.members.fetch(ticket.opener_id).catch(() => null);
  if (!member) {
    return interaction.reply({ embeds: [errorEmbed("Aday sunucuda bulunamadı.")], ephemeral: true });
  }

  await member.roles.add(roleId, `Agent onay · ${interaction.user.tag}`);
  // Giriş rolünü kaldır — kapıda kalmasın / tekrar başvurmaya çalışmasın
  if (settings.agent_join_role_id && member.roles.cache.has(settings.agent_join_role_id)) {
    await member.roles
      .remove(settings.agent_join_role_id, "Agent onay — giriş rolü alındı")
      .catch(() => null);
  }

  await interaction.reply({
    embeds: [
      successEmbed(
        [
          `${member} **onaylandı** → erişim rolü verildi.`,
          "",
          `${member}: şimdi **/yemin** yaz.`,
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
  const settings = await ensureAgentSettings(interaction.guild);
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
  const settings = await ensureAgentSettings(interaction.guild);
  const accessRole = settings.agent_access_role_id;
  if (!accessRole) {
    return interaction.reply({
      embeds: [errorEmbed("Operative rolü bulunamadı. Rol adı `Operative` olmalı.")],
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
    `**${interaction.user}** (\`${interaction.user.id}\`) yemin etti.`,
    `<t:${Math.floor(Date.now() / 1000)}:F>`,
  ].join("\n");

  // Sadece Handler kanalı (+ owner DM) — public'e düşmez
  const oathChannelId = settings.agent_oath_channel_id || settings.ticket_log_channel_id;
  if (oathChannelId) {
    const logCh = await interaction.guild.channels.fetch(oathChannelId).catch(() => null);
    if (logCh?.isTextBased()) {
      await logCh.send({
        embeds: [baseEmbed("YEMİN · gizli", oathText).setColor(GOLD)],
      });
    }
  }

  try {
    const owner = await interaction.guild.fetchOwner();
    if (owner.id !== interaction.user.id) {
      await owner
        .send(`Yemin: **${interaction.user.tag}** (\`${interaction.user.id}\`) · ${interaction.guild.name}`)
        .catch(() => null);
    }
  } catch {
    /* ignore */
  }

  return interaction.reply({
    embeds: [
      successEmbed("Yemin kaydedildi. Hoş geldin, Operative.\nKanallar artık senin."),
    ],
    ephemeral: true,
  });
}

export function saveAgentSettings(guildId, patch) {
  return updateSettings(guildId, patch);
}
