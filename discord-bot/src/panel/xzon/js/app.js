const guilds = {
  xzon: {
    name: "X Z O N #SORGU",
    categories: [
      {
        id: "info",
        name: "BİLGİ",
        channels: [
          { id: "duyurular", name: "duyurular", type: "text" },
          { id: "kurallar", name: "kurallar", type: "text" },
        ],
      },
      {
        id: "chat",
        name: "SOHBET",
        channels: [
          { id: "genel", name: "genel", type: "text" },
          { id: "sohbet", name: "sohbet-i-muhabbet", type: "text" },
          { id: "media", name: "medya", type: "text" },
          { id: "bot", name: "bot-komut", type: "text", unread: 2 },
        ],
      },
      {
        id: "voice",
        name: "SESLİ",
        channels: [
          { id: "lobby", name: "Lobby", type: "voice" },
          { id: "music", name: "Music", type: "voice" },
        ],
      },
    ],
  },
  ifsaxd: {
    name: "İFSAXD",
    categories: [
      {
        id: "main",
        name: "GENEL",
        channels: [
          { id: "if-genel", name: "genel", type: "text" },
          { id: "if-ifsa", name: "ifşa", type: "text" },
          { id: "if-ss", name: "ss-paylaşım", type: "text" },
        ],
      },
      {
        id: "voice",
        name: "SESLİ",
        channels: [{ id: "if-voice", name: "Sesli Sohbet", type: "voice" }],
      },
    ],
  },
};

const channelData = {
  duyurular: {
    title: "duyurular",
    topic: "Resmi duyurular — sadece yetkililer yazar.",
    messages: [
      {
        user: "Lexyxzon",
        color: "#5865f2",
        bot: true,
        time: "Bugün saat 12:01",
        text: "Sunucu paneli ve yeni sistemler aktif. İyi eğlenceler.",
        reactions: [{ emoji: "🔥", count: 4, mine: false }],
      },
      {
        user: "Owner",
        color: "#ed4245",
        time: "Bugün saat 12:05",
        text: "Kurallara uyun. Ticket için destek kanalını kullanın.",
      },
    ],
  },
  kurallar: {
    title: "kurallar",
    topic: "Okumadan sohbete girme.",
    messages: [
      {
        user: "Lexyxzon",
        color: "#5865f2",
        bot: true,
        time: "Dün saat 18:20",
        text: "1) Saygı\n2) Spam yok\n3) Reklam yasak\n4) Yetkiliye küfür = ban",
      },
    ],
  },
  genel: {
    title: "genel",
    topic: "Sunucunun ana sohbet kanalı — saygılı ol, spam yapma.",
    messages: [
      {
        user: "Shadow",
        color: "#57f287",
        time: "Bugün saat 14:02",
        text: "selamlar, yeni gelen var mı?",
      },
      {
        user: "Mira",
        color: "#eb459e",
        time: "Bugün saat 14:03",
        text: "ben yeniyim, neler oluyor burada?",
      },
      {
        user: "Shadow",
        color: "#57f287",
        time: "Bugün saat 14:03",
        text: "bot komutları #bot-komut kanalında, ses odalarına da bak",
        compact: true,
      },
      {
        user: "Lexyxzon",
        color: "#5865f2",
        bot: true,
        time: "Bugün saat 14:04",
        text: "Hoş geldin @Mira! `/yardim` yazarak başlayabilirsin.",
        reactions: [
          { emoji: "👋", count: 3, mine: true },
          { emoji: "❤️", count: 1, mine: false },
        ],
      },
      {
        user: "Kaan",
        color: "#fee75c",
        time: "Bugün saat 14:10",
        text: "lobby'de yer var, sesliye geçin",
      },
      {
        user: "Nova",
        color: "#00a8fc",
        time: "Bugün saat 14:12",
        text: "panel çok iyi olmuş ya",
      },
    ],
  },
  sohbet: {
    title: "sohbet-i-muhabbet",
    topic: "Gündelik muhabbet buraya.",
    messages: [
      {
        user: "Ege",
        color: "#f47b67",
        time: "Bugün saat 13:40",
        text: "akşam event var mı?",
      },
      {
        user: "Owner",
        color: "#ed4245",
        time: "Bugün saat 13:42",
        text: "var, duyurulara bak.",
      },
    ],
  },
  media: {
    title: "medya",
    topic: "Görsel / video paylaşımı.",
    messages: [
      {
        user: "Mira",
        color: "#eb459e",
        time: "Bugün saat 11:11",
        text: "yeni sunucu ikonu nasıl olmuş?",
      },
    ],
  },
  bot: {
    title: "bot-komut",
    topic: "Bot komutlarını burada dene.",
    messages: [
      {
        user: "Sen",
        color: "#5865f2",
        time: "Bugün saat 15:01",
        text: "/yardim",
      },
      {
        user: "Lexyxzon",
        color: "#5865f2",
        bot: true,
        time: "Bugün saat 15:01",
        text: "Ultra Command Deck hazır. /panel /istatistik /anonim ...",
      },
    ],
  },
  lobby: {
    title: "Lobby",
    topic: "Sesli sohbet lobisi",
    voice: true,
    messages: [
      {
        user: "Sistem",
        color: "#949ba4",
        time: "Bugün saat 14:00",
        text: "Lobby ses kanalına bağlandın. Mikrofon ve kulaklık kontrolleri altta.",
      },
    ],
  },
  music: {
    title: "Music",
    topic: "Müzik odası",
    voice: true,
    messages: [
      {
        user: "Sistem",
        color: "#949ba4",
        time: "Bugün saat 14:00",
        text: "Music kanalı — bağlantı hazır.",
      },
    ],
  },
  "if-genel": {
    title: "genel",
    topic: "İFSAXD ana sohbet",
    messages: [
      {
        user: "Owner",
        color: "#ed4245",
        time: "Bugün saat 10:00",
        text: "İFSAXD aktif. Kurallara uyun.",
      },
      {
        user: "Shadow",
        color: "#57f287",
        time: "Bugün saat 10:12",
        text: "bugün hareket var mı?",
      },
    ],
  },
  "if-ifsa": {
    title: "ifşa",
    topic: "Paylaşımlar buraya.",
    messages: [
      {
        user: "Nova",
        color: "#00a8fc",
        time: "Dün saat 21:40",
        text: "yeni post atıldı, bakın.",
      },
    ],
  },
  "if-ss": {
    title: "ss-paylaşım",
    topic: "Screenshot kanalı",
    messages: [
      {
        user: "Kaan",
        color: "#fee75c",
        time: "Bugün saat 09:15",
        text: "ss geldi",
      },
    ],
  },
  "if-voice": {
    title: "Sesli Sohbet",
    topic: "İFSAXD ses",
    voice: true,
    messages: [
      {
        user: "Sistem",
        color: "#949ba4",
        time: "Şimdi",
        text: "Sesli Sohbet kanalına bağlandın.",
      },
    ],
  },
};

