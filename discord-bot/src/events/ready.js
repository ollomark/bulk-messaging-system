import { ActivityType, Events } from "discord.js";
import { config } from "../config.js";
import { ensureLogChannelFromEnv, sendLog } from "../systems/logger.js";
import { startVoiceKeepAlive } from "../systems/voice.js";
import { cacheAllInvites } from "../systems/invites.js";
import { brand, brandFooter } from "../utils/brand.js";
import { startFreeEgexzonWall } from "../systems/freeEgexzon.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı. ${client.guilds.cache.size} sunucu.`);

    client.user.setPresence({
      activities: [{ name: brand.presence, type: ActivityType.Watching }],
      status: "online",
    });

    for (const guild of client.guilds.cache.values()) {
      ensureLogChannelFromEnv(guild.id);
    }
    if (config.guildId) ensureLogChannelFromEnv(config.guildId);

    await cacheAllInvites(client);
    await startVoiceKeepAlive(client);
    startFreeEgexzonWall(client);

    if (config.guildId) {
      const guild = client.guilds.cache.get(config.guildId);
      if (guild) {
        await sendLog(guild, {
          title: `🟢 ${brand.name} Online`,
          description: [
            "**Ultimate Suite** aktif.",
            "Ticket · Anonim · Anlaşma · Level · Status Role · Guard · Verify",
            "",
            `Sunucu: **${guild.name}** · ${client.guilds.cache.size} guild`,
          ].join("\n"),
          color: brand.colors.success,
          footer: brandFooter("boot"),
        });
      }
    }
  },
};
