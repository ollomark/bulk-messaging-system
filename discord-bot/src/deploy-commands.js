import { REST, Routes } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertRuntimeConfig, config } from "./config.js";
import { loadCommands } from "./handlers/loadCommands.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  assertRuntimeConfig();

  const commands = await loadCommands(path.join(__dirname, "commands"));
  const body = [...commands.values()].map((cmd) => cmd.data.toJSON());
  const rest = new REST({ version: "10" }).setToken(config.token);

  // Global kayıt (tüm sunucular — yayılması biraz sürebilir)
  await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`${body.length} komut global olarak kaydedildi.`);

  // Botun bulunduğu her sunucuya anında kayıt
  const guilds = await rest.get(Routes.userGuilds());
  const guildIds = new Set((guilds || []).map((g) => g.id));
  if (config.guildId) guildIds.add(config.guildId);

  for (const guildId of guildIds) {
    try {
      await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body });
      console.log(`${body.length} komut guild'e kaydedildi: ${guildId}`);
    } catch (error) {
      console.error(`Guild komut kaydı başarısız (${guildId}):`, error.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
