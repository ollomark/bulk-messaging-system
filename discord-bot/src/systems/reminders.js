import db from "../database/db.js";

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    content TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    sent INTEGER DEFAULT 0
  );
`);

export function addReminder({ guildId, userId, channelId, content, remindAt }) {
  const info = db
    .prepare(
      `INSERT INTO reminders (guild_id, user_id, channel_id, content, remind_at, sent)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
    .run(guildId, userId, channelId, content, remindAt);
  return info.lastInsertRowid;
}

export function dueReminders(now = Date.now()) {
  return db
    .prepare("SELECT * FROM reminders WHERE sent = 0 AND remind_at <= ? ORDER BY remind_at ASC LIMIT 25")
    .all(now);
}

export function markReminderSent(id) {
  db.prepare("UPDATE reminders SET sent = 1 WHERE id = ?").run(id);
}

export function startReminderScheduler(client) {
  setInterval(async () => {
    const due = dueReminders();
    for (const row of due) {
      try {
        const channel = await client.channels.fetch(row.channel_id).catch(() => null);
        if (channel?.isTextBased()) {
          await channel.send({
            content: `⏰ <@${row.user_id}> hatırlatma (#${row.id}): **${row.content}**`,
          });
        }
      } catch {
        // ignore
      }
      markReminderSent(row.id);
    }
  }, 20_000);
}
