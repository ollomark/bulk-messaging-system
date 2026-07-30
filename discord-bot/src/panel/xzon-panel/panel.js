/** Fake XZON panel gate — UI only, no real auth / dashboard. */

const form = document.getElementById("keyForm");
const input = document.getElementById("accessKey");
const btn = document.getElementById("enterBtn");
const status = document.getElementById("status");

function setStatus(text, kind = "") {
  status.textContent = text;
  status.classList.remove("err", "ok");
  if (kind) status.classList.add(kind);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = String(input.value || "").trim();
  if (!key) {
    setStatus("Anahtar gerekli.", "err");
    return;
  }

  btn.disabled = true;
  btn.classList.add("loading");
  setStatus("Anahtar doğrulanıyor…");

  // Sahte gecikme — gerçek oturum / panel yok
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));

  btn.disabled = false;
  btn.classList.remove("loading");
  form.classList.remove("shake");
  void form.offsetWidth;
  form.classList.add("shake");

  setStatus("Anahtar geçersiz. Bu ekran yalnızca giriş demosu.", "err");
  input.focus();
  input.select();
});

input.focus();
