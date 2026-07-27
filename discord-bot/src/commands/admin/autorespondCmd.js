import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { addResponder, listResponders, removeResponder } from "../../systems/autoresponder.js";
import { successEmbed, errorEmbed, infoEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("otoyanit")
    .setDescription("Otomatik cevap sistemi")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("ekle")
        .setDescription("Tetikleyici ekler")
        .addStringOption((opt) =>
          opt.setName("tetikleyici").setDescription("Örn: fiyat").setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName("cevap").setDescription("Botun cevabı").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("sil")
        .setDescription("ID ile siler")
        .addIntegerOption((opt) => opt.setName("id").setDescription("Kayıt ID").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("liste").setDescription("Listeyi gösterir")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "ekle") {
      const trigger = interaction.options.getString("tetikleyici", true);
      const response = interaction.options.getString("cevap", true);
      addResponder(interaction.guild.id, trigger, response);
      return interaction.reply({
        embeds: [successEmbed(`Oto yanıt eklendi.\n\`${trigger}\` → ${response}`)],
      });
    }
    if (sub === "sil") {
      const id = interaction.options.getInteger("id", true);
      const ok = removeResponder(interaction.guild.id, id);
      return interaction.reply({
        embeds: [ok ? successEmbed(`#${id} silindi.`) : errorEmbed("Kayıt yok.")],
        ephemeral: true,
      });
    }
    const rows = listResponders(interaction.guild.id);
    if (!rows.length) {
      return interaction.reply({ embeds: [infoEmbed("Oto yanıt yok.")], ephemeral: true });
    }
    return interaction.reply({
      embeds: [
        infoEmbed(
          rows.map((r) => `**#${r.id}** \`${r.trigger_text}\` → ${r.response_text}`).join("\n").slice(0, 3900),
          "Oto Yanıtlar",
        ),
      ],
      ephemeral: true,
    });
  },
};
