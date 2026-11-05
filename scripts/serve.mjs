#!/usr/bin/env node
// Small production static server. No Vite dev server, Nginx, or runtime dependencies.
import http from 'node:http';
import { open, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};
const within = (root, file) => file === root || file.startsWith(`${root}${path.sep}`);

export function createStaticServer({ directory = 'dist', assetsDirectory } = {}) {
  const root = path.resolve(directory);
  const assets = assetsDirectory ? path.resolve(assetsDirectory) : null;
  const server = http.createServer({ maxHeaderSize: 16 * 1024 }, async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    const fail = (code, message) => {
      response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : `${message}\n`);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD'); return fail(405, 'Method not allowed');
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://static.invalid').pathname); }
    catch { return fail(400, 'Bad request'); }
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some((part) => part.startsWith('.'))) {
      return fail(403, 'Forbidden');
    }
    const sharedAsset = assets && pathname.startsWith('/assets/');
    const requestedRoot = sharedAsset ? assets : root;
    const relative = sharedAsset ? pathname.slice('/assets/'.length) : pathname.slice(1) || 'index.html';
    let handle;
    try {
      // Resolve current once per request: a symlink swap changes the next request,
      // not a file already being streamed. Refuse symlinks escaping the public root.
      const physicalRoot = await realpath(requestedRoot);
      const candidate = path.resolve(physicalRoot, relative);
      if (!within(physicalRoot, candidate)) return fail(403, 'Forbidden');
      const file = await realpath(candidate);
      if (!within(physicalRoot, file)) return fail(403, 'Forbidden');
      handle = await open(file, 'r');
      const info = await handle.stat();
      if (!info.isFile()) { await handle.close(); return fail(404, 'Not found'); }
      const immutable = pathname.startsWith('/assets/');
      response.writeHead(200, {
        'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      if (request.method === 'HEAD') { await handle.close(); return response.end(); }
      const stream = handle.createReadStream(); // Owns/closes the file descriptor.
      response.on('close', () => stream.destroy());
      stream.on('error', () => response.destroy());
      stream.pipe(response);
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      if (response.headersSent) return response.destroy();
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return fail(404, 'Not found');
      if (error.code === 'EACCES') return fail(403, 'Forbidden');
      console.error('Static server:', error.code || error.message);
      return fail(500, 'Internal server error');
    }
  });
  server.keepAliveTimeout = 5000;
  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  return server;
}

async function main() {
  const { values } = parseArgs({ options: {
    dir: { type: 'string', default: process.env.STATIC_DIR || 'dist' },
    assets: { type: 'string', default: process.env.ASSET_DIR },
    host: { type: 'string', default: process.env.HOST || '0.0.0.0' },
    port: { type: 'string', default: process.env.PORT || '5173' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log('Usage: node scripts/serve.mjs [--port 5173] [--host 0.0.0.0] [--dir dist] [--assets path]'); return;
  }
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port harus 1–65535.');
  if (!(await stat(path.join(values.dir, 'index.html'))).isFile()) throw new Error('index.html tidak ditemukan. Jalankan npm run build dahulu.');
  const server = createStaticServer({ directory: values.dir, assetsDirectory: values.assets });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} sudah dipakai. Hentikan proses lama atau pilih port lain.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, values.host, () => console.log(`Kota Kecil berjalan di http://${values.host}:${port}`));
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 10_000).unref();
  };
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`Kota Kecil: ${error.message}`); process.exitCode = 1; });
}
