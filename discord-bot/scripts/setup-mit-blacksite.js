/**
 * Ultra-dark MIT / IMF blacksite rebuild.
 * NEVER deletes #xzon — moves it into SIGNAL.
 * Cleans spam roles. Locks @everyone everywhere.
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
const BLOOD = 0x2b0505;
const ASH = 0x1a1a1a;
const BRASS = 0x6b5a3e;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Exact names only — do NOT keep lowercase spam "xzon" clones
const KEEP_ROLES = new Set([
  "XZON",
  "Giriş",
  "Operative",
  "Ghost",
  "Handler",
  "Boost",
  "Dyno",
  "Cortex",
  "ServerStats",
  "Hackerbot",
  "HeckerBot",
  "ErensiBOT",
]);

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
const KEEP_CH = new Set(xzon ? [xzon.id] : []);

console.log("START", guild.name, "keep#", [...KEEP_CH]);

try {
  await guild.setName("XZON · BLACKSITE");
} catch (e) {
  console.warn("name", e.message);
}
try {
  await guild.edit({
    description: "CLASSIFIED — IMF blacksite. Entry only. Legal ops. Disavowed if compromised.",
  });
} catch {}

// Wipe channels except #xzon
const toDelete = [...guild.channels.cache.values()]
  .filter((c) => !KEEP_CH.has(c.id))
  .sort((a, b) => {
    if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
    if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
    return 0;
  });

for (const ch of toDelete) {
  try {
    await ch.delete("mit blacksite rebuild");
    console.log("del", ch.name);
  } catch (e) {
    console.warn("!", ch.name, e.message);
  }
  await sleep(320);
}
await sleep(600);
await guild.channels.fetch();
if (xzon) xzon = await guild.channels.fetch(xzon.id).catch(() => xzon);

// Role cleanup — spam / meme / junk
await guild.roles.fetch();
const junk = [...guild.roles.cache.values()].filter((r) => {
  if (r.id === guild.id) return false;
  if (r.managed) return false;
  if (KEEP_ROLES.has(r.name)) return false;
  if (r.position >= me.roles.highest.position) return false;
  return true;
});
console.log("junk roles", junk.length);
for (const r of junk) {
  try {
    await r.delete("blacksite cleanup");
    console.log("-role", r.name);
  } catch (e) {
    console.warn("!role", r.name, e.message);
  }
  await sleep(280);
}
await guild.roles.fetch();

async function ensureRole(name, color, hoist = true) {
  let r = guild.roles.cache.find((x) => x.name === name);
  if (!r) {
    r = await guild.roles.create({
      name,
      colors: { primaryColor: color },
      hoist,
      mentionable: false,
      reason: "mit blacksite",
    });
    console.log("+role", name);
    await sleep(300);
  } else {
    await r
      .edit({
        colors: { primaryColor: color },
        hoist,
        mentionable: false,
        reason: "mit blacksite",
      })
      .catch(() => null);
  }
  return r;
}

const rJoin = await ensureRole("Giriş", 0x222222, false);
const rAccess = await ensureRole("Operative", BLOOD, true);
const rSworn = await ensureRole("Ghost", BRASS, true);
const rHandler = await ensureRole("Handler", 0x3d0a0a, true);

// Stack: Handler > Ghost > Operative > Giriş (under bot)
try {
  await guild.roles.setPositions([
    { role: rHandler.id, position: me.roles.highest.position - 1 },
    { role: rSworn.id, position: me.roles.highest.position - 2 },
    { role: rAccess.id, position: me.roles.highest.position - 3 },
    { role: rJoin.id, position: me.roles.highest.position - 4 },
  ]);
  console.log("role stack ok");
} catch (e) {
  console.warn("stack", e.message);
}

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
const RO = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory];
const VC = [...RW, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];
const BOT = [
  ...VC,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageRoles,
];

// Vault: Giriş sees only — cannot speak. Operative can peek entry (optional).
const gateOW = [
  deny,
  {
    id: rJoin.id,
    allow: RO,
    deny: [PermissionFlagsBits.SendMessages],
  },
  allow(rHandler.id, RW),
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
    reason: "mit blacksite",
  });
  console.log("+CAT", name);
  await sleep(280);
  return c;
}
async function text(parent, name, topic, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parent.id,
    topic,
    permissionOverwrites: ow,
    reason: "mit blacksite",
  });
  console.log("+", name, "→", parent.name);
  await sleep(280);
  return c;
}
async function voice(parent, name, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parent.id,
    permissionOverwrites: ow,
    reason: "mit blacksite",
  });
  console.log("+vc", name, "→", parent.name);
  await sleep(280);
  return c;
}

const cGate = await cat("◈ CLASSIFIED", gateOW);
const cSignal = await cat("◈ IMF · SIGNAL", agentOW);
const cField = await cat("◈ BLACK OPS", agentOW);
const cTickets = await cat("◈ BURN BAG", ticketOW);
const cStaff = await cat("◈ DIRECTORATE", handlerOW);
const cVoice = await cat("◈ FREQUENCIES", voiceOW);

const giris = await text(cGate, "giriş", "Kapı. Sessizlik. Panel.", gateOW);
const protokol = await text(cGate, "protokol", "Kurallar — okunur, yazılmaz", gateOW);

if (xzon) {
  await xzon.edit({
    parent: cSignal.id,
    topic: "Primary signal — protected. Do not delete.",
    permissionOverwrites: agentOW,
    reason: "mit blacksite keep",
  });
  console.log("kept #xzon", xzon.id, "→", cSignal.name);
} else {
  xzon = await text(cSignal, "xzon", "Primary signal", agentOW);
}

const briefing = await text(cSignal, "briefing", "Mission briefing — eyes only", agentOW);
const deadDrop = await text(cSignal, "dead-drop", "Internal signals", agentOW);

await text(cField, "surveillance", "Watch / intel", agentOW);
await text(cField, "extraction", "After-action", agentOW);
await text(cField, "safehouse", "Crew only", agentOW);

const handlerLog = await text(cStaff, "handler-log", "Directorate eyes only", handlerOW);

await voice(cVoice, "War Room", voiceOW);
await voice(cVoice, "Ghost Line", voiceOW);
await voice(cVoice, "Silence", voiceOW);

// Lock @everyone server-wide defaults a bit tighter via channel overs (already deny View)

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
      .setColor(BLOOD)
      .setTitle("BLACKSITE PROTOCOL")
      .setDescription(
        [
          "```",
          " CLASSIFIED // IMF",
          "```",
          "",
          "1. Kapıdan girersin. İçeriyi görmezsin.",
          "2. `#giriş` → **Başvur** / **Destek**",
          "3. Handler konuşur → Onayla",
          "4. Operative → `/yemin` → Ghost",
          "5. Yemin sadece Directorate görür",
          "",
          "Legal only. İzinsiz iş yok.",
          "Gürültü yok. Işık yok. İsim yok.",
          "Yakalanırsan — biz seni tanımıyoruz.",
        ].join("\n"),
      )
      .setFooter({ text: "This message will not self-destruct." }),
  ],
});

await giris.send(buildAgentEntryPanel());

await briefing.send({
  embeds: [
    new EmbedBuilder()
      .setColor(ASH)
      .setTitle("BRIEFING")
      .setDescription(
        [
          "Good evening, Operative.",
          "",
          "Your mission, should you choose to accept it:",
          "sessiz kal · birbirini koru · sinyal bırakma.",
          "",
          "`#dead-drop` · `#safehouse` · `#surveillance`",
          "",
          "As always — if you are caught, the Secretary will disavow any knowledge of your actions.",
        ].join("\n"),
      )
      .setFooter({ text: "XZON · BLACKSITE" }),
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

await guild.channels.fetch();
console.log("--- FINAL ---");
for (const ch of [...guild.channels.cache.values()].sort(
  (a, b) => (a.parent?.position ?? a.position) - (b.parent?.position ?? b.position) || a.position - b.position,
)) {
  const p = ch.parent ? `  ${ch.parent.name}/` : "CAT ";
  console.log(p + ch.name);
}

console.log(
  JSON.stringify(
    {
      guild: guild.name,
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
