const $ = (id) => document.getElementById(id);
const EMOJIS = ["😀","😂","🥹","😍","🔥","👍","👎","❤️","💜","✨","🎉","💀","😭","😡","🤝","👀","✅","❌","⚡","🎮","💬","📌","🚀","😎"];

const els = {
  boot: $("boot"), app: $("app"), joinForm: $("joinForm"), displayName: $("displayName"),
  joinBtn: $("joinBtn"), bootError: $("bootError"), guildRail: $("guildRail"),
  dmHomeBtn: $("dmHomeBtn"), sidebarHead: $("sidebarHead"), channelNav: $("channelNav"),
  messages: $("messages"), channelTitle: $("channelTitle"), channelTopic: $("channelTopic"),
  titleIcon: $("titleIcon"), messageInput: $("messageInput"), composer: $("composer"),
  sendBtn: $("sendBtn"), membersContent: $("membersContent"), membersPane: $("membersPane"),
  meAvatar: $("meAvatar"), meName: $("meName"), meSub: $("meSub"), typing: $("typing"),
  liveDot: null, voicePanel: $("voicePanel"), voiceName: $("voiceName"),
  replyBar: $("replyBar"), replyLabel: $("replyLabel"), cancelReply: $("cancelReply"),
  statusMenu: $("statusMenu"), emojiPop: $("emojiPop"), profilePop: $("profilePop"),
  pinsDrawer: $("pinsDrawer"), pinsList: $("pinsList"), settingsModal: $("settingsModal"),
  settingsNav: $("settingsNav"), settingsPane: $("settingsPane"), toast: $("toast"),
  mobileBar: $("mobileBar"), searchInput: $("searchInput"),
};

const state = {
  user: null,
  token: localStorage.getItem("xzon_token") || "",
  guilds: [],
  channels: [],
  view: "guild", // guild | dms
  guildId: "xzon",
  channelId: "genel",
  messages: [],
  online: [],
  offline: [],
  dms: [],
  unread: {},
  voice: [],
  stream: null,
  replyTo: null,
  editingId: null,
  lastTypingSent: 0,
  typingUsers: new Map(),
  reconnectTimer: null,
  searchMode: false,
};

