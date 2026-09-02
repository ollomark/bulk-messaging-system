import { Events, PresenceUpdateStatus } from "discord.js";

const MATCH = /\/?\s*sorgutv/i;
const WARN_COOLDOWN_MS = 5 * 60 * 1000;
const WARN_CONFIRM_MS = 4_000;
const lastWarnAt = new Map();
/** userId → son bilinen /sorgutv eşleşmesi (sadece online iken) */
const lastMatch = new Map();
/** userId → pending warn timer */
const pendingWarn = new Map();

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

function isOnlineEnough(presence) {
  if (!presence) return false;
  const s = presence.status;
  return (
    s === PresenceUpdateStatus.Online ||
    s === PresenceUpdateStatus.Idle ||
    s === PresenceUpdateStatus.DoNotDisturb ||
    s === "online" ||
    s === "idle" ||
    s === "dnd"
  );
}

function clearPendingWarn(userId) {
  const t = pendingWarn.get(userId);
  if (t) clearTimeout(t);
  pendingWarn.delete(userId);
}

async function warnStatusRemoved(guild, userId) {
  const channelId = process.env.STATUS_ROLE_WARN_CHANNEL_ID;
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

/**
 * Offline'a geçişte / geri gelişte etiket atma.
 * Sadece online iken /sorgutv gerçekten kalkınca uyar (kısa onay gecikmesiyle).
 */
function scheduleWarnIfStillMissing(guild, userId) {
  clearPendingWarn(userId);
  const timer = setTimeout(async () => {
    pendingWarn.delete(userId);
    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member || member.user.bot) return;
      if (!isOnlineEnough(member.presence)) return; // offline / invisible → etiket yok
      if (wantsStatusRole(member.presence)) return; // durum geri gelmiş
      await warnStatusRemoved(guild, userId);
    } catch (e) {
      console.warn("status-role warn-confirm", userId, e.message);
    }
  }, WARN_CONFIRM_MS);
  pendingWarn.set(userId, timer);
}

export function startStatusRoleSync(client) {
  const guildId = process.env.STATUS_ROLE_GUILD_ID || process.env.GUILD_ID;
  const roleId = process.env.STATUS_ROLE_ID;
  if (!guildId || !roleId) {
    console.log("status-role: STATUS_ROLE_GUILD_ID / STATUS_ROLE_ID yok — kapalı");
    return;
  }

  client.on(Events.PresenceUpdate, async (oldPresence, presence) => {
    if (!presence.guild || presence.guild.id !== guildId) return;

    const userId = presence.userId;
    if (!userId) return;

    // Offline / invisible: cache temizle, pending uyarı iptal, dokunma
    if (!isOnlineEnough(presence)) {
      lastMatch.delete(userId);
      clearPendingWarn(userId);
      return;
    }

    const member =
      presence.member ||
      (await presence.guild.members.fetch(userId).catch(() => null));
    if (!member || member.user.bot) return;

    const comingOnline = !isOnlineEnough(oldPresence);
    const hasNow = wantsStatusRole(presence);
    const hadFromOld = !comingOnline && wantsStatusRole(oldPresence);
    const hadCached = lastMatch.get(userId) === true;
    const hadRole = member.roles.cache.has(roleId);
    const hadBefore = hadFromOld || hadCached || hadRole;

    lastMatch.set(userId, hasNow);

    try {
      if (hasNow) {
        clearPendingWarn(userId);
        if (!hadRole) {
          await member.roles.add(roleId, "Durum: /sorgutv");
        }
        return;
      }

      // Online ama /sorgutv yok
      if (hadBefore && hadRole) {
        await member.roles.remove(roleId, "Durumda /sorgutv yok").catch((e) => {
          console.warn("status-role remove", userId, e.message);
        });
      }

      // Offline'dan yeni açıldıysa etiket yok — sadece online iken durum kalktıysa
      if (!comingOnline && (hadFromOld || hadCached)) {
        scheduleWarnIfStillMissing(presence.guild, userId);
      }
    } catch (e) {
      console.warn("status-role", userId, e.message);
    }
  });

  // Boot: online + /sorgutv olanlara rol ver; cache doldur; offline'a dokunma
  const boot = async () => {
    try {
      const guild = await client.guilds.fetch(guildId);
      await guild.roles.fetch();
      await guild.members.fetch();
      let give = 0;
      for (const member of guild.members.cache.values()) {
        if (member.user.bot) continue;
        if (!isOnlineEnough(member.presence)) continue;
        const ok = wantsStatusRole(member.presence);
        lastMatch.set(member.id, ok);
        if (!ok) continue;
        if (member.roles.cache.has(roleId)) continue;
        try {
          await member.roles.add(roleId, "Boot: /sorgutv durum");
          give++;
        } catch (e) {
          console.warn("status-role boot", member.id, e.message);
        }
      }
      console.log(`status-role boot: +${give} · cache=${lastMatch.size}`);
    } catch (e) {
      console.warn("status-role boot", e.message);
    }
  };

  client.once(Events.ClientReady, () => {
    setTimeout(boot, 8000);
  });

  console.log(`status-role: aktif · guild=${guildId} role=${roleId} match=/sorgutv`);
}
