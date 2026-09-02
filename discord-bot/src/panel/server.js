import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sessions = new Map();

function panelSecret() {
  return process.env.PANEL_SECRET || process.env.OWNER_ID || "lexyxzon-change-me";
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function auth(req, res, next) {
  const token = req.cookies?.panel_token;
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Oturum gerekli" });
  }
  req.panelSession = sessions.get(token);
  return next();
}

async function getAnonWebhook(channel, client) {
  const hooks = await channel.fetchWebhooks();
  let hook = hooks.find((h) => h.name === "Anonim" && h.owner?.id === client.user.id);
  if (!hook) {
    hook = await channel.createWebhook({
      name: "Anonim",
      avatar: "https://cdn.discordapp.com/embed/avatars/1.png",
      reason: "Panel anonim mesaj",
    });
  }
  return hook;
}

export function startPanelServer(client) {
  const app = express();
  const port = Number(process.env.PORT || process.env.PANEL_PORT || 3080);

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Discord çakması istemci — public, auth yok
  const xzonDir = path.join(__dirname, "xzon");
  app.get("/xzon", (_req, res) => {
    res.sendFile(path.join(xzonDir, "index.html"));
  });
  app.get("/xzon/", (_req, res) => {
    res.sendFile(path.join(xzonDir, "index.html"));
  });
  app.use("/xzon", express.static(xzonDir, { index: false, redirect: false }));

  app.use(express.static(path.join(__dirname, "public")));

  app.post("/api/login", (req, res) => {
    const { password } = req.body || {};
    if (!password || password !== panelSecret()) {
      return res.status(403).json({ error: "Hatalı şifre" });
    }
    const token = createToken();
    sessions.set(token, { at: Date.now(), ownerId: config.ownerId });
    res.cookie("panel_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ ok: true });
  });

  app.post("/api/logout", (req, res) => {
    const token = req.cookies?.panel_token;
    if (token) sessions.delete(token);
    res.clearCookie("panel_token");
    return res.json({ ok: true });
  });

  app.get("/api/me", auth, (req, res) => {
    res.json({
      ok: true,
      bot: {
        tag: client.user?.tag,
        id: client.user?.id,
        avatar: client.user?.displayAvatarURL?.({ size: 128 }),
        guilds: client.guilds.cache.size,
        ping: client.ws.ping,
        uptime: Math.floor(process.uptime()),
        commands: client.commands?.size || 0,
      },
      ownerId: config.ownerId,
    });
  });

  app.get("/api/guilds", auth, async (req, res) => {
    const guilds = [...client.guilds.cache.values()].map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));
    res.json({ guilds });
  });

  app.get("/api/guilds/:guildId/channels", auth, async (req, res) => {
    const guild = await client.guilds.fetch(req.params.guildId).catch(() => null);
    if (!guild) return res.status(404).json({ error: "Sunucu yok" });

    const channels = [...guild.channels.cache.values()]
      .filter((c) => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement)
      .sort((a, b) => a.rawPosition - b.rawPosition)
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parent: c.parent?.name || null,
      }));

    res.json({ channels });
  });

  app.post("/api/send", auth, async (req, res) => {
    try {
      const { guildId, channelId, content, mode = "bot", username } = req.body || {};
      if (!guildId || !channelId || !content?.trim()) {
        return res.status(400).json({ error: "guildId, channelId, content zorunlu" });
      }

      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return res.status(404).json({ error: "Sunucu bulunamadı" });

      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased()) {
        return res.status(400).json({ error: "Geçersiz kanal" });
      }

      const text = String(content).slice(0, 2000);
      let message;

      if (mode === "anon") {
        const webhook = await getAnonWebhook(channel, client);
        message = await webhook.send({
          content: text,
          username: (username || "Anonim").slice(0, 80),
          avatarURL: "https://cdn.discordapp.com/embed/avatars/1.png",
          allowedMentions: { parse: [] },
        });
      } else {
        const me = guild.members.me || (await guild.members.fetchMe());
        if (!channel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages)) {
          return res.status(403).json({ error: "Bu kanala yazma izni yok" });
        }
        message = await channel.send({
          content: text,
          allowedMentions: { parse: [] },
        });
      }

      return res.json({
        ok: true,
        messageId: message.id,
        url: message.url,
        mode,
      });
    } catch (error) {
      console.error("Panel send error:", error);
      return res.status(500).json({ error: error.message || "Gönderilemedi" });
    }
  });

  app.post("/api/embed", auth, async (req, res) => {
    try {
      const { guildId, channelId, title, description, color } = req.body || {};
      if (!guildId || !channelId || !description?.trim()) {
        return res.status(400).json({ error: "Eksik alan" });
      }
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      const channel = guild ? await guild.channels.fetch(channelId).catch(() => null) : null;
      if (!channel?.isTextBased()) return res.status(400).json({ error: "Geçersiz kanal" });

      const embed = new EmbedBuilder()
        .setColor(Number.parseInt(String(color || "A855F7").replace("#", ""), 16) || 0xa855f7)
        .setDescription(String(description).slice(0, 4000))
        .setTimestamp();
      if (title) embed.setTitle(String(title).slice(0, 256));

      const message = await channel.send({ embeds: [embed] });
      return res.json({ ok: true, url: message.url });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  // Express 5 uyumlu SPA fallback (panel only; /xzon is static above)
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/xzon")) {
      return next();
    }
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`🖥️  Kontrol paneli: http://0.0.0.0:${port}`);
  });
}
