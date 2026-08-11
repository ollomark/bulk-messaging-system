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
    .setDescription("Sadece sahip — özel buton paneli")
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("Max 2 butonlu panel oluşturur")
        .addStringOption((opt) =>
          opt.setName("baslik").setDescription("Başlık").setRequired(true).setMaxLength(100),
        )
        .addStringOption((opt) =>
          opt
            .setName("aciklama")
            .setDescription("Açıklama")
            .setRequired(true)
            .setMaxLength(1800),
        )
        .addStringOption((opt) =>
          opt.setName("buton1").setDescription("1. buton").setRequired(true).setMaxLength(80),
        )
        .addStringOption((opt) =>
          opt.setName("buton2").setDescription("2. buton (opsiyonel)").setMaxLength(80),
        )
        .addStringOption((opt) =>
          opt
            .setName("yazi_alani")
            .setDescription("Yazı kutusunun adı")
            .setMaxLength(45),
        )
        .addStringOption((opt) =>
          opt
            .setName("pencere")
            .setDescription("Açılan pencerenin başlığı")
            .setMaxLength(45),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("max")
            .setDescription("Maksimum karakter (1–1900)")
            .setMinValue(1)
            .setMaxValue(1900),
        )
        .addIntegerOption((opt) =>
          opt
            .setName("min")
            .setDescription("Minimum karakter (1–1900)")
            .setMinValue(1)
            .setMaxValue(1900),
        )
        .addStringOption((opt) =>
          opt
            .setName("tip")
            .setDescription("Yanıt tipi")
            .addChoices(
              { name: "Serbest metin", value: "metin" },
              { name: "Sadece sayı", value: "sayi" },
              { name: "Sadece harf", value: "harf" },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName("ornek")
            .setDescription("Yazı kutusunda görünen örnek / placeholder")
            .setMaxLength(100),
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
    const modalTitle = interaction.options.getString("pencere") || title.slice(0, 45);
    let minLength = interaction.options.getInteger("min") ?? 1;
    let maxLength = interaction.options.getInteger("max") ?? 500;
    const inputType = interaction.options.getString("tip") || "metin";
    const placeholder = interaction.options.getString("ornek");

    if (maxLength < minLength) {
      const tmp = minLength;
      minLength = maxLength;
      maxLength = tmp;
    }

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
      min_length: minLength,
      max_length: maxLength,
      input_type: inputType,
      placeholder: placeholder || null,
      created_at: Date.now(),
    });

    return interaction.reply({
      embeds: [
        successEmbed(
          [
            "Panel gönderildi.",
            `Buton: **${btn1}**${btn2 ? ` · **${btn2}**` : ""}`,
            `Kural: min **${minLength}** · max **${maxLength}** · tip **${inputType}**`,
          ].join("\n"),
        ),
      ],
      ephemeral: true,
    });
  },
};
