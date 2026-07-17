const CACHE_PREFIX = "subscription-stats-";
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const CORE_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
  if (LOCAL_HOSTS.has(self.location.hostname)) return;
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (LOCAL_HOSTS.has(self.location.hostname)) return;

  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname === "/calendar.ics") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only guest pages are safe to cache. Account pages can contain
          // private server-rendered data and must never survive sign-out.
          if (response.ok && url.pathname.startsWith("/guest")) {
            const copy = response.clone();
            void caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          return (
            (url.pathname.startsWith("/guest") ? await caches.match(request) : undefined) ??
            (await caches.match("/offline.html")) ??
            new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
          );
        }),
    );
    return;
  }

  if (!["style", "script", "image", "font", "manifest"].includes(request.destination)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => undefined);
        }
        return response;
      });
      return cached ?? network;
    }),
  );
});
