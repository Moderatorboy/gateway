/* ═══════════════════════════════════════════════════════
    firebase-config.js — CODExTRMS V2 (Upgraded - Fixed)
═══════════════════════════════════════════════════════ */

// ⚠️ YAHAN APNA VPS DOMAIN/IP DAALO
const NOTIF_SERVER = "https://notif.yourdomain.in";

const LAST_SEEN_KEY = "notif_last_seen";
const NOTIF_CACHE_KEY = "notif_cache";
const POLL_INTERVAL_MS = 30000;

let pollTimer = null;
let notificationsDB_latest = 0;

/* ─── SERVICE WORKER REGISTER ────────────────────────── */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => console.log("[SW] Registered:", reg.scope))
    .catch((err) => console.error("[SW] Failed:", err));
}

/* ─── FIREBASE SETUP ─────────────────────────────────── */
const firebaseConfig = {
  apiKey: "AIzaSyAHyv1tLhlZIEEAyBbh_n_EK87D1jJdmH8",
  authDomain: "codextrms-82a70.firebaseapp.com",
  projectId: "codextrms-82a70",
  storageBucket: "codextrms-82a70.firebasestorage.app",
  messagingSenderId: "632525636529",
  appId: "1:632525636529:web:3ee2e58612f4436bfbf390",
  measurementId: "G-FCNCPSF27C",
};

const VAPID_KEY =
  "BN8tpE1x-djFqs6P6xaEaxrdFMw5WqU_bBtr9zE8aDek-eGJkIGS1YmGvFv27pl_ER0Mqbl2odi-L2z_M0cqLaY";

// Global window check sequence to handle SDK load safe operations
if (typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig);
} else {
  console.error("[FCM] Firebase SDK is missing from the global window scope.");
}

const messaging = typeof firebase !== "undefined" && typeof firebase.messaging === "function" ? firebase.messaging() : null;

/* ─── NOTIFICATIONS SERVER SE FETCH (with retry) ─────── */
async function fetchNotificationsFromServer(retries = 2) {
  try {
    const res = await fetch(`${NOTIF_SERVER}/get-notifications?limit=20`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (!data.success || !data.notifications || !data.notifications.length)
      return;

    localStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(data.notifications));

    // Dynamic reference state tracking bug fix
    notificationsDB_latest = data.notifications[0].time;

    const lastSeen = parseInt(localStorage.getItem(LAST_SEEN_KEY) || "0");
    const newNotifs = data.notifications.filter((n) => n.time > lastSeen);

    renderNotificationsInPanel(data.notifications, lastSeen);

    // Dynamic evaluation tracking to fix infinite additions bug
    if (newNotifs.length > 0) {
      updateBadgeCount(newNotifs.length, true);
    } else {
      updateBadgeCount(0, false);
    }

    console.log(
      `[NOTIF] Fetched ${data.notifications.length}, New: ${newNotifs.length}`,
    );
  } catch (err) {
    console.warn("[NOTIF] Fetch failed:", err.message);

    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return fetchNotificationsFromServer(retries - 1);
    }

    loadFromCache();
  }
}

function loadFromCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(NOTIF_CACHE_KEY) || "[]");
    if (cached.length) {
      notificationsDB_latest = cached[0].time;
      const lastSeen = parseInt(localStorage.getItem(LAST_SEEN_KEY) || "0");
      renderNotificationsInPanel(cached, lastSeen);
    }
  } catch (e) {}
}

