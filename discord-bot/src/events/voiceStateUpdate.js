import { Events } from "discord.js";
import { getSettings } from "../database/settings.js";
import { joinConfiguredVoice } from "../systems/voice.js";

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    if (newState.id !== client.user.id && oldState.id !== client.user.id) return;

    const guildId = oldState.guild.id;
    const settings = getSettings(guildId);
    if (!settings.voice_24_7 || !settings.voice_channel_id) return;

    // Bot sesten atıldı / ayrıldı
    const left =
      oldState.channelId &&
      (!newState.channelId || newState.channelId !== settings.voice_channel_id);

    if (left) {
      setTimeout(() => {
        joinConfiguredVoice(client, guildId).catch((error) => {
          console.error(`Ses kick sonrası dönüş hatası: ${error.message}`);
        });
      }, 3000);
    }
  },
};