const dms = {
  mira: {
    title: "Mira",
    topic: "",
    dm: true,
    messages: [
      {
        user: "Mira",
        color: "#eb459e",
        time: "Dün saat 22:10",
        text: "selam, bot nasıl kuruluyor?",
      },
      {
        user: "Sen",
        color: "#5865f2",
        time: "Dün saat 22:12",
        text: "panelden bağla, /yardim ile başla",
      },
      {
        user: "Mira",
        color: "#eb459e",
        time: "Dün saat 22:13",
        text: "tamam teşekkürler!",
        compact: true,
      },
    ],
  },
  shadow: {
    title: "Shadow",
    topic: "",
    dm: true,
    messages: [
      {
        user: "Shadow",
        color: "#57f287",
        time: "Bugün saat 11:00",
        text: "akşam lobby?",
      },
    ],
  },
  lexyxzon: {
    title: "Lexyxzon",
    topic: "",
    dm: true,
    messages: [
      {
        user: "Lexyxzon",
        color: "#5865f2",
        bot: true,
        time: "Bugün saat 08:00",
        text: "Merhaba! Destek için sunucuda ticket açabilirsin.",
      },
    ],
  },
};

const users = {
  Owner: {
    color: "#ed4245",
    tag: "owner#0001",
    about: "Sunucu sahibi",
    role: "Owner",
    status: "online",
    activity: "XZON yönetiyor",
  },
  Lexyxzon: {
    color: "#5865f2",
    tag: "lexyxzon#3790",
    about: "Ultra Premium bot",
    role: "Bot",
    status: "online",
    activity: "Komut dinliyor",
    bot: true,
  },
  Shadow: {
    color: "#57f287",
    tag: "shadow#4421",
    about: "Gece kuşu",
    role: "Mod",
    status: "online",
    activity: "Visual Studio Code",
  },
  Mira: {
    color: "#eb459e",
    tag: "mira#1188",
    about: "Yeni üye",
    role: "Üye",
    status: "idle",
    activity: "Spotify dinliyor",
  },
  Kaan: {
    color: "#fee75c",
    tag: "kaan#0909",
    about: "Lobby abisi",
    role: "Üye",
    status: "dnd",
    activity: "Rahatsız etmeyin",
  },
  Nova: {
    color: "#00a8fc",
    tag: "nova#3333",
    about: "Designer",
    role: "Üye",
    status: "online",
  },
  Ege: {
    color: "#f47b67",
    tag: "ege#2020",
    about: "Eventçi",
    role: "Üye",
    status: "online",
  },
  Sen: {
    color: "#5865f2",
    tag: "sen#0001",
    about: "XZON kullanıcısı",
    role: "Üye",
    status: "online",
  },
  Arda: { color: "#95a5a6", tag: "arda#1111", about: "", role: "Üye", status: "offline" },
  Lina: { color: "#9b59b6", tag: "lina#2222", about: "", role: "Üye", status: "offline" },
  Berk: { color: "#1abc9c", tag: "berk#3333", about: "", role: "Üye", status: "offline" },
  Zey: { color: "#e67e22", tag: "zey#4444", about: "", role: "Üye", status: "offline" },
  Can: { color: "#34495e", tag: "can#5555", about: "", role: "Üye", status: "offline" },
};

