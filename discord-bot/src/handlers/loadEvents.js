import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadEvents(client, eventsDir) {
  const files = fs.readdirSync(eventsDir).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const fullPath = path.join(eventsDir, file);
    const mod = await import(pathToFileURL(fullPath).href);
    const event = mod.default;
    if (!event?.name || typeof event.execute !== "function") {
      console.warn(`Atlandı (geçersiz event): ${fullPath}`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}
