const $ = (id) => document.getElementById(id);

const els = {
  boot: $("boot"),
  app: $("app"),
  joinForm: $("joinForm"),
  displayName: $("displayName"),
  joinBtn: $("joinBtn"),
  bootError: $("bootError"),
  channelNav: $("channelNav"),
  messages: $("messages"),
  channelTitle: $("channelTitle"),
  channelTopic: $("channelTopic"),
  messageInput: $("messageInput"),
  composer: $("composer"),
  sendBtn: $("sendBtn"),
  onlineList: $("onlineList"),
  onlineCount: $("onlineCount"),
  onlineBadge: $("onlineBadge"),
  meAvatar: $("meAvatar"),
  meName: $("meName"),
  typing: $("typing"),
  connLabel: $("connLabel"),
  liveDot: $("liveDot"),
  logoutBtn: $("logoutBtn"),
  toast: $("toast"),
};

const state = {
  user: null,
  token: localStorage.getItem("xzon_token") || "",
  channels: [],
  channelId: "genel",
  messages: [],
  online: [],
  stream: null,
  lastTypingSent: 0,
  typingUsers: new Map(),
  reconnectTimer: null,
};

function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.add("hidden"), 2200);
}

function initials(name) {
  return String(name || "?").slice(0, 1).toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\n/g, "<br>");
}

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function fmtDay(ts) {
  return new Date(ts).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (state.token) headers["x-xzon-token"] = state.token;

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Hata (${res.status})`);
  return data;
}

function setConnected(on, label) {
  els.liveDot.classList.toggle("on", on);
  els.connLabel.textContent = label;
}

function showApp() {
  els.boot.classList.add("hidden");
  els.app.classList.remove("hidden");
  els.app.setAttribute("aria-hidden", "false");
  els.meName.textContent = state.user.name;
  els.meAvatar.textContent = initials(state.user.name);
  els.meAvatar.style.background = state.user.color;
  els.messageInput.focus();
}

function showBoot(errorText = "") {
  els.app.classList.add("hidden");
  els.boot.classList.remove("hidden");
  els.app.setAttribute("aria-hidden", "true");
  if (errorText) {
    els.bootError.textContent = errorText;
    els.bootError.classList.remove("hidden");
  } else {
    els.bootError.classList.add("hidden");
  }
}

function renderChannels() {
  const groups = new Map();
  for (const ch of state.channels) {
    if (!groups.has(ch.category)) groups.set(ch.category, []);
    groups.get(ch.category).push(ch);
  }

  els.channelNav.innerHTML = [...groups.entries()]
    .map(
      ([cat, items]) => `
      <div class="cat">
        <div class="cat-label">${escapeHtml(cat)}</div>
        ${items
          .map(
            (ch) => `
          <button class="channel ${ch.id === state.channelId ? "active" : ""}" data-channel="${ch.id}" type="button">
            <span class="hash">#</span>
            <span>${escapeHtml(ch.name)}</span>
          </button>`,
          )
          .join("")}
      </div>`,
    )
    .join("");

  els.channelNav.querySelectorAll("[data-channel]").forEach((btn) => {
    btn.addEventListener("click", () => switchChannel(btn.dataset.channel));
  });
}

function currentChannel() {
  return state.channels.find((c) => c.id === state.channelId) || { name: state.channelId, topic: "" };
}

function renderMembers() {
  els.onlineCount.textContent = String(state.online.length);
  els.onlineBadge.textContent = `${state.online.length} online`;
  els.onlineList.innerHTML = state.online
    .map(
      (u) => `
      <div class="member">
        <div class="avatar" style="background:${escapeHtml(u.color)}">${initials(u.name)}</div>
        <span class="name" style="color:${escapeHtml(u.color)}">${escapeHtml(u.name)}</span>
      </div>`,
    )
    .join("");
}

function renderMessages() {
  const ch = currentChannel();
  els.channelTitle.textContent = ch.name;
  els.channelTopic.textContent = ch.topic || "";
  els.messageInput.placeholder = `#${ch.name} kanalına mesaj gönder`;

  const nearBottom =
    els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight < 120;

  let html = `
    <div class="welcome">
      <div class="orb">#</div>
      <h2>#${escapeHtml(ch.name)}</h2>
      <p>${escapeHtml(ch.topic || "Canlı kanal. Mesajın herkese anında düşer.")}</p>
    </div>
  `;

  let lastDay = "";
  let prev = null;

  for (const msg of state.messages) {
    const day = fmtDay(msg.createdAt);
    if (day !== lastDay) {
      html += `<div class="day-sep">${escapeHtml(day)}</div>`;
      lastDay = day;
    }

    const compact =
      prev &&
      prev.userId === msg.userId &&
      msg.createdAt - prev.createdAt < 5 * 60 * 1000;

    const mine = state.user && msg.userId === state.user.id;
    const system = msg.userId === "system" || msg.userName === "Lexyxzon";

    html += `
      <article class="msg ${compact ? "compact" : ""} ${mine ? "mine" : ""} ${system ? "system" : ""}" data-id="${msg.id}">
        <div class="msg-av" style="background:${escapeHtml(msg.userColor)}">${initials(msg.userName)}</div>
        <div>
          ${
            compact
              ? ""
              : `<div class="msg-head">
                  <span class="msg-name" style="color:${escapeHtml(msg.userColor)}">${escapeHtml(msg.userName)}</span>
                  <time class="msg-time">${fmtTime(msg.createdAt)}</time>
                </div>`
          }
          <div class="msg-text">${linkify(msg.content)}</div>
        </div>
      </article>`;
    prev = msg;
  }

  els.messages.innerHTML = html;
  if (nearBottom || state.messages.length < 12) {
    els.messages.scrollTop = els.messages.scrollHeight;
  }
}