const onlineNames = ["Owner", "Lexyxzon", "Shadow", "Mira", "Kaan", "Nova", "Ege", "Sen"];
const offlineNames = ["Arda", "Lina", "Berk", "Zey", "Can"];
const friends = [
  { id: "mira", name: "Mira", status: "idle", note: "Boşta — Spotify" },
  { id: "shadow", name: "Shadow", status: "online", note: "Çevrimiçi" },
  { id: "lexyxzon", name: "Lexyxzon", status: "online", note: "Bot" },
];

const statusLabels = {
  online: "Çevrimiçi",
  idle: "Boşta",
  dnd: "Rahatsız Etmeyin",
  offline: "Görünmez",
};

const $ = (id) => document.getElementById(id);

const els = {
  loginScreen: $("loginScreen"),
  loginForm: $("loginForm"),
  app: $("app"),
  channelList: $("channelList"),
  guildName: $("guildName"),
  sidebarHeader: $("sidebarHeader"),
  messages: $("messages"),
  channelTitle: $("channelTitle"),
  channelTopic: $("channelTopic"),
  titleIcon: $("titleIcon"),
  topicDivider: $("topicDivider"),
  messageInput: $("messageInput"),
  composer: $("composer"),
  membersPanel: $("membersPanel"),
  membersContent: $("membersContent"),
  voicePanel: $("voicePanel"),
  voiceChannelName: $("voiceChannelName"),
  typing: $("typing"),
  typingText: $("typingText"),
  statusMenu: $("statusMenu"),
  profilePop: $("profilePop"),
  settingsModal: $("settingsModal"),
  settingsPane: $("settingsPane"),
  toast: $("toast"),
  meAvatar: $("meAvatar"),
  meStatus: $("meStatus"),
  mobileBar: $("mobileBar"),
};

let view = "guild"; // guild | dms
let currentGuild = "xzon";
let currentChannel = "genel";
let currentDm = null;
let myStatus = "online";
let micOn = true;
let deafOn = true;
let voiceConnected = null;
let typingTimer = null;
let toastTimer = null;

function initials(name) {
  return String(name).slice(0, 1).toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br>");
}

function formatText(str) {
  return escapeHtml(str).replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add("hidden"), 2200);
}

function getActiveMessages() {
  if (view === "dms" && currentDm) return dms[currentDm];
  return channelData[currentChannel];
}

