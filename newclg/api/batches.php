<?php
require __DIR__ . '/_upstream.php';

[$status, $data] = fetch_upstream_json('/api/batches');

if ($status !== 200 || $data === null) {
    send_json($status >= 400 && $status < 600 ? $status : 502, [
        'error' => 'Unable to load batches right now. Please try again shortly.',
    ]);
}

send_json(200, $data);
