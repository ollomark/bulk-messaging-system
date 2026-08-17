import { Events } from "discord.js";

const MATCH = /\/?\s*sorgutr/i;
const WARN_COOLDOWN_MS = 5 * 60 * 1000;
const lastWarnAt = new Map();

function statusBlob(presence) {
  if (!presence) return "";
  const parts = [];
  for (const a of presence.activities || []) {
    if (a.state) parts.push(a.state);
    if (a.name && a.name !== "Custom Status") parts.push(a.name);
    if (a.details) parts.push(a.details);
  }
  return parts.join(" ");
}

function wantsStatusRole(presence) {
  return MATCH.test(statusBlob(presence));
}

async function warnStatusRemoved(guild, userId) {
  const channelId =
    process.env.STATUS_ROLE_WARN_CHANNEL_ID || "1538471505971646555";
  if (!channelId) return;

  const now = Date.now();
  const prev = lastWarnAt.get(userId) || 0;
  if (now - prev < WARN_COOLDOWN_MS) return;
  lastWarnAt.set(userId, now);

  const channel =
    guild.channels.cache.get(channelId) ||
    (await guild.channels.fetch(channelId).catch(() => null));
  if (!channel?.isTextBased?.()) return;

  await channel
    .send({
      content: `<@${userId}> durum fixle`,
      allowedMentions: { users: [userId] },
    })
    .catch((e) => console.warn("status-role warn", e.message));
}

export function startStatusRoleSync(client) {
  const guildId = process.env.STATUS_ROLE_GUILD_ID || process.env.GUILD_ID;
  const roleId = process.env.STATUS_ROLE_ID;
  if (!guildId || !roleId) {
    console.log("status-role: STATUS_ROLE_GUILD_ID / STATUS_ROLE_ID yok — kapalı");
    return;
  }

  const syncMember = async (member, { warn = false } = {}) => {
    if (!member || member.user.bot) return;
    if (member.guild.id !== guildId) return;
    const role = member.guild.roles.cache.get(roleId);
    if (!role) return;

    const shouldHave = wantsStatusRole(member.presence);
    const has = member.roles.cache.has(roleId);
    try {
      if (shouldHave && !has) {
        await member.roles.add(roleId, "Durum: /sorgutr");
      } else if (!shouldHave && has) {
        await member.roles.remove(roleId, "Durumda /sorgutr yok");
        if (warn) await warnStatusRemoved(member.guild, member.id);
      }
    } catch (e) {
      console.warn("status-role", member.user?.id, e.message);
    }
  };

  client.on(Events.PresenceUpdate, async (_old, presence) => {
    if (!presence.guild || presence.guild.id !== guildId) return;
    const member =
      presence.member ||
      (await presence.guild.members.fetch(presence.userId).catch(() => null));
    await syncMember(member, { warn: true });
  });

  // Boot scan (online members with presence in cache) — uyarı yok
  const boot = async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      await guild.roles.fetch();
      const members = await guild.members.fetch();
      let give = 0,
        take = 0;
      for (const member of members.values()) {
        if (member.user.bot) continue;
        const shouldHave = wantsStatusRole(member.presence);
        const has = member.roles.cache.has(roleId);
        if (shouldHave && !has) {
          await member.roles.add(roleId, "Boot: /sorgutr durum");
          give++;
        } else if (!shouldHave && has) {
          await member.roles.remove(roleId, "Boot: durum yok");
          take++;
        }
      }
      console.log(`status-role boot: +${give} -${take} (guild ${guildId})`);
    } catch (e) {
      console.warn("status-role boot", e.message);
    }
  };

  client.once(Events.ClientReady, () => {
    setTimeout(boot, 8000);
  });

  console.log(`status-role: aktif · guild=${guildId} role=${roleId}`);
}
