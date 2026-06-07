const http = require('http');
const fs = require('fs');
const path = require('path');
const localtunnel = require('localtunnel');

const PORT = 3000;
const ROOT = __dirname;
const URL_FILE = path.join(ROOT, 'public_url.txt');
const SUBDOMAIN = 'lt-linguaturb-' + Date.now().toString(36);

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
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<!DOCTYPE html><body style="background:#0f0f1a;color:white;font-family:sans-serif;text-align:center;padding:40px"><h1>404</h1></body>');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, async () => {
  const localUrl = `http://localhost:${PORT}`;
  fs.writeFileSync(URL_FILE, `Local: ${localUrl}\n`);
  console.log(`✅ Servidor local: ${localUrl}`);
  try {
    const tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });
    const publicUrl = tunnel.url;
    fs.writeFileSync(URL_FILE, `Local: ${localUrl}\nPublic: ${publicUrl}\n`);
    console.log(`\n═══════════════════════════════════════════`);
    console.log(`   🌐  LINK PÚBLICO: ${publicUrl}`);
    console.log(`   📤  Comparte este enlace!`);
    console.log(`═══════════════════════════════════════════\n`);
    tunnel.on('close', () => { process.exit(0); });
    tunnel.on('error', (e) => { console.log('Tunnel error:', e.message); });
  } catch (e) {
    console.log(`⚠️  Tunnel falló: ${e.message}`);
    fs.writeFileSync(URL_FILE, `Local: ${localUrl}\nError: ${e.message}\n`);
  }
});
