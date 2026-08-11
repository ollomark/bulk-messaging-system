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

export function saveDmFormPanel(row) {
  db.prepare(
    `INSERT INTO dm_form_panels (
      message_id, guild_id, channel_id, owner_id,
      panel_title, panel_description,
      btn1_label, btn2_label, field_label, modal_title, created_at
    ) VALUES (
      @message_id, @guild_id, @channel_id, @owner_id,
      @panel_title, @panel_description,
      @btn1_label, @btn2_label, @field_label, @modal_title, @created_at
    )
    ON CONFLICT(message_id) DO UPDATE SET
      panel_title = excluded.panel_title,
      panel_description = excluded.panel_description,
      btn1_label = excluded.btn1_label,
      btn2_label = excluded.btn2_label,
      field_label = excluded.field_label,
      modal_title = excluded.modal_title`,
  ).run(row);
}

export function getDmFormPanel(messageId) {
  return db.prepare("SELECT * FROM dm_form_panels WHERE message_id = ?").get(messageId);
}

export function buildDmFormPanelPayload({
  title,
  description,
  btn1Label,
  btn2Label,
  messageIdPlaceholder = "pending",
}) {
  const embed = new EmbedBuilder()
    .setColor(0x111111)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "Form · yanıtlar sadece sahibe iletilir" })
    .setTimestamp();

  const buttons = [
    new ButtonBuilder()
      .setCustomId(`${BTN_PREFIX}${messageIdPlaceholder}_0`)
      .setLabel(btn1Label.slice(0, 80))
      .setStyle(ButtonStyle.Primary),
  ];

  if (btn2Label) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${BTN_PREFIX}${messageIdPlaceholder}_1`)
        .setLabel(btn2Label.slice(0, 80))
        .setStyle(ButtonStyle.Secondary),
    );
  }

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(...buttons)],
  };
}

/** After message is sent, rewrite customIds with real message id. */
export function buildDmFormComponents(messageId, btn1Label, btn2Label) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(`${BTN_PREFIX}${messageId}_0`)
      .setLabel(btn1Label.slice(0, 80))
      .setStyle(ButtonStyle.Primary),
  ];
  if (btn2Label) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`${BTN_PREFIX}${messageId}_1`)
        .setLabel(btn2Label.slice(0, 80))
        .setStyle(ButtonStyle.Secondary),
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

export function buildDmFormModal(panel, buttonIndex) {
  const btnLabel =
    buttonIndex === 1 && panel.btn2_label ? panel.btn2_label : panel.btn1_label;
  const modalTitle = (panel.modal_title || btnLabel || "Form").slice(0, 45);
  const fieldLabel = (panel.field_label || "Mesajın").slice(0, 45);

  return new ModalBuilder()
    .setCustomId(`${MODAL_PREFIX}${panel.message_id}_${buttonIndex}`)
    .setTitle(modalTitle)
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("dmform_text")
          .setLabel(fieldLabel)
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(1900)
          .setPlaceholder("Buraya yaz..."),
      ),
    );
}

export async function handleDmFormButton(interaction) {
  const parsed = parseDmFormButtonId(interaction.customId);
  if (!parsed) return false;

  const panel = getDmFormPanel(parsed.messageId);
  if (!panel) {
    await interaction.reply({
      content: "Bu form artık aktif değil.",
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
      content: "Bu form artık aktif değil.",
      ephemeral: true,
    });
    return true;
  }

  const text = interaction.fields.getTextInputValue("dmform_text")?.trim();
  if (!text) {
    await interaction.reply({ content: "Boş mesaj gönderilemez.", ephemeral: true });
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
      content: "Sahip bulunamadı — mesaj iletilemedi.",
      ephemeral: true,
    });
    return true;
  }

  const embed = new EmbedBuilder()
    .setColor(0xb91c1c)
    .setTitle(`Form yanıtı · ${btnLabel}`)
    .setDescription(text)
    .addFields(
      {
        name: "Gönderen",
        value: `${interaction.user} (\`${interaction.user.tag}\` · \`${interaction.user.id}\`)`,
        inline: false,
      },
      {
        name: "Sunucu",
        value: interaction.guild
          ? `${interaction.guild.name} (\`${interaction.guild.id}\`)`
          : "DM",
        inline: true,
      },
      {
        name: "Panel",
        value: panel.panel_title || "Form",
        inline: true,
      },
    )
    .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
    .setTimestamp();

  try {
    await owner.send({ embeds: [embed] });
  } catch {
    await interaction.reply({
      content: "Sahibe DM atılamadı (DM kapalı olabilir).",
      ephemeral: true,
    });
    return true;
  }

  await interaction.reply({
    content: "Mesajın iletildi ✅",
    ephemeral: true,
  });
  return true;
}
