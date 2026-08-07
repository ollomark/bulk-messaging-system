const $ = (id) => document.getElementById(id);
const STATUS = { online: "Çevrimiçi", idle: "Boşta", dnd: "Rahatsız Etmeyin", invisible: "Görünmez" };

/** XZON branded SVG icon set — no phone emoji chrome */
const ICON = {
  reply: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H12"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4 11.5-11.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M7 7l1 13h8l1-13"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 17v5"/><path d="M8 3h8l-1 7 3 3v2H6v-2l3-3L8 3z"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 012-2h10"/></svg>`,
  react: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8.5 10.5h.01M15.5 10.5h.01"/><path d="M8.2 14c.9 1.4 2.3 2.2 3.8 2.2s2.9-.8 3.8-2.2"/></svg>`,
  smile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01"/><path d="M8 14c1 1.6 2.5 2.4 4 2.4s3-1.8 4-2.4"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.2 11.1l16.8-7.2c.7-.3 1.4.4 1.1 1.1L13.9 21.8c-.3.8-1.5.7-1.7-.1l-1.8-7.2-7.2-1.8c-.8-.2-.9-1.4-.1-1.7z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
};

/** Custom XZON reaction stickers (shortcodes stored in DB) */
const XZ_REACTIONS = [
  { id: "xz_like", label: "Beğen", hue: "#6ea8ff" },
  { id: "xz_love", label: "Kalp", hue: "#ff6bcb" },
  { id: "xz_fire", label: "Ateş", hue: "#ff8a4a" },
  { id: "xz_laugh", label: "Gül", hue: "#ffc14a" },
  { id: "xz_wow", label: "Vay", hue: "#3dffa8" },
  { id: "xz_sad", label: "Üzgün", hue: "#8b9bb3" },
  { id: "xz_angry", label: "Kızgın", hue: "#ff5c6a" },
  { id: "xz_clap", label: "Alkış", hue: "#c4a1ff" },
  { id: "xz_check", label: "Onay", hue: "#57f287" },
  { id: "xz_bolt", label: "Şimşek", hue: "#ffe66d" },
  { id: "xz_game", label: "Oyun", hue: "#00a8fc" },
  { id: "xz_mark", label: "XZON", hue: "#3dffa8" },
];

function xzGlyph(id) {
  const map = {
    xz_like: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1a2740"/><path d="M10 18.5l3.2-8.2c.4-1 1.8-.8 1.9.3l.3 3.4h5.2c1.4 0 2.3 1.5 1.7 2.8l-2.2 5.2c-.3.7-1 1.1-1.7 1.1H12.2c-.7 0-1.3-.4-1.5-1.1L10 18.5z" fill="#6ea8ff"/><path d="M8.2 14.2h2.2v9.2H8.8c-.9 0-1.6-.7-1.6-1.6v-6c0-.9.7-1.6 1.6-1.6z" fill="#8eb8ff"/></svg>`,
    xz_love: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#2a1630"/><path d="M16 24s-7.2-4.4-9-8.2C5.4 12.4 7 9 10.4 9c2 0 3.2 1.1 3.6 2 .4-.9 1.6-2 3.6-2C21 9 22.6 12.4 21 15.8 19.2 19.6 16 24 16 24z" fill="#ff6bcb"/></svg>`,
    xz_fire: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#2a1a12"/><path d="M16 6c1.2 3.2-.2 5.2-1.4 6.6-1.4 1.6-2.2 2.8-1.8 4.8 2.2-1.2 3.4-2.2 4.2-4 1.4 2.4.8 5.2-1.2 7-.8.8-1.8 1.4-2.8 1.6 4.8.6 8.2-2.4 8.2-6.8C21.2 10.6 18.4 7.6 16 6z" fill="#ff8a4a"/><path d="M14.2 22.4c-1.4-1-2-2.6-1.6-4.2.8.6 1.6 1 2.4 1 .2 1.2-.2 2.2-.8 3.2z" fill="#ffe08a"/></svg>`,
    xz_laugh: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#2a2410"/><circle cx="16" cy="16" r="9" fill="#ffc14a"/><path d="M11 14c.6-1 1.4-1.5 2.2-1.5M19 14c-.6-1-1.4-1.5-2.2-1.5" stroke="#1a1205" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M11.2 17.2c.8 2.4 2.2 3.6 4.8 3.6s4-1.2 4.8-3.6H11.2z" fill="#1a1205"/></svg>`,
    xz_wow: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#10261c"/><circle cx="16" cy="16" r="9" fill="#3dffa8"/><circle cx="12.5" cy="14" r="1.3" fill="#061018"/><circle cx="19.5" cy="14" r="1.3" fill="#061018"/><ellipse cx="16" cy="19.2" rx="2.2" ry="2.8" fill="#061018"/></svg>`,
    xz_sad: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#1a2030"/><circle cx="16" cy="16" r="9" fill="#8b9bb3"/><circle cx="12.5" cy="14" r="1.2" fill="#0b0f16"/><circle cx="19.5" cy="14" r="1.2" fill="#0b0f16"/><path d="M11.5 20c1.2-1.4 2.6-2 4.5-2s3.3.6 4.5 2" stroke="#0b0f16" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
    xz_angry: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#2a1418"/><circle cx="16" cy="16" r="9" fill="#ff5c6a"/><path d="M10 12.5l4 1.5M22 12.5l-4 1.5" stroke="#1a080a" stroke-width="1.6" stroke-linecap="round"/><path d="M11.5 20c1.2-1.2 2.6-1.8 4.5-1.8s3.3.6 4.5 1.8" stroke="#1a080a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
    xz_clap: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#221833"/><path d="M10 14l2-4 2 1-1.2 3.2L10 14zm4.2-.4l2.2-4.4 2 .8-1.6 4.2-2.6-.6zm4.1.6l2.4-3.8 1.8 1-1.8 4-2.4-1.2zM9.5 16.5l7.2 7.2c1.6 1.6 4.2 1.5 5.6-.2l.8-.9c1.2-1.4.8-3.5-.8-4.5l-3.4-2.1-9.4.5z" fill="#c4a1ff"/></svg>`,
    xz_check: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#102618"/><circle cx="16" cy="16" r="9" fill="#57f287"/><path d="M11 16.2l3.1 3.1L21.4 12" stroke="#061018" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    xz_bolt: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#262010"/><path d="M17.8 6L10 17.2h5l-1.2 8.8L22 14.6h-5L17.8 6z" fill="#ffe66d"/></svg>`,
    xz_game: `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#0f2030"/><rect x="7" y="12" width="18" height="10" rx="5" fill="#00a8fc"/><circle cx="12" cy="17" r="1.4" fill="#061018"/><path d="M12 15.2v3.6M10.2 17h3.6" stroke="#061018" stroke-width="1.3" stroke-linecap="round"/><circle cx="20" cy="15.8" r="1.1" fill="#ff6bcb"/><circle cx="22.2" cy="17.8" r="1.1" fill="#ffe66d"/></svg>`,
    xz_mark: `<svg viewBox="0 0 32 32"><defs><linearGradient id="xzg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3dffa8"/><stop offset="1" stop-color="#6ea8ff"/></linearGradient></defs><circle cx="16" cy="16" r="15" fill="#0d1520"/><rect x="7" y="7" width="18" height="18" rx="6" fill="url(#xzg)"/><text x="16" y="19.2" text-anchor="middle" font-size="9" font-family="Sora,Outfit,sans-serif" font-weight="800" fill="#061018">XZ</text></svg>`,
  };
  if (map[id]) return map[id];
  // legacy unicode fallback — still wrap professionally
  return `<span class="rx-fallback">${esc(id)}</span>`;
}

function reactionChip(emoji, count, mine, messageId) {
  const custom = XZ_REACTIONS.some((r) => r.id === emoji);
  return `<button class="reaction ${mine ? "mine" : ""} ${custom ? "xz" : ""}" data-react="${messageId}" data-emoji="${esc(emoji)}" type="button" title="${esc(emoji)}"><span class="rx">${custom ? xzGlyph(emoji) : esc(emoji)}</span><span class="rx-n">${count}</span></button>`;
}

function actBtn(act, id, label, icon, danger = false) {
  return `<button type="button" class="tb ${danger ? "danger" : ""}" data-act="${act}" data-id="${id}" title="${label}" aria-label="${label}">${icon}<span class="tb-tip">${label}</span></button>`;
}

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
  mobileFab: $("mobileFab"),
  addGuildBtn: $("addGuildBtn"),
  nitroBtn: $("nitroBtn"),
  guildModal: $("guildModal"),
  guildModalBody: $("guildModalBody"),
  nitroModal: $("nitroModal"),
  sidebarTools: $("sidebarTools"),
  membersCloseBtn: $("membersCloseBtn"),
  mentionPop: $("mentionPop"),
  ctxMenu: $("ctxMenu"),
  lightbox: $("lightbox"),
  charCount: $("charCount"),
  sheetTitle: $("sheetTitle"),
  soundToggleBtn: $("soundToggleBtn"),
  serverSettingsModal: $("serverSettingsModal"),
  serverSettingsNav: $("serverSettingsNav"),
  serverSettingsPane: $("serverSettingsPane"),
  channelSettingsModal: $("channelSettingsModal"),
  channelSettingsBody: $("channelSettingsBody"),
};

const GUILD_COLORS = ["#5865f2", "#ed4245", "#3ba55c", "#faa61a", "#eb459e", "#00a8fc", "#9b59b6", "#1abc9c"];
const IMG_RE = /https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?/i;
const URL_RE = /https?:\/\/[^\s<]+/i;

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
  lastReadAt: Number(localStorage.getItem("xzon_last_read") || 0),
  soundOn: localStorage.getItem("xzon_sound") !== "0",
  unreadDividerAt: null,
  friends: [],
  friendIncoming: [],
  friendOutgoing: [],
  mutes: [],
  blocks: [],
  dmTab: "dms",
  quickIndex: 0,
  guildMembers: [],
  guildRoles: [],
  serverTab: "overview",
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
  s = s.replace(/:(xz_[a-z]+):/g, (_, id) => `<span class="inline-rx" title="${id}">${xzGlyph(id)}</span>`);
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/^&gt;\s?(.+)$/gm, '<span class="quote-line">$1</span>');
  s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
  s = s.replace(/@([\wğüşıöçĞÜŞİÖÇ]+)/g, '<span class="mention">@$1</span>');
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

function syncFab() {
  if (!els.mobileFab) return;
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  const inApp = !els.app.classList.contains("hidden");
  els.mobileFab.classList.toggle("hidden", !(mobile && inApp));
}

function openNav() {
  els.app.classList.add("nav-open");
  els.app.classList.remove("members-open");
  els.membersPane.classList.remove("open");
  els.navBackdrop.classList.remove("hidden");
  els.navBackdrop.setAttribute("aria-hidden", "false");
  syncFab();
}

function closeNav() {
  els.app.classList.remove("nav-open");
  if (!els.membersPane.classList.contains("open")) {
    els.navBackdrop.classList.add("hidden");
    els.navBackdrop.setAttribute("aria-hidden", "true");
  }
  syncFab();
}

function openMembersDrawer() {
  els.membersPane.classList.add("open");
  els.app.classList.add("members-open");
  els.app.classList.remove("nav-open");
  els.navBackdrop.classList.remove("hidden");
  els.navBackdrop.setAttribute("aria-hidden", "false");
  syncFab();
}

function closeMembersDrawer() {
  els.membersPane.classList.remove("open");
  els.app.classList.remove("members-open");
  if (!els.app.classList.contains("nav-open")) {
    els.navBackdrop.classList.add("hidden");
    els.navBackdrop.setAttribute("aria-hidden", "true");
  }
  syncFab();
}

function closeAllDrawers() {
  els.app.classList.remove("nav-open", "members-open");
  els.membersPane.classList.remove("open");
  els.navBackdrop.classList.add("hidden");
  els.navBackdrop.setAttribute("aria-hidden", "true");
  syncFab();
}

function toggleNav() {
  if (els.app.classList.contains("nav-open")) closeNav();
  else openNav();
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
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 140;
}

function scrollBottom(force = false) {
  if (!(force || state.stickBottom) || !els.messages) return;
  const el = els.messages;
  const go = () => {
    el.scrollTop = el.scrollHeight + 9999;
    els.jumpBtn?.classList.add("hidden");
    state.stickBottom = true;
  };
  go();
  requestAnimationFrame(go);
}

function resizeComposer() {
  const ta = els.messageInput;
  if (!ta || ta.tagName !== "TEXTAREA") return;
  ta.style.height = "auto";
  ta.style.height = `${Math.min(140, Math.max(24, ta.scrollHeight))}px`;
  if (els.charCount) els.charCount.textContent = `${ta.value.length}/1800`;
}

