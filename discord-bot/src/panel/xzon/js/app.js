const $ = (id) => document.getElementById(id);
const EMOJIS = ["😀","😂","🥹","😍","🔥","👍","👎","❤️","💜","✨","🎉","💀","😭","😡","🤝","👀","✅","⚡","🎮","💬","📌","🚀","😎","🙌"];
const STATUS = { online: "Çevrimiçi", idle: "Boşta", dnd: "Rahatsız Etmeyin", invisible: "Görünmez" };

const els = {
  boot: $("boot"),
  app: $("app"),
  joinForm: $("joinForm"),
  displayName: $("displayName"),
  joinBtn: $("joinBtn"),
  bootError: $("bootError"),
  netBanner: $("netBanner"),
  guildRail: $("guildRail"),
  dmHomeBtn: $("dmHomeBtn"),
  sidebarHead: $("sidebarHead"),
  channelNav: $("channelNav"),
  messages: $("messages"),
  channelTitle: $("channelTitle"),
  channelTopic: $("channelTopic"),
  titleIcon: $("titleIcon"),
  messageInput: $("messageInput"),
  composer: $("composer"),
  sendBtn: $("sendBtn"),
  membersContent: $("membersContent"),
  membersPane: $("membersPane"),
  meAvatar: $("meAvatar"),
  meName: $("meName"),
  meSub: $("meSub"),
  typing: $("typing"),
  voicePanel: $("voicePanel"),
  voiceName: $("voiceName"),
  replyBar: $("replyBar"),
  replyTitle: $("replyTitle"),
  replyPreview: $("replyPreview"),
  jumpBtn: $("jumpBtn"),
  chat: document.querySelector(".chat"),
  statusMenu: $("statusMenu"),
  emojiPop: $("emojiPop"),
  profilePop: $("profilePop"),
  pinsDrawer: $("pinsDrawer"),
  pinsList: $("pinsList"),
  settingsModal: $("settingsModal"),
  settingsNav: $("settingsNav"),
  settingsPane: $("settingsPane"),
  toast: $("toast"),
  searchInput: $("searchInput"),
  memberCountLabel: $("memberCountLabel"),
  railLive: $("railLive"),
  navOpenBtn: $("navOpenBtn"),
  navBackdrop: $("navBackdrop"),
};

