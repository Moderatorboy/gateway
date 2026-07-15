<?php
/**
 * Shared helper: proxies JSON requests to the upstream content API and
 * applies a file cache. Includes retry logic and stale-cache fallback so
 * temporary upstream hiccups don't break the page for visitors.
 */

const UPSTREAM_BASE_URL      = 'https://apnacollege.codxraj.site';
const REQUEST_TIMEOUT_SECONDS = 15;   // raised from 10 — upstream can be slow
const CACHE_TTL_SECONDS       = 300;  // 5 min fresh cache
const STALE_CACHE_TTL_SECONDS = 3600; // serve stale up to 1 h when upstream is down
const MAX_RETRIES             = 1;    // retry once on transient failures
const USER_AGENT              = 'Mozilla/5.0 (compatible; ApnaCollegeProxy/1.0)';

bootstrap_api_session();
ensure_request_is_authorized();

/**
 * Fetches JSON from the upstream API at $path (e.g. "/api/batches" or
 * "/api/videos?courseId=xyz"), with a short on-disk cache, a request
 * timeout, one automatic retry, and a stale-cache fallback.
 * Returns an array: [statusCode, decodedBodyOrNull].
 */
function fetch_upstream_json(string $path): array
{
    $cacheDir  = sys_get_temp_dir() . '/apnacollege-proxy-cache';
    $cacheFile = null;

    if (@is_dir($cacheDir) || @mkdir($cacheDir, 0755, true)) {
        $cacheFile = $cacheDir . '/' . md5($path) . '.json';

        // Serve fresh cache if available
        if (is_readable($cacheFile)) {
            $age = time() - filemtime($cacheFile);
            if ($age < CACHE_TTL_SECONDS) {
                $cached  = @file_get_contents($cacheFile);
                $decoded = $cached !== false ? json_decode($cached, true) : null;
                if ($decoded !== null) {
                    return [200, $decoded];
                }
            }
        }
    }

    $url    = UPSTREAM_BASE_URL . $path;
    $status = 0;
    $body   = null;

    // Try up to MAX_RETRIES+1 times
    for ($attempt = 0; $attempt <= MAX_RETRIES; $attempt++) {
        if ($attempt > 0) {
            // Small back-off before retry
            usleep(500000); // 0.5 s
        }
        [$status, $body] = http_get_json($url);
        if ($status >= 200 && $status < 300 && $body !== null) {
            break;
        }
    }

    if ($status >= 200 && $status < 300 && $body !== null) {
        // Write fresh cache
        if ($cacheFile !== null) {
            @file_put_contents($cacheFile, json_encode($body), LOCK_EX);
        }
        return [200, $body];
    }

    // Upstream failed — try stale cache before giving up
    if ($cacheFile !== null && is_readable($cacheFile)) {
        $age = time() - filemtime($cacheFile);
        if ($age < STALE_CACHE_TTL_SECONDS) {
            $cached  = @file_get_contents($cacheFile);
            $decoded = $cached !== false ? json_decode($cached, true) : null;
            if ($decoded !== null) {
                // Serve stale data with a warning header so the browser still loads
                header('X-Cache: STALE');
                return [200, $decoded];
            }
        }
    }

    return [$status >= 400 && $status < 600 ? $status : 502, null];
}

/**
 * Performs the actual HTTP GET, preferring curl (most widely enabled on
 * shared hosting) and falling back to file_get_contents with a stream
 * context if curl is unavailable. Handles SSL quirks common on cheap hosts.
 */
