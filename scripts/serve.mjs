import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let file = resolve(root, relative);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    try {
      const info = await stat(file);
      if (info.isDirectory()) file = resolve(file, 'index.html');
    } catch {
      // Unknown file names return the single-page entry point only for navigational paths.
      if (extname(relative)) { res.writeHead(404); res.end('Not found'); return; }
      file = resolve(root, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch {
    res.writeHead(400); res.end('Bad request');
  }
}).listen(port, () => console.log(`BAND is running at http://localhost:${port}`));
