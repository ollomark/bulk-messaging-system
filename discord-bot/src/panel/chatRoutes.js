import {
  GUILDS,
  WEB_CHANNELS,
  activateNitro,
  boostGuild,
  channelExists,
  channelsForGuild,
  createChannel,
  createGuild,
  createInvite,
  createWebSession,
  deleteMessage,
  editMessage,
  getChannelMeta,
  getMessages,
  getOrCreateDm,
  getPinnedMessages,
  getSessionUser,
  getUnreadMap,
  getUserById,
  joinByInvite,
  listMentions,
  joinVoice,
  leaveVoice,
  listChannelsForUser,
  listDms,
  listGuildsForUser,
  listOfflineRecent,
  listOnlineUsers,
  markRead,
  postMessage,
  searchMessages,
  setVoiceFlags,
  togglePin,
  toggleReaction,
  touchPresence,
  updateProfile,
  userInGuild,
  voiceRoster,
} from "./chatStore.js";
import { broadcast, broadcastPresence, clientCount, setClientChannel, subscribe } from "./chatHub.js";

function chatUser(req, res) {
  const token =
    req.cookies?.xzon_token || req.headers["x-xzon-token"] || req.query?.token;
  const user = getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "Oturum gerekli" });
    return null;
  }
  return user;
}

function pushPresence() {
  broadcastPresence(listOnlineUsers(), voiceRoster());
}

function assertChannelAccess(user, channelId) {
  const meta = getChannelMeta(channelId);
  if (!meta) return null;
  if (meta.type === "dm" && user.id !== meta.userA && user.id !== meta.userB) {
    return null;
  }
  if (meta.guildId && meta.guildId !== "dm" && !userInGuild(user.id, meta.guildId)) {
    return null;
  }
  return meta;
}

