import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

export const config = {
  token: process.env.DISCORD_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  guildId: process.env.GUILD_ID || null,
  ownerId: process.env.OWNER_ID || null,
  embedColor: Number.parseInt(process.env.EMBED_COLOR || "5865F2", 16),
  welcomeDeleteAfter: Number.parseInt(process.env.WELCOME_DELETE_AFTER || "30", 10),
};

export function assertRuntimeConfig() {
  required("DISCORD_TOKEN");
  required("CLIENT_ID");
}
