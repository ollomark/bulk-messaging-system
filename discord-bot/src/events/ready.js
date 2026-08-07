import { ActivityType, Events } from "discord.js";
import { config } from "../config.js";
import { ensureLogChannelFromEnv, sendLog } from "../systems/logger.js";
import { startVoiceKeepAlive } from "../systems/voice.js";
import { playInChannel } from "../systems/music.js";
import { cacheAllInvites } from "../systems/invites.js";
import { brand } from "../utils/brand.js";
import { ensureAgentSettings } from "../systems/agentGate.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ ${client.user.tag} olarak giriş yapıldı. ${client.guilds.cache.size} sunucu.`);
    client.user.setPresence({
      activities: [{ name: `${brand.name} · /panel`, type: ActivityType.Watching }],
      status: "online",
    });

    for (const guild of client.guilds.cache.values()) {
      ensureLogChannelFromEnv(guild.id);
    }
    if (config.guildId) ensureLogChannelFromEnv(config.guildId);

    // Ajan kapısı ayarlarını rol/kanal adlarından production DB'ye yaz
    if (config.guildId) {
      const agentGuild = client.guilds.cache.get(config.guildId);
      if (agentGuild) {
        const agent = await ensureAgentSettings(agentGuild);
        console.log(
          `Ajan ayar: access=${agent.agent_access_role_id || "-"} join=${agent.agent_join_role_id || "-"} entry=${agent.agent_entry_channel_id || "-"} tickets=${agent.ticket_category_id || "-"} oath=${agent.agent_oath_channel_id || "-"}`,
        );
      }
    }

    await cacheAllInvites(client);
    await startVoiceKeepAlive(client);

    // Owner seste ise otomatik müzik aç (MUSIC_AUTO_JOIN=0 ile kapat)
    if (config.ownerId && process.env.MUSIC_AUTO_JOIN !== "0") {
      try {
        for (const guild of client.guilds.cache.values()) {
          const member = await guild.members.fetch(config.ownerId).catch(() => null);
          const channel = member?.voice?.channel;
          if (!channel) continue;
          await playInChannel(channel);
          console.log(`🎵 Müzik: ${guild.name} / #${channel.name}`);
          break;
        }
      } catch (error) {
        console.warn("Müzik auto-join:", error.message);
      }
    }

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
