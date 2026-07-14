/* ═══════════════════════════════════════════════════════
   profile.js — CODExTRMS (Upgraded & Bug-Fixed)
   Features:
   - Name edit (localStorage)
   - Profile photo (upload + Google + remove)
   - Joined date edit
   - Courses completed — SMART SEARCHABLE DROPDOWN
   - Notification settings (toggles)
   - Google account connect (Firebase Auth)
   - Auto-load saved data on page open
   - ✅ FIXED: XSS via unescaped course names
   - ✅ FIXED: Event listener leak on repeated tab open
   - ✅ FIXED: Joined-date edit showing wrong hardcoded value
   - ✅ NEW: XP / Streak / Watch-time stats now actually render
   - ✅ NEW: Photo-too-large error now shown to user
   - ✅ Cute UI: avatar glow ring, streak flame, animated chips
═══════════════════════════════════════════════════════ */

/* ─── STORAGE KEYS ───────────────────────────────────── */
const PF_NAME = "user_name";
const PF_XP = "user_xp";
const PF_STREAK = "user_streak_days";
const PF_WATCH_TIME = "user_total_watch_time";
const PF_LAST_ACTIVE = "user_last_active_date";
const PF_PHOTO = "user_photo";
const PF_JOINED = "user_joined";
const PF_COURSES = "user_courses";
const PF_NOTIF = "notif_settings";
const PF_GOOGLE_EMAIL = "google_email";

/* ─── HELPERS ────────────────────────────────────────── */
function pfCurrentMonthYear() {
  return new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// Joined date ko wapas "YYYY-MM" format mein convert karta hai (month input ke liye)
// FIX: pehle hardcoded "2026-04" tha, ab actual saved value se derive hota hai
function pfJoinedToInputValue(joinedText) {
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  try {
    const parts = joinedText.trim().split(" ");
    if (parts.length !== 2) throw new Error("bad format");
    const monthIdx = months.indexOf(parts[0].toLowerCase());
    const year = parts[1];
    if (monthIdx === -1 || !/^\d{4}$/.test(year)) throw new Error("bad format");
    return `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  } catch {
    // Agar parse na ho paye to aaj ki date fallback ke roop mein
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
}

function pfFormatWatchTime(seconds) {
  seconds = Number(seconds || 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function pfTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pfUpdateDailyStreak() {
  const today = pfTodayKey();
  const last = pfGet(PF_LAST_ACTIVE, "");

  if (last === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  let streak = Number(pfGet(PF_STREAK, "0"));

  if (last === yKey) streak += 1;
  else streak = 1;

  pfSet(PF_STREAK, String(streak));
  pfSet(PF_LAST_ACTIVE, today);
}

function pfAddXP(amount = 10) {
  const oldXP = Number(pfGet(PF_XP, "0"));
  pfSet(PF_XP, String(oldXP + amount));
  pfRefreshStatsBar();
}

function pfAddWatchTime(seconds = 0) {
  const oldTime = Number(pfGet(PF_WATCH_TIME, "0"));
  pfSet(PF_WATCH_TIME, String(oldTime + Number(seconds || 0)));
  pfRefreshStatsBar();
}

function pfGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch {
    return fallback;
  }
}

// FIX: ab set fail hone pe true/false return karta hai, taaki caller ko pata chale
function pfSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error(`[Profile] Storage failed for ${key}:`, e.message);
    return false;
  }
}

function pfGetJSON(key, fallback = []) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function pfSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[Profile] Storage failed for ${key}:`, e.message);
    return false;
  }
}

// SECURITY FIX: HTML escape helper — user input ko safely display karne ke liye
function pfEscapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

function showToast(msg, type = "success") {
  const old = document.getElementById("pf-toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.id = "pf-toast";
  toast.textContent = msg;
  toast.style.cssText = `
        position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
        padding:10px 20px; border-radius:20px; font-size:0.85rem; font-weight:600;
        z-index:99999; transition:opacity 0.4s;
        background:${type === "error" ? "#ff4d6d" : "#00F0FF"};
        color:${type === "error" ? "#fff" : "#000"};
        box-shadow:0 4px 20px rgba(0,0,0,0.3);`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2200);
  setTimeout(() => {
    toast.remove();
  }, 2600);
}

/* ─── ALL BATCHES + SUBJECTS COLLECTOR ───────────────── */
function pfGetAllOptions() {
  const classMap = [
    { id: "13", name: "GATEWAY - 1ST YEAR", key: "dataClass13" },
    { id: "11", name: "APNA COLLEGE", key: "dataClass11" },
    { id: "101", name: "CHAI AUR CODE", key: "dataClass101" },
    { id: "102", name: "SUPREME COURSE", key: "dataClass102" },
    { id: "103", name: "WEDDING MASTERY", key: "dataClass103" },
    { id: "104", name: "PROFESSOR OF HOW", key: "dataClass104" },
    { id: "105", name: "PW SKILLS", key: "dataClass105" },
    { id: "106", name: "KEERTI PURSWANI HHLD", key: "dataClass106" },
    { id: "107", name: "FINANCIAL MODELING", key: "dataClass107" },
    { id: "108", name: "UDEMY", key: "dataClass108" },
    { id: "109", name: "TRADING", key: "dataClass109" },
    { id: "110", name: "DevOps", key: "dataClass110" },
    { id: "111", name: "HARKIRAT COHORT", key: "dataClass111" },
    { id: "112", name: "SHREYANSH CODING", key: "dataClass112" },
    { id: "113", name: "CAMPUS", key: "dataClass113" },
    { id: "114", name: "CODE WITH HARRY", key: "dataClass114" },
    { id: "115", name: "ADCA", key: "dataClass115" },
    { id: "116", name: "INEURON", key: "dataClass116" },
    { id: "117", name: "B4U", key: "dataClass117" },
  ];

  const options = [];

  classMap.forEach(({ name, key }) => {
    options.push({
      value: name,
      label: name,
      sublabel: "Batch",
      type: "batch",
      color: pfBatchColor(name),
      badge: pfBatchBadge(name),
    });

    const batches = window[key];
    if (Array.isArray(batches)) {
      batches.forEach((b) => {
        const subName = (b.batch_name || "").trim();
        if (!subName) return;
        options.push({
          value: subName,
          label: subName,
          sublabel: name,
          type: "subject",
          color: pfSubjectColor(subName),
          badge: pfSubjectBadge(subName),
        });
      });
    }
  });

  return options;
}

