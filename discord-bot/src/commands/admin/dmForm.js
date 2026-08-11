import { SlashCommandBuilder } from "discord.js";
import { isOwner } from "../../utils/permissions.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";
import {
  buildDmFormComponents,
  buildDmFormPanelPayload,
  saveDmFormPanel,
} from "../../systems/dmForm.js";

export default {
  data: new SlashCommandBuilder()
    .setName("form")
    .setDescription("Sadece sahip — butonlu form paneli (yanıtlar DM'ye gelir)")
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Max 2 butonlu form paneli oluşturur")
        .addStringOption((opt) =>
          opt.setName("baslik").setDescription("Panel başlığı").setRequired(true).setMaxLength(100),
        )
        .addStringOption((opt) =>
          opt
            .setName("aciklama")
            .setDescription("Panel açıklaması")
            .setRequired(true)
            .setMaxLength(2000),
        )
        .addStringOption((opt) =>
          opt.setName("buton1").setDescription("1. buton yazısı").setRequired(true).setMaxLength(80),
        )
        .addStringOption((opt) =>
          opt.setName("buton2").setDescription("2. buton yazısı (opsiyonel)").setMaxLength(80),
        )
        .addStringOption((opt) =>
          opt
            .setName("yazi_alani")
            .setDescription("Açılacak yazı kutusunun adı (örn: Mesajın)")
            .setMaxLength(45),
        )
        .addStringOption((opt) =>
          opt
            .setName("modal_baslik")
            .setDescription("Yazı penceresinin başlığı")
            .setMaxLength(45),
        ),
    ),

  async execute(interaction) {
    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        embeds: [errorEmbed("Bu komutu sadece bot sahibi kullanabilir.")],
        ephemeral: true,
      });
    }

    const title = interaction.options.getString("baslik", true);
    const description = interaction.options.getString("aciklama", true);
    const btn1 = interaction.options.getString("buton1", true);
    const btn2 = interaction.options.getString("buton2");
    const fieldLabel = interaction.options.getString("yazi_alani") || "Mesajın";
    const modalTitle = interaction.options.getString("modal_baslik") || title.slice(0, 45);

    const payload = buildDmFormPanelPayload({
      title,
      description,
      btn1Label: btn1,
      btn2Label: btn2 || null,
    });

    const sent = await interaction.channel.send(payload);

    await sent.edit({
      components: buildDmFormComponents(sent.id, btn1, btn2 || null),
    });

    saveDmFormPanel({
      message_id: sent.id,
      guild_id: interaction.guild.id,
      channel_id: interaction.channel.id,
      owner_id: interaction.user.id,
      panel_title: title,
      panel_description: description,
      btn1_label: btn1,
      btn2_label: btn2 || null,
      field_label: fieldLabel,
      modal_title: modalTitle,
      created_at: Date.now(),
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          [
            "Form paneli gönderildi.",
            `Butonlar: **${btn1}**${btn2 ? ` · **${btn2}**` : ""}`,
            "Birisi yazınca sana DM gelecek.",
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