const STATUS_LABEL = {
  online: "Çevrimiçi",
  idle: "Boşta",
  dnd: "Rahatsız Etmeyin",
  invisible: "Görünmez",
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

function formatMarkdown(text) {
  let s = escapeHtml(text);
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
  s = s.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  return s.replaceAll("\n", "<br>");
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(ts) {
  return new Date(ts).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers["x-xzon-token"] = state.token;
  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Hata (${res.status})`);
  return data;
}

function channelMeta(id = state.channelId) {
  if (String(id).startsWith("dm:")) {
    const dm = state.dms.find((d) => d.channelId === id);
    return {
      id,
      name: dm?.peer?.name || "DM",
      topic: dm?.peer ? `@${dm.peer.name}` : "Direkt mesaj",
      type: "dm",
    };
  }
  return state.channels.find((c) => c.id === id) || { id, name: id, topic: "", type: "text" };
}

function showApp() {
  els.boot.classList.add("hidden");
  els.app.classList.remove("hidden");
  syncMe();
  if (window.matchMedia("(max-width: 760px)").matches) els.mobileBar.classList.remove("hidden");
}

function syncMe() {
  const u = state.user;
  if (!u) return;
  els.meName.textContent = u.name;
  els.meAvatar.textContent = initials(u.name);
  els.meAvatar.style.background = u.color;
  els.meAvatar.className = `avatar ${u.status || "online"}`;
  els.meSub.textContent = u.customStatus || STATUS_LABEL[u.status || "online"];
  $("micBtn").classList.toggle("off", Boolean(u.muted));
  $("deafBtn").classList.toggle("off", Boolean(u.deafened));
  if (u.voiceChannelId) {
    els.voicePanel.classList.remove("hidden");
    const ch = state.channels.find((c) => c.id === u.voiceChannelId);
    els.voiceName.textContent = ch?.name || u.voiceChannelId;
  } else {
    els.voicePanel.classList.add("hidden");
  }
}

function setLive(on, label) {
  const dot = document.querySelector(".live-dot");
  if (dot) {
    dot.classList.toggle("on", on);
  }
  const small = els.sidebarHead.querySelector("small");
  if (small) small.textContent = label;
}

function renderRail() {
  els.dmHomeBtn.classList.toggle("active", state.view === "dms");
  els.guildRail.innerHTML = state.guilds
    .map(
      (g) => `
      <button class="pill ${state.view === "guild" && state.guildId === g.id ? "active" : ""}"
        data-guild="${g.id}" type="button" title="${escapeHtml(g.name)}"
        style="${state.view === "guild" && state.guildId === g.id ? `background:${g.color}` : ""}">
        ${escapeHtml(g.short)}
      </button>`,
    )
    .join("");
  els.guildRail.querySelectorAll("[data-guild]").forEach((btn) => {
    btn.addEventListener("click", () => openGuild(btn.dataset.guild));
  });
}

function renderSidebar() {
  if (state.view === "dms") {
    els.sidebarHead.innerHTML = `
      <div><strong>Direkt Mesajlar</strong><small>arkadaşların</small></div>
      <span class="live-dot on"></span>`;
    els.channelNav.innerHTML = `
      <div class="cat">
        <div class="cat-label">DİREKT MESAJLAR</div>
        ${
          state.dms.length
            ? state.dms
                .map((d) => {
                  const unread = state.unread[d.channelId];
                  return `
                  <button class="dm-row ${state.channelId === d.channelId ? "active" : ""}" data-dm="${d.channelId}" type="button">
                    <div class="avatar sm ${d.peer?.status || "offline"}" style="background:${d.peer?.color || "#5865f2"}">${initials(d.peer?.name)}</div>
                    <span>${escapeHtml(d.peer?.name || "?")}</span>
                    ${unread ? `<span class="unread">${unread}</span>` : ""}
                  </button>`;
                })
                .join("")
            : `<p style="padding:8px;color:var(--text-3);font-size:13px">Üye listesinden birine tıkla → Mesaj Gönder</p>`
        }
      </div>`;
    els.channelNav.querySelectorAll("[data-dm]").forEach((btn) => {
      btn.addEventListener("click", () => switchChannel(btn.dataset.dm));
    });
    return;
  }

  const guild = state.guilds.find((g) => g.id === state.guildId);
  els.sidebarHead.innerHTML = `
    <div><strong>${escapeHtml(guild?.name || "Sunucu")}</strong><small>bağlanıyor…</small></div>
    <span class="live-dot"></span>`;

  const channels = state.channels.filter((c) => c.guildId === state.guildId);
  const cats = [...new Set(channels.map((c) => c.category))];
  els.channelNav.innerHTML = cats
    .map((cat) => {
      const items = channels.filter((c) => c.category === cat);
      return `
      <div class="cat">
        <button class="cat-label" data-toggle-cat type="button">▼ ${escapeHtml(cat)}</button>
        <div class="cat-items">
          ${items
            .map((ch) => {
              if (ch.type === "voice") {
                const inVoice = state.voice.filter((v) => v.voiceChannelId === ch.id);
                return `
                  <button class="channel ${state.channelId === ch.id ? "active" : ""}" data-channel="${ch.id}" data-type="voice" type="button">
                    <span class="hash">🔊</span><span>${escapeHtml(ch.name)}</span>
                  </button>
                  ${
                    inVoice.length
                      ? `<div class="voice-users">${inVoice
                          .map(
                            (v) => `
                        <div class="voice-user">
                          <div class="avatar av ${v.status}" style="background:${v.color}">${initials(v.name)}</div>
                          <span>${escapeHtml(v.name)}</span>
                          <span class="flags">${v.muted ? "🔇" : ""}${v.deafened ? "🎧" : ""}</span>
                        </div>`,
                          )
                          .join("")}</div>`
                      : ""
                  }`;
              }
              const unread = state.unread[ch.id];
              return `
                <button class="channel ${state.channelId === ch.id ? "active" : ""}" data-channel="${ch.id}" type="button">
                  <span class="hash">#</span><span>${escapeHtml(ch.name)}</span>
                  ${unread ? `<span class="unread">${unread}</span>` : ""}
                </button>`;
            })
            .join("")}
        </div>
      </div>`;
    })
    .join("");

  els.channelNav.querySelectorAll("[data-channel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.type === "voice") joinVoiceChannel(btn.dataset.channel);
      else switchChannel(btn.dataset.channel);
    });
  });
}

function renderMembers() {
  if (state.view === "dms") {
    els.membersContent.innerHTML = `
      <h3>AKTİF ŞİMDİ — ${state.online.length}</h3>
      ${state.online
        .map(
          (u) => `
        <button class="member" data-user="${u.id}" type="button">
          <div class="avatar ${u.status}" style="background:${u.color}">${initials(u.name)}</div>
          <div class="meta">
            <span class="name" style="color:${u.color}">${escapeHtml(u.name)}</span>
            <span class="activity">${escapeHtml(u.customStatus || STATUS_LABEL[u.status] || "")}</span>
          </div>
        </button>`,
        )
        .join("")}`;
  } else {
    els.membersContent.innerHTML = `
      <h3>ÇEVRİMİÇİ — ${state.online.length}</h3>
      ${state.online
        .map(
          (u) => `
        <button class="member" data-user="${u.id}" type="button">
          <div class="avatar ${u.status}" style="background:${u.color}">${initials(u.name)}</div>
          <div class="meta">
            <span class="name" style="color:${u.color}">${escapeHtml(u.name)}</span>
            <span class="activity">${escapeHtml(
              u.voiceChannelId
                ? `🔊 ${state.channels.find((c) => c.id === u.voiceChannelId)?.name || "Ses"}`
                : u.customStatus || STATUS_LABEL[u.status] || "",
            )}</span>
          </div>
        </button>`,
        )
        .join("")}
      <h3>ÇEVRİMDIŞI — ${state.offline.length}</h3>
      ${state.offline
        .map(
          (u) => `
        <button class="member offline" data-user="${u.id}" type="button">
          <div class="avatar offline" style="background:${u.color}">${initials(u.name)}</div>
          <div class="meta"><span class="name">${escapeHtml(u.name)}</span></div>
        </button>`,
        )
        .join("")}`;
  }

  els.membersContent.querySelectorAll("[data-user]").forEach((btn) => {
    btn.addEventListener("click", (e) => openProfile(btn.dataset.user, e));
  });
}

function renderMessages() {
  const ch = channelMeta();
  els.channelTitle.textContent = ch.name;
  els.channelTopic.textContent = ch.topic || "";
  els.titleIcon.textContent = ch.type === "dm" ? "@" : ch.type === "voice" ? "🔊" : "#";
  els.messageInput.placeholder =
    ch.type === "dm" ? `@${ch.name} kullanıcısına mesaj gönder` : `#${ch.name} kanalına mesaj gönder`;

  const nearBottom =
    els.messages.scrollHeight - els.messages.scrollTop - els.messages.clientHeight < 140;

  let html = `
    <div class="welcome">
      <div class="orb">${ch.type === "dm" ? "@" : ch.type === "voice" ? "🔊" : "#"}</div>
      <h2>${ch.type === "dm" ? ch.name : `#${ch.name}`}</h2>
      <p>${escapeHtml(ch.topic || "Canlı kanal. Markdown: **kalın** *italik* \`kod\` ||spoiler||")}</p>
    </div>`;

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
      !msg.replyTo &&
      msg.createdAt - prev.createdAt < 5 * 60 * 1000;
    html += messageHtml(msg, compact);
    prev = msg;
  }
  els.messages.innerHTML = html;
  bindMessageEvents();
  if (nearBottom || state.messages.length < 15) {
    els.messages.scrollTop = els.messages.scrollHeight;
  }
}

function messageHtml(msg, compact) {
  const mine = state.user && msg.userId === state.user.id;
  return `
    <article class="msg ${compact ? "compact" : ""} ${msg.deleted ? "deleted" : ""}" data-id="${msg.id}">
      <div class="msg-av" data-user="${msg.userId}" style="background:${escapeHtml(msg.userColor)}">${initials(msg.userName)}</div>
      <div>
        ${
          msg.replyTo
            ? `<div class="reply-ref"><strong style="color:${escapeHtml(msg.replyTo.userColor)}">${escapeHtml(msg.replyTo.userName)}</strong> ${escapeHtml(msg.replyTo.content)}</div>`
            : ""
        }
        ${
          compact
            ? ""
            : `<div class="msg-head">
                <span class="msg-name" data-user="${msg.userId}" style="color:${escapeHtml(msg.userColor)}">${escapeHtml(msg.userName)}</span>
                <time class="msg-time">${fmtTime(msg.createdAt)}</time>
                ${msg.editedAt ? `<span class="edited">(düzenlendi)</span>` : ""}
                ${msg.pinned ? `<span class="pin-badge">📌 sabitli</span>` : ""}
              </div>`
        }
        <div class="msg-text">${msg.deleted ? escapeHtml(msg.content) : formatMarkdown(msg.content)}</div>
        ${
          msg.reactions?.length
            ? `<div class="reactions">${msg.reactions
                .map(
                  (r) =>
                    `<button class="reaction ${r.mine ? "mine" : ""}" data-react="${msg.id}" data-emoji="${r.emoji}" type="button">${r.emoji} ${r.count}</button>`,
                )
                .join("")}</div>`
            : ""
        }
      </div>
      ${
        msg.deleted
          ? ""
          : `<div class="msg-actions">
              <button type="button" data-act="react" data-id="${msg.id}" title="Tepki">😊</button>
              <button type="button" data-act="reply" data-id="${msg.id}" title="Yanıtla">↩</button>
              ${mine ? `<button type="button" data-act="edit" data-id="${msg.id}" title="Düzenle">✎</button>` : ""}
              <button type="button" data-act="pin" data-id="${msg.id}" title="Sabitle">📌</button>
              ${mine ? `<button type="button" data-act="delete" data-id="${msg.id}" title="Sil">🗑</button>` : ""}
            </div>`
      }
    </article>`;
}

function bindMessageEvents() {
  els.messages.querySelectorAll(".spoiler").forEach((el) => {
    el.addEventListener("click", () => el.classList.add("revealed"));
  });
  els.messages.querySelectorAll("[data-user]").forEach((el) => {
    el.addEventListener("click", (e) => openProfile(el.dataset.user, e));
  });
  els.messages.querySelectorAll("[data-react]").forEach((btn) => {
    btn.addEventListener("click", () => react(btn.dataset.react, btn.dataset.emoji));
  });
  els.messages.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      if (act === "react") showEmojiPop(btn, (emoji) => react(id, emoji));
      if (act === "reply") startReply(id);
      if (act === "edit") startEdit(id);
      if (act === "pin") pin(id);
      if (act === "delete") removeMessage(id);
    });
  });
}

function upsertMessage(message) {
  if (message.channelId !== state.channelId) {
    state.unread[message.channelId] = (state.unread[message.channelId] || 0) + 1;
    renderSidebar();
    return;
  }
  const idx = state.messages.findIndex((m) => m.id === message.id);
  if (idx >= 0) state.messages[idx] = message;
  else state.messages.push(message);
  state.messages.sort((a, b) => a.createdAt - b.createdAt);
  renderMessages();
}

async function loadMessages() {
  const data = await api(`/xzon/api/messages?channel=${encodeURIComponent(state.channelId)}&limit=100`);
  state.messages = data.messages || [];
  state.unread = data.unread || state.unread;
  state.searchMode = false;
  renderMessages();
  renderSidebar();
}

async function switchChannel(channelId) {
  state.channelId = channelId;
  state.replyTo = null;
  state.editingId = null;
  els.replyBar.classList.add("hidden");
  state.typingUsers.clear();
  renderTyping();
  renderRail();
  renderSidebar();
  await loadMessages();
  openStream();
  els.messageInput.focus();
}

async function openGuild(guildId) {
  state.view = "guild";
  state.guildId = guildId;
  const first =
    state.channels.find((c) => c.guildId === guildId && c.type === "text")?.id || "genel";
  renderRail();
  await switchChannel(first);
}

async function openDms() {
  state.view = "dms";
  const data = await api("/xzon/api/dms");
  state.dms = data.dms || [];
  renderRail();
  renderSidebar();
  renderMembers();
  if (state.dms[0]) await switchChannel(state.dms[0].channelId);
  else {
    state.messages = [];
    els.channelTitle.textContent = "Arkadaşlar";
    els.titleIcon.textContent = "👥";
    els.channelTopic.textContent = "Birine DM açmak için üye listesini kullan";
    els.messages.innerHTML = `<div class="welcome"><div class="orb">💬</div><h2>Direkt Mesajlar</h2><p>Sağdaki üyelerden birine tıkla ve Mesaj Gönder.</p></div>`;
  }
}

async function joinVoiceChannel(channelId) {
  const data = await api("/xzon/api/voice/join", { method: "POST", body: { channelId } });
  state.user = data.user;
  state.voice = data.voice || [];
  syncMe();
  renderSidebar();
  renderMembers();
  await switchChannel(channelId);
  toast("Ses kanalına bağlandın");
}

async function leaveVoice() {
  const data = await api("/xzon/api/voice/leave", { method: "POST", body: {} });
  state.user = data.user;
  state.voice = data.voice || [];
  syncMe();
  renderSidebar();
  renderMembers();
}

function startReply(id) {
  const msg = state.messages.find((m) => m.id === id);
  if (!msg) return;
  state.replyTo = msg;
  state.editingId = null;
  els.replyBar.classList.remove("hidden");
  els.replyLabel.textContent = `${msg.userName} yanıtlanıyor: ${msg.content.slice(0, 60)}`;
  els.messageInput.focus();
}

function startEdit(id) {
  const msg = state.messages.find((m) => m.id === id);
  if (!msg || msg.deleted) return;
  state.editingId = id;
  state.replyTo = null;
  els.replyBar.classList.remove("hidden");
  els.replyLabel.textContent = "Mesaj düzenleniyor…";
  els.messageInput.value = msg.content;
  els.messageInput.focus();
}

async function react(id, emoji) {
  const data = await api(`/xzon/api/messages/${id}/react`, { method: "POST", body: { emoji } });
  upsertMessage(data.message);
}

async function pin(id) {
  const data = await api(`/xzon/api/messages/${id}/pin`, { method: "POST", body: {} });
  upsertMessage(data.message);
  toast(data.message.pinned ? "Mesaj sabitlendi" : "Sabit kaldırıldı");
}

async function removeMessage(id) {
  if (!confirm("Mesaj silinsin mi?")) return;
  const data = await api(`/xzon/api/messages/${id}`, { method: "DELETE" });
  upsertMessage(data.message);
}

async function sendMessage() {
  const content = els.messageInput.value.trim();
  if (!content) return;
  els.sendBtn.disabled = true;
  try {
    if (state.editingId) {
      const data = await api(`/xzon/api/messages/${state.editingId}`, {
        method: "PATCH",
        body: { content },
      });
      upsertMessage(data.message);
      state.editingId = null;
    } else {
      const data = await api("/xzon/api/messages", {
        method: "POST",
        body: {
          channelId: state.channelId,
          content,
          replyToId: state.replyTo?.id || null,
        },
      });
      upsertMessage(data.message);
      state.replyTo = null;
    }
    els.replyBar.classList.add("hidden");
    els.messageInput.value = "";
  } catch (error) {
    toast(error.message);
  } finally {
    els.sendBtn.disabled = false;
    els.messageInput.focus();
  }
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
    names.length === 1 ? `${names[0]} yazıyor…` : `${names.slice(0, 3).join(", ")} yazıyor…`;
}

function closeStream() {
  if (state.stream) {
    state.stream.close();
    state.stream = null;
  }
  clearTimeout(state.reconnectTimer);
}

function openStream() {
  closeStream();
  if (!state.token && !document.cookie.includes("xzon_token")) return;
  const qs = new URLSearchParams({ channel: state.channelId });
  if (state.token) qs.set("token", state.token);
  const es = new EventSource(`/xzon/api/stream?${qs}`, { withCredentials: true });
  state.stream = es;
  setLive(false, "bağlanıyor…");

  es.addEventListener("hello", () => setLive(true, "canlı · " + (state.online.length || 0) + " online"));
  es.addEventListener("message", (ev) => {
    try {
      upsertMessage(JSON.parse(ev.data).message);
    } catch { /* ignore */ }
  });
  es.addEventListener("message_update", (ev) => {
    try {
      upsertMessage(JSON.parse(ev.data).message);
    } catch { /* ignore */ }
  });
  es.addEventListener("presence", (ev) => {
    try {
      const p = JSON.parse(ev.data);
      state.online = p.users || [];
      state.voice = p.voice || state.voice;
      renderMembers();
      renderSidebar();
      setLive(true, `canlı · ${state.online.length} online`);
    } catch { /* ignore */ }
  });
  es.addEventListener("voice", (ev) => {
    try {
      state.voice = JSON.parse(ev.data).voice || [];
      renderSidebar();
      renderMembers();
      syncMe();
    } catch { /* ignore */ }
  });
  es.addEventListener("typing", (ev) => {
    try {
      const p = JSON.parse(ev.data);
      if (p.channelId !== state.channelId || p.user?.id === state.user?.id) return;
      state.typingUsers.set(p.user.id, p.user.name);
      renderTyping();
      clearTimeout(state.typingUsers.get(`t:${p.user.id}`));
      const t = setTimeout(() => {
        state.typingUsers.delete(p.user.id);
        renderTyping();
      }, 2500);
      state.typingUsers.set(`t:${p.user.id}`, t);
    } catch { /* ignore */ }
  });
  es.onerror = () => {
    setLive(false, "yeniden bağlanıyor…");
    es.close();
    state.stream = null;
    state.reconnectTimer = setTimeout(() => {
      openStream();
      loadMessages().catch(() => {});
    }, 1600);
  };
}

async function openProfile(userId, event) {
  try {
    const data = await api(`/xzon/api/users/${userId}`);
    const u = data.user;
    const pop = els.profilePop;
    pop.innerHTML = `
      <div class="profile-banner" style="background:linear-gradient(135deg,${u.color},#1e1f22)"></div>
      <div class="avatar ${u.status}" style="background:${u.color}">${initials(u.name)}</div>
      <div class="profile-body">
        <h2>${escapeHtml(u.name)}</h2>
        <p>${escapeHtml(u.name)}#${escapeHtml(u.tag || "0000")}</p>
        <div class="profile-section"><h4>HAKKINDA</h4><p>${escapeHtml(u.bio || "—")}</p></div>
        <div class="profile-section"><h4>DURUM</h4><p>${escapeHtml(u.customStatus || STATUS_LABEL[u.status] || "—")}</p></div>
        <div class="profile-actions">
          ${
            u.id !== state.user.id
              ? `<button type="button" id="dmFromProfile">Mesaj Gönder</button>`
              : `<button type="button" class="ghost" id="editFromProfile">Profili Düzenle</button>`
          }
        </div>
      </div>`;
    const x = Math.min(window.innerWidth - 320, (event?.clientX || 200) + 8);
    const y = Math.min(window.innerHeight - 380, (event?.clientY || 100) - 20);
    pop.style.left = `${Math.max(8, x)}px`;
    pop.style.top = `${Math.max(8, y)}px`;
    pop.classList.remove("hidden");
    $("dmFromProfile")?.addEventListener("click", async () => {
      const dm = await api("/xzon/api/dms", { method: "POST", body: { userId: u.id } });
      state.view = "dms";
      const list = await api("/xzon/api/dms");
      state.dms = list.dms || [];
      pop.classList.add("hidden");
      await switchChannel(dm.channelId);
      renderRail();
    });
    $("editFromProfile")?.addEventListener("click", () => {
      pop.classList.add("hidden");
      openSettings("profile");
    });
  } catch (error) {
    toast(error.message);
  }
}

function showEmojiPop(anchor, onPick) {
  const pop = els.emojiPop;
  pop.innerHTML = EMOJIS.map((e) => `<button type="button" data-e="${e}">${e}</button>`).join("");
  const rect = anchor.getBoundingClientRect();
  pop.style.left = `${Math.min(window.innerWidth - 340, rect.left)}px`;
  pop.style.top = `${Math.max(8, rect.top - 180)}px`;
  pop.classList.remove("hidden");
  pop.querySelectorAll("[data-e]").forEach((btn) => {
    btn.addEventListener("click", () => {
      pop.classList.add("hidden");
      onPick(btn.dataset.e);
    });
  });
}

function openSettings(tab = "account") {
  const tabs = [
    ["account", "Hesabım"],
    ["profile", "Profiller"],
    ["status", "Durum"],
    ["voice", "Ses & Video"],
    ["appearance", "Görünüm"],
    ["logout", "Çıkış Yap"],
  ];
  els.settingsNav.innerHTML = `<h3>Kullanıcı Ayarları</h3>${tabs
    .map(
      ([id, label]) =>
        `<button type="button" data-tab="${id}" class="${id === tab ? "active" : ""} ${id === "logout" ? "danger" : ""}">${label}</button>`,
    )
    .join("")}`;
  els.settingsNav.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => openSettings(btn.dataset.tab));
  });

  const u = state.user;
  const panes = {
    account: `
      <h2>Hesabım</h2>
      <label>Kullanıcı adı<input id="setName" value="${escapeHtml(u.name)}" /></label>
      <label>Etiket<input value="${escapeHtml(u.name)}#${escapeHtml(u.tag || "0000")}" disabled /></label>
      <button class="save" id="saveAccount" type="button">Kaydet</button>`,
    profile: `
      <h2>Profiller</h2>
      <label>Hakkında<textarea id="setBio">${escapeHtml(u.bio || "")}</textarea></label>
      <label>Özel durum<input id="setCustom" value="${escapeHtml(u.customStatus || "")}" maxlength="80" /></label>
      <button class="save" id="saveProfile" type="button">Kaydet</button>`,
    status: `
      <h2>Durum</h2>
      <label>Görünürlük
        <select id="setStatus">
          ${["online", "idle", "dnd", "invisible"]
            .map((s) => `<option value="${s}" ${u.status === s ? "selected" : ""}>${STATUS_LABEL[s]}</option>`)
            .join("")}
        </select>
      </label>
      <button class="save" id="saveStatus" type="button">Kaydet</button>`,
    voice: `
      <h2>Ses & Video</h2>
      <p style="color:var(--text-2)">Ses odalarına katılınca alt panelde bağlantı görünür. Mikrofon / kulaklık bayrakları senkronlanır.</p>
      <label>Giriş<select><option>Varsayılan Mikrofon</option></select></label>
      <label>Çıkış<select><option>Varsayılan Hoparlör</option></select></label>`,
    appearance: `
      <h2>Görünüm</h2>
      <p style="color:var(--text-2)">Koyu Discord teması aktif. Mesajlarda markdown desteklenir.</p>
      <label>Mesaj yoğunluğu<select><option>Rahat</option><option>Kompakt</option></select></label>`,
    logout: `
      <h2>Çıkış Yap</h2>
      <p style="color:var(--text-2)">Oturumu kapatmak istediğine emin misin?</p>
      <button class="save" id="confirmLogout" type="button" style="background:var(--red)">Çıkış Yap</button>`,
  };
  els.settingsPane.innerHTML = panes[tab] || panes.account;
  els.settingsModal.classList.remove("hidden");

  $("saveAccount")?.addEventListener("click", async () => {
    state.user = (await api("/xzon/api/me", { method: "PATCH", body: { name: $("setName").value } })).user;
    syncMe();
    toast("Kaydedildi");
  });
  $("saveProfile")?.addEventListener("click", async () => {
    state.user = (
      await api("/xzon/api/me", {
        method: "PATCH",
        body: { bio: $("setBio").value, customStatus: $("setCustom").value },
      })
    ).user;
    syncMe();
    toast("Profil güncellendi");
  });
  $("saveStatus")?.addEventListener("click", async () => {
    state.user = (await api("/xzon/api/me", { method: "PATCH", body: { status: $("setStatus").value } })).user;
    syncMe();
    toast("Durum güncellendi");
  });
  $("confirmLogout")?.addEventListener("click", logout);
}

async function logout() {
  closeStream();
  try {
    await api("/xzon/api/logout", { method: "POST", body: {} });
  } catch { /* ignore */ }
  state.token = "";
  localStorage.removeItem("xzon_token");
  els.settingsModal.classList.add("hidden");
  els.app.classList.add("hidden");
  els.boot.classList.remove("hidden");
  els.mobileBar.classList.add("hidden");
}

async function bootstrap() {
  const data = await api("/xzon/api/bootstrap");
  state.user = data.user;
  state.guilds = data.guilds || [];
  state.channels = data.channels || [];
  state.online = data.online || [];
  state.offline = data.offline || [];
  state.dms = data.dms || [];
  state.unread = data.unread || {};
  state.voice = data.voice || [];
  showApp();
  renderRail();
  renderSidebar();
  renderMembers();
  await loadMessages();
  openStream();
  startPresence();
}

let presenceTimer;
function startPresence() {
  clearInterval(presenceTimer);
  presenceTimer = setInterval(async () => {
    try {
      const data = await api("/xzon/api/presence", { method: "POST", body: {} });
      state.online = data.online || state.online;
      state.offline = data.offline || state.offline;
      state.unread = data.unread || state.unread;
      state.voice = data.voice || state.voice;
      renderMembers();
      renderSidebar();
    } catch { /* ignore */ }
  }, 20000);
}

/* events */
els.joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.joinBtn.disabled = true;
  els.bootError.classList.add("hidden");
  try {
    const data = await api("/xzon/api/session", {
      method: "POST",
      body: { name: els.displayName.value },
    });
    state.token = data.token;
    localStorage.setItem("xzon_token", data.token);
    await bootstrap();
    toast("XZON'a hoş geldin");
  } catch (error) {
    els.bootError.textContent = error.message;
    els.bootError.classList.remove("hidden");
  } finally {
    els.joinBtn.disabled = false;
  }
});

els.composer.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

els.messageInput.addEventListener("input", () => {
  const now = Date.now();
  if (now - state.lastTypingSent < 1500) return;
  state.lastTypingSent = now;
  api("/xzon/api/typing", { method: "POST", body: { channelId: state.channelId } }).catch(() => {});
});

els.cancelReply.addEventListener("click", () => {
  state.replyTo = null;
  state.editingId = null;
  els.replyBar.classList.add("hidden");
  els.messageInput.value = "";
});

els.dmHomeBtn.addEventListener("click", () => openDms());
$("leaveVoiceBtn").addEventListener("click", () => leaveVoice());
$("settingsBtn").addEventListener("click", () => openSettings("account"));
$("closeSettings").addEventListener("click", () => els.settingsModal.classList.add("hidden"));
$("membersBtn").addEventListener("click", () => els.membersPane.classList.toggle("open"));
$("emojiBtn").addEventListener("click", (e) => {
  showEmojiPop(e.currentTarget, (emoji) => {
    els.messageInput.value += emoji;
    els.messageInput.focus();
  });
});
$("gifBtn").addEventListener("click", () => toast("GIF seçici yakında — şimdilik link yapıştır"));

$("micBtn").addEventListener("click", async () => {
  const muted = !state.user.muted;
  state.user = (await api("/xzon/api/voice/flags", { method: "POST", body: { muted } })).user;
  syncMe();
});
$("deafBtn").addEventListener("click", async () => {
  const deafened = !state.user.deafened;
  state.user = (await api("/xzon/api/voice/flags", { method: "POST", body: { deafened, muted: deafened || state.user.muted } })).user;
  syncMe();
});

$("statusBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = els.statusMenu;
  menu.innerHTML = ["online", "idle", "dnd", "invisible"]
    .map((s) => `<button type="button" data-s="${s}">${STATUS_LABEL[s]}</button>`)
    .join("");
  const rect = e.currentTarget.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  menu.style.top = "auto";
  menu.classList.toggle("hidden");
  menu.querySelectorAll("[data-s]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.user = (await api("/xzon/api/me", { method: "PATCH", body: { status: btn.dataset.s } })).user;
      syncMe();
      menu.classList.add("hidden");
    });
  });
});

$("pinsBtn").addEventListener("click", async () => {
  const data = await api(`/xzon/api/pins?channel=${encodeURIComponent(state.channelId)}`);
  els.pinsList.innerHTML = data.messages?.length
    ? data.messages
        .map(
          (m) => `
      <div class="pin-item"><strong>${escapeHtml(m.userName)}</strong> · ${fmtTime(m.createdAt)}<br>${escapeHtml(m.content)}</div>`,
        )
        .join("")
    : `<p style="padding:12px;color:var(--text-3)">Sabitlenmiş mesaj yok</p>`;
  els.pinsDrawer.classList.toggle("hidden");
});
$("closePins").addEventListener("click", () => els.pinsDrawer.classList.add("hidden"));

let searchTimer;
els.searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = els.searchInput.value.trim();
    if (!q) {
      await loadMessages();
      return;
    }
    const data = await api(
      `/xzon/api/search?channel=${encodeURIComponent(state.channelId)}&q=${encodeURIComponent(q)}`,
    );
    state.messages = data.messages || [];
    state.searchMode = true;
    renderMessages();
  }, 250);
});

els.mobileBar.querySelectorAll("[data-m]").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.mobileBar.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    els.app.classList.remove("show-rail", "show-channels", "show-members");
    if (btn.dataset.m === "rail") els.app.classList.add("show-rail");
    if (btn.dataset.m === "channels") els.app.classList.add("show-channels");
    if (btn.dataset.m === "members") els.app.classList.add("show-members");
  });
});

document.addEventListener("click", (e) => {
  if (!els.statusMenu.contains(e.target) && e.target !== $("statusBtn")) {
    els.statusMenu.classList.add("hidden");
  }
  if (!els.emojiPop.contains(e.target) && e.target !== $("emojiBtn") && !e.target.closest?.("[data-act=react]")) {
    els.emojiPop.classList.add("hidden");
  }
  if (!els.profilePop.contains(e.target) && !e.target.closest?.("[data-user]")) {
    els.profilePop.classList.add("hidden");
  }
});

(async () => {
  try {
    if (state.token || document.cookie.includes("xzon_token")) {
      await bootstrap();
    }
  } catch {
    state.token = "";
    localStorage.removeItem("xzon_token");
  }
})();