const state = {
  user: null,
  token: localStorage.getItem("xzon_token") || "",
  guilds: [],
  channels: [],
  view: "guild",
  guildId: "xzon",
  channelId: localStorage.getItem("xzon_channel") || "genel",
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
  stickBottom: true,
  loadingOlder: false,
  switching: false,
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

function esc(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function md(text) {
  let s = esc(text);
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
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

function fmtRelative(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "az önce";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} sa önce`;
  return fmtTime(ts);
}

function openNav() {
  els.app.classList.add("nav-open");
  els.app.classList.remove("members-open");
  els.membersPane.classList.remove("open");
  els.navBackdrop.classList.remove("hidden");
}

function closeNav() {
  els.app.classList.remove("nav-open");
  if (!els.membersPane.classList.contains("open")) {
    els.navBackdrop.classList.add("hidden");
  }
}

function openMembersDrawer() {
  els.membersPane.classList.add("open");
  els.app.classList.remove("nav-open");
  els.navBackdrop.classList.remove("hidden");
}

function closeMembersDrawer() {
  els.membersPane.classList.remove("open");
  if (!els.app.classList.contains("nav-open")) {
    els.navBackdrop.classList.add("hidden");
  }
}

function closeAllDrawers() {
  closeNav();
  closeMembersDrawer();
  els.navBackdrop.classList.add("hidden");
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers["x-xzon-token"] = state.token;
  const res = await fetch(path, {
    method: options.method || "GET",
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
    return { id, name: dm?.peer?.name || "DM", topic: "Direkt mesaj", type: "dm" };
  }
  return state.channels.find((c) => c.id === id) || { id, name: id, topic: "", type: "text" };
}

function nearBottom() {
  const el = els.messages;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}

function scrollBottom(force = false) {
  if (force || state.stickBottom) {
    els.messages.scrollTop = els.messages.scrollHeight;
    els.jumpBtn.classList.add("hidden");
  }
}

function syncMe() {
  const u = state.user;
  if (!u) return;
  els.meName.textContent = u.name;
  els.meAvatar.textContent = initials(u.name);
  els.meAvatar.style.background = u.color;
  els.meAvatar.className = `av ${u.status || "online"}`;
  els.meSub.textContent = u.customStatus || STATUS[u.status || "online"];
  $("micBtn").classList.toggle("off", Boolean(u.muted));
  $("deafBtn").classList.toggle("off", Boolean(u.deafened));
  if (u.voiceChannelId) {
    els.voicePanel.classList.remove("hidden");
    els.voiceName.textContent =
      state.channels.find((c) => c.id === u.voiceChannelId)?.name || u.voiceChannelId;
  } else {
    els.voicePanel.classList.add("hidden");
  }
}

function setLive(on, label) {
  const pulse = els.sidebarHead.querySelector(".pulse");
  if (pulse) pulse.classList.toggle("on", on);
  const small = els.sidebarHead.querySelector("small");
  if (small) small.textContent = label;
  els.railLive?.classList.toggle("on", on);
  els.netBanner.classList.toggle("hidden", on);
}

function renderRail() {
  els.dmHomeBtn.classList.toggle("active", state.view === "dms");
  els.guildRail.innerHTML = state.guilds
    .map((g) => {
      const active = state.view === "guild" && state.guildId === g.id;
      return `<button class="guild-btn ${active ? "active" : ""}" data-guild="${g.id}" type="button" title="${esc(g.name)}" style="${active ? `background:${g.color}` : ""}">${esc(g.short)}</button>`;
    })
    .join("");
  els.guildRail.querySelectorAll("[data-guild]").forEach((btn) => {
    btn.addEventListener("click", () => openGuild(btn.dataset.guild));
  });
}

function renderSidebar() {
  if (state.view === "dms") {
    els.sidebarHead.innerHTML = `<div><strong>Direkt Mesajlar</strong><small>${state.online.length} çevrimiçi</small></div><span class="pulse on"></span>`;
    els.channelNav.innerHTML = `
      <div class="cat"><div class="cat-name">Direkt Mesajlar</div>
      ${
        state.dms.length
          ? state.dms
              .map((d) => {
                const n = state.unread[d.channelId];
                return `<button class="dm-item ${state.channelId === d.channelId ? "active" : ""}" data-dm="${d.channelId}" type="button">
                  <div class="av ${d.peer?.status || "offline"}" style="background:${d.peer?.color || "#5865f2"}">${initials(d.peer?.name)}</div>
                  <span>${esc(d.peer?.name || "?")}</span>
                  ${n ? `<span class="badge">${n}</span>` : ""}
                </button>`;
              })
              .join("")
          : `<p style="padding:10px;color:var(--text-faint);font-size:13px;line-height:1.4">Üye listesinden birine tıkla ve mesaj gönder.</p>`
      }</div>`;
    els.channelNav.querySelectorAll("[data-dm]").forEach((b) =>
      b.addEventListener("click", () => switchChannel(b.dataset.dm)),
    );
    return;
  }

  const guild = state.guilds.find((g) => g.id === state.guildId);
  els.sidebarHead.innerHTML = `<div><strong>${esc(guild?.name || "Sunucu")}</strong><small>bağlanıyor…</small></div><span class="pulse"></span>`;

  const list = state.channels.filter((c) => c.guildId === state.guildId);
  const cats = [...new Set(list.map((c) => c.category))];
  els.channelNav.innerHTML = cats
    .map((cat) => {
      const items = list.filter((c) => c.category === cat);
      return `<div class="cat"><button class="cat-name" type="button">▼ ${esc(cat)}</button><div>${items
        .map((ch) => {
          if (ch.type === "voice") {
            const people = state.voice.filter((v) => v.voiceChannelId === ch.id);
            return `<button class="ch ${state.channelId === ch.id ? "active" : ""}" data-channel="${ch.id}" data-type="voice" type="button"><span class="hash">🔊</span><span>${esc(ch.name)}</span></button>
              ${
                people.length
                  ? `<div class="voice-list">${people
                      .map(
                        (v) =>
                          `<div class="voice-row"><div class="av ${v.status}" style="background:${v.color}">${initials(v.name)}</div><span>${esc(v.name)}</span></div>`,
                      )
                      .join("")}</div>`
                  : ""
              }`;
          }
          const n = state.unread[ch.id];
          return `<button class="ch ${state.channelId === ch.id ? "active" : ""}" data-channel="${ch.id}" type="button"><span class="hash">#</span><span>${esc(ch.name)}</span>${n ? `<span class="badge">${n}</span>` : ""}</button>`;
        })
        .join("")}</div></div>`;
    })
    .join("");

  els.channelNav.querySelectorAll("[data-channel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.type === "voice") joinVoice(btn.dataset.channel);
      else switchChannel(btn.dataset.channel);
    });
  });
}

function renderMembers() {
  const row = (u, dim = false) => `
    <button class="member ${dim ? "dim" : ""}" data-user="${u.id}" type="button">
      <div class="av ${u.status || "offline"}" style="background:${u.color}">${initials(u.name)}</div>
      <div class="meta">
        <span class="n" style="color:${u.color || "inherit"}">${esc(u.name)}</span>
        <span class="a">${esc(
          u.voiceChannelId
            ? `🔊 ${state.channels.find((c) => c.id === u.voiceChannelId)?.name || "Ses"}`
            : u.customStatus || STATUS[u.status] || "",
        )}</span>
      </div>
    </button>`;

  if (els.memberCountLabel) {
    els.memberCountLabel.textContent = String(state.online.length + state.offline.length);
  }

  els.membersContent.innerHTML = `
    <h3>Çevrimiçi — ${state.online.length}</h3>
    ${state.online.map((u) => row(u)).join("")}
    <h3>Çevrimdışı — ${state.offline.length}</h3>
    ${state.offline.map((u) => row(u, true)).join("")}`;

  els.membersContent.querySelectorAll("[data-user]").forEach((btn) => {
    btn.addEventListener("click", (e) => openProfile(btn.dataset.user, e));
  });
}

function msgHtml(msg, compact, enter = false) {
  const mine = state.user && msg.userId === state.user.id;
  return `
    <article class="msg ${compact ? "compact" : ""} ${msg.deleted ? "deleted" : ""} ${msg.pending ? "pending" : ""} ${enter ? "enter" : ""}" data-id="${msg.id}">
      <div class="msg-av" data-user="${msg.userId}" style="background:${esc(msg.userColor)}">${initials(msg.userName)}</div>
      <div>
        ${
          msg.replyTo
            ? `<div class="reply"><strong style="color:${esc(msg.replyTo.userColor)}">${esc(msg.replyTo.userName)}</strong> ${esc(msg.replyTo.content)}</div>`
            : ""
        }
        ${
          compact
            ? ""
            : `<div class="head">
                <span class="name" data-user="${msg.userId}" style="color:${esc(msg.userColor)}">${esc(msg.userName)}</span>
                <time class="time" title="${fmtTime(msg.createdAt)}">${fmtRelative(msg.createdAt)}</time>
                ${msg.editedAt ? `<span class="edited">(düzenlendi)</span>` : ""}
                ${msg.pinned ? `<span class="pin-tag">📌</span>` : ""}
              </div>`
        }
        <div class="body">${msg.deleted ? esc(msg.content) : md(msg.content)}</div>
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
        msg.deleted || msg.pending
          ? ""
          : `<div class="toolbar">
              <button type="button" data-act="react" data-id="${msg.id}" title="Tepki">😊</button>
              <button type="button" data-act="reply" data-id="${msg.id}" title="Yanıtla">↩</button>
              ${mine ? `<button type="button" data-act="edit" data-id="${msg.id}" title="Düzenle">✎</button>` : ""}
              <button type="button" data-act="pin" data-id="${msg.id}" title="Sabitle">📌</button>
              ${mine ? `<button type="button" data-act="delete" data-id="${msg.id}" title="Sil">🗑</button>` : ""}
            </div>`
      }
    </article>`;
}

function bindMessageNode(root = els.messages) {
  root.querySelectorAll(".spoiler").forEach((el) => {
    el.onclick = () => el.classList.add("on");
  });
  root.querySelectorAll("[data-user]").forEach((el) => {
    el.onclick = (e) => openProfile(el.dataset.user, e);
  });
  root.querySelectorAll("[data-react]").forEach((btn) => {
    btn.onclick = () => react(btn.dataset.react, btn.dataset.emoji);
  });
  root.querySelectorAll("[data-act]").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const act = btn.dataset.act;
      if (act === "react") showEmoji(btn, (emoji) => react(id, emoji));
      if (act === "reply") startReply(id);
      if (act === "edit") startEdit(id);
      if (act === "pin") pin(id);
      if (act === "delete") removeMsg(id);
    };
  });
}

function renderMessages({ enterId = null } = {}) {
  const ch = channelMeta();
  els.channelTitle.textContent = ch.name;
  els.channelTopic.textContent = ch.topic || "";
  els.titleIcon.textContent = ch.type === "dm" ? "@" : ch.type === "voice" ? "🔊" : "#";
  els.messageInput.placeholder =
    ch.type === "dm" ? `@${ch.name} kişisine mesaj gönder` : `#${ch.name} kanalına mesaj gönder`;

  let html = `<div class="welcome"><div class="orb">${ch.type === "dm" ? "@" : "#"}</div><h2>${ch.type === "dm" ? esc(ch.name) : `Welcome to #${esc(ch.name)}`}</h2><p>${esc(ch.topic || "Burası premium canlı kanal. Markdown: **kalın** *italik* `kod` ||spoiler||")}</p></div>`;

  let lastDay = "";
  let prev = null;
  for (const msg of state.messages) {
    const day = fmtDay(msg.createdAt);
    if (day !== lastDay) {
      html += `<div class="day">${esc(day)}</div>`;
      lastDay = day;
    }
    const compact =
      prev &&
      prev.userId === msg.userId &&
      !msg.replyTo &&
      msg.createdAt - prev.createdAt < 5 * 60 * 1000;
    html += msgHtml(msg, compact, enterId === msg.id);
    prev = msg;
  }

  const keep = state.stickBottom;
  const prevHeight = els.messages.scrollHeight;
  const prevTop = els.messages.scrollTop;
  els.messages.innerHTML = html;
  bindMessageNode();
  if (keep) scrollBottom(true);
  else els.messages.scrollTop = els.messages.scrollHeight - prevHeight + prevTop;
}

function upsertMessage(message, { enter = false } = {}) {
  if (!message) return;
  if (message.channelId !== state.channelId) {
    if (message.userId !== state.user?.id) {
      state.unread[message.channelId] = (state.unread[message.channelId] || 0) + 1;
      renderSidebar();
    }
    return;
  }

  const idx = state.messages.findIndex((m) => m.id === message.id || (m.pending && m.localId && m.localId === message.localId));
  if (idx >= 0) state.messages[idx] = { ...message, pending: false };
  else state.messages.push(message);
  state.messages.sort((a, b) => a.createdAt - b.createdAt);

  // Fast path: append if newest and stuck to bottom
  const last = state.messages[state.messages.length - 1];
  const existing = els.messages.querySelector(`[data-id="${message.id}"]`);
  if (!existing && last?.id === message.id && state.stickBottom && !message.deleted) {
    const prev = state.messages[state.messages.length - 2];
    const compact =
      prev &&
      prev.userId === message.userId &&
      !message.replyTo &&
      message.createdAt - prev.createdAt < 5 * 60 * 1000;
    els.messages.insertAdjacentHTML("beforeend", msgHtml(message, compact, true));
    bindMessageNode(els.messages.lastElementChild);
    scrollBottom(true);
    return;
  }

  renderMessages({ enterId: enter ? message.id : null });
  if (!state.stickBottom) els.jumpBtn.classList.remove("hidden");
  else scrollBottom(true);
}

async function loadMessages({ before = 0, appendTop = false } = {}) {
  const data = await api(
    `/xzon/api/messages?channel=${encodeURIComponent(state.channelId)}&limit=80${before ? `&before=${before}` : ""}`,
  );
  state.unread = data.unread || state.unread;
  if (appendTop) {
    const older = data.messages || [];
    const ids = new Set(state.messages.map((m) => m.id));
    state.messages = [...older.filter((m) => !ids.has(m.id)), ...state.messages];
  } else {
    state.messages = data.messages || [];
  }
  renderMessages();
  renderSidebar();
}

async function switchChannel(channelId) {
  if (!channelId || channelId === state.channelId && state.messages.length && !state.switching) {
    closeAllDrawers();
    return;
  }
  if (state.switching) return;
  state.switching = true;
  const unlock = setTimeout(() => {
    state.switching = false;
    els.chat?.classList.remove("switching");
  }, 4000);

  state.channelId = channelId;
  localStorage.setItem("xzon_channel", channelId);
  state.replyTo = null;
  state.editingId = null;
  els.replyBar.classList.add("hidden");
  state.typingUsers.clear();
  renderTyping();
  state.stickBottom = true;
  els.chat.classList.add("switching");
  closeAllDrawers();
  renderRail();
  renderSidebar();

  try {
    await loadMessages();
    openStream();
  } catch (error) {
    toast(error.message || "Kanal açılamadı");
  } finally {
    clearTimeout(unlock);
    els.chat.classList.remove("switching");
    state.switching = false;
    scrollBottom(true);
    els.messageInput?.focus();
  }
}

async function openGuild(guildId) {
  state.view = "guild";
  state.guildId = guildId;
  const first =
    state.channels.find((c) => c.guildId === guildId && c.type === "text" && c.id === "genel")?.id ||
    state.channels.find((c) => c.guildId === guildId && c.type === "text")?.id;
  renderRail();
  if (first) await switchChannel(first);
}

async function openDms() {
  state.view = "dms";
  state.dms = (await api("/xzon/api/dms")).dms || [];
  renderRail();
  renderSidebar();
  renderMembers();
  if (state.dms[0]) await switchChannel(state.dms[0].channelId);
  else {
    state.messages = [];
    els.channelTitle.textContent = "Direkt Mesajlar";
    els.titleIcon.textContent = "💬";
    els.channelTopic.textContent = "Bir üye seçip mesaj gönder";
    els.messages.innerHTML = `<div class="welcome"><div class="orb">💬</div><h2>Direkt Mesajlar</h2><p>Sağdaki listeden birine tıklayarak sohbet başlat.</p></div>`;
  }
}

async function joinVoice(channelId) {
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
  els.replyTitle.textContent = `${msg.userName} yanıtlanıyor`;
  els.replyPreview.textContent = msg.content.slice(0, 80);
  els.messageInput.focus();
}

function startEdit(id) {
  const msg = state.messages.find((m) => m.id === id);
  if (!msg || msg.deleted) return;
  state.editingId = id;
  state.replyTo = null;
  els.replyBar.classList.remove("hidden");
  els.replyTitle.textContent = "Mesaj düzenleniyor";
  els.replyPreview.textContent = "";
  els.messageInput.value = msg.content;
  els.messageInput.focus();
}

async function react(id, emoji) {
  upsertMessage((await api(`/xzon/api/messages/${id}/react`, { method: "POST", body: { emoji } })).message);
}
async function pin(id) {
  const message = (await api(`/xzon/api/messages/${id}/pin`, { method: "POST", body: {} })).message;
  upsertMessage(message);
  toast(message.pinned ? "Sabitlendi" : "Sabit kaldırıldı");
}
async function removeMsg(id) {
  if (!confirm("Mesaj silinsin mi?")) return;
  upsertMessage((await api(`/xzon/api/messages/${id}`, { method: "DELETE" })).message);
}

async function sendMessage() {
  const content = els.messageInput.value.trim();
  if (!content || els.sendBtn.disabled) return;
  els.sendBtn.disabled = true;

  try {
    if (state.editingId) {
      upsertMessage(
        (
          await api(`/xzon/api/messages/${state.editingId}`, {
            method: "PATCH",
            body: { content },
          })
        ).message,
      );
      state.editingId = null;
    } else {
      const localId = `local-${Date.now()}`;
      const optimistic = {
        id: localId,
        localId,
        channelId: state.channelId,
        userId: state.user.id,
        userName: state.user.name,
        userColor: state.user.color,
        content,
        createdAt: Date.now(),
        pending: true,
        reactions: [],
        replyTo: state.replyTo
          ? {
              id: state.replyTo.id,
              userName: state.replyTo.userName,
              userColor: state.replyTo.userColor,
              content: state.replyTo.content.slice(0, 120),
            }
          : null,
      };
      upsertMessage(optimistic, { enter: true });
      els.messageInput.value = "";
      const data = await api("/xzon/api/messages", {
        method: "POST",
        body: {
          channelId: state.channelId,
          content,
          replyToId: state.replyTo?.id || null,
        },
      });
      state.messages = state.messages.filter((m) => m.id !== localId);
      upsertMessage({ ...data.message, localId }, { enter: true });
      state.replyTo = null;
    }
    els.replyBar.classList.add("hidden");
    els.messageInput.value = "";
    state.stickBottom = true;
    scrollBottom(true);
  } catch (error) {
    state.messages = state.messages.filter((m) => !m.pending);
    renderMessages();
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
  const qs = new URLSearchParams({ channel: state.channelId });
  if (state.token) qs.set("token", state.token);
  const es = new EventSource(`/xzon/api/stream?${qs}`, { withCredentials: true });
  state.stream = es;
  setLive(false, "bağlanıyor…");

  es.addEventListener("hello", () => setLive(true, `canlı · ${state.online.length} online`));
  es.addEventListener("message", (ev) => {
    try {
      upsertMessage(JSON.parse(ev.data).message, { enter: true });
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
      }, 2400);
      state.typingUsers.set(`t:${p.user.id}`, t);
    } catch { /* ignore */ }
  });
  es.onerror = () => {
    setLive(false, "yeniden bağlanıyor…");
    es.close();
    state.stream = null;
    state.reconnectTimer = setTimeout(async () => {
      openStream();
      try {
        await loadMessages();
      } catch { /* ignore */ }
    }, 1500);
  };
}

