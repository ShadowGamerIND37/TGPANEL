#!/usr/bin/env node
/* ==========================================================================
 * TG-PANEL — UI preview server (zero dependencies)
 * --------------------------------------------------------------------------
 * Serves the static assets from /public and uses the standalone design
 * showcase at /public/preview.html as the root page. Useful for reviewing
 * the Aurora Pro UI without a database or daemon running.
 *
 *   npm run preview                 # http://0.0.0.0:4173
 *   PORT_PREVIEW=5000 npm run preview
 * ========================================================================== */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../public');
const PORT = parseInt(process.env.PORT_PREVIEW || process.env.PORT || '4173', 10);
const HOST = process.env.HOST_PREVIEW || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function safeJoin(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch (e) { return null; }
  if (decoded.indexOf('\0') !== -1) return null;
  const resolved = path.resolve(ROOT, '.' + decoded);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (urlPath === '/api/health') {
    return send(res, 200, JSON.stringify({
      success: true, status: 'ok', service: 'tg-panel-ui-preview',
      uptime: Math.round(process.uptime()), timestamp: new Date().toISOString()
    }), { 'Content-Type': MIME['.json'] });
  }

  // The preview is static: API calls must answer with JSON, never HTML.
  if (urlPath.startsWith('/api/')) {
    return send(res, 404, JSON.stringify({
      success: false, error: 'This is a static UI preview — no API is connected', path: urlPath
    }), { 'Content-Type': MIME['.json'] });
  }

  let filePath = urlPath === '/' ? path.join(ROOT, 'preview.html') : safeJoin(urlPath);
  if (!filePath) return send(res, 403, 'Forbidden', { 'Content-Type': MIME['.txt'] });

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA-ish fallback for extensionless URLs.
      if (!path.extname(filePath)) filePath = path.join(ROOT, 'preview.html');
      else return send(res, 404, 'Not found', { 'Content-Type': MIME['.txt'] });
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    if (/\.(png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf)$/i.test(ext)) {
      headers['Cache-Control'] = 'public, max-age=86400';
    }
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(res, 500, 'Internal server error', { 'Content-Type': MIME['.txt'] });
      send(res, 200, data, headers);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n  TG-PANEL UI preview ready\n  → http://localhost:${PORT}\n  → serving ${ROOT}\n`);
});

['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => {
  server.close(() => process.exit(0));
}));
