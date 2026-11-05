import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createStaticServer } from '../scripts/serve.mjs';

async function fixture(t, deployment = false) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'kota-server-'));
  const release = path.join(temporary, 'release-one');
  await mkdir(path.join(release, 'assets'), { recursive: true });
  await writeFile(path.join(release, 'index.html'), '<h1>Kota Kecil v1</h1>');
  await writeFile(path.join(release, 'assets', 'app-abc12345.js'), 'console.log("v1")');
  await writeFile(path.join(release, 'assets', 'style-abc12345.css'), 'body{margin:0}');
  await writeFile(path.join(release, '__version.json'), '{"commit":"one"}');
  let directory = release, assetsDirectory;
  if (deployment) {
    directory = path.join(temporary, 'current');
    await symlink(release, directory);
    assetsDirectory = path.join(temporary, 'shared-assets');
    await mkdir(assetsDirectory);
    await writeFile(path.join(assetsDirectory, 'app-abc12345.js'), 'console.log("v1")');
  }
  const server = createStaticServer({ directory, assetsDirectory });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(temporary, { recursive: true, force: true });
  });
  return { temporary, release, directory, assetsDirectory, url: `http://127.0.0.1:${server.address().port}` };
}

test('serves HTML, JS, fonts-compatible MIME and HEAD without dev-host restrictions', async (t) => {
  const f = await fixture(t);
  const html = await fetch(f.url, { headers: { Host: '5173-example.instabox.tech' } });
  assert.equal(html.status, 200);
  assert.match(await html.text(), /Kota Kecil v1/);
  assert.equal(html.headers.get('cache-control'), 'no-cache');
  assert.equal(html.headers.get('x-content-type-options'), 'nosniff');
  const js = await fetch(`${f.url}/assets/app-abc12345.js?cache=1`);
  assert.match(js.headers.get('content-type'), /javascript/);
  assert.match(js.headers.get('cache-control'), /immutable/);
  const head = await fetch(f.url, { method: 'HEAD' });
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('content-length'), String(Buffer.byteLength('<h1>Kota Kecil v1</h1>')));
});

test('returns real 404s for missing assets instead of HTML and rejects unsupported methods', async (t) => {
  const f = await fixture(t);
  assert.equal((await fetch(`${f.url}/assets/missing.js`)).status, 404);
  assert.equal((await fetch(`${f.url}/not-here`)).status, 404);
  const post = await fetch(f.url, { method: 'POST', body: 'no' });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('allow'), 'GET, HEAD');
});

test('blocks hidden files, traversal, malformed paths and symlinks outside public files', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.temporary, 'secret.txt'), 'not public');
  await symlink(path.join(f.temporary, 'secret.txt'), path.join(f.release, 'escape.txt'));
  for (const suffix of ['/.git/config', '/%2e%2e%2fsecret.txt', '/escape.txt', '/bad%00name', '/foo%5cbar']) {
    assert.equal((await fetch(f.url + suffix)).status, 403, suffix);
  }
  assert.equal((await fetch(f.url + '/%E0%A4')).status, 400);
});

test('picks up atomic releases without restarting and retains old hashed assets', async (t) => {
  const f = await fixture(t, true);
  const second = path.join(f.temporary, 'release-two');
  await mkdir(second);
  await writeFile(path.join(second, 'index.html'), '<h1>Kota Kecil v2</h1>');
  await writeFile(path.join(second, '__version.json'), '{"commit":"two"}');
  await symlink(second, path.join(f.temporary, 'next'));
  await rename(path.join(f.temporary, 'next'), f.directory);
  assert.match(await (await fetch(f.url)).text(), /v2/);
  const version = await fetch(`${f.url}/__version.json`);
  assert.deepEqual(await version.json(), { commit: 'two' });
  assert.equal(version.headers.get('cache-control'), 'no-cache');
  assert.match(await (await fetch(`${f.url}/assets/app-abc12345.js`)).text(), /v1/);
});