async function openProfile(userId, event) {
  const { user: u } = await api(`/xzon/api/users/${userId}`);
  const pop = els.profilePop;
  pop.innerHTML = `
    <div class="banner" style="background:linear-gradient(135deg,${u.color},#1e1f22)"></div>
    <div class="av ${u.status}" style="background:${u.color}">${initials(u.name)}</div>
    <div class="pad">
      <h2>${esc(u.name)}</h2>
      <p class="tag">${esc(u.name)}#${esc(u.tag || "0000")}</p>
      <div class="card"><h4>Hakkında</h4><p>${esc(u.bio || "—")}</p></div>
      <div class="card"><h4>Durum</h4><p>${esc(u.customStatus || STATUS[u.status] || "—")}</p></div>
      <div class="actions">
        ${
          u.id !== state.user.id
            ? `<button type="button" id="dmFromProfile">Mesaj Gönder</button>`
            : `<button type="button" class="ghost" id="editFromProfile">Profili Düzenle</button>`
        }
      </div>
    </div>`;
  pop.style.left = `${Math.max(8, Math.min(window.innerWidth - 320, (event?.clientX || 200) + 8))}px`;
  pop.style.top = `${Math.max(8, Math.min(window.innerHeight - 380, (event?.clientY || 100) - 20))}px`;
  pop.classList.remove("hidden");
  $("dmFromProfile")?.addEventListener("click", async () => {
    const dm = await api("/xzon/api/dms", { method: "POST", body: { userId: u.id } });
    state.view = "dms";
    state.dms = (await api("/xzon/api/dms")).dms || [];
    pop.classList.add("hidden");
    await switchChannel(dm.channelId);
    renderRail();
  });
  $("editFromProfile")?.addEventListener("click", () => {
    pop.classList.add("hidden");
    openSettings("profile");
  });
}

