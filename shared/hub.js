import { GAME_CATALOG } from './catalog.js';

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function readGameStars(storageKey) {
  if (!storageKey) return 0;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const starsMap = parsed?.stars || {};
    return Object.values(starsMap).reduce((sum, n) => sum + (Number(n) || 0), 0);
  } catch {
    return 0;
  }
}

function initHub() {
  const root = document.getElementById('hub-root');
  const announcer = document.getElementById('sr-announcer');
  if (!root) return;

  const state = {
    subject: '全部',
    query: '',
  };

  const subjects = ['全部', ...Array.from(new Set(GAME_CATALOG.map((g) => g.subject)))];

  const announce = (msg) => {
    if (!announcer) return;
    announcer.textContent = '';
    requestAnimationFrame(() => {
      announcer.textContent = msg;
    });
  };

  function getFilteredGames() {
    const q = state.query.trim().toLowerCase();
    return GAME_CATALOG.filter((game) => {
      if (state.subject !== '全部' && game.subject !== state.subject) return false;
      if (!q) return true;
      const haystack = [
        game.title,
        game.shortTitle,
        game.subject,
        game.grade,
        game.description,
        ...(game.tags || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  function renderCardsOnly() {
    const gridHost = document.getElementById('hub-cards-host');
    if (!gridHost) return;
    const items = getFilteredGames();
    if (items.length === 0) {
      gridHost.innerHTML = `<div class="hub-empty-state">找不到符合「${escapeHtml(state.query)}」的教學遊戲，請嘗試其他關鍵字或切換學科分類。</div>`;
      return;
    }

    gridHost.innerHTML = `
      <div class="hub-games-grid">
        ${items
          .map((game) => {
            const stars = readGameStars(game.storageKey);
            const maxStars = game.maxStars || 0;
            const progressLabel =
              maxStars > 0 ? `⭐ ${stars} / ${maxStars}` : '✨ 探索學習';
            return `
              <article class="hub-game-card" style="--card-accent: ${escapeHtml(game.accent || '#4f46e5')}">
                <div class="hub-card-top">
                  <span class="hub-card-icon" aria-hidden="true">${game.icon || '🎮'}</span>
                  <div class="hub-card-badges">
                    <span class="hub-subject-badge">${escapeHtml(game.subject)}</span>
                    <span class="hub-grade-badge">${escapeHtml(game.grade)}</span>
                  </div>
                </div>
                <h3 class="hub-card-title">${escapeHtml(game.title)}</h3>
                <p class="hub-card-desc">${escapeHtml(game.description)}</p>
                <div class="hub-card-tags">
                  ${(game.tags || []).map((t) => `<span class="hub-tag">#${escapeHtml(t)}</span>`).join('')}
                </div>
                <div class="hub-card-footer">
                  <span class="hub-progress-text">${progressLabel}</span>
                  <a class="play-link" href="${escapeHtml(game.entry)}">▶ 開始遊玩</a>
                </div>
              </article>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function renderFull() {
    const totalEarned = GAME_CATALOG.reduce((sum, g) => sum + readGameStars(g.storageKey), 0);
    const totalMax = GAME_CATALOG.reduce((sum, g) => sum + (g.maxStars || 0), 0);

    root.innerHTML = `
      <section class="hub-hero" aria-labelledby="hub-welcome-title">
        <div class="hub-hero-text">
          <h2 id="hub-welcome-title">🎓 選擇一款互動式概念實驗室開始探索</h2>
          <p>每套遊戲皆為零安裝純前端設計，支援離線遊玩、視覺化互動推理與即時診斷回饋。</p>
        </div>
        <div class="hub-stats-pill">
          📚 已收錄 ${GAME_CATALOG.length} 款遊戲${totalMax > 0 ? ` ｜ ⭐ 總進度 ${totalEarned} / ${totalMax}` : ''}
        </div>
      </section>

      <div class="hub-toolbar">
        <div class="hub-filters" role="group" aria-label="依學科篩選遊戲">
          ${subjects
            .map(
              (sub) => `
            <button type="button"
              class="pill-btn ${state.subject === sub ? 'is-active' : ''}"
              data-hub-subject="${escapeHtml(sub)}"
              aria-pressed="${state.subject === sub}">
              ${escapeHtml(sub)}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="hub-search-box">
          <label class="visually-hidden" for="hub-search">搜尋教學遊戲</label>
          <input id="hub-search" type="search" class="hub-search-input" placeholder="🔍 搜尋單元、主題或年級…" value="${escapeHtml(state.query)}" />
        </div>
      </div>

      <div id="hub-cards-host" class="hub-grid-container"></div>

      <aside class="hub-author-tip" aria-label="新增教學遊戲開發說明">
        <strong>🛠️ 擴充更多遊戲：</strong> 在專案根目錄執行 <code>npm run new-game -- &lt;slug&gt; "遊戲標題" "數學" "國中七年級"</code>，即可自動建立 <code>games/&lt;slug&gt;/</code> 範本並註冊至遊戲大廳！
      </aside>
    `;

    renderCardsOnly();
  }

  root.addEventListener('click', (e) => {
    const subjBtn = e.target.closest('[data-hub-subject]');
    if (!subjBtn) return;
    state.subject = subjBtn.getAttribute('data-hub-subject');
    renderFull();
    announce(`已篩選學科：${state.subject}，共 ${getFilteredGames().length} 款遊戲`);
  });

  root.addEventListener('input', (e) => {
    if (e.target.id === 'hub-search') {
      state.query = e.target.value;
      renderCardsOnly();
    }
  });

  renderFull();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHub);
} else {
  initHub();
}
