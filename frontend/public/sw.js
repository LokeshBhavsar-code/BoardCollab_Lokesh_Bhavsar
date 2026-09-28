/**
 * BoardCollab Service Worker — v2
 *
 * Caching strategies:
 *   Navigation (HTML)  -> Network-first, fallback to /index.html
 *   Static assets (JS/CSS/fonts/images) -> Stale-while-revalidate
 *   API calls (/api/*) -> Network-only (never cache)
 *   Socket.io          -> Bypass
 *
 * Background Sync -> posts TRIGGER_OFFLINE_SYNC to all clients on reconnect.
 */

const CACHE_VERSION = "boardcollab-v2";
const RUNTIME_CACHE = "boardcollab-runtime-v2";

const PRECACHE_URLS = ["/", "/index.html"];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) =>
        console.warn("[SW] Precache partial failure:", err)
      )
    )
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION && key !== RUNTIME_CACHE) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Always bypass non-GET, socket.io, and API calls
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/socket.io/") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // 2. Navigation requests -> Network-first, offline fallback to index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a fresh copy of the page
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/index.html") || await caches.match("/");
          return cached || new Response("Offline — BoardCollab", { status: 503 });
        })
    );
    return;
  }

  // 3. Stale-while-revalidate for all other GET requests (JS/CSS/fonts/images)
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === "basic" || networkResponse.type === "cors")
          ) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "boardcollab-replay-sync") {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_OFFLINE_SYNC" });
        });
      })
    );
  }
});

// ── Message handler ───────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
