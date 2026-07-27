import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../../data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "guardian.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    log_channel_id TEXT,
    welcome_channel_id TEXT,
    welcome_message TEXT,
    welcome_enabled INTEGER DEFAULT 1,
    welcome_delete_after INTEGER DEFAULT 30,
    goodbye_channel_id TEXT,
    goodbye_message TEXT,
    ticket_category_id TEXT,
    ticket_log_channel_id TEXT,
    ticket_support_role_id TEXT,
    level_channel_id TEXT,
    level_enabled INTEGER DEFAULT 1,
    announce_channel_id TEXT,
    mute_role_id TEXT,
    auto_role_id TEXT,
    anti_spam INTEGER DEFAULT 1,
    anti_link INTEGER DEFAULT 0,
    anti_invite INTEGER DEFAULT 1,
    anti_raid INTEGER DEFAULT 1,
    anti_caps INTEGER DEFAULT 0,
    mod_mode INTEGER DEFAULT 0,
    voice_channel_id TEXT,
    voice_24_7 INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    reason TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS levels (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    opener_id TEXT NOT NULL,
    claimed_by TEXT,
    status TEXT DEFAULT 'open',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS giveaways (
    message_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    host_id TEXT NOT NULL,
    prize TEXT NOT NULL,
    winners INTEGER DEFAULT 1,
    ends_at INTEGER NOT NULL,
    ended INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS giveaway_entries (
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS mutes (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ends_at INTEGER,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS spam_tracker (
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    last_message INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS reaction_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    emoji_key TEXT NOT NULL,
    emoji_raw TEXT NOT NULL,
    role_id TEXT NOT NULL,
    UNIQUE(message_id, emoji_key)
  );
`);

export default db;
