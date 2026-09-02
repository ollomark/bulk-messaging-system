import {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { premiumEmbed, brand, brandFooter } from "../../utils/brand.js";

const PAGES = {
  home: {
    title: `${brand.name} · Komut Merkezi`,
    description: [
      brand.tagline,
      "",
      "**Son seviye suite** — aşağıdaki menüden kategori seç.",
      `Davet: \`${brand.invite}\``,
    ].join("\n"),
    fields: [
      { name: "Hızlı", value: "`/panel` `/ayarlar` `/ticket panel` `/seviye` `/liderlik`", inline: false },
    ],
  },
  admin: {
    title: "⚙️ Yönetim",
    description: "Sunucu kurulumu ve paneller",
    fields: [
      {
        name: "Komutlar",
        value: [
          "`/ayarlar` · kurulum",
          "`/panel` · kontrol merkezi",
          "`/ozet` · ultra özet",
          "`/embed` · embed studio",
          "`/form` · sahip form paneli",
          "`/anonim` · webhook anonim mesaj",
          "`/dm` · özel mesaj",
          "`/duyuru` · duyuru",
          "`/istatistik` · analytics",
        ].join("\n"),
      },
    ],
  },
  mod: {
    title: "🛡️ Moderasyon",
    description: "Ceza ve kanal yönetimi",
    fields: [
      {
        name: "Komutlar",
        value: [
          "`/ban` `/unban` `/kick`",
          "`/timeout` `/untimeout`",
          "`/warn` `/uyarilar` `/case`",
          "`/temizle` `/kilitle` `/kilidiac` `/yavasmod`",
          "`/rol` `/isimdegistir`",
          "`/koruma` · anti-spam/raid",
        ].join("\n"),
      },
    ],
  },
  tickets: {
    title: "🎫 Destek & Anlaşma",
    description: "Normal + anonim ticket · anlaşma paneli",
    fields: [
      {
        name: "Komutlar",
        value: [
          "`/ticket panel` · normal + **Anonim Ticket**",
          "`/ticket anlasma` · Anlaşma Kur (emin misin → sahip DM)",
          "`/ticket yazi` · panel metni",
          "`/ticket kapat` · ticket kapat",
        ].join("\n"),
      },
      {
        name: "Anonim",
        value: "Kanala yazınca mesaj **Anonim** görünür — bot adı çıkmaz. DM ile de yazılabilir.",
      },
    ],
  },
  community: {
    title: "📈 Topluluk",
    description: "Seviye, davet, verify, roller",
    fields: [
      {
        name: "Komutlar",
        value: [
          "`/seviye` `/liderlik` · XP (sadece sohbet kanalı)",
          "`/davetler` · invite engine",
          "`/dogrulama` · verify gate",
          "`/emojirol` `/butonrol`",
          "`/cekilis` · giveaway",
          "`/starboard`",
          "`/basvuru` · staff apply",
          "`/ses` `/gecicises`",
        ].join("\n"),
      },
    ],
  },
  utility: {
    title: "✨ Utility",
    description: "Günlük araçlar",
    fields: [
      {
        name: "Komutlar",
        value: [
          "`/afk` `/hatirlat` `/anket` `/ping` `/snipe`",
          "`/avatar` `/kullanici` `/sunucu` `/say`",
          "`/oneri` `/rapor`",
          "`/yazi-tura`",
        ].join("\n"),
      },
    ],
  },
};

function pageEmbed(key) {
  const page = PAGES[key] || PAGES.home;
  return premiumEmbed({
    title: page.title,
    description: page.description,
    fields: page.fields || [],
    color: brand.colors.gold,
    footer: brandFooter("yardım"),
  });
}

function helpMenu(selected = "home") {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("help_category")
      .setPlaceholder("Kategori seç")
      .addOptions(
        { label: "Ana menü", value: "home", emoji: "🏠", default: selected === "home" },
        { label: "Yönetim", value: "admin", emoji: "⚙️", default: selected === "admin" },
        { label: "Moderasyon", value: "mod", emoji: "🛡️", default: selected === "mod" },
        { label: "Ticket & Anlaşma", value: "tickets", emoji: "🎫", default: selected === "tickets" },
        { label: "Topluluk", value: "community", emoji: "📈", default: selected === "community" },
        { label: "Utility", value: "utility", emoji: "✨", default: selected === "utility" },
      ),
  );
}

export function buildHelpPayload(category = "home") {
  return {
    embeds: [pageEmbed(category)],
    components: [helpMenu(category)],
  };
}

export default {
  data: new SlashCommandBuilder()
    .setName("yardim")
    .setDescription("SORGUTR Ultimate komut merkezi"),
  async execute(interaction) {
    return interaction.reply({
      ...buildHelpPayload("home"),
      ephemeral: true,
    });
  },
};

export { PAGES };
