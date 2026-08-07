import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { ChannelType } from "discord.js";
import ffmpegStatic from "ffmpeg-static";
import { updateSettings } from "../database/settings.js";

const FFMPEG_PATH = (() => {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (existsSync("/usr/bin/ffmpeg")) return "/usr/bin/ffmpeg";
  return ffmpegStatic || "ffmpeg";
})();
const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";
const YTDLP_BASE = ["--js-runtimes", "node", "--no-playlist"];

/** Default chill radio — 256 kbps */
export const DEFAULT_STREAM =
  process.env.MUSIC_STREAM_URL || "https://ice2.somafm.com/groovesalad-256-mp3";

/** Discord voice encode target (kbps). Channel bitrate is raised to match. */
const OPUS_BITRATE = Number(process.env.MUSIC_OPUS_BITRATE || 128);

/**
 * @typedef {{
 *   player: import("@discordjs/voice").AudioPlayer,
 *   ffmpeg: import("node:child_process").ChildProcess | null,
 *   url: string,
 *   title: string,
 *   loop: boolean,
 * }} GuildMusicState
 */

/** @type {Map<string, GuildMusicState>} */
const guildMusic = new Map();

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function killFfmpeg(guildId) {
  const state = guildMusic.get(guildId);
  if (state?.ffmpeg && !state.ffmpeg.killed) {
    state.ffmpeg.kill("SIGKILL");
    state.ffmpeg = null;
  }
}

function ensurePlayer(guildId) {
  let state = guildMusic.get(guildId);
  if (state) return state;

  const player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });

  player.on("error", (error) => {
    console.error(`Müzik player hata [${guildId}]:`, error.message);
  });

  player.on(AudioPlayerStatus.Idle, () => {
    const cur = guildMusic.get(guildId);
    if (!cur?.url || !cur.loop) return;
    setTimeout(() => {
      const again = guildMusic.get(guildId);
      if (again?.url && again.loop && again.player.state.status === AudioPlayerStatus.Idle) {
        playDirect(guildId, again.url).catch((e) =>
          console.error(`Müzik yeniden başlatılamadı [${guildId}]:`, e.message),
        );
      }
    }, 2000);
  });

  state = { player, ffmpeg: null, url: "", title: "", loop: false };
  guildMusic.set(guildId, state);
  return state;
}

function runProcess(bin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => {
      out += d;
    });
    proc.stderr.on("data", (d) => {
      err += d;
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(err.trim().slice(0, 240) || `${bin} exit ${code}`));
      else resolve({ out, err });
    });
  });
}

async function runYtDlpJson(args) {
  const { out } = await runProcess(YTDLP_PATH, [...YTDLP_BASE, ...args]);
  return JSON.parse(out);
}

async function getStreamUrl(pageUrl) {
  // Prefer highest audio bitrate available
  const { out } = await runProcess(YTDLP_PATH, [
    ...YTDLP_BASE,
    "-f",
    "bestaudio[abr>=256]/bestaudio[abr>=160]/bestaudio/best",
    "-g",
    pageUrl,
  ]);
  const line = out
    .trim()
    .split("\n")
    .map((s) => s.trim())
    .find((s) => /^https?:\/\//i.test(s));
  if (!line) throw new Error("Stream URL yok");
  return line;
}

/** Turkish-aware normalize for matching */
function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensOf(value) {
  return normalizeText(value)
    .split(" ")
    .filter((t) => t.length > 1);
}

/** 0..1 relevance of title/artist to query */
function scoreMatch(query, title, artist = "") {
  const qNorm = normalizeText(query);
  const hay = normalizeText(`${artist} ${title}`);
  if (!qNorm || !hay) return 0;

  const qTokens = tokensOf(query);
  if (!qTokens.length) return hay.includes(qNorm) ? 1 : 0;

  let hit = 0;
  for (const t of qTokens) {
    if (hay.includes(t)) hit += 1;
  }
  let score = hit / qTokens.length;
  if (hay.includes(qNorm)) score = Math.min(1, score + 0.35);
  // penalize very short query matching random long English titles weakly
  if (qTokens.length === 1 && qTokens[0].length <= 3 && score < 1) {
    score *= 0.85;
  }
  return score;
}

async function searchDeezerTracks(query, limit = 8) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || [])
    .filter((t) => t.title)
    .map((t) => ({
      artist: t.artist?.name || "",
      title: t.title,
      preview: t.preview || null,
      score: scoreMatch(query, t.title, t.artist?.name || ""),
      source: "deezer",
    }));
}

