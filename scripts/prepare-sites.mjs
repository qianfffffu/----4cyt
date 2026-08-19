import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const client = resolve(root, 'dist/client');
const server = resolve(root, 'dist/server');
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });
await copyFile(resolve(root, 'index.html'), resolve(client, 'index.html'));
await writeFile(resolve(server, 'index.js'), `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
  }
};\n`);
