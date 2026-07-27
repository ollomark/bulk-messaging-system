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

  if (config.guildId) {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });
    console.log(`${body.length} komut guild'e kaydedildi.`);
  } else {
    await rest.put(Routes.applicationCommands(config.clientId), { body });
    console.log(`${body.length} komut global olarak kaydedildi (yayılması birkaç dakika sürebilir).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
