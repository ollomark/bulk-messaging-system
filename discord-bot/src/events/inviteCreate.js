import { Events } from "discord.js";
import { cacheGuildInvites } from "../systems/invites.js";

export default {
  name: Events.InviteCreate,
  async execute(invite) {
    if (invite.guild) await cacheGuildInvites(invite.guild);
  },
};
