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

/** Default chill radio (direct mp3) */
export const DEFAULT_STREAM =
  process.env.MUSIC_STREAM_URL || "https://ice2.somafm.com/groovesalad-128-mp3";

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
  const { out } = await runProcess(YTDLP_PATH, [
    ...YTDLP_BASE,
    "-f",
    "bestaudio/best",
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

async function deezerPreview(query) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const hit = (data.data || []).find((t) => t.preview);
  if (!hit) return null;
  return {
    url: hit.preview,
    title: `${hit.artist?.name || "?"} - ${hit.title} (önizleme)`,
    loop: false,
    mode: "direct",
    preview: true,
  };
}

async function itunesPreview(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const hit = (data.results || []).find((t) => t.previewUrl);
  if (!hit) return null;
  return {
    url: hit.previewUrl,
    title: `${hit.artistName || "?"} - ${hit.trackName} (önizleme)`,
    loop: false,
    mode: "direct",
    preview: true,
  };
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

  // Song name → SoundCloud search, skip DRM tracks
  try {
    const info = await runYtDlpJson([
      "--dump-single-json",
      "--skip-download",
      "--flat-playlist",
      `scsearch8:${q}`,
    ]);
    const entries = (info.entries || []).filter(Boolean);
    for (const entry of entries) {
      const page = entry.webpage_url || entry.url;
      if (!page) continue;
      try {
        const stream = await getStreamUrl(page);
        return {
          url: stream,
          title: entry.title || q,
          loop: false,
          mode: "direct",
        };
      } catch {
        // DRM / unavailable → next result
      }
    }
  } catch (error) {
    console.warn("scsearch:", error.message);
  }

  // Fallback: Deezer / iTunes 30s preview (always works)
  const preview = (await deezerPreview(q)) || (await itunesPreview(q));
  if (preview) return preview;

  throw new Error(`Şarkı bulunamadı: ${q}`);
}

export async function joinMusicVoice(channel) {
  if (
    !channel ||
    (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)
  ) {
    throw new Error("Geçerli bir ses kanalı gerekli.");
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
      "-ac",
      "2",
      "-ar",
      "48000",
      "-c:a",
      "libopus",
      "-frame_duration",
      "20",
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
  const resource = createAudioResource(ffmpeg.stdout, {
    inputType: StreamType.OggOpus,
    inlineVolume: true,
  });
  resource.volume?.setVolume(1);
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
