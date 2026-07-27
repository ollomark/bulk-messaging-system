import { ActivityType, Events } from "discord.js";
import { config } from "../config.js";
import { ensureLogChannelFromEnv, sendLog } from "../systems/logger.js";
import { startVoiceKeepAlive } from "../systems/voice.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı. ${client.guilds.cache.size} sunucu.`);
    client.user.setPresence({
      activities: [{ name: "/yardim | Guardian Bot", type: ActivityType.Watching }],
      status: "online",
    });

    for (const guild of client.guilds.cache.values()) {
      ensureLogChannelFromEnv(guild.id);
    }
    if (config.guildId) ensureLogChannelFromEnv(config.guildId);

    await startVoiceKeepAlive(client);

    if (config.guildId) {
      const guild = client.guilds.cache.get(config.guildId);
      if (guild) {
        await sendLog(guild, {
          title: "🟢 Bot Aktif",
          description: "Guardian Bot çevrimiçi. Log sistemi çalışıyor.",
          color: 0x57f287,
        });
      }
    }
  },
};