function upsertMessage(message) {
  if (message.channelId !== state.channelId) return;
  if (state.messages.some((m) => m.id === message.id)) return;
  state.messages.push(message);
  state.messages.sort((a, b) => a.createdAt - b.createdAt);
  renderMessages();
}

function renderTyping() {
  const names = [...state.typingUsers.values()].filter((n) => n !== state.user?.name);
  if (!names.length) {
    els.typing.classList.add("hidden");
    els.typing.textContent = "";
    return;
  }
  els.typing.classList.remove("hidden");
  els.typing.textContent =
    names.length === 1 ? `${names[0]} yazıyor…` : `${names.slice(0, 2).join(", ")} yazıyor…`;
}

async function loadMessages() {
  const data = await api(`/xzon/api/messages?channel=${encodeURIComponent(state.channelId)}&limit=100`);
  state.messages = data.messages || [];
  renderMessages();
}

function closeStream() {
  if (state.stream) {
    state.stream.close();
    state.stream = null;
  }
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
}

function openStream() {
  closeStream();
  if (!state.token) return;

  const qs = new URLSearchParams({
    channel: state.channelId,
  });
  if (state.token) qs.set("token", state.token);
  const es = new EventSource(`/xzon/api/stream?${qs}`, { withCredentials: true });
  state.stream = es;
  setConnected(false, "bağlanıyor…");

  es.addEventListener("hello", () => {
    setConnected(true, "canlı");
  });

  es.addEventListener("message", (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      if (payload.message) upsertMessage(payload.message);
    } catch {
      /* ignore */
    }
  });

  es.addEventListener("presence", (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      state.online = payload.users || [];
      renderMembers();
    } catch {
      /* ignore */
    }
  });

  es.addEventListener("typing", (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      if (payload.channelId !== state.channelId) return;
      if (!payload.user?.id || payload.user.id === state.user?.id) return;
      state.typingUsers.set(payload.user.id, payload.user.name);
      renderTyping();
      clearTimeout(state.typingUsers.get(`t:${payload.user.id}`));
      const timer = setTimeout(() => {
        state.typingUsers.delete(payload.user.id);
        renderTyping();
      }, 2500);
      state.typingUsers.set(`t:${payload.user.id}`, timer);
    } catch {
      /* ignore */
    }
  });

  es.onerror = () => {
    setConnected(false, "yeniden bağlanıyor…");
    es.close();
    state.stream = null;
    state.reconnectTimer = setTimeout(() => {
      openStream();
      loadMessages().catch(() => {});
    }, 1800);
  };
}

