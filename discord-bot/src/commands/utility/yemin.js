import { SlashCommandBuilder } from "discord.js";
import { swearOath } from "../../systems/agentGate.js";

export default {
  data: new SlashCommandBuilder()
    .setName("yemin")
    .setDescription("Onaylandıktan sonra ajan yemini ver"),
  async execute(interaction) {
    await swearOath(interaction);
  },
};
