import db from "../database/db.js";

const inviteCache = new Map(); // guildId -> Map<code, {uses, inviterId}>

export async function cacheGuildInvites(guild) {
  try {
    const invites = await guild.invites.fetch();
    const map = new Map();
    for (const inv of invites.values()) {
      map.set(inv.code, { uses: inv.uses ?? 0, inviterId: inv.inviter?.id || null });
    }
    inviteCache.set(guild.id, map);
  } catch {
    inviteCache.set(guild.id, new Map());
  }
}

export async function cacheAllInvites(client) {
  for (const guild of client.guilds.cache.values()) {
    await cacheGuildInvites(guild);
  }
}

export async function resolveInviter(member) {
  const cached = inviteCache.get(member.guild.id) || new Map();
  let used = null;

  try {
    const current = await member.guild.invites.fetch();
    for (const inv of current.values()) {
      const before = cached.get(inv.code);
      const uses = inv.uses ?? 0;
      if ((!before && uses > 0) || (before && uses > before.uses)) {
        used = inv;
        break;
      }
    }
    const map = new Map();
    for (const inv of current.values()) {
      map.set(inv.code, { uses: inv.uses ?? 0, inviterId: inv.inviter?.id || null });
    }
    inviteCache.set(member.guild.id, map);
  } catch {
    return null;
  }

  return used?.inviter || null;
}

export function trackInvite(guildId, inviterId, invitedId, code) {
  db.prepare(
    `INSERT INTO invites (guild_id, inviter_id, invited_id, code, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(guild_id, invited_id) DO UPDATE SET
       inviter_id = excluded.inviter_id,
       code = excluded.code,
       created_at = excluded.created_at`,
  ).run(guildId, inviterId, invitedId, code || null, Date.now());

  db.prepare(
    `INSERT INTO invite_counts (guild_id, user_id, regular, left_count)
     VALUES (?, ?, 1, 0)
     ON CONFLICT(guild_id, user_id) DO UPDATE SET regular = regular + 1`,
  ).run(guildId, inviterId);
}

export function markInviteLeft(guildId, invitedId) {
  const row = db
    .prepare("SELECT * FROM invites WHERE guild_id = ? AND invited_id = ?")
    .get(guildId, invitedId);
  if (!row) return;

  db.prepare(
    `INSERT INTO invite_counts (guild_id, user_id, regular, left_count)
     VALUES (?, ?, 0, 1)
     ON CONFLICT(guild_id, user_id) DO UPDATE SET left_count = left_count + 1`,
  ).run(guildId, row.inviter_id);
}

export function getInviteStats(guildId, userId) {
  return (
    db
      .prepare("SELECT * FROM invite_counts WHERE guild_id = ? AND user_id = ?")
      .get(guildId, userId) || { regular: 0, left_count: 0 }
  );
}

export function getInviteLeaderboard(guildId, limit = 10) {
  return db
    .prepare(
      `SELECT * FROM invite_counts WHERE guild_id = ?
       ORDER BY regular DESC, left_count ASC LIMIT ?`,
    )
    .all(guildId, limit);
}
