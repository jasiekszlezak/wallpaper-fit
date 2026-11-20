const SCOPE = new URL(self.registration.scope);
const CACHE_PREFIX = `jnl-wallpaper-fit:${SCOPE.pathname}:`;
const CACHE = `${CACHE_PREFIX}v1`;
const FILES = [
  "./", "offline.html", "manifest.webmanifest", "css/style.css?v=20261115",
  "js/i18n.js?v=20261115", "js/phones.js?v=20261115",
  "js/wallpaper-engine.js?v=20261115", "js/app.js?v=20261115", "data/phones.json",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/maskable-512.png"
];
const APP_SHELL = new Set(FILES.map(path => new URL(path, SCOPE).href));

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...APP_SHELL])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key !== CACHE && key.startsWith(CACHE_PREFIX))
    .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (request.mode === "navigate" && (url.pathname === SCOPE.pathname || url.pathname === SCOPE.pathname + "index.html")) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(SCOPE.href)) || cache.match(new URL("offline.html", SCOPE).href);
    }));
  } else if (APP_SHELL.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(request)) || fetch(request)));
  }
});
