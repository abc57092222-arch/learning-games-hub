import {
  CAMPAIGN_LEVELS,
  diagnoseError,
  generateLevelQuestions,
  calculateStars,
  getMultiplicationTable,
} from './multiplicationCore.js';
import { renderArraySvg } from './gridVisualizer.js';
import {
  playPop,
  playDrop,
  playVictory,
  playError,
} from '../../../shared/audio/soundEngine.js';
import { setupAccessibleDialogs } from '../../../shared/ui/dialogHelper.js';

export class GameController {
  constructor() {
    this.storageKey = 'multiplication_grid_progress_v1';
    this.savedState = this.loadState();

    // UI state
    this.currentMode = 'adventure'; // 'adventure' | 'sandbox' | 'table'
    this.sandboxA = 3;
    this.sandboxB = 4;
    this.sandboxRotated = false;

    // Adventure state
    this.activeLevel = null;
    this.questions = [];
    this.qIndex = 0;
    this.mistakes = 0;
    this.isAnswerChecked = false;
  }

  loadState() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { stars: {}, totalStars: 0 };
    } catch {
      return { stars: {}, totalStars: 0 };
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.savedState));
    } catch (e) {
      console.warn('Storage save error', e);
    }
  }

  init() {
    this.bindDom();
    this.renderHeaderStats();
    this.renderAdventureMap();
    this.renderSandbox();
    this.renderTable();
    this.switchMode('adventure');
    setupAccessibleDialogs();

    // User gesture audio unlock
    document.addEventListener('pointerdown', () => playPop(), { once: true });
  }

  bindDom() {
    // Mode tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        playPop();
        this.switchMode(e.currentTarget.dataset.mode);
      });
    });

    // Sandbox rotate
    document.getElementById('btn-rotate-grid')?.addEventListener('click', () => {
      playDrop();
      this.sandboxRotated = !this.sandboxRotated;
      this.renderSandbox();
    });

    // Submit Answer & Enter key
    document.getElementById('btn-submit-answer')?.addEventListener('click', () => {
      this.handleAnswerSubmit();
    });

    const input = document.getElementById('answer-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleAnswerSubmit();
      }
    });

    // Virtual keypad
    document.querySelectorAll('.key-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        playDrop();
        const val = e.currentTarget.dataset.val;
        const inp = document.getElementById('answer-input');
        if (!inp) return;
        if (val === 'backspace') {
          inp.value = inp.value.slice(0, -1);
        } else if (val === 'clear') {
          inp.value = '';
        } else {
          inp.value += val;
        }
      });
    });

    // Back to map button
    document.getElementById('btn-back-to-map')?.addEventListener('click', () => {
      playPop();
      this.showScreen('adventure-map');
    });

    // Dialog continue button
    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      const dlg = document.getElementById('level-clear-dialog');
      if (dlg?.close) dlg.close();
      this.showScreen('adventure-map');
      this.renderAdventureMap();
      this.renderHeaderStats();
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    document.getElementById('panel-adventure')?.classList.toggle('hidden', mode !== 'adventure');
    document.getElementById('panel-sandbox')?.classList.toggle('hidden', mode !== 'sandbox');
    document.getElementById('panel-table')?.classList.toggle('hidden', mode !== 'table');

    if (mode === 'adventure') {
      this.showScreen('adventure-map');
    }
  }

  showScreen(screenId) {
    document.getElementById('screen-adventure-map')?.classList.toggle('hidden', screenId !== 'adventure-map');
    document.getElementById('screen-adventure-play')?.classList.toggle('hidden', screenId !== 'adventure-play');
  }

  renderHeaderStats() {
    let total = 0;
    Object.values(this.savedState.stars || {}).forEach((s) => (total += s));
    const el = document.getElementById('stat-total-stars');
    if (el) el.textContent = `${total} / 30 ⭐️`;
  }

  /* ----------------- ADVENTURE MODE ----------------- */

  renderAdventureMap() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;

    grid.innerHTML = CAMPAIGN_LEVELS.map((lvl) => {
      const earned = this.savedState.stars[lvl.id] || 0;
      const starsStr = earned > 0 ? '⭐️'.repeat(earned) : '☆☆☆';
      return `
        <div class="level-card" data-level="${lvl.id}" role="button" tabindex="0">
          <div class="level-card-header">
            <span class="level-number">第 ${lvl.id} 關</span>
            <span class="level-stars">${starsStr}</span>
          </div>
          <div class="level-name" style="font-weight:700;margin-bottom:4px;">${lvl.title.split('：')[1]}</div>
          <div class="level-desc">${lvl.desc}</div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.level-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        playPop();
        const lvlId = Number(e.currentTarget.dataset.level);
        this.startLevel(lvlId);
      });
    });
  }

  startLevel(lvlId) {
    const lvl = CAMPAIGN_LEVELS.find((l) => l.id === lvlId);
    if (!lvl) return;

    this.activeLevel = lvl;
    this.questions = generateLevelQuestions(lvl);
    this.qIndex = 0;
    this.mistakes = 0;
    this.isAnswerChecked = false;

    this.showScreen('adventure-play');
    this.renderQuestion();
  }

  renderQuestion() {
    this.isAnswerChecked = false;
    const q = this.questions[this.qIndex];
    const total = this.questions.length;

    // Progress bar
    const fill = document.getElementById('quiz-progress-fill');
    if (fill) fill.style.width = `${((this.qIndex) / total) * 100}%`;

    const titleEl = document.getElementById('quiz-level-title');
    if (titleEl) titleEl.textContent = `${this.activeLevel.title}（第 ${this.qIndex + 1} / ${total} 題）`;

    const promptEl = document.getElementById('quiz-prompt-text');
    if (promptEl) promptEl.textContent = q.prompt;

    const hintEl = document.getElementById('quiz-hint');
    if (hintEl) hintEl.textContent = q.hint || '';

    // Render array helper
    const vizContainer = document.getElementById('quiz-viz-preview');
    if (vizContainer) {
      vizContainer.innerHTML = renderArraySvg(q.a, q.b, { dotRadius: 10, gap: 4 });
    }

    const input = document.getElementById('answer-input');
    if (input) {
      input.value = '';
      input.disabled = false;
      input.focus();
    }

    const feedback = document.getElementById('quiz-feedback');
    if (feedback) {
      feedback.className = 'feedback-banner hidden';
      feedback.textContent = '';
    }

    const submitBtn = document.getElementById('btn-submit-answer');
    if (submitBtn) submitBtn.textContent = '送出答案';
  }

  handleAnswerSubmit() {
    if (this.isAnswerChecked) {
      // Proceed to next question
      this.qIndex++;
      if (this.qIndex >= this.questions.length) {
        this.finishLevel();
      } else {
        playPop();
        this.renderQuestion();
      }
      return;
    }

    const input = document.getElementById('answer-input');
    const feedback = document.getElementById('quiz-feedback');
    const submitBtn = document.getElementById('btn-submit-answer');
    const q = this.questions[this.qIndex];

    const val = input.value.trim();
    if (!val) return;

    const num = Number(val);
    if (num === q.expected) {
      // Correct!
      playVictory();
      this.isAnswerChecked = true;
      input.disabled = true;
      feedback.className = 'feedback-banner success';
      feedback.textContent = `🎉 太棒了！答對了！${q.a} × ${q.b} = ${q.a * q.b}`;
      submitBtn.textContent = '下一題 →';
    } else {
      // Incorrect!
      playError();
      this.mistakes++;
      const diag = diagnoseError(q, val);
      feedback.className = 'feedback-banner error';
      feedback.textContent = `💡 ${diag.message}`;
    }
  }

  finishLevel() {
    const stars = calculateStars(this.questions.length, this.mistakes);
    const prevStars = this.savedState.stars[this.activeLevel.id] || 0;
    if (stars > prevStars) {
      this.savedState.stars[this.activeLevel.id] = stars;
      this.saveState();
    }

    playVictory();
    const dlg = document.getElementById('level-clear-dialog');
    const starsEl = document.getElementById('clear-stars');
    const msgEl = document.getElementById('clear-message');

    if (starsEl) starsEl.textContent = '⭐️'.repeat(stars) + '☆'.repeat(3 - stars);
    if (msgEl) {
      msgEl.textContent = `你完成了${this.activeLevel.title}！答錯次數：${this.mistakes} 次。`;
    }

    if (dlg?.showModal) dlg.showModal();
  }

  /* ----------------- SANDBOX EXPLORER ----------------- */

  renderSandbox() {
    // Generate A and B selector pills
    const selA = document.getElementById('selector-a');
    const selB = document.getElementById('selector-b');

    if (selA && selA.children.length === 0) {
      for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = `num-pill ${i === this.sandboxA ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
          playPop();
          this.sandboxA = i;
          this.renderSandbox();
        });
        selA.appendChild(btn);
      }
    } else if (selA) {
      selA.querySelectorAll('.num-pill').forEach((btn, idx) => {
        btn.classList.toggle('active', idx + 1 === this.sandboxA);
      });
    }

    if (selB && selB.children.length === 0) {
      for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('button');
        btn.className = `num-pill ${i === this.sandboxB ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
          playPop();
          this.sandboxB = i;
          this.renderSandbox();
        });
        selB.appendChild(btn);
      }
    } else if (selB) {
      selB.querySelectorAll('.num-pill').forEach((btn, idx) => {
        btn.classList.toggle('active', idx + 1 === this.sandboxB);
      });
    }

    // Render SVG
    const container = document.getElementById('sandbox-svg-container');
    if (container) {
      container.innerHTML = renderArraySvg(this.sandboxA, this.sandboxB, {
        isRotated: this.sandboxRotated,
        dotRadius: 13,
      });
    }

    // Formula card
    const formula = document.getElementById('sandbox-formula');
    if (formula) {
      const prod = this.sandboxA * this.sandboxB;
      if (this.sandboxRotated) {
        formula.innerHTML = `${this.sandboxB} × ${this.sandboxA} = <strong>${prod}</strong>（旋轉視角交換律）`;
      } else {
        formula.innerHTML = `${this.sandboxA} × ${this.sandboxB} = <strong>${prod}</strong>`;
      }
    }
  }

  /* ----------------- 9x9 TABLE MATRIX ----------------- */

  renderTable() {
    const tableEl = document.getElementById('matrix-table');
    if (!tableEl) return;

    const data = getMultiplicationTable();
    let html = '<thead><tr><th>×</th>';
    for (let c = 1; c <= 9; c++) html += `<th>${c}</th>`;
    html += '</tr></thead><tbody>';

    for (let r = 0; r < 9; r++) {
      html += `<tr><th>${r + 1}</th>`;
      for (let c = 0; c < 9; c++) {
        const item = data[r][c];
        html += `<td data-a="${item.a}" data-b="${item.b}">${item.product}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    tableEl.innerHTML = html;

    tableEl.querySelectorAll('td').forEach((td) => {
      td.addEventListener('click', (e) => {
        playPop();
        tableEl.querySelectorAll('td').forEach((el) => el.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        const a = Number(e.currentTarget.dataset.a);
        const b = Number(e.currentTarget.dataset.b);

        const detail = document.getElementById('table-detail');
        if (detail) {
          detail.innerHTML = `
            <div style="margin-top:12px;font-size:1.1rem;font-weight:700;color:#0284c7;">
              ${a} × ${b} = ${a * b}（${b} 個 ${a} 連加：${Array(b).fill(a).join(' + ')}）
            </div>
            <div style="margin-top:8px;">
              ${renderArraySvg(a, b, { dotRadius: 8, gap: 3 })}
            </div>
          `;
        }
      });
    });
  }
}
