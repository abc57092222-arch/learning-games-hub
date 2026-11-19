import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const MODULES = [
  { key: 'equationEngine', file: 'src/math/equationEngine.js' },
  { key: 'levels', file: 'src/data/levels.js' },
  { key: 'soundEngine', file: 'src/audio/soundEngine.js' },
  { key: 'scaleRenderer', file: 'src/ui/scaleRenderer.js' },
  { key: 'graphRenderer', file: 'src/ui/graphRenderer.js' },
  { key: 'sandboxView', file: 'src/ui/sandboxView.js' },
  { key: 'gameController', file: 'src/ui/gameController.js' },
  { key: 'main', file: 'src/main.js' },
];

const FILE_TO_KEY = {
  'equationEngine.js': 'equationEngine',
  'levels.js': 'levels',
  'soundEngine.js': 'soundEngine',
  'scaleRenderer.js': 'scaleRenderer',
  'graphRenderer.js': 'graphRenderer',
  'sandboxView.js': 'sandboxView',
  'gameController.js': 'gameController',
};

function transformModuleToIIFE(key, code) {
  const exportedNames = new Set();

  // Replace multi-line and single-line named imports with destructuring from __mod_<target>
  let transformed = code.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;/g,
    (_, specifiers, importPath) => {
      const base = path.basename(importPath);
      const targetKey = FILE_TO_KEY[base];
      if (!targetKey) {
        throw new Error(`Unknown import target "${importPath}" in module "${key}"`);
      }
      const cleanSpecs = specifiers
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\s+as\s+/g, ': '))
        .join(', ');
      return `const { ${cleanSpecs} } = __mod_${targetKey};`;
    }
  );

  // Transform `export function name` / `export async function name` / `export class Name` / `export const NAME`
  transformed = transformed.replace(
    /^export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/gm,
    (_, asyncKw, name) => {
      exportedNames.add(name);
      return `${asyncKw || ''}function ${name}`;
    }
  );

  transformed = transformed.replace(
    /^export\s+class\s+([A-Za-z_$][\w$]*)/gm,
    (_, name) => {
      exportedNames.add(name);
      return `class ${name}`;
    }
  );

  transformed = transformed.replace(
    /^export\s+(const|let|var)\s+([A-Za-z_$][\w$]*)/gm,
    (_, decl, name) => {
      exportedNames.add(name);
      return `${decl} ${name}`;
    }
  );

  const returnList = Array.from(exportedNames).join(', ');
  if (key === 'main') {
    return `(() => {\n${transformed}\n})();`;
  }
  return `const __mod_${key} = (() => {\n${transformed}\nreturn { ${returnList} };\n})();`;
}

function build() {
  const htmlTemplate = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const cssText = fs.readFileSync(path.join(rootDir, 'src/styles/main.css'), 'utf8');

  const bundledModules = MODULES.map((m) => {
    const raw = fs.readFileSync(path.join(rootDir, m.file), 'utf8');
    return `// === Module: ${m.file} ===\n${transformModuleToIIFE(m.key, raw)}`;
  }).join('\n\n');

  const wrappedScript = `'use strict';\n${bundledModules}`;

  // Validate syntax cleanly via Function constructor before emitting
  new Function(wrappedScript);

  let outHtml = htmlTemplate.replace(
    /<link\s+rel="stylesheet"\s+href="\.\/src\/styles\/main\.css"\s*\/?>/,
    () => `<style>\n${cssText}\n</style>`
  );

  outHtml = outHtml.replace(
    /<script\s+type="module"\s+src="\.\/src\/main\.js"><\/script>/,
    () => `<script>\n${wrappedScript}\n</script>`
  );

  const distDir = path.join(rootDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  const outPath = path.join(distDir, 'index.html');
  fs.writeFileSync(outPath, outHtml, 'utf8');

  const sizeKb = (Buffer.byteLength(outHtml, 'utf8') / 1024).toFixed(1);
  console.log(`[build] Built standalone offline bundle: ${outPath} (${sizeKb} KB)`);
}

build();