async function switchChannel(channelId) {
  if (channelId === state.channelId && state.messages.length) return;
  state.channelId = channelId;
  state.typingUsers.clear();
  renderTyping();
  renderChannels();
  await loadMessages();
  openStream();
}

async function sendMessage(text) {
  const content = text.trim();
  if (!content) return;
  els.sendBtn.disabled = true;
  try {
    const data = await api("/xzon/api/messages", {
      method: "POST",
      body: { channelId: state.channelId, content },
    });
    upsertMessage(data.message);
    els.messageInput.value = "";
  } catch (error) {
    toast(error.message || "Gönderilemedi");
  } finally {
    els.sendBtn.disabled = false;
    els.messageInput.focus();
  }
}

async function bootstrapSession() {
  try {
    const me = await api("/xzon/api/me");
    state.user = me.user;
    state.online = me.online || [];
    const ch = await api("/xzon/api/channels");
    state.channels = ch.channels || [];
    showApp();
    renderChannels();
    renderMembers();
    await loadMessages();
    openStream();
    startPresencePulse();
    return true;
  } catch {
    state.token = "";
    localStorage.removeItem("xzon_token");
    return false;
  }
}

let presenceTimer = null;
function startPresencePulse() {
  clearInterval(presenceTimer);
  presenceTimer = setInterval(() => {
    api("/xzon/api/presence", { method: "POST", body: {} }).catch(() => {});
  }, 20_000);
}

els.joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.bootError.classList.add("hidden");
  els.joinBtn.disabled = true;
  try {
    const data = await api("/xzon/api/session", {
      method: "POST",
      body: { name: els.displayName.value },
    });
    state.token = data.token;
    localStorage.setItem("xzon_token", data.token);
    state.user = data.user;
    const ch = await api("/xzon/api/channels");
    state.channels = ch.channels || [];
    showApp();
    renderChannels();
    await loadMessages();
    openStream();
    startPresencePulse();
    toast("Sohbete katıldın");
  } catch (error) {
    els.bootError.textContent = error.message || "Giriş başarısız";
    els.bootError.classList.remove("hidden");
  } finally {
    els.joinBtn.disabled = false;
  }
});

els.composer.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(els.messageInput.value);
});

els.messageInput.addEventListener("input", () => {
  const now = Date.now();
  if (now - state.lastTypingSent < 1600) return;
  state.lastTypingSent = now;
  api("/xzon/api/typing", {
    method: "POST",
    body: { channelId: state.channelId },
  }).catch(() => {});
});

els.logoutBtn.addEventListener("click", async () => {
  closeStream();
  clearInterval(presenceTimer);
  try {
    await api("/xzon/api/logout", { method: "POST", body: {} });
  } catch {
    /* ignore */
  }
  state.token = "";
  localStorage.removeItem("xzon_token");
  showBoot();
});

// EventSource with credentials uses cookies; also restore token header path via localStorage for API.
(async () => {
  if (state.token) {
    const ok = await bootstrapSession();
    if (!ok) showBoot();
  } else {
    // cookie-only returning user?
    try {
      const me = await fetch("/xzon/api/me", { credentials: "same-origin" });
      if (me.ok) {
        const data = await me.json();
        state.user = data.user;
        state.online = data.online || [];
        const ch = await api("/xzon/api/channels");
        state.channels = ch.channels || [];
        showApp();
        renderChannels();
        renderMembers();
        await loadMessages();
        openStream();
        startPresencePulse();
        return;
      }
    } catch {
      /* fall through */
    }
    showBoot();
  }
})();
