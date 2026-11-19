import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function usage() {
  console.error('用法：npm run new-game -- <slug> "<遊戲標題>" [科目] [年級]');
  console.error('範例：npm run new-game -- pythagorean-lab "畢氏定理拼圖實驗室" "數學" "國中八年級"');
  process.exit(1);
}

const [, , slug, rawTitle, rawSubject = '數學', rawGrade = '國中'] = process.argv;

if (!slug || !rawTitle || !/^[a-z0-9-]+$/.test(slug)) {
  usage();
}

const gameDir = path.join(rootDir, 'games', slug);
if (fs.existsSync(gameDir)) {
  console.error(`[new-game] 錯誤：目錄 games/${slug} 已存在，停止建立以免覆蓋既有檔案。`);
  process.exit(1);
}

fs.mkdirSync(path.join(gameDir, 'src/styles'), { recursive: true });
fs.mkdirSync(path.join(gameDir, 'tests'), { recursive: true });

// 1. game.json
fs.writeFileSync(
  path.join(gameDir, 'game.json'),
  JSON.stringify(
    {
      id: slug,
      title: rawTitle,
      entryHtml: 'index.html',
      styles: ['../../shared/styles/tokens.css', './src/styles/game.css'],
      modules: [
        { key: 'soundEngine', path: '../../shared/audio/soundEngine.js' },
        { key: 'dialogHelper', path: '../../shared/ui/dialogHelper.js' },
        { key: 'main', path: './src/main.js', isEntry: true },
      ],
    },
    null,
    2
  ) + '\n',
  'utf8'
);

// 2. index.html
fs.writeFileSync(
  path.join(gameDir, 'index.html'),
  `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${rawTitle}</title>
  <link rel="stylesheet" href="../../shared/styles/tokens.css" />
  <link rel="stylesheet" href="./src/styles/game.css" />
</head>
<body>
  <a href="#main-content" class="skip-link visually-hidden">跳至主要學習區</a>

  <header class="app-header">
    <div class="header-inner">
      <div class="brand-cluster">
        <span class="brand-icon" aria-hidden="true">🎯</span>
        <div>
          <h1 class="brand-title">${rawTitle}</h1>
          <p class="brand-subtitle">${rawSubject}・${rawGrade}互動概念實驗室</p>
        </div>
      </div>
      <div class="header-tools">
        <a href="../../index.html" class="tool-btn back-hub-link">🏠 回遊戲大廳</a>
      </div>
    </div>
  </header>

  <main id="main-content" tabindex="-1" class="app-main">
    <div id="game-root" class="game-root"></div>
  </main>

  <footer class="app-footer">
    <p>${rawTitle}・離線單檔免伺服器運作</p>
  </footer>

  <div id="sr-announcer" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
`,
  'utf8'
);

// 3. src/styles/game.css
fs.writeFileSync(
  path.join(gameDir, 'src/styles/game.css'),
  `.starter-panel {
  background: var(--bg-card);
  border: 2px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}
`,
  'utf8'
);

// 4. src/main.js
fs.writeFileSync(
  path.join(gameDir, 'src/main.js'),
  `import { playPop } from '../../../shared/audio/soundEngine.js';

function init() {
  const root = document.getElementById('game-root');
  if (!root) return;
  root.innerHTML = \`
    <section class="starter-panel">
      <h2>${rawTitle}</h2>
      <p>這是 <code>games/${slug}/</code> 的起始範本，已自動串接共用設計樣式與 Web Audio 音效！</p>
      <button type="button" id="starter-ping-btn" class="pill-btn">🔊 測試音效與互動</button>
    </section>
  \`;
  document.getElementById('starter-ping-btn')?.addEventListener('click', () => {
    playPop();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
`,
  'utf8'
);

// 5. tests/smoke.test.js
fs.writeFileSync(
  path.join(gameDir, 'tests/smoke.test.js'),
  `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gameDir = path.resolve(__dirname, '..');

test('${slug} manifest is valid', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(gameDir, 'game.json'), 'utf8'));
  assert.equal(manifest.id, '${slug}');
});
`,
  'utf8'
);

// 6. Register into shared/catalog.js automatically
const catalogPath = path.join(rootDir, 'shared/catalog.js');
const catalogRaw = fs.readFileSync(catalogPath, 'utf8');
const storageKey = `${slug.replace(/-/g, '_')}_progress_v1`;
const newEntry = `  {
    id: '${slug}',
    title: '${rawTitle}',
    shortTitle: '${rawTitle}',
    subject: '${rawSubject}',
    grade: '${rawGrade}',
    icon: '🎯',
    accent: '#2563eb',
    tags: ['${rawSubject}', '互動學習'],
    description: '互動式概念探索與即時回饋實驗室。',
    entry: './games/${slug}/index.html',
    storageKey: '${storageKey}',
    maxStars: 0,
  },
];`;

if (catalogRaw.includes('\n];')) {
  fs.writeFileSync(catalogPath, catalogRaw.replace(/\n\];\s*$/, `\n${newEntry}\n`), 'utf8');
  console.log(`[new-game] 已建立 games/${slug}/ 並自動註冊至 shared/catalog.js！`);
} else {
  console.log(`[new-game] 已建立 games/${slug}/，請手動將其加入 shared/catalog.js。`);
}
