const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const pageTitle = document.getElementById("pageTitle");
const pageSub = document.getElementById("pageSub");

const titles = {
  dashboard: ["Dashboard", "Canlı bot durumu"],
  messages: ["Mesaj Gönder", "Bot hesabıyla kanal mesajı"],
  embed: ["Embed Studio", "Premium embed oluştur"],
  anon: ["Anonim", "Webhook ile gizli mesaj"],
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "İstek başarısız");
  return data;
}

function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
}

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}s ${m}d`;
}

async function loadDashboard() {
  const me = await api("/api/me");
  const { bot } = me;
  document.getElementById("botChip").textContent = `${bot.tag} · online`;
  document.getElementById("statTag").textContent = bot.tag;
  document.getElementById("statGuilds").textContent = String(bot.guilds);
  document.getElementById("statPing").textContent = `${bot.ping}ms`;
  document.getElementById("statUptime").textContent = formatUptime(bot.uptime);
  document.getElementById("statCommands").textContent = String(bot.commands);

  const { guilds } = await api("/api/guilds");
  const list = document.getElementById("guildList");
  list.innerHTML = guilds
    .map(
      (g) => `
      <div class="guild-item">
        <img src="${g.icon || "https://cdn.discordapp.com/embed/avatars/0.png"}" alt="" />
        <div>
          <strong>${g.name}</strong>
          <div style="color:var(--muted);font-size:12px">${g.memberCount} üye · ${g.id}</div>
        </div>
      </div>`,
    )
    .join("");

  fillGuildSelects(guilds);
}

function fillGuildSelects(guilds) {
  for (const id of ["msgGuild", "embedGuild", "anonGuild"]) {
    const el = document.getElementById(id);
    el.innerHTML = guilds.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");
  }
  syncChannels("msgGuild", "msgChannel");
  syncChannels("embedGuild", "embedChannel");
  syncChannels("anonGuild", "anonChannel");
}

async function syncChannels(guildSelectId, channelSelectId) {
  const guildId = document.getElementById(guildSelectId).value;
  const select = document.getElementById(channelSelectId);
  if (!guildId) {
    select.innerHTML = "";
    return;
  }
  const { channels } = await api(`/api/guilds/${guildId}/channels`);
  select.innerHTML = channels
    .map((c) => `<option value="${c.id}">#${c.name}${c.parent ? ` · ${c.parent}` : ""}</option>`)
    .join("");
}

function setStatus(el, text, ok) {
  el.textContent = text;
  el.className = `status ${ok ? "ok" : "bad"}`;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  try {
    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ password: document.getElementById("password").value }),
    });
    showApp();
    await loadDashboard();
  } catch (err) {
    loginError.textContent = err.message;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" }).catch(() => null);
  showLogin();
});

document.querySelectorAll(".nav").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach((t) => t.classList.add("hidden"));
    document.getElementById(`tab-${tab}`).classList.remove("hidden");
    pageTitle.textContent = titles[tab][0];
    pageSub.textContent = titles[tab][1];
  });
});

["msgGuild", "embedGuild", "anonGuild"].forEach((id) => {
  document.getElementById(id).addEventListener("change", () => {
    const map = {
      msgGuild: "msgChannel",
      embedGuild: "embedChannel",
      anonGuild: "anonChannel",
    };
    syncChannels(id, map[id]);
  });
});

document.getElementById("sendBotBtn").addEventListener("click", async () => {
  const status = document.getElementById("msgStatus");
  try {
    const data = await api("/api/send", {
      method: "POST",
      body: JSON.stringify({
        guildId: document.getElementById("msgGuild").value,
        channelId: document.getElementById("msgChannel").value,
        content: document.getElementById("msgContent").value,
        mode: "bot",
      }),
    });
    setStatus(status, `Gönderildi: ${data.url}`, true);
  } catch (err) {
    setStatus(status, err.message, false);
  }
});

document.getElementById("sendEmbedBtn").addEventListener("click", async () => {
  const status = document.getElementById("embedStatus");
  try {
    const data = await api("/api/embed", {
      method: "POST",
      body: JSON.stringify({
        guildId: document.getElementById("embedGuild").value,
        channelId: document.getElementById("embedChannel").value,
        title: document.getElementById("embedTitle").value,
        description: document.getElementById("embedDesc").value,
        color: document.getElementById("embedColor").value,
      }),
    });
    setStatus(status, `Embed gönderildi: ${data.url}`, true);
  } catch (err) {
    setStatus(status, err.message, false);
  }
});

document.getElementById("sendAnonBtn").addEventListener("click", async () => {
  const status = document.getElementById("anonStatus");
  try {
    const data = await api("/api/send", {
      method: "POST",
      body: JSON.stringify({
        guildId: document.getElementById("anonGuild").value,
        channelId: document.getElementById("anonChannel").value,
        content: document.getElementById("anonContent").value,
        mode: "anon",
        username: document.getElementById("anonName").value || "Anonim",
      }),
    });
    setStatus(status, `Anonim gönderildi: ${data.url}`, true);
  } catch (err) {
    setStatus(status, err.message, false);
  }
});

api("/api/me")
  .then(async () => {
    showApp();
    await loadDashboard();
  })
  .catch(() => showLogin());
