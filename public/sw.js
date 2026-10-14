// Service worker : l'app s'ouvre même hors ligne (les fonctions IA demandent internet).
const VERSION = "mf-v3";
const SHELL = [
  "/", "/index.html", "/styles.css", "/manifest.webmanifest", "/seed.js",
  "/js/app.js", "/js/store.js", "/js/api.js", "/js/prompts.js", "/js/ui.js", "/js/audio.js",
  "/js/views/home.js", "/js/views/write.js", "/js/views/speak.js", "/js/views/listen.js",
  "/js/views/coach.js", "/js/views/progress.js", "/js/views/notebook.js", "/js/views/settings.js",
  "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/icons/favicon-64.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Polices Google : cache d'abord.
  if (url.host.includes("fonts.g")) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      c.put(e.request, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // App : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("/index.html")))
  );
});
