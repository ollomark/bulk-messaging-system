import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import db from "../database/db.js";
import { config } from "../config.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { brand } from "../utils/brand.js";

const CHANNEL_NAME = "egexzon-radar";
const CHANNEL_TOPIC = "Canlı tehdit radarı · hacker harita · egexzon hedef ağı";
const DEFAULT_INTERVAL_MS = Number(process.env.THREAT_RADAR_INTERVAL_MS || 3 * 60 * 1000);
const MAX_POSTS_PER_TICK = 2;

const TARGET = {
  lat: 39.0,
  lon: 35.0,
  label: "egexzon",
  country: "TR",
  city: "Türkiye",
};

const VECTORS = ["DDoS", "Botnet C2", "Ransomware", "Exploit Kit", "Phishing", "Brute Force", "APT Probe"];

const COUNTRY_NAMES = {
  US: "ABD",
  CN: "Çin",
  RU: "Rusya",
  DE: "Almanya",
  NL: "Hollanda",
  GB: "İngiltere",
  FR: "Fransa",
  BR: "Brezilya",
  IN: "Hindistan",
  IR: "İran",
  KP: "K.Kore",
  VN: "Vietnam",
  UA: "Ukrayna",
  RO: "Romanya",
  TR: "Türkiye",
  KR: "G.Kore",
  JP: "Japonya",
  CA: "Kanada",
  AU: "Avustralya",
  PL: "Polonya",
  ES: "İspanya",
  IT: "İtalya",
  SE: "İsveç",
  HK: "Hong Kong",
  SG: "Singapur",
};

const COUNTRY_COORDS = {
  US: { lat: 37.09, lon: -95.71 },
  CN: { lat: 35.86, lon: 104.19 },
  RU: { lat: 61.52, lon: 105.31 },
  DE: { lat: 51.16, lon: 10.45 },
  NL: { lat: 52.13, lon: 5.29 },
  GB: { lat: 55.37, lon: -3.43 },
  FR: { lat: 46.22, lon: 2.21 },
  BR: { lat: -14.23, lon: -51.92 },
  IN: { lat: 20.59, lon: 78.96 },
  IR: { lat: 32.42, lon: 53.68 },
  KP: { lat: 40.33, lon: 127.51 },
  VN: { lat: 14.05, lon: 108.27 },
  UA: { lat: 48.37, lon: 31.16 },
  RO: { lat: 45.94, lon: 24.96 },
  TR: { lat: 38.96, lon: 35.24 },
  KR: { lat: 35.9, lon: 127.76 },
  JP: { lat: 36.2, lon: 138.25 },
  CA: { lat: 56.13, lon: -106.34 },
  AU: { lat: -25.27, lon: 133.77 },
  PL: { lat: 51.91, lon: 19.14 },
  ES: { lat: 40.46, lon: -3.74 },
  IT: { lat: 41.87, lon: 12.56 },
  SE: { lat: 60.12, lon: 18.64 },
  HK: { lat: 22.39, lon: 114.1 },
  SG: { lat: 1.35, lon: 103.81 },
};

/** @type {Array<object>} */
let liveEvents = [];
let totalIntercepted = 0;
let timer = null;
const postedDiscord = new Set();

db.exec(`
  CREATE TABLE IF NOT EXISTS threat_radar_seen (
    id TEXT PRIMARY KEY,
    posted_at INTEGER NOT NULL
  );
`);

function countryName(code) {
  if (!code) return "Bilinmiyor";
  const c = String(code).toUpperCase();
  return COUNTRY_NAMES[c] || c;
}

function countryCoords(code) {
  const c = String(code || "US").toUpperCase();
  return COUNTRY_COORDS[c] || { lat: (Math.random() - 0.5) * 120, lon: (Math.random() - 0.5) * 360 };
}

function flagEmoji(code) {
  const c = String(code || "XX").toUpperCase();
  if (c.length !== 2) return "🏴";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function isSeen(id) {
  return Boolean(db.prepare("SELECT 1 FROM threat_radar_seen WHERE id = ?").get(id));
}

function markSeen(id) {
  db.prepare("INSERT OR IGNORE INTO threat_radar_seen (id, posted_at) VALUES (?, ?)").run(id, Date.now());
}

function pushEvent(event) {
  liveEvents.unshift(event);
  if (liveEvents.length > 80) liveEvents.length = 80;
  totalIntercepted += 1;
}

export function getLiveRadarEvents(limit = 50) {
  return {
    target: TARGET,
    brand: brand.invite,
    total: totalIntercepted,
    events: liveEvents.slice(0, limit),
  };
}

export function getRadarPublicUrl() {
  const base = process.env.RADAR_PUBLIC_URL || process.env.PANEL_PUBLIC_URL;
  if (base) return `${base.replace(/\/$/, "")}/radar`;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railway) return `https://${railway}/radar`;
  return null;
}