async function searchItunesTracks(query, limit = 8) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&country=tr&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || [])
    .filter((t) => t.trackName)
    .map((t) => ({
      artist: t.artistName || "",
      title: t.trackName,
      preview: t.previewUrl || null,
      score: scoreMatch(query, t.trackName, t.artistName || ""),
      source: "itunes",
    }));
}

async function bestCatalogMatch(query) {
  const [deezer, itunes] = await Promise.all([
    searchDeezerTracks(query),
    searchItunesTracks(query),
  ]);
  // iTunes TR sonuçlarına hafif öncelik — TR sanatçı/şarkı gelsin
  const rows = [
    ...itunes.map((r) => ({ ...r, score: Math.min(1, r.score + 0.1) })),
    ...deezer,
  ].sort((a, b) => b.score - a.score);
  return rows.find((r) => r.score >= 0.45) || null;
}

async function searchSoundCloud(query, limit = 8) {
  try {
    const info = await runYtDlpJson([
      "--dump-single-json",
      "--skip-download",
      "--flat-playlist",
      `scsearch${limit}:${query}`,
    ]);
    return (info.entries || []).filter(Boolean).map((e) => ({
      title: e.title || "",
      page: e.webpage_url || e.url || "",
      score: scoreMatch(query, e.title || ""),
    }));
  } catch (error) {
    console.warn("scsearch:", error.message);
    return [];
  }
}

/**
 * Find best playable SoundCloud stream for a target label (artist + title)
 * and original user query. Rejects weak/irrelevant English mismatches.
 */