function showEmoji(anchor, onPick) {
  const pop = els.emojiPop;
  pop.innerHTML = EMOJIS.map((e) => `<button type="button" data-e="${e}">${e}</button>`).join("");
  const rect = anchor.getBoundingClientRect();
  pop.style.left = `${Math.min(window.innerWidth - 300, rect.left)}px`;
  pop.style.top = `${Math.max(8, rect.top - 190)}px`;
  pop.classList.remove("hidden");
  pop.querySelectorAll("[data-e]").forEach((btn) => {
    btn.onclick = () => {
      pop.classList.add("hidden");
      onPick(btn.dataset.e);
    };
  });
}

function openSettings(tab = "account") {
  const tabs = [
    ["account", "Hesabım"],
    ["profile", "Profil"],
    ["status", "Durum"],
    ["voice", "Ses"],
    ["logout", "Çıkış Yap"],
  ];
  const u = state.user;
  els.settingsNav.innerHTML = `<h3>Kullanıcı Ayarları</h3>${tabs
    .map(
      ([id, label]) =>
        `<button type="button" data-tab="${id}" class="${id === tab ? "on" : ""} ${id === "logout" ? "danger" : ""}">${label}</button>`,
    )
    .join("")}`;
  els.settingsNav.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => openSettings(b.dataset.tab)),
  );

  const panes = {
    account: `<h2>Hesabım</h2><label>Kullanıcı adı<input id="setName" value="${esc(u.name)}" /></label><button class="save" id="saveAccount" type="button">Kaydet Değişiklikleri</button>`,
    profile: `<h2>Profil</h2><label>Hakkında<textarea id="setBio">${esc(u.bio || "")}</textarea></label><label>Özel durum<input id="setCustom" value="${esc(u.customStatus || "")}" maxlength="80" /></label><button class="save" id="saveProfile" type="button">Kaydet</button>`,
    status: `<h2>Durum</h2><label>Görünürlük<select id="setStatus">${["online", "idle", "dnd", "invisible"].map((s) => `<option value="${s}" ${u.status === s ? "selected" : ""}>${STATUS[s]}</option>`).join("")}</select></label><button class="save" id="saveStatus" type="button">Kaydet</button>`,
    voice: `<h2>Ses</h2><p style="color:var(--text-muted);line-height:1.5">Ses odalarına katılınca alt panelde bağlantı görünür. Mikrofon ve kulaklık durumun senkronlanır.</p>`,
    logout: `<h2>Çıkış Yap</h2><p style="color:var(--text-muted)">Oturumu kapatmak istediğine emin misin?</p><button class="save" id="confirmLogout" type="button" style="background:var(--danger)">Çıkış Yap</button>`,
  };
  els.settingsPane.innerHTML = panes[tab];
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
  closeAllDrawers();
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

  if (!state.channels.some((c) => c.id === state.channelId) && !String(state.channelId).startsWith("dm:")) {
    state.channelId = "genel";
  }

  els.boot.classList.add("hidden");
  els.app.classList.remove("hidden");
  syncMe();
  renderRail();
  renderSidebar();
  renderMembers();
  await loadMessages();
  openStream();
  startPresence();
  setLive(true, `canlı · ${state.online.length} online`);
  if (window.matchMedia("(max-width: 900px)").matches) {
    toast("☰ menüden sunucu & kanallara geç");
  }
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
    toast("XZON’a hoş geldin");
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
  const t = Date.now();
  if (t - state.lastTypingSent < 1400) return;
  state.lastTypingSent = t;
  api("/xzon/api/typing", { method: "POST", body: { channelId: state.channelId } }).catch(() => {});
});

