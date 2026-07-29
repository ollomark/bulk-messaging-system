import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { premiumEmbed, brand } from "../../utils/brand.js";
import { errorEmbed, successEmbed } from "../../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Ultra premium embed studio")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("baslik").setDescription("Başlık").setRequired(true))
    .addStringOption((opt) => opt.setName("aciklama").setDescription("Açıklama").setRequired(true))
    .addChannelOption((opt) =>
      opt
        .setName("kanal")
        .setDescription("Gönderilecek kanal")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    )
    .addStringOption((opt) =>
      opt
        .setName("renk")
        .setDescription("Hex renk (örn: A855F7)")
        .setMaxLength(6),
    )
    .addStringOption((opt) => opt.setName("resim").setDescription("Görsel URL"))
    .addStringOption((opt) => opt.setName("thumbnail").setDescription("Küçük görsel URL"))
    .addBooleanOption((opt) => opt.setName("herkes").setDescription("@everyone")),
  async execute(interaction) {
    const title = interaction.options.getString("baslik", true);
    const description = interaction.options.getString("aciklama", true);
    const channel = interaction.options.getChannel("kanal") || interaction.channel;
    const colorHex = interaction.options.getString("renk");
    const image = interaction.options.getString("resim");
    const thumbnail = interaction.options.getString("thumbnail");
    const everyone = interaction.options.getBoolean("herkes") || false;

    if (!channel?.isTextBased()) {
      return interaction.reply({ embeds: [errorEmbed("Geçersiz kanal.")], ephemeral: true });
    }

    const color = colorHex ? Number.parseInt(colorHex, 16) : brand.colors.premium;
    const embed = premiumEmbed({
      title,
      description: description.replaceAll("\\n", "\n"),
      color: Number.isFinite(color) ? color : brand.colors.premium,
      image: image || null,
      thumbnail: thumbnail || null,
      footer: `${brand.name} Embed Studio`,
      author: { name: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined },
    });

    await channel.send({
      content: everyone ? "@everyone" : undefined,
      embeds: [embed],
      allowedMentions: { parse: everyone ? ["everyone"] : [] },
    });

    return interaction.reply({
      embeds: [successEmbed(`Embed ${channel} kanalına gönderildi.`)],
      ephemeral: true,
    });
  },
};
