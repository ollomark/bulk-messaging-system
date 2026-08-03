/**
 * One-shot: wipe TARGET guild channels/roles, clone structure from SOURCE.
 * Usage:
 *   SOURCE_GUILD_ID=... TARGET_GUILD_ID=... node scripts/clone-server.js
 */
import { Client, GatewayIntentBits, ChannelType, OverwriteType } from "discord.js";

const SOURCE_ID = process.env.SOURCE_GUILD_ID || "1246681493913206795";
const TARGET_ID = process.env.TARGET_GUILD_ID || "1511774336145555627";
const DELAY = Number(process.env.CLONE_DELAY_MS || 450);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, label, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const wait = error?.retryAfter
        ? Number(error.retryAfter) * 1000 + 250
        : 1500 * (i + 1);
      console.warn(`retry ${label}: ${error.message} · wait ${wait}ms`);
      await sleep(wait);
    }
  }
  throw last;
}

function serializeOverwrite(ow) {
  return {
    id: ow.id,
    type: ow.type,
    allow: ow.allow.bitfield.toString(),
    deny: ow.deny.bitfield.toString(),
  };
}

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildEmojisAndStickers],
  });

  await client.login(process.env.DISCORD_TOKEN);
  await new Promise((resolve) => client.once("clientReady", resolve));

  const source = await client.guilds.fetch(SOURCE_ID);
  const target = await client.guilds.fetch(TARGET_ID);
  await Promise.all([
    source.channels.fetch(),
    source.roles.fetch(),
    source.emojis.fetch().catch(() => null),
    target.channels.fetch(),
    target.roles.fetch(),
  ]);

  const me = await target.members.fetchMe();
  if (!me.permissions.has("Administrator")) {
    throw new Error("Bot hedef sunucuda Administrator değil");
  }

  console.log(`SOURCE: ${source.name} (${source.id})`);
  console.log(`TARGET: ${target.name} (${target.id})`);
  console.log(
    `Kaynak: ${source.channels.cache.size} kanal, ${source.roles.cache.size} rol`,
  );
  console.log(
    `Hedef (önce): ${target.channels.cache.size} kanal, ${target.roles.cache.size} rol`,
  );

  // 0) Disable Community so rules/updates channels can be deleted
  if (target.features.includes("COMMUNITY")) {
    console.log("\n== Community kapatılıyor ==");
    await withRetry(
      () =>
        target.edit({
          features: target.features.filter((f) => f !== "COMMUNITY"),
          rulesChannel: null,
          publicUpdatesChannel: null,
          reason: "XZON clone — community off to wipe channels",
        }),
      "disable community",
    );
    await target.fetch();
    console.log("  Community kapatıldı");
    await sleep(1000);
  }

  // 1) Delete all channels in target
  await target.channels.fetch();
  const channels = [...target.channels.cache.values()].sort((a, b) => {
    // children first, categories last
    if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return 1;
    if (b.type === ChannelType.GuildCategory && a.type !== ChannelType.GuildCategory) return -1;
    return 0;
  });
  console.log(`\n== Kanallar siliniyor (${channels.length}) ==`);
  for (const ch of channels) {
    try {
      // Private / locked channels: grant bot access first (anti-nuke sunucular)
      try {
        await ch.permissionOverwrites.edit(
          me.id,
          { ViewChannel: true, ManageChannels: true, Connect: true },
          { reason: "XZON clone unlock" },
        );
      } catch {
        /* ignore */
      }
      await withRetry(() => ch.delete("XZON clone wipe"), `del ch ${ch.name}`, 2);
      console.log(`  silindi #${ch.name}`);
    } catch (error) {
      console.warn(`  ! silinemedi #${ch.name}: ${error.message}`);
      if (error.code === 10004 || /Unknown Guild/i.test(error.message)) {
        throw new Error(
          "Bot sunucudan atılmış olabilir (anti-nuke). Davetle geri al, korumayı kapat, tekrar dene.",
        );
      }
    }
    await sleep(DELAY);
  }

  // 2) Delete removable roles in target
  const rolesToDelete = [...target.roles.cache.values()]
    .filter(
      (r) =>
        r.id !== target.id &&
        !r.managed &&
        r.editable &&
        r.position < me.roles.highest.position,
    )
    .sort((a, b) => b.position - a.position);
  console.log(`\n== Roller siliniyor (${rolesToDelete.length}) ==`);
  for (const role of rolesToDelete) {
    await withRetry(() => role.delete("XZON clone wipe"), `del role ${role.name}`);
    console.log(`  silindi @${role.name}`);
    await sleep(DELAY);
  }

  // 3) Clone roles (lowest position first)
  const sourceRoles = [...source.roles.cache.values()]
    .filter((r) => r.id !== source.id && !r.managed)
    .sort((a, b) => a.position - b.position);

  const roleMap = new Map(); // oldRoleId -> newRoleId
  roleMap.set(source.id, target.id); // @everyone

  console.log(`\n== Roller kopyalanıyor (${sourceRoles.length}) ==`);
  for (const role of sourceRoles) {
    const created = await withRetry(
      () =>
        target.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions,
          reason: "XZON clone from previous server",
        }),
      `create role ${role.name}`,
    );
    roleMap.set(role.id, created.id);
    console.log(`  + @${created.name}`);
    await sleep(DELAY);
  }

  // Fix role order (highest first via setPositions)
  try {
    const positions = sourceRoles
      .map((r) => {
        const newId = roleMap.get(r.id);
        if (!newId) return null;
        return { role: newId, position: r.position };
      })
      .filter(Boolean);
    if (positions.length) {
      await withRetry(
        () => target.roles.setPositions(positions),
        "set role positions",
      );
      console.log("  rol pozisyonları ayarlandı");
    }
  } catch (error) {
    console.warn("rol pozisyon uyarısı:", error.message);
  }

  function mapOverwrites(channel) {
    return channel.permissionOverwrites.cache
      .map((ow) => {
        let id = ow.id;
        if (ow.type === OverwriteType.Role) {
          id = roleMap.get(ow.id);
          if (!id) return null;
        }
        // Member overwrites: keep same user id (works if same people join)
        return {
          id,
          type: ow.type,
          allow: BigInt(serializeOverwrite(ow).allow),
          deny: BigInt(serializeOverwrite(ow).deny),
        };
      })
      .filter(Boolean);
  }

  // 4) Clone categories first
  const categories = [...source.channels.cache.values()]
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.rawPosition - b.rawPosition);

  const channelMap = new Map(); // old channel id -> new channel id

  console.log(`\n== Kategoriler kopyalanıyor (${categories.length}) ==`);
  for (const cat of categories) {
    const created = await withRetry(
      () =>
        target.channels.create({
          name: cat.name,
          type: ChannelType.GuildCategory,
          position: cat.rawPosition,
          permissionOverwrites: mapOverwrites(cat),
          reason: "XZON clone",
        }),
      `cat ${cat.name}`,
    );
    channelMap.set(cat.id, created.id);
    console.log(`  + 📁 ${created.name}`);
    await sleep(DELAY);
  }

  // 5) Clone non-category channels
  const kids = [...source.channels.cache.values()]
    .filter((c) => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => a.rawPosition - b.rawPosition);

  console.log(`\n== Kanallar kopyalanıyor (${kids.length}) ==`);
  for (const ch of kids) {
    const parentId = ch.parentId ? channelMap.get(ch.parentId) : null;
    const base = {
      name: ch.name,
      type: ch.type,
      parent: parentId || undefined,
      position: ch.rawPosition,
      permissionOverwrites: mapOverwrites(ch),
      reason: "XZON clone",
      nsfw: "nsfw" in ch ? ch.nsfw : undefined,
      topic: "topic" in ch ? ch.topic || undefined : undefined,
      rateLimitPerUser: "rateLimitPerUser" in ch ? ch.rateLimitPerUser : undefined,
      bitrate: "bitrate" in ch ? ch.bitrate : undefined,
      userLimit: "userLimit" in ch ? ch.userLimit : undefined,
      rtcRegion: "rtcRegion" in ch ? ch.rtcRegion || undefined : undefined,
    };

    // Skip unsupported exotic types if create fails
    try {
      const created = await withRetry(
        () => target.channels.create(base),
        `ch ${ch.name}`,
      );
      channelMap.set(ch.id, created.id);
      console.log(`  + #${created.name}`);
    } catch (error) {
      console.warn(`  ! atlandı #${ch.name}: ${error.message}`);
    }
    await sleep(DELAY);
  }

  // 6) Emojis (best-effort)
  try {
    const emojis = [...source.emojis.cache.values()];
    console.log(`\n== Emojiler (${emojis.length}) ==`);
    for (const emoji of emojis) {
      try {
        await withRetry(
          () =>
            target.emojis.create({
              attachment: emoji.imageURL({ extension: "png", size: 128 }),
              name: emoji.name,
              reason: "XZON clone",
            }),
          `emoji ${emoji.name}`,
        );
        console.log(`  + :${emoji.name}:`);
        await sleep(DELAY + 200);
      } catch (error) {
        console.warn(`  ! emoji ${emoji.name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.warn("emoji kopyalama atlandı:", error.message);
  }

  // 7) Guild appearance (icon / banner best-effort — keep target name)
  try {
    const patch = {};
    if (source.icon) patch.icon = source.iconURL({ extension: "png", size: 512 });
    if (Object.keys(patch).length) {
      await withRetry(() => target.setIcon(patch.icon), "set icon");
      console.log("\n== Sunucu ikonu kopyalandı ==");
    }
  } catch (error) {
    console.warn("ikon atlandı:", error.message);
  }

  // System / AFK channel mapping
  try {
    const sysId = source.systemChannelId
      ? channelMap.get(source.systemChannelId)
      : null;
    const afkId = source.afkChannelId ? channelMap.get(source.afkChannelId) : null;
    await target.edit({
      systemChannel: sysId || null,
      afkChannel: afkId || null,
      afkTimeout: source.afkTimeout,
      reason: "XZON clone settings",
    });
    console.log("sistem / afk kanalları ayarlandı");
  } catch (error) {
    console.warn("guild settings:", error.message);
  }

  await target.channels.fetch();
  await target.roles.fetch();
  console.log("\n== BİTTİ ==");
  console.log(
    `Hedef (sonra): ${target.channels.cache.size} kanal, ${target.roles.cache.size} rol`,
  );

  client.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error("CLONE FAILED:", error);
  process.exit(1);
});