function canManageGuild(guild = null) {
  const g = guild || state.guilds.find((x) => x.id === state.guildId);
  if (!g?.custom) return false;
  return ["owner", "admin"].includes(g.myRole || "");
}

function userRole(userId) {
  if (userId === "system") return { label: "BOT", cls: "bot" };
  const mem = state.guildMembers.find((m) => m.id === userId);
  if (mem?.displayRole?.name) {
    return { label: mem.displayRole.name, cls: "custom", color: mem.displayRole.color };
  }
  if (mem?.guildRole === "owner") return { label: "OWNER", cls: "owner" };
  if (mem?.guildRole === "admin") return { label: "ADMIN", cls: "admin" };
  if (mem?.guildRole === "mod") return { label: "MOD", cls: "mod" };
  const guild = state.guilds.find((g) => g.id === state.guildId);
  if (guild?.ownerId && guild.ownerId === userId) return { label: "OWNER", cls: "owner" };
  const u = [...state.online, ...state.offline, state.user].find((x) => x?.id === userId);
  if (u?.nitroTier && u.nitroTier !== "none") return { label: u.badge || "NITRO", cls: "nitro" };
  return null;
}

async function refreshGuildMeta(guildId = state.guildId) {
  if (!guildId || guildId === "dm") {
    state.guildMembers = [];
    state.guildRoles = [];
    return;
  }
  try {
    const [mem, roles] = await Promise.all([
      api(`/xzon/api/guilds/${guildId}/members`),
      api(`/xzon/api/guilds/${guildId}/roles`).catch(() => ({ roles: [] })),
    ]);
    state.guildMembers = mem.members || [];
    state.guildRoles = roles.roles || [];
  } catch {
    state.guildMembers = [];
    state.guildRoles = [];
  }
}

function embedHtml(content) {
  if (!content) return "";
  const img = content.match(IMG_RE)?.[0];
  if (img) {
    return `<img class="embed-img" src="${esc(img)}" alt="medya" loading="lazy" data-lightbox="${esc(img)}" />`;
  }
  const url = content.match(URL_RE)?.[0];
  if (!url) return "";
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch { /* ignore */ }
  return `<div class="embed"><div class="embed-host">${esc(host)}</div><a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(url)}</a></div>`;
}

function playPing() {
  if (!state.soundOn) return;
  try {
    const ctx = playPing._ctx || (playPing._ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.stop(ctx.currentTime + 0.2);
  } catch { /* ignore */ }
}

function syncMe() {
  const u = state.user;
  if (!u) return;
  const nitro = u.nitroTier && u.nitroTier !== "none";
  els.meName.innerHTML = `${esc(u.name)}${nitro ? '<span class="nitro-dot" title="Nitro"></span>' : ""}`;
  els.meAvatar.textContent = initials(u.name);
  els.meAvatar.style.background = u.accent || u.color;
  els.meAvatar.className = `av ${u.status || "online"}`;
  els.meSub.textContent = u.activity
    ? `▶ ${u.activity}`
    : nitro
      ? `${u.badge || "NITRO"} · ${u.customStatus || STATUS[u.status || "online"]}`
      : u.customStatus || STATUS[u.status || "online"];
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
      const boost = g.boostLevel > 0 ? `<span class="boost-pip" title="Boost Lv.${g.boostLevel}">✦</span>` : "";
      return `<button class="guild-btn ${active ? "active" : ""}" data-guild="${g.id}" type="button" title="${esc(g.name)}" style="${active ? `background:${g.color}` : `box-shadow:inset 0 0 0 1px ${g.color}55`}">${esc(g.short)}${boost}</button>`;
    })
    .join("");
  els.guildRail.querySelectorAll("[data-guild]").forEach((btn) => {
    btn.addEventListener("click", () => openGuild(btn.dataset.guild));
  });
}

function renderSidebarTools(guild) {
  if (!els.sidebarTools) return;
  if (state.view === "dms" || !guild) {
    els.sidebarTools.innerHTML = "";
    return;
  }
  const manage = canManageGuild(guild);
  els.sidebarTools.innerHTML = `
    <button type="button" class="tool-chip" id="inviteTool">Davet</button>
    <button type="button" class="tool-chip" id="boostTool">Boost ${guild.boostLevel ? `Lv.${guild.boostLevel}` : ""}</button>
    ${manage ? `<button type="button" class="tool-chip" id="channelTool">+ Kanal</button>` : ""}
    ${manage ? `<button type="button" class="tool-chip" id="categoryTool">+ Kategori</button>` : ""}
    ${guild.custom ? `<button type="button" class="tool-chip accent" id="serverTool">Ayarlar</button>` : ""}
  `;
  $("inviteTool")?.addEventListener("click", () => copyInvite(guild.id));
  $("boostTool")?.addEventListener("click", () => boostCurrentGuild(guild.id));
  $("channelTool")?.addEventListener("click", () => createChannelPrompt(guild.id));
  $("categoryTool")?.addEventListener("click", () => createCategoryPrompt(guild.id));
  $("serverTool")?.addEventListener("click", () => openServerSettings(guild.id));
}

