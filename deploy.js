const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let fp = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  fp = path.normalize(fp);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end('<!DOCTYPE html><html><body style="background:#0f0f1a;color:white;font-family:sans-serif;text-align:center;padding:40px"><h1>404</h1><p>Página no encontrada</p></body></html>'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`
  ╔══════════════════════════════════════╗
  ║     LinguaTutor AI — ONLINE         ║
  ╠══════════════════════════════════════╣
  ║  Local:  ${url}         ║
  ╚══════════════════════════════════════╝
  `);
});