function http_get_json(string $url): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => REQUEST_TIMEOUT_SECONDS,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'User-Agent: ' . USER_AGENT,
            ],
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 3,
            // Try with peer verification first
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $response = curl_exec($ch);
        $errno    = curl_errno($ch);

        // If SSL verification fails, retry without it (common on some shared hosts
        // that have an outdated CA bundle)
        if ($errno === CURLE_SSL_CERTPROBLEM ||
            $errno === CURLE_SSL_CACERT ||
            $errno === CURLE_SSL_CACERT_BADFILE ||
            $errno === 60 /* CURLE_PEER_FAILED_VERIFICATION */ ||
            $errno === 35 /* SSL connect error */) {
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            $response = curl_exec($ch);
            $errno    = curl_errno($ch);
        }

        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $errno !== 0) {
            return [502, null];
        }

        $decoded = json_decode($response, true);
        return [$status ?: 502, ($decoded !== null ? $decoded : null)];
    }

    // Fallback: file_get_contents (needs allow_url_fopen = On in php.ini)
    $context  = stream_context_create([
        'http' => [
            'method'        => 'GET',
            'header'        => implode("\r\n", [
                'Accept: application/json',
                'User-Agent: ' . USER_AGENT,
            ]),
            'timeout'       => REQUEST_TIMEOUT_SECONDS,
            'ignore_errors' => true,
        ],
        'ssl' => [
            // Allow self-signed certs as last resort
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ],
    ]);

    $response = @file_get_contents($url, false, $context);
    $status   = 502;

    if (isset($http_response_header)) {
        foreach ($http_response_header as $hdr) {
            if (preg_match('#^HTTP/\S+\s+(\d+)#', $hdr, $m)) {
                $status = (int) $m[1];
            }
        }
    }

    if ($response === false) {
        return [502, null];
    }

    $decoded = json_decode($response, true);
    return [$status, ($decoded !== null ? $decoded : null)];
}

function send_json(int $status, $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Vary: Origin');
    header('Access-Control-Allow-Origin: ' . get_request_origin_for_cors());
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-App-Token, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');
    header('X-Content-Type-Options: nosniff');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit;
    }
    echo json_encode($data);
    exit;
}

function require_query_param(string $name): string
{
    $value = isset($_GET[$name]) ? trim((string) $_GET[$name]) : '';
    if ($value === '') {
        send_json(400, ['error' => "Query parameter '{$name}' is required."]);
    }
    return $value;
}

function bootstrap_api_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('apna_college_session');
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
        'use_strict_mode' => true,
    ]);
}

function ensure_request_is_authorized(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        send_json(204, ['ok' => true]);
    }

    $sessionToken = isset($_SESSION['app_api_token']) ? (string) $_SESSION['app_api_token'] : '';
    $headerToken  = get_request_header('X-App-Token');
    $origin       = get_request_origin();

    if ($origin !== '' && !is_same_origin($origin)) {
        send_json(403, ['error' => 'Cross-origin API access is blocked.']);
    }

    if ($sessionToken === '' || $headerToken === '' || !hash_equals($sessionToken, $headerToken)) {
        send_json(403, ['error' => 'Direct API access is disabled for this application.']);
    }
}

function get_request_header(string $name): string
{
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return isset($_SERVER[$serverKey]) ? trim((string) $_SERVER[$serverKey]) : '';
}

function get_request_origin(): string
{
    if (!empty($_SERVER['HTTP_ORIGIN'])) {
        return trim((string) $_SERVER['HTTP_ORIGIN']);
    }

    if (!empty($_SERVER['HTTP_REFERER'])) {
        $parts = parse_url((string) $_SERVER['HTTP_REFERER']);
        if (!empty($parts['scheme']) && !empty($parts['host'])) {
            $port = isset($parts['port']) ? ':' . $parts['port'] : '';
            return $parts['scheme'] . '://' . $parts['host'] . $port;
        }
    }

    return '';
}

function get_request_origin_for_cors(): string
{
    $origin = get_request_origin();
    if ($origin !== '' && is_same_origin($origin)) {
        return $origin;
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? 'localhost');

    return $scheme . '://' . $host;
}

function is_same_origin(string $origin): bool
{
    $originParts = parse_url($origin);
    if ($originParts === false || empty($originParts['host'])) {
        return false;
    }

    $requestHost = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
    $requestHost = strtolower(preg_replace('/:\d+$/', '', $requestHost));
    $originHost  = strtolower((string) $originParts['host']);

    return $originHost === $requestHost;
}