function renderSidebar() {
  if (state.view === "dms") {
    els.sidebarHead.innerHTML = `
      <div><strong>Arkadaşlar & DM</strong><small>${state.friends.length} arkadaş · ${state.friendIncoming.length} istek</small></div>
      <div class="head-actions"><span class="pulse on"></span>
      <button type="button" class="icon drawer-close" id="drawerCloseBtn" aria-label="Kapat">✕</button></div>`;
    renderSidebarTools(null);
    $("drawerCloseBtn")?.addEventListener("click", closeNav);
    const tab = state.dmTab || "dms";
    const tabs = `
      <div class="friend-tabs">
        <button type="button" data-dtab="dms" class="${tab === "dms" ? "on" : ""}">DM</button>
        <button type="button" data-dtab="friends" class="${tab === "friends" ? "on" : ""}">Arkadaşlar</button>
        <button type="button" data-dtab="requests" class="${tab === "requests" ? "on" : ""}">İstekler${state.friendIncoming.length ? ` (${state.friendIncoming.length})` : ""}</button>
      </div>`;
    let body = "";
    if (tab === "friends") {
      body = `<div class="cat"><div class="cat-name">Online arkadaşlar</div>
        ${
          state.friends.length
            ? state.friends
                .map(
                  (u) => `<div class="friend-row">
                    <div class="av ${u.status}" style="background:${u.color}">${initials(u.name)}</div>
                    <div><strong>${esc(u.name)}</strong><small style="color:var(--text-3)">${esc(u.activity || STATUS[u.status] || "")}</small></div>
                    <div class="acts">
                      <button type="button" data-fdm="${u.id}">DM</button>
                      <button type="button" data-fremove="${u.id}">Çıkar</button>
                    </div>
                  </div>`,
                )
                .join("")
            : `<p style="padding:10px;color:var(--text-3);font-size:13px">Henüz arkadaş yok. Profilden istek at.</p>`
        }</div>`;
    } else if (tab === "requests") {
      body = `<div class="cat"><div class="cat-name">Gelen istekler</div>
        ${
          state.friendIncoming.length
            ? state.friendIncoming
                .map(
                  (u) => `<div class="friend-row">
                    <div class="av ${u.status}" style="background:${u.color}">${initials(u.name)}</div>
                    <strong>${esc(u.name)}</strong>
                    <div class="acts">
                      <button type="button" class="ok" data-faccept="${u.id}">Kabul</button>
                      <button type="button" data-fdecline="${u.id}">Red</button>
                    </div>
                  </div>`,
                )
                .join("")
            : `<p style="padding:10px;color:var(--text-3);font-size:13px">Bekleyen istek yok.</p>`
        }
        <div class="cat-name" style="margin-top:12px">Giden</div>
        ${
          state.friendOutgoing.length
            ? state.friendOutgoing
                .map((u) => `<div class="friend-row"><div class="av" style="background:${u.color}">${initials(u.name)}</div><strong>${esc(u.name)}</strong><small style="margin-left:auto;color:var(--text-3)">bekliyor</small></div>`)
                .join("")
            : `<p style="padding:10px;color:var(--text-3);font-size:13px">Giden istek yok.</p>`
        }</div>`;
    } else {
      body = `<div class="cat"><div class="cat-name">Direkt Mesajlar</div>
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
          : `<p style="padding:10px;color:var(--text-3);font-size:13px;line-height:1.4">Üye listesinden veya arkadaşlardan DM aç.</p>`
      }</div>`;
    }
    els.channelNav.innerHTML = tabs + body;
    els.channelNav.querySelectorAll("[data-dtab]").forEach((b) =>
      b.addEventListener("click", () => {
        state.dmTab = b.dataset.dtab;
        renderSidebar();
        openDms();
      }),
    );
    els.channelNav.querySelectorAll("[data-dm]").forEach((b) =>
      b.addEventListener("click", () => {
        state.dmTab = "dms";
        switchChannel(b.dataset.dm);
      }),
    );
    els.channelNav.querySelectorAll("[data-fdm]").forEach((b) =>
      b.addEventListener("click", async () => {
        const dm = await api("/xzon/api/dms", { method: "POST", body: { userId: b.dataset.fdm } });
        state.dmTab = "dms";
        state.dms = (await api("/xzon/api/dms")).dms || [];
        await switchChannel(dm.channelId);
        renderSidebar();
      }),
    );
    els.channelNav.querySelectorAll("[data-fremove]").forEach((b) =>
      b.addEventListener("click", async () => {
        const data = await api(`/xzon/api/friends/${b.dataset.fremove}`, { method: "DELETE" });
        state.friends = data.friends || [];
        renderSidebar();
        toast("Arkadaş çıkarıldı");
      }),
    );
    els.channelNav.querySelectorAll("[data-faccept]").forEach((b) =>
      b.addEventListener("click", async () => {
        const data = await api(`/xzon/api/friends/${b.dataset.faccept}/respond`, {
          method: "POST",
          body: { accept: true },
        });
        state.friends = data.friends || [];
        state.friendIncoming = data.incoming || [];
        renderSidebar();
        toast("Arkadaş eklendi");
      }),
    );
    els.channelNav.querySelectorAll("[data-fdecline]").forEach((b) =>
      b.addEventListener("click", async () => {
        const data = await api(`/xzon/api/friends/${b.dataset.fdecline}/respond`, {
          method: "POST",
          body: { accept: false },
        });
        state.friendIncoming = data.incoming || [];
        renderSidebar();
      }),
    );
    return;
  }

  const guild = state.guilds.find((g) => g.id === state.guildId);
  els.sidebarHead.innerHTML = `
    <button type="button" id="guildMenuBtn" style="text-align:left;min-width:0;flex:1;color:inherit">
      <strong>${esc(guild?.name || "Sunucu")} ▾</strong>
      <small>${guild?.boostLevel ? `Boost Lv.${guild.boostLevel} · ` : ""}${state.online.length} online</small>
    </button>
    <div class="head-actions"><span class="pulse on"></span>
    <button type="button" class="icon drawer-close" id="drawerCloseBtn" aria-label="Kapat">✕</button></div>
    <div id="guildMenu" class="guild-menu hidden"></div>`;
  renderSidebarTools(guild);
  $("drawerCloseBtn")?.addEventListener("click", closeNav);
  $("guildMenuBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleGuildMenu(guild);
  });

  const list = state.channels.filter((c) => c.guildId === state.guildId);
  const cats = [...new Set(list.map((c) => c.category))];
  const manage = canManageGuild(guild);
  const boostNote =
    guild?.boostLevel > 0
      ? `<div class="boost-banner"><span><strong>Sunucu Boost</strong> · Seviye ${guild.boostLevel} (${guild.boostCount || 0} boost)</span></div>`
      : "";
  els.channelNav.innerHTML =
    boostNote +
    cats
      .map((cat) => {
        const items = list.filter((c) => c.category === cat);
        return `<div class="cat">
          <div class="cat-head">
            <button class="cat-name" type="button">▼ ${esc(cat)}</button>
            ${manage ? `<button type="button" class="cat-gear" data-rename-cat="${esc(cat)}" title="Kategoriyi yeniden adlandır">✎</button>` : ""}
          </div>
          <div>${items
          .map((ch) => {
            const gear = manage && ch.custom
              ? `<button type="button" class="ch-gear" data-edit-ch="${ch.id}" title="Kanal ayarları">⚙</button>`
              : "";
            if (ch.type === "voice") {
              const people = state.voice.filter((v) => v.voiceChannelId === ch.id);
              return `<div class="ch-row">
                <button class="ch ${state.channelId === ch.id ? "active" : ""}" data-channel="${ch.id}" data-type="voice" type="button"><span class="hash">🔊</span><span>${esc(ch.name)}</span>${people.length ? `<span class="badge">${people.length}</span>` : ""}</button>
                ${gear}
              </div>
              ${
                people.length
                  ? `<div class="voice-list">${people
                      .map(
                        (v) =>
                          `<div class="voice-row"><div class="av ${v.status}" style="background:${v.color}">${initials(v.name)}</div><span>${esc(v.name)}</span>${v.muted ? "<small>sessiz</small>" : ""}</div>`,
                      )
                      .join("")}</div>`
                  : ""
              }`;
            }
            const n = isChannelMuted(ch.id) ? 0 : state.unread[ch.id];
            const muted = isChannelMuted(ch.id) ? " muted" : "";
            return `<div class="ch-row">
              <button class="ch${muted} ${state.channelId === ch.id ? "active" : ""}" data-channel="${ch.id}" type="button"><span class="hash">#</span><span>${esc(ch.name)}</span>${ch.slowmode ? `<span class="slow-tag">${ch.slowmode}s</span>` : ""}${ch.nsfw ? `<span class="nsfw-tag">NSFW</span>` : ""}${n ? `<span class="badge">${n > 99 ? "99+" : n}</span>` : ""}</button>
              ${gear}
            </div>`;
          })
          .join("")}</div></div>`;
      })
      .join("");

  $("guestUpgradeBtn")?.addEventListener("click", () => openSettings("account"));
  els.channelNav.querySelectorAll("[data-channel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.type === "voice") joinVoice(btn.dataset.channel);
      else switchChannel(btn.dataset.channel);
    });
  });
  els.channelNav.querySelectorAll("[data-edit-ch]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openChannelSettings(btn.dataset.editCh);
    });
  });
  els.channelNav.querySelectorAll("[data-rename-cat]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const from = btn.dataset.renameCat;
      const to = prompt("Yeni kategori adı", from);
      if (!to || to === from) return;
      try {
        const data = await api(`/xzon/api/guilds/${guild.id}/categories`, {
          method: "PATCH",
          body: { from, to },
        });
        state.channels = data.channels || state.channels;
        renderSidebar();
        toast(`Kategori: ${to}`);
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function renderMembers() {
  const row = (u, dim = false) => {
    const role = userRole(u.id);
    return `
    <button class="member ${dim ? "dim" : ""}" data-user="${u.id}" type="button">
      <div class="av ${u.status || "offline"}" style="background:${u.accent || u.color}">${initials(u.name)}</div>
      <div class="meta">
        <span class="n" style="color:${role?.color || u.color || "inherit"}">${esc(u.name)}${role ? ` <span class="role-tag ${role.cls}" ${role.color ? `style="background:${esc(role.color)};color:#061018"` : ""}>${esc(role.label)}</span>` : ""}</span>
        <span class="a">${esc(
          u.voiceChannelId
            ? `🔊 ${state.channels.find((c) => c.id === u.voiceChannelId)?.name || "Ses"}`
            : u.customStatus || STATUS[u.status] || "",
        )}</span>
      </div>
    </button>`;
  };

  if (els.memberCountLabel) {
    els.memberCountLabel.textContent = String(state.online.length + state.offline.length);
  }

  const voice = state.online.filter((u) => u.voiceChannelId);
  const nitro = state.online.filter(
    (u) => !u.voiceChannelId && u.nitroTier && u.nitroTier !== "none",
  );
  const rest = state.online.filter(
    (u) => !u.voiceChannelId && !(u.nitroTier && u.nitroTier !== "none"),
  );

  els.membersContent.innerHTML = `
    ${voice.length ? `<h3>Seste — ${voice.length}</h3>${voice.map((u) => row(u)).join("")}` : ""}
    ${nitro.length ? `<h3>Nitro — ${nitro.length}</h3>${nitro.map((u) => row(u)).join("")}` : ""}
    <h3>Çevrimiçi — ${rest.length}</h3>
    ${rest.map((u) => row(u)).join("")}
    <h3>Çevrimdışı — ${state.offline.length}</h3>
    ${state.offline.map((u) => row(u, true)).join("")}`;

  els.membersContent.querySelectorAll("[data-user]").forEach((btn) => {
    btn.addEventListener("click", (e) => openProfile(btn.dataset.user, e));
  });
}

function msgHtml(msg, compact, enter = false) {
  const mine = state.user && msg.userId === state.user.id;
  const role = userRole(msg.userId);
  if (msg.userId === "system") {
    return `
      <article class="msg system ${enter ? "enter" : ""}" data-id="${msg.id}">
        <div class="sys-line">
          <span class="sys-dot"></span>
          <div class="body">${md(msg.content)}</div>
          <time class="time" title="${fmtTime(msg.createdAt)}">${fmtRelative(msg.createdAt)}</time>
        </div>
      </article>`;
  }
  const nameColor = role?.color || msg.userColor;
  const canModDelete =
    !mine &&
    ["owner", "admin", "mod"].includes(
      state.guilds.find((g) => g.id === state.guildId)?.myRole || "",
    );
  const mentioned =
    state.user &&
    !mine &&
    String(msg.content || "").toLowerCase().includes(`@${state.user.name.toLowerCase()}`);
  return `
    <article class="msg ${compact ? "compact" : ""} ${msg.deleted ? "deleted" : ""} ${msg.pending ? "pending" : ""} ${enter ? "enter" : ""} ${mentioned ? "mentioned" : ""}" data-id="${msg.id}">
      <div class="msg-av" data-user="${msg.userId}" style="background:${esc(msg.userColor)}">${initials(msg.userName)}</div>
      <div>
        ${
          msg.replyTo
            ? `<div class="reply"><strong style="color:${esc(msg.replyTo.userColor)}">${esc(msg.replyTo.userName)}</strong> ${esc(msg.replyTo.content)}</div>`
            : ""
        }
        ${
          compact
            ? `<time class="time compact-time" title="${fmtTime(msg.createdAt)}">${fmtTime(msg.createdAt)}</time>`
            : `<div class="head">
                <span class="name" data-user="${msg.userId}" style="color:${esc(nameColor)}">${esc(msg.userName)}</span>
                ${role ? `<span class="role-tag ${role.cls}" ${role.color ? `style="background:${esc(role.color)};color:#061018"` : ""}>${esc(role.label)}</span>` : ""}
                <time class="time" title="${fmtTime(msg.createdAt)}">${fmtRelative(msg.createdAt)}</time>
                ${msg.editedAt ? `<span class="edited">(düzenlendi)</span>` : ""}
                ${msg.pinned ? `<span class="pin-tag">📌</span>` : ""}
              </div>`
        }
        <div class="body">${msg.deleted ? esc(msg.content) : md(msg.content)}</div>
        ${msg.deleted ? "" : embedHtml(msg.content)}
        ${
          msg.reactions?.length
            ? `<div class="reactions">${msg.reactions
                .map((r) => reactionChip(r.emoji, r.count, r.mine, msg.id))
                .join("")}</div>`
            : ""
        }
      </div>
      ${
        msg.deleted || msg.pending
          ? ""
          : `<div class="toolbar" role="toolbar" aria-label="Mesaj eylemleri">
              ${actBtn("react", msg.id, "Tepki", ICON.react)}
              ${actBtn("reply", msg.id, "Yanıtla", ICON.reply)}
              ${mine ? actBtn("edit", msg.id, "Düzenle", ICON.edit) : ""}
              ${actBtn("pin", msg.id, "Sabitle", ICON.pin)}
              ${actBtn("copy", msg.id, "Kopyala", ICON.copy)}
              ${mine || canModDelete ? actBtn("delete", msg.id, "Sil", ICON.trash, true) : ""}
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
  root.querySelectorAll("[data-lightbox]").forEach((el) => {
    el.onclick = () => openLightbox(el.dataset.lightbox);
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
      if (act === "copy") copyMessage(id);
    };
  });
  root.querySelectorAll(".msg").forEach((node) => {
    node.oncontextmenu = (e) => {
      e.preventDefault();
      openCtxMenu(node.dataset.id, e.clientX, e.clientY);
    };
    let pressTimer;
    node.ontouchstart = () => {
      pressTimer = setTimeout(() => openCtxMenu(node.dataset.id, 24, Math.min(window.innerHeight - 220, 120)), 480);
    };
    node.ontouchend = () => clearTimeout(pressTimer);
    node.ontouchmove = () => clearTimeout(pressTimer);
  });
}

function renderMessages({ enterId = null } = {}) {
  const ch = channelMeta();
  els.channelTitle.textContent = ch.name;
  els.channelTopic.textContent = ch.topic || "";
  els.titleIcon.textContent = ch.type === "dm" ? "@" : ch.type === "voice" ? "🔊" : "#";
  els.messageInput.placeholder =
    ch.type === "dm" ? `@${ch.name} kişisine mesaj gönder` : `#${ch.name} kanalına mesaj gönder`;

  let html = `<div class="welcome"><div class="orb">${ch.type === "dm" ? "@" : "#"}</div><h2>${ch.type === "dm" ? esc(ch.name) : `#${esc(ch.name)}`}</h2><p>${esc(ch.topic || "Burası XZON canlı kanalı. Markdown: **kalın** *italik* `kod` ||spoiler|| · @bahset · /yardim")}</p></div>`;

  let lastDay = "";
  let prev = null;
  let dividerDone = false;
  const dividerAt = state.unreadDividerAt;
  for (const msg of state.messages) {
    if (!dividerDone && dividerAt && msg.createdAt > dividerAt && msg.userId !== state.user?.id) {
      html += `<div class="unread-sep">Yeni mesajlar</div>`;
      dividerDone = true;
    }
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
    if (message.userId !== state.user?.id && !isChannelMuted(message.channelId)) {
      state.unread[message.channelId] = (state.unread[message.channelId] || 0) + 1;
      renderSidebar();
      playPing();
    }
    return;
  }
  if (
    message.userId !== state.user?.id &&
    !message.pending &&
    String(message.content || "").toLowerCase().includes(`@${(state.user?.name || "").toLowerCase()}`)
  ) {
    playPing();
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
  if (!channelId) return;
  if (channelId === state.channelId && state.messages.length && !state.switching) {
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
  state.unreadDividerAt = state.lastReadAt || null;
  els.chat.classList.add("switching");
  closeAllDrawers();
  renderRail();
  renderSidebar();

  try {
    await loadMessages();
    openStream();
    state.lastReadAt = Date.now();
    localStorage.setItem("xzon_last_read", String(state.lastReadAt));
  } catch (error) {
    toast(error.message || "Kanal açılamadı");
  } finally {
    clearTimeout(unlock);
    els.chat.classList.remove("switching");
    state.switching = false;
    scrollBottom(true);
    resizeComposer();
    els.messageInput?.focus({ preventScroll: true });
  }
}

async function openGuild(guildId) {
  state.view = "guild";
  state.guildId = guildId;
  const first =
    state.channels.find((c) => c.guildId === guildId && c.type === "text" && c.id === "genel")?.id ||
    state.channels.find((c) => c.guildId === guildId && c.type === "text")?.id;
  renderRail();
  await refreshGuildMeta(guildId);
  if (first) await switchChannel(first);
  else {
    renderSidebar();
    renderMembers();
  }
}

function isChannelMuted(channelId) {
  const meta = state.channels.find((c) => c.id === channelId);
  return state.mutes.some(
    (m) =>
      (m.targetType === "channel" && m.targetId === channelId) ||
      (m.targetType === "guild" && meta && m.targetId === meta.guildId),
  );
}

async function openDms() {
  state.view = "dms";
  const [dmsData, fr] = await Promise.all([api("/xzon/api/dms"), api("/xzon/api/friends")]);
  state.dms = dmsData.dms || [];
  state.friends = fr.friends || [];
  state.friendIncoming = fr.incoming || [];
  state.friendOutgoing = fr.outgoing || [];
  renderRail();
  renderSidebar();
  renderMembers();
  if (state.dmTab === "friends" || state.dmTab === "requests") {
    state.messages = [];
    els.channelTitle.textContent = state.dmTab === "requests" ? "Arkadaş İstekleri" : "Arkadaşlar";
    els.titleIcon.textContent = "👥";
    els.channelTopic.textContent = "Discord Friends paneli";
    els.messages.innerHTML = `<div class="welcome"><div class="orb">👥</div><h2>${state.dmTab === "requests" ? "İstekler" : "Arkadaşların"}</h2><p>Soldan arkadaş ekle, kabul et veya DM başlat.</p></div>`;
    return;
  }
  if (state.dms[0]) await switchChannel(state.dms[0].channelId);
  else {
    state.messages = [];
    els.channelTitle.textContent = "Direkt Mesajlar";
    els.titleIcon.textContent = "@";
    els.channelTopic.textContent = "Bir üye veya arkadaş seçip mesaj gönder";
    els.messages.innerHTML = `<div class="welcome"><div class="orb">@</div><h2>Direkt Mesajlar</h2><p>Arkadaşlar sekmesinden veya üye listesinden sohbet başlat.</p></div>`;
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

async function handleSlash(content) {
  const [cmd, ...rest] = content.slice(1).trim().split(/\s+/);
  const arg = rest.join(" ");
  switch (cmd.toLowerCase()) {
    case "yardim":
    case "help":
      toast("Komutlar: /nitro /davet /boost /kanal /me /arkadas /kesfet /aktivite /yavas /temizle");
      return true;
    case "arkadas":
    case "friend":
      state.view = "dms";
      state.dmTab = "friends";
      await openDms();
      return true;
    case "kesfet":
    case "discover":
      openDiscover();
      return true;
    case "aktivite":
    case "activity": {
      const activity = arg || prompt("Aktivite", state.user.activity || "") || "";
      state.user = (await api("/xzon/api/me", { method: "PATCH", body: { activity } })).user;
      syncMe();
      toast("Aktivite güncellendi");
      return true;
    }
    case "yavas":
    case "slowmode": {
      const sec = Number(arg || prompt("Yavaş mod (sn)", "5") || 0);
      try {
        const data = await api(`/xzon/api/channels/${state.channelId}/settings`, {
          method: "PATCH",
          body: { slowmode: sec },
        });
        state.channels = data.channels || state.channels;
        renderSidebar();
        toast(`Yavaş mod: ${sec}s`);
      } catch (error) {
        toast(error.message);
      }
      return true;
    }
    case "nitro":
      openNitroModal();
      return true;
    case "davet":
    case "invite":
      if (state.guildId) await copyInvite(state.guildId);
      return true;
    case "boost":
      if (state.guildId) await boostCurrentGuild(state.guildId);
      return true;
    case "kanal":
    case "channel":
      if (state.guildId) await createChannelPrompt(state.guildId);
      return true;
    case "me":
      if (!arg) {
        toast("Kullanım: /me bir şey yapar");
        return true;
      }
      els.messageInput.value = `*${state.user.name} ${arg}*`;
      return false;
    case "temizle":
    case "clear":
      els.messageInput.value = "";
      resizeComposer();
      return true;
    default:
      return false;
  }
}

async function sendMessage() {
  let content = els.messageInput.value.trim();
  if (!content || els.sendBtn.disabled) return;
  if (content.startsWith("/")) {
    const handled = await handleSlash(content);
    if (handled) {
      els.messageInput.value = "";
      resizeComposer();
      return;
    }
    content = els.messageInput.value.trim();
    if (!content) return;
  }
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
      resizeComposer();
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
    resizeComposer();
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

function toggleGuildMenu(guild) {
  const menu = $("guildMenu");
  if (!menu || !guild) return;
  if (!menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
    return;
  }
  const manage = canManageGuild(guild);
  menu.innerHTML = `
    <button type="button" data-gact="invite">Davet bağlantısı oluştur</button>
    <button type="button" data-gact="boost">Sunucuyu boostla</button>
    <button type="button" data-gact="mute">Sunucuyu sessize al</button>
    ${guild.custom ? `<button type="button" data-gact="server">Sunucu ayarları</button>` : ""}
    ${manage ? `<button type="button" data-gact="channel">Kanal oluştur</button>` : ""}
    ${manage ? `<button type="button" data-gact="category">Kategori oluştur</button>` : ""}
    <button type="button" data-gact="nitro">XZON Nitro</button>
    <button type="button" data-gact="settings">Kullanıcı ayarları</button>
    ${guild.custom && guild.myRole !== "owner" ? `<button type="button" data-gact="leave">Sunucudan çık</button>` : ""}
    ${guild.custom && guild.myRole === "owner" ? `<button type="button" data-gact="delete" class="danger">Sunucuyu sil</button>` : ""}
  `;
  menu.classList.remove("hidden");
  menu.querySelectorAll("[data-gact]").forEach((btn) => {
    btn.onclick = async () => {
      menu.classList.add("hidden");
      const a = btn.dataset.gact;
      if (a === "invite") await copyInvite(guild.id);
      if (a === "boost") await boostCurrentGuild(guild.id);
      if (a === "channel") await createChannelPrompt(guild.id);
      if (a === "category") await createCategoryPrompt(guild.id);
      if (a === "server") openServerSettings(guild.id);
      if (a === "nitro") openNitroModal();
      if (a === "settings") openSettings("account");
      if (a === "mute") {
        const data = await api("/xzon/api/mutes", {
          method: "POST",
          body: { targetType: "guild", targetId: guild.id },
        });
        state.mutes = data.mutes || [];
        renderSidebar();
        toast(data.muted ? "Sunucu sessize alındı" : "Ses açıldı");
      }
      if (a === "leave") {
        if (!confirm("Sunucudan çıkılsın mı?")) return;
        try {
          const data = await api(`/xzon/api/guilds/${guild.id}/leave`, { method: "POST", body: {} });
          state.guilds = data.guilds || [];
          state.channels = data.channels || [];
          await openGuild("xzon");
          toast("Sunucudan çıkıldı");
        } catch (error) {
          toast(error.message);
        }
      }
      if (a === "delete") {
        if (!confirm("Sunucu kalıcı silinsin mi? Bu geri alınamaz.")) return;
        try {
          const data = await api(`/xzon/api/guilds/${guild.id}`, { method: "DELETE" });
          state.guilds = data.guilds || [];
          state.channels = data.channels || [];
          await openGuild("xzon");
          toast("Sunucu silindi");
        } catch (error) {
          toast(error.message);
        }
      }
    };
  });
}

function wrapSelection(prefix, suffix = prefix) {
  const ta = els.messageInput;
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  const value = ta.value;
  const selected = value.slice(start, end) || "metin";
  ta.value = `${value.slice(0, start)}${prefix}${selected}${suffix}${value.slice(end)}`;
  const caret = start + prefix.length + selected.length + suffix.length;
  ta.focus();
  ta.setSelectionRange(caret, caret);
  resizeComposer();
}

function openQuickSwitch() {
  const box = $("quickSwitch");
  const input = $("quickInput");
  const results = $("quickResults");
  if (!box || !input || !results) return;
  box.classList.remove("hidden");
  input.value = "";
  state.quickIndex = 0;
  const paint = () => {
    const q = input.value.trim().toLowerCase();
    const items = [];
    for (const ch of state.channels.filter((c) => c.type === "text")) {
      if (!q || ch.name.toLowerCase().includes(q) || ch.id.includes(q)) {
        items.push({
          kind: "channel",
          id: ch.id,
          label: `#${ch.name}`,
          sub: state.guilds.find((g) => g.id === ch.guildId)?.name || ch.guildId,
        });
      }
    }
    for (const d of state.dms) {
      const name = d.peer?.name || "DM";
      if (!q || name.toLowerCase().includes(q)) {
        items.push({ kind: "dm", id: d.channelId, label: `@${name}`, sub: "Direkt mesaj" });
      }
    }
    for (const u of [...state.online, ...state.friends]) {
      if (!q || u.name.toLowerCase().includes(q)) {
        items.push({ kind: "user", id: u.id, label: u.name, sub: u.activity || STATUS[u.status] || "kullanıcı" });
      }
    }
    const list = items.slice(0, 12);
    if (state.quickIndex >= list.length) state.quickIndex = 0;
    results.innerHTML = list.length
      ? list
          .map(
            (it, i) =>
              `<button type="button" class="quick-item ${i === state.quickIndex ? "on" : ""}" data-qi="${i}" data-kind="${it.kind}" data-id="${esc(it.id)}"><strong>${esc(it.label)}</strong><small>${esc(it.sub)}</small></button>`,
          )
          .join("")
      : `<p style="padding:12px;color:var(--text-3)">Sonuç yok</p>`;
    results.querySelectorAll("[data-qi]").forEach((btn) => {
      btn.onclick = () => activateQuick(btn.dataset.kind, btn.dataset.id);
    });
    openQuickSwitch._list = list;
  };
  paint();
  input.oninput = paint;
  input.onkeydown = async (e) => {
    const list = openQuickSwitch._list || [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      state.quickIndex = Math.min(list.length - 1, state.quickIndex + 1);
      paint();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      state.quickIndex = Math.max(0, state.quickIndex - 1);
      paint();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = list[state.quickIndex];
      if (it) await activateQuick(it.kind, it.id);
    } else if (e.key === "Escape") {
      box.classList.add("hidden");
    }
  };
  setTimeout(() => input.focus(), 0);
}

async function activateQuick(kind, id) {
  $("quickSwitch")?.classList.add("hidden");
  if (kind === "channel" || kind === "dm") {
    if (kind === "dm") {
      state.view = "dms";
      state.dmTab = "dms";
    } else {
      const ch = state.channels.find((c) => c.id === id);
      if (ch) {
        state.view = "guild";
        state.guildId = ch.guildId;
      }
    }
    await switchChannel(id);
    renderRail();
    return;
  }
  if (kind === "user") {
    const dm = await api("/xzon/api/dms", { method: "POST", body: { userId: id } });
    state.view = "dms";
    state.dmTab = "dms";
    state.dms = (await api("/xzon/api/dms")).dms || [];
    await switchChannel(dm.channelId);
    renderRail();
    renderSidebar();
  }
}

async function openDiscover() {
  const modal = $("discoverModal");
  const list = $("discoverList");
  if (!modal || !list) return;
  modal.classList.remove("hidden");
  list.innerHTML = `<p style="color:var(--text-3)">Yükleniyor…</p>`;
  try {
    const data = await api("/xzon/api/discover");
    const guilds = data.guilds || [];
    list.innerHTML = guilds.length
      ? guilds
          .map(
            (g) => `<div class="discover-card">
              <div class="av" style="background:${g.color}">${esc(g.short || "?")}</div>
              <div class="meta"><strong>${esc(g.name)}</strong><span>${g.memberCount || 0} üye · Boost Lv.${g.boostLevel || 0}</span></div>
              <button type="button" class="join" data-join="${esc(g.invite || "")}">Katıl</button>
            </div>`,
          )
          .join("")
      : `<p style="color:var(--text-3)">Keşfedilecek sunucu yok — kendi sunucunu kur.</p>`;
    list.querySelectorAll("[data-join]").forEach((btn) => {
      btn.onclick = async () => {
        try {
          const data2 = await api("/xzon/api/guilds/join", { method: "POST", body: { code: btn.dataset.join } });
          state.guilds = data2.guilds || state.guilds;
          state.channels = data2.channels || state.channels;
          modal.classList.add("hidden");
          if (data2.guild?.id) await openGuild(data2.guild.id);
          toast(`Katıldın: ${data2.guild?.name || ""}`);
        } catch (error) {
          toast(error.message);
        }
      };
    });
  } catch (error) {
    list.innerHTML = `<p style="color:#ff8a95">${esc(error.message)}</p>`;
  }
}

function openCtxMenu(messageId, x, y) {
  const msg = state.messages.find((m) => m.id === messageId);
  if (!msg || !els.ctxMenu) return;
  const mine = msg.userId === state.user?.id;
  const item = (c, label, icon, danger = false) =>
    `<button type="button" class="${danger ? "danger" : ""}" data-c="${c}"><span class="ctx-ic">${icon}</span><span>${label}</span></button>`;
  els.ctxMenu.innerHTML = `
    ${item("reply", "Yanıtla", ICON.reply)}
    ${item("react", "Tepki ekle", ICON.react)}
    ${item("pin", msg.pinned ? "Sabiti kaldır" : "Sabitle", ICON.pin)}
    ${item("copy", "Mesajı kopyala", ICON.copy)}
    ${item("forward", "İlet", ICON.more)}
    ${item("report", "Bildir", ICON.pin)}
    ${mine ? item("edit", "Düzenle", ICON.edit) : ""}
    ${mine ? item("delete", "Mesajı sil", ICON.trash, true) : ""}
  `;
  els.ctxMenu.classList.remove("hidden");
  const w = 250;
  const h = 340;
  els.ctxMenu.style.left = `${Math.min(window.innerWidth - w - 8, Math.max(8, x))}px`;
  els.ctxMenu.style.top = `${Math.min(window.innerHeight - h - 8, Math.max(8, y))}px`;
  els.ctxMenu.querySelectorAll("[data-c]").forEach((btn) => {
    btn.onclick = async () => {
      els.ctxMenu.classList.add("hidden");
      const c = btn.dataset.c;
      if (c === "reply") startReply(messageId);
      if (c === "react") showEmoji(els.sendBtn, (emoji) => react(messageId, emoji));
      if (c === "pin") pin(messageId);
      if (c === "copy") copyMessage(messageId);
      if (c === "edit") startEdit(messageId);
      if (c === "delete") removeMsg(messageId);
      if (c === "forward") {
        const to = prompt("İletilecek kanal id (örn. genel veya dm:...)");
        if (!to) return;
        try {
          await api(`/xzon/api/messages/${messageId}/forward`, { method: "POST", body: { channelId: to } });
          toast("Mesaj iletildi");
        } catch (error) {
          toast(error.message);
        }
      }
      if (c === "report") {
        const reason = prompt("Bildirme nedeni", "Spam / uygunsuz");
        if (reason == null) return;
        try {
          await api("/xzon/api/reports", { method: "POST", body: { messageId, reason } });
          toast("Bildirim alındı");
        } catch (error) {
          toast(error.message);
        }
      }
    };
  });
}

async function copyMessage(id) {
  const msg = state.messages.find((m) => m.id === id);
  if (!msg) return;
  try {
    await navigator.clipboard.writeText(msg.content);
    toast("Mesaj kopyalandı");
  } catch {
    toast(msg.content.slice(0, 80));
  }
}

function openLightbox(src) {
  if (!els.lightbox) return;
  els.lightbox.innerHTML = `<img src="${esc(src)}" alt="önizleme" /><button type="button" class="settings-x" style="position:fixed;top:16px;right:16px" id="closeLightbox">✕</button>`;
  els.lightbox.classList.remove("hidden");
  $("closeLightbox")?.addEventListener("click", () => els.lightbox.classList.add("hidden"));
  els.lightbox.onclick = (e) => {
    if (e.target === els.lightbox) els.lightbox.classList.add("hidden");
  };
}

function updateMentionPop() {
  const ta = els.messageInput;
  const val = ta.value;
  const caret = ta.selectionStart || val.length;
  const left = val.slice(0, caret);
  const m = left.match(/@([\wğüşıöçĞÜŞİÖÇ]{0,24})$/i);
  if (!m) {
    els.mentionPop?.classList.add("hidden");
    return;
  }
  const q = m[1].toLowerCase();
  const people = [...state.online, ...state.offline]
    .filter((u) => u.id !== state.user?.id && u.name.toLowerCase().includes(q))
    .slice(0, 6);
  if (!people.length) {
    els.mentionPop?.classList.add("hidden");
    return;
  }
  els.mentionPop.innerHTML = people
    .map(
      (u) =>
        `<button type="button" data-mention="${esc(u.name)}"><div class="av ${u.status}" style="width:24px;height:24px;font-size:11px;background:${u.color}">${initials(u.name)}</div><span>${esc(u.name)}</span></button>`,
    )
    .join("");
  const rect = ta.getBoundingClientRect();
  els.mentionPop.style.left = `${rect.left}px`;
  els.mentionPop.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  els.mentionPop.style.top = "auto";
  els.mentionPop.classList.remove("hidden");
  els.mentionPop.querySelectorAll("[data-mention]").forEach((btn) => {
    btn.onclick = () => {
      const name = btn.dataset.mention;
      const before = left.replace(/@([\wğüşıöçĞÜŞİÖÇ]{0,24})$/i, `@${name} `);
      ta.value = before + val.slice(caret);
      els.mentionPop.classList.add("hidden");
      resizeComposer();
      ta.focus();
    };
  });
}

async function openInbox() {
  const data = await api("/xzon/api/inbox");
  els.sheetTitle.textContent = "Gelen kutusu · Bahsetmeler";
  els.pinsList.innerHTML = data.mentions?.length
    ? data.mentions
        .map(
          (m) =>
            `<button type="button" class="inbox-item" data-jump="${esc(m.channelId)}"><strong>${esc(m.userName)} · ${esc(m.channelId)}</strong>${esc(m.content).slice(0, 140)}</button>`,
        )
        .join("")
    : `<p style="padding:12px;color:var(--text-3)">Henüz bahsetme yok. Biri seni @isim ile etiketleyince burada görünür.</p>`;
  els.pinsDrawer.classList.remove("hidden");
  els.pinsList.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.onclick = async () => {
      els.pinsDrawer.classList.add("hidden");
      await switchChannel(btn.dataset.jump);
    };
  });
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
  es.addEventListener("channel_create", (ev) => {
    try {
      const { channel } = JSON.parse(ev.data);
      if (!channel) return;
      if (!state.channels.some((c) => c.id === channel.id)) state.channels.push(channel);
      renderSidebar();
    } catch { /* ignore */ }
  });
  es.addEventListener("channel_update", (ev) => {
    try {
      const { channel } = JSON.parse(ev.data);
      if (!channel) return;
      state.channels = state.channels.map((c) => (c.id === channel.id ? channel : c));
      renderSidebar();
    } catch { /* ignore */ }
  });
  es.addEventListener("channel_delete", (ev) => {
    try {
      const { channelId } = JSON.parse(ev.data);
      state.channels = state.channels.filter((c) => c.id !== channelId);
      renderSidebar();
    } catch { /* ignore */ }
  });
  es.addEventListener("guild_update", (ev) => {
    try {
      const { guild } = JSON.parse(ev.data);
      if (!guild) return;
      state.guilds = state.guilds.map((g) =>
        g.id === guild.id ? { ...g, ...guild, myRole: g.myRole } : g,
      );
      renderRail();
      renderSidebar();
    } catch { /* ignore */ }
  });
  es.addEventListener("guild_delete", (ev) => {
    try {
      const { guildId } = JSON.parse(ev.data);
      state.guilds = state.guilds.filter((g) => g.id !== guildId);
      state.channels = state.channels.filter((c) => c.guildId !== guildId);
      if (state.guildId === guildId) openGuild("xzon");
      else {
        renderRail();
        renderSidebar();
      }
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
  const [{ user: u }, noteData] = await Promise.all([
    api(`/xzon/api/users/${userId}`),
    api(`/xzon/api/notes/${userId}`).catch(() => ({ note: "" })),
  ]);
  const pop = els.profilePop;
  const nitro = u.nitroTier && u.nitroTier !== "none";
  const isFriend = state.friends.some((f) => f.id === u.id);
  const pendingOut = state.friendOutgoing.some((f) => f.id === u.id);
  const blocked = state.blocks.some((b) => b.id === u.id);
  pop.classList.toggle("nitro", Boolean(nitro));
  pop.innerHTML = `
    <div class="banner" style="background:linear-gradient(135deg,${u.accent || u.color},${u.color},#1e1f22)"></div>
    <div class="av ${u.status}" style="background:${u.accent || u.color}">${initials(u.name)}</div>
    <div class="pad">
      <h2>${esc(u.name)}</h2>
      <p class="tag">${esc(u.name)}#${esc(u.tag || "0000")}</p>
      ${nitro ? `<span class="nitro-badge">${esc(u.badge || "NITRO")}</span>` : ""}
      ${u.activity ? `<div class="activity-pill">▶ ${esc(u.activity)}</div>` : ""}
      <div class="card"><h4>Hakkında</h4><p>${esc(u.bio || "—")}</p></div>
      <div class="card"><h4>Durum</h4><p>${esc(u.customStatus || STATUS[u.status] || "—")}</p></div>
      <div class="card"><h4>Notum</h4><p id="noteView">${esc(noteData.note || "—")}</p></div>
      <div class="actions">
        ${
          u.id !== state.user.id
            ? `<button type="button" id="dmFromProfile">Mesaj</button>
               <button type="button" id="friendFromProfile">${isFriend ? "Arkadaş" : pendingOut ? "İstek gitti" : "Arkadaş ekle"}</button>
               <button type="button" class="ghost" id="noteFromProfile">Not</button>
               <button type="button" class="ghost" id="blockFromProfile">${blocked ? "Engeli kaldır" : "Engelle"}</button>`
            : `<button type="button" class="ghost" id="editFromProfile">Profili Düzenle</button>
               <button type="button" class="ghost" id="activityFromProfile">Aktivite</button>`
        }
      </div>
    </div>`;
  pop.style.left = `${Math.max(8, Math.min(window.innerWidth - 320, (event?.clientX || 200) + 8))}px`;
  pop.style.top = `${Math.max(8, Math.min(window.innerHeight - 420, (event?.clientY || 100) - 20))}px`;
  pop.classList.remove("hidden");
  $("dmFromProfile")?.addEventListener("click", async () => {
    const dm = await api("/xzon/api/dms", { method: "POST", body: { userId: u.id } });
    state.view = "dms";
    state.dmTab = "dms";
    state.dms = (await api("/xzon/api/dms")).dms || [];
    pop.classList.add("hidden");
    await switchChannel(dm.channelId);
    renderRail();
  });
  $("friendFromProfile")?.addEventListener("click", async () => {
    if (isFriend || pendingOut) return;
    try {
      const data = await api("/xzon/api/friends", { method: "POST", body: { userId: u.id } });
      state.friends = data.friends || state.friends;
      state.friendOutgoing = data.outgoing || state.friendOutgoing;
      toast(data.status === "accepted" ? "Arkadaş oldunuz" : "İstek gönderildi");
      pop.classList.add("hidden");
    } catch (error) {
      toast(error.message);
    }
  });
  $("noteFromProfile")?.addEventListener("click", async () => {
    const note = prompt("Bu kullanıcı için not", noteData.note || "");
    if (note == null) return;
    const data = await api(`/xzon/api/notes/${u.id}`, { method: "PUT", body: { note } });
    $("noteView").textContent = data.note || "—";
    toast("Not kaydedildi");
  });
  $("blockFromProfile")?.addEventListener("click", async () => {
    if (blocked) {
      const data = await api(`/xzon/api/blocks/${u.id}`, { method: "DELETE" });
      state.blocks = data.blocks || [];
      toast("Engel kaldırıldı");
    } else if (confirm(`${u.name} engellensin mi?`)) {
      const data = await api("/xzon/api/blocks", { method: "POST", body: { userId: u.id } });
      state.blocks = data.blocks || [];
      toast("Engellendi");
    }
    pop.classList.add("hidden");
  });
  $("editFromProfile")?.addEventListener("click", () => {
    pop.classList.add("hidden");
    openSettings("profile");
  });
  $("activityFromProfile")?.addEventListener("click", async () => {
    const activity = prompt("Ne yapıyorsun? (aktivite)", state.user.activity || "");
    if (activity == null) return;
    state.user = (await api("/xzon/api/me", { method: "PATCH", body: { activity } })).user;
    syncMe();
    pop.classList.add("hidden");
    toast("Aktivite güncellendi");
  });
}

function openGuildModal(tab = "create") {
  let selected = GUILD_COLORS[0];
  const paint = () => {
    document.querySelectorAll("#guildTabs [data-gtab]").forEach((b) => {
      b.classList.toggle("on", b.dataset.gtab === tab);
    });
    if (tab === "join") {
      els.guildModalBody.innerHTML = `
        <h2>Davet ile katıl</h2>
        <p class="sub">Arkadaşının davet kodunu yapıştır. Örn. <code>xzon-xzon</code> veya özel kod.</p>
        <label>Davet kodu<input id="inviteCodeInput" placeholder="abcd1234" maxlength="40" /></label>
        <div class="modal-actions"><button type="button" class="btn-primary" id="joinGuildSubmit">Sunucuya Katıl</button></div>`;
      $("joinGuildSubmit")?.addEventListener("click", async () => {
        try {
          const data = await api("/xzon/api/guilds/join", {
            method: "POST",
            body: { code: $("inviteCodeInput").value },
          });
          state.guilds = data.guilds || state.guilds;
          state.channels = data.channels || state.channels;
          els.guildModal.classList.add("hidden");
          toast(`Katıldın: ${data.guild?.name || "Sunucu"}`);
          if (data.guild?.id) await openGuild(data.guild.id);
          else {
            renderRail();
            renderSidebar();
          }
        } catch (error) {
          toast(error.message);
        }
      });
      return;
    }
    els.guildModalBody.innerHTML = `
      <h2>Sunucunu kur</h2>
      <p class="sub">Kendi topluluğunu oluştur. Kanallar, davet ve boost hazır gelir.</p>
      <label>Sunucu adı<input id="guildNameInput" maxlength="40" placeholder="Örn. Nova Crew" /></label>
      <label>Renk
        <div class="color-row" id="guildColorRow">
          ${GUILD_COLORS.map(
            (c, i) =>
              `<button type="button" class="color-swatch ${i === 0 ? "on" : ""}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`,
          ).join("")}
        </div>
      </label>
      <div class="modal-actions"><button type="button" class="btn-primary" id="createGuildSubmit">Sunucu Oluştur</button></div>`;
    $("guildColorRow")?.querySelectorAll("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selected = btn.dataset.color;
        $("guildColorRow").querySelectorAll(".color-swatch").forEach((b) => b.classList.remove("on"));
        btn.classList.add("on");
      });
    });
    $("createGuildSubmit")?.addEventListener("click", async () => {
      try {
        const data = await api("/xzon/api/guilds", {
          method: "POST",
          body: { name: $("guildNameInput").value, color: selected },
        });
        state.guilds = data.guilds || state.guilds;
        state.channels = data.channels || state.channels;
        els.guildModal.classList.add("hidden");
        toast(`Sunucu hazır · davet: ${data.invite}`);
        if (data.invite) {
          try {
            await navigator.clipboard.writeText(data.invite);
          } catch { /* ignore */ }
        }
        if (data.guild?.id) await openGuild(data.guild.id);
      } catch (error) {
        toast(error.message);
      }
    });
  };
  paint();
  document.querySelectorAll("#guildTabs [data-gtab]").forEach((btn) => {
    btn.onclick = () => {
      tab = btn.dataset.gtab;
      paint();
    };
  });
  els.guildModal.classList.remove("hidden");
}

function openNitroModal() {
  els.nitroModal.classList.remove("hidden");
  $("nitroPayForm")?.classList.add("hidden");
  const status = $("nitroStatus");
  if (status) {
    if (state.user?.isGuest) {
      status.textContent = "Nitro için önce hesap oluştur (kullanıcı adı + şifre).";
    } else if (state.user?.nitroTier && state.user.nitroTier !== "none") {
      const exp = state.user.nitroExpiresAt
        ? new Date(state.user.nitroExpiresAt).toLocaleDateString("tr-TR")
        : "—";
      status.textContent = `Aktif: ${state.user.nitroTier.toUpperCase()} · bitiş ${exp}`;
    } else {
      status.textContent = "Plan seç → kart bilgisi → öde (₺49 / ₺99).";
    }
  }
}

async function copyInvite(guildId) {
  try {
    const data = await api(`/xzon/api/guilds/${guildId}/invite`, { method: "POST", body: {} });
    const code = data.code;
    try {
      await navigator.clipboard.writeText(code);
      toast(`Davet kopyalandı: ${code}`);
    } catch {
      toast(`Davet kodu: ${code}`);
    }
  } catch (error) {
    toast(error.message);
  }
}

async function boostCurrentGuild(guildId) {
  try {
    if (!state.user?.nitroTier || state.user.nitroTier === "none") {
      openNitroModal();
      toast("Boost için önce Nitro aç");
      return;
    }
    const data = await api(`/xzon/api/guilds/${guildId}/boost`, { method: "POST", body: {} });
    if (data.guilds) state.guilds = data.guilds;
    else if (data.guild) {
      state.guilds = state.guilds.map((g) => (g.id === data.guild.id ? data.guild : g));
    }
    renderRail();
    renderSidebar();
    toast("Sunucu boostlandı ✦");
  } catch (error) {
    toast(error.message);
  }
}

async function createChannelPrompt(guildId) {
  const name = prompt("Yeni kanal adı (ör. duyuru-2)");
  if (!name) return;
  const voice = confirm("Ses kanalı olsun mu? (İptal = metin)");
  const cats = [
    ...new Set(state.channels.filter((c) => c.guildId === guildId).map((c) => c.category)),
  ];
  const category =
    prompt(`Kategori (${cats.join(", ") || "SOHBET"})`, cats[0] || (voice ? "SESLİ" : "SOHBET")) ||
    undefined;
  try {
    const data = await api(`/xzon/api/guilds/${guildId}/channels`, {
      method: "POST",
      body: { name, type: voice ? "voice" : "text", category },
    });
    state.channels = data.channels || [...state.channels, data.channel];
    renderSidebar();
    if (data.channel?.type === "text") await switchChannel(data.channel.id);
    toast(`#${data.channel?.name || name} oluşturuldu`);
  } catch (error) {
    toast(error.message);
  }
}

async function createCategoryPrompt(guildId) {
  const name = prompt("Yeni kategori adı (ör. OYUN)");
  if (!name) return;
  try {
    const data = await api(`/xzon/api/guilds/${guildId}/categories`, {
      method: "POST",
      body: { name },
    });
    state.channels = data.channels || state.channels;
    renderSidebar();
    toast(`Kategori: ${name.toUpperCase()}`);
  } catch (error) {
    toast(error.message);
  }
}

function openChannelSettings(channelId) {
  const ch = state.channels.find((c) => c.id === channelId);
  if (!ch || !els.channelSettingsModal) return;
  $("channelSettingsTitle").textContent = `#${ch.name}`;
  els.channelSettingsBody.innerHTML = `
    <label>Kanal adı<input id="chNameIn" value="${esc(ch.name)}" maxlength="32" /></label>
    <label>Konu<input id="chTopicIn" value="${esc(ch.topic || "")}" maxlength="120" /></label>
    <label>Kategori<input id="chCatIn" value="${esc(ch.category || "SOHBET")}" maxlength="24" /></label>
    <label>Tür
      <select id="chTypeIn">
        <option value="text" ${ch.type === "text" ? "selected" : ""}>Metin</option>
        <option value="voice" ${ch.type === "voice" ? "selected" : ""}>Ses</option>
      </select>
    </label>
    <label>Yavaş mod (sn)<input id="chSlowIn" type="number" min="0" max="120" value="${ch.slowmode || 0}" /></label>
    <label class="check-row"><input id="chNsfwIn" type="checkbox" ${ch.nsfw ? "checked" : ""} /> NSFW kanal</label>
    <div class="modal-actions">
      <button type="button" class="btn-primary" id="chSaveBtn">Kaydet</button>
      <button type="button" class="btn-danger" id="chDelBtn">Sil</button>
    </div>`;
  els.channelSettingsModal.classList.remove("hidden");
  $("chSaveBtn").onclick = async () => {
    try {
      const data = await api(`/xzon/api/channels/${ch.id}`, {
        method: "PATCH",
        body: {
          name: $("chNameIn").value,
          topic: $("chTopicIn").value,
          category: $("chCatIn").value,
          type: $("chTypeIn").value,
          slowmode: Number($("chSlowIn").value) || 0,
          nsfw: $("chNsfwIn").checked,
        },
      });
      state.channels = data.channels || state.channels;
      els.channelSettingsModal.classList.add("hidden");
      renderSidebar();
      if (state.channelId === ch.id) {
        els.channelTitle.textContent = data.channel?.name || ch.name;
        els.channelTopic.textContent = data.channel?.topic || "";
      }
      toast("Kanal güncellendi");
    } catch (error) {
      toast(error.message);
    }
  };
  $("chDelBtn").onclick = async () => {
    if (!confirm(`#${ch.name} silinsin mi?`)) return;
    try {
      const data = await api(`/xzon/api/channels/${ch.id}`, { method: "DELETE" });
      state.channels = data.channels || state.channels.filter((c) => c.id !== ch.id);
      els.channelSettingsModal.classList.add("hidden");
      if (state.channelId === ch.id) {
        const next = state.channels.find((c) => c.guildId === ch.guildId && c.type === "text");
        if (next) await switchChannel(next.id);
      }
      renderSidebar();
      toast("Kanal silindi");
    } catch (error) {
      toast(error.message);
    }
  };
}

async function openServerSettings(guildId, tab = "overview") {
  const guild = state.guilds.find((g) => g.id === guildId);
  if (!guild?.custom || !els.serverSettingsModal) return;
  state.serverTab = tab;
  await refreshGuildMeta(guildId);
  const manage = canManageGuild(guild);
  const tabs = [
    ["overview", "Genel"],
    ["channels", "Kanallar"],
    ["roles", "Roller"],
    ["members", "Üyeler"],
    ["invites", "Davetler"],
    ["danger", "Tehlike"],
  ];
  els.serverSettingsNav.innerHTML = `
    <div class="ss-brand">
      <div class="av" style="background:${esc(guild.color)}">${esc(guild.short || "SV")}</div>
      <div><strong>${esc(guild.name)}</strong><small>Sunucu ayarları</small></div>
    </div>
    ${tabs
      .map(
        ([id, label]) =>
          `<button type="button" data-stab="${id}" class="${state.serverTab === id ? "on" : ""}">${label}</button>`,
      )
      .join("")}`;
  els.serverSettingsNav.querySelectorAll("[data-stab]").forEach((btn) => {
    btn.onclick = () => openServerSettings(guildId, btn.dataset.stab);
  });

  let pane = "";
  if (tab === "overview") {
    pane = `
      <h2>Sunucu Genel</h2>
      <p class="sub">İsim, renk ve açıklama — Discord Server Settings tarzı.</p>
      <label>Sunucu adı<input id="ssName" value="${esc(guild.name)}" maxlength="40" ${manage ? "" : "disabled"} /></label>
      <label>Açıklama<textarea id="ssDesc" rows="3" maxlength="200" ${manage ? "" : "disabled"}>${esc(guild.description || "")}</textarea></label>
      <div class="color-row" id="ssColors">
        ${GUILD_COLORS.map(
          (c) =>
            `<button type="button" class="color-swatch ${c === guild.color ? "on" : ""}" data-c="${c}" style="background:${c}" ${manage ? "" : "disabled"}></button>`,
        ).join("")}
      </div>
      ${manage ? `<div class="modal-actions"><button type="button" class="btn-primary" id="ssSave">Kaydet</button></div>` : `<p class="sub">Sadece owner/admin düzenleyebilir.</p>`}`;
  } else if (tab === "channels") {
    const list = state.channels.filter((c) => c.guildId === guildId);
    pane = `
      <h2>Kanallar</h2>
      <p class="sub">${list.length} kanal · kategori ve yavaş mod</p>
      <div class="ss-list">
        ${list
          .map(
            (ch) => `<div class="ss-row">
              <div><strong>${ch.type === "voice" ? "🔊" : "#"}${esc(ch.name)}</strong><small>${esc(ch.category)} · ${ch.slowmode || 0}s${ch.nsfw ? " · NSFW" : ""}</small></div>
              ${manage ? `<button type="button" data-edch="${ch.id}">Düzenle</button>` : ""}
            </div>`,
          )
          .join("")}
      </div>
      ${manage ? `<div class="modal-actions">
        <button type="button" class="btn-primary" id="ssAddCh">+ Kanal</button>
        <button type="button" class="btn-ghost" id="ssAddCat">+ Kategori</button>
      </div>` : ""}`;
  } else if (tab === "roles") {
    pane = `
      <h2>Roller</h2>
      <p class="sub">Renkli display roller · yetki: owner / admin / mod / member</p>
      <div class="ss-list">
        ${
          state.guildRoles.length
            ? state.guildRoles
                .map(
                  (r) => `<div class="ss-row">
                    <div class="role-pill" style="--rc:${esc(r.color)}"><i></i><strong>${esc(r.name)}</strong></div>
                    ${manage ? `<button type="button" data-delrole="${r.id}">Sil</button>` : ""}
                  </div>`,
                )
                .join("")
            : `<p class="sub">Henüz özel rol yok.</p>`
        }
      </div>
      ${manage ? `<div class="role-create">
        <input id="ssRoleName" placeholder="Rol adı" maxlength="32" />
        <input id="ssRoleColor" type="color" value="#5865f2" />
        <button type="button" class="btn-primary" id="ssRoleAdd">Rol ekle</button>
      </div>` : ""}`;
  } else if (tab === "members") {
    pane = `
      <h2>Üyeler</h2>
      <p class="sub">${state.guildMembers.length} üye · yetki ve display rol</p>
      <div class="ss-list">
        ${state.guildMembers
          .map((m) => {
            const roleOpts = ["admin", "mod", "member"]
              .map(
                (r) =>
                  `<option value="${r}" ${m.guildRole === r ? "selected" : ""} ${m.guildRole === "owner" ? "disabled" : ""}>${r}</option>`,
              )
              .join("");
            const displayOpts = `<option value="">—</option>${state.guildRoles
              .map(
                (r) =>
                  `<option value="${r.id}" ${m.displayRole?.id === r.id ? "selected" : ""}>${esc(r.name)}</option>`,
              )
              .join("")}`;
            return `<div class="ss-row member-manage">
              <div class="av" style="background:${esc(m.color)}">${initials(m.name)}</div>
              <div class="meta"><strong>${esc(m.name)}</strong><small>${esc(m.guildRole)}</small></div>
              ${
                manage && m.guildRole !== "owner"
                  ? `<select data-mrole="${m.id}">${roleOpts}</select>
                     <select data-drole="${m.id}">${displayOpts}</select>
                     <button type="button" class="btn-danger-sm" data-kick="${m.id}">At</button>`
                  : `<span class="role-tag owner">${esc(m.guildRole)}</span>`
              }
            </div>`;
          })
          .join("")}
      </div>`;
  } else if (tab === "invites") {
    let invites = [];
    try {
      invites = (await api(`/xzon/api/guilds/${guildId}/invites`)).invites || [];
    } catch {
      invites = [];
    }
    pane = `
      <h2>Davetler</h2>
      <p class="sub">Davet kodlarını yönet</p>
      <div class="ss-list">
        ${invites
          .map(
            (inv) => `<div class="ss-row">
              <div><strong>${esc(inv.code)}</strong><small>${inv.uses || 0} kullanım</small></div>
              <button type="button" data-copyinv="${esc(inv.code)}">Kopyala</button>
              ${manage && !String(inv.code).startsWith("xzon-") ? `<button type="button" data-revinv="${esc(inv.code)}">İptal</button>` : ""}
            </div>`,
          )
          .join("") || `<p class="sub">Davet yok.</p>`}
      </div>
      <div class="modal-actions"><button type="button" class="btn-primary" id="ssNewInv">Yeni davet</button></div>`;
  } else {
    pane = `
      <h2>Tehlikeli bölge</h2>
      <p class="sub">Sahiplik devri veya sunucuyu kalıcı silme.</p>
      ${
        guild.myRole === "owner"
          ? `<label>Sahipliği devret
              <select id="ssTransfer">
                <option value="">Üye seç…</option>
                ${state.guildMembers
                  .filter((m) => m.id !== state.user?.id)
                  .map((m) => `<option value="${m.id}">${esc(m.name)}</option>`)
                  .join("")}
              </select>
            </label>
            <div class="modal-actions">
              <button type="button" class="btn-ghost" id="ssDoTransfer">Devret</button>
              <button type="button" class="btn-danger" id="ssDoDelete">Sunucuyu sil</button>
            </div>`
          : `<p class="sub">Bu işlemler sadece sahip için.</p>
             <div class="modal-actions"><button type="button" class="btn-danger" id="ssDoLeave">Sunucudan çık</button></div>`
      }`;
  }

  els.serverSettingsPane.innerHTML = pane;
  els.serverSettingsModal.classList.remove("hidden");

  let pickedColor = guild.color;
  els.serverSettingsPane.querySelectorAll("[data-c]").forEach((btn) => {
    btn.onclick = () => {
      pickedColor = btn.dataset.c;
      els.serverSettingsPane.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("on", b === btn));
    };
  });
  $("ssSave")?.addEventListener("click", async () => {
    try {
      const data = await api(`/xzon/api/guilds/${guildId}`, {
        method: "PATCH",
        body: {
          name: $("ssName").value,
          description: $("ssDesc").value,
          color: pickedColor,
        },
      });
      state.guilds = data.guilds || state.guilds;
      renderRail();
      renderSidebar();
      toast("Sunucu kaydedildi");
      openServerSettings(guildId, "overview");
    } catch (error) {
      toast(error.message);
    }
  });
  $("ssAddCh")?.addEventListener("click", () => createChannelPrompt(guildId));
  $("ssAddCat")?.addEventListener("click", () => createCategoryPrompt(guildId));
  els.serverSettingsPane.querySelectorAll("[data-edch]").forEach((btn) => {
    btn.onclick = () => {
      els.serverSettingsModal.classList.add("hidden");
      openChannelSettings(btn.dataset.edch);
    };
  });
  $("ssRoleAdd")?.addEventListener("click", async () => {
    try {
      const data = await api(`/xzon/api/guilds/${guildId}/roles`, {
        method: "POST",
        body: { name: $("ssRoleName").value, color: $("ssRoleColor").value },
      });
      state.guildRoles = data.roles || [];
      toast("Rol eklendi");
      openServerSettings(guildId, "roles");
    } catch (error) {
      toast(error.message);
    }
  });
  els.serverSettingsPane.querySelectorAll("[data-delrole]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Rol silinsin mi?")) return;
      try {
        const data = await api(`/xzon/api/guilds/${guildId}/roles/${btn.dataset.delrole}`, {
          method: "DELETE",
        });
        state.guildRoles = data.roles || [];
        openServerSettings(guildId, "roles");
      } catch (error) {
        toast(error.message);
      }
    };
  });
  els.serverSettingsPane.querySelectorAll("[data-mrole]").forEach((sel) => {
    sel.onchange = async () => {
      try {
        const data = await api(`/xzon/api/guilds/${guildId}/members/${sel.dataset.mrole}`, {
          method: "PATCH",
          body: { guildRole: sel.value },
        });
        state.guildMembers = data.members || [];
        renderMembers();
        toast("Yetki güncellendi");
      } catch (error) {
        toast(error.message);
        openServerSettings(guildId, "members");
      }
    };
  });
  els.serverSettingsPane.querySelectorAll("[data-drole]").forEach((sel) => {
    sel.onchange = async () => {
      try {
        const data = await api(`/xzon/api/guilds/${guildId}/members/${sel.dataset.drole}`, {
          method: "PATCH",
          body: { roleId: sel.value || null },
        });
        state.guildMembers = data.members || [];
        renderMembers();
        renderMessages();
        toast("Display rol atandı");
      } catch (error) {
        toast(error.message);
      }
    };
  });
  els.serverSettingsPane.querySelectorAll("[data-kick]").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Üye atılsın mı?")) return;
      try {
        const data = await api(
          `/xzon/api/guilds/${guildId}/members/${btn.dataset.kick}/kick`,
          { method: "POST", body: {} },
        );
        state.guildMembers = data.members || [];
        openServerSettings(guildId, "members");
        toast("Üye atıldı");
      } catch (error) {
        toast(error.message);
      }
    };
  });
  $("ssNewInv")?.addEventListener("click", async () => {
    await copyInvite(guildId);
    openServerSettings(guildId, "invites");
  });
  els.serverSettingsPane.querySelectorAll("[data-copyinv]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copyinv);
        toast("Kopyalandı");
      } catch {
        toast(btn.dataset.copyinv);
      }
    };
  });
  els.serverSettingsPane.querySelectorAll("[data-revinv]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/xzon/api/guilds/${guildId}/invites/${btn.dataset.revinv}`, {
          method: "DELETE",
        });
        openServerSettings(guildId, "invites");
        toast("Davet iptal");
      } catch (error) {
        toast(error.message);
      }
    };
  });
  $("ssDoTransfer")?.addEventListener("click", async () => {
    const uid = $("ssTransfer")?.value;
    if (!uid || !confirm("Sahiplik devredilsin mi?")) return;
    try {
      const data = await api(`/xzon/api/guilds/${guildId}/transfer`, {
        method: "POST",
        body: { userId: uid },
      });
      state.guilds = data.guilds || state.guilds;
      state.guildMembers = data.members || [];
      renderRail();
      renderSidebar();
      toast("Sahiplik devredildi");
      els.serverSettingsModal.classList.add("hidden");
    } catch (error) {
      toast(error.message);
    }
  });
  $("ssDoDelete")?.addEventListener("click", async () => {
    if (!confirm("Sunucu KALICI silinsin mi?")) return;
    try {
      const data = await api(`/xzon/api/guilds/${guildId}`, { method: "DELETE" });
      state.guilds = data.guilds || [];
      state.channels = data.channels || [];
      els.serverSettingsModal.classList.add("hidden");
      await openGuild("xzon");
      toast("Sunucu silindi");
    } catch (error) {
      toast(error.message);
    }
  });
  $("ssDoLeave")?.addEventListener("click", async () => {
    if (!confirm("Sunucudan çıkılsın mı?")) return;
    try {
      const data = await api(`/xzon/api/guilds/${guildId}/leave`, { method: "POST", body: {} });
      state.guilds = data.guilds || [];
      state.channels = data.channels || [];
      els.serverSettingsModal.classList.add("hidden");
      await openGuild("xzon");
      toast("Çıkıldı");
    } catch (error) {
      toast(error.message);
    }
  });
}

