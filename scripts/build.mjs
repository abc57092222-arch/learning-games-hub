import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function transformModuleToIIFE(mod, code, absPath, absPathToKey) {
  const exportedNames = new Set();
  const dir = path.dirname(absPath);

  let transformed = code.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]([^'"]+)['"]\s*;/g,
    (_, specifiers, importPath) => {
      const targetAbs = path.resolve(dir, importPath);
      const targetKey = absPathToKey.get(targetAbs);
      if (!targetKey) {
        throw new Error(
          `Unknown import "${importPath}" (resolved: ${targetAbs}) in module "${mod.path}"`
        );
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

  if (mod.isEntry) {
    return `(() => {\n${transformed}\n})();`;
  }
  const returnList = Array.from(exportedNames).join(', ');
  return `const __mod_${mod.key} = (() => {\n${transformed}\nreturn { ${returnList} };\n})();`;
}

function bundleHtmlPage({ baseDir, entryHtml, styles, modules, outPath }) {
  const htmlTemplate = fs.readFileSync(path.join(baseDir, entryHtml), 'utf8');

  const absPathToKey = new Map();
  for (const mod of modules) {
    absPathToKey.set(path.resolve(baseDir, mod.path), mod.key);
  }

  const bundledModules = modules
    .map((mod) => {
      const absPath = path.resolve(baseDir, mod.path);
      const raw = fs.readFileSync(absPath, 'utf8');
      return `// === Module: ${mod.path} ===\n${transformModuleToIIFE(mod, raw, absPath, absPathToKey)}`;
    })
    .join('\n\n');

  const wrappedScript = `'use strict';\n${bundledModules}`;
  new Function(wrappedScript);

  const combinedCss = styles
    .map((cssRel) => {
      const cssAbs = path.resolve(baseDir, cssRel);
      return `/* === Style: ${cssRel} === */\n${fs.readFileSync(cssAbs, 'utf8')}`;
    })
    .join('\n\n');

  let outHtml = htmlTemplate;
  let stylesInjected = false;
  outHtml = outHtml.replace(
    /<link\s+rel="stylesheet"\s+href="[^"]+"\s*\/?>\s*/g,
    () => {
      if (stylesInjected) return '';
      stylesInjected = true;
      return `<style>\n${combinedCss}\n</style>\n`;
    }
  );

  outHtml = outHtml.replace(
    /<script\s+type="module"\s+src="[^"]+"><\/script>/,
    () => `<script>\n${wrappedScript}\n</script>`
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, outHtml, 'utf8');

  const sizeKb = (Buffer.byteLength(outHtml, 'utf8') / 1024).toFixed(1);
  console.log(`[build] Built ${path.relative(rootDir, outPath)} (${sizeKb} KB)`);
}

function buildAll() {
  // 1. Build Root Hub Portal
  bundleHtmlPage({
    baseDir: rootDir,
    entryHtml: 'index.html',
    styles: ['./shared/styles/tokens.css', './shared/styles/hub.css'],
    modules: [
      { key: 'catalog', path: './shared/catalog.js' },
      { key: 'hub', path: './shared/hub.js', isEntry: true },
    ],
    outPath: path.join(rootDir, 'dist/index.html'),
  });

  // 2. Auto-discover and build every game under games/*/game.json
  const gamesDir = path.join(rootDir, 'games');
  if (fs.existsSync(gamesDir)) {
    const entries = fs.readdirSync(gamesDir, { withFileTypes: true }).filter((d) => d.isDirectory());
    for (const dir of entries) {
      const gameDir = path.join(gamesDir, dir.name);
      const manifestPath = path.join(gameDir, 'game.json');
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      bundleHtmlPage({
        baseDir: gameDir,
        entryHtml: manifest.entryHtml || 'index.html',
        styles: manifest.styles || [],
        modules: manifest.modules || [],
        outPath: path.join(rootDir, 'dist/games', dir.name, 'index.html'),
      });
    }
  }
}

buildAll();
