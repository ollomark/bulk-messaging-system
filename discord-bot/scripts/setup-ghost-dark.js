/**
 * Dark MI / Ghost Protocol rebuild.
 * NEVER deletes #xzon if present — moves it into AGENT HQ.
 */
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { runMigrations } from "../src/database/migrations.js";
import { updateSettings } from "../src/database/settings.js";
import { buildAgentEntryPanel } from "../src/systems/agentGate.js";

const GUILD_ID = process.env.GUILD_ID || "1246681493913206795";
const RED = 0x3f0d0d;
const GOLD = 0x8b7355;
const INK = 0x0a0a0a;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapPool(items, n, fn) {
  let i = 0;
  async function run() {
    while (i < items.length) await fn(items[i++]);
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length || 1) }, () => run()));
}

runMigrations();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});
await client.login(process.env.DISCORD_TOKEN);
await new Promise((r) => client.once("clientReady", r));

const guild = await client.guilds.fetch(GUILD_ID);
const me = await guild.members.fetchMe();
await guild.channels.fetch();
await guild.roles.fetch();

let xzon = guild.channels.cache.find(
  (c) => c.name === "xzon" && c.type !== ChannelType.GuildCategory,
);
const KEEP = new Set(xzon ? [xzon.id] : []);

console.log("START", guild.name, "keep", [...KEEP]);

try {
  await guild.setName("XZON · GHOST");
} catch (e) {
  console.warn("name", e.message);
}
try {
  await guild.edit({
    description:
      "GHOST PROTOCOL — classified. Entry only. Legal ops. This message will not self-destruct.",
  });
} catch {}

const toDelete = [...guild.channels.cache.values()]
  .filter((c) => !KEEP.has(c.id))
  .sort((a, b) => {
    if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
    if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
    return 0;
  });

await mapPool(toDelete, 8, async (ch) => {
  if (KEEP.has(ch.id)) return;
  try {
    await ch.delete("ghost dark rebuild");
    console.log("del", ch.name);
  } catch (e) {
    console.warn("!", ch.name, e.message);
  }
});
await sleep(800);
await guild.channels.fetch();
if (xzon) xzon = await guild.channels.fetch(xzon.id).catch(() => xzon);
console.log("after wipe", [...guild.channels.cache.values()].map((c) => c.name).join(", "));

async function ensureRole(name, color) {
  let r = guild.roles.cache.find((x) => x.name === name);
  if (!r) {
    r = await guild.roles.create({
      name,
      colors: { primaryColor: color },
      hoist: true,
      reason: "ghost dark",
    });
    console.log("+role", name);
    await sleep(280);
  }
  return r;
}

const rJoin = await ensureRole("Giriş", 0x2a2a2a);
const rAccess = await ensureRole("Operative", RED);
const rSworn = await ensureRole("Ghost", GOLD);
const rHandler = await ensureRole("Handler", 0x4a0404);

const deny = { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] };
const allow = (id, p) => ({ id, allow: p });
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

const gateOW = [
  deny,
  {
    id: rJoin.id,
    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
    deny: [PermissionFlagsBits.SendMessages],
  },
  allow(rHandler.id, RW),
  allow(rAccess.id, [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]),
  allow(me.id, BOT),
];
const agentOW = [
  deny,
  allow(rAccess.id, RW),
  allow(rSworn.id, RW),
  allow(rHandler.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(me.id, BOT),
];
const handlerOW = [
  deny,
  allow(rHandler.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(me.id, BOT),
];
const ticketOW = [deny, allow(rHandler.id, RW), allow(me.id, BOT)];
const voiceOW = [
  deny,
  allow(rAccess.id, VC),
  allow(rSworn.id, VC),
  allow(rHandler.id, VC),
  allow(me.id, BOT),
];

async function cat(name, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: ow,
    reason: "ghost dark",
  });
  console.log("+CAT", name);
  await sleep(250);
  return c;
}
async function text(parent, name, topic, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parent.id,
    topic,
    permissionOverwrites: ow,
    reason: "ghost dark",
  });
  console.log("+", name);
  await sleep(250);
  return c;
}
async function voice(parent, name, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parent.id,
    permissionOverwrites: ow,
    reason: "ghost dark",
  });
  console.log("+vc", name);
  await sleep(250);
  return c;
}