els.messages.addEventListener("scroll", () => {
  state.stickBottom = nearBottom();
  if (state.stickBottom) els.jumpBtn.classList.add("hidden");
  if (els.messages.scrollTop < 40 && !state.loadingOlder && state.messages.length) {
    state.loadingOlder = true;
    const oldest = state.messages[0]?.createdAt;
    loadMessages({ before: oldest, appendTop: true })
      .catch(() => {})
      .finally(() => {
        state.loadingOlder = false;
      });
  }
});

els.jumpBtn.addEventListener("click", () => {
  state.stickBottom = true;
  scrollBottom(true);
});

$("cancelReply").addEventListener("click", () => {
  state.replyTo = null;
  state.editingId = null;
  els.replyBar.classList.add("hidden");
  els.messageInput.value = "";
});

els.dmHomeBtn.addEventListener("click", () => openDms());
$("leaveVoiceBtn").addEventListener("click", () => leaveVoice());
$("settingsBtn").addEventListener("click", () => openSettings("account"));
$("closeSettings").addEventListener("click", () => els.settingsModal.classList.add("hidden"));
$("membersBtn").addEventListener("click", () => {
  if (els.membersPane.classList.contains("open")) closeMembersDrawer();
  else openMembersDrawer();
});
els.navOpenBtn?.addEventListener("click", () => {
  if (els.app.classList.contains("nav-open")) closeNav();
  else openNav();
});
els.navBackdrop?.addEventListener("click", () => closeAllDrawers());
$("emojiBtn").addEventListener("click", (e) => {
  showEmoji(e.currentTarget, (emoji) => {
    els.messageInput.value += emoji;
    els.messageInput.focus();
  });
});