function pfBatchBadge(name) {
  const n = name.toLowerCase();
  if (n.includes("gateway")) return "GW";
  if (n.includes("apna")) return "AC";
  if (n.includes("chai")) return "CC";
  if (n.includes("supreme")) return "SC";
  if (n.includes("wedding")) return "WM";
  if (n.includes("professor")) return "PH";
  if (n.includes("pw")) return "PW";
  if (n.includes("keerti")) return "KP";
  if (n.includes("financial")) return "FM";
  if (n.includes("udemy")) return "UD";
  if (n.includes("trading")) return "TR";
  if (n.includes("devops")) return "DO";
  if (n.includes("harkirat")) return "HK";
  if (n.includes("shreyansh")) return "SH";
  if (n.includes("campus")) return "CA";
  if (n.includes("harry")) return "CWH";
  if (n.includes("adca")) return "AD";
  if (n.includes("ineuron")) return "IN";
  return "BT";
}
function pfBatchColor(name) {
  const n = name.toLowerCase();
  if (n.includes("gateway")) return "#8b5cf6";
  if (n.includes("apna")) return "#22c55e";
  if (n.includes("chai")) return "#d97706";
  if (n.includes("supreme")) return "#fbbf24";
  if (n.includes("wedding")) return "#ec4899";
  if (n.includes("professor")) return "#22d3ee";
  if (n.includes("pw")) return "#24abbf";
  if (n.includes("keerti")) return "#a78bfa";
  if (n.includes("financial")) return "#34d399";
  if (n.includes("udemy")) return "#a21caf";
  if (n.includes("trading")) return "#22c55e";
  if (n.includes("devops")) return "#38bdf8";
  if (n.includes("harkirat")) return "#818cf8";
  if (n.includes("shreyansh")) return "#fb923c";
  if (n.includes("campus")) return "#f472b6";
  if (n.includes("harry")) return "#60a5fa";
  if (n.includes("adca")) return "#4ade80";
  if (n.includes("ineuron")) return "#c084fc";
  return "#00F0FF";
}
function pfSubjectBadge(name) {
  const n = name.toLowerCase();
  if (n.includes("physics")) return "PHY";
  if (n.includes("math")) return "MAT";
  if (n.includes("chem")) return "CHE";
  if (n.includes("electrical")) return "ELE";
  if (n.includes("electronics")) return "ECT";
  if (n.includes("mechanical")) return "MEC";
  if (n.includes("soft")) return "SOF";
  if (n.includes("dsa")) return "DSA";
  if (n.includes("web") || n.includes("html") || n.includes("css")) return "WD";
  if (n.includes("python")) return "PY";
  if (n.includes("java")) return "JV";
  if (n.includes("c++") || n.includes("cpp")) return "C++";
  if (n.includes("react")) return "RCT";
  if (n.includes("node")) return "NOD";
  if (n.includes("sql") || n.includes("data")) return "SQL";
  if (n.includes("ai") || n.includes("ml")) return "AI";
  return "SUB";
}
function pfSubjectColor(name) {
  const n = name.toLowerCase();
  if (n.includes("physics")) return "#3b82f6";
  if (n.includes("math")) return "#ef4444";
  if (n.includes("chem")) return "#10b981";
  if (n.includes("electrical")) return "#f59e0b";
  if (n.includes("electronics")) return "#22c55e";
  if (n.includes("mechanical")) return "#ef4444";
  if (n.includes("soft")) return "#a855f7";
  if (n.includes("dsa")) return "#8b5cf6";
  if (n.includes("web") || n.includes("html") || n.includes("css"))
    return "#22c55e";
  if (n.includes("python")) return "#3b82f6";
  if (n.includes("java")) return "#f97316";
  if (n.includes("react")) return "#22d3ee";
  if (n.includes("node")) return "#22c55e";
  if (n.includes("sql") || n.includes("data")) return "#f59e0b";
  if (n.includes("ai") || n.includes("ml")) return "#a855f7";
  return "#00F0FF";
}

/* ─── BUILD PROFILE SECTION HTML ─────────────────────── */
let _pfOutsideClickBound = false; // FIX: listener leak rokne ke liye flag

