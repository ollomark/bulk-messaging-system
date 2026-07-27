import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertRuntimeConfig, config } from "./config.js";
import { loadCommands } from "./handlers/loadCommands.js";
import { loadEvents } from "./handlers/loadEvents.js";
import { startGiveawayScheduler } from "./systems/giveaways.js";
import "./database/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.commands = new Collection();

async function bootstrap() {
  assertRuntimeConfig();

  const commands = await loadCommands(path.join(__dirname, "commands"));
  for (const [name, command] of commands) {
    client.commands.set(name, command);
  }

  await loadEvents(client, path.join(__dirname, "events"));
  startGiveawayScheduler(client);

  await client.login(config.token);
}

bootstrap().catch((error) => {
  console.error("Bot başlatılamadı:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
