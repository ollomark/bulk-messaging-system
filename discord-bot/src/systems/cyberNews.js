import {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import db from "../database/db.js";
import { config } from "../config.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { brand } from "../utils/brand.js";

const CHANNEL_NAME = "siber-ajans";
const CHANNEL_TOPIC = "Canlı siber saldırı ve güvenlik istihbaratı · gizli ajans akışı";
const DEFAULT_INTERVAL_MS = Number(process.env.CYBER_NEWS_INTERVAL_MS || 10 * 60 * 1000);
const MAX_POSTS_PER_TICK = 3;

const AGENT_TAGS = [
  "SHADOW-7",
  "PHANTOM-X",
  "VORTEX-3",
  "NIGHTFALL",
  "SPECTRE-9",
  "BLACKICE",
  "CIPHER-0",
  "GHOSTLINE",
];

const DEFAULT_FEEDS = [
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "Krebs on Security", url: "https://krebsonsecurity.com/feed/" },
  { name: "CISA Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
];

const THREAT_KEYWORDS = [
  ["ransomware", "RANSOMWARE"],
  ["zero-day", "ZERO-DAY"],
  ["zero day", "ZERO-DAY"],
  ["breach", "DATA BREACH"],
  ["leak", "DATA LEAK"],
  ["exploit", "EXPLOIT"],
  ["malware", "MALWARE"],
  ["ddos", "DDoS"],
  ["apt", "APT"],
  ["vulnerability", "CVE"],
  ["cyber attack", "SALDIRI"],
  ["hack", "SALDIRI"],
  ["trojan", "TROJAN"],
  ["phishing", "PHISHING"],
];

let timer = null;
let agentIndex = 0;

db.exec(`
  CREATE TABLE IF NOT EXISTS cyber_news_seen (
    id TEXT PRIMARY KEY,
    posted_at INTEGER NOT NULL
  );
`);

function nextAgent() {
  const tag = AGENT_TAGS[agentIndex % AGENT_TAGS.length];
  agentIndex += 1;
  return tag;
}

function stripHtml(text) {
  return (text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i").exec(
    block,
  );
  if (cdata) return stripHtml(cdata[1]);
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  return plain ? stripHtml(plain[1]) : null;
}

function extractLink(block) {
  const link = extractTag(block, "link");
  if (link?.startsWith("http")) return link;
  const href = /<link[^>]+href=["']([^"']+)["']/i.exec(block)?.[1];
  if (href?.startsWith("http")) return href;
  const guid = extractTag(block, "guid");
  if (guid?.startsWith("http")) return guid;
  return guid || link || null;
}

function classifyThreat(title, description) {
  const blob = `${title} ${description}`.toLowerCase();
  for (const [keyword, label] of THREAT_KEYWORDS) {
    if (blob.includes(keyword)) return label;
  }
  return "INTEL";
}

function parseRssItems(xml) {
  const items = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of blocks.slice(0, 30)) {
    const title = extractTag(block, "title");
    const link = extractLink(block);
    if (!title || !link) continue;
    items.push({
      title,
      link,
      guid: link,
      pubDate: extractTag(block, "pubDate") || extractTag(block, "updated"),
      description: extractTag(block, "description") || extractTag(block, "summary") || "",
    });
  }
  return items;
}

function getFeeds() {
  const raw = process.env.CYBER_NEWS_FEEDS;
  if (!raw) return DEFAULT_FEEDS;
  return raw.split(",").map((url) => ({
    name: new URL(url.trim()).hostname.replace(/^www\./, ""),
    url: url.trim(),
  }));
}

function isSeen(id) {
  return Boolean(db.prepare("SELECT 1 FROM cyber_news_seen WHERE id = ?").get(id));
}

function markSeen(id) {
  db.prepare("INSERT OR IGNORE INTO cyber_news_seen (id, posted_at) VALUES (?, ?)").run(
    id,
    Date.now(),
  );
}

function buildIntelEmbed(item, sourceName) {
  const threat = classifyThreat(item.title, item.description);
  const agent = nextAgent();
  const summary = item.description.slice(0, 420) || "Detaylar kaynak bağlantısında.";
  const pub = item.pubDate ? `\n**Zaman:** ${item.pubDate}` : "";

  return new EmbedBuilder()
    .setColor(0x0b0f14)
    .setAuthor({ name: `▰ CYBER INTEL · AGENT-${agent}` })
    .setTitle(`[${threat}] ${item.title.slice(0, 240)}`)
    .setDescription(
      [
        `▸ **${summary}**`,
        "",
        `▸ **Kaynak:** ${sourceName}`,
        pub,
        "",
        "▸ *Gizli istihbarat akışı — canlı siber gelişmeler*",
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 4096),
    )
    .setURL(item.link)
    .setFooter({ text: `${brand.invite} · CANLI SİBER AJAN · ${sourceName}` })
    .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date());
}

