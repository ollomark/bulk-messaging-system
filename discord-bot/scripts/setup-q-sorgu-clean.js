/**
 * Clean XZON #SORGU layout on q?? (1511774336145555627).
 * Same shape as the old server — legal channel names only.
 * Keeps #anc. No sorgu / bomber / nuke / free-account channels.
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
import { buildTicketPanel } from "../src/systems/tickets.js";

const GUILD_ID = process.env.TARGET_GUILD_ID || "1511774336145555627";
const RED = 0xb91c1c;
const INK = 0x111111;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

let anc = guild.channels.cache.find(
  (c) => c.name.toLowerCase() === "anc" && c.type !== ChannelType.GuildCategory,
);
const KEEP = new Set(anc ? [anc.id] : []);
console.log("START", guild.name, "keep", [...KEEP]);

try {
  await guild.setName("XZON #SORGU");
} catch (e) {
  console.warn("name", e.message);
}
try {
  await guild.edit({
    description: "XZON #SORGU — topluluk · destek · duyuru. Legal only.",
  });
} catch {}

const toDelete = [...guild.channels.cache.values()]
  .filter((c) => !KEEP.has(c.id))
  .sort((a, b) => {
    if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
    if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
    return 0;
  });

for (const ch of toDelete) {
  try {
    await ch.delete("q sorgu clean restore");
    console.log("del", ch.name);
  } catch (e) {
    console.warn("!", ch.name, e.message);
  }
  await sleep(300);
}
await sleep(500);
await guild.channels.fetch();
if (anc) anc = await guild.channels.fetch(anc.id).catch(() => anc);

async function ensureRole(name, color, hoist = true) {
  let r = guild.roles.cache.find((x) => x.name === name);
  if (!r) {
    r = await guild.roles.create({
      name,
      colors: { primaryColor: color },
      hoist,
      mentionable: false,
      reason: "q sorgu clean",
    });
    console.log("+role", name);
    await sleep(280);
  }
  return r;
}

const rStaff = await ensureRole("Ekip", 0x4a0404, true);
const rDestek = await ensureRole("Destek", 0x8b4513, true);
const rUye = await ensureRole("Üye", 0x2a2a2a, false);
const rBoost = guild.roles.cache.find((r) => /boost/i.test(r.name));

const deny = { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] };
const allow = (id, perms) => ({ id, allow: perms });
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

const publicOW = [
  allow(guild.id, RW),
  allow(rStaff.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(me.id, BOT),
];
const readOnlyOW = [
  {
    id: guild.id,
    allow: RO,
    deny: [PermissionFlagsBits.SendMessages],
  },
  allow(rStaff.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(me.id, BOT),
];
const staffOW = [
  deny,
  allow(rStaff.id, [...RW, PermissionFlagsBits.ManageMessages]),
  allow(rDestek.id, RW),
  allow(me.id, BOT),
];
const logOW = [
  deny,
  allow(rStaff.id, RO.concat([PermissionFlagsBits.SendMessages])),
  allow(me.id, BOT),
];
const boostOW = rBoost
  ? [
      deny,
      allow(rBoost.id, RW),
      allow(rStaff.id, [...RW, PermissionFlagsBits.ManageMessages]),
      allow(me.id, BOT),
    ]
  : staffOW;
const ticketOW = [
  deny,
  allow(rDestek.id, RW),
  allow(rStaff.id, RW),
  allow(me.id, BOT),
];
const voiceOW = [
  allow(guild.id, VC),
  allow(rStaff.id, VC),
  allow(me.id, BOT),
];

async function cat(name, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: ow,
    reason: "q sorgu clean",
  });
  console.log("+CAT", name);
  await sleep(260);
  return c;
}
async function text(parent, name, topic, ow) {
  const c = await guild.channels.create({
    name,
    type: 0, // GuildText — announcement (5) needs COMMUNITY
    parent: parent?.id,
    topic,
    permissionOverwrites: ow,
    reason: "q sorgu clean",
  });
  console.log("+", name);
  await sleep(260);
  return c;
}
async function voice(parent, name, ow) {
  const c = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parent.id,
    permissionOverwrites: ow,
    reason: "q sorgu clean",
  });
  console.log("+vc", name);
  await sleep(260);
  return c;
}

const cMain = await cat("__", publicOW);
const cEkip = await cat("EKİP", staffOW);
const cLog = await cat("LOG", logOW);
const cTopluluk = await cat("TOPLULUK", publicOW);
const cKayit = await cat("KAYIT", publicOW);
const cTickets = await cat("TICKET", ticketOW);

await voice(cMain, "XZON #SORGU", voiceOW);
const kurallar = await text(cMain, "kurallar", "Kurallar — okunur", readOnlyOW);
const announcement = await text(cMain, "duyurular", "Duyurular", readOnlyOW);
const xzon = await text(cMain, "xzon", "Ana duyuru", readOnlyOW);
const panelCh = await text(cMain, "panel", "Bilgi paneli", readOnlyOW);
const destek = await text(cMain, "destek", "Destek ticket paneli", readOnlyOW);
await text(cMain, "yapay-zeka-sohbet", "AI sohbet", publicOW);
await text(cMain, "partner", "Partnerlik", readOnlyOW);
await text(cMain, "öneri-istek", "Öneri / istek", publicOW);
await text(cMain, "booster-özel", "Booster özel", boostOW);

if (anc) {
  await anc.edit({
    parent: cMain.id,
    topic: "Korunan kanal",
    permissionOverwrites: publicOW,
    reason: "keep anc",
  });
  console.log("kept #anc", anc.id);
}

await text(cEkip, "duyuru", "Ekip duyuru", staffOW);
await text(cEkip, "panel-ekip", "Ekip paneli", staffOW);
await text(cEkip, "ihbar", "İhbar / şikayet iç", staffOW);
await text(cEkip, "yapay-zeka", "Ekip AI", staffOW);
await text(cEkip, "sunucu-sablon", "Kendi sunucu şablonları", staffOW);
await text(cEkip, "ozel-bot-talep", "Özel bot talepleri", staffOW);

const logs = await text(cLog, "logs", "Genel log", logOW);
await text(cLog, "koruma", "Koruma log", logOW);
await text(cLog, "xzon-log", "XZON log", logOW);

await text(cTopluluk, "sohbet", "Genel sohbet", publicOW);
await text(cTopluluk, "projeler", "Projeler", publicOW);
await text(cTopluluk, "medya", "Medya", publicOW);
await text(cTopluluk, "oyun", "Oyun", publicOW);

const kayit = await text(cKayit, "kayit", "Kayıt / hoş geldin", publicOW);
await text(null, "moderator-only", "Mod only", staffOW);
await text(null, "hosgeldin", "Hoş geldin", readOnlyOW);

updateSettings(guild.id, {
  ticket_category_id: cTickets.id,
  ticket_support_role_id: rDestek.id,
  ticket_log_channel_id: logs.id,
  announce_channel_id: announcement.id,
  log_channel_id: logs.id,
  auto_role_id: rUye.id,
  welcome_enabled: 0,
  verify_enabled: 0,
});

await kurallar.send({
  embeds: [
    new EmbedBuilder()
      .setColor(RED)
      .setTitle("XZON #SORGU · KURALLAR")
      .setDescription(
        [
          "1. Saygılı ol. Toxiklik / hakaret yok.",
          "2. Spam, reklam, scam yok.",
          "3. Yasadışı içerik / hesap satışı / saldırı aracı yok.",
          "4. Destek için `#destek` → Ticket Aç.",
          "5. Kurallara uymayanlar uzaklaştırılır.",
        ].join("\n"),
      )
      .setFooter({ text: "Legal only." }),
  ],
});

await panelCh.send({
  embeds: [
    new EmbedBuilder()
      .setColor(INK)
      .setTitle("PANEL")
      .setDescription(
        [
          "Bilgi paneli — hesap dağıtımı yok.",
          "",
          "`#destek` → ticket",
          "`#xzon` → duyurular",
          "`#öneri-istek` → isteklerin",
          "",
          "Web chat / owner panel bot üzerinden.",
        ].join("\n"),
      ),
  ],
});

await destek.send(buildTicketPanel());

await xzon.send({
  embeds: [
    new EmbedBuilder()
      .setColor(RED)
      .setTitle("XZON #SORGU")
      .setDescription("Sunucu temiz düzenle yeniden açıldı.\n`#destek` · `#sohbet` · `#panel`"),
  ],
});

try {
  const owner = await guild.fetchOwner();
  await owner.roles.add([rStaff.id, rDestek.id, rUye.id]);
  console.log("owner roles ok", owner.user.tag);
} catch (e) {
  console.warn(e.message);
}

await guild.channels.fetch();
console.log("--- FINAL ---");
for (const ch of [...guild.channels.cache.values()].sort(
  (a, b) => (a.parent?.position ?? a.position) - (b.parent?.position ?? b.position) || a.position - b.position,
)) {
  console.log((ch.parent ? `  ${ch.parent.name}/` : "CAT ") + ch.name);
}

console.log(
  JSON.stringify(
    {
      guild: guild.name,
      id: guild.id,
      destek: destek.id,
      tickets: cTickets.id,
      logs: logs.id,
      staff: rStaff.id,
      destekRole: rDestek.id,
      anc: anc?.id || null,
    },
    null,
    2,
  ),
);

client.destroy();
process.exit(0);
