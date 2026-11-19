import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GAME_CATALOG } from '../catalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const gamesDir = path.join(rootDir, 'games');

test('GAME_CATALOG entries correspond to valid game directories and manifests', () => {
  assert.ok(Array.isArray(GAME_CATALOG) && GAME_CATALOG.length >= 1, 'GAME_CATALOG must have at least 1 game');

  const seenIds = new Set();
  for (const entry of GAME_CATALOG) {
    assert.ok(entry.id && /^[a-z0-9-]+$/.test(entry.id), `Invalid game id: ${entry.id}`);
    assert.ok(!seenIds.has(entry.id), `Duplicate game id: ${entry.id}`);
    seenIds.add(entry.id);

    const gDir = path.join(gamesDir, entry.id);
    const manifestPath = path.join(gDir, 'game.json');
    const htmlPath = path.resolve(rootDir, entry.entry);

    assert.ok(fs.existsSync(manifestPath), `Missing game.json for ${entry.id}`);
    assert.ok(fs.existsSync(htmlPath), `Missing HTML entry ${entry.entry} for ${entry.id}`);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.id, entry.id, `game.json id mismatch for ${entry.id}`);
    assert.ok(Array.isArray(manifest.styles) && manifest.styles.length >= 1);
    assert.ok(Array.isArray(manifest.modules) && manifest.modules.length >= 1);

    for (const cssRel of manifest.styles) {
      const cssAbs = path.resolve(gDir, cssRel);
      assert.ok(fs.existsSync(cssAbs), `Missing style "${cssRel}" referenced by ${entry.id}/game.json`);
    }
    for (const mod of manifest.modules) {
      assert.ok(mod.key && mod.path, `Invalid module entry in ${entry.id}/game.json`);
      const modAbs = path.resolve(gDir, mod.path);
      assert.ok(fs.existsSync(modAbs), `Missing module "${mod.path}" referenced by ${entry.id}/game.json`);
    }
  }
});

test('Every game folder under games/ is registered in GAME_CATALOG', () => {
  const dirs = fs.readdirSync(gamesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const catalogIds = new Set(GAME_CATALOG.map((g) => g.id));
  for (const d of dirs) {
    assert.ok(
      catalogIds.has(d.name),
      `Directory games/${d.name} is missing from shared/catalog.js`
    );
  }
});