$("micBtn").addEventListener("click", async () => {
  state.user = (
    await api("/xzon/api/voice/flags", { method: "POST", body: { muted: !state.user.muted } })
  ).user;
  syncMe();
});
$("deafBtn").addEventListener("click", async () => {
  const deafened = !state.user.deafened;
  state.user = (
    await api("/xzon/api/voice/flags", {
      method: "POST",
      body: { deafened, muted: deafened || state.user.muted },
    })
  ).user;
  syncMe();
});

$("statusBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = els.statusMenu;
  menu.innerHTML = Object.entries(STATUS)
    .map(([k, v]) => `<button type="button" data-s="${k}">${v}</button>`)
    .join("");
  const rect = e.currentTarget.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  menu.style.top = "auto";
  menu.classList.toggle("hidden");
  menu.querySelectorAll("[data-s]").forEach((btn) => {
    btn.onclick = async () => {
      state.user = (await api("/xzon/api/me", { method: "PATCH", body: { status: btn.dataset.s } })).user;
      syncMe();
      menu.classList.add("hidden");
    };
  });
});

$("pinsBtn").addEventListener("click", async () => {
  const data = await api(`/xzon/api/pins?channel=${encodeURIComponent(state.channelId)}`);
  els.pinsList.innerHTML = data.messages?.length
    ? data.messages
        .map(
          (m) =>
            `<div class="pin-item"><strong>${esc(m.userName)}</strong> · ${fmtTime(m.createdAt)}<br>${esc(m.content)}</div>`,
        )
        .join("")
    : `<p style="padding:12px;color:var(--text-faint)">Sabitlenmiş mesaj yok</p>`;
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
    state.messages =
      (
        await api(
          `/xzon/api/search?channel=${encodeURIComponent(state.channelId)}&q=${encodeURIComponent(q)}`,
        )
      ).messages || [];
    renderMessages();
  }, 220);
});