export function mountChatRoutes(app) {
  app.get("/xzon/api/health", (_req, res) => {
    res.json({
      ok: true,
      clients: clientCount(),
      channels: WEB_CHANNELS.length,
      guilds: GUILDS.length,
      version: "xzon-8",
    });
  });

  app.get("/xzon/api/bootstrap", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    touchPresence(user.id);
    return res.json({
      ok: true,
      user,
      guilds: listGuildsForUser(user.id),
      channels: listChannelsForUser(user.id),
      online: listOnlineUsers(),
      offline: listOfflineRecent(25),
      dms: listDms(user.id),
      unread: getUnreadMap(user.id),
      voice: voiceRoster(),
    });
  });

  app.get("/xzon/api/channels", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    res.json({
      guilds: listGuildsForUser(user.id),
      channels: listChannelsForUser(user.id),
    });
  });

  app.post("/xzon/api/guilds", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const result = createGuild(user.id, {
        name: req.body?.name,
        color: req.body?.color,
      });
      broadcast("guild_create", { guild: result.guild, userId: user.id });
      return res.json({
        ok: true,
        ...result,
        guilds: listGuildsForUser(user.id),
        channels: listChannelsForUser(user.id),
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/guilds/join", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const result = joinByInvite(user.id, req.body?.code);
      return res.json({
        ok: true,
        ...result,
        guilds: listGuildsForUser(user.id),
        channels: listChannelsForUser(user.id),
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/guilds/:guildId/invite", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const invite = createInvite(user.id, req.params.guildId);
      return res.json({ ok: true, ...invite });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/guilds/:guildId/channels", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const channel = createChannel(user.id, req.params.guildId, req.body || {});
      broadcast("channel_create", { channel });
      return res.json({
        ok: true,
        channel,
        channels: listChannelsForUser(user.id),
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/guilds/:guildId/boost", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const result = boostGuild(user.id, req.params.guildId);
      return res.json({
        ok: true,
        ...result,
        guilds: listGuildsForUser(user.id),
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/nitro", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const updated = activateNitro(user.id, req.body?.tier || "full");
      broadcast("user_update", { user: updated });
      return res.json({ ok: true, user: updated });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/session", (req, res) => {
    try {
      const { name } = req.body || {};
      const session = createWebSession(name);
      res.cookie("xzon_token", session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      pushPresence();
      return res.json({ ok: true, user: session.user, token: session.token });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Giriş başarısız" });
    }
  });

  app.get("/xzon/api/me", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    touchPresence(user.id);
    return res.json({
      ok: true,
      user,
      online: listOnlineUsers(),
      unread: getUnreadMap(user.id),
      voice: voiceRoster(),
    });
  });

  app.patch("/xzon/api/me", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const updated = updateProfile(user.id, req.body || {});
      pushPresence();
      broadcast("user_update", { user: updated });
      return res.json({ ok: true, user: updated });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/logout", (req, res) => {
    const token = req.cookies?.xzon_token || req.headers["x-xzon-token"];
    const user = getSessionUser(token);
    if (user?.voiceChannelId) leaveVoice(user.id);
    res.clearCookie("xzon_token");
    pushPresence();
    return res.json({ ok: true });
  });

  app.get("/xzon/api/users/:id", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const profile = getUserById(req.params.id);
    if (!profile) return res.status(404).json({ error: "Kullanıcı yok" });
    return res.json({ user: profile });
  });

  app.get("/xzon/api/dms", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    return res.json({ dms: listDms(user.id) });
  });

  app.post("/xzon/api/dms", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const peerId = String(req.body?.userId || "");
      const dm = getOrCreateDm(user.id, peerId);
      return res.json({ ok: true, ...dm });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/xzon/api/guilds/:guildId/channels", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    if (!userInGuild(user.id, req.params.guildId)) {
      return res.status(403).json({ error: "Sunucuya erişim yok" });
    }
    return res.json({ channels: channelsForGuild(req.params.guildId) });
  });

  app.get("/xzon/api/messages", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const channelId = String(req.query.channel || "genel");
    if (!assertChannelAccess(user, channelId)) {
      return res.status(404).json({ error: "Kanal yok" });
    }
    const messages = getMessages(channelId, {
      after: Number(req.query.after || 0),
      before: Number(req.query.before || 0),
      limit: Number(req.query.limit || 80),
      viewerId: user.id,
    });
    markRead(user.id, channelId);
    return res.json({ messages, unread: getUnreadMap(user.id) });
  });

  app.get("/xzon/api/search", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const channelId = String(req.query.channel || "genel");
    if (!assertChannelAccess(user, channelId)) {
      return res.status(404).json({ error: "Kanal yok" });
    }
    return res.json({
      messages: searchMessages(channelId, String(req.query.q || ""), user.id),
    });
  });

  app.get("/xzon/api/mentions", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    return res.json({ messages: listMentions(user.id, Number(req.query.limit || 30)) });
  });

  app.get("/xzon/api/inbox", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    return res.json({
      mentions: listMentions(user.id, 30),
      unread: getUnreadMap(user.id),
      dms: listDms(user.id),
    });
  });

  app.get("/xzon/api/pins", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const channelId = String(req.query.channel || "genel");
    if (!assertChannelAccess(user, channelId)) {
      return res.status(404).json({ error: "Kanal yok" });
    }
    return res.json({ messages: getPinnedMessages(channelId, user.id) });
  });

  app.post("/xzon/api/messages", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const { channelId, content, replyToId } = req.body || {};
      const id = String(channelId || "");
      if (!assertChannelAccess(user, id)) throw new Error("Kanal yok");
      const message = postMessage(user, id, content, { replyToId: replyToId || null });
      broadcast("message", { message }, { channelId: message.channelId });
      broadcast("unread", { unread: true });
      pushPresence();
      return res.json({ ok: true, message });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Gönderilemedi" });
    }
  });

  app.patch("/xzon/api/messages/:id", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const message = editMessage(user.id, req.params.id, req.body?.content);
      broadcast("message_update", { message }, { channelId: message.channelId });
      return res.json({ ok: true, message });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.delete("/xzon/api/messages/:id", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const message = deleteMessage(user.id, req.params.id);
      broadcast("message_update", { message }, { channelId: message.channelId });
      return res.json({ ok: true, message });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/messages/:id/react", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const message = toggleReaction(user.id, req.params.id, req.body?.emoji);
      broadcast("message_update", { message }, { channelId: message.channelId });
      return res.json({ ok: true, message });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/messages/:id/pin", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const message = togglePin(user.id, req.params.id);
      broadcast("message_update", { message }, { channelId: message.channelId });
      broadcast("pins", { channelId: message.channelId });
      return res.json({ ok: true, message });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/typing", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const channelId = String(req.body?.channelId || "");
    if (!channelExists(channelId) || !assertChannelAccess(user, channelId)) {
      return res.status(404).json({ error: "Kanal yok" });
    }
    broadcast(
      "typing",
      { channelId, user: { id: user.id, name: user.name } },
      { channelId, excludeUserId: user.id },
    );
    return res.json({ ok: true });
  });

  app.post("/xzon/api/presence", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    touchPresence(user.id);
    const online = listOnlineUsers();
    pushPresence();
    return res.json({
      ok: true,
      online,
      offline: listOfflineRecent(25),
      unread: getUnreadMap(user.id),
      voice: voiceRoster(),
    });
  });

  app.post("/xzon/api/voice/join", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const updated = joinVoice(user.id, String(req.body?.channelId || ""));
      pushPresence();
      broadcast("voice", { voice: voiceRoster() });
      return res.json({ ok: true, user: updated, voice: voiceRoster() });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/xzon/api/voice/leave", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const updated = leaveVoice(user.id);
    pushPresence();
    broadcast("voice", { voice: voiceRoster() });
    return res.json({ ok: true, user: updated, voice: voiceRoster() });
  });

  app.post("/xzon/api/voice/flags", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const updated = setVoiceFlags(user.id, req.body || {});
      pushPresence();
      broadcast("voice", { voice: voiceRoster() });
      return res.json({ ok: true, user: updated });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/xzon/api/stream", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;

    const channelId = String(req.query.channel || "genel");
    if (!assertChannelAccess(user, channelId) && !channelExists(channelId)) {
      return res.status(404).json({ error: "Kanal yok" });
    }
    if (String(channelId).startsWith("dm:") && !assertChannelAccess(user, channelId)) {
      return res.status(403).json({ error: "DM erişimi yok" });
    }
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    res.write(`event: hello\ndata: ${JSON.stringify({ userId: user.id, channelId })}\n\n`);
    subscribe(res, { userId: user.id, channelId });
    setClientChannel(user.id, channelId);
    touchPresence(user.id);
    pushPresence();

    const heartbeat = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${Date.now()}\n\n`);
        touchPresence(user.id);
      } catch {
        clearInterval(heartbeat);
      }
    }, 20_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      pushPresence();
    });
  });
}