function renderSidebar() {
  if (view === "dms") {
    els.sidebarHeader.innerHTML = `<button type="button" class="dm-search">Bir sohbet bul veya başlat</button>`;
    els.guildName && (els.guildName.textContent = "Direkt Mesajlar");

    els.channelList.innerHTML = `
      <button class="channel active" data-friends type="button">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        Arkadaşlar
      </button>
      <div class="friends-section" style="margin-top:16px">
        <h4>DİREKT MESAJLAR</h4>
        ${friends
          .map(
            (f) => `
          <button class="friend-row ${currentDm === f.id ? "active" : ""}" data-dm="${f.id}" type="button">
            <div class="avatar ${f.status}" style="background:${users[f.name]?.color || "#5865f2"}">${initials(f.name)}</div>
            <div class="meta">
              <strong>${f.name}</strong>
              <small>${f.note}</small>
            </div>
          </button>`,
          )
          .join("")}
      </div>
    `;

    els.channelList.querySelectorAll("[data-dm]").forEach((btn) => {
      btn.addEventListener("click", () => openDm(btn.dataset.dm));
    });
    els.channelList.querySelector("[data-friends]")?.addEventListener("click", () => {
      currentDm = null;
      renderFriendsHome();
      renderSidebar();
    });
    return;
  }

  const guild = guilds[currentGuild];
  els.sidebarHeader.innerHTML = `
    <button type="button" id="guildMenuBtn">
      <span id="guildName">${guild.name}</span>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 10l5 5 5-5H7z" /></svg>
    </button>
  `;

  els.channelList.innerHTML = guild.categories
    .map(
      (cat) => `
    <div class="cat">
      <button class="cat-toggle" data-cat="${cat.id}" type="button">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
        ${cat.name}
      </button>
      <div class="cat-items" data-cat-items="${cat.id}">
        ${cat.channels
          .map((ch) => {
            if (ch.type === "voice") {
              return `
                <button class="channel voice ${currentChannel === ch.id ? "active" : ""}" data-channel="${ch.id}" type="button">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"/>
                  </svg>
                  ${ch.name}
                </button>`;
            }
            return `
              <button class="channel ${currentChannel === ch.id ? "active" : ""}" data-channel="${ch.id}" type="button">
                <span class="hash">#</span> ${ch.name}
                ${ch.unread ? `<span class="unread">${ch.unread}</span>` : ""}
              </button>`;
          })
          .join("")}
      </div>
    </div>`,
    )
    .join("");

  els.channelList.querySelectorAll("[data-channel]").forEach((btn) => {
    btn.addEventListener("click", () => setActiveChannel(btn.dataset.channel));
  });

  els.channelList.querySelectorAll(".cat-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = els.channelList.querySelector(`[data-cat-items="${btn.dataset.cat}"]`);
      if (!box) return;
      box.classList.toggle("collapsed");
      btn.querySelector("svg")?.style.setProperty(
        "transform",
        box.classList.contains("collapsed") ? "rotate(-90deg)" : "rotate(0deg)",
      );
    });
  });

  $("guildMenuBtn")?.addEventListener("click", () => showToast("Sunucu menüsü (çakma UI)"));
}

function renderMembers() {
  if (view === "dms") {
    els.membersContent.innerHTML = `
      <h3>AKTİF ŞİMDİ — ${friends.filter((f) => f.status === "online").length}</h3>
      <div class="member-group">
        ${friends
          .map((f) => {
            const u = users[f.name];
            return `
            <button class="member" data-user="${f.name}" type="button">
              <div class="avatar ${f.status}" style="background:${u.color}">${initials(f.name)}</div>
              <span class="name" style="color:${u.color}">${f.name}</span>
            </button>`;
          })
          .join("")}
      </div>`;
  } else {
    els.membersContent.innerHTML = `
      <h3>ÇEVRİMİÇİ — ${onlineNames.length}</h3>
      <div class="member-group">
        ${onlineNames
          .map((name) => {
            const u = users[name];
            return `
            <button class="member" data-user="${name}" type="button">
              <div class="avatar ${u.status}" style="background:${u.color}">${initials(name)}</div>
              <div>
                <span class="name" style="color:${u.color}">${name}</span>
                ${u.activity ? `<span class="activity">${u.activity}</span>` : ""}
              </div>
            </button>`;
          })
          .join("")}
      </div>
      <h3>ÇEVRİMDIŞI — ${offlineNames.length}</h3>
      <div class="member-group offline">
        ${offlineNames
          .map((name) => {
            const u = users[name];
            return `
            <button class="member offline" data-user="${name}" type="button">
              <div class="avatar offline" style="background:${u.color}">${initials(name)}</div>
              <span class="name">${name}</span>
            </button>`;
          })
          .join("")}
      </div>`;
  }

  els.membersContent.querySelectorAll("[data-user]").forEach((btn) => {
    btn.addEventListener("click", (e) => openProfile(btn.dataset.user, e));
  });
}