async function fetchFeodoEvents() {
  const events = [];
  try {
    const res = await fetch("https://feodotracker.abuse.ch/downloads/ipblocklist.json", {
      headers: { "User-Agent": "egexzon-radar/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return events;
    const rows = await res.json();
    for (const row of rows.slice(0, 40)) {
      const cc = row.country || row.country_code;
      if (!cc || cc === TARGET.country) continue;
      const src = countryCoords(cc);
      events.push({
        id: `feodo:${row.ip_address}`,
        ip: row.ip_address,
        sourceCode: cc,
        sourceName: countryName(cc),
        sourceLat: src.lat,
        sourceLon: src.lon,
        vector: row.malware || VECTORS[Math.floor(Math.random() * VECTORS.length)],
        severity: row.status === "online" ? "CRITICAL" : "HIGH",
        target: TARGET.label,
        targetLat: TARGET.lat,
        targetLon: TARGET.lon,
      });
    }
  } catch (e) {
    console.warn("radar feodo", e.message);
  }
  return events;
}

async function fetchThreatFoxEvents() {
  const events = [];
  try {
    const res = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "egexzon-radar/1.0" },
      body: JSON.stringify({ query: "get_iocs", days: 1 }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return events;
    const data = await res.json();
    for (const row of (data.data || []).slice(0, 20)) {
      const ip = row.ioc?.match(/\d{1,3}(?:\.\d{1,3}){3}/)?.[0];
      if (!ip) continue;
      let cc = "US";
      try {
        const geo = await fetch(
          `http://ip-api.com/json/${ip}?fields=status,countryCode,lat,lon`,
          { signal: AbortSignal.timeout(5000) },
        );
        const g = await geo.json();
        if (g.status === "success") cc = g.countryCode;
      } catch {
        /* keep default */
      }
      if (cc === TARGET.country) continue;
      const src = countryCoords(cc);
      events.push({
        id: `tf:${row.id || ip}`,
        ip,
        sourceCode: cc,
        sourceName: countryName(cc),
        sourceLat: src.lat,
        sourceLon: src.lon,
        vector: row.malware_printable || row.threat_type || "Malware",
        severity: row.confidence_level >= 75 ? "CRITICAL" : "HIGH",
        target: TARGET.label,
        targetLat: TARGET.lat,
        targetLon: TARGET.lon,
      });
    }
  } catch (e) {
    console.warn("radar threatfox", e.message);
  }
  return events;
}

function synthFallbackEvents(count = 5) {
  const codes = Object.keys(COUNTRY_COORDS).filter((c) => c !== TARGET.country);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const cc = codes[Math.floor(Math.random() * codes.length)];
    const src = countryCoords(cc);
    out.push({
      id: `sim:${Date.now()}:${i}:${cc}`,
      ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      sourceCode: cc,
      sourceName: countryName(cc),
      sourceLat: src.lat + (Math.random() - 0.5) * 4,
      sourceLon: src.lon + (Math.random() - 0.5) * 4,
      vector: VECTORS[Math.floor(Math.random() * VECTORS.length)],
      severity: Math.random() > 0.7 ? "CRITICAL" : "HIGH",
      target: TARGET.label,
      targetLat: TARGET.lat,
      targetLon: TARGET.lon,
      simulated: true,
    });
  }
  return out;
}

export async function collectThreatEvents() {
  const feodo = await fetchFeodoEvents();
  const fox = await fetchThreatFoxEvents();
  const merged = [...feodo, ...fox];
  if (merged.length < 8) merged.push(...synthFallbackEvents(8 - merged.length));
  return merged;
}

export async function refreshRadarCache() {
  const raw = await collectThreatEvents();
  let added = 0;
  for (const e of raw) {
    if (isSeen(e.id)) continue;
    pushEvent({ ...e, at: Date.now() });
    markSeen(e.id);
    added += 1;
  }
  return added;
}

export function buildRadarEmbed(event) {
  const mapUrl = getRadarPublicUrl();
  const flag = flagEmoji(event.sourceCode);

  return new EmbedBuilder()
    .setColor(event.severity === "CRITICAL" ? 0xff0040 : 0x00ff9d)
    .setAuthor({ name: "▰ EGEXZON THREAT RADAR · LIVE" })
    .setTitle(`${flag} ${event.sourceName} → ${event.target.toUpperCase()}`)
    .setDescription(
      [
        "```ansi",
        "\u001b[1;32m▓▓▓ SALDIRI VEKTÖRÜ TESPİT EDİLDİ ▓▓▓\u001b[0m",
        "```",
        `▸ **Kaynak:** ${event.sourceName} (\`${event.sourceCode}\`)`,
        `▸ **Hedef:** **${event.target}** · ${TARGET.city}`,
        `▸ **Vektör:** ${event.vector}`,
        `▸ **Tehdit:** \`${event.severity}\``,
        `▸ **IP:** \`${event.ip || "MASKED"}\``,
        "",
        mapUrl ? `🗺️ **[Canlı Haritayı Aç](${mapUrl})**` : "🗺️ Canlı harita panelde aktif",
      ].join("\n"),
    )
    .setFooter({ text: `${brand.invite} · THREAT RADAR · egexzon koruma ağı` })
    .setTimestamp(new Date(event.at || Date.now()));
}

export async function ensureRadarChannel(guild) {
  const settings = getSettings(guild.id);
  if (settings.threat_radar_channel_id) {
    const existing = await guild.channels.fetch(settings.threat_radar_channel_id).catch(() => null);
    if (existing?.isTextBased()) return existing;
  }

  const byName = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && /egexzon-radar|threat-radar/i.test(c.name),
  );
  if (byName) {
    updateSettings(guild.id, { threat_radar_channel_id: byName.id });
    return byName;
  }

  const me = guild.members.me;
  const channel = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
    topic: CHANNEL_TOPIC,
    reason: "egexzon tehdit radarı",
    permissionOverwrites: [
      {
        id: guild.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AddReactions,
        ],
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.SendMessagesInThreads,
          PermissionFlagsBits.CreatePublicThreads,
        ],
      },
      {
        id: me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ],
  });

  updateSettings(guild.id, { threat_radar_channel_id: channel.id });

  const mapUrl = getRadarPublicUrl();
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x001a0d)
        .setAuthor({ name: "▰ EGEXZON THREAT RADAR · INITIALIZING" })
        .setTitle("🗺️ Canlı Hacker Tehdit Haritası")
        .setDescription(
          [
            "Bu kanal **kilitli** — canlı saldırı vektörleri burada akar.",
            "",
            "▸ Dünya haritasında ülkelerden **egexzon** ağına çubuklar",
            "▸ Gerçek zamanlı botnet / malware / exploit vektörleri",
            "▸ Dark hacker arayüzü — uygulama gibi canlı radar",
            "",
            mapUrl
              ? `🖥️ **[Canlı Haritayı Aç](${mapUrl})** ← buradan izle`
              : "🖥️ Canlı harita bot panelinde `/radar`",
            "",
            "*Radar birkaç saniye içinde aktif olur…*",
          ].join("\n"),
        )
        .setFooter({ text: `${brand.invite} · THREAT RADAR` }),
    ],
  });

  return channel;
}

