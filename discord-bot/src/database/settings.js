import db from "./db.js";

const defaults = {
  log_channel_id: null,
  welcome_channel_id: null,
  welcome_message:
    "Hoş geldin {user}! **{server}** sunucusuna katıldın. Artık {memberCount}. üyeyiz!",
  welcome_enabled: 1,
  welcome_delete_after: 30,
  goodbye_channel_id: null,
  goodbye_message: "{user} sunucudan ayrıldı. Görüşürüz!",
  ticket_category_id: null,
  ticket_log_channel_id: null,
  ticket_support_role_id: null,
  ticket_panel_title: null,
  ticket_panel_description: null,
  ticket_panel_button: null,
  level_channel_id: null,
  level_enabled: 1,
  announce_channel_id: null,
  mute_role_id: null,
  auto_role_id: null,
  anti_spam: 1,
  anti_link: 0,
  anti_invite: 1,
  anti_raid: 1,
  anti_caps: 0,
  mod_mode: 0,
};

export function ensureGuild(guildId) {
  const existing = db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId);
  if (existing) return existing;

  db.prepare("INSERT INTO guild_settings (guild_id) VALUES (?)").run(guildId);
  return db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId);
}

export function getSettings(guildId) {
  return ensureGuild(guildId);
}

export function updateSettings(guildId, patch) {
  ensureGuild(guildId);
  const keys = Object.keys(patch);
  if (!keys.length) return getSettings(guildId);

  const sets = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => patch[key]);
  db.prepare(`UPDATE guild_settings SET ${sets} WHERE guild_id = ?`).run(...values, guildId);
  return getSettings(guildId);
}

export function getDefaultWelcome() {
  return defaults.welcome_message;
}