/* ─── NOTIFICATION PANEL RENDER (with click-to-batch) ── */
function renderNotificationsInPanel(notifications, lastSeen = 0) {
  const list = document.getElementById("notificationsList");
  if (!list) return;
  if (!notifications.length) return;

  list.innerHTML = "";

  notifications.forEach((notif) => {
    const isNew = notif.time > lastSeen;
    const item = document.createElement("div");
    item.className = "notification-item";

    if (notif.link) {
      item.style.cursor = "pointer";
    }

    if (isNew) {
      item.style.cssText +=
        "border-left: 3px solid var(--neon-blue); padding-left: 10px; background: rgba(0,240,255,0.04);";
    }

    // Safe dynamic elements configurations strategy
    const headerWrapper = document.createElement("div");
    headerWrapper.style.cssText =
      "display:flex; align-items:flex-start; justify-content:space-between; gap:8px;";

    const contentDiv = document.createElement("div");
    contentDiv.style.flex = "1";

    const titleDiv = document.createElement("div");
    titleDiv.style.cssText = "font-weight:600; font-size:0.9rem;";
    titleDiv.textContent = notif.title;

    const bodyDiv = document.createElement("div");
    bodyDiv.style.cssText =
      "font-size:0.82rem; color:var(--text-secondary); margin-top:3px; line-height:1.4;";
    bodyDiv.textContent = notif.body;

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(bodyDiv);
    headerWrapper.appendChild(contentDiv);

    if (isNew) {
      const dot = document.createElement("div");
      dot.style.cssText =
        "width:8px; height:8px; border-radius:50%; background:var(--neon-blue); flex-shrink:0; margin-top:4px;";
      headerWrapper.appendChild(dot);
    }

    const timeDiv = document.createElement("div");
    timeDiv.className = "notification-time";
    timeDiv.textContent = getTimeAgo(notif.time);

    item.appendChild(headerWrapper);
    item.appendChild(timeDiv);

    if (notif.link) {
      item.addEventListener("click", () => {
        window.location.href = notif.link;
      });
    }

    list.appendChild(item);
  });
}

