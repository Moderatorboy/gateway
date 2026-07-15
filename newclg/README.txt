Apna College by Trma — cPanel hosting package (v2 fixed)
==========================================================

WHAT THIS IS
------------
A ready-to-host build of the site plus PHP proxy scripts that fetch
course data from the upstream API server-side (avoiding browser CORS).

HOW TO DEPLOY ON cPANEL
------------------------
IMPORTANT: The files must live at the ROOT of your domain/subdomain,
not inside a subfolder. Follow these steps exactly:

1. Log in to cPanel → File Manager.
2. Navigate to public_html (or the folder your domain points to).
3. Click "Upload" and upload this zip file here — directly in public_html.
4. Right-click the zip → Extract → confirm it extracts HERE (not into a
   sub-folder). If cPanel creates a sub-folder named after the zip, move
   all files one level up so index.php, assets/, and api/ are directly
   inside public_html.
5. Visit your domain. No build step needed.

Alternatively, use FTP/SFTP and upload all files to the domain root.

CAN IT WORK IN A SUB-FOLDER? (e.g. public_html/apna-college/)
---------------------------------------------------------------
Yes. This build (v2) auto-detects its location at runtime — it works
whether it is at the root or inside any sub-folder. Just extract it
wherever you like; there is nothing to configure.

HOW TO TEST LOCALLY
-------------------
Option A (recommended — works anywhere):
  Open a terminal, cd into this folder, then run:
    php -S localhost:8080
  Open http://localhost:8080 in your browser.

Option B (XAMPP / WAMP / Laragon):
  Create a virtual host that points to this folder as document root.
  Do NOT run from a sub-folder like localhost/apna-college/ if you use
  Option B — use a virtual host so the site is served from the root.

REQUIREMENTS ON THE HOSTING ACCOUNT
-------------------------------------
- PHP 7.4+ (required — index.php is the entry point)
- Apache mod_rewrite (recommended; the site falls back gracefully if off)
- PHP curl or allow_url_fopen (for the API proxy; both are default on
  virtually all cPanel hosts)

WHAT WAS FIXED IN THIS BUILD (v2)
-----------------------------------
PROBLEM 1 — 404 on page refresh / direct URL access
  Root cause: The .htaccess "Options +FollowSymLinks" line added in v1
  is blocked on many cPanel servers, silently breaking the entire
  .htaccess file including the mod_rewrite rules.
  Fix: Removed that line. The .htaccess is now minimal and safe.

PROBLEM 2 — Everything breaks when extracted into a sub-folder
  Root cause: The original index.html uses absolute asset paths
  (/assets/...) and the JS bundle calls /api/batches etc. from the
  domain root. When the folder is extracted into a sub-folder, all
  these paths resolve to the wrong location.
  Fix: index.html replaced by index.php which auto-detects the
  deployment path and injects three runtime patches before the app
  loads:
    • <base href> so relative asset paths resolve correctly
    • fetch() interceptor so /api/ calls are prefixed with the base
    • window.location.pathname patch so the wouter router matches
      routes like /batch/:id correctly in a sub-folder
    • history.pushState / replaceState patch to keep the URL bar in sync

PROBLEM 3 — Content sometimes not loading (intermittent API failures)
  Fixes applied:
    • Timeout raised 10s → 15s
    • Automatic retry once on transient failures
    • Stale cache fallback: serves last good response for up to 1 hour
      when the upstream API is temporarily unreachable
    • SSL fallback: retries without peer verification if the host CA
      bundle is outdated (common on cheap shared hosting)
    • User-Agent header added (some upstreams block blank agents)
    • Cache TTL raised to 5 minutes to reduce load on upstream

NOTES
-----
- Favourites are stored in the visitor's own browser (localStorage).
  Nothing is stored on the server; there is no database.
- If the API proxy still fails after deploying, ask your host to confirm
  PHP curl or allow_url_fopen is enabled.
