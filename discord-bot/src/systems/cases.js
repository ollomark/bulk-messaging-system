import db from "../database/db.js";
import { sendLog } from "./logger.js";
import { premiumEmbed, brand } from "../utils/brand.js";

export function nextCaseNumber(guildId) {
  const row = db
    .prepare("SELECT MAX(case_number) AS max FROM mod_cases WHERE guild_id = ?")
    .get(guildId);
  return (row?.max || 0) + 1;
}

export function createCase({ guildId, type, userId, moderatorId, reason }) {
  const caseNumber = nextCaseNumber(guildId);
  db.prepare(
    `INSERT INTO mod_cases (guild_id, case_number, type, user_id, moderator_id, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(guildId, caseNumber, type, userId, moderatorId, reason || "Belirtilmedi", Date.now());
  return caseNumber;
}

export function getCase(guildId, caseNumber) {
  return db
    .prepare("SELECT * FROM mod_cases WHERE guild_id = ? AND case_number = ?")
    .get(guildId, caseNumber);
}

export function listCases(guildId, userId = null, limit = 10) {
  if (userId) {
    return db
      .prepare(
        `SELECT * FROM mod_cases WHERE guild_id = ? AND user_id = ?
         ORDER BY case_number DESC LIMIT ?`,
      )
      .all(guildId, userId, limit);
  }
  return db
    .prepare(
      `SELECT * FROM mod_cases WHERE guild_id = ?
       ORDER BY case_number DESC LIMIT ?`,
    )
    .all(guildId, limit);
}

export async function logCase(guild, { caseNumber, type, user, moderator, reason }) {
  const embed = premiumEmbed({
    title: `📁 Case #${caseNumber} · ${type.toUpperCase()}`,
    description: [
      `**Kullanıcı:** ${user} (\`${user.id || user}\`)`,
      `**Yetkili:** ${moderator}`,
      `**Sebep:** ${reason || "Belirtilmedi"}`,
    ].join("\n"),
    color: brand.colors.danger,
    footer: `${brand.name} Case System`,
  });

  await sendLog(guild, {
    title: embed.data.title,
    description: embed.data.description,
    color: brand.colors.danger,
    footer: `${brand.name} Case #${caseNumber}`,
  });

  return caseNumber;
}
