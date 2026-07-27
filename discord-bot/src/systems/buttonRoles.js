import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import db from "../database/db.js";
import { premiumEmbed, brand } from "../utils/brand.js";

const styleMap = {
  Primary: ButtonStyle.Primary,
  Secondary: ButtonStyle.Secondary,
  Success: ButtonStyle.Success,
  Danger: ButtonStyle.Danger,
};

export async function createButtonRolePanel(channel, title, description, roles) {
  // roles: [{roleId, label, style}]
  const customIds = [];
  const buttons = roles.slice(0, 5).map((item, index) => {
    const customId = `brole_${channel.guild.id}_${Date.now()}_${index}`;
    customIds.push({ ...item, customId });
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(item.label.slice(0, 80))
      .setStyle(styleMap[item.style] || ButtonStyle.Primary);
  });

  const embed = premiumEmbed({
    title: title || "🎭 Rol Menüsü",
    description:
      description ||
      "Aşağıdaki butonlara tıklayarak rol al / bırak.\nModern buton-rol sistemi · Lexyxzon",
    color: brand.colors.premium,
  });

  const message = await channel.send({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(...buttons)],
  });

  for (const item of customIds) {
    db.prepare(
      `INSERT INTO button_roles (guild_id, channel_id, message_id, custom_id, role_id, label, style)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      channel.guild.id,
      channel.id,
      message.id,
      item.customId,
      item.roleId,
      item.label,
      item.style || "Primary",
    );
  }

  return message;
}

export async function handleButtonRole(interaction) {
  const row = db.prepare("SELECT * FROM button_roles WHERE custom_id = ?").get(interaction.customId);
  if (!row) return false;

  const role = interaction.guild.roles.cache.get(row.role_id);
  if (!role) {
    await interaction.reply({ content: "Rol bulunamadı.", ephemeral: true });
    return true;
  }

  const member = interaction.member;
  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role, "Buton rol");
    await interaction.reply({ content: `${role} rolü kaldırıldı.`, ephemeral: true });
  } else {
    await member.roles.add(role, "Buton rol");
    await interaction.reply({ content: `${role} rolü verildi.`, ephemeral: true });
  }
  return true;
}
