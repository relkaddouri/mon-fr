// Routeur et coquille de l'app.
import { $, $$ } from "./ui.js";
import { stopSpeaking } from "./audio.js";

const routes = {
  "": { mod: "home", title: "Mon français", tab: "accueil", wide: true },
  ecouter: { mod: "listen", title: "Écouter", tab: "ecouter" },
  parler: { mod: "speak", title: "Parler", tab: "parler" },
  ecrire: { mod: "write", title: "Écrire", tab: "ecrire" },
  coach: { mod: "coach", title: "Coach", tab: "coach" },
  progres: { mod: "progress", title: "Ma progression", tab: "progres", parent: "accueil", sub: true, wide: true },
  carnet: { mod: "notebook", title: "Mon carnet", tab: "carnet", parent: "accueil", sub: true },
  reglages: { mod: "settings", title: "Réglages", tab: "reglages", sub: true },
};

let cleanup = null, navToken = 0;
const view = $("#view");

async function navigate() {
  const token = ++navToken;
  const [path, query] = location.hash.replace(/^#\/?/, "").split("?");
  const r = routes[path] || routes[""];
  const params = Object.fromEntries(new URLSearchParams(query || ""));

  if (typeof cleanup === "function") { try { cleanup(); } catch {} }
  cleanup = null;
  stopSpeaking();

  $("#pageTitle").textContent = r.title;
  $("#backBtn").hidden = !r.sub;
  $$(".tabbar a").forEach((a) => {
    a.classList.toggle("active", a.dataset.tab === r.tab);
    a.classList.toggle("active-parent", !!r.parent && a.dataset.tab === r.parent);
  });
  view.className = "view" + (r.wide ? " wide" : "");
  view.innerHTML = "";
  window.scrollTo(0, 0);

  let mod;
  try { mod = await import(`./views/${r.mod}.js`); }
  catch { view.innerHTML = `<div class="banner warn" style="margin-top:16px">Impossible de charger cet écran. Vérifie ta connexion puis recharge la page.</div>`; return; }
  if (token !== navToken) return;
  const wrap = document.createElement("div");
  wrap.className = "fade-in";
  view.appendChild(wrap);
  const c = await mod.render(wrap, params);
  if (token !== navToken) { if (typeof c === "function") try { c(); } catch {} return; }
  cleanup = c;
}

$("#backBtn").addEventListener("click", () => (history.length > 1 ? history.back() : (location.hash = "#/")));
window.addEventListener("hashchange", navigate);
// Toucher l'onglet déjà ouvert le remet à zéro (comme dans une app native).
document.addEventListener("click", (e) => {
  const a = e.target.closest?.("a[href^='#']");
  if (a && a.getAttribute("href") === (location.hash || "#/")) { e.preventDefault(); navigate(); }
});
window.addEventListener("scroll", () => $("#topbar").classList.toggle("scrolled", window.scrollY > 4), { passive: true });

navigate();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