function buildProfileSection() {
  const section = document.getElementById("profileSection");
  if (!section) return;

  const savedName = pfGet(PF_NAME, "Ayush Mishra / B2GPT");
  const savedPhoto = pfGet(PF_PHOTO, "");
  const savedJoined = pfGet(PF_JOINED, pfCurrentMonthYear());
  const savedCourses = pfGetJSON(PF_COURSES, []);
  const savedGoogleEmail = pfGet(PF_GOOGLE_EMAIL, "");
  const savedXP = Number(pfGet(PF_XP, "0"));
  const savedStreak = Number(pfGet(PF_STREAK, "0"));
  const savedWatchTime = Number(pfGet(PF_WATCH_TIME, "0"));

  // XSS FIX: naam se initials nikalte waqt bhi escape safe hai (textContent use hoga)
  const initials = savedName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarHtml = savedPhoto
    ? `<img src="${pfEscapeHtml(savedPhoto)}" onerror="this.style.display='none'" style="width:70px;height:70px;border-radius:50%;object-fit:cover;">`
    : `<div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(45deg,var(--neon-blue),var(--neon-purple));display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;color:#000;">${pfEscapeHtml(initials)}</div>`;

  // XP progress — next level har 500 XP pe (cute progress bar ke liye)
  const xpLevel = Math.floor(savedXP / 500) + 1;
  const xpIntoLevel = savedXP % 500;
  const xpPercent = Math.round((xpIntoLevel / 500) * 100);

  section.innerHTML = `

    <style>
    #pf-course-dropdown {
        position:absolute; top:calc(100% + 6px); left:0; right:0;
        background:#16162a;
        border:1px solid rgba(0,240,255,0.22);
        border-radius:14px; z-index:99999;
        max-height:300px; overflow-y:auto;
        box-shadow:0 16px 48px rgba(0,0,0,0.65);
        display:none;
        scrollbar-width:thin;
        scrollbar-color:rgba(0,240,255,0.2) transparent;
    }
    #pf-course-dropdown.pf-open { display:block; }
    #pf-course-dropdown::-webkit-scrollbar { width:4px; }
    #pf-course-dropdown::-webkit-scrollbar-thumb { background:rgba(0,240,255,0.2); border-radius:2px; }
    .pf-drop-section-header {
        font-size:0.6rem; font-weight:800; letter-spacing:0.12em; text-transform:uppercase;
        color:rgba(255,255,255,0.28); padding:10px 14px 4px;
        position:sticky; top:0; background:#16162a; z-index:1;
    }
    .pf-drop-item {
        display:flex; align-items:center; gap:10px;
        padding:8px 10px; margin:2px 6px; border-radius:10px;
        cursor:pointer; transition:background 0.15s;
    }
    .pf-drop-item:hover,.pf-drop-item.pf-highlighted { background:rgba(0,240,255,0.1); }
    .pf-drop-badge {
        width:36px; height:36px; border-radius:9px;
        display:flex; align-items:center; justify-content:center;
        font-size:0.58rem; font-weight:900; letter-spacing:0.04em; flex-shrink:0;
    }
    .pf-drop-info { flex:1; min-width:0; }
    .pf-drop-name {
        font-size:0.84rem; font-weight:600;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        color:rgba(255,255,255,0.92);
    }
    .pf-drop-sub { font-size:0.7rem; color:rgba(255,255,255,0.38); margin-top:1px; }
    .pf-drop-type {
        font-size:0.6rem; font-weight:800; padding:2px 8px;
        border-radius:999px; flex-shrink:0; letter-spacing:0.05em;
    }
    .pf-type-batch   { background:rgba(139,92,246,0.18); color:#a78bfa; }
    .pf-type-subject { background:rgba(0,240,255,0.12);  color:#00F0FF; }
    .pf-drop-empty {
        padding:20px; text-align:center;
        color:rgba(255,255,255,0.3); font-size:0.83rem;
    }
    .pf-chip {
        display:inline-flex; align-items:center; gap:5px;
        padding:4px 10px; border-radius:20px;
        background:rgba(0,240,255,0.1); border:1px solid rgba(0,240,255,0.2);
        font-size:0.78rem; color:var(--neon-blue); max-width:100%;
        animation: pfChipPop 0.25s ease;
    }
    @keyframes pfChipPop {
        from { opacity:0; transform:scale(0.7); }
        to   { opacity:1; transform:scale(1); }
    }
    .pf-chip span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .pf-chip-x { cursor:pointer; color:var(--neon-pink); font-size:1rem; line-height:1; flex-shrink:0; }

    /* ── CUTE UPGRADE: Avatar glow ring ── */
    .pf-avatar-ring {
        padding:3px;
        border-radius:50%;
        background: conic-gradient(var(--neon-blue), var(--neon-purple), var(--neon-pink, #ff4d9e), var(--neon-blue));
        display:inline-flex;
        animation: pfRingSpin 6s linear infinite;
    }
    @keyframes pfRingSpin {
        from { filter: hue-rotate(0deg); }
        to   { filter: hue-rotate(360deg); }
    }
    .pf-avatar-inner {
        background:#0b0b16;
        border-radius:50%;
        padding:2px;
        display:flex;
    }

    /* ── CUTE UPGRADE: Stats row (XP / Streak / Watch time) ── */
    .pf-stats-row {
        display:grid;
        grid-template-columns: repeat(3, 1fr);
        gap:10px;
        margin-bottom:18px;
    }
    .pf-stat-card {
        background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);
        border-radius:14px;
        padding:12px 10px;
        text-align:center;
        transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .pf-stat-card:hover {
        transform: translateY(-2px);
        border-color: rgba(0,240,255,0.3);
    }
    .pf-stat-icon { font-size:1.3rem; margin-bottom:4px; }
    .pf-stat-value { font-weight:800; font-size:1.05rem; line-height:1.1; }
    .pf-stat-label { font-size:0.68rem; color:var(--text-secondary); margin-top:2px; }
    .pf-xp-bar-track {
        margin-top:6px; height:5px; border-radius:3px;
        background:rgba(255,255,255,0.08); overflow:hidden;
    }
    .pf-xp-bar-fill {
        height:100%; border-radius:3px;
        background:linear-gradient(90deg,var(--neon-blue),var(--neon-purple));
        transition:width 0.4s ease;
    }
    </style>

    <!-- My Profile Card -->
    <div class="dashboard-card">
        <div class="card-header"><div class="card-title">My Profile</div></div>

        <!-- Avatar + Name -->
        <div style="display:flex;align-items:center;gap:15px;margin-bottom:18px;position:relative;">
            <div id="pf-avatar-wrap" style="cursor:pointer;position:relative;" onclick="pfTogglePhotoMenu()">
                <div class="pf-avatar-ring">
                  <div class="pf-avatar-inner">
                    <div id="pf-avatar-display">${avatarHtml}</div>
                  </div>
                </div>
                <div style="position:absolute;bottom:2px;right:2px;width:22px;height:22px;background:var(--neon-blue);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#000;border:2px solid #0b0b16;">
                    <i class="fas fa-camera"></i>
                </div>
            </div>
            <div style="flex:1;">
                <div id="pf-name-display" style="font-weight:700;font-size:1.1rem;display:flex;align-items:center;gap:8px;">
                    <span id="pf-name-text">${pfEscapeHtml(savedName)}</span>
                    <button onclick="pfEditName()" style="background:none;border:1px solid var(--neon-blue);color:var(--neon-blue);cursor:pointer;font-size:0.75rem;padding:2px 8px;border-radius:10px;">Edit</button>
                </div>
                <div id="pf-name-edit" style="display:none;align-items:center;gap:8px;margin-top:4px;">
                    <input id="pf-name-input" value="${pfEscapeHtml(savedName)}" style="flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--neon-blue);background:rgba(0,240,255,0.05);color:var(--text-primary);font-size:0.9rem;outline:none;">
                    <button onclick="pfSaveName()" style="padding:6px 14px;border-radius:8px;border:none;background:var(--neon-blue);color:#000;font-weight:700;cursor:pointer;font-size:0.8rem;">Save</button>
                    <button onclick="pfCancelName()" style="padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:none;color:var(--text-secondary);cursor:pointer;font-size:0.8rem;">x</button>
                </div>
                <div style="color:var(--text-secondary);font-size:0.9rem;margin-top:2px;">Premium Member</div>
            </div>
        </div>

        <!-- Photo Menu -->
        <div id="pf-photo-menu" style="display:none;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:12px;margin-bottom:15px;">
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">Change profile photo</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button onclick="pfUploadPhoto()" style="padding:6px 14px;border-radius:20px;border:1px solid var(--neon-blue);background:none;color:var(--neon-blue);font-size:0.8rem;cursor:pointer;"><i class="fas fa-upload"></i> Upload</button>
                <button onclick="pfUseGooglePhoto()" style="padding:6px 14px;border-radius:20px;border:1px solid #4285F4;background:none;color:#4285F4;font-size:0.8rem;cursor:pointer;"><i class="fab fa-google"></i> Google Photo</button>
                <button onclick="pfRemovePhoto()" style="padding:6px 14px;border-radius:20px;border:1px solid var(--neon-pink);background:none;color:var(--neon-pink);font-size:0.8rem;cursor:pointer;"><i class="fas fa-trash"></i> Remove</button>
            </div>
            <input type="file" id="pf-file-input" accept="image/*" style="display:none" onchange="pfHandleUpload(event)">
        </div>

        <!-- ── CUTE UPGRADE: Stats row — XP / Streak / Watch time ── -->
        <div class="pf-stats-row" id="pf-stats-row">
            <div class="pf-stat-card">
                <div class="pf-stat-icon">🔥</div>
                <div class="pf-stat-value" id="pf-stat-streak">${savedStreak}</div>
                <div class="pf-stat-label">Day Streak</div>
            </div>
            <div class="pf-stat-card">
                <div class="pf-stat-icon">⚡</div>
                <div class="pf-stat-value" id="pf-stat-xp">Lvl ${xpLevel}</div>
                <div class="pf-stat-label">${xpIntoLevel}/500 XP</div>
                <div class="pf-xp-bar-track"><div class="pf-xp-bar-fill" id="pf-xp-bar" style="width:${xpPercent}%;"></div></div>
            </div>
            <div class="pf-stat-card">
                <div class="pf-stat-icon">⏱️</div>
                <div class="pf-stat-value" id="pf-stat-watch">${pfFormatWatchTime(savedWatchTime)}</div>
                <div class="pf-stat-label">Watch Time</div>
            </div>
        </div>

        <!-- Fields -->
        <div style="margin:15px 0;">

            <!-- Joined -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <span style="color:var(--text-secondary);">Joined</span>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span id="pf-joined-text" style="font-weight:600;">${pfEscapeHtml(savedJoined)}</span>
                    <button onclick="pfEditJoined()" style="background:none;border:1px solid var(--neon-blue);color:var(--neon-blue);cursor:pointer;font-size:0.75rem;padding:2px 8px;border-radius:10px;">Edit</button>
                </div>
            </div>
            <div id="pf-joined-edit" style="display:none;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <span style="color:var(--text-secondary);flex-shrink:0;">Joined</span>
                <input type="month" id="pf-joined-input" value="${pfJoinedToInputValue(savedJoined)}" style="flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--neon-blue);background:rgba(0,240,255,0.05);color:var(--text-primary);font-size:0.85rem;outline:none;">
                <button onclick="pfSaveJoined()" style="padding:5px 12px;border-radius:8px;border:none;background:var(--neon-blue);color:#000;font-weight:700;cursor:pointer;font-size:0.78rem;">Save</button>
                <button onclick="pfCancelJoined()" style="padding:5px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:none;color:var(--text-secondary);cursor:pointer;font-size:0.78rem;">x</button>
            </div>

            <!-- ── COURSES COMPLETED ── -->
            <div style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <span style="color:var(--text-secondary);">Courses Completed</span>
                    <span id="pf-course-count" style="font-weight:700;color:var(--neon-blue);font-size:1rem;">${savedCourses.length}</span>
                </div>

                <!-- Chips -->
                <div id="pf-course-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;"></div>

                <!-- Search Input + Dropdown wrapper -->
                <div style="position:relative;" id="pf-course-search-wrap">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <div style="flex:1;position:relative;">
                            <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.3);font-size:0.8rem;pointer-events:none;"></i>
                            <input
                                id="pf-course-search"
                                type="text"
                                placeholder="Search batch ya subject..."
                                autocomplete="off"
                                style="width:100%;padding:9px 14px 9px 34px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:var(--text-primary);font-size:0.85rem;outline:none;box-sizing:border-box;transition:border-color 0.2s;"
                                oninput="pfDropdownSearch(this.value)"
                                onfocus="pfDropdownOpen()"
                            >
                        </div>
                        <button onclick="pfAddCustomCourse()" title="Custom naam likhke add karo"
                            style="padding:9px 14px;border-radius:10px;border:none;background:linear-gradient(45deg,var(--neon-blue),var(--neon-pink));color:#000;font-weight:700;cursor:pointer;font-size:0.8rem;white-space:nowrap;">
                            + Add
                        </button>
                    </div>
                    <!-- Dropdown -->
                    <div id="pf-course-dropdown"></div>
                </div>

                <div style="font-size:0.72rem;color:rgba(255,255,255,0.28);margin-top:6px;">
                    <i class="fas fa-info-circle"></i>
                    Search karke list se select karo, ya custom naam likhke "+ Add" dabao.
                </div>
            </div>
        </div>
    </div>

    <!-- Google Account Card -->
    <div class="dashboard-card">
        <div class="card-header"><div class="card-title">Google Account</div></div>
        <div id="pf-google-status" onclick="pfConnectGoogle()" style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);cursor:pointer;">
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(66,133,244,0.15);display:flex;align-items:center;justify-content:center;">
                <i class="fab fa-google" style="color:#4285F4;font-size:1.2rem;"></i>
            </div>
            <div style="flex:1;">
                <div id="pf-google-label" style="font-weight:600;font-size:0.9rem;">${pfEscapeHtml(savedGoogleEmail) || "Connect Google Account"}</div>
                <div id="pf-google-sub" style="font-size:0.78rem;color:var(--text-secondary);">${savedGoogleEmail ? "Connected - photo syncs automatically" : "Sign in to sync your photo automatically"}</div>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--text-secondary);font-size:0.8rem;"></i>
        </div>
    </div>

    <!-- Account Settings Card -->
    <div class="dashboard-card">
        <div class="card-header"><div class="card-title">Account Settings</div></div>
        <div class="menu-options" style="position:relative;display:block;box-shadow:none;width:100%;padding:0;">
            <div class="menu-option" onclick="pfEditNameFocus()">
                <i class="fas fa-user-edit"></i> Edit Profile
            </div>
            <div class="menu-option">
                <i class="fas fa-bell"></i> Notification Settings
            </div>
            <div class="menu-option" onclick="pfLogout()" style="color:var(--neon-pink);">
                <i class="fas fa-sign-out-alt"></i> Log Out
            </div>
        </div>
    </div>`;

  pfRenderCourseChips();
  pfDropdownRender("");

  // BUG FIX: outside-click listener sirf EK BAAR bind ho, har profile-open pe nahi
  if (!_pfOutsideClickBound) {
    document.addEventListener("mousedown", pfDropdownOutsideClick, true);
    _pfOutsideClickBound = true;
  }
}

