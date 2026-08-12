import { PermissionFlagsBits, ChannelType } from "discord.js";

const TAG = "#freeEgexzon🕊️";

const LINES = [
  "Duvarlar geçici, kardeşlik kalıcı. Kapı bir gün açılır.",
  "Mapus soğuk olabilir; bizim bağımız sıcak kalsın.",
  "Her sabah aynı dua: sağ salim, dimdik, özgür.",
  "Kafes kuşun şarkısını susturamaz.",
  "Zaman geçer, sabır büyür, umut eksilmez.",
  "Dışarıda seni bekleyen bir aile var — unutma.",
  "Hapishane gün sayar; biz de seninle sayıyoruz.",
  "Kardeşimiz içeride, kalbimiz yanında.",
  "Demir parmaklıklar iradeyi kıramaz.",
  "Geceler uzun olsa da şafak hep gelir.",
  "Sessizlik değil, dayanışma konuşsun burada.",
  "Bir gün bu kapı açılacak — o günü şimdiden kutluyoruz.",
  "Mapusta bile onur ayakta durur.",
  "Yalnız değilsin. Bu kanal senin için yanıyor.",
  "Sabır bir silah; umut bir ışık.",
  "Adalet gecikir ama kardeşlik beklemez — yanında duruyoruz.",
  "Her dakika bir nefes, her nefes bir hatırlatma: özgür olacaksın.",
  "Dışarıdaki dünya seni unutmadı.",
  "Karanlık koridorlar, aydınlık niyetler.",
  "Egexzon — ismin burada yaşasın, sesin buradan yükselsin.",
  "Mapus duvarına yazılan her umut, bir gün dışarı taşar.",
  "Kardeşlik zincirden güçlüdür.",
  "Bugün de aynı söz: dimdik dur, biz buradayız.",
  "Hürriyet uzak görünür; adım adım yaklaşır.",
  "İçerideki cesaret, dışarıdaki sadakatle çoğalır.",
  "Bir mektup gibi bu satırlar: okun, bilin, unutulmasın.",
  "Gözler dışarıda, kalp içeride — aynı yerdeyiz.",
  "Zaman işlese de hatıra silinmez.",
  "Kilitler paslanır; kardeşlik paslanmaz.",
  "Bu kanal bir pencere: her dakika bir selam.",
];

let timer = null;
let index = 0;

function nextMessage() {
  const line = LINES[index % LINES.length];
  index += 1;
  return `${line}\n\n${TAG}`;
}

export async function ensureFreeEgexzonChannel(guild) {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && /^egexzon/i.test(c.name),
  );
  if (existing) return existing;

  const me = guild.members.me;
  return guild.channels.create({
    name: "egexzon🕊️",
    type: ChannelType.GuildText,
    topic: TAG,
    reason: "freeEgexzon support wall",
    permissionOverwrites: [
      {
        id: guild.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AddReactions,
        ],
        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.SendMessagesInThreads],
      },
      {
        id: me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.AddReactions,
        ],
      },
    ],
  });
}

export function startFreeEgexzonWall(client) {
  if (timer) return;

  const tick = async () => {
    try {
      const guildId = process.env.FREE_EGEXZON_GUILD_ID || process.env.GUILD_ID || "1511774336145555627";
      const channelId = process.env.FREE_EGEXZON_CHANNEL_ID;
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      let channel = channelId
        ? await guild.channels.fetch(channelId).catch(() => null)
        : null;
      if (!channel) {
        await guild.channels.fetch();
        channel = await ensureFreeEgexzonChannel(guild);
      }
      if (!channel?.isTextBased()) return;

      await channel.send({
        content: nextMessage(),
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.warn("freeEgexzon wall:", error.message);
    }
  };

  // first post shortly after boot, then every minute
  setTimeout(tick, 5_000);
  timer = setInterval(tick, 60_000);
  console.log("🕊️ freeEgexzon wall: her dakika mesaj aktif");
}