function beginNitroCheckout(tier) {
  if (state.user?.isGuest) {
    toast("Önce hesap oluştur");
    openSettings("account");
    els.nitroModal.classList.add("hidden");
    return;
  }
  $("payTier").value = tier === "classic" ? "classic" : "full";
  $("nitroPayForm")?.classList.remove("hidden");
  $("nitroStatus").textContent =
    tier === "classic" ? "Classic · ₺49 / 30 gün" : "Nitro · ₺99 / 30 gün";
}

async function purchaseNitro(tier, card) {
  const data = await api("/xzon/api/nitro/purchase", {
    method: "POST",
    body: { tier, cardLast4: String(card || "").replace(/\D/g, "").slice(-4) },
  });
  state.user = data.user;
  syncMe();
  els.nitroModal.classList.add("hidden");
  toast(`Ödeme OK · ${data.plan?.label || "Nitro"} aktif`);
  return data;
}

function showEmoji(anchor, onPick, { compose = false } = {}) {
  const pop = els.emojiPop;
  pop.className = "react-panel";
  pop.innerHTML = `
    <header class="react-head">
      <div>
        <strong>XZON Tepkiler</strong>
        <small>${compose ? "Mesaja ekle" : "Özel sticker seti"}</small>
      </div>
      <button type="button" class="icon" id="closeReactPanel" aria-label="Kapat">${ICON.close}</button>
    </header>
    <div class="react-grid">
      ${XZ_REACTIONS.map(
        (r) =>
          `<button type="button" class="react-card" data-e="${r.id}" title="${r.label}" style="--rx:${r.hue}">
            <span class="react-glyph">${xzGlyph(r.id)}</span>
            <span class="react-label">${r.label}</span>
          </button>`,
      ).join("")}
    </div>
    ${
      compose
        ? `<footer class="react-foot">Sticker kısa kodu mesaja eklenir · örn. :xz_fire:</footer>`
        : `<footer class="react-foot">Tepkiler XZON görselleriyle gösterilir</footer>`
    }
  `;
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(360, window.innerWidth - 16);
  const left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.left - 40));
  const top = Math.max(8, rect.top - 320);
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;
  pop.style.width = `${width}px`;
  pop.classList.remove("hidden");
  $("closeReactPanel")?.addEventListener("click", () => pop.classList.add("hidden"));
  pop.querySelectorAll("[data-e]").forEach((btn) => {
    btn.onclick = () => {
      pop.classList.add("hidden");
      onPick(btn.dataset.e);
    };
  });
}