/* Stats row ko live refresh karta hai bina poora section rebuild kiye (XP/watch time add hone pe) */
function pfRefreshStatsBar() {
  const streakEl = document.getElementById("pf-stat-streak");
  const xpEl = document.getElementById("pf-stat-xp");
  const xpBar = document.getElementById("pf-xp-bar");
  const watchEl = document.getElementById("pf-stat-watch");
  if (!streakEl) return; // profile abhi render nahi hua

  const savedXP = Number(pfGet(PF_XP, "0"));
  const savedStreak = Number(pfGet(PF_STREAK, "0"));
  const savedWatchTime = Number(pfGet(PF_WATCH_TIME, "0"));
  const xpLevel = Math.floor(savedXP / 500) + 1;
  const xpIntoLevel = savedXP % 500;
  const xpPercent = Math.round((xpIntoLevel / 500) * 100);

  streakEl.textContent = savedStreak;
  xpEl.textContent = `Lvl ${xpLevel}`;
  if (xpBar) xpBar.style.width = `${xpPercent}%`;
  watchEl.textContent = pfFormatWatchTime(savedWatchTime);
}

/* ═══════════════════════════════════════════════════════
   SMART DROPDOWN LOGIC
═══════════════════════════════════════════════════════ */
let _pfHighlightIdx = -1;
let _pfDropOptions = [];

