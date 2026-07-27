import db from "../database/db.js";

export function addResponder(guildId, trigger, response, matchMode = "includes") {
  db.prepare(
    `INSERT INTO autoresponders (guild_id, trigger_text, response_text, match_mode)
     VALUES (?, ?, ?, ?)`,
  ).run(guildId, trigger.toLowerCase(), response, matchMode);
}

export function removeResponder(guildId, id) {
  const result = db
    .prepare("DELETE FROM autoresponders WHERE guild_id = ? AND id = ?")
    .run(guildId, id);
  return result.changes > 0;
}

export function listResponders(guildId) {
  return db.prepare("SELECT * FROM autoresponders WHERE guild_id = ? ORDER BY id DESC").all(guildId);
}

export function matchResponder(guildId, content) {
  const text = content.toLowerCase();
  const rows = listResponders(guildId);
  for (const row of rows) {
    if (row.match_mode === "exact" && text === row.trigger_text) return row;
    if (row.match_mode !== "exact" && text.includes(row.trigger_text)) return row;
  }
  return null;
}