export async function ensureCyberNewsChannel(guild) {
  const settings = getSettings(guild.id);
  if (settings.cyber_news_channel_id) {
    const existing = await guild.channels.fetch(settings.cyber_news_channel_id).catch(() => null);
    if (existing?.isTextBased()) return existing;
  }

  const byName = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && /siber-ajans/i.test(c.name),
  );
  if (byName) {
    updateSettings(guild.id, { cyber_news_channel_id: byName.id });
    return byName;
  }

  const me = guild.members.me;
  const channel = await guild.channels.create({
    name: CHANNEL_NAME,
    type: ChannelType.GuildText,
    topic: CHANNEL_TOPIC,
    reason: "Siber istihbarat kanalı",
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
          PermissionFlagsBits.CreatePrivateThreads,
        ],
      },
      {
        id: me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ],
  });

  updateSettings(guild.id, { cyber_news_channel_id: channel.id });

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x111827)
        .setAuthor({ name: "▰ CYBER INTEL · AJAN AĞI AKTİF" })
        .setTitle("🔒 Siber İstihbarat Kanalı")
        .setDescription(
          [
            "Bu kanal **kilitli** — sadece bot canlı haber basar.",
            "",
            "▸ Siber saldırılar · sızmalar · zero-day · ransomware",
            "▸ Dark ajans tarzı güncel gelişmeler",
            "▸ Kaynaklar: THN · BleepingComputer · Krebs · CISA",
            "",
            "*Akış birkaç dakika içinde başlar…*",
          ].join("\n"),
        )
        .setFooter({ text: `${brand.invite} · CANLI SİBER AJAN` }),
    ],
  });

  return channel;
}

async function fetchAllNews() {
  const feeds = getFeeds();
  const all = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "egexzon-cyber-intel/1.0 (+discord bot)" },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const items = parseRssItems(xml);
      for (const item of items) {
        all.push({ ...item, sourceName: feed.name });
      }
    } catch (e) {
      console.warn("cyber-news feed", feed.url, e.message);
    }
  }

  return all;
}

export async function postCyberNews(client, guildId, { limit = MAX_POSTS_PER_TICK } = {}) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return 0;

  const channel = await ensureCyberNewsChannel(guild);
  const items = await fetchAllNews();
  let posted = 0;

  for (const item of items) {
    if (posted >= limit) break;
    const id = `${item.sourceName}:${item.guid}`;
    if (isSeen(id)) continue;

    await channel.send({
      embeds: [buildIntelEmbed(item, item.sourceName)],
      allowedMentions: { parse: [] },
    });
    markSeen(id);
    posted += 1;
    await new Promise((r) => setTimeout(r, 1200));
  }

  return posted;
}

async function tick(client) {
  const guildIds = new Set();

  const envGuild = process.env.CYBER_NEWS_GUILD_ID || config.guildId;
  if (envGuild) guildIds.add(envGuild);

  for (const row of db
    .prepare("SELECT guild_id FROM guild_settings WHERE cyber_news_channel_id IS NOT NULL")
    .all()) {
    guildIds.add(row.guild_id);
  }

  for (const guildId of guildIds) {
    try {
      const n = await postCyberNews(client, guildId, { limit: MAX_POSTS_PER_TICK });
      if (n > 0) console.log(`cyber-news: +${n} · guild=${guildId}`);
    } catch (e) {
      console.warn("cyber-news tick", guildId, e.message);
    }
  }
}

export async function setupCyberNews(guild) {
  const channel = await ensureCyberNewsChannel(guild);
  return channel;
}

export function startCyberNewsScheduler(client) {
  if (timer) return;
  if (process.env.CYBER_NEWS_ENABLED === "0") {
    console.log("cyber-news: kapalı (CYBER_NEWS_ENABLED=0)");
    return;
  }

  const interval = DEFAULT_INTERVAL_MS;

  const boot = async () => {
    const guildId = process.env.CYBER_NEWS_GUILD_ID || config.guildId;
    if (guildId) {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (guild) {
        await ensureCyberNewsChannel(guild).catch((e) =>
          console.warn("cyber-news boot", e.message),
        );
      }
    }
    await tick(client);
  };

  setTimeout(boot, 12_000);
  timer = setInterval(() => tick(client), interval);
  console.log(`cyber-news: aktif · her ${Math.round(interval / 60_000)} dk`);
}
