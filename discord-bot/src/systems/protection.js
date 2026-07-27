import { PermissionFlagsBits } from "discord.js";
import db from "../database/db.js";
import { getSettings } from "../database/settings.js";
import { sendLog } from "./logger.js";

const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)/i;
const linkRegex = /https?:\/\/|www\./i;
const joinBuckets = new Map();

function countCapsRatio(content) {
  const letters = content.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, "");
  if (letters.length < 8) return 0;
  const caps = letters.replace(/[^A-ZĞÜŞİÖÇ]/g, "").length;
  return caps / letters.length;
}

export function trackJoin(guildId) {
  const now = Date.now();
  const bucket = joinBuckets.get(guildId) || [];
  const recent = bucket.filter((ts) => now - ts < 10000);
  recent.push(now);
  joinBuckets.set(guildId, recent);
  return recent.length;
}

export async function handleProtectionMessage(message) {
  if (!message.guild || message.author.bot) return false;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return false;

  const settings = getSettings(message.guild.id);
  const content = message.content || "";

  if (settings.mod_mode === 1) {
    await message.delete().catch(() => null);
    return true;
  }

  if (settings.anti_invite && inviteRegex.test(content)) {
    await message.delete().catch(() => null);
    await message.channel
      .send({ content: `${message.author}, davet linkleri bu sunucuda yasak.` })
      .then((msg) => setTimeout(() => msg.delete().catch(() => null), 5000));
    await sendLog(message.guild, {
      title: "🛡️ Anti-Invite",
      description: `${message.author} davet linki paylaştığı için mesaj silindi.`,
      color: 0xed4245,
      fields: [
        { name: "Kanal", value: `${message.channel}`, inline: true },
        { name: "İçerik", value: content.slice(0, 900) || "-" },
      ],
    });
    return true;
  }

  if (settings.anti_link && linkRegex.test(content) && !inviteRegex.test(content)) {
    await message.delete().catch(() => null);
    await message.channel
      .send({ content: `${message.author}, link paylaşımı kısıtlı.` })
      .then((msg) => setTimeout(() => msg.delete().catch(() => null), 5000));
    await sendLog(message.guild, {
      title: "🛡️ Anti-Link",
      description: `${message.author} link paylaştığı için mesaj silindi.`,
      color: 0xed4245,
    });
    return true;
  }

  if (settings.anti_caps && countCapsRatio(content) >= 0.7) {
    await message.delete().catch(() => null);
    await message.channel
      .send({ content: `${message.author}, aşırı büyük harf kullanımı engellendi.` })
      .then((msg) => setTimeout(() => msg.delete().catch(() => null), 5000));
    return true;
  }

  if (settings.anti_spam) {
    const row =
      db
        .prepare("SELECT * FROM spam_tracker WHERE guild_id = ? AND user_id = ?")
        .get(message.guild.id, message.author.id) || {
        count: 0,
        last_message: 0,
      };

    const now = Date.now();
    let count = row.count;
    if (now - row.last_message < 4000) {
      count += 1;
    } else {
      count = 1;
    }

    db.prepare(
      `INSERT INTO spam_tracker (guild_id, user_id, count, last_message)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(guild_id, user_id) DO UPDATE SET count = excluded.count, last_message = excluded.last_message`,
    ).run(message.guild.id, message.author.id, count, now);

    if (count >= 6) {
      await message.delete().catch(() => null);
      if (message.member?.moderatable) {
        await message.member.timeout(60_000, "Anti-spam").catch(() => null);
      }
      db.prepare("UPDATE spam_tracker SET count = 0 WHERE guild_id = ? AND user_id = ?").run(
        message.guild.id,
        message.author.id,
      );
      await sendLog(message.guild, {
        title: "🛡️ Anti-Spam",
        description: `${message.author} spam yaptığı için 1 dakika timeout aldı.`,
        color: 0xed4245,
      });
      return true;
    }
  }

  return false;
}

export async function handleRaidJoin(member) {
  const settings = getSettings(member.guild.id);
  if (!settings.anti_raid) return;

  const joins = trackJoin(member.guild.id);
  if (joins >= 8) {
    if (member.kickable) {
      await member.kick("Anti-raid: ani katılım dalgası").catch(() => null);
    }
    await sendLog(member.guild, {
      title: "🛡️ Anti-Raid",
      description: `${member.user.tag} ani katılım nedeniyle atıldı. (10 sn içinde ${joins} katılım)`,
      color: 0xed4245,
    });
  }
}