async function resolveSoundCloudMatch(userQuery, catalog) {
  const searches = new Set();
  searches.add(userQuery);
  if (catalog) {
    searches.add(`${catalog.artist} ${catalog.title}`);
    searches.add(`${catalog.title} ${catalog.artist}`);
    searches.add(catalog.title);
  }

  /** @type {{ title: string, page: string, score: number }[]} */
  const candidates = [];
  for (const term of searches) {
    const found = await searchSoundCloud(term, 6);
    for (const row of found) {
      if (!row.page) continue;
      // Score against both user query and catalog title
      const sUser = scoreMatch(userQuery, row.title);
      const sCat = catalog
        ? scoreMatch(`${catalog.artist} ${catalog.title}`, row.title)
        : 0;
      const score = Math.max(sUser, sCat);
      candidates.push({ ...row, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const minScore = tokensOf(userQuery).length <= 1 ? 0.55 : 0.5;
  for (const c of candidates) {
    if (c.score < minScore) continue;
    try {
      const stream = await getStreamUrl(c.page);
      return {
        url: stream,
        title: c.title,
        loop: false,
        mode: "direct",
        score: c.score,
      };
    } catch {
      // DRM / unavailable
    }
  }
  return null;
}

/** Resolve song name or URL → playable direct stream */
export async function resolveQuery(query) {
  const q = String(query || "").trim();
  if (!q) {
    return { url: DEFAULT_STREAM, title: "Lo-fi radyo", loop: true, mode: "direct" };
  }

  // Direct stream / radio / mp3
  if (isHttpUrl(q) && !/youtube|youtu\.be|soundcloud|spotify/i.test(q)) {
    return { url: q, title: "Özel link", loop: /\.mp3|radio|stream|somafm/i.test(q), mode: "direct" };
  }

  // SoundCloud / YouTube page URL → extract stream
  if (isHttpUrl(q)) {
    try {
      const stream = await getStreamUrl(q);
      return { url: stream, title: q, loop: false, mode: "direct" };
    } catch {
      throw new Error("Bu link çalınamadı (DRM / bot engeli). Şarkı adıyla dene.");
    }
  }

  // 1) Catalog (Deezer/iTunes TR) → doğru şarkıyı bul
  const catalog = await bestCatalogMatch(q);
  if (catalog) {
    console.log(
      `🔎 Catalog: ${catalog.artist} - ${catalog.title} (score=${catalog.score.toFixed(2)} via ${catalog.source})`,
    );
  }

  // 2) SoundCloud'ta bu doğru isimle ara + skorla (alakasız EN şarkıları ele)
  const sc = await resolveSoundCloudMatch(q, catalog);
  if (sc) {
    const label = catalog ? `${catalog.artist} - ${catalog.title}` : sc.title;
    return { ...sc, title: label };
  }

  // 3) Full stream yoksa DOĞRU şarkının önizlemesi (yanlış full track'ten iyidir)
  if (catalog?.preview) {
    return {
      url: catalog.preview,
      title: `${catalog.artist} - ${catalog.title} (önizleme)`,
      loop: false,
      mode: "direct",
      preview: true,
    };
  }

  throw new Error(
    `Şarkı bulunamadı: ${q}\nDaha net yaz: \`Sanatçı Şarkı\` (örn: \`Duman Senden Daha Güzel\`)`,
  );
}

export async function joinMusicVoice(channel) {
  if (
    !channel ||
    (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)
  ) {
    throw new Error("Geçerli bir ses kanalı gerekli.");
  }

  // Boost channel bitrate as high as the server allows (better Discord encode)
  const maxBitrate = channel.guild.maximumBitrate || 96000;
  const target = Math.min(Math.max(OPUS_BITRATE * 1000, 96000), maxBitrate);
  if (channel.bitrate < target) {
    await channel.setBitrate(target).catch((e) => console.warn("bitrate:", e.message));
  }

  const existing = getVoiceConnection(channel.guild.id);
  if (existing) existing.destroy();

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  const { player } = ensurePlayer(channel.guild.id);
  connection.subscribe(player);
  return connection;
}

export async function playDirect(guildId, url) {
  const state = ensurePlayer(guildId);
  const connection = getVoiceConnection(guildId);
  if (!connection) throw new Error("Önce sese katıl.");

  killFfmpeg(guildId);

  const ffmpeg = spawn(
    FFMPEG_PATH,
    [
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",
      "-i",
      url,
      "-analyzeduration",
      "0",
      "-loglevel",
      "error",
      "-vn",
      "-af",
      "aresample=48000:resampler=swr:precision=28",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-c:a",
      "libopus",
      "-b:a",
      `${OPUS_BITRATE}k`,
      "-vbr",
      "on",
      "-compression_level",
      "10",
      "-application",
      "audio",
      "-frame_duration",
      "20",
      "-packet_loss",
      "5",
      "-f",
      "ogg",
      "pipe:1",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let ffErr = "";
  ffmpeg.stderr?.on("data", (buf) => {
    ffErr += buf;
    const msg = String(buf).trim();
    if (msg) console.warn(`ffmpeg[${guildId}]:`, msg.slice(0, 200));
  });
  ffmpeg.on("error", (error) => {
    console.error(`ffmpeg spawn [${guildId}]:`, error.message);
  });

  state.ffmpeg = ffmpeg;
  // inlineVolume kapalı — kalite kaybı olmasın
  const resource = createAudioResource(ffmpeg.stdout, {
    inputType: StreamType.OggOpus,
    inlineVolume: false,
  });
  connection.subscribe(state.player);
  state.player.play(resource);

  try {
    await entersState(state.player, AudioPlayerStatus.Playing, 20_000);
  } catch (error) {
    throw new Error(`Ses başlamadı: ${ffErr.trim().slice(0, 160) || error.message}`);
  }
}

export async function playQuery(guildId, query) {
  const resolved = await resolveQuery(query);
  const state = ensurePlayer(guildId);
  state.url = resolved.url;
  state.title = resolved.title;
  state.loop = Boolean(resolved.loop);

  await playDirect(guildId, resolved.url);
  console.log(`🎵 Playing [${guildId}]: ${resolved.title}`);
  return resolved;
}

/** @deprecated */
export async function playUrl(guildId, url = DEFAULT_STREAM) {
  return playQuery(guildId, url);
}

export async function playInChannel(channel, query = "") {
  updateSettings(channel.guild.id, { voice_24_7: 0, voice_channel_id: channel.id });
  await joinMusicVoice(channel);
  return playQuery(channel.guild.id, query || "");
}

export function stopMusic(guildId) {
  const state = guildMusic.get(guildId);
  if (!state) return;
  state.url = "";
  state.title = "";
  state.loop = false;
  killFfmpeg(guildId);
  state.player.stop(true);
}

export function leaveMusic(guildId) {
  stopMusic(guildId);
  const connection = getVoiceConnection(guildId);
  if (connection) connection.destroy();
  guildMusic.delete(guildId);
}

export function musicStatus(guildId) {
  const state = guildMusic.get(guildId);
  const connection = getVoiceConnection(guildId);
  return {
    connected: Boolean(connection && connection.state.status !== VoiceConnectionStatus.Destroyed),
    playing: state?.player.state.status === AudioPlayerStatus.Playing,
    url: state?.url || null,
    title: state?.title || null,
    playerStatus: state?.player.state.status || "yok",
  };
}
