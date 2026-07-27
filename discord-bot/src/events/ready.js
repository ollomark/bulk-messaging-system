import { ActivityType, Events } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı. ${client.guilds.cache.size} sunucu.`);
    client.user.setPresence({
      activities: [{ name: "/yardim | Guardian Bot", type: ActivityType.Watching }],
      status: "online",
    });
  },
};