async function openSettings(tab = "account") {
  const tabs = [
    ["account", "Hesabım"],
    ["profile", "Profil"],
    ["billing", "Faturalama"],
    ["nitro", "Nitro"],
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

  let ordersHtml = "";
  if (tab === "billing") {
    try {
      const bill = await api("/xzon/api/billing/orders");
      ordersHtml = (bill.orders || [])
        .map(
          (o) =>
            `<div class="inbox-item"><strong>${esc(o.product)}</strong>₺${o.amount} · ${esc(o.status)} · ${new Date(o.createdAt).toLocaleString("tr-TR")}</div>`,
        )
        .join("") || `<p style="color:var(--text-3)">Henüz sipariş yok.</p>`;
    } catch {
      ordersHtml = `<p style="color:var(--text-3)">Faturalama yüklenemedi.</p>`;
    }
  }

  const accountPane = u.isGuest
    ? `<h2>Misafir hesap</h2>
       <p style="color:var(--text-3);line-height:1.5">Kalıcı hesap için kullanıcı adı + şifre oluştur. E-posta/telefon onayı yok.</p>
       <label>Kullanıcı adı<input id="upUser" maxlength="24" placeholder="nova_xd" /></label>
       <label>Görünen ad<input id="upName" maxlength="24" value="${esc(u.name)}" /></label>
       <label>Şifre<input id="upPass" type="password" minlength="6" /></label>
       <button class="save" id="upgradeAccount" type="button">Hesabı Oluştur</button>`
    : `<h2>Hesabım</h2>
       <p style="color:var(--text-3)">@${esc(u.username || "")} · ${esc(u.name)}#${esc(u.tag)}</p>
       <label>Görünen ad<input id="setName" value="${esc(u.name)}" /></label>
       <button class="save" id="saveAccount" type="button">Kaydet</button>
       <h3 style="margin-top:22px">Şifre değiştir</h3>
       <label>Mevcut şifre<input id="curPass" type="password" /></label>
       <label>Yeni şifre<input id="newPass" type="password" minlength="6" /></label>
       <button class="save" id="savePass" type="button">Şifreyi Güncelle</button>`;

  const panes = {
    account: accountPane,
    profile: `<h2>Profil</h2><label>Hakkında<textarea id="setBio">${esc(u.bio || "")}</textarea></label><label>Özel durum<input id="setCustom" value="${esc(u.customStatus || "")}" maxlength="80" /></label><button class="save" id="saveProfile" type="button">Kaydet</button>`,
    billing: `<h2>Faturalama</h2><p style="color:var(--text-3);margin:0 0 12px">XZON Nitro siparişlerin. Classic ₺49 · Nitro ₺99 / 30 gün.</p>${ordersHtml}<button class="save" id="openNitroFromSettings" type="button" style="margin-top:12px">Nitro Satın Al</button>`,
    nitro: `<h2>XZON Nitro</h2><p style="color:var(--text-3);line-height:1.5;margin:0 0 14px">Durum: <strong>${esc(u.nitroTier || "none")}</strong>${u.nitroExpiresAt ? ` · bitiş ${new Date(u.nitroExpiresAt).toLocaleDateString("tr-TR")}` : ""}</p><button class="save" id="openNitroFromSettings2" type="button">Satın Al / Yenile</button>`,
    status: `<h2>Durum</h2><label>Görünürlük<select id="setStatus">${["online", "idle", "dnd", "invisible"].map((s) => `<option value="${s}" ${u.status === s ? "selected" : ""}>${STATUS[s]}</option>`).join("")}</select></label><label>Aktivite / Playing<input id="setActivity" value="${esc(u.activity || "")}" maxlength="80" placeholder="Valorant oynuyor" /></label><button class="save" id="saveStatus" type="button">Kaydet</button>`,
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
  $("upgradeAccount")?.addEventListener("click", async () => {
    try {
      state.user = (
        await api("/xzon/api/auth/upgrade", {
          method: "POST",
          body: {
            username: $("upUser").value,
            password: $("upPass").value,
            displayName: $("upName").value,
          },
        })
      ).user;
      syncMe();
      renderGuestBanner();
      toast("Hesap oluşturuldu");
      openSettings("account");
    } catch (error) {
      toast(error.message);
    }
  });
  $("savePass")?.addEventListener("click", async () => {
    try {
      await api("/xzon/api/auth/password", {
        method: "POST",
        body: { currentPassword: $("curPass").value, newPassword: $("newPass").value },
      });
      toast("Şifre güncellendi");
    } catch (error) {
      toast(error.message);
    }
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
    state.user = (
      await api("/xzon/api/me", {
        method: "PATCH",
        body: { status: $("setStatus").value, activity: $("setActivity")?.value || "" },
      })
    ).user;
    syncMe();
    toast("Durum güncellendi");
  });
  $("openNitroFromSettings")?.addEventListener("click", () => {
    els.settingsModal.classList.add("hidden");
    openNitroModal();
  });
  $("openNitroFromSettings2")?.addEventListener("click", () => {
    els.settingsModal.classList.add("hidden");
    openNitroModal();
  });
  $("confirmLogout")?.addEventListener("click", logout);
}

function renderGuestBanner() {
  let bar = $("guestBanner");
  if (!state.user?.isGuest) {
    bar?.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "guestBanner";
    bar.className = "guest-banner";
    els.chat?.querySelector(".chat-body")?.prepend(bar);
  }
  bar.innerHTML = `<span>Misafirsin — Nitro ve kalıcı hesap için kayıt ol.</span><button type="button" id="guestUpgradeBtn">Hesap Aç</button>`;
  $("guestUpgradeBtn")?.addEventListener("click", () => openSettings("account"));
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
  syncFab();
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
  state.friends = data.friends || [];
  state.friendIncoming = data.friendIncoming || [];
  state.friendOutgoing = data.friendOutgoing || [];
  state.mutes = data.mutes || [];
  state.blocks = data.blocks || [];

  if (!state.channels.some((c) => c.id === state.channelId) && !String(state.channelId).startsWith("dm:")) {
    state.channelId = "genel";
  }

  els.boot.classList.add("hidden");
  els.app.classList.remove("hidden");
  syncMe();
  await refreshGuildMeta(state.guildId);
  renderRail();
  renderSidebar();
  renderMembers();
  await loadMessages();
  openStream();
  startPresence();
  setLive(true, `canlı · ${state.online.length} online`);
  syncFab();
  renderGuestBanner();
  if (window.matchMedia("(max-width: 900px)").matches) {
    toast("Menü butonu her zaman altta — kaybolmaz");
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
function setAuthTab(tab) {
  document.querySelectorAll("#authTabs [data-auth]").forEach((b) => {
    b.classList.toggle("on", b.dataset.auth === tab);
  });
  $("registerForm")?.classList.toggle("hidden", tab !== "register");
  $("loginForm")?.classList.toggle("hidden", tab !== "login");
  $("joinForm")?.classList.toggle("hidden", tab !== "guest");
  els.bootError?.classList.add("hidden");
}
document.querySelectorAll("#authTabs [data-auth]").forEach((btn) => {
  btn.addEventListener("click", () => setAuthTab(btn.dataset.auth));
});

async function finishAuth(data, hello) {
  state.token = data.token;
  localStorage.setItem("xzon_token", data.token);
  await bootstrap();
  toast(hello);
}

$("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("regBtn").disabled = true;
  els.bootError.classList.add("hidden");
  try {
    const data = await api("/xzon/api/auth/register", {
      method: "POST",
      body: {
        username: $("regUser").value,
        password: $("regPass").value,
        displayName: $("regName").value,
      },
    });
    await finishAuth(data, "Hesap oluşturuldu — XZON’a hoş geldin");
  } catch (error) {
    els.bootError.textContent = error.message;
    els.bootError.classList.remove("hidden");
  } finally {
    $("regBtn").disabled = false;
  }
});

$("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginBtn").disabled = true;
  els.bootError.classList.add("hidden");
  try {
    const data = await api("/xzon/api/auth/login", {
      method: "POST",
      body: { username: $("loginUser").value, password: $("loginPass").value },
    });
    await finishAuth(data, "Tekrar hoş geldin");
  } catch (error) {
    els.bootError.textContent = error.message;
    els.bootError.classList.remove("hidden");
  } finally {
    $("loginBtn").disabled = false;
  }
});

els.joinForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.joinBtn.disabled = true;
  els.bootError.classList.add("hidden");
  try {
    const data = await api("/xzon/api/session", {
      method: "POST",
      body: { name: els.displayName.value },
    });
    await finishAuth(data, "Misafir olarak girdin — hesap açmayı unutma");
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
  resizeComposer();
  updateMentionPop();
  const t = Date.now();
  if (t - state.lastTypingSent < 1400) return;
  state.lastTypingSent = t;
  api("/xzon/api/typing", { method: "POST", body: { channelId: state.channelId } }).catch(() => {});
});

