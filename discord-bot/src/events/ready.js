import { ActivityType, Events } from "discord.js";
import { config } from "../config.js";
import { ensureLogChannelFromEnv, sendLog } from "../systems/logger.js";
import { startVoiceKeepAlive } from "../systems/voice.js";
import { cacheAllInvites } from "../systems/invites.js";
import { brand } from "../utils/brand.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı. ${client.guilds.cache.size} sunucu.`);
    client.user.setPresence({
      activities: [{ name: "discord.gg/1758", type: ActivityType.Watching }],
      status: "online",
    });

    for (const guild of client.guilds.cache.values()) {
      ensureLogChannelFromEnv(guild.id);
    }
    if (config.guildId) ensureLogChannelFromEnv(config.guildId);

    await cacheAllInvites(client);
    await startVoiceKeepAlive(client);

    if (config.guildId) {
      const guild = client.guilds.cache.get(config.guildId);
      if (guild) {
        await sendLog(guild, {
          title: `🟢 ${brand.name} Online`,
          description: "Professional Suite aktif · log / ses / davet / koruma çalışıyor.",
          color: 0x57f287,
        });
      }
    }
  },
};
