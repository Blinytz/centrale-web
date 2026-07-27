"use strict";
const CACHE = "centrale-v1-pwa";
const RACINE = "/centrale-web/";
const ESSENTIELS = [
  RACINE, `${RACINE}index.html`, `${RACINE}manifest.webmanifest`,
  `${RACINE}favicon.svg`, `${RACINE}icons/icon-192.png`,
  `${RACINE}icons/icon-512.png`, `${RACINE}icons/icon-maskable-512.png`
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ESSENTIELS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(RACINE)) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => {
      if (!response.ok) throw new Error("Réponse invalide");
      const copie = response.clone();
      caches.open(CACHE).then(cache => cache.put(`${RACINE}index.html`, copie));
      return response;
    }).catch(() => caches.match(`${RACINE}index.html`)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copie = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copie));
    }
    return response;
  })));
});
