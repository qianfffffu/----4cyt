import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
let html = await readFile(resolve(dist, 'app.html'), 'utf8');

const scriptMatch = html.match(/<script type="module"[^>]*src="\.\/(assets\/[^\"]+\.js)"><\/script>/);
const styleMatch = html.match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^\"]+\.css)">/);
if (!scriptMatch || !styleMatch) throw new Error('Could not locate Vite output assets');

let javascript = await readFile(resolve(dist, scriptMatch[1]), 'utf8');
const stylesheet = await readFile(resolve(dist, styleMatch[1]), 'utf8');
const flower = await readFile(resolve(root, 'public/assets/flower.jpg'));
const flowerDataUrl = `data:image/jpeg;base64,${flower.toString('base64')}`;

javascript = javascript.replaceAll('./assets/flower.jpg', flowerDataUrl);
html = html
  .replace(scriptMatch[0], () => `<script type="module">${javascript}</script>`)
  .replace(styleMatch[0], () => `<style>${stylesheet}</style>`)
  .replaceAll('./assets/flower.jpg', flowerDataUrl);

const outputs = [resolve(root, 'index.html'), resolve(root, 'forcyt.html')];
await Promise.all(outputs.map((output) => writeFile(output, html)));
console.log(`Standalone page: ${outputs[0]}`);
