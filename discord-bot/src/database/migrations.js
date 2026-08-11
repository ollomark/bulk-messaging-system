import db from "./db.js";

function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
}

function addColumn(table, column, type) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

export function runMigrations() {
  addColumn("guild_settings", "verify_channel_id", "TEXT");
  addColumn("guild_settings", "verify_role_id", "TEXT");
  addColumn("guild_settings", "verify_enabled", "INTEGER DEFAULT 0");
  addColumn("guild_settings", "starboard_channel_id", "TEXT");
  addColumn("guild_settings", "starboard_limit", "INTEGER DEFAULT 3");
  addColumn("guild_settings", "suggest_channel_id", "TEXT");
  addColumn("guild_settings", "temp_voice_channel_id", "TEXT");
  addColumn("guild_settings", "temp_voice_category_id", "TEXT");
  addColumn("guild_settings", "brand_footer", "TEXT");
  addColumn("guild_settings", "report_channel_id", "TEXT");
  addColumn("guild_settings", "apply_channel_id", "TEXT");
  addColumn("guild_settings", "ticket_panel_title", "TEXT");
  addColumn("guild_settings", "ticket_panel_description", "TEXT");
  addColumn("guild_settings", "ticket_panel_button", "TEXT");

  // Oto yanıt tamamen kaldırıldı
  db.exec("DROP TABLE IF EXISTS autoresponders;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS mod_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      case_number INTEGER NOT NULL,
      type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(guild_id, case_number)
    );

    CREATE TABLE IF NOT EXISTS invites (
      guild_id TEXT NOT NULL,
      inviter_id TEXT NOT NULL,
      invited_id TEXT NOT NULL,
      code TEXT,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (guild_id, invited_id)
    );

    CREATE TABLE IF NOT EXISTS invite_counts (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      regular INTEGER DEFAULT 0,
      left_count INTEGER DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS starboard_map (
      original_message_id TEXT PRIMARY KEY,
      starboard_message_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      star_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      message_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS temp_voices (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS button_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      custom_id TEXT NOT NULL UNIQUE,
      role_id TEXT NOT NULL,
      label TEXT NOT NULL,
      style TEXT DEFAULT 'Primary'
    );

    CREATE TABLE IF NOT EXISTS sticky_messages (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      content TEXT NOT NULL,
      last_message_id TEXT
    );

    CREATE TABLE IF NOT EXISTS dm_form_panels (
      message_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      panel_title TEXT,
      panel_description TEXT,
      btn1_label TEXT NOT NULL,
      btn2_label TEXT,
      field_label TEXT NOT NULL,
      modal_title TEXT,
      min_length INTEGER DEFAULT 1,
      max_length INTEGER DEFAULT 500,
      input_type TEXT DEFAULT 'metin',
      placeholder TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  addColumn("dm_form_panels", "min_length", "INTEGER DEFAULT 1");
  addColumn("dm_form_panels", "max_length", "INTEGER DEFAULT 500");
  addColumn("dm_form_panels", "input_type", "TEXT DEFAULT 'metin'");
  addColumn("dm_form_panels", "placeholder", "TEXT");
}
