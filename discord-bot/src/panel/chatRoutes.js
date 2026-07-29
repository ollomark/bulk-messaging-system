import {
  WEB_CHANNELS,
  channelExists,
  createWebSession,
  getMessages,
  getSessionUser,
  listOnlineUsers,
  postMessage,
  touchPresence,
} from "./chatStore.js";
import { broadcast, broadcastPresence, clientCount, subscribe } from "./chatHub.js";

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
  broadcastPresence(listOnlineUsers());
}

export function mountChatRoutes(app) {
  app.get("/xzon/api/health", (_req, res) => {
    res.json({ ok: true, clients: clientCount(), channels: WEB_CHANNELS.length });
  });

  app.get("/xzon/api/channels", (_req, res) => {
    res.json({ channels: WEB_CHANNELS });
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
    return res.json({ ok: true, user, online: listOnlineUsers() });
  });

  app.post("/xzon/api/logout", (req, res) => {
    res.clearCookie("xzon_token");
    return res.json({ ok: true });
  });

  app.get("/xzon/api/messages", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const channelId = String(req.query.channel || "genel");
    if (!channelExists(channelId)) {
      return res.status(404).json({ error: "Kanal yok" });
    }
    const after = Number(req.query.after || 0);
    return res.json({
      messages: getMessages(channelId, { after, limit: Number(req.query.limit || 80) }),
    });
  });

  app.post("/xzon/api/messages", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    try {
      const { channelId, content } = req.body || {};
      const message = postMessage(user, String(channelId || ""), content);
      broadcast("message", { message }, { channelId: message.channelId });
      pushPresence();
      return res.json({ ok: true, message });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Gönderilemedi" });
    }
  });

  app.post("/xzon/api/typing", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;
    const channelId = String(req.body?.channelId || "");
    if (!channelExists(channelId)) return res.status(404).json({ error: "Kanal yok" });
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
    return res.json({ ok: true, online });
  });

  app.get("/xzon/api/stream", (req, res) => {
    const user = chatUser(req, res);
    if (!user) return;

    const channelId = String(req.query.channel || "genel");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    res.write(`event: hello\ndata: ${JSON.stringify({ userId: user.id, channelId })}\n\n`);
    subscribe(res, { userId: user.id, channelId });
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
