/** Local-only development server. No packages or npm install are needed. */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8000);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.wasm': 'application/wasm', '.wav': 'audio/wav', '.qmd': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const server = createServer(async (req, res) => {
    try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405);
            res.end('Method not allowed');
            return;
        }
        const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        let file = path.resolve(root, '.' + requested);
        if (path.relative(root, file).startsWith('..')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }
        let info = await stat(file);
        if (info.isDirectory()) {
            file = path.join(file, 'index.html');
            info = await stat(file);
        }
        if (!info.isFile())
            throw new Error('Not a file');
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Content-Length': info.size });
        if (req.method === 'HEAD') {
            res.end();
            return;
        }
        createReadStream(file).pipe(res);
    }
    catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found. Keep the complete textbook folder together.');
    }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Game Lab: http://127.0.0.1:${port}/games/\nBook preview: http://127.0.0.1:${port}/preview.html\nPress Ctrl+C to stop.`));