function pfDropdownOpen() {
  const term = (
    (document.getElementById("pf-course-search") &&
      document.getElementById("pf-course-search").value) ||
    ""
  ).trim();
  pfDropdownRender(term);
  const dd = document.getElementById("pf-course-dropdown");
  if (dd) dd.classList.add("pf-open");
}

function pfDropdownSearch(term) {
  _pfHighlightIdx = -1;
  pfDropdownRender(term.trim());
  const dd = document.getElementById("pf-course-dropdown");
  if (dd) dd.classList.add("pf-open");
}

function pfDropdownRender(term) {
  const dd = document.getElementById("pf-course-dropdown");
  if (!dd) return;

  const allOptions = pfGetAllOptions();
  const courses = pfGetJSON(PF_COURSES, []);
  const lowerTerm = term.toLowerCase();

  const filtered = allOptions.filter((opt) => {
    if (courses.includes(opt.value)) return false;
    if (!lowerTerm) return true;
    return (
      opt.label.toLowerCase().includes(lowerTerm) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(lowerTerm))
    );
  });

  _pfDropOptions = filtered;

  if (filtered.length === 0) {
    dd.innerHTML = `<div class="pf-drop-empty">
            <i class="fas fa-search" style="display:block;font-size:1.2rem;margin-bottom:8px;opacity:0.4;"></i>
            Koi result nahi mila.<br>
            <span style="font-size:0.74rem;opacity:0.55;">Custom naam likhke "+ Add" dabao.</span>
        </div>`;
    return;
  }

  const batches = filtered.filter((o) => o.type === "batch");
  const subjects = filtered.filter((o) => o.type === "subject");

  let html = "";
  if (batches.length) {
    html += `<div class="pf-drop-section-header">BATCHES</div>`;
    batches.forEach((opt) => {
      html += pfDropItemHtml(opt, filtered.indexOf(opt), term);
    });
  }
  if (subjects.length) {
    html += `<div class="pf-drop-section-header">SUBJECTS</div>`;
    subjects.forEach((opt) => {
      html += pfDropItemHtml(opt, filtered.indexOf(opt), term);
    });
  }

  dd.innerHTML = html;

  dd.querySelectorAll(".pf-drop-item").forEach((el) => {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      pfDropSelectItem(parseInt(el.dataset.idx));
    });
  });
}