function renderMessages() {
  const data = getActiveMessages();
  if (!data) return;

  els.channelTitle.textContent = data.title;
  els.channelTopic.textContent = data.topic || "";
  els.topicDivider.classList.toggle("hidden", !data.topic);
  els.channelTopic.classList.toggle("hidden", !data.topic);

  if (data.dm) {
    els.titleIcon.textContent = "@";
    els.messageInput.placeholder = `@${data.title} kullanıcısına mesaj gönder`;
  } else if (data.voice) {
    els.titleIcon.textContent = "🔊";
    els.messageInput.placeholder = `${data.title} kanalına mesaj gönder`;
  } else {
    els.titleIcon.textContent = "#";
    els.messageInput.placeholder = `#${data.title} kanalına mesaj gönder`;
  }

  const welcomeTitle = data.dm ? data.title : data.title;
  els.messages.innerHTML = `
    <div class="welcome-hero">
      <div class="big-hash">${data.dm ? "@" : data.voice ? "🔊" : "#"}</div>
      <h2>${data.dm ? welcomeTitle : `Welcome to #${welcomeTitle}!`}</h2>
      <p>${
        data.dm
          ? `Bu, sen ve ${welcomeTitle} arasındaki DM'lerin başlangıcı.`
          : data.topic || "Bu kanalın başlangıcı."
      }</p>
    </div>
    <div class="system">${new Date().toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}</div>
  `;

  for (const msg of data.messages) {
    const compact = Boolean(msg.compact);
    const el = document.createElement("article");
    el.className = `msg${compact ? " compact" : ""}`;
    el.innerHTML = `
      ${compact ? `<span class="msg-time-inline">14:03</span>` : ""}
      <div class="msg-avatar" data-user="${msg.user}" style="background:${msg.color}">${initials(msg.user)}</div>
      <div class="msg-body">
        ${
          compact
            ? ""
            : `<div class="msg-head">
                <strong class="${msg.bot ? "bot" : ""}" data-user="${msg.user}" style="color:${msg.color}">${msg.user}${
                  msg.bot ? '<span class="bot-tag">BOT</span>' : ""
                }</strong>
                <time>${msg.time}</time>
              </div>`
        }
        <div class="msg-text">${formatText(msg.text)}</div>
        ${
          msg.reactions?.length
            ? `<div class="msg-reactions">${msg.reactions
                .map(
                  (r) =>
                    `<button class="reaction ${r.mine ? "mine" : ""}" type="button">${r.emoji} ${r.count}</button>`,
                )
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="msg-actions">
        <button type="button" title="Emoji" data-act="react">😊</button>
        <button type="button" title="Yanıtla" data-act="reply">↩</button>
        <button type="button" title="Daha fazla" data-act="more">⋯</button>
      </div>
    `;
    els.messages.appendChild(el);
  }

  els.messages.querySelectorAll("[data-user]").forEach((node) => {
    node.addEventListener("click", (e) => openProfile(node.dataset.user, e));
  });

  els.messages.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const act = btn.dataset.act;
      if (act === "react") showToast("Tepki eklendi 👍");
      else if (act === "reply") {
        els.messageInput.focus();
        els.messageInput.placeholder = "Yanıt yazılıyor…";
      } else showToast("Mesaj menüsü");
    });
  });

  els.messages.querySelectorAll(".reaction").forEach((btn) => {
    btn.addEventListener("click", () => {
      const parts = btn.textContent.trim().split(/\s+/);
      const emoji = parts[0];
      let count = Number(parts[1] || 1);
      const mine = btn.classList.toggle("mine");
      count = mine ? count + 1 : Math.max(1, count - 1);
      btn.textContent = `${emoji} ${count}`;
    });
  });

  els.messages.scrollTop = els.messages.scrollHeight;
}