/* ─── BADGE UPDATE ───────────────────────────────────── */
function updateBadgeCount(count, append = true) {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;

  let total = count;
  if (append) {
    const current = parseInt(localStorage.getItem("notif_unread") || "0");
    total = count; // Force sync to standard evaluated number lengths cleanly
  }

  if (total > 0) {
    badge.textContent = total > 99 ? "99+" : total;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
  localStorage.setItem("notif_unread", total.toString());
}

/* ─── CROSS-TAB BADGE SYNC ────────────────────────────── */
window.addEventListener("storage", (e) => {
  if (e.key === "notif_unread") {
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      const count = parseInt(e.newValue || "0");
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }
  if (e.key === NOTIF_CACHE_KEY) {
    loadFromCache();
  }
});

/* ─── NOTIFICATION PANEL OPEN ────────────────────────── */
function onNotificationPanelOpen() {
  if (notificationsDB_latest) {
    localStorage.setItem(LAST_SEEN_KEY, notificationsDB_latest.toString());
  }

  localStorage.setItem("notif_unread", "0");
  const badge = document.getElementById("notificationBadge");
  if (badge) badge.style.display = "none";

  document.querySelectorAll(".notification-item").forEach((item) => {
    item.style.borderLeft = "";
    item.style.background = "";
    // Clean safe dot updates strategy execution
    const dots = item.querySelectorAll('div[style*="border-radius:50%"]');
    dots.forEach((d) => d.remove());
  });
}

/* ─── FOREGROUND FCM MESSAGE ─────────────────────────── */
if (messaging) {
  messaging.onMessage((payload) => {
    console.log("[FCM] Foreground:", payload);
    const { title, body } = payload.notification || {};
    const clickAction =
      payload.data?.click_action || payload.fcmOptions?.link || null;

    showInAppBanner(title || "CODExTRMS", body || "Naya update!", clickAction);
    playNotifSound();
    fetchNotificationsFromServer();
  });
}

/* ─── NOTIFICATION SOUND ──────────────────────────────── */
function playNotifSound() {
  try {
    const audio = new Audio("/notif-sound.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {}
}

/* ─── IN-APP BANNER (XSS Clean Implementation) ──────── */
function showInAppBanner(title, body, clickAction = null) {
  const old = document.getElementById("fcm-banner");
  if (old) old.remove();

  const banner = document.createElement("div");
  banner.id = "fcm-banner";
  banner.style.cssText = `
        position: fixed;
        top: 70px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 380px;
        background: linear-gradient(135deg, #121A2A, #1a2540);
        border: 1px solid rgba(0,240,255,0.3);
        border-radius: 14px;
        padding: 14px 16px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        cursor: pointer;
    `;

  // Safe internal UI rendering to prevent XSS string scripts
  const styleBlock = document.createElement("style");
  styleBlock.textContent = `
    @keyframes fcmSlideDown {
        from { opacity:0; transform: translateX(-50%) translateY(-20px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
    }
    #fcm-banner { animation: fcmSlideDown 0.3s ease; }
  `;
  document.head.appendChild(styleBlock);

  const iconDiv = document.createElement("div");
  iconDiv.style.cssText =
    "width:42px;height:42px;border-radius:50%;background:linear-gradient(45deg,var(--neon-blue),var(--neon-purple));display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.3rem;";
  iconDiv.textContent = "🔔";

  const textWrap = document.createElement("div");
  textWrap.style.cssText = "flex:1;min-width:0;";

  const titleNode = document.createElement("div");
  titleNode.style.cssText =
    "font-weight:700;font-size:0.9rem;color:#fff;margin-bottom:3px;";
  titleNode.textContent = title;

  const bodyNode = document.createElement("div");
  bodyNode.style.cssText =
    "font-size:0.8rem;color:rgba(255,255,255,0.7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";
  bodyNode.textContent = body;

  textWrap.appendChild(titleNode);
  textWrap.appendChild(bodyNode);

  const closeBtn = document.createElement("div");
  closeBtn.style.cssText =
    "color:rgba(255,255,255,0.4);font-size:1.2rem;padding:4px;";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    banner.remove();
  });

  banner.appendChild(iconDiv);
  banner.appendChild(textWrap);
  banner.appendChild(closeBtn);

  banner.addEventListener("click", () => {
    if (clickAction) {
      window.location.href = clickAction;
    } else {
      const notificationIcon = document.getElementById("notificationIcon");
      if (notificationIcon) notificationIcon.click();
    }
    banner.remove();
  });

  document.body.appendChild(banner);

  setTimeout(() => {
    const b = document.getElementById("fcm-banner");
    if (b) {
      b.style.opacity = "0";
      b.style.transition = "opacity 0.4s";
      setTimeout(() => b.remove(), 400);
    }
  }, 5000);
}

/* ─── FCM TOKEN ──────────────────────────────────────── */
async function requestNotificationPermission() {
  if (!messaging) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const swReg = await navigator.serviceWorker.ready;
    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      localStorage.setItem("fcm_token", token);
      await saveTokenToServer(token);
      showFCMToast("Notifications enable ho gayi! 🔔");
    }
  } catch (err) {
    console.error("[FCM] Error:", err);
  }
}

async function saveTokenToServer(token) {
  try {
    await fetch(`${NOTIF_SERVER}/save-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        userId: localStorage.getItem("user_name") || "anonymous",
      }),
    });
    console.log("[FCM] Token saved!");
  } catch (err) {
    console.warn("[FCM] Token save failed:", err);
  }
}

/* ─── TOKEN REFRESH DETECTION ─────────────────────────── */
function checkAndRefreshToken() {
  if (Notification.permission !== "granted" || !messaging) return;

  navigator.serviceWorker.ready.then((swReg) => {
    messaging
      .getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
      .then((token) => {
        const savedToken = localStorage.getItem("fcm_token");
        if (token && token !== savedToken) {
          localStorage.setItem("fcm_token", token);
          saveTokenToServer(token);
          console.log("[FCM] Token refreshed & re-saved");
        }
      })
      .catch((err) =>
        console.warn("[FCM] Token refresh check failed:", err.message),
      );
  });
}

/* ─── TIME AGO ───────────────────────────────────────── */
function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Abhi abhi";
  if (mins < 60) return `${mins} min pehle`;
  if (hours < 24) return `${hours} ghante pehle`;
  return `${days} din pehle`;
}

/* ─── FCM TOAST ──────────────────────────────────────── */
function showFCMToast(msg) {
  const old = document.getElementById("fcm-toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.id = "fcm-toast";
  toast.textContent = msg;
  toast.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
        padding:10px 20px; border-radius:20px; font-size:0.85rem; font-weight:600;
        z-index:99999; background:var(--neon-blue); color:#000;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);
    `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s";
  }, 2500);
  setTimeout(() => toast.remove(), 3000);
}

