import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
mkdirSync(resolve(dist, 'assets'), { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js', 'story.js', 'bottle.js', 'cap.js', 'handle.js', 'dimensions.js', 'sticker-data.js', 'assets/decals', 'vendor']) {
  cpSync(resolve(root, file), resolve(dist, file), { recursive: true });
}
console.log('Built static website in dist/');