function renderFriendsHome() {
  els.channelTitle.textContent = "Arkadaşlar";
  els.titleIcon.textContent = "👥";
  els.channelTopic.textContent = "Çevrimiçi — hepsi";
  els.topicDivider.classList.remove("hidden");
  els.channelTopic.classList.remove("hidden");
  els.messageInput.placeholder = "Arkadaşlarına mesaj at veya birini seç";

  els.messages.innerHTML = `
    <div class="welcome-hero">
      <div class="big-hash">👥</div>
      <h2>Arkadaşlar</h2>
      <p>Direkt mesajlaşmak için soldan birini seç.</p>
    </div>
    <div style="padding:8px 16px;display:grid;gap:4px">
      ${friends
        .map((f) => {
          const u = users[f.name];
          return `
          <button class="member" data-open-dm="${f.id}" type="button" style="width:100%">
            <div class="avatar ${f.status}" style="background:${u.color}">${initials(f.name)}</div>
            <div>
              <span class="name" style="color:${u.color}">${f.name}</span>
              <span class="activity">${f.note}</span>
            </div>
          </button>`;
        })
        .join("")}
    </div>
  `;

  els.messages.querySelectorAll("[data-open-dm]").forEach((btn) => {
    btn.addEventListener("click", () => openDm(btn.dataset.openDm));
  });
}

function setActiveChannel(key) {
  currentChannel = key;
  currentDm = null;
  const data = channelData[key];

  if (data?.voice) {
    voiceConnected = key;
    els.voicePanel.classList.remove("hidden");
    els.voiceChannelName.textContent = data.title;
    $("voiceStatusText").textContent = "Ses Bağlantısı";
  }

  renderSidebar();
  renderMessages();
  renderMembers();
  maybeTyping();
}

function openDm(id) {
  view = "dms";
  currentDm = id;
  document.querySelectorAll(".server").forEach((s) => s.classList.remove("active", "active-guild"));
  document.querySelector('.server.home')?.classList.add("active");
  renderSidebar();
  renderMessages();
  renderMembers();
}

function openGuild(guildId) {
  view = "guild";
  currentGuild = guildId;
  currentDm = null;
  voiceConnected = null;
  els.voicePanel.classList.add("hidden");

  document.querySelectorAll(".server").forEach((s) => s.classList.remove("active", "active-guild"));
  document.querySelector(`.server[data-guild="${guildId}"]`)?.classList.add("active-guild");

  const first = guilds[guildId].categories[0].channels[0].id;
  currentChannel = guildId === "xzon" ? "genel" : first;
  if (guildId === "xzon") currentChannel = "genel";

  renderSidebar();
  renderMessages();
  renderMembers();
}

function openDmsView() {
  view = "dms";
  currentDm = null;
  document.querySelectorAll(".server").forEach((s) => s.classList.remove("active", "active-guild"));
  document.querySelector(".server.home")?.classList.add("active");
  renderSidebar();
  renderFriendsHome();
  renderMembers();
}

function openProfile(name, event) {
  const u = users[name];
  if (!u) return;
  const pop = els.profilePop;
  $("profileAvatar").textContent = initials(name);
  $("profileAvatar").style.background = u.color;
  $("profileAvatar").className = `profile-avatar avatar ${u.status || "online"}`;
  $("profileName").textContent = name;
  $("profileTag").textContent = u.tag;
  $("profileAbout").textContent = u.about || "—";
  $("profileRole").textContent = u.role;
  $("profileBanner").style.background = `linear-gradient(135deg, ${u.color}, #1e1f22)`;

  const x = Math.min(window.innerWidth - 320, (event?.clientX || 200) + 8);
  const y = Math.min(window.innerHeight - 360, (event?.clientY || 100) - 20);
  pop.style.left = `${Math.max(8, x)}px`;
  pop.style.top = `${Math.max(8, y)}px`;
  pop.classList.remove("hidden");

  $("profileMsgBtn").onclick = () => {
    pop.classList.add("hidden");
    const friend = friends.find((f) => f.name === name);
    if (friend) openDm(friend.id);
    else showToast(`${name} ile DM (çakma)`);
  };
}