/* ─── PERMISSION PROMPT ──────────────────────────────── */
function showPermissionPrompt() {
  localStorage.setItem("fcm_permission_asked", "true");

  const prompt = document.createElement("div");
  prompt.id = "fcm-permission-prompt";
  prompt.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
        width:90%; max-width:360px;
        background:linear-gradient(135deg,#121A2A,#1a2540);
        border:1px solid rgba(0,240,255,0.25); border-radius:16px;
        padding:18px; z-index:99998;
        box-shadow:0 8px 32px rgba(0,0,0,0.5);
    `;

  const styleBlock = document.createElement("style");
  styleBlock.textContent = `
    @keyframes fcmSlideUp {
        from{opacity:0;transform:translateX(-50%) translateY(20px)}
        to{opacity:1;transform:translateX(-50%) translateY(0)}
    }
    #fcm-permission-prompt { animation: fcmSlideUp 0.3s ease; }
  `;
  document.head.appendChild(styleBlock);

  prompt.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <div style="font-size:2rem;">🔔</div>
            <div>
                <div style="font-weight:700;font-size:0.95rem;color:#fff;">Notifications Enable Karo</div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.6);margin-top:2px;">New batch aane pe seedha phone pe notification aayegi</div>
            </div>
        </div>
        <div style="display:flex;gap:10px;">
            <button id="fcm-allow-btn" style="flex:1;padding:10px;border-radius:10px;border:none;background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;font-weight:700;font-size:0.85rem;cursor:pointer;">
                Allow Karo
            </button>
            <button id="fcm-deny-btn" style="padding:10px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:none;color:rgba(255,255,255,0.6);font-size:0.85rem;cursor:pointer;">
                Baad Mein
            </button>
        </div>
    `;

  document.body.appendChild(prompt);

  document.getElementById("fcm-allow-btn").addEventListener("click", () => {
    requestNotificationPermission();
    prompt.remove();
  });
  document.getElementById("fcm-deny-btn").addEventListener("click", () => {
    prompt.remove();
  });
}

/* ─── SMART POLLING ──────────────────────────────────── */
function startSmartPolling() {
  stopSmartPolling();
  fetchNotificationsFromServer();
  pollTimer = setInterval(fetchNotificationsFromServer, POLL_INTERVAL_MS);
}

function stopSmartPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSmartPolling();
  } else {
    startSmartPolling();
  }
});

/* ─── INIT ───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const notifIcon = document.getElementById("notificationIcon");
  if (notifIcon) {
    notifIcon.addEventListener("click", () => {
      const cached = JSON.parse(localStorage.getItem(NOTIF_CACHE_KEY) || "[]");
      if (cached.length) {
        notificationsDB_latest = cached[0].time;
        localStorage.setItem(LAST_SEEN_KEY, cached[0].time.toString());
      }
      onNotificationPanelOpen();
    });
  }

  if (!document.hidden) {
    startSmartPolling();
  }

  setTimeout(() => {
    const alreadyAsked = localStorage.getItem("fcm_permission_asked");
    if (!alreadyAsked && Notification.permission === "default") {
      showPermissionPrompt();
    }
    if (Notification.permission === "granted") {
      checkAndRefreshToken();
    }
  }, 3000);

  setInterval(checkAndRefreshToken, 24 * 60 * 60 * 1000);
});