const cGate = await cat("━━ THE VAULT ━━", gateOW);
const cHq = await cat("━━ SHADOW NET ━━", agentOW);
const cField = await cat("━━ BLACK SITE ━━", agentOW);
const cTickets = await cat("━━ DEAD DROPS ━━", ticketOW);
const cStaff = await cat("━━ DIRECTOR ━━", handlerOW);
const cVoice = await cat("━━ FREQUENCIES ━━", voiceOW);

const giris = await text(cGate, "giriş", "Kapı. Panel. Sessizlik.", gateOW);
const protokol = await text(cGate, "protokol", "Kurallar — okunur, yazılmaz", gateOW);

if (xzon) {
  await xzon.edit({
    parent: cHq.id,
    topic: "Primary signal — protected",
    permissionOverwrites: agentOW,
  });
  console.log("kept #xzon", xzon.id);
} else {
  xzon = await text(cHq, "xzon", "Primary signal", agentOW);
}

const briefing = await text(cHq, "briefing", "Mission briefing", agentOW);
const deadDrop = await text(cHq, "dead-drop", "Internal signals", agentOW);
const safehouse = await text(cHq, "safehouse", "Crew only", agentOW);

const surveillance = await text(cField, "surveillance", "Watch / intel", agentOW);
const gadgets = await text(cField, "gadgets", "Build / tools", agentOW);
const extraction = await text(cField, "extraction", "After-action", agentOW);

const handlerLog = await text(cStaff, "handler-log", "Eyes only", handlerOW);

await voice(cVoice, "War Room", voiceOW);
await voice(cVoice, "Ghost Line", voiceOW);
await voice(cVoice, "Silence", voiceOW);

updateSettings(guild.id, {
  agent_join_role_id: rJoin.id,
  auto_role_id: rJoin.id,
  agent_access_role_id: rAccess.id,
  agent_handler_role_id: rHandler.id,
  agent_sworn_role_id: rSworn.id,
  agent_entry_channel_id: giris.id,
  agent_oath_channel_id: handlerLog.id,
  ticket_category_id: cTickets.id,
  ticket_support_role_id: rHandler.id,
  ticket_log_channel_id: handlerLog.id,
  announce_channel_id: null,
  welcome_enabled: 0,
  verify_enabled: 0,
});

await protokol.send({
  embeds: [
    new EmbedBuilder()
      .setColor(RED)
      .setTitle("GHOST PROTOCOL")
      .setDescription(
        [
          "```",
          " CLASSIFIED",
          "```",
          "",
          "1. Kapıdan girersin. İçeriyi görmezsin.",
          "2. `#giriş` → **Başvur** / **Destek**",
          "3. Handler konuşur → Onayla",
          "4. Operative olursun → `/yemin`",
          "5. Yemin sadece Director görür",
          "",
          "Legal only. İzinsiz iş yok.",
          "Gürültü yok. Işık yok. Sadece sinyal.",
        ].join("\n"),
      )
      .setFooter({ text: "This message will not self-destruct." }),
  ],
});

await giris.send(buildAgentEntryPanel());

await briefing.send({
  embeds: [
    new EmbedBuilder()
      .setColor(INK)
      .setTitle("BRIEFING")
      .setDescription(
        [
          "Good evening, Operative.",
          "",
          "Your mission, should you choose to accept it:",
          "birlikte üret · sessiz kal · birbirini koru.",
          "",
          "`#dead-drop` · `#gadgets` · `#safehouse`",
          "",
          "As always — if you are caught, we will disavow.",
        ].join("\n"),
      ),
  ],
});

try {
  const owner = await guild.fetchOwner();
  await owner.roles.add([rHandler.id, rAccess.id, rSworn.id]);
  if (owner.roles.cache.has(rJoin.id)) await owner.roles.remove(rJoin.id).catch(() => null);
  console.log("director", owner.user.tag);
} catch (e) {
  console.warn(e.message);
}

console.log(
  JSON.stringify(
    {
      giris: giris.id,
      xzon: xzon.id,
      join: rJoin.id,
      access: rAccess.id,
      sworn: rSworn.id,
      handler: rHandler.id,
      tickets: cTickets.id,
      log: handlerLog.id,
    },
    null,
    2,
  ),
);

client.destroy();
process.exit(0);
