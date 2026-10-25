import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '.output/public');
const port = process.env.PORT || 3000;
const baseURL = '/app';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // /app プレフィックスを除去
  if (reqPath.startsWith(baseURL)) {
    reqPath = reqPath.slice(baseURL.length) || '/';
  } else if (reqPath === '/' || reqPath === '') {
    // / へのアクセスは /app/ へリダイレクト
    res.writeHead(302, { Location: '/app/' });
    res.end();
    return;
  }

  let filePath = path.join(publicDir, reqPath);

  // ディレクトリなら index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // ファイルが存在しない場合は SPA フォールバック (index.html)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(publicDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Service-Worker-Allowed': '/app/'
    });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`\n🐑 SheepComb PWA Preview Server running!`);
  console.log(`➜ Local:   http://localhost:${port}/app/`);
  console.log(`➜ Ready for PWA install & offline testing.\n`);
});
