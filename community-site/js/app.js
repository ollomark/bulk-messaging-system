const channels = {
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
      },
      {
        user: "Owner",
        color: "#ed4245",
        time: "Bugün saat 12:05",
        text: "Kurallara uyun. Ticket için #destek kanalını kullanın.",
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
        text: "Hoş geldin Mira! `/yardim` yazarak başlayabilirsin.",
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
    messages: [
      {
        user: "Sistem",
        color: "#949ba4",
        time: "Bugün saat 14:00",
        text: "Lobby ses kanalı — bağlanmak için Discord uygulamasını kullan.",
      },
    ],
  },
  music: {
    title: "Music",
    topic: "Müzik odası",
    messages: [
      {
        user: "Sistem",
        color: "#949ba4",
        time: "Bugün saat 14:00",
        text: "Music kanalı boş görünüyor.",
      },
    ],
  },
};

const online = [
  { name: "Owner", color: "#ed4245", status: "online", role: "#ed4245" },
  { name: "Lexyxzon", color: "#5865f2", status: "online", role: "#5865f2" },
  { name: "Shadow", color: "#57f287", status: "online" },
  { name: "Mira", color: "#eb459e", status: "idle" },
  { name: "Kaan", color: "#fee75c", status: "dnd" },
  { name: "Nova", color: "#00a8fc", status: "online" },
  { name: "Ege", color: "#f47b67", status: "online" },
  { name: "Sen", color: "#5865f2", status: "online" },
];

const offline = [
  { name: "Arda", color: "#95a5a6", status: "offline" },
  { name: "Lina", color: "#9b59b6", status: "offline" },
  { name: "Berk", color: "#1abc9c", status: "offline" },
  { name: "Zey", color: "#e67e22", status: "offline" },
  { name: "Can", color: "#34495e", status: "offline" },
];

const messagesEl = document.getElementById("messages");
const channelTitle = document.getElementById("channelTitle");
const channelTopic = document.getElementById("channelTopic");
const messageInput = document.getElementById("messageInput");
const composer = document.getElementById("composer");
const membersPanel = document.getElementById("membersPanel");

let currentChannel = "genel";

function initials(name) {
  return name.slice(0, 1).toUpperCase();
}

function renderMembers() {
  document.getElementById("onlineCount").textContent = String(online.length);
  document.getElementById("offlineCount").textContent = String(offline.length);

  const onlineBox = document.getElementById("onlineMembers");
  const offlineBox = document.getElementById("offlineMembers");

  onlineBox.innerHTML = online
    .map(
      (m) => `
      <div class="member">
        <div class="avatar ${m.status}" style="background:${m.color}">${initials(m.name)}</div>
        <span class="name" style="${m.role ? `color:${m.role}` : ""}">${m.name}</span>
      </div>`,
    )
    .join("");

  offlineBox.innerHTML = offline
    .map(
      (m) => `
      <div class="member offline">
        <div class="avatar offline" style="background:${m.color}">${initials(m.name)}</div>
        <span class="name">${m.name}</span>
      </div>`,
    )
    .join("");
}

function renderMessages(channelKey) {
  const data = channels[channelKey];
  if (!data) return;

  channelTitle.textContent = data.title;
  channelTopic.textContent = data.topic;
  messageInput.placeholder = `#${data.title} kanalına mesaj gönder`;

  messagesEl.innerHTML = `
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
      <div class="msg-avatar" style="background:${msg.color}">${initials(msg.user)}</div>
      <div class="msg-body">
        ${
          compact
            ? ""
            : `<div class="msg-head">
                <strong class="${msg.bot ? "bot" : ""}">${msg.user}${
                  msg.bot ? '<span class="bot-tag">BOT</span>' : ""
                }</strong>
                <time>${msg.time}</time>
              </div>`
        }
        <div class="msg-text">${escapeHtml(msg.text)}</div>
      </div>
    `;
    messagesEl.appendChild(el);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\n", "<br>");
}

function setActiveChannel(key) {
  currentChannel = key;
  document.querySelectorAll(".channel").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.channel === key);
  });
  renderMessages(key);
}

document.querySelectorAll(".channel").forEach((btn) => {
  btn.addEventListener("click", () => setActiveChannel(btn.dataset.channel));
});

document.querySelectorAll(".cat-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const box = document.querySelector(`[data-cat-items="${btn.dataset.cat}"]`);
    if (!box) return;
    const hidden = box.style.display === "none";
    box.style.display = hidden ? "grid" : "none";
    btn.querySelector("svg")?.style.setProperty("transform", hidden ? "rotate(0deg)" : "rotate(-90deg)");
  });
});

composer.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const data = channels[currentChannel];
  data.messages.push({
    user: "Sen",
    color: "#5865f2",
    time: "Şimdi",
    text,
  });
  messageInput.value = "";
  renderMessages(currentChannel);
});

document.getElementById("toggleMembers")?.addEventListener("click", () => {
  membersPanel.classList.toggle("open");
});

renderMembers();
renderMessages("genel");
