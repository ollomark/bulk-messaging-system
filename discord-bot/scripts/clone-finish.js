/**
 * Finish clone: remove leftover target channels/roles not in source, create missing channels.
 */
import { Client, GatewayIntentBits, ChannelType, OverwriteType } from "discord.js";

const SOURCE_ID = process.env.SOURCE_GUILD_ID || "1246681493913206795";
const TARGET_ID = process.env.TARGET_GUILD_ID || "1511774336145555627";
const DELAY = Number(process.env.CLONE_DELAY_MS || 500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const wait = error?.retryAfter ? Number(error.retryAfter) * 1000 + 250 : 1200 * (i + 1);
      console.warn(`retry ${label}: ${error.message} · ${wait}ms`);
      await sleep(wait);
    }
  }
  throw last;
}

function creatableType(type) {
  // Announcement (5) needs COMMUNITY/NEWS — fall back to text
  if (type === ChannelType.GuildAnnouncement) return ChannelType.GuildText;
  if (type === ChannelType.PublicThread || type === ChannelType.PrivateThread) return null;
  if (type === ChannelType.GuildForum) return ChannelType.GuildForum;
  return type;
}

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  await client.login(process.env.DISCORD_TOKEN);
  await new Promise((r) => client.once("clientReady", r));

  const source = await client.guilds.fetch(SOURCE_ID);
  const target = await client.guilds.fetch(TARGET_ID);
  const me = await target.members.fetchMe();
  await Promise.all([source.channels.fetch(), source.roles.fetch(), target.channels.fetch(), target.roles.fetch()]);

  const sourceChannelNames = new Set(
    [...source.channels.cache.values()].map((c) => c.name.toLowerCase()),
  );
  const sourceRoleNames = new Set(
    [...source.roles.cache.values()]
      .filter((r) => r.id !== source.id && !r.managed)
      .map((r) => r.name.toLowerCase()),
  );

  // Build role map by name
  const roleMap = new Map();
  roleMap.set(source.id, target.id);
  for (const sr of source.roles.cache.values()) {
    if (sr.id === source.id) continue;
    const match = target.roles.cache.find(
      (tr) => tr.name === sr.name && !tr.managed && tr.id !== target.id,
    );
    if (match) roleMap.set(sr.id, match.id);
  }

  function mapOverwrites(channel) {
    if (!channel.permissionOverwrites?.cache) return [];
    return channel.permissionOverwrites.cache
      .map((ow) => {
        let id = ow.id;
        if (ow.type === OverwriteType.Role) {
          id = roleMap.get(ow.id);
          if (!id) return null;
        }
        return {
          id,
          type: ow.type,
          allow: ow.allow.bitfield,
          deny: ow.deny.bitfield,
        };
      })
      .filter(Boolean);
  }

  // 1) Delete leftover channels not in source (children first)
  const leftovers = [...target.channels.cache.values()]
    .filter((c) => !sourceChannelNames.has(c.name.toLowerCase()))
    .sort((a, b) => {
      if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
      if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
      return 0;
    });

  console.log(`== Fazla kanallar siliniyor (${leftovers.length}) ==`);
  for (const ch of leftovers) {
    try {
      try {
        await ch.permissionOverwrites.edit(me.id, {
          ViewChannel: true,
          ManageChannels: true,
          Connect: true,
        });
      } catch {
        /* ignore */
      }
      await withRetry(() => ch.delete("XZON clone cleanup"), `del ${ch.name}`, 2);
      console.log(`  silindi #${ch.name}`);
    } catch (error) {
      console.warn(`  ! #${ch.name}: ${error.message}`);
    }
    await sleep(DELAY);
  }

  // 2) Delete leftover roles not in source
  await target.roles.fetch();
  const roleLeftovers = [...target.roles.cache.values()]
    .filter(
      (r) =>
        r.id !== target.id &&
        !r.managed &&
        r.editable &&
        r.position < me.roles.highest.position &&
        !sourceRoleNames.has(r.name.toLowerCase()),
    )
    .sort((a, b) => b.position - a.position);

  console.log(`\n== Fazla roller siliniyor (${roleLeftovers.length}) ==`);
  for (const role of roleLeftovers) {
    try {
      await withRetry(() => role.delete("XZON clone cleanup"), `del @${role.name}`, 2);
      console.log(`  silindi @${role.name}`);
    } catch (error) {
      console.warn(`  ! @${role.name}: ${error.message}`);
    }
    await sleep(DELAY);
  }

  // Refresh maps after cleanup
  await target.channels.fetch();
  await target.roles.fetch();
  for (const sr of source.roles.cache.values()) {
    if (sr.id === source.id) continue;
    const match = target.roles.cache.find(
      (tr) => tr.name === sr.name && !tr.managed && tr.id !== target.id,
    );
    if (match) roleMap.set(sr.id, match.id);
  }

  const channelMap = new Map();
  for (const sc of source.channels.cache.values()) {
    const match = target.channels.cache.find((tc) => tc.name === sc.name);
    if (match) channelMap.set(sc.id, match.id);
  }

  // 3) Ensure missing categories
  const cats = [...source.channels.cache.values()]
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.rawPosition - b.rawPosition);

  console.log(`\n== Eksik kategoriler ==`);
  for (const cat of cats) {
    if (channelMap.has(cat.id)) continue;
    const created = await withRetry(
      () =>
        target.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          position: cat.rawPosition,
          permissionOverwrites: mapOverwrites(cat),
          reason: "XZON clone finish",
        }),
      `cat ${cat.name}`,
    );
    channelMap.set(cat.id, created.id);
    console.log(`  + 📁 ${created.name}`);
    await sleep(DELAY);
  }

  // 4) Ensure missing channels
  const kids = [...source.channels.cache.values()]
    .filter((c) => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => a.rawPosition - b.rawPosition);

  console.log(`\n== Eksik kanallar ==`);
  for (const ch of kids) {
    if (channelMap.has(ch.id)) {
      console.log(`  = #${ch.name}`);
      continue;
    }
    const type = creatableType(ch.type);
    if (type == null) {
      console.log(`  ~ thread atlandı #${ch.name}`);
      continue;
    }
    const parentId = ch.parentId ? channelMap.get(ch.parentId) : null;
    try {
      const created = await withRetry(
        () =>
          target.channels.create({
            name: ch.name,
            type,
            parent: parentId || undefined,
            position: ch.rawPosition,
            permissionOverwrites: mapOverwrites(ch),
            reason: "XZON clone finish",
            nsfw: "nsfw" in ch ? ch.nsfw : undefined,
            topic: "topic" in ch ? ch.topic || undefined : undefined,
            rateLimitPerUser: "rateLimitPerUser" in ch ? ch.rateLimitPerUser : undefined,
            bitrate: "bitrate" in ch ? ch.bitrate : undefined,
            userLimit: "userLimit" in ch ? ch.userLimit : undefined,
          }),
        `ch ${ch.name}`,
      );
      channelMap.set(ch.id, created.id);
      console.log(`  + #${created.name}${type !== ch.type ? " (text olarak)" : ""}`);
    } catch (error) {
      console.warn(`  ! #${ch.name}: ${error.message}`);
    }
    await sleep(DELAY);
  }

  await target.channels.fetch();
  await target.roles.fetch();
  console.log("\n== BİTTİ ==");
  console.log(`Hedef: ${target.channels.cache.size} kanal, ${target.roles.cache.size} rol`);
  console.log(`Kaynak: ${source.channels.cache.size} kanal, ${source.roles.cache.size} rol`);
  client.destroy();
  process.exit(0);
}

main().catch((e) => {
  console.error("FINISH FAILED:", e);
  process.exit(1);
});
