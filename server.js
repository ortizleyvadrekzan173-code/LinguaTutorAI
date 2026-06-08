const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

let currentModel = 'tinyllama';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, history, lang, level, teacherName } = JSON.parse(body);

        const langNames = { en: 'English', de: 'German', fr: 'French', es: 'Spanish' };
        const targetLang = langNames[lang] || 'English';

        const systemPrompt = {
          role: 'system',
          content: `You are a friendly language teacher named ${teacherName || 'Professor'}. The student's native language is Spanish. The student is learning ${targetLang} at level ${level || 'A1'}. Your rules:
1. First respond in ${targetLang} (the language the student is learning)
2. Then explain or translate to Spanish so the student understands
3. Keep responses short and encouraging
4. Correct mistakes gently
5. Use simple language appropriate for ${level || 'A1'} level

Always respond in this format:
[response in ${targetLang}]

[explanation in Spanish]`
        };

        const messages = [systemPrompt];
        if (history && Array.isArray(history)) {
          history.forEach(h => messages.push(h));
        }
        messages.push({ role: 'user', content: message });

        const postData = JSON.stringify({
          model: currentModel,
          messages: messages,
          stream: false,
          options: { temperature: 0.7 }
        });

        const options = {
          hostname: '127.0.0.1',
          port: 11434,
          path: '/api/chat',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        };

        const proxyReq = http.request(options, (proxyRes) => {
          let data = '';
          proxyRes.on('data', chunk => data += chunk);
          proxyRes.on('end', () => {
            try {
              const result = JSON.parse(data);
              const reply = result.message?.content || 'Lo siento, no pude generar una respuesta.';
              sendJSON(res, 200, { reply });
            } catch (e) {
              sendJSON(res, 200, { reply: 'Error al procesar la respuesta de la IA.' });
            }
          });
        });

        proxyReq.on('error', () => {
          sendJSON(res, 200, { reply: '⚠️ No pude conectar con Ollama. ¿Está corriendo? Abre Ollama e intenta de nuevo.' });
        });

        proxyReq.write(postData);
        proxyReq.end();
      } catch (e) {
        sendJSON(res, 400, { error: 'Invalid request' });
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/status') {
    const checkReq = http.request({ hostname: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET' }, (checkRes) => {
      let data = '';
      checkRes.on('data', chunk => data += chunk);
      checkRes.on('end', () => {
        try {
          const info = JSON.parse(data);
          const models = (info.models || []).map(m => m.name);
          sendJSON(res, 200, { online: true, model: currentModel, models });
        } catch { sendJSON(res, 200, { online: false, model: null, models: [] }); }
      });
    });
    checkReq.on('error', () => sendJSON(res, 200, { online: false, model: null, models: [] }));
    checkReq.end();
    return;
  }

  serveStatic(req, res);
}).listen(PORT, () => {
  console.log(`LinguaTutor AI server on http://localhost:${PORT}`);
  console.log(`Ollama model: ${currentModel}`);
});
