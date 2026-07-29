import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getSettings, updateSettings } from "../database/settings.js";
import { premiumEmbed, brand } from "../utils/brand.js";

export function buildVerifyPanel(guild) {
  const embed = premiumEmbed({
    title: "✅ Doğrulama Kapısı",
    description: [
      `**${guild.name}** sunucusuna hoş geldin.`,
      "",
      "Erişim için aşağıdaki butona tıkla.",
      "Bu adım bot, raid ve sahte hesaplara karşı koruma sağlar.",
      "",
      "Doğrulandıktan sonra kanallar açılır.",
    ].join("\n"),
    color: brand.colors.success,
    thumbnail: guild.iconURL({ size: 256 }),
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify_pass")
      .setLabel("Doğrula / Verify")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),
  );

  return { embeds: [embed], components: [row] };
}

export async function handleVerify(interaction) {
  const settings = getSettings(interaction.guild.id);
  if (!settings.verify_enabled || !settings.verify_role_id) {
    return interaction.reply({
      content: "Doğrulama sistemi bu sunucuda aktif değil.",
      ephemeral: true,
    });
  }

  const role = interaction.guild.roles.cache.get(settings.verify_role_id);
  if (!role) {
    return interaction.reply({ content: "Doğrulama rolü bulunamadı.", ephemeral: true });
  }

  if (interaction.member.roles.cache.has(role.id)) {
    return interaction.reply({ content: "Zaten doğrulanmışsın.", ephemeral: true });
  }

  const me = interaction.guild.members.me;
  if (role.position >= me.roles.highest.position) {
    return interaction.reply({
      content: "Bot bu rolü veremiyor. Bot rolünü yukarı taşı.",
      ephemeral: true,
    });
  }

  await interaction.member.roles.add(role, "Doğrulama geçildi");
  return interaction.reply({
    content: `Doğrulama tamam ✅ ${role} rolün verildi. İyi eğlenceler!`,
    ephemeral: true,
  });
}

export async function setupVerify(guild, channel, role) {
  updateSettings(guild.id, {
    verify_channel_id: channel.id,
    verify_role_id: role.id,
    verify_enabled: 1,
  });

  // everyone için view kısıtı önerilmez otomatik; sadece panel at
  const message = await channel.send(buildVerifyPanel(guild));
  return message;
}

export function verifyLockHint() {
  return "İpucu: `@everyone` rolünden kanalları gizle, sadece doğrulama rolüne aç.";
}
