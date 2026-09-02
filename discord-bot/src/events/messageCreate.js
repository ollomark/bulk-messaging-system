import { Events } from "discord.js";
import { handleProtectionMessage } from "../systems/protection.js";
import { handleLevelMessage } from "../systems/leveling.js";
import { clearAfkIfTalking, maybeNotifyAfkMention } from "../systems/afk.js";
import {
  maskAnonOpenerMessage,
  relayAnonDmToTicket,
  relayAnonTicketToDm,
} from "../systems/tickets.js";
import { handleGreetingReply } from "../systems/greetingReply.js";

export default {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot) return;

    if (!message.guild) {
      await relayAnonDmToTicket(message, client);
      return;
    }

    if (await maskAnonOpenerMessage(message)) return;
    if (await relayAnonTicketToDm(message)) return;

    const blocked = await handleProtectionMessage(message);
    if (blocked) return;

    await handleGreetingReply(message);

    await clearAfkIfTalking(message);
    await maybeNotifyAfkMention(message);
    await handleLevelMessage(message);
  },
};