function maybeTyping() {
  clearTimeout(typingTimer);
  if (view === "dms") return;
  if (Math.random() > 0.5) return;
  const names = ["Mira", "Shadow", "Nova", "Kaan"];
  const who = names[Math.floor(Math.random() * names.length)];
  els.typingText.textContent = `${who} yazıyor…`;
  els.typing.classList.remove("hidden");
  typingTimer = setTimeout(() => els.typing.classList.add("hidden"), 2800);
}

function openSettings(tab = "account") {
  els.settingsModal.classList.remove("hidden");
  document.querySelectorAll(".settings-nav button[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });

  const panes = {
    account: `
      <h2>Hesabım</h2>
      <label>Kullanıcı adı<input value="Sen" /></label>
      <label>E-posta<input value="sen@xzon.app" /></label>
      <label>Telefon<input value="+90 ••• ••• •• 42" /></label>
      <p>Bu tamamen Discord çakması bir arayüz — gerçek hesap yok.</p>`,
    profile: `
      <h2>Profiller</h2>
      <label>Görünen ad<input value="Sen" /></label>
      <label>Hakkında<textarea style="height:80px;border:0;border-radius:4px;background:#1e1f22;color:#fff;padding:12px;font:inherit">XZON kullanıcısı</textarea></label>`,
    privacy: `
      <h2>Gizlilik & Güvenlik</h2>
      <p>DM'leri kimlerin açabileceği, friend request ve scan ayarları burada olurdu.</p>
      <label>Direkt mesajlar
        <select><option>Herkes</option><option>Arkadaşlar</option><option>Kimse</option></select>
      </label>`,
    appearance: `
      <h2>Görünüm</h2>
      <label>Tema
        <select><option>Koyu</option><option>Açık</option><option>Siyah</option></select>
      </label>
      <label>Mesaj gösterimi
        <select><option>Rahat</option><option>Kompakt</option></select>
      </label>`,
    voice: `
      <h2>Ses & Video</h2>
      <label>Giriş cihazı<select><option>Varsayılan Mikrofon</option></select></label>
      <label>Çıkış cihazı<select><option>Varsayılan Hoparlör</option></select></label>
      <p>Ses bağlantısı bu çakma istemcide simüle edilir.</p>`,
    logout: `
      <h2>Çıkış Yap</h2>
      <p>Oturumu kapatmak istediğine emin misin?</p>
      <button type="button" id="confirmLogout" style="margin-top:12px;height:40px;padding:0 16px;border-radius:4px;background:#f23f43;color:#fff;font-weight:600">Çıkış Yap</button>`,
  };

  els.settingsPane.innerHTML = panes[tab] || panes.account;
  $("confirmLogout")?.addEventListener("click", () => {
    els.settingsModal.classList.add("hidden");
    els.app.classList.add("hidden");
    els.loginScreen.classList.remove("hidden");
    els.mobileBar.classList.add("hidden");
  });
}

/* ========== Events ========== */
els.loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  els.loginScreen.classList.add("hidden");
  els.app.classList.remove("hidden");
  if (window.matchMedia("(max-width: 760px)").matches) {
    els.mobileBar.classList.remove("hidden");
  }
  openGuild("xzon");
});

document.querySelectorAll(".server[data-guild]").forEach((btn) => {
  btn.addEventListener("click", () => openGuild(btn.dataset.guild));
});

document.querySelector(".server.home")?.addEventListener("click", openDmsView);

$("addServerBtn")?.addEventListener("click", () => showToast("Sunucu oluştur / katıl (çakma)"));
$("discoverBtn")?.addEventListener("click", () => showToast("Keşfet — yakında"));

els.composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = els.messageInput.value.trim();
  if (!text) return;

  const data = getActiveMessages();
  if (!data) return;

  const last = data.messages[data.messages.length - 1];
  const compact = last && last.user === "Sen" && last.time === "Şimdi";

  data.messages.push({
    user: "Sen",
    color: "#5865f2",
    time: "Şimdi",
    text,
    compact,
  });
  els.messageInput.value = "";
  renderMessages();
});

$("toggleMembers")?.addEventListener("click", () => {
  els.membersPanel.classList.toggle("open");
});

