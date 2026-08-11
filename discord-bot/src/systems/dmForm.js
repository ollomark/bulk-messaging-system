import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import db from "../database/db.js";
import { config } from "../config.js";

const BTN_PREFIX = "dmform_btn_";
const MODAL_PREFIX = "dmform_modal_";

const INPUT_TYPES = {
  metin: { key: "metin", label: "Serbest metin" },
  sayi: { key: "sayi", label: "Sadece sayı" },
  harf: { key: "harf", label: "Sadece harf" },
};

export function saveDmFormPanel(row) {
  db.prepare(
    `INSERT INTO dm_form_panels (
      message_id, guild_id, channel_id, owner_id,
      panel_title, panel_description,
      btn1_label, btn2_label, field_label, modal_title,
      min_length, max_length, input_type, placeholder, created_at
    ) VALUES (
      @message_id, @guild_id, @channel_id, @owner_id,
      @panel_title, @panel_description,
      @btn1_label, @btn2_label, @field_label, @modal_title,
      @min_length, @max_length, @input_type, @placeholder, @created_at
    )
    ON CONFLICT(message_id) DO UPDATE SET
      panel_title = excluded.panel_title,
      panel_description = excluded.panel_description,
      btn1_label = excluded.btn1_label,
      btn2_label = excluded.btn2_label,
      field_label = excluded.field_label,
      modal_title = excluded.modal_title,
      min_length = excluded.min_length,
      max_length = excluded.max_length,
      input_type = excluded.input_type,
      placeholder = excluded.placeholder`,
  ).run(row);
}

export function getDmFormPanel(messageId) {
  return db.prepare("SELECT * FROM dm_form_panels WHERE message_id = ?").get(messageId);
}

function buttonStyle(index) {
  return index === 0 ? ButtonStyle.Secondary : ButtonStyle.Primary;
}

export function buildDmFormPanelPayload({ title, description, btn1Label, btn2Label }) {
  const content = [
    `# ${title}`,
    "",
    description,
  ].join("\n");

  const buttons = [
    new ButtonBuilder()
      .setCustomId(`${BTN_PREFIX}pending_0`)
      .setLabel(btn1Label.slice(0, 80))
      .setStyle(buttonStyle(0)),
  ];

  if (btn2Label) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${BTN_PREFIX}pending_1`)
        .setLabel(btn2Label.slice(0, 80))
        .setStyle(buttonStyle(1)),
    );
  }

  return {
    content,
    embeds: [],
    components: [new ActionRowBuilder().addComponents(...buttons)],
    allowedMentions: { parse: [] },
  };
}

export function buildDmFormComponents(messageId, btn1Label, btn2Label) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(`${BTN_PREFIX}${messageId}_0`)
      .setLabel(btn1Label.slice(0, 80))
      .setStyle(buttonStyle(0)),
  ];
  if (btn2Label) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${BTN_PREFIX}${messageId}_1`)
        .setLabel(btn2Label.slice(0, 80))
        .setStyle(buttonStyle(1)),
    );
  }
  return [new ActionRowBuilder().addComponents(...buttons)];
}

export function parseDmFormButtonId(customId) {
  if (!customId.startsWith(BTN_PREFIX)) return null;
  const rest = customId.slice(BTN_PREFIX.length);
  const idx = rest.lastIndexOf("_");
  if (idx < 0) return null;
  const messageId = rest.slice(0, idx);
  const buttonIndex = Number(rest.slice(idx + 1));
  if (!messageId || Number.isNaN(buttonIndex)) return null;
  return { messageId, buttonIndex };
}

export function parseDmFormModalId(customId) {
  if (!customId.startsWith(MODAL_PREFIX)) return null;
  const rest = customId.slice(MODAL_PREFIX.length);
  const idx = rest.lastIndexOf("_");
  if (idx < 0) return null;
  const messageId = rest.slice(0, idx);
  const buttonIndex = Number(rest.slice(idx + 1));
  if (!messageId || Number.isNaN(buttonIndex)) return null;
  return { messageId, buttonIndex };
}

function panelLimits(panel) {
  const min = Math.max(1, Math.min(Number(panel.min_length) || 1, 1900));
  let max = Math.max(1, Math.min(Number(panel.max_length) || 500, 1900));
  if (max < min) max = min;
  const inputType = panel.input_type || "metin";
  return { min, max, inputType };
}

