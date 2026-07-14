/* ═══════════════════════════════════════════════════════
    sw.js — CODExTRMS Ultimate Service Worker (v3.1 Stable Engine)
    Root folder mein hona chahiye (/sw.js)
═══════════════════════════════════════════════════════ */

const SW_VERSION = "v4.3-stable";
const CACHE_NAMES = {
  STATIC: `codextrms-static-${SW_VERSION}`,
  DYNAMIC: `codextrms-dynamic-${SW_VERSION}`,
  IMAGES: `codextrms-images-${SW_VERSION}`,
};

const DEBUG_MODE = true;
function log(...args) {
  if (DEBUG_MODE)
    console.log(
      `%c[SW ${SW_VERSION}]`,
      "color: #10b981; font-weight: bold;",
      ...args,
    );
}
function logError(...args) {
  console.error(`[SW ${SW_VERSION}]`, ...args);
}

/* ─── FIREBASE SCRIPTS INJECTOR ─── */
try {
  importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
  );
  importScripts(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js",
  );
} catch (e) {
  logError(
    "External SDK scripts import stream blocked. Using native engine fallback context.",
  );
}

/* ─── 1. FIREBASE INITIALIZATION ─── */
let messaging = null;
if (typeof firebase !== "undefined") {
  try {
    firebase.initializeApp({
      apiKey: "AIzaSyAHyv1tLhlZIEEAyBbh_n_EK87D1jJdmH8",
      authDomain: "codextrms-82a70.firebaseapp.com",
      projectId: "codextrms-82a70",
      storageBucket: "codextrms-82a70.firebasestorage.app",
      messagingSenderId: "632525636529",
      appId: "1:632525636529:web:3ee2e58612f4436bfbf390",
    });
    messaging = firebase.messaging();
    log("Firebase Messaging engine up and running.");
  } catch (err) {
    logError("Firebase configurations parse failed:", err.message);
  }
}

/* ─── 2. STATIC RESOURCE CONFIGS ─── */
const IMMUTABLE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/badge-72.png",
];

self.addEventListener("install", (event) => {
  log("Installing assets configuration shell...");
  event.waitUntil(
    caches
      .open(CACHE_NAMES.STATIC)
      .then((cache) => cache.addAll(IMMUTABLE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  log("Activating dynamic structures...");
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      "navigationPreload" in self.registration
        ? self.registration.navigationPreload.enable()
        : Promise.resolve(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (!Object.values(CACHE_NAMES).includes(key)) {
              log(`Removing legacy layer: ${key}`);
              return caches.delete(key);
            }
          }),
        );
      }),
    ]),
  );
});

/* ─── STRATEGY FETCH ENGINE INTERCEPTOR ─── */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // Strategy 1: Live API Endpoint (Always live network, clear fallback structure)
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          caches.match("/offline.json") ||
          new Response(
            JSON.stringify({ error: "API connection drop. System offline." }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );
    return;
  }

  // Strategy 2: Media and design files (Cache First style)
  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((networkResponse) => {
            if (
              !networkResponse ||
              (networkResponse.status !== 200 && networkResponse.status !== 0)
            )
              return networkResponse;

            const responseToCache = networkResponse.clone();
            event.waitUntil(
              caches
                .open(CACHE_NAMES.IMAGES)
                .then((cache) => cache.put(request, responseToCache)),
            );
            return networkResponse;
          })
          .catch(() => new Response("Media loading failed", { status: 404 }));
      }),
    );
    return;
  }

  // Strategy 3: HTML / App Layout Pages (Stale-While-Revalidate Engine)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = Promise.resolve(event.preloadResponse)
        .then((preloadRes) => {
          if (preloadRes) {
            const resClone = preloadRes.clone();
            event.waitUntil(
              caches
                .open(CACHE_NAMES.DYNAMIC)
                .then((cache) => cache.put(request, resClone)),
            );
            return preloadRes;
          }

          return fetch(request).then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.status === 0)
            ) {
              const responseToCache = networkResponse.clone();
              event.waitUntil(
                caches
                  .open(CACHE_NAMES.DYNAMIC)
                  .then((cache) => cache.put(request, responseToCache)),
              );
            }
            return networkResponse;
          });
        })
        .catch(() => null);

      if (cachedResponse) {
        return cachedResponse;
      }

      return networkFetch.then((res) => {
        if (res) return res;
        return (
          caches.match("/index.html") ||
          new Response("System Offline", { status: 503 })
        );
      });
    }),
  );
});

/* ─── 3. SMART PUSH NOTIFICATIONS ─── */
function getNotificationLink(data = {}) {
  let rawLink = data.click_action || data.url || data.link || "/";
  try {
    return new URL(rawLink, self.location.origin).href;
  } catch (_) {
    return "/";
  }
}

function buildNotificationOptions(payload) {
  const { title, body, icon, image } = payload.notification || {};
  const data = payload.data || {};
  const link = getNotificationLink({ ...data, url: payload.fcmOptions?.link });
  const smartTag = data.tag || `codextrms-group-${data.groupId || "general"}`;

  return {
    title: title || "CODExTRMS Update",
    options: {
      body: body || "Kuchh naya upload hua hai, check karein! 🚀",
      icon: icon || "/icon-192.png",
      image: image || undefined,
      badge: "/badge-72.png",
      vibrate: [200, 100, 200, 100, 300],
      tag: smartTag,
      renotify: true,
      requireInteraction: data.sticky === "true",
      silent: data.silent === "true",
      data: {
        click_action: link,
        url: link,
        timestamp: Date.now(),
        ...data,
      },
      actions: [
        { action: "open", title: "👀 Dekho" },
        { action: "share", title: "🔗 Share" },
        { action: "close", title: "✖️ Baad Mein" },
      ],
    },
  };
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    log("FCM processing payload...");
    const { title, options } = buildNotificationOptions(payload);
    return self.registration.showNotification(title, options);
  });
}

self.addEventListener("push", (event) => {
  log("Native hardware trigger caught.");
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { notification: { body: event.data ? event.data.text() : "" } };
  }

  const { title, options } = buildNotificationOptions(payload);
  event.waitUntil(self.registration.showNotification(title, options));
});

/* ─── 4. INTERACTIVE NOTIFICATION CLICKS & ROUTING ─── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = getNotificationLink(event.notification.data);

  if (event.action === "share") {
    const shareUrl = `${self.location.origin}/share?url=${encodeURIComponent(targetUrl)}`;
    event.waitUntil(clients.openWindow(shareUrl));
    return;
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        for (const client of windowClients) {
          if (
            client.url.startsWith(self.location.origin) &&
            "focus" in client
          ) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch((err) =>
        logError("Window redirect sequence broken:", err.message),
      ),
  );
});

/* ─── 5. BACKGROUND LIFECYCLE SYNC ─── */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-failed-requests") {
    log("Background network sync operational.");
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "content-prefetch") {
    log("Periodic cron operation running...");
  }
});

/* ─── 6. SYSTEM OVERRIDES ERRORS SAFETY NET ─── */
self.addEventListener("error", (event) => {
  logError(`Runtime uncaught exception: ${event.message}`);
});

self.addEventListener("unhandledrejection", (event) => {
  logError(`Promise layer rejected state: ${event.reason}`);
});