export async function postRadarAlerts(client, guildId, { limit = MAX_POSTS_PER_TICK } = {}) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return 0;

  const channel = await ensureRadarChannel(guild);
  await refreshRadarCache();

  const fresh = liveEvents.filter((e) => !postedDiscord.has(e.id)).slice(0, limit);
  let posted = 0;

  for (const event of fresh) {
    await channel.send({
      embeds: [buildRadarEmbed(event)],
      allowedMentions: { parse: [] },
    });
    postedDiscord.add(event.id);
    posted += 1;
    await new Promise((r) => setTimeout(r, 900));
  }

  return posted;
}

export async function setupThreatRadar(guild) {
  await refreshRadarCache();
  return ensureRadarChannel(guild);
}

async function tick(client) {
  const guildIds = new Set();
  const envGuild = process.env.THREAT_RADAR_GUILD_ID || config.guildId;
  if (envGuild) guildIds.add(envGuild);

  for (const row of db
    .prepare("SELECT guild_id FROM guild_settings WHERE threat_radar_channel_id IS NOT NULL")
    .all()) {
    guildIds.add(row.guild_id);
  }

  for (const guildId of guildIds) {
    try {
      const n = await postRadarAlerts(client, guildId);
      if (n > 0) console.log(`threat-radar: +${n} · guild=${guildId}`);
    } catch (e) {
      console.warn("threat-radar tick", guildId, e.message);
    }
  }
}

export function startThreatRadarScheduler(client) {
  if (timer) return;
  if (process.env.THREAT_RADAR_ENABLED === "0") {
    console.log("threat-radar: kapalı");
    return;
  }

  const boot = async () => {
    await refreshRadarCache().catch(() => null);
    const guildId = process.env.THREAT_RADAR_GUILD_ID || config.guildId;
    if (guildId) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (guild) await ensureRadarChannel(guild).catch((e) => console.warn("radar boot", e.message));
    }
    await tick(client);
  };

  setTimeout(boot, 15_000);
  timer = setInterval(() => tick(client), DEFAULT_INTERVAL_MS);
  console.log(`threat-radar: aktif · her ${Math.round(DEFAULT_INTERVAL_MS / 60_000)} dk`);
}