export function buildDmFormModal(panel, buttonIndex) {
  const btnLabel =
    buttonIndex === 1 && panel.btn2_label ? panel.btn2_label : panel.btn1_label;
  const modalTitle = (panel.modal_title || btnLabel || "Yaz").slice(0, 45);
  const fieldLabel = (panel.field_label || "Mesajın").slice(0, 45);
  const { min, max, inputType } = panelLimits(panel);
  const placeholder =
    panel.placeholder ||
    (inputType === "sayi"
      ? "Örn: 1234"
      : inputType === "harf"
        ? "Sadece harf"
        : "Buraya yaz…");

  const style =
    inputType === "sayi" || max <= 80 ? TextInputStyle.Short : TextInputStyle.Paragraph;

  return new ModalBuilder()
    .setCustomId(`${MODAL_PREFIX}${panel.message_id}_${buttonIndex}`)
    .setTitle(modalTitle)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("dmform_text")
          .setLabel(fieldLabel)
          .setStyle(style)
          .setRequired(true)
          .setMinLength(min)
          .setMaxLength(max)
          .setPlaceholder(placeholder.slice(0, 100)),
      ),
    );
}

function validateInput(text, panel) {
  const { min, max, inputType } = panelLimits(panel);
  if (text.length < min) {
    return `En az **${min}** karakter yazmalısın.`;
  }
  if (text.length > max) {
    return `En fazla **${max}** karakter yazabilirsin.`;
  }
  if (inputType === "sayi" && !/^\d+$/.test(text)) {
    return "Sadece sayı girebilirsin.";
  }
  if (inputType === "harf" && !/^[\p{L}\s]+$/u.test(text)) {
    return "Sadece harf girebilirsin.";
  }
  return null;
}

export async function handleDmFormButton(interaction) {
  const parsed = parseDmFormButtonId(interaction.customId);
  if (!parsed) return false;

  const panel = getDmFormPanel(parsed.messageId);
  if (!panel) {
    await interaction.reply({
      content: "Bu panel artık aktif değil.",
      ephemeral: true,
    });
    return true;
  }

  if (parsed.buttonIndex === 1 && !panel.btn2_label) {
    await interaction.reply({ content: "Bu buton geçersiz.", ephemeral: true });
    return true;
  }

  await interaction.showModal(buildDmFormModal(panel, parsed.buttonIndex));
  return true;
}

export async function handleDmFormModal(interaction, client) {
  const parsed = parseDmFormModalId(interaction.customId);
  if (!parsed) return false;

  const panel = getDmFormPanel(parsed.messageId);
  if (!panel) {
    await interaction.reply({
      content: "Bu panel artık aktif değil.",
      ephemeral: true,
    });
    return true;
  }

  const text = interaction.fields.getTextInputValue("dmform_text")?.trim();
  if (!text) {
    await interaction.reply({ content: "Boş bırakılamaz.", ephemeral: true });
    return true;
  }

  const invalid = validateInput(text, panel);
  if (invalid) {
    await interaction.reply({ content: invalid, ephemeral: true });
    return true;
  }

  const btnLabel =
    parsed.buttonIndex === 1 && panel.btn2_label
      ? panel.btn2_label
      : panel.btn1_label;

  const ownerId = config.ownerId || panel.owner_id;
  const owner = await client.users.fetch(ownerId).catch(() => null);
  if (!owner) {
    await interaction.reply({
      content: "Yanıt iletilemedi.",
      ephemeral: true,
    });
    return true;
  }

  const { inputType } = panelLimits(panel);
  const typeLabel = INPUT_TYPES[inputType]?.label || "Metin";

  // Owner DM: compact, no "form" branding
  const dm = new EmbedBuilder()
    .setColor(0x1e1f22)
    .setAuthor({
      name: interaction.user.tag,
      iconURL: interaction.user.displayAvatarURL({ size: 64 }),
    })
    .setDescription(text)
    .addFields(
      { name: "Buton", value: btnLabel, inline: true },
      { name: "Tip", value: typeLabel, inline: true },
      { name: "ID", value: `\`${interaction.user.id}\``, inline: true },
    )
    .setTimestamp();

  if (interaction.guild) {
    dm.setFooter({ text: interaction.guild.name });
  }

  try {
    await owner.send({ embeds: [dm] });
  } catch {
    await interaction.reply({
      content: "DM kapalı — yanıt iletilemedi.",
      ephemeral: true,
    });
    return true;
  }

  await interaction.reply({
    content: "Gönderildi.",
    ephemeral: true,
  });
  return true;
}

export { INPUT_TYPES };
