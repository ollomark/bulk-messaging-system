import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { ChannelType } from "discord.js";
import db from "../database/db.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { config } from "../config.js";

const reconnectTimers = new Map();

export function ensureVoiceColumns() {
  const columns = db.prepare("PRAGMA table_info(guild_settings)").all().map((c) => c.name);
  if (!columns.includes("voice_channel_id")) {
    db.exec("ALTER TABLE guild_settings ADD COLUMN voice_channel_id TEXT");
  }
  if (!columns.includes("voice_24_7")) {
    db.exec("ALTER TABLE guild_settings ADD COLUMN voice_24_7 INTEGER DEFAULT 0");
  }
}

ensureVoiceColumns();

function clearReconnect(guildId) {
  const timer = reconnectTimers.get(guildId);
  if (timer) {
    clearTimeout(timer);
    reconnectTimers.delete(guildId);
  }
}

function scheduleReconnect(client, guildId, delayMs = 5000) {
  clearReconnect(guildId);
  const timer = setTimeout(() => {
    reconnectTimers.delete(guildId);
    joinConfiguredVoice(client, guildId).catch((error) => {
      console.error(`Ses yeniden bağlanma hatası [${guildId}]:`, error.message);
      scheduleReconnect(client, guildId, 15000);
    });
  }, delayMs);
  reconnectTimers.set(guildId, timer);
}

export async function joinVoice(channel, { persist = true, enabled247 = true } = {}) {
  if (
    !channel ||
    (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)
  ) {
    throw new Error("Geçerli bir ses kanalı gerekli.");
  }

  const existing = getVoiceConnection(channel.guild.id);
  if (existing) {
    existing.destroy();
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: true,
  });

  connection.on("stateChange", (oldState, newState) => {
    if (
      newState.status === VoiceConnectionStatus.Disconnected ||
      newState.status === VoiceConnectionStatus.Destroyed
    ) {
      const settings = getSettings(channel.guild.id);
      if (settings.voice_24_7 && settings.voice_channel_id) {
        scheduleReconnect(channel.client, channel.guild.id);
      }
    }
  });

  connection.on("error", (error) => {
    console.error(`Ses bağlantı hatası [${channel.guild.id}]:`, error.message);
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (error) {
    connection.destroy();
    throw error;
  }

  if (persist) {
    updateSettings(channel.guild.id, {
      voice_channel_id: channel.id,
      voice_24_7: enabled247 ? 1 : 0,
    });
  }

  clearReconnect(channel.guild.id);
  return connection;
}

export async function leaveVoice(guildId, { disable247 = true } = {}) {
  clearReconnect(guildId);
  const connection = getVoiceConnection(guildId);
  if (connection) connection.destroy();
  if (disable247) {
    updateSettings(guildId, { voice_24_7: 0 });
  }
}

export async function joinConfiguredVoice(client, guildId) {
  const settings = getSettings(guildId);
  if (!settings.voice_24_7 || !settings.voice_channel_id) return false;

  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return false;

  const channel = await guild.channels.fetch(settings.voice_channel_id).catch(() => null);
  if (!channel || (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice)) {
    return false;
  }

  const me = guild.members.me ?? (await guild.members.fetchMe());
  const perms = channel.permissionsFor(me);
  if (!perms?.has(["Connect", "ViewChannel"])) {
    console.warn(`Ses kanalına bağlanılamıyor (izin yok): ${guild.name}`);
    return false;
  }

  await joinVoice(channel, { persist: false, enabled247: true });
  console.log(`🔊 Ses kanalına bağlandı: ${guild.name} / #${channel.name}`);
  return true;
}

export async function startVoiceKeepAlive(client) {
  // Env ile hızlı kurulum (Railway kalıcılığı için)
  if (config.guildId && process.env.VOICE_CHANNEL_ID) {
    updateSettings(config.guildId, {
      voice_channel_id: process.env.VOICE_CHANNEL_ID,
      voice_24_7: 1,
    });
  }

  const rows = db
    .prepare("SELECT guild_id FROM guild_settings WHERE voice_24_7 = 1 AND voice_channel_id IS NOT NULL")
    .all();

  for (const row of rows) {
    try {
      await joinConfiguredVoice(client, row.guild_id);
    } catch (error) {
      console.error(`Başlangıç ses bağlama hatası [${row.guild_id}]:`, error.message);
      scheduleReconnect(client, row.guild_id, 10000);
    }
  }

  // Periyodik sağlık kontrolü
  setInterval(() => {
    const active = db
      .prepare("SELECT guild_id FROM guild_settings WHERE voice_24_7 = 1 AND voice_channel_id IS NOT NULL")
      .all();
    for (const row of active) {
      const connection = getVoiceConnection(row.guild_id);
      if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
        scheduleReconnect(client, row.guild_id, 2000);
      }
    }
  }, 60_000);
}
