import { Events } from "discord.js";
import { sendLog } from "../systems/logger.js";

export default {
  name: Events.GuildRoleUpdate,
  async execute(oldRole, newRole) {
    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`İsim: \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.hexColor !== newRole.hexColor) {
      changes.push(`Renk: \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
    }
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
      changes.push("İzinler güncellendi");
    }
    if (!changes.length) return;

    await sendLog(newRole.guild, {
      title: "🎭 Rol Güncellendi",
      description: `${newRole}\n${changes.join("\n")}`,
      color: 0xfee75c,
    });
  },
};
