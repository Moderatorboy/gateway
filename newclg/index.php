<?php
/**
 * Self-discovering entry point for CodexTRMS.
 *
 * Works correctly whether the folder is extracted:
 *   - At the domain root  (public_html/)
 *   - Inside a subfolder  (public_html/apna-college/, public_html/apna-college-fixed/, etc.)
 *   - On localhost via php -S or XAMPP virtual host
 *
 * It auto-detects the base path from the URL and injects three runtime
 * patches so the bundled JS keeps working without a rebuild:
 *   1. <base href>           — browser resolves relative asset paths correctly
 *   2. fetch interceptor     — prepends base to /api/... calls in the JS bundle
 *   3. wouter router patch   — strips base from window.location.pathname so the
 *                              wouter router matches routes like /batch/:id correctly
 *   4. history patch         — prepends base when pushState / replaceState are called
 */

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('apna_college_session');
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'use_strict_mode' => true,
    ]);
}

if (empty($_SESSION['app_api_token'])) {
    $_SESSION['app_api_token'] = bin2hex(random_bytes(16));
}

// Detect the directory this file lives in, relative to the server root.
// e.g. "" (root), "/apna-college", "/apna-college-fixed"
$scriptDir  = dirname($_SERVER['SCRIPT_NAME']);
$basePath   = rtrim(str_replace('\\', '/', $scriptDir), '/');
// The <base href> must end with a slash
$baseHref   = ($basePath === '' || $basePath === '.') ? '/' : $basePath . '/';
$apiToken   = (string) $_SESSION['app_api_token'];

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Referrer-Policy: strict-origin-when-cross-origin');
// header('X-Frame-Options: SAMEORIGIN');
header("Content-Security-Policy: frame-ancestors 'self' https://gatewayclasses.vercel.app http://127.0.0.1:* http://localhost:*");
?><!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>CodexTRMS</title>
    <meta name="description" content="CodexTRMS — structured video lectures and study material, organised into batches." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="CodexTRMS" />
    <meta property="og:description" content="CodexTRMS — structured video lectures and study material, organised into batches." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="CodexTRMS" />
    <meta name="twitter:description" content="CodexTRMS — structured video lectures and study material, organised into batches." />
    <meta name="app-api-token" content="<?= htmlspecialchars($apiToken, ENT_QUOTES) ?>" />

    <!--
      base href MUST come before any relative asset references.
      The browser uses it to resolve "assets/index.js" → "<base>/assets/index.js".
    -->
    <base href="<?= htmlspecialchars($baseHref, ENT_QUOTES) ?>">

    <!-- Assets: relative paths (no leading "/") so <base> applies -->
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<?php if ($basePath !== '' && $basePath !== '.'): ?>
    <!--
      Runtime shim: fixes the wouter router, fetch calls, and history API so the
      pre-built JS bundle works from any subfolder without a rebuild.
      This block is OMITTED entirely when the app is at the domain root.
    -->
    <script>
    (function () {
      var base = <?= json_encode($basePath) ?>; // e.g. "/apna-college-fixed"

      /* ── 1. fetch interceptor ──────────────────────────────────────────────
         The JS bundle calls fetch('/api/batches') etc. with absolute paths.
         Prepend the subfolder so the request goes to the right place.        */
      var _fetch = window.fetch;
      window.fetch = function (url, opts) {
        if (typeof url === 'string' && url.charAt(0) === '/' && url.slice(0, 5) === '/api/') {
          url = base + url;
        }
        return _fetch.apply(this, arguments);
      };

      /* ── 2. Location.pathname patch ────────────────────────────────────────
         wouter reads window.location.pathname to match routes.
         Strip the base prefix so wouter sees "/batch/xyz" not "/apna-college-fixed/batch/xyz". */
      try {
        var proto = Location.prototype;
        var orig  = Object.getOwnPropertyDescriptor(proto, 'pathname');
        if (orig && orig.get) {
          Object.defineProperty(proto, 'pathname', {
            get: function () {
              var p = orig.get.call(this);
              return (p.indexOf(base) === 0) ? (p.slice(base.length) || '/') : p;
            },
            configurable: true
          });
        }
      } catch (e) {}

      /* ── 3. history.pushState / replaceState patch ─────────────────────────
         wouter calls pushState('/batch/xyz') without the base prefix.
         Prepend it so the browser URL stays correct.                          */
      ['pushState', 'replaceState'].forEach(function (method) {
        var _orig = history[method];
        history[method] = function (state, title, url) {
          if (typeof url === 'string' && url.charAt(0) === '/' && url.slice(0, base.length) !== base) {
            url = base + url;
          }
          return _orig.call(this, state, title, url);
        };
      });

    })();
    </script>
