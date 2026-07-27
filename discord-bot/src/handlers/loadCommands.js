import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadCommands(commandsDir) {
  const commands = new Map();
  const folders = fs.readdirSync(commandsDir);

  for (const folder of folders) {
    const folderPath = path.join(commandsDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));
    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      const mod = await import(pathToFileURL(fullPath).href);
      const command = mod.default;
      if (!command?.data?.name || typeof command.execute !== "function") {
        console.warn(`Atlandı (geçersiz komut): ${fullPath}`);
        continue;
      }
      commands.set(command.data.name, command);
    }
  }

  return commands;
}