els.messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

els.messages.addEventListener(
  "scroll",
  () => {
    state.stickBottom = nearBottom();
    if (state.stickBottom) els.jumpBtn.classList.add("hidden");
    if (els.messages.scrollTop < 60 && !state.loadingOlder && state.messages.length) {
      state.loadingOlder = true;
      state.stickBottom = false;
      const oldest = state.messages[0]?.createdAt;
      loadMessages({ before: oldest, appendTop: true })
        .catch(() => {})
        .finally(() => {
          state.loadingOlder = false;
        });
    }
  },
  { passive: true },
);

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
els.navOpenBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleNav();
});
els.mobileFab?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleNav();
});
els.navBackdrop?.addEventListener("click", () => closeAllDrawers());
els.membersCloseBtn?.addEventListener("click", () => closeMembersDrawer());
els.addGuildBtn?.addEventListener("click", () => openGuildModal("create"));
els.nitroBtn?.addEventListener("click", () => openNitroModal());
$("closeGuildModal")?.addEventListener("click", () => els.guildModal.classList.add("hidden"));
$("closeNitroModal")?.addEventListener("click", () => els.nitroModal.classList.add("hidden"));
els.nitroModal?.querySelectorAll("[data-tier]").forEach((btn) => {
  btn.addEventListener("click", () => beginNitroCheckout(btn.dataset.tier));
});
$("nitroPayForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("payBtn").disabled = true;
  try {
    await purchaseNitro($("payTier").value, $("payCard").value);
  } catch (error) {
    toast(error.message);
  } finally {
    $("payBtn").disabled = false;
  }
});
$("inboxBtn")?.addEventListener("click", () => openInbox());
$("scrollTopBtn")?.addEventListener("click", () => {
  els.messages.scrollTo({ top: 0, behavior: "smooth" });
  state.stickBottom = false;
});
$("scrollBottomBtn")?.addEventListener("click", () => scrollBottom(true));
$("attachBtn")?.addEventListener("click", () => {
  const url = prompt("Görsel veya link URL’si yapıştır");
  if (!url) return;
  els.messageInput.value = `${els.messageInput.value}${els.messageInput.value ? "\n" : ""}${url}`;
  resizeComposer();
  els.messageInput.focus();
});
$("helpBtn")?.addEventListener("click", () => {
  toast("Ctrl+K geçiş · @ bahset · /yardim · sağ tık · arkadaşlar · keşfet");
});
$("quickSwitchBtn")?.addEventListener("click", () => openQuickSwitch());
$("discoverBtn")?.addEventListener("click", () => openDiscover());
$("closeDiscover")?.addEventListener("click", () => $("discoverModal")?.classList.add("hidden"));
$("closeServerSettings")?.addEventListener("click", () =>
  els.serverSettingsModal?.classList.add("hidden"),
);
$("closeChannelSettings")?.addEventListener("click", () =>
  els.channelSettingsModal?.classList.add("hidden"),
);
els.serverSettingsModal?.addEventListener("click", (e) => {
  if (e.target === els.serverSettingsModal) els.serverSettingsModal.classList.add("hidden");
});
els.channelSettingsModal?.addEventListener("click", (e) => {
  if (e.target === els.channelSettingsModal) els.channelSettingsModal.classList.add("hidden");
});
$("muteChannelBtn")?.addEventListener("click", async () => {
  const data = await api("/xzon/api/mutes", {
    method: "POST",
    body: { targetType: "channel", targetId: state.channelId },
  });
  state.mutes = data.mutes || [];
  renderSidebar();
  toast(data.muted ? "Kanal sessize alındı" : "Kanal sesi açıldı");
});
$("readAllBtn")?.addEventListener("click", async () => {
  const data = await api("/xzon/api/read-all", { method: "POST", body: {} });
  state.unread = data.unread || {};
  renderSidebar();
  toast("Tüm kanallar okundu");
});
$("formatBar")?.querySelectorAll("[data-fmt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.fmt;
    if (f === "bold") wrapSelection("**");
    if (f === "italic") wrapSelection("*");
    if (f === "strike") wrapSelection("~~");
    if (f === "code") wrapSelection("`");
    if (f === "spoiler") wrapSelection("||");
    if (f === "quote") wrapSelection("> ", "");
  });
});
function syncSoundBtn() {
  if (els.soundToggleBtn) {
    els.soundToggleBtn.textContent = state.soundOn ? "Ses: Açık" : "Ses: Kapalı";
    els.soundToggleBtn.classList.toggle("on", state.soundOn);
  }
}
syncSoundBtn();
els.soundToggleBtn?.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  localStorage.setItem("xzon_sound", state.soundOn ? "1" : "0");
  syncSoundBtn();
  if (state.soundOn) playPing();
});
window.addEventListener("resize", () => {
  syncFab();
  resizeComposer();
});
window.visualViewport?.addEventListener("resize", () => {
  syncFab();
  // Keep message list usable when mobile keyboard opens
  if (state.stickBottom) scrollBottom(true);
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openQuickSwitch();
    return;
  }
  if (e.key === "Escape") {
    closeAllDrawers();
    els.guildModal?.classList.add("hidden");
    els.nitroModal?.classList.add("hidden");
    els.ctxMenu?.classList.add("hidden");
    els.mentionPop?.classList.add("hidden");
    els.lightbox?.classList.add("hidden");
    $("guildMenu")?.classList.add("hidden");
    $("quickSwitch")?.classList.add("hidden");
    $("discoverModal")?.classList.add("hidden");
  }
});
$("emojiBtn").addEventListener("click", (e) => {
  showEmoji(
    e.currentTarget,
    (emoji) => {
      const token = `:${emoji}:`;
      const ta = els.messageInput;
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      ta.value = `${ta.value.slice(0, start)}${token}${ta.value.slice(end)}`;
      resizeComposer();
      ta.focus();
    },
    { compose: true },
  );
});

