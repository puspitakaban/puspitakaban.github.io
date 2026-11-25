import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['app.js', 'story.js', 'bottle.js', 'cap.js', 'handle.js', 'dimensions.js', 'sticker-data.js', 'scripts/serve.mjs', 'scripts/build.mjs']) {
  const result = spawnSync(process.execPath, ['--check', resolve(root, file)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/(?:src|href)="\.\/([^"?]+)"/g)) {
  assert.ok(existsSync(resolve(root, match[1])), `Missing local asset: ${match[1]}`);
}
assert.ok(existsSync(resolve(root, 'vendor/three.core.min.js')), 'Three.js core missing');
const { backgroundSticker, stickers } = await import('../sticker-data.js');
assert.equal(new Set(stickers.map((entry) => entry.id)).size, stickers.length);
assert.equal(stickers.length,9,'All nine foreground stickers must be present');
assert.deepEqual(stickers.map((entry) => entry.number),[1,2,3,4,5,6,7,8,9]);
for (const sticker of stickers) assert.ok(existsSync(resolve(root,sticker.texture)),`Missing sticker texture: ${sticker.name}`);
assert.ok(existsSync(resolve(root,backgroundSticker.texture)),'Continuous ITS background is missing');
assert.ok(stickers.every((sticker) => backgroundSticker.layer < sticker.layer),'ITS must stay behind all foreground stickers');
const seas = stickers.find((entry) => entry.number === 7);
assert.equal(seas.width,seas.height,'SEAS must remain square on the bottle');
assert.equal(seas.horizontalScale,1,'SEAS must not inherit the width adjustment for other stickers');
assert.ok(stickers.every((entry) => !entry.enabled), 'Sticker interactions should remain dormant');
console.log('JavaScript syntax, nine decal assets, layer order, and square SEAS placement verified.');
