const TARGET = { lat: 39.0, lon: 35.0, label: "egexzon" };

const map = L.map("map", {
  center: [30, 20],
  zoom: 2,
  minZoom: 2,
  maxZoom: 6,
  zoomControl: false,
  attributionControl: false,
});

L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

const arcsLayer = L.layerGroup().addTo(map);
const markersLayer = L.layerGroup().addTo(map);
const seenIds = new Set();

function arcPoints(from, to, steps = 40) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const lat = from.lat + (to.lat - from.lat) * t;
    const lon = from.lon + (to.lon - from.lon) * t;
    const h = Math.sin(Math.PI * t) * 18;
    pts.push([lat + h * 0.15, lon]);
  }
  return pts;
}

function flag(code) {
  if (!code || code.length !== 2) return "🏴";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function addAttack(event) {
  if (seenIds.has(event.id)) return;
  seenIds.add(event.id);
  if (seenIds.size > 120) {
    const first = seenIds.values().next().value;
    seenIds.delete(first);
  }

  const from = { lat: event.sourceLat, lon: event.sourceLon };
  const to = { lat: event.targetLat || TARGET.lat, lon: event.targetLon || TARGET.lon };

  const color = event.severity === "CRITICAL" ? "#ff0040" : "#00ff9d";
  const arc = L.polyline(arcPoints(from, to), {
    color,
    weight: 2,
    opacity: 0.85,
    dashArray: event.severity === "CRITICAL" ? "6 8" : null,
  }).addTo(arcsLayer);

  setTimeout(() => arcsLayer.removeLayer(arc), 12000);

  const srcIcon = L.divIcon({
    className: "radar-src",
    html: `<div style="width:10px;height:10px;background:${color};border-radius:50%;box-shadow:0 0 12px ${color};animation:pulse 1s infinite"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  L.marker([from.lat, from.lon], { icon: srcIcon }).addTo(markersLayer);

  setTimeout(() => {
    markersLayer.eachLayer((layer) => {
      const ll = layer.getLatLng?.();
      if (ll && Math.abs(ll.lat - from.lat) < 0.01 && Math.abs(ll.lng - from.lon) < 0.01) {
        markersLayer.removeLayer(layer);
      }
    });
  }, 10000);

  prependFeed(event);
}

function prependFeed(event) {
  const feed = document.getElementById("feed");
  const el = document.createElement("div");
  el.className = `feed-item${event.severity === "CRITICAL" ? " critical" : ""}`;
  el.innerHTML = `
    <div>${flag(event.sourceCode)} <b>${event.sourceName}</b> → <b>${event.target || TARGET.label}</b></div>
    <div class="vec">${event.vector} · ${event.severity}</div>
    <div class="vec">${event.ip || ""}</div>
  `;
  feed.prepend(el);
  while (feed.children.length > 25) feed.lastChild.remove();
}

function positionTargetBadge() {
  const badge = document.querySelector(".target-badge");
  const pt = map.latLngToContainerPoint([TARGET.lat, TARGET.lon]);
  badge.style.left = `${pt.x}px`;
  badge.style.top = `${pt.y}px`;
}

map.on("move zoom resize", positionTargetBadge);
window.addEventListener("resize", positionTargetBadge);
setTimeout(positionTargetBadge, 500);

async function poll() {
  try {
    const res = await fetch("/api/radar/live");
    const data = await res.json();
    document.getElementById("statTotal").textContent = data.total || 0;
    document.getElementById("statLive").textContent = (data.events || []).length;
    for (const ev of (data.events || []).slice(0, 15)) {
      addAttack(ev);
    }
  } catch (e) {
    console.warn("radar poll", e);
  }
}

function tickClock() {
  document.getElementById("clock").textContent = new Date()
    .toLocaleTimeString("tr-TR", { hour12: false });
}

poll();
setInterval(poll, 4000);
setInterval(tickClock, 1000);
tickClock();