document.addEventListener("click", (e) => {
  if (!els.statusMenu.contains(e.target) && e.target !== $("statusBtn") && !e.target.closest?.("#statusBtn")) {
    els.statusMenu.classList.add("hidden");
  }
  if (!els.emojiPop.contains(e.target) && e.target !== $("emojiBtn") && !e.target.closest?.('[data-act="react"]')) {
    els.emojiPop.classList.add("hidden");
  }
  if (!els.profilePop.contains(e.target) && !e.target.closest?.("[data-user]")) {
    els.profilePop.classList.add("hidden");
  }
});

(async () => {
  try {
    if (state.token || document.cookie.includes("xzon_token")) await bootstrap();
  } catch (error) {
    console.error("XZON bootstrap failed:", error);
    state.token = "";
    localStorage.removeItem("xzon_token");
    els.boot?.classList.remove("hidden");
    els.app?.classList.add("hidden");
  }
})();

// Visible build marker for cache debugging
console.info("[XZON] client v6 nav-fix ready");

// Category collapse
document.addEventListener("click", (e) => {
  const cat = e.target.closest?.(".cat-name");
  if (!cat || !els.channelNav.contains(cat)) return;
  const box = cat.nextElementSibling;
  if (!box) return;
  const hidden = box.style.display === "none";
  box.style.display = hidden ? "" : "none";
  cat.textContent = `${hidden ? "▼" : "▶"} ${cat.textContent.replace(/^[▼▶]\s*/, "")}`;
});
