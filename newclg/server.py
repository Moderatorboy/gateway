#!/usr/bin/env python3
"""
Local development server for CodexTRMS.
Serves static files and proxies API requests to the upstream server.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, urljoin
from pathlib import Path
from datetime import datetime, timedelta

UPSTREAM_BASE_URL = 'https://apnacollege.codxraj.site'
CACHE_DIR = Path(__file__).parent / '.cache'
CACHE_TTL = 300  # 5 minutes
STALE_CACHE_TTL = 3600  # 1 hour


class ProxyHandler(SimpleHTTPRequestHandler):
    """HTTP handler that serves static files and proxies API requests."""

    def do_GET(self):
        """Handle GET requests."""
        # Parse the request path
        parsed = urlparse(self.path)
        path = parsed.path

        # Handle API proxy
        if path.startswith('/api/'):
            self.handle_api_request(path, parsed.query)
            return

        # Serve static files or index.html
        self.serve_static_file(path)

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-App-Token, X-Requested-With')
        self.end_headers()

    def handle_api_request(self, path, query):
        """Proxy API request to upstream server with caching."""
        # Build upstream URL
        upstream_path = path
        if query:
            upstream_path += '?' + query
        upstream_url = UPSTREAM_BASE_URL + upstream_path

        # Try to get cached data first
        cached_data = self.get_cached_data(path + '?' + query if query else path)
        if cached_data is not None:
            self.send_json_response(200, cached_data)
            return

        # Fetch from upstream
        try:
            headers = {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; ApnaCollegeLocal/1.0)',
            }
            req = urllib.request.Request(upstream_url, headers=headers)
            
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
                status = response.status
                
                # Cache successful response
                self.cache_data(path + '?' + query if query else path, data)
                self.send_json_response(status, data)
                return
        except urllib.error.HTTPError as e:
            # Try stale cache on HTTP error
            stale_data = self.get_stale_cached_data(path + '?' + query if query else path)
            if stale_data is not None:
                self.send_json_response(200, stale_data, is_stale=True)
                return
            
            self.send_json_response(e.code or 502, {'error': 'Unable to load data right now. Please try again shortly.'})
        except (urllib.error.URLError, Exception) as e:
            # Try stale cache on any error
            stale_data = self.get_stale_cached_data(path + '?' + query if query else path)
            if stale_data is not None:
                self.send_json_response(200, stale_data, is_stale=True)
                return
            
            print(f'Error fetching {upstream_url}: {e}', file=sys.stderr)
            self.send_json_response(502, {'error': 'Unable to load data right now. Please try again shortly.'})

    def serve_static_file(self, path):
        """Serve static files or index.html for SPA routing."""
        # Remove leading slash and convert to file path
        if path == '/' or path == '':
            # Generate HTML from index.php template
            self.serve_index_html()
            return
        else:
            file_path = Path(__file__).parent / path.lstrip('/')

        # Serve the file if it exists
        if file_path.is_file() and file_path.is_relative_to(Path(__file__).parent):
            self.serve_file(file_path)
        else:
            # For SPA routing, serve index.html
            self.serve_index_html()
    
    def serve_index_html(self):
        """Generate and serve the index.html from index.php template."""
        base_path = ''  # localhost root, no subfolder
        base_href = '/'
        
        # HTML content matching the index.php output
        html_content = f'''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>CodexTRMS</title>
    <meta name="description" content="CodexTRMS — structured video lectures and notes, organised into batches." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="CodexTRMS" />
    <meta property="og:description" content="CodexTRMS — structured video lectures and notes, organised into batches." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="CodexTRMS" />
    <meta name="twitter:description" content="CodexTRMS — structured video lectures and notes, organised into batches." />

    <base href="{base_href}">

    <link rel="icon" type="image/svg+xml" href="favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <script type="module" crossorigin src="assets/index-DaLM1XSm.js"></script>
    <link rel="stylesheet" crossorigin href="assets/index-BPiSzT4-.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>'''
        
        content = html_content.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', len(content))
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.end_headers()
        self.wfile.write(content)

    def serve_file(self, file_path):
        """Serve a static file."""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Determine content type
            content_type = self.guess_type(str(file_path))
            if content_type is None:
                content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(content))
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            print(f'Error serving {file_path}: {e}', file=sys.stderr)
            self.send_error(500, 'Internal server error')

    def send_json_response(self, status, data, is_stale=False):
        """Send JSON response with CORS headers."""
        response_body = json.dumps(data).encode('utf-8')
        
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(response_body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-App-Token, X-Requested-With')
        if is_stale:
            self.send_header('X-Cache', 'STALE')
        self.end_headers()
        self.wfile.write(response_body)

    def get_cache_path(self, path):
        """Get cache file path for a request path."""
        import hashlib
        cache_name = hashlib.md5(path.encode()).hexdigest() + '.json'
        return CACHE_DIR / cache_name

    def get_cached_data(self, path):
        """Get fresh cached data if available."""
        cache_path = self.get_cache_path(path)
        
        if not cache_path.exists():
            return None
        
        # Check if cache is fresh
        mtime = cache_path.stat().st_mtime
        age = datetime.now().timestamp() - mtime
        
        if age > CACHE_TTL:
            return None
        
        try:
            with open(cache_path, 'r') as f:
                return json.load(f)
        except Exception:
            return None

    def get_stale_cached_data(self, path):
        """Get stale cached data if available."""
        cache_path = self.get_cache_path(path)
        
        if not cache_path.exists():
            return None
        
        # Check if cache is within stale TTL
        mtime = cache_path.stat().st_mtime
        age = datetime.now().timestamp() - mtime
        
        if age > STALE_CACHE_TTL:
            return None
        
        try:
            with open(cache_path, 'r') as f:
                return json.load(f)
        except Exception:
            return None

    def cache_data(self, path, data):
        """Cache API response."""
        try:
            CACHE_DIR.mkdir(exist_ok=True)
            cache_path = self.get_cache_path(path)
            with open(cache_path, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            print(f'Error caching data: {e}', file=sys.stderr)

    def log_message(self, format, *args):
        """Log HTTP requests."""
        sys.stderr.write('[%s] %s\n' % (self.log_date_time_string(), format % args))
        sys.stderr.flush()


def main():
    """Start the development server."""
    # Change to app directory
    os.chdir(Path(__file__).parent)
    
    # Create cache directory
    CACHE_DIR.mkdir(exist_ok=True)
    
    # Start server
    port = 8080
    server_address = ('localhost', port)
    httpd = HTTPServer(server_address, ProxyHandler)
    
    print(f'\n🚀 CodexTRMS local server running at http://localhost:{port}/')
    print(f'   Press Ctrl+C to stop\n')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n\n✓ Server stopped.')
        sys.exit(0)


if __name__ == '__main__':
    main()
