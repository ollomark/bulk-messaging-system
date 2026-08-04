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

/** Default lofi / chill radio (direct mp3) */
export const DEFAULT_STREAM =
  process.env.MUSIC_STREAM_URL || "https://ice2.somafm.com/groovesalad-128-mp3";

/** @type {Map<string, { player: import("@discordjs/voice").AudioPlayer, ffmpeg: import("node:child_process").ChildProcess | null, url: string }>} */
const guildMusic = new Map();

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
    if (!cur?.url) return;
    // Stream düşerse otomatik yeniden bağlan
    setTimeout(() => {
      const again = guildMusic.get(guildId);
      if (again?.url && again.player.state.status === AudioPlayerStatus.Idle) {
        playUrl(guildId, again.url).catch((e) =>
          console.error(`Müzik yeniden başlatılamadı [${guildId}]:`, e.message),
        );
      }
    }, 1500);
  });

  state = { player, ffmpeg: null, url: "" };
  guildMusic.set(guildId, state);
  return state;
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

export async function playUrl(guildId, url = DEFAULT_STREAM) {
  const state = ensurePlayer(guildId);
  const connection = getVoiceConnection(guildId);
  if (!connection) throw new Error("Önce sese katıl.");

  killFfmpeg(guildId);
  state.url = url;

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
      "-packet_loss",
      "1",
      "-f",
      "ogg",
      "pipe:1",
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

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
  resource.volume?.setVolume(0.7);
  state.player.play(resource);
  connection.subscribe(state.player);
  await entersState(state.player, AudioPlayerStatus.Playing, 15_000).catch(() => null);
  return { url };
}

export async function playInChannel(channel, url = DEFAULT_STREAM) {
  await joinMusicVoice(channel);
  return playUrl(channel.guild.id, url);
}

export function stopMusic(guildId) {
  const state = guildMusic.get(guildId);
  if (!state) return;
  state.url = "";
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
    playerStatus: state?.player.state.status || "yok",
  };
}
