"""Dependency-free localhost static preview at the real GitHub Pages subpath."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit
import os

ROOT = Path(__file__).resolve().parents[1] / 'dist'
PREFIX = '/vernier-caliper/'
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if urlsplit(self.path).path in ('/', PREFIX.rstrip('/')):
            self.send_response(302); self.send_header('Location', PREFIX); self.end_headers(); return
        if not urlsplit(self.path).path.startswith(PREFIX):
            self.send_error(404, 'Open /vernier-caliper/'); return
        super().do_GET()
    def translate_path(self, value):
        suffix = unquote(urlsplit(value).path)[len(PREFIX):] or 'index.html'
        resolved = (ROOT / suffix).resolve()
        return str(resolved if resolved.is_relative_to(ROOT.resolve()) else ROOT / '__forbidden__')
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Service-Worker-Allowed', PREFIX)
        super().end_headers()
port = int(os.environ.get('PORT', '4173'))
print(f'Precision Lab: http://127.0.0.1:{port}{PREFIX}\nKeep this terminal open. Ctrl+C stops the preview.', flush=True)
ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
