import { spawn } from "node:child_process";
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

const FFMPEG_PATH = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";

/** Default lofi / chill radio (direct mp3) */
export const DEFAULT_STREAM =
  process.env.MUSIC_STREAM_URL || "https://ice2.somafm.com/groovesalad-128-mp3";

/**
 * @typedef {{
 *   player: import("@discordjs/voice").AudioPlayer,
 *   ffmpeg: import("node:child_process").ChildProcess | null,
 *   ytdlp: import("node:child_process").ChildProcess | null,
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

function looksLikeRadio(url) {
  return (
    /somafm|icecast|radio|stream|\.mp3(\?|$)/i.test(url) &&
    !/youtube|youtu\.be|soundcloud/i.test(url)
  );
}

function killPipeline(guildId) {
  const state = guildMusic.get(guildId);
  if (!state) return;
  if (state.ffmpeg && !state.ffmpeg.killed) state.ffmpeg.kill("SIGKILL");
  if (state.ytdlp && !state.ytdlp.killed) state.ytdlp.kill("SIGKILL");
  state.ffmpeg = null;
  state.ytdlp = null;
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
        playQuery(guildId, again.url).catch((e) =>
          console.error(`Müzik yeniden başlatılamadı [${guildId}]:`, e.message),
        );
      }
    }, 1500);
  });

  state = { player, ffmpeg: null, ytdlp: null, url: "", title: "", loop: false };
  guildMusic.set(guildId, state);
  return state;
}

const YTDLP_BASE = ["--js-runtimes", "node", "--no-playlist"];

function runYtDlpJson(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(YTDLP_PATH, [...YTDLP_BASE, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => {
      out += d;
    });
    proc.stderr.on("data", (d) => {
      err += d;
    });
    proc.on("error", (error) => reject(error));
    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(err.trim().slice(0, 240) || `yt-dlp exit ${code}`));
      }
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error("yt-dlp JSON okunamadı"));
      }
    });
  });
}

function pickEntry(info) {
  if (!info) return null;
  if (Array.isArray(info.entries)) return info.entries.find(Boolean) || null;
  if (info.webpage_url || info.url || info.id) return info;
  return null;
}

/** Resolve song name or URL → playable source info */
export async function resolveQuery(query) {
  const q = String(query || "").trim();
  if (!q) {
    return { url: DEFAULT_STREAM, title: "Lo-fi radyo", loop: true, mode: "direct" };
  }

  if (isHttpUrl(q) && looksLikeRadio(q)) {
    return { url: q, title: "Radyo", loop: true, mode: "direct" };
  }

  if (isHttpUrl(q) && !/youtube|youtu\.be|soundcloud|spotify/i.test(q)) {
    return { url: q, title: q, loop: false, mode: "direct" };
  }

  // Song name → SoundCloud search (YouTube bot-check datacenter IP'de kırıyor)
  const target = isHttpUrl(q) ? q : `scsearch1:${q}`;

  try {
    const info = await runYtDlpJson([
      "--dump-single-json",
      "--skip-download",
      "--flat-playlist",
      target,
    ]);
    const entry = pickEntry(info);
    const pageUrl = entry?.webpage_url || entry?.url;
    if (!pageUrl) throw new Error("empty");
    return {
      url: pageUrl,
      title: entry.title || q,
      loop: false,
      mode: "ytdlp",
      duration: entry.duration || null,
    };
  } catch (error) {
    if (isHttpUrl(q) && /youtube|youtu\.be/i.test(q)) {
      throw new Error(
        "YouTube bot doğrulaması istiyor. Şarkı adıyla dene veya mp3/radyo linki ver.",
      );
    }
    throw new Error(`Şarkı bulunamadı: ${q}`);
  }
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

function attachFfmpeg(guildId, ffmpeg) {
  const state = ensurePlayer(guildId);
  const connection = getVoiceConnection(guildId);
  if (!connection) throw new Error("Önce sese katıl.");

  ffmpeg.stderr?.on("data", (buf) => {
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
  resource.volume?.setVolume(0.75);
  state.player.play(resource);
  connection.subscribe(state.player);
  return entersState(state.player, AudioPlayerStatus.Playing, 20_000).catch(() => null);
}

async function playDirect(guildId, url) {
  killPipeline(guildId);
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
  await attachFfmpeg(guildId, ffmpeg);
}

async function playViaYtDlp(guildId, pageUrl) {
  killPipeline(guildId);
  const state = ensurePlayer(guildId);

  const ytdlp = spawn(
    YTDLP_PATH,
    [
      ...YTDLP_BASE,
      "-f",
      "bestaudio/best",
      "-o",
      "-",
      "--quiet",
      "--no-warnings",
      pageUrl,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  ytdlp.stderr?.on("data", (buf) => {
    const msg = String(buf).trim();
    if (msg) console.warn(`yt-dlp[${guildId}]:`, msg.slice(0, 200));
  });
  ytdlp.on("error", (error) => {
    console.error(`yt-dlp spawn [${guildId}]:`, error.message);
  });
  state.ytdlp = ytdlp;

  const ffmpeg = spawn(
    FFMPEG_PATH,
    [
      "-i",
      "pipe:0",
      "-analyzeduration",
      "0",
      "-loglevel",
      "error",
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
    { stdio: ["pipe", "pipe", "pipe"] },
  );

  ytdlp.stdout.pipe(ffmpeg.stdin);
  ytdlp.on("close", () => {
    try {
      ffmpeg.stdin.end();
    } catch {
      /* ignore */
    }
  });

  await attachFfmpeg(guildId, ffmpeg);
}

export async function playQuery(guildId, query) {
  const resolved = await resolveQuery(query);
  const state = ensurePlayer(guildId);
  state.url = resolved.url;
  state.title = resolved.title;
  state.loop = Boolean(resolved.loop);

  if (resolved.mode === "direct") {
    await playDirect(guildId, resolved.url);
  } else {
    await playViaYtDlp(guildId, resolved.url);
  }

  return resolved;
}

/** @deprecated use playQuery */
export async function playUrl(guildId, url = DEFAULT_STREAM) {
  return playQuery(guildId, url);
}

export async function playInChannel(channel, query = "") {
  updateSettings(channel.guild.id, { voice_24_7: 0, voice_channel_id: channel.id });
  await joinMusicVoice(channel);
  return playQuery(channel.guild.id, query || DEFAULT_STREAM);
}

export function stopMusic(guildId) {
  const state = guildMusic.get(guildId);
  if (!state) return;
  state.url = "";
  state.title = "";
  state.loop = false;
  killPipeline(guildId);
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