<?php endif; ?>

    <script>
    (function () {
      var base = <?= json_encode($basePath) ?> || "";
      var tokenMeta = document.querySelector('meta[name="app-api-token"]');
      var appToken = tokenMeta ? tokenMeta.getAttribute("content") : "";
      var cache = {
        batches: null,
        videos: {},
        pdfs: {}
      };

      window.__APP_BASE_PATH__ = base;
      window.__APP_CACHE__ = cache;

      var originalFetch = window.fetch ? window.fetch.bind(window) : null;
      if (!originalFetch) {
        return;
      }

      function toAbsoluteApiUrl(url) {
        if (typeof url !== "string") {
          return url;
        }
        if (url.charAt(0) === "/" && url.slice(0, 5) === "/api/") {
          return base + url;
        }
        return url;
      }

      function withSecurityHeaders(input, init) {
        var nextInit = init ? Object.assign({}, init) : {};
        var nextHeaders = new Headers(nextInit.headers || (input && input.headers) || {});
        if (appToken) {
          nextHeaders.set("X-App-Token", appToken);
        }
        nextHeaders.set("X-Requested-With", "XMLHttpRequest");
        nextInit.headers = nextHeaders;
        if (!nextInit.credentials) {
          nextInit.credentials = "same-origin";
        }
        return nextInit;
      }

      function rememberResponse(url, response) {
        try {
          response.clone().json().then(function (data) {
            if (typeof url !== "string" || !data) {
              return;
            }
            if (url.indexOf("/api/batches") !== -1) {
              cache.batches = data;
              return;
            }
            if (url.indexOf("/api/videos") !== -1) {
              var videoUrl = new URL(url, window.location.origin);
              var videoCourseId = videoUrl.searchParams.get("courseId");
              if (videoCourseId) {
                cache.videos[videoCourseId] = data;
              }
              return;
            }
            if (url.indexOf("/api/pdfs") !== -1) {
              var pdfUrl = new URL(url, window.location.origin);
              var pdfCourseId = pdfUrl.searchParams.get("courseId");
              if (pdfCourseId) {
                cache.pdfs[pdfCourseId] = data;
              }
            }
          }).catch(function () {});
        } catch (error) {}
      }

      window.fetch = function (input, init) {
        var requestUrl = typeof input === "string" ? input : (input && input.url ? input.url : input);
        var nextUrl = toAbsoluteApiUrl(requestUrl);
        var nextInput = input;
        var nextInit = init;

        if (typeof input === "string") {
          nextInput = nextUrl;
          nextInit = withSecurityHeaders(input, init);
        } else if (input instanceof Request && typeof nextUrl === "string" && nextUrl !== input.url) {
          nextInput = new Request(nextUrl, input);
          nextInit = withSecurityHeaders(nextInput, init);
        } else if (typeof nextUrl === "string" && nextUrl.indexOf("/api/") !== -1) {
          nextInit = withSecurityHeaders(input, init);
        }

        return originalFetch(nextInput, nextInit).then(function (response) {
          if (response && response.ok) {
            rememberResponse(typeof nextInput === "string" ? nextInput : nextInput.url, response);
          }
          return response;
        });
      };

      function parseCount(text, label) {
        var match = (text || "").match(new RegExp("(\\\\d+)\\\\s+" + label, "i"));
        return match ? parseInt(match[1], 10) : 0;
      }

      function debounce(fn, wait) {
        var timer = null;
        return function () {
          var args = arguments;
          clearTimeout(timer);
          timer = setTimeout(function () {
            fn.apply(null, args);
          }, wait);
        };
      }

      function applyBranding(root) {
        document.title = "CodexTRMS";
        root.querySelectorAll("meta[property='og:title'], meta[name='twitter:title']").forEach(function (meta) {
          meta.setAttribute("content", "CodexTRMS");
        });
        root.querySelectorAll("meta[name='description'], meta[property='og:description'], meta[name='twitter:description']").forEach(function (meta) {
          meta.setAttribute("content", "CodexTRMS — structured video lectures and study material, organised into batches.");
        });
        root.querySelectorAll("*").forEach(function (node) {
          if (node.childNodes.length !== 1 || !node.firstChild || node.firstChild.nodeType !== 3) {
            return;
          }
          if ((node.textContent || "").trim() === "Apna College by Trma") {
            node.textContent = "CodexTRMS";
          }
        });
      }

      function upgradeFavouriteButtons(root) {
        root.querySelectorAll('button[aria-label*="favourites"]').forEach(function (button) {
          if (button.dataset.enhancedFavourite === "true") {
            return;
          }
          button.dataset.enhancedFavourite = "true";
          button.classList.add("app-favourite-button");
          button.addEventListener("click", function () {
            button.classList.add("app-favourite-bump");
            window.setTimeout(function () {
              button.classList.remove("app-favourite-bump");
            }, 280);
          });
        });
      }

      function hideSourceDetails(root) {
        root.querySelectorAll("*").forEach(function (node) {
          var text = (node.textContent || "").trim();
          if (!text) {
            return;
          }

          if (/^wistia$/i.test(text) || /^external$/i.test(text) || /^video player$/i.test(text) || /^external player$/i.test(text)) {
            node.remove();
            return;
          }

          if (/This lecture uses an external player\./i.test(text)) {
            node.textContent = "Lecture is ready to open.";
            return;
          }

          if (/^Open External Player$/i.test(text)) {
            node.textContent = "Play Lecture";
          }
        });
      }

      function ensureTelegramPopup(root) {
        if (root.getElementById("app-telegram-popup")) {
          return;
        }

        var popup = document.createElement("div");
        popup.id = "app-telegram-popup";
        popup.className = "app-telegram-popup";
        popup.innerHTML =
          '<div class="app-telegram-popup__backdrop"></div>' +
          '<div class="app-telegram-popup__card">' +
            '<button type="button" class="app-telegram-popup__close" aria-label="Close popup">x</button>' +
            '<p class="app-eyebrow">Community Access</p>' +
            '<h3>Join Telegram Channel</h3>' +
            '<p>Latest updates, quick help, and important announcements ke liye hamare Telegram channel se join ho jao.</p>' +
            '<a class="app-telegram-popup__button" href="https://t.me/+7q9n0MEJ0Jk1N2U1" target="_blank" rel="noreferrer">Join Telegram Channel</a>' +
          '</div>';

        root.body.appendChild(popup);

        var closeButton = popup.querySelector(".app-telegram-popup__close");
        var backdrop = popup.querySelector(".app-telegram-popup__backdrop");
        var storageKey = "codextrms-telegram-popup-dismissed";

        function hidePopup() {
          popup.classList.add("is-hidden");
          try {
            window.sessionStorage.setItem(storageKey, "1");
          } catch (error) {}
        }

        closeButton.addEventListener("click", hidePopup);
        backdrop.addEventListener("click", hidePopup);

        try {
          if (window.sessionStorage.getItem(storageKey) === "1") {
            popup.classList.add("is-hidden");
          }
        } catch (error) {}
      }

      function enhanceHomePage() {
        if (window.location.pathname.replace(base, "") !== "/" && window.location.pathname.replace(base, "") !== "") {
          return;
        }

        var batchAnchors = Array.prototype.slice.call(document.querySelectorAll('a[href*="/batch/"]'));
        if (!batchAnchors.length) {
          return;
        }

        var grid = batchAnchors[0].parentElement;
        if (!grid || grid.dataset.homeEnhanced === "true") {
          return;
        }
        grid.dataset.homeEnhanced = "true";
        grid.classList.add("app-batch-grid");

        var toolbar = document.createElement("div");
        toolbar.className = "app-toolbar";
        toolbar.innerHTML =
          '<div class="app-toolbar__head">' +
            '<div><p class="app-eyebrow">Smart Explore</p><h2>Find your batch faster</h2></div>' +
            '<div class="app-toolbar__stats"><span id="app-results-count">0 batches</span><span id="app-favourites-count">0 favourites</span></div>' +
          '</div>' +
          '<div class="app-toolbar__controls">' +
            '<label class="app-input-wrap"><input id="app-batch-search" type="search" placeholder="Search batch, exam, notes..." autocomplete="off"></label>' +
            '<label class="app-select-wrap"><select id="app-batch-sort"><option value="default">Default order</option><option value="favourites">Favourites first</option><option value="lectures">Most lectures</option><option value="notes">Most notes</option><option value="az">A to Z</option></select></label>' +
            '<button type="button" id="app-fav-only" class="app-chip">Favourites only</button>' +
            '<button type="button" id="app-popular-only" class="app-chip">Popular only</button>' +
          '</div>';

        grid.parentElement.insertBefore(toolbar, grid);

        var searchInput = toolbar.querySelector("#app-batch-search");
        var sortSelect = toolbar.querySelector("#app-batch-sort");
        var favOnlyButton = toolbar.querySelector("#app-fav-only");
        var popularOnlyButton = toolbar.querySelector("#app-popular-only");
        var resultsCount = toolbar.querySelector("#app-results-count");
        var favouritesCount = toolbar.querySelector("#app-favourites-count");
        var onlyFavourites = false;
        var onlyPopular = false;

        var originalOrder = batchAnchors.slice();

        function getBatchMeta(anchor, index) {
          var text = anchor.textContent || "";
          var titleNode = anchor.querySelector("h3");
          var favouriteButton = anchor.querySelector('button[aria-pressed]');
          return {
            anchor: anchor,
            index: index,
            title: titleNode ? titleNode.textContent.trim() : text.trim(),
            searchable: text.toLowerCase(),
            isFavourite: favouriteButton ? favouriteButton.getAttribute("aria-pressed") === "true" : false,
            isPopular: /popular/i.test(text),
            lectures: parseCount(text, "Lectures"),
            notes: parseCount(text, "Notes")
          };
        }

        function renderHomeFilters() {
          var query = (searchInput.value || "").trim().toLowerCase();
          var cards = originalOrder.map(getBatchMeta);
          var visible = cards.filter(function (item) {
            var matchesQuery = !query || item.searchable.indexOf(query) !== -1;
            var matchesFavourite = !onlyFavourites || item.isFavourite;
            var matchesPopular = !onlyPopular || item.isPopular;
            return matchesQuery && matchesFavourite && matchesPopular;
          });

          visible.sort(function (left, right) {
            switch (sortSelect.value) {
              case "favourites":
                if (left.isFavourite !== right.isFavourite) {
                  return left.isFavourite ? -1 : 1;
                }
                return left.index - right.index;
              case "lectures":
                return right.lectures - left.lectures || left.index - right.index;
              case "notes":
                return right.notes - left.notes || left.index - right.index;
              case "az":
                return left.title.localeCompare(right.title);
              default:
                return left.index - right.index;
            }
          });

          cards.forEach(function (item) {
            item.anchor.style.display = "none";
          });
          visible.forEach(function (item) {
            item.anchor.style.display = "";
            grid.appendChild(item.anchor);
          });

          resultsCount.textContent = visible.length + (visible.length === 1 ? " batch" : " batches");
          favouritesCount.textContent = cards.filter(function (item) { return item.isFavourite; }).length + " favourites";
          favOnlyButton.classList.toggle("is-active", onlyFavourites);
          popularOnlyButton.classList.toggle("is-active", onlyPopular);
        }

        searchInput.addEventListener("input", debounce(renderHomeFilters, 120));
        sortSelect.addEventListener("change", renderHomeFilters);
        favOnlyButton.addEventListener("click", function () {
          onlyFavourites = !onlyFavourites;
          renderHomeFilters();
        });
        popularOnlyButton.addEventListener("click", function () {
          onlyPopular = !onlyPopular;
          renderHomeFilters();
        });

        grid.addEventListener("click", function (event) {
          if (event.target.closest('button[aria-pressed]')) {
            window.setTimeout(renderHomeFilters, 40);
          }
        });

        upgradeFavouriteButtons(grid);
        renderHomeFilters();
      }

      function appendDownloadLink(anchor) {
        if (anchor.dataset.downloadEnhanced === "true") {
          return;
        }
        anchor.dataset.downloadEnhanced = "true";
        var url = anchor.getAttribute("href");
        if (!url) {
          return;
        }

        var action = document.createElement("span");
        action.className = "app-download-badge";
        action.textContent = "Download";
        anchor.appendChild(action);

        anchor.setAttribute("download", "");
      }

      function enhanceBatchPage() {
        var path = window.location.pathname.replace(base, "");
        if (!/^\/batch\//.test(path)) {
          return;
        }

        var lectureLinks = Array.prototype.slice.call(document.querySelectorAll('a[href*="/watch/"]'));
        if (lectureLinks.length) {
          var lectureContainer = lectureLinks[0].parentElement;
          if (lectureContainer && lectureContainer.dataset.batchVideosEnhanced !== "true") {
            lectureContainer.dataset.batchVideosEnhanced = "true";

            var lectureToolbar = document.createElement("div");
            lectureToolbar.className = "app-subtoolbar";
            lectureToolbar.innerHTML =
              '<input id="app-lecture-search" type="search" placeholder="Search lectures..." autocomplete="off">' +
              '<span id="app-lecture-count" class="app-subtoolbar__count"></span>';
            lectureContainer.parentElement.insertBefore(lectureToolbar, lectureContainer);

            var lectureSearch = lectureToolbar.querySelector("#app-lecture-search");
            var lectureCount = lectureToolbar.querySelector("#app-lecture-count");

            function renderLectureFilters() {
              var query = (lectureSearch.value || "").trim().toLowerCase();
              var visibleCount = 0;

              lectureLinks.forEach(function (link) {
                var text = (link.textContent || "").toLowerCase();
                var visible = !query || text.indexOf(query) !== -1;
                link.style.display = visible ? "" : "none";
                if (visible) {
                  visibleCount++;
                }
              });

              lectureCount.textContent = visibleCount + " visible";
            }

            lectureSearch.addEventListener("input", debounce(renderLectureFilters, 120));
            renderLectureFilters();
          }
        }
      }

      function enhanceWatchPage() {
        var path = window.location.pathname.replace(base, "");
        var match = path.match(/^\/watch\/([^\/]+)\/([^\/]+)/);
        if (!match) {
          return;
        }

        var batchId = decodeURIComponent(match[1]);
        var videoId = decodeURIComponent(match[2]);
        var detailCard = document.querySelector(".bg-white.border.border-slate-200.p-4.rounded-xl.shadow-sm");
        if (detailCard && detailCard.dataset.watchActionsEnhanced !== "true") {
          detailCard.dataset.watchActionsEnhanced = "true";
        }

        var playlistItems = Array.prototype.slice.call(document.querySelectorAll('a[href*="/watch/"]'));
        if (playlistItems.length) {
          var playlistContainer = playlistItems[0].parentElement;
          var playlistPanel = playlistContainer && playlistContainer.parentElement;
          if (playlistPanel && playlistPanel.dataset.watchPlaylistEnhanced !== "true") {
            playlistPanel.dataset.watchPlaylistEnhanced = "true";

            var playlistSearch = document.createElement("div");
            playlistSearch.className = "app-playlist-search";
            playlistSearch.innerHTML = '<input id="app-playlist-search" type="search" placeholder="Search playlist..." autocomplete="off">';
            playlistContainer.parentElement.insertBefore(playlistSearch, playlistContainer);

            var playlistInput = playlistSearch.querySelector("#app-playlist-search");
            var filterPlaylist = function () {
              var query = (playlistInput.value || "").trim().toLowerCase();
              playlistItems.forEach(function (item) {
                item.style.display = !query || (item.textContent || "").toLowerCase().indexOf(query) !== -1 ? "" : "none";
              });
            };
            playlistInput.addEventListener("input", debounce(filterPlaylist, 120));
          }
        }

      }

      function injectStyles() {
        if (document.getElementById("app-runtime-styles")) {
          return;
        }
        var style = document.createElement("style");
        style.id = "app-runtime-styles";
        style.textContent = `
          body {
            background:
              radial-gradient(circle at top left, rgba(250, 204, 21, 0.18), transparent 22%),
              radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 28%),
              linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,247,251,0.98));
          }
          .app-toolbar,
          .app-subtoolbar,
          .app-watch-actions,
          .app-playlist-search {
            border: 1px solid rgba(15, 23, 42, 0.08);
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(14px);
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
          }
          .app-toolbar {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            border-radius: 1rem;
            margin-bottom: 1.25rem;
          }
          .app-toolbar__head,
          .app-toolbar__controls,
          .app-subtoolbar,
          .app-watch-actions {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
          }
          .app-eyebrow {
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: rgb(37 99 235);
            margin-bottom: 0.35rem;
          }
          .app-toolbar h2 {
            font-family: "Outfit", sans-serif;
            font-size: 1.5rem;
            font-weight: 800;
            color: rgb(15 23 42);
          }
          .app-toolbar__stats {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .app-toolbar__stats span,
          .app-subtoolbar__count {
            display: inline-flex;
            align-items: center;
            padding: 0.45rem 0.8rem;
            border-radius: 999px;
            background: rgb(241 245 249);
            color: rgb(51 65 85);
            font-size: 0.82rem;
            font-weight: 700;
          }
          .app-input-wrap,
          .app-select-wrap {
            flex: 1 1 220px;
          }
          .app-toolbar input,
          .app-toolbar select,
          .app-subtoolbar input,
          .app-subtoolbar select,
          .app-playlist-search input {
            width: 100%;
            min-height: 46px;
            border: 1px solid rgba(148, 163, 184, 0.35);
            border-radius: 0.9rem;
            background: white;
            padding: 0.85rem 1rem;
            color: rgb(15 23 42);
            outline: none;
          }
          .app-chip,
          .app-action-button,
          .app-download-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            font-weight: 800;
            transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
          }
          .app-chip {
            min-height: 46px;
            padding: 0 1rem;
            border: 1px solid rgba(37, 99, 235, 0.18);
            background: rgba(37, 99, 235, 0.08);
            color: rgb(29 78 216);
          }
          .app-chip.is-active {
            background: rgb(29 78 216);
            color: white;
            transform: translateY(-1px);
          }
          .app-batch-grid > a {
            transition: transform 0.22s ease, filter 0.22s ease;
          }
          .app-batch-grid > a:hover {
            transform: translateY(-4px);
            filter: drop-shadow(0 18px 26px rgba(15, 23, 42, 0.12));
          }
          .app-favourite-button {
            position: relative;
            overflow: hidden;
          }
          .app-favourite-bump {
            transform: scale(1.08);
          }
          .app-download-badge {
            margin-left: auto;
            padding: 0.4rem 0.7rem;
            background: rgba(37, 99, 235, 0.08);
            color: rgb(29 78 216);
            font-size: 0.74rem;
          }
          .app-watch-actions {
            margin-top: 1rem;
            padding: 0.85rem;
            border-radius: 0.9rem;
            justify-content: flex-start;
          }
          .app-action-button {
            min-height: 42px;
            padding: 0 0.95rem;
            background: rgb(29 78 216);
            color: white;
          }
          .app-action-button--ghost {
            background: rgb(241 245 249);
            color: rgb(15 23 42);
            border: 1px solid rgba(148, 163, 184, 0.35);
          }
          .app-subtoolbar,
          .app-playlist-search {
            padding: 0.8rem;
            border-radius: 0.9rem;
            margin-bottom: 0.9rem;
          }
          .app-telegram-popup {
            position: fixed;
            inset: 0;
            z-index: 120;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .app-telegram-popup.is-hidden {
            display: none;
          }
          .app-telegram-popup__backdrop {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.62);
            backdrop-filter: blur(6px);
          }
          .app-telegram-popup__card {
            position: relative;
            z-index: 1;
            width: min(100%, 430px);
            border-radius: 1.2rem;
            padding: 1.5rem;
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(241,245,249,0.98));
            box-shadow: 0 28px 70px rgba(15, 23, 42, 0.28);
            border: 1px solid rgba(148, 163, 184, 0.28);
          }
          .app-telegram-popup__card h3 {
            font-family: "Outfit", sans-serif;
            font-size: 1.7rem;
            font-weight: 800;
            color: rgb(15 23 42);
            margin-bottom: 0.6rem;
          }
          .app-telegram-popup__card p:last-of-type {
            color: rgb(71 85 105);
            line-height: 1.6;
            margin-bottom: 1rem;
          }
          .app-telegram-popup__button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 48px;
            border-radius: 999px;
            background: #229ed9;
            color: white;
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .app-telegram-popup__close {
            position: absolute;
            top: 0.8rem;
            right: 0.8rem;
            width: 34px;
            height: 34px;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.06);
            color: rgb(15 23 42);
            font-weight: 800;
            cursor: pointer;
          }
          @media (max-width: 768px) {
            .app-toolbar h2 {
              font-size: 1.2rem;
            }
            .app-toolbar,
            .app-subtoolbar,
            .app-watch-actions,
            .app-playlist-search,
            .app-telegram-popup__card {
              border-radius: 0.8rem;
            }
          }
        `;
        document.head.appendChild(style);
      }

      function runEnhancements() {
        applyBranding(document);
        injectStyles();
        upgradeFavouriteButtons(document);
        hideSourceDetails(document);
        enhanceHomePage();
        enhanceBatchPage();
        enhanceWatchPage();
        ensureTelegramPopup(document);
      }

      document.addEventListener("DOMContentLoaded", function () {
        runEnhancements();
        var observer = new MutationObserver(debounce(runEnhancements, 80));
        observer.observe(document.body, { childList: true, subtree: true });
      });
    })();
    </script>
    <script type="module" crossorigin src="assets/index-DaLM1XSm.js"></script>
    <link rel="stylesheet" crossorigin href="assets/index-BPiSzT4-.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