$("statusBtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const rect = e.currentTarget.getBoundingClientRect();
  els.statusMenu.style.left = `${rect.left}px`;
  els.statusMenu.style.bottom = `${window.innerHeight - rect.top + 8}px`;
  els.statusMenu.style.top = "auto";
  els.statusMenu.classList.toggle("hidden");
});

els.statusMenu.querySelectorAll("[data-status]").forEach((btn) => {
  btn.addEventListener("click", () => {
    myStatus = btn.dataset.status;
    users.Sen.status = myStatus;
    els.meAvatar.className = `avatar ${myStatus}`;
    els.meStatus.textContent = statusLabels[myStatus];
    els.statusMenu.classList.add("hidden");
    showToast(`Durum: ${statusLabels[myStatus]}`);
  });
});

$("micBtn")?.addEventListener("click", () => {
  micOn = !micOn;
  $("micBtn").classList.toggle("off", !micOn);
  $("micBtn").classList.toggle("on", micOn);
  showToast(micOn ? "Mikrofon açık" : "Mikrofon kapalı");
});

$("deafBtn")?.addEventListener("click", () => {
  deafOn = !deafOn;
  $("deafBtn").classList.toggle("off", !deafOn);
  if (!deafOn) {
    micOn = false;
    $("micBtn").classList.add("off");
  }
  showToast(deafOn ? "Kulaklık açık" : "Sağırlaştırıldı");
});

$("disconnectVoice")?.addEventListener("click", () => {
  voiceConnected = null;
  els.voicePanel.classList.add("hidden");
  showToast("Ses bağlantısı kesildi");
});

$("settingsBtn")?.addEventListener("click", () => openSettings("account"));
$("closeSettings")?.addEventListener("click", () => els.settingsModal.classList.add("hidden"));

document.querySelectorAll(".settings-nav button[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => openSettings(btn.dataset.tab));
});

$("pinsBtn")?.addEventListener("click", () => showToast("Sabitlenmiş mesaj yok"));
$("attachBtn")?.addEventListener("click", () => showToast("Dosya yükleme (çakma)"));
$("emojiBtn")?.addEventListener("click", () => {
  els.messageInput.value += " 😂";
  els.messageInput.focus();
});

$("searchInput")?.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    renderMessages();
    return;
  }
  const data = getActiveMessages();
  if (!data) return;
  const filtered = data.messages.filter((m) => m.text.toLowerCase().includes(q) || m.user.toLowerCase().includes(q));
  els.messages.innerHTML =
    filtered.length === 0
      ? `<div class="welcome-hero"><h2>Sonuç yok</h2><p>“${escapeHtml(q)}” için eşleşme bulunamadı.</p></div>`
      : "";
  for (const msg of filtered) {
    const el = document.createElement("article");
    el.className = "msg";
    el.innerHTML = `
      <div class="msg-avatar" style="background:${msg.color}">${initials(msg.user)}</div>
      <div class="msg-body">
        <div class="msg-head"><strong>${msg.user}</strong><time>${msg.time}</time></div>
        <div class="msg-text">${formatText(msg.text)}</div>
      </div>`;
    els.messages.appendChild(el);
  }
});

document.addEventListener("click", (e) => {
  if (!els.statusMenu.contains(e.target) && e.target !== $("statusBtn") && !e.target.closest?.("#statusBtn")) {
    els.statusMenu.classList.add("hidden");
  }
  if (!els.profilePop.contains(e.target) && !e.target.closest?.("[data-user]")) {
    els.profilePop.classList.add("hidden");
  }
});

els.mobileBar?.querySelectorAll("[data-mobile]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.mobile;
    els.mobileBar.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    els.app.classList.remove("show-servers", "show-channels", "show-members");
    if (mode === "servers") els.app.classList.add("show-servers");
    if (mode === "channels") els.app.classList.add("show-channels");
    if (mode === "members") els.app.classList.add("show-members");
  });
});

// Auto-demo: skip login if ?app=1
if (new URLSearchParams(location.search).has("app")) {
  els.loginScreen.classList.add("hidden");
  els.app.classList.remove("hidden");
  if (window.matchMedia("(max-width: 760px)").matches) els.mobileBar.classList.remove("hidden");
  openGuild("xzon");
}
