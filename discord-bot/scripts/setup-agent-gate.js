/**
 * Wipe guild channels and rebuild agent gate layout.
 * Keeps nothing — full agent HQ with #giriş panel.
 *
 * Usage: node scripts/setup-agent-gate.js
 * Requires DISCORD_TOKEN; optional GUILD_ID (default XZON main).
 */
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { runMigrations } from "../src/database/migrations.js";
import { updateSettings } from "../src/database/settings.js";
import { buildAgentEntryPanel } from "../src/systems/agentGate.js";

const GUILD_ID = process.env.GUILD_ID || "1246681493913206795";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapPool(items, n, fn) {
  let i = 0;
  async function run() {
    while (i < items.length) await fn(items[i++]);
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => run()));
}

runMigrations();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
await client.login(process.env.DISCORD_TOKEN);
await new Promise((r) => client.once("clientReady", r));

const guild = await client.guilds.fetch(GUILD_ID);
const me = await guild.members.fetchMe();
await guild.channels.fetch();
console.log("START", guild.name, guild.channels.cache.size);

try {
  await guild.setName("XZON AGENT");
} catch (e) {
  console.warn("name", e.message);
}
try {
  await guild.edit({
    description: "XZON AGENT — giriş paneli · başvuru ticket · /yemin. Legal only.",
  });
} catch {}

// Wipe ALL channels
const all = [...guild.channels.cache.values()].sort((a, b) => {
  if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
  if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
  return 0;
});
await mapPool(all, 8, async (ch) => {
  try {
    await ch.delete("agent gate setup");
    console.log("del", ch.name);
  } catch (e) {
    console.warn("!", ch.name, e.message);
  }
});
await sleep(800);
await guild.channels.fetch();

async function ensureRole(name, color, hoist = true) {
  let role = guild.roles.cache.find((r) => r.name === name);
  if (!role) {
    role = await guild.roles.create({
      name,
      colors: { primaryColor: color },
      hoist,
      reason: "agent gate",
    });
    console.log("+role", name);
    await sleep(300);
  }
  return role;
}

const rJoin = await ensureRole("Giriş", 0x64748b, true);
const rAccess = await ensureRole("Operative", 0xed4245, true);
const rSworn = await ensureRole("Sworn", 0xc4a35a, true);
const rHandler = await ensureRole("Handler", 0x5865f2, true);

// Bot role must manage these
try {
  await rAccess.setPosition(Math.max(1, me.roles.highest.position - 2));
} catch {}

const denyEveryone = { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] };
const allow = (id, perms) => ({ id, allow: perms });
const RW = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.AddReactions,
];
const VC = [...RW, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];
const BOT = [
  ...VC,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageRoles,
];

const entryOW = [
  { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
  {
    id: rJoin.id,
    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
    deny: [PermissionFlagsBits.SendMessages],
  },
  allow(rHandler.id, RW),
  allow(me.id, BOT),
];

const agentOW = [
  denyEveryone,
  allow(rAccess.id, RW),
  allow(rSworn.id, RW),
  allow(rHandler.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(me.id, BOT),
];

const handlerOW = [
  denyEveryone,
  allow(rHandler.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(me.id, BOT),
];

const ticketCatOW = [
  denyEveryone,
  allow(rHandler.id, RW),
  allow(me.id, BOT),
];

async function cat(name, overwrites) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites,
    reason: "agent gate",
  });
  console.log("+CAT", name);
  await sleep(250);
  return c;
}

async function text(parent, name, topic, overwrites) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parent.id,
    topic,
    permissionOverwrites: overwrites,
    reason: "agent gate",
  });
  console.log("+", name);
  await sleep(250);
  return c;
}

async function voice(parent, name, overwrites) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parent.id,
    permissionOverwrites: overwrites,
    reason: "agent gate",
  });
  console.log("+vc", name);
  await sleep(250);
  return c;
}

const catGate = await cat("━ GATE ━", entryOW);
const catAgent = await cat("━ AGENT HQ ━", agentOW);
const catOps = await cat("━ OPS ━", agentOW);
const catTickets = await cat("━ TICKETS ━", ticketCatOW);
const catStaff = await cat("━ HANDLER ━", handlerOW);
const catVoice = await cat("━ COMMS ━", agentOW);

const giris = await text(catGate, "giriş", "Kapı — panel burada", entryOW);
const kurallar = await text(
  catGate,
  "protokol",
  "Herkes okuyabilir",
  [
    {
      id: guild.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
      deny: [PermissionFlagsBits.SendMessages],
    },
    allow(me.id, BOT),
  ],
);

const xzon = await text(catAgent, "xzon", "Ana sinyal", agentOW);
const anc = await text(catAgent, "anc", "Kritik duyuru", agentOW);
const briefing = await text(catAgent, "briefing", "Brifing", agentOW);
const lounge = await text(catAgent, "lounge", "Birlik sohbeti", agentOW);

const mission = await text(catOps, "mission-board", "Yasal görevler", agentOW);
const build = await text(catOps, "build-cell", "Kod / AI", agentOW);
const intel = await text(catOps, "intel", "Legal recon / training", agentOW);

const staffLog = await text(catStaff, "handler-log", "İç log", handlerOW);

await voice(catVoice, "War Room", [
  denyEveryone,
  allow(rAccess.id, VC),
  allow(rHandler.id, VC),
  allow(me.id, BOT),
]);
await voice(catVoice, "Focus", [
  denyEveryone,
  allow(rAccess.id, VC),
  allow(rHandler.id, VC),
  allow(me.id, BOT),
]);

updateSettings(guild.id, {
  agent_join_role_id: rJoin.id,
  auto_role_id: rJoin.id,
  agent_access_role_id: rAccess.id,
  agent_handler_role_id: rHandler.id,
  agent_sworn_role_id: rSworn.id,
  agent_entry_channel_id: giris.id,
  agent_oath_channel_id: xzon.id,
  ticket_category_id: catTickets.id,
  ticket_support_role_id: rHandler.id,
  ticket_log_channel_id: staffLog.id,
  announce_channel_id: anc.id,
  welcome_enabled: 0,
  verify_enabled: 0,
});

await kurallar.send({
  embeds: [
    {
      color: 0xb91c1c,
      title: "PROTOKOL",
      description: [
        "1. Legal only — izinsiz hack / scam yok",
        "2. `#giriş` panelinden **Başvur** veya **Destek**",
        "3. Ticket’ta konuş → Handler **Onayla**",
        "4. Onay sonrası `/yemin`",
        "5. Operative kanalları açılır",
        "",
        "Handler = ticket yönetimi.",
      ].join("\n"),
    },
  ],
});

await giris.send(buildAgentEntryPanel());
console.log("panel → #giriş");

await xzon.send({
  content: "Ana hat hazır. Yeminler buraya düşer.",
});

try {
  const owner = await guild.fetchOwner();
  await owner.roles.add([rHandler.id, rAccess.id, rSworn.id]);
  console.log("owner roles", owner.user.tag);
} catch (e) {
  console.warn("owner", e.message);
}

console.log(
  JSON.stringify(
    {
      giris: giris.id,
      xzon: xzon.id,
      access: rAccess.id,
      handler: rHandler.id,
      sworn: rSworn.id,
      tickets: catTickets.id,
    },
    null,
    2,
  ),
);

client.destroy();
process.exit(0);