// Brand composer action icons
if ($("emojiBtn")) $("emojiBtn").innerHTML = ICON.smile;
if ($("attachBtn")) $("attachBtn").innerHTML = ICON.plus;
if ($("sendBtn")) $("sendBtn").innerHTML = ICON.send;

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
  if (
    els.emojiPop &&
    !els.emojiPop.contains(e.target) &&
    e.target !== $("emojiBtn") &&
    !e.target.closest?.('[data-act="react"]') &&
    !e.target.closest?.('[data-c="react"]')
  ) {
    els.emojiPop.classList.add("hidden");
  }
  if (!els.profilePop.contains(e.target) && !e.target.closest?.("[data-user]")) {
    els.profilePop.classList.add("hidden");
  }
  if (els.ctxMenu && !els.ctxMenu.contains(e.target)) els.ctxMenu.classList.add("hidden");
  if (els.mentionPop && !els.mentionPop.contains(e.target) && e.target !== els.messageInput) {
    els.mentionPop.classList.add("hidden");
  }
  if (!$("guildMenuBtn")?.contains(e.target) && !$("guildMenu")?.contains(e.target)) {
    $("guildMenu")?.classList.add("hidden");
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
console.info("[XZON] client v11 accounts+paid-nitro ready");
setAuthTab("register");

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