// SECURITY FIX: opt.label/sublabel already trusted (from window data), lekin
// search term highlight regex ko bhi escape kiya hai taaki special chars issue na karein
function pfDropItemHtml(opt, idx, term) {
  let displayLabel = pfEscapeHtml(opt.label);
  if (term) {
    const esc = pfEscapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    displayLabel = displayLabel.replace(
      new RegExp(`(${esc})`, "gi"),
      '<mark style="background:rgba(0,240,255,0.22);color:#fff;border-radius:2px;padding:0 2px;">$1</mark>',
    );
  }
  return `
    <div class="pf-drop-item" data-idx="${idx}">
        <div class="pf-drop-badge" style="background:${opt.color}18;color:${opt.color};border:1px solid ${opt.color}30;">
            ${opt.badge}
        </div>
        <div class="pf-drop-info">
            <div class="pf-drop-name">${displayLabel}</div>
            ${opt.sublabel ? `<div class="pf-drop-sub">${pfEscapeHtml(opt.sublabel)}</div>` : ""}
        </div>
        <div class="pf-drop-type ${opt.type === "batch" ? "pf-type-batch" : "pf-type-subject"}">
            ${opt.type === "batch" ? "BATCH" : "SUBJECT"}
        </div>
    </div>`;
}

function pfDropSelectItem(idx) {
  const opt = _pfDropOptions[idx];
  if (!opt) return;
  const courses = pfGetJSON(PF_COURSES, []);
  if (courses.includes(opt.value)) {
    showToast("Ye pehle se add hai!", "error");
    return;
  }
  courses.push(opt.value);
  pfSetJSON(PF_COURSES, courses);
  pfRenderCourseChips();
  const inp = document.getElementById("pf-course-search");
  if (inp) inp.value = "";
  pfDropdownRender("");
  const dd = document.getElementById("pf-course-dropdown");
  if (dd) dd.classList.remove("pf-open");
  showToast(`"${opt.value}" add ho gaya!`);
}

function pfAddCustomCourse() {
  const inp = document.getElementById("pf-course-search");
  const val = (inp ? inp.value : "").trim();
  if (!val) {
    showToast("Kuch to likhao pehle!", "error");
    return;
  }
  if (val.length > 80) {
    showToast("Naam thoda chhota rakho (max 80 chars)", "error");
    return;
  }
  const courses = pfGetJSON(PF_COURSES, []);
  // Case-insensitive duplicate check
  if (courses.some((c) => c.toLowerCase() === val.toLowerCase())) {
    showToast("Ye pehle se hai!", "error");
    return;
  }
  courses.push(val);
  pfSetJSON(PF_COURSES, courses);
  if (inp) inp.value = "";
  pfRenderCourseChips();
  pfDropdownRender("");
  showToast(`"${val}" add ho gaya!`);
}

function pfDropdownOutsideClick(e) {
  const wrap = document.getElementById("pf-course-search-wrap");
  if (!wrap) return;
  if (!wrap.contains(e.target)) {
    const dd = document.getElementById("pf-course-dropdown");
    if (dd) dd.classList.remove("pf-open");
  }
}

