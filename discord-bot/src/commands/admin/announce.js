import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getSettings } from "../../database/settings.js";
import { baseEmbed, errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("duyuru")
    .setDescription("Sunucuya duyuru gönderir")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt.setName("baslik").setDescription("Duyuru başlığı").setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName("mesaj").setDescription("Duyuru içeriği").setRequired(true),
    )
    .addChannelOption((opt) =>
      opt
        .setName("kanal")
        .setDescription("Gönderilecek kanal (boşsa ayarlardaki duyuru kanalı)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addBooleanOption((opt) =>
      opt.setName("herkes").setDescription("@everyone etiketlensin mi?"),
    )
    .addBooleanOption((opt) =>
      opt.setName("here").setDescription("@here etiketlensin mi?"),
    ),
  async execute(interaction) {
    const title = interaction.options.getString("baslik", true);
    const message = interaction.options.getString("mesaj", true);
    const everyone = interaction.options.getBoolean("herkes") || false;
    const here = interaction.options.getBoolean("here") || false;
    const settings = getSettings(interaction.guild.id);
    const channel =
      interaction.options.getChannel("kanal") ||
      (settings.announce_channel_id
        ? await interaction.guild.channels.fetch(settings.announce_channel_id).catch(() => null)
        : null) ||
      interaction.channel;

    if (!channel?.isTextBased()) {
      return interaction.reply({
        embeds: [errorEmbed("Geçerli bir duyuru kanalı bulunamadı.")],
        ephemeral: true,
      });
    }

    const mentionParts = [];
    if (everyone) mentionParts.push("@everyone");
    if (here) mentionParts.push("@here");

    await channel.send({
      content: mentionParts.length ? mentionParts.join(" ") : undefined,
      embeds: [baseEmbed(title, message).setFooter({ text: `Duyuru: ${interaction.user.tag}` })],
      allowedMentions: { parse: everyone || here ? ["everyone"] : [] },
    });

    return interaction.reply({
      embeds: [successEmbed(`Duyuru ${channel} kanalına gönderildi.`)],
      ephemeral: true,
    });
  },
};