document.addEventListener("keydown", (e) => {
  const inp = document.getElementById("pf-course-search");
  if (document.activeElement !== inp) return;
  const dd = document.getElementById("pf-course-dropdown");
  if (!dd || !dd.classList.contains("pf-open")) return;
  const items = dd.querySelectorAll(".pf-drop-item");
  if (!items.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    _pfHighlightIdx = Math.min(_pfHighlightIdx + 1, items.length - 1);
    pfUpdateHighlight(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    _pfHighlightIdx = Math.max(_pfHighlightIdx - 1, 0);
    pfUpdateHighlight(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (_pfHighlightIdx >= 0) pfDropSelectItem(_pfHighlightIdx);
    else pfAddCustomCourse();
  } else if (e.key === "Escape") {
    dd.classList.remove("pf-open");
  }
});

function pfUpdateHighlight(items) {
  items.forEach((el, i) => {
    el.classList.toggle("pf-highlighted", i === _pfHighlightIdx);
    if (i === _pfHighlightIdx) el.scrollIntoView({ block: "nearest" });
  });
}

/* ─── CHIPS ──────────────────────────────────────────── */
// XSS FIX: naam ab pfEscapeHtml() se guzar ke render hota hai
function pfRenderCourseChips() {
  const container = document.getElementById("pf-course-chips");
  const countEl = document.getElementById("pf-course-count");
  if (!container) return;
  const courses = pfGetJSON(PF_COURSES, []);
  if (countEl) countEl.textContent = courses.length;
  if (courses.length === 0) {
    container.innerHTML = `<span style="font-size:0.8rem;color:rgba(255,255,255,0.3);">Koi course add nahi hai abhi. Search karke pehla add karo! 🎯</span>`;
    return;
  }
  container.innerHTML = courses
    .map((name, i) => {
      const safe = pfEscapeHtml(name);
      return `
        <span class="pf-chip">
            <span title="${safe}">${safe}</span>
            <span class="pf-chip-x" onclick="pfRemoveCourse(${i})">&times;</span>
        </span>
      `;
    })
    .join("");
}

function pfRemoveCourse(index) {
  const courses = pfGetJSON(PF_COURSES, []);
  const removed = courses.splice(index, 1)[0];
  pfSetJSON(PF_COURSES, courses);
  pfRenderCourseChips();
  const term = (
    (document.getElementById("pf-course-search") &&
      document.getElementById("pf-course-search").value) ||
    ""
  ).trim();
  pfDropdownRender(term);
  showToast(`"${removed}" remove ho gaya`);
}

/* ─── NOTIFICATION ROW BUILDER ───────────────────────── */
function pfBuildNotifRow(key, title, subtitle, isOn) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div>
            <div style="font-size:0.9rem;font-weight:600;">${pfEscapeHtml(title)}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${pfEscapeHtml(subtitle)}</div>
        </div>
        <div class="pf-toggle ${isOn ? "pf-toggle-on" : ""}" data-key="${key}" onclick="pfToggleNotif(this)"
             style="width:40px;height:22px;border-radius:11px;background:${isOn ? "var(--neon-blue)" : "rgba(255,255,255,0.15)"};position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0;">
            <div style="position:absolute;top:3px;left:${isOn ? "21px" : "3px"};width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;"></div>
        </div>
    </div>`;
}

/* ─── NAME EDIT ──────────────────────────────────────── */
function pfEditName() {
  document.getElementById("pf-name-display").style.display = "none";
  document.getElementById("pf-name-edit").style.display = "flex";
  document.getElementById("pf-name-input").focus();
}
function pfSaveName() {
  const val = document.getElementById("pf-name-input").value.trim();
  if (!val) {
    showToast("Name khali nahi chhod sakte!", "error");
    return;
  }
  if (val.length > 60) {
    showToast("Naam thoda chhota rakho (max 60 chars)", "error");
    return;
  }
  const ok = pfSet(PF_NAME, val);
  if (!ok) {
    showToast("Save nahi hua, storage full ho sakta hai", "error");
    return;
  }
  document.getElementById("pf-name-text").textContent = val;
  pfCancelName();
  if (!pfGet(PF_PHOTO, "")) {
    const initials = val
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const avatarDisplay = document.getElementById("pf-avatar-display");
    const inner = avatarDisplay ? avatarDisplay.querySelector("div") : null;
    if (inner) inner.textContent = initials;
  }
  showToast("Name update ho gaya!");
}
function pfCancelName() {
  document.getElementById("pf-name-display").style.display = "flex";
  document.getElementById("pf-name-edit").style.display = "none";
}
function pfEditNameFocus() {
  const nav = document.querySelector(
    '.nav-item[data-section="profileSection"]',
  );
  if (nav) nav.click();
  setTimeout(pfEditName, 200);
}

/* ─── PHOTO LOGIC ────────────────────────────────────── */
function pfTogglePhotoMenu() {
  const menu = document.getElementById("pf-photo-menu");
  if (!menu) return;
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}
function pfUploadPhoto() {
  document.getElementById("pf-file-input").click();
  document.getElementById("pf-photo-menu").style.display = "none";
}

// FIX: ab agar localStorage save fail ho (quota exceeded), user ko clearly bataya jata hai
function pfHandleUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Sirf image files allowed hain!", "error");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast("Photo 2MB se chhoti honi chahiye!", "error");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const ok = pfSet(PF_PHOTO, ev.target.result);
    if (!ok) {
      showToast(
        "Photo save nahi hui — storage full hai. Chhoti photo try karo.",
        "error",
      );
      return;
    }
    pfUpdateAvatarDisplay(ev.target.result);
    showToast("Photo update ho gayi! 📸");
  };
  reader.onerror = () => showToast("Photo padhne mein error aaya", "error");
  reader.readAsDataURL(file);
}
function pfUseGooglePhoto() {
  if (window._pfFirebaseUser && window._pfFirebaseUser.photoURL) {
    const ok = pfSet(PF_PHOTO, window._pfFirebaseUser.photoURL);
    if (!ok) {
      showToast("Photo save nahi hui, storage full hai", "error");
      return;
    }
    pfUpdateAvatarDisplay(window._pfFirebaseUser.photoURL);
    showToast("Google photo laga di!");
  } else {
    showToast("Pehle Google account connect karo", "error");
  }
  document.getElementById("pf-photo-menu").style.display = "none";
}
function pfRemovePhoto() {
  pfSet(PF_PHOTO, "");
  const name = pfGet(PF_NAME, "User");
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarEl = document.getElementById("pf-avatar-display");
  if (avatarEl)
    avatarEl.innerHTML = `<div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(45deg,var(--neon-blue),var(--neon-purple));display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:700;color:#000;">${pfEscapeHtml(initials)}</div>`;
  document.getElementById("pf-photo-menu").style.display = "none";
  showToast("Photo remove ho gayi");
}
function pfUpdateAvatarDisplay(src) {
  const el = document.getElementById("pf-avatar-display");
  if (el)
    el.innerHTML = `<img src="${pfEscapeHtml(src)}" onerror="this.style.display='none'" style="width:70px;height:70px;border-radius:50%;object-fit:cover;">`;
}

/* ─── JOINED DATE ────────────────────────────────────── */
function pfEditJoined() {
  document.getElementById("pf-joined-edit").style.display = "flex";
}
function pfSaveJoined() {
  const val = document.getElementById("pf-joined-input").value;
  if (!val) return;
  const [y, m] = val.split("-");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const formatted = months[parseInt(m) - 1] + " " + y;
  pfSet(PF_JOINED, formatted);
  document.getElementById("pf-joined-text").textContent = formatted;
  pfCancelJoined();
  showToast("Joining date save ho gayi!");
}
function pfCancelJoined() {
  document.getElementById("pf-joined-edit").style.display = "none";
}

/* ─── NOTIFICATIONS ──────────────────────────────────── */
function pfToggleNotif(el) {
  const key = el.dataset.key;
  const isOn = el.classList.contains("pf-toggle-on");
  const thumb = el.querySelector("div");
  if (isOn) {
    el.classList.remove("pf-toggle-on");
    el.style.background = "rgba(255,255,255,0.15)";
    if (thumb) thumb.style.left = "3px";
  } else {
    el.classList.add("pf-toggle-on");
    el.style.background = "var(--neon-blue)";
    if (thumb) thumb.style.left = "21px";
  }
  const s = pfGetJSON(PF_NOTIF, {});
  s[key] = !isOn;
  pfSetJSON(PF_NOTIF, s);
}

/* ─── GOOGLE AUTH ────────────────────────────────────── */
window._pfFirebaseUser = null;
function pfConnectGoogle() {
  if (typeof firebase === "undefined") {
    showToast("Firebase load nahi hua", "error");
    return;
  }

  // Cute loading feedback
  const label = document.getElementById("pf-google-label");
  const sub = document.getElementById("pf-google-sub");
  const originalLabel = label ? label.textContent : "";
  if (label) label.textContent = "Connecting...";
  if (sub) sub.textContent = "Please wait";

  const provider = new firebase.auth.GoogleAuthProvider();
  firebase
    .auth()
    .signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      window._pfFirebaseUser = user;
      pfSet(PF_GOOGLE_EMAIL, user.email);
      pfSet(PF_NAME, user.displayName || pfGet(PF_NAME, "User"));
      if (user.photoURL) {
        pfSet(PF_PHOTO, user.photoURL);
        pfUpdateAvatarDisplay(user.photoURL);
      }
      if (label) label.textContent = user.email;
      if (sub) sub.textContent = "Connected - photo syncs automatically";
      const nameEl = document.getElementById("pf-name-text");
      if (nameEl) nameEl.textContent = user.displayName;
      showToast("Google account connect ho gaya! ✅");
    })
    .catch((err) => {
      if (label) label.textContent = originalLabel || "Connect Google Account";
      if (sub) sub.textContent = "Sign in to sync your photo automatically";
      if (err.code === "auth/popup-closed-by-user") return;
      showToast("Google login failed: " + err.message, "error");
    });
}
function pfLogout() {
  if (typeof firebase !== "undefined")
    firebase
      .auth()
      .signOut()
      .catch(() => {});

  [
    PF_NAME,
    PF_XP,
    PF_STREAK,
    PF_WATCH_TIME,
    PF_LAST_ACTIVE,
    PF_PHOTO,
    PF_JOINED,
    PF_COURSES,
    PF_NOTIF,
    PF_GOOGLE_EMAIL,
  ].forEach((k) => localStorage.removeItem(k));

  showToast("Log out ho gaye!");
  setTimeout(() => location.reload(), 1000);
}

/* ─── INIT ───────────────────────────────────────────── */
function initProfile() {
  pfUpdateDailyStreak();
  buildProfileSection();
  if (typeof firebase !== "undefined" && typeof firebase.auth === "function") {
    firebase.auth().onAuthStateChanged((user) => {
      // Guard: agar already same user set hai to dobara UI update mat karo (redundant call avoid)
      if (user && window._pfFirebaseUser?.uid === user.uid) return;
      if (user) {
        window._pfFirebaseUser = user;
        pfSet(PF_GOOGLE_EMAIL, user.email);
        if (!pfGet(PF_JOINED, "")) {
          pfSet(PF_JOINED, pfCurrentMonthYear());
        }
        const label = document.getElementById("pf-google-label");
        const sub = document.getElementById("pf-google-sub");
        if (label) label.textContent = user.email;
        if (sub) sub.textContent = "Connected - photo syncs automatically";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const profileSection = document.getElementById("profileSection");
  if (profileSection && profileSection.classList.contains("active"))
    initProfile();

  const profileNavItem = document.querySelector(
    '.nav-item[data-section="profileSection"]',
  );
  if (profileNavItem) {
    profileNavItem.addEventListener("click", () => setTimeout(initProfile, 50));
  }
});
