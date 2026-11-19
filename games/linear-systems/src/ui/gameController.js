import {
  playBalanceLock,
  playClink,
  playDrop,
  playError,
  playPop,
  playVictory,
  isMuted,
  setMuted,
} from '../../../../shared/audio/soundEngine.js';
import {
  generatePracticeLevel,
  getVarMeta,
  LEVELS,
  WORLDS,
} from '../data/levels.js';
import {
  buildPanTokens,
  cloneScale,
  createEmptyScale,
  EPS,
  evaluateScaleTilt,
  formatCanonicalEquation,
  formatCoeff,
  formatEquation,
  normalizeScale,
  roundClean,
  verifyLevelAttempt,
} from '../math/equationEngine.js';
import { renderCoordinateGraphSVG } from './graphRenderer.js';
import { createSandboxState, getSandboxPreset, renderSandboxHTML } from './sandboxView.js';
import { renderScaleSVG, renderTapeDiagramSVG } from './scaleRenderer.js';

const STORAGE_KEY = 'eq_detective_progress_v1';

/**
 * Deterministic shuffle based on seed integer so chip positions look natural
 * without changing randomly on every re-render.
 */
function deterministicOrder(items, seed) {
  const arr = items.map((item, idx) => ({ item, idx }));
  arr.sort((a, b) => {
    const ha = ((a.idx + 1) * 37 + seed * 17) % 29;
    const hb = ((b.idx + 1) * 37 + seed * 17) % 29;
    return ha - hb;
  });
  return arr.map((x) => x.item);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export class GameController {
  constructor(rootEl, dialogRefs, announceFn) {
    this.rootEl = rootEl;
    this.dialogs = dialogRefs;
    this.announce = announceFn;

    this.progress = this.loadProgress();
    this.mode = 'campaign'; // 'campaign' | 'sandbox' | 'practice'
    this.sandbox = createSandboxState();
    this.practiceCounter = 0;
    this.challengeSkipGuided = false;

    this.state = null;
    this.loadLevel(LEVELS[0]);
    this.bindEvents();
  }

  loadProgress() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { stars: parsed.stars || {}, solved: parsed.solved || {} };
        }
      }
    } catch {
      // Ignore storage failures in private browsing
    }
    return { stars: {}, solved: {} };
  }

  saveProgress(levelId, stars) {
    if (levelId >= 100) return; // Don't persist procedural ids into campaign map
    const prev = this.progress.stars[levelId] || 0;
    this.progress.stars[levelId] = Math.max(prev, stars);
    this.progress.solved[levelId] = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      // Safe no-op
    }
  }

  getTotalStars() {
    return Object.values(this.progress.stars).reduce((acc, s) => acc + (s || 0), 0);
  }

  loadLevel(level) {
    const startAtStep3 = this.challengeSkipGuided && !level.isProcedural;
    this.state = {
      level,
      step: startAtStep3 ? 3 : 1,
      // Step 1
      activeVarSlot: 'x', // 'x' | 'y'
      xAssignedId: startAtStep3 ? 'u0' : null,
      yAssignedId: startAtStep3 ? 'u1' : null,
      step1Feedback: null, // { type: 'ok' | 'err', text: string }
      // Step 2
      activeClueSlot: 0, // 0 | 1
      assignedClueOrder: startAtStep3 ? [0, 1] : [null, null],
      step2Feedback: null,
      // Step 3
      scales: [createEmptyScale(), createEmptyScale()],
      activePan: ['left', 'left'], // active pan per scale ('left' | 'right')
      selectedMagnetIdx: 0,
      showTapeDiagram: [false, false],
      showExpansionHint: [false, false],
      hintTier: 0,
      retries: 0,
      lastCheck: null, // result of verifyLevelAttempt
      // Step 4
      testX: level.solution.u0,
      testY: level.solution.u1,
      earnedStars: 3,
    };
    this.lastActiveScaleIdx = 0;
    this.render();
  }

  isSwapped() {
    const { xAssignedId, yAssignedId } = this.state;
    return xAssignedId === 'u1' && yAssignedId === 'u0';
  }

  render() {
    this.renderHeaderBadges();
    if (this.mode === 'sandbox') {
      this.rootEl.innerHTML = renderSandboxHTML(this.sandbox);
      return;
    }

    const { level, step } = this.state;
    const swapped = this.isSwapped();
    const vm = getVarMeta(level, swapped);

    this.rootEl.innerHTML = `
      ${this.renderModeAndStepperBar(level, step)}
      <div class="workbench-shell">
        ${this.renderStoryCard(level, step, vm)}
        <div class="stage-workspace">
          ${step === 1 ? this.renderStep1(level) : ''}
          ${step === 2 ? this.renderStep2(level, vm) : ''}
          ${step === 3 ? this.renderStep3(level, vm, swapped) : ''}
          ${step === 4 ? this.renderStep4(level, vm, swapped) : ''}
        </div>
      </div>
    `;
  }

  renderHeaderBadges() {
    const starEl = document.getElementById('hud-total-stars');
    const levelBtn = document.getElementById('btn-open-map');
    const soundBtn = document.getElementById('btn-toggle-sound');
    const navCampaign = document.getElementById('nav-campaign');
    const navSandbox = document.getElementById('nav-sandbox');
    const navPractice = document.getElementById('nav-practice');

    if (starEl) {
      starEl.textContent = `⭐ ${this.getTotalStars()} / ${LEVELS.length * 3}`;
    }
    if (levelBtn) {
      levelBtn.textContent =
        this.mode === 'campaign'
          ? `🗺️ 第 ${this.state.level.id} 關：${this.state.level.title}`
          : '🗺️ 關卡地圖';
    }
    if (soundBtn) {
      soundBtn.textContent = isMuted() ? '🔇 靜音' : '🔊 音效';
      soundBtn.setAttribute('aria-pressed', String(!isMuted()));
    }
    if (navCampaign) navCampaign.classList.toggle('is-active', this.mode === 'campaign');
    if (navSandbox) navSandbox.classList.toggle('is-active', this.mode === 'sandbox');
    if (navPractice) navPractice.classList.toggle('is-active', this.mode === 'practice');
  }

  renderModeAndStepperBar(level, step) {
    const world = WORLDS.find((w) => w.id === level.worldId);
    const steps = [
      { n: 1, label: '設未知數 x, y' },
      { n: 2, label: '抓兩條線索' },
      { n: 3, label: '雙天平列式' },
      { n: 4, label: '交點驗算破關' },
    ];
    const step1Done = Boolean(this.state.xAssignedId && this.state.yAssignedId);
    const step2Done =
      this.state.assignedClueOrder[0] !== null && this.state.assignedClueOrder[1] !== null;
    const step3Done = Boolean(this.state.lastCheck?.passed);

    const canJumpTo = (n) => {
      if (n === 1) return true;
      if (n === 2) return step1Done;
      if (n === 3) return step1Done && step2Done;
      if (n === 4) return step1Done && step2Done && step3Done;
      return false;
    };

    return `
      <div class="level-top-bar">
        <div class="level-title-group">
          <span class="world-pill" style="--world-color: ${world ? world.color : '#6366f1'}">${world ? `World ${world.id}・${world.name}` : '無限練習場'}</span>
          <span class="badge-pill">${escapeHtml(level.badge)}</span>
          ${
            level.isProcedural
              ? `<button type="button" class="pill-btn" data-action="new-practice">🎲 換一題隨機練習</button>`
              : `<label class="challenge-toggle">
                  <input type="checkbox" data-action="toggle-challenge" ${this.challengeSkipGuided ? 'checked' : ''} />
                  <span>熟手跳過引導 (直接列式)</span>
                </label>`
          }
        </div>
        <nav class="stepper" aria-label="解題四步驟">
          ${steps
            .map((s) => {
              const isCurrent = s.n === step;
              const unlocked = canJumpTo(s.n);
              const done = s.n < step || (s.n === 4 && step === 4);
              return `
                <button type="button"
                  class="step-pill ${isCurrent ? 'is-current' : ''} ${done ? 'is-done' : ''}"
                  data-jump-step="${s.n}"
                  ${unlocked ? '' : 'disabled'}
                  aria-current="${isCurrent ? 'step' : 'false'}">
                  <span class="step-num">${done && !isCurrent ? '✓' : s.n}</span>
                  <span class="step-text">${s.label}</span>
                </button>
              `;
            })
            .join('')}
        </nav>
      </div>
    `;
  }

  renderStoryCard(level, step, vm) {
    const order = this.state.assignedClueOrder;
    const segmentsHtml = level.storySegments
      .map((seg) => {
        if (seg.kind === 'plain') {
          return `<span>${escapeHtml(seg.text)}</span>`;
        }
        if (seg.kind === 'question') {
          const highlightQ = step === 1 ? 'story-hl-question' : '';
          return `<span class="story-seg ${highlightQ}">${escapeHtml(seg.text)}</span>`;
        }
        // clue segment
        let cls = '';
        if (step >= 2) {
          if (order[0] === seg.clueIndex) cls = 'story-hl-clue1';
          else if (order[1] === seg.clueIndex) cls = 'story-hl-clue2';
        }
        return `<span class="story-seg ${cls}">${escapeHtml(seg.text)}</span>`;
      })
      .join('');

    const step1Ready = Boolean(this.state.xAssignedId && this.state.yAssignedId);

    return `
      <section class="story-card" aria-labelledby="story-heading">
        <div class="story-card-header">
          <h2 id="story-heading">📖 ${escapeHtml(level.title)}</h2>
          ${
            step1Ready
              ? `<div class="var-legend" aria-label="目前已設定的未知數">
                  <span class="var-badge var-x">x = ${vm.x.icon} ${escapeHtml(vm.x.label)}${vm.x.unit ? ` (${vm.x.unit})` : ''}</span>
                  <span class="var-badge var-y">y = ${vm.y.icon} ${escapeHtml(vm.y.label)}${vm.y.unit ? ` (${vm.y.unit})` : ''}</span>
                  ${step <= 3 ? `<button type="button" class="mini-swap-btn" data-action="swap-xy" title="對調 x 與 y 的定義">🔄 互換 x / y</button>` : ''}
                </div>`
              : `<span class="var-legend-pending">🕵️ 先從題目找出「兩個不知道的數量」吧！</span>`
          }
        </div>
        <p class="story-text">${segmentsHtml}</p>
      </section>
    `;
  }

  // ==================== STEP 1: 設未知數 ====================
  renderStep1(level) {
    const { activeVarSlot, xAssignedId, yAssignedId, step1Feedback } = this.state;

    const candidates = deterministicOrder(
      [
        ...level.unknowns.map((u) => ({
          kind: 'unknown',
          id: u.id,
          icon: u.icon,
          chipText: u.chipText,
          label: u.label,
        })),
        ...level.unknownDistractors.map((d) => ({
          kind: 'distractor',
          id: d.id,
          icon: '🔢',
          chipText: d.chipText,
          reason: d.reason,
        })),
      ],
      level.id * 13 + 7
    );

    const getAssignedMeta = (id) => level.unknowns.find((u) => u.id === id);
    const xMeta = getAssignedMeta(xAssignedId);
    const yMeta = getAssignedMeta(yAssignedId);
    const bothReady = Boolean(xMeta && yMeta);

    return `
      <section class="step-panel" aria-labelledby="step1-title">
        <div class="step-header">
          <h3 id="step1-title">第 1 步：設兩個未知數（x 和 y 誰先設都可以！）</h3>
          <p class="muted-note">點選下方的一個未知數框（或拖曳詞條），從題目裡找出兩個「不知道、需要求出來」的量放進 x 與 y。</p>
        </div>

        <div class="mystery-boxes-row">
          <div class="mystery-slot slot-x ${activeVarSlot === 'x' ? 'is-targeted' : ''} ${xMeta ? 'is-filled' : ''}"
               data-drop-var="x">
            <button type="button" class="slot-select-btn" data-select-var-slot="x" aria-pressed="${activeVarSlot === 'x'}">
              <span class="slot-tag var-x">未知數 x</span>
              ${
                xMeta
                  ? `<span class="slot-filled-val">${xMeta.icon} ${escapeHtml(xMeta.label)}</span>`
                  : `<span class="slot-empty-hint">${activeVarSlot === 'x' ? '👇 點選下方名詞卡片放入 x' : '點擊選取 x 框'}</span>`
              }
            </button>
            ${xMeta ? `<button type="button" class="slot-clear-btn" data-clear-var="x" aria-label="清除 x">✕</button>` : ''}
          </div>

          <div class="mystery-slot slot-y ${activeVarSlot === 'y' ? 'is-targeted' : ''} ${yMeta ? 'is-filled' : ''}"
               data-drop-var="y">
            <button type="button" class="slot-select-btn" data-select-var-slot="y" aria-pressed="${activeVarSlot === 'y'}">
              <span class="slot-tag var-y">未知數 y</span>
              ${
                yMeta
                  ? `<span class="slot-filled-val">${yMeta.icon} ${escapeHtml(yMeta.label)}</span>`
                  : `<span class="slot-empty-hint">${activeVarSlot === 'y' ? '👇 點選下方名詞卡片放入 y' : '點擊選取 y 框'}</span>`
              }
            </button>
            ${yMeta ? `<button type="button" class="slot-clear-btn" data-clear-var="y" aria-label="清除 y">✕</button>` : ''}
          </div>
        </div>

        <div class="chip-tray" role="group" aria-label="題目名詞候選卡片">
          ${candidates
            .map((c) => {
              const usedInX = c.kind === 'unknown' && xAssignedId === c.id;
              const usedInY = c.kind === 'unknown' && yAssignedId === c.id;
              const isUsed = usedInX || usedInY;
              return `
                <button type="button"
                  class="word-chip ${isUsed ? 'is-used' : ''}"
                  draggable="${!isUsed}"
                  data-drag-kind="var-candidate"
                  data-candidate-kind="${c.kind}"
                  data-candidate-id="${c.id}"
                  ${isUsed ? 'disabled' : ''}>
                  <span aria-hidden="true">${c.icon}</span>
                  <span>${escapeHtml(c.chipText)}</span>
                  ${usedInX ? '<span class="mini-tag var-x">已設為 x</span>' : ''}
                  ${usedInY ? '<span class="mini-tag var-y">已設為 y</span>' : ''}
                </button>
              `;
            })
            .join('')}
        </div>

        ${
          step1Feedback
            ? `<div class="feedback-box ${step1Feedback.type === 'ok' ? 'is-ok' : 'is-err'}">${escapeHtml(step1Feedback.text)}</div>`
            : ''
        }

        <div class="step-actions">
          ${
            bothReady
              ? `<button type="button" class="primary-btn" data-action="goto-step-2">
                  ✅ 太好了！進入第 2 步：抓兩條線索 ➜
                </button>`
              : `<span class="hint-inline">💡 提示：兩個框都要放入真正的未知數才能繼續喔！</span>`
          }
        </div>
      </section>
    `;
  }

  // ==================== STEP 2: 抓兩條線索 ====================
  renderStep2(level, vm) {
    const { activeClueSlot, assignedClueOrder, step2Feedback } = this.state;

    const clueCards = deterministicOrder(
      [
        { kind: 'clue', index: 0, text: level.clues[0].text },
        { kind: 'clue', index: 1, text: level.clues[1].text },
        { kind: 'distractor', index: -1, text: level.clueDistractor.text, reason: level.clueDistractor.reason },
      ],
      level.id * 29 + 5
    );

    const clueInSlot0 = assignedClueOrder[0] !== null ? level.clues[assignedClueOrder[0]] : null;
    const clueInSlot1 = assignedClueOrder[1] !== null ? level.clues[assignedClueOrder[1]] : null;
    const bothCluesReady = Boolean(clueInSlot0 && clueInSlot1);

    return `
      <section class="step-panel" aria-labelledby="step2-title">
        <div class="step-header">
          <h3 id="step2-title">第 2 步：找出題目裡的「兩條等量線索」</h3>
          <p class="muted-note">兩個未知數 (${vm.x.icon} x 與 ${vm.y.icon} y) 需要兩句不同的條件才能解出來！請把題目裡包含數字關係的兩句話放進對應線索框。</p>
        </div>

        <div class="clue-slots-grid">
          <div class="clue-slot clue-slot-1 ${activeClueSlot === 0 ? 'is-targeted' : ''} ${clueInSlot0 ? 'is-filled' : ''}"
               data-drop-clue="0">
            <button type="button" class="slot-select-btn" data-select-clue-slot="0" aria-pressed="${activeClueSlot === 0}">
              <span class="slot-tag clue-1-tag">⚖️ 線索 ①（給天平一）</span>
              ${
                clueInSlot0
                  ? `<span class="clue-filled-text">${escapeHtml(clueInSlot0.text)}</span>`
                  : `<span class="slot-empty-hint">點擊下方有數學條件的句子放入線索 ①</span>`
              }
            </button>
            ${clueInSlot0 ? `<button type="button" class="slot-clear-btn" data-clear-clue="0" aria-label="清除線索一">✕</button>` : ''}
          </div>

          <div class="clue-slot clue-slot-2 ${activeClueSlot === 1 ? 'is-targeted' : ''} ${clueInSlot1 ? 'is-filled' : ''}"
               data-drop-clue="1">
            <button type="button" class="slot-select-btn" data-select-clue-slot="1" aria-pressed="${activeClueSlot === 1}">
              <span class="slot-tag clue-2-tag">⚖️ 線索 ②（給天平二）</span>
              ${
                clueInSlot1
                  ? `<span class="clue-filled-text">${escapeHtml(clueInSlot1.text)}</span>`
                  : `<span class="slot-empty-hint">點擊下方另一句數學條件放入線索 ②</span>`
              }
            </button>
            ${clueInSlot1 ? `<button type="button" class="slot-clear-btn" data-clear-clue="1" aria-label="清除線索二">✕</button>` : ''}
          </div>
        </div>

        <div class="clue-candidates-list" role="group" aria-label="題目句子卡片">
          ${clueCards
            .map((card) => {
              const in0 = card.kind === 'clue' && assignedClueOrder[0] === card.index;
              const in1 = card.kind === 'clue' && assignedClueOrder[1] === card.index;
              const used = in0 || in1;
              return `
                <button type="button"
                  class="clue-sentence-btn ${used ? 'is-used' : ''}"
                  draggable="${!used}"
                  data-drag-kind="clue-candidate"
                  data-clue-kind="${card.kind}"
                  data-clue-idx="${card.index}"
                  ${used ? 'disabled' : ''}>
                  <span class="quote-mark" aria-hidden="true">💬</span>
                  <span>「${escapeHtml(card.text)}」</span>
                  ${in0 ? '<span class="mini-tag clue-1-tag">已放線索 ①</span>' : ''}
                  ${in1 ? '<span class="mini-tag clue-2-tag">已放線索 ②</span>' : ''}
                </button>
              `;
            })
            .join('')}
        </div>

        ${
          step2Feedback
            ? `<div class="feedback-box ${step2Feedback.type === 'ok' ? 'is-ok' : 'is-err'}">${escapeHtml(step2Feedback.text)}</div>`
            : ''
        }

        <div class="step-actions">
          <button type="button" class="secondary-btn" data-jump-step="1">⬅ 修改未知數</button>
          ${
            bothCluesReady
              ? `<button type="button" class="primary-btn" data-action="goto-step-3">
                  ⚖️ 抓到雙線索了！前往第 3 步：雙天平列式 ➜
                </button>`
              : ''
          }
        </div>
      </section>
    `;
  }

  // ==================== STEP 3: 雙天平圖像列式 ====================
  renderStep3(level, vm, swapped) {
    const {
      scales,
      activePan,
      assignedClueOrder,
      selectedMagnetIdx,
      showTapeDiagram,
      showExpansionHint,
      hintTier,
      lastCheck,
    } = this.state;

    const clue1 = level.clues[assignedClueOrder[0] ?? 0];
    const clue2 = level.clues[assignedClueOrder[1] ?? 1];
    const selectedMagnet = level.numberChips[selectedMagnetIdx] || level.numberChips[0];

    const hintTexts = level.hints(swapped);
    const visibleHints = hintTexts.slice(0, hintTier);

    return `
      <section class="step-panel step3-panel" aria-labelledby="step3-title">
        <div class="step-header-compact">
          <div>
            <h3 id="step3-title">第 3 步：把兩條線索放上「雙天平」寫出方程式！</h3>
            <p class="muted-note">點選天平的<strong>左盤</strong>或<strong>右盤</strong>，放入 x、y 與下方的題目數字磁鐵。左盤與右盤相等時天平就平衡！</p>
          </div>
          <button type="button" class="hint-btn" data-action="next-hint" ${hintTier >= 3 ? 'disabled' : ''}>
            💡 偵探提示 (${hintTier}/3)
          </button>
        </div>

        <!-- Story Number Magnet Bank -->
        <div class="magnet-dock" aria-label="題目數字磁鐵盤">
          <div class="magnet-chips-row">
            <span class="dock-label">🧲 題目數字磁鐵：</span>
            ${level.numberChips
              .map(
                (chip, idx) => `
              <button type="button"
                class="magnet-chip ${idx === selectedMagnetIdx ? 'is-selected' : ''}"
                draggable="true"
                data-drag-kind="magnet"
                data-magnet-idx="${idx}"
                data-select-magnet="${idx}"
                aria-pressed="${idx === selectedMagnetIdx}">
                <strong>${escapeHtml(chip.label)}</strong>
                ${chip.note ? `<span class="magnet-note">${escapeHtml(chip.note)}</span>` : ''}
              </button>
            `
              )
              .join('')}
          </div>
          ${
            selectedMagnet
              ? (() => {
                  const tScale = this.lastActiveScaleIdx ?? 0;
                  const tPan = activePan[tScale] === 'left' ? '左盤' : '右盤';
                  return `<div class="magnet-action-strip" role="group" aria-label="快速套用所選數字磁鐵">
                    <span class="strip-title">將磁鐵 <strong>${escapeHtml(selectedMagnet.label)}</strong> 放入
                      <button type="button" class="mini-target-btn ${tScale === 0 ? 'is-active' : ''}" data-target-scale="0">天平 ①</button>
                      <button type="button" class="mini-target-btn ${tScale === 1 ? 'is-active' : ''}" data-target-scale="1">天平 ②</button>
                      的 <strong>${tPan}</strong>：
                    </span>
                    <div class="strip-btns">
                      <button type="button" class="apply-btn" data-apply-magnet="add-c">+${selectedMagnet.label} (加常數)</button>
                      <button type="button" class="apply-btn is-neg" data-apply-magnet="sub-c">−${selectedMagnet.label} (減常數)</button>
                      <button type="button" class="apply-btn var-x-btn" data-apply-magnet="add-x">+${selectedMagnet.label}x</button>
                      <button type="button" class="apply-btn var-x-btn is-neg" data-apply-magnet="sub-x">−${selectedMagnet.label}x</button>
                      <button type="button" class="apply-btn var-y-btn" data-apply-magnet="add-y">+${selectedMagnet.label}y</button>
                      <button type="button" class="apply-btn var-y-btn is-neg" data-apply-magnet="sub-y">−${selectedMagnet.label}y</button>
                    </div>
                  </div>`;
                })()
              : ''
          }
        </div>

        ${
          visibleHints.length > 0
            ? `<div class="hints-drawer" aria-label="偵探提示紀錄">
                ${visibleHints.map((h, i) => `<div class="hint-item"><strong>💡 提示 ${i + 1}：</strong>${escapeHtml(h)}</div>`).join('')}
              </div>`
            : ''
        }

        ${
          lastCheck
            ? `<div class="feedback-box ${lastCheck.passed ? 'is-ok' : 'is-err'}">
                <div><strong>${lastCheck.passed ? '🎉 驗證成功！' : '🔍 偵探檢驗結果：'}</strong> ${escapeHtml(lastCheck.feedback)}</div>
                ${
                  !lastCheck.passed && lastCheck.scale1Diag
                    ? `<div class="diag-line">• <strong>天平 ①：</strong>${escapeHtml(lastCheck.scale1Diag.message)}</div>`
                    : ''
                }
                ${
                  !lastCheck.passed && lastCheck.scale2Diag
                    ? `<div class="diag-line">• <strong>天平 ②：</strong>${escapeHtml(lastCheck.scale2Diag.message)}</div>`
                    : ''
                }
              </div>`
            : ''
        }

        <!-- Twin Scales Container (Container Query Responsive) -->
        <div class="workbench-container">
          <div class="twin-scales-grid">
            ${this.renderSingleScaleWorkbench(0, clue1, scales[0], activePan[0], showTapeDiagram[0], showExpansionHint[0], vm, swapped, lastCheck)}
            ${this.renderSingleScaleWorkbench(1, clue2, scales[1], activePan[1], showTapeDiagram[1], showExpansionHint[1], vm, swapped, lastCheck)}
          </div>
        </div>

        <div class="step3-footer-actions">
          <button type="button" class="secondary-btn" data-jump-step="2">⬅ 重選兩條線索</button>
          <button type="button" class="check-balance-btn" data-action="verify-scales">
            ⚖️ 檢驗雙天平是否平衡！
          </button>
          ${
            lastCheck?.passed
              ? `<button type="button" class="primary-btn" data-action="goto-step-4">
                  📊 看交點圖與驗算破關 ➜
                </button>`
              : ''
          }
        </div>
      </section>
    `;
  }

  renderSingleScaleWorkbench(scaleIdx, clue, scale, currentPanSide, showTape, showExp, vm, swapped, lastCheck) {
    const isOne = scaleIdx === 0;
    const accent = isOne ? '#4f46e5' : '#10b981';
    const cardCls = isOne ? 'clue-1-card' : 'clue-2-card';

    let angleDeg = 0;
    let status = 'idle';
    if (lastCheck) {
      const tilt = isOne ? lastCheck.tilt1 : lastCheck.tilt2;
      const isBal = isOne ? lastCheck.scale1Balanced : lastCheck.scale2Balanced;
      if (lastCheck.passed) {
        angleDeg = 0;
        status = 'balanced';
      } else if (isBal && lastCheck.matchType !== 'duplicate_clue') {
        angleDeg = 0;
        status = 'balanced';
      } else {
        angleDeg = tilt.angleDeg;
        status = tilt.isBalanced ? 'idle' : 'tilted';
      }
    }

    return `
      <article class="scale-workbench-card ${cardCls}" aria-label="天平 ${scaleIdx + 1}">
        <div class="scale-clue-banner">
          <div class="clue-banner-top">
            <span class="slot-tag ${isOne ? 'clue-1-tag' : 'clue-2-tag'}">天平 ${isOne ? '①' : '②'}・${escapeHtml(clue.tag)}</span>
            <div class="scale-mini-tools">
              ${
                clue.expansionHint
                  ? `<button type="button" class="tiny-tool-btn ${showExp ? 'is-on' : ''}" data-toggle-exp="${scaleIdx}">🧩 展開幫手</button>`
                  : ''
              }
              <button type="button" class="tiny-tool-btn ${showTape ? 'is-on' : ''}" data-toggle-tape="${scaleIdx}">📏 線段圖</button>
              <button type="button" class="tiny-tool-btn" data-clear-scale="${scaleIdx}">🗑️ 清空</button>
            </div>
          </div>
          <p class="clue-quote">「${escapeHtml(clue.text)}」</p>
          ${showExp && clue.expansionHint ? `<div class="expansion-callout">${escapeHtml(clue.expansionHint)}</div>` : ''}
        </div>

        ${renderScaleSVG({
          title: `天平 ${isOne ? '一' : '二'}`,
          scale,
          angleDeg,
          status,
          varMeta: vm,
          accentColor: accent,
        })}

        ${showTape ? `<div class="tape-wrap">${renderTapeDiagramSVG({ clue, scale, varMeta: vm, swapped })}</div>` : ''}

        <!-- Live Color-Coded Equation Readout -->
        <div class="live-equation-bar" aria-live="off">
          <span class="eq-label">目前式子：</span>
          <span class="eq-formula">${this.renderColorEquationHtml(scale)}</span>
        </div>

        <!-- Pan Selector Tabs + Dropzones -->
        <div class="pan-selector-row">
          <div class="pan-box ${currentPanSide === 'left' ? 'is-active' : ''}" data-drop-pan="${scaleIdx}:left">
            <button type="button" class="pan-select-header" data-select-pan="${scaleIdx}:left" aria-pressed="${currentPanSide === 'left'}">
              <span>⬅️ 左盤 ${currentPanSide === 'left' ? '(編輯中)' : ''}</span>
            </button>
            <div class="pan-terms-list">
              ${this.renderPanTermPills(scaleIdx, 'left', scale.left, vm)}
            </div>
          </div>

          <div class="pan-equals-divider" aria-hidden="true">=</div>

          <div class="pan-box ${currentPanSide === 'right' ? 'is-active' : ''}" data-drop-pan="${scaleIdx}:right">
            <button type="button" class="pan-select-header" data-select-pan="${scaleIdx}:right" aria-pressed="${currentPanSide === 'right'}">
              <span>➡️ 右盤 ${currentPanSide === 'right' ? '(編輯中)' : ''}</span>
            </button>
            <div class="pan-terms-list">
              ${this.renderPanTermPills(scaleIdx, 'right', scale.right, vm)}
            </div>
          </div>
        </div>

        <!-- Quick Add Toolbar targeting active pan -->
        <div class="quick-add-bar" role="group" aria-label="加入砝碼到目前選取的天平盤">
          <button type="button" class="token-add-btn var-x-btn" data-pan-add="${scaleIdx}:x:1">+1 x (${vm.x.icon})</button>
          <button type="button" class="token-add-btn var-x-btn is-neg" data-pan-add="${scaleIdx}:x:-1">−1 x</button>
          <button type="button" class="token-add-btn var-y-btn" data-pan-add="${scaleIdx}:y:1">+1 y (${vm.y.icon})</button>
          <button type="button" class="token-add-btn var-y-btn is-neg" data-pan-add="${scaleIdx}:y:-1">−1 y</button>
          <form class="custom-num-form" data-custom-num-form="${scaleIdx}">
            <label class="visually-hidden" for="custom-num-${scaleIdx}">自訂數字</label>
            <input id="custom-num-${scaleIdx}" type="number" step="any" placeholder="自訂數字" class="custom-num-input" />
            <button type="submit" class="token-add-btn" data-custom-sign="1">+</button>
            <button type="button" class="token-add-btn is-neg" data-custom-sub="${scaleIdx}">−</button>
          </form>
        </div>
      </article>
    `;
  }

  renderPanTermPills(scaleIdx, side, pan, vm) {
    const kinds = [
      { key: 'x', val: pan.x, icon: vm.x.icon, cls: 'pill-x' },
      { key: 'y', val: pan.y, icon: vm.y.icon, cls: 'pill-y' },
      { key: 'c', val: pan.c, icon: '⚖️', cls: 'pill-c' },
    ].filter((item) => Math.abs(item.val) >= EPS);

    if (kinds.length === 0) {
      return `<span class="pan-empty-label">空盤 (0) — 點擊按鈕或拖曳磁鐵至此</span>`;
    }

    return kinds
      .map((item) => {
        const displayVal =
          item.key === 'c'
            ? formatCoeff(item.val)
            : `${Math.abs(item.val - 1) < EPS ? '' : Math.abs(item.val + 1) < EPS ? '−' : formatCoeff(item.val)}${item.key}`;
        return `
          <div class="term-pill ${item.cls} ${item.val < 0 ? 'is-negative' : ''}">
            <span class="term-label">${item.icon} ${escapeHtml(displayVal)}</span>
            <div class="term-controls">
              <button type="button" class="term-ctrl-btn" data-term-delta="${scaleIdx}:${side}:${item.key}:-1" aria-label="${item.key} 減 1">−1</button>
              <button type="button" class="term-ctrl-btn" data-term-delta="${scaleIdx}:${side}:${item.key}:1" aria-label="${item.key} 加 1">+1</button>
              <button type="button" class="term-ctrl-btn" data-term-flip="${scaleIdx}:${side}:${item.key}" aria-label="${item.key} 正負反轉">±</button>
              <button type="button" class="term-ctrl-btn is-del" data-term-clear="${scaleIdx}:${side}:${item.key}" aria-label="移除 ${item.key}">✕</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderColorEquationHtml(scale) {
    const renderSide = (pan) => {
      const toks = buildPanTokens(pan);
      return toks
        .map((t) => {
          if (t.kind === 'x') return `<span class="eq-tok-x">${escapeHtml(t.text)}</span>`;
          if (t.kind === 'y') return `<span class="eq-tok-y">${escapeHtml(t.text)}</span>`;
          if (t.kind === 'c') return `<span class="eq-tok-c">${escapeHtml(t.text)}</span>`;
          return `<span>${escapeHtml(t.text)}</span>`;
        })
        .join('');
    };
    return `${renderSide(scale.left)} <span class="eq-eq">=</span> ${renderSide(scale.right)}`;
  }

  // ==================== STEP 4: 交點驗算與破關 ====================
  renderStep4(level, vm, swapped) {
    const { scales, testX, testY, earnedStars } = this.state;
    const eq1 = normalizeScale(scales[0], swapped);
    const eq2 = normalizeScale(scales[1], swapped);

    const trueX = vm.xVal;
    const trueY = vm.yVal;
    const maxSliderX = Math.max(12, Math.ceil(trueX * 1.5));
    const maxSliderY = Math.max(12, Math.ceil(trueY * 1.5));
    const stepSizeX = Number.isInteger(trueX) ? 1 : 0.5;
    const stepSizeY = Number.isInteger(trueY) ? 1 : 0.5;

    const tilt1 = evaluateScaleTilt(scales[0], testX, testY);
    const tilt2 = evaluateScaleTilt(scales[1], testX, testY);
    const bothBalancedAtTest = tilt1.isBalanced && tilt2.isBalanced;

    const solvingSteps = level.solvingSteps(swapped);
    const hasNext = !level.isProcedural && level.id < LEVELS.length;

    return `
      <section class="step-panel step4-panel" aria-labelledby="step4-title">
        <div class="victory-banner">
          <div>
            <h3 id="step4-title">🏆 列式大成功！看見兩條方程式的交點</h3>
            <p class="muted-note">你剛才親手打造的聯立方程式，在座標平面上畫出兩條直線，唯一交點就是答案！</p>
          </div>
          <div class="stars-badge" aria-label="獲得 ${earnedStars} 顆星">
            ${'⭐'.repeat(earnedStars)}${'☆'.repeat(3 - earnedStars)}
          </div>
        </div>

        <div class="system-summary-card">
          <div class="curly-brace" aria-hidden="true">{</div>
          <div class="system-lines">
            <div class="sys-line"><span class="slot-tag clue-1-tag">①</span> <strong>${escapeHtml(formatEquation(scales[0]))}</strong> <span class="canon-note">（化簡：${escapeHtml(formatCanonicalEquation(eq1, swapped))}）</span></div>
            <div class="sys-line"><span class="slot-tag clue-2-tag">②</span> <strong>${escapeHtml(formatEquation(scales[1]))}</strong> <span class="canon-note">（化簡：${escapeHtml(formatCanonicalEquation(eq2, swapped))}）</span></div>
          </div>
          <div class="solution-answer-box">
            <div><span class="var-badge var-x">x = ${formatCoeff(trueX)} ${vm.x.unit}</span></div>
            <div><span class="var-badge var-y">y = ${formatCoeff(trueY)} ${vm.y.unit}</span></div>
          </div>
        </div>

        <div class="step4-visual-grid">
          <div class="step4-graph-card">
            ${renderCoordinateGraphSVG({
              eq1,
              eq2,
              solution: level.solution,
              swapped,
              varMeta: vm,
              testPoint: { x: testX, y: testY },
              showLine2: true,
            })}
          </div>

          <div class="step4-sliders-card">
            <h4>🎛️ 即時驗算實驗台：拉動看看為什麼只有唯一解！</h4>
            <div class="slider-group">
              <label for="s4-x-range"><span class="var-badge var-x">x ${vm.x.icon} ${escapeHtml(vm.x.label)}</span>：<strong>${formatCoeff(testX)}</strong> ${vm.x.unit}</label>
              <input id="s4-x-range" type="range" min="0" max="${maxSliderX}" step="${stepSizeX}" value="${testX}" data-s4-slider="x" />
            </div>
            <div class="slider-group">
              <label for="s4-y-range"><span class="var-badge var-y">y ${vm.y.icon} ${escapeHtml(vm.y.label)}</span>：<strong>${formatCoeff(testY)}</strong> ${vm.y.unit}</label>
              <input id="s4-y-range" type="range" min="0" max="${maxSliderY}" step="${stepSizeY}" value="${testY}" data-s4-slider="y" />
            </div>
            <div class="s4-status-line ${bothBalancedAtTest ? 'is-ok' : 'is-err'}">
              ${
                bothBalancedAtTest
                  ? `✅ 命中交點 (${formatCoeff(testX)}, ${formatCoeff(testY)})！兩座天平同時平衡！`
                  : `⚠️ 偏離交點囉！天平 ① 左=${tilt1.leftVal} / 右=${tilt1.rightVal}；天平 ② 左=${tilt2.leftVal} / 右=${tilt2.rightVal}`
              }
            </div>
            <button type="button" class="pill-btn" data-action="snap-solution">🎯 跳回唯一交點 (${formatCoeff(trueX)}, ${formatCoeff(trueY)})</button>

            <div class="mini-scales-pair">
              ${renderScaleSVG({
                title: '驗算天平一',
                scale: scales[0],
                angleDeg: tilt1.angleDeg,
                status: tilt1.isBalanced ? 'balanced' : 'tilted',
                varMeta: vm,
                accentColor: '#4f46e5',
                compact: true,
              })}
              ${renderScaleSVG({
                title: '驗算天平二',
                scale: scales[1],
                angleDeg: tilt2.angleDeg,
                status: tilt2.isBalanced ? 'balanced' : 'tilted',
                varMeta: vm,
                accentColor: '#10b981',
                compact: true,
              })}
            </div>
          </div>
        </div>

        <details class="solving-recap">
          <summary>✍️ 想一想：如果不用天平，如何用加減消去法／代入消去法解這題？</summary>
          <ol class="recap-steps">
            ${solvingSteps.map((st) => `<li>${escapeHtml(st)}</li>`).join('')}
          </ol>
        </details>

        <div class="step-actions">
          <button type="button" class="secondary-btn" data-jump-step="3">⬅ 回到第 3 步修改天平</button>
          ${
            level.isProcedural
              ? `<button type="button" class="primary-btn" data-action="new-practice">🎲 再出下一題隨機練習 ➜</button>`
              : hasNext
                ? `<button type="button" class="primary-btn" data-action="next-level">➡️ 挑戰第 ${level.id + 1} 關：${escapeHtml(LEVELS[level.id].title)} ➜</button>`
                : `<button type="button" class="primary-btn" data-action="start-practice">🎲 全部 12 關破關！前往無限練習場 ➜</button>`
          }
        </div>
      </section>
    `;
  }

  renderLevelMapDialog() {
    const body = document.getElementById('level-map-body');
    if (!body) return;
    body.innerHTML = WORLDS.map((w) => {
      const worldLevels = LEVELS.filter((l) => l.worldId === w.id);
      return `
        <section class="map-world-section">
          <h3 class="map-world-title" style="--world-color: ${w.color}">World ${w.id}：${escapeHtml(w.name)} <small>${escapeHtml(w.subtitle)}</small></h3>
          <div class="map-levels-grid">
            ${worldLevels
              .map((lvl) => {
                const stars = this.progress.stars[lvl.id] || 0;
                const isCurrent = this.mode === 'campaign' && this.state.level.id === lvl.id;
                return `
                  <button type="button" class="map-level-card ${isCurrent ? 'is-current' : ''} ${stars > 0 ? 'is-solved' : ''}" data-pick-level="${lvl.id}">
                    <div class="map-lvl-top">
                      <span class="map-lvl-num">Lv.${lvl.id}</span>
                      <span class="map-lvl-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                    </div>
                    <div class="map-lvl-title">${lvl.unknowns[0].icon}${lvl.unknowns[1].icon} ${escapeHtml(lvl.title)}</div>
                    <div class="map-lvl-badge">${escapeHtml(lvl.badge)}</div>
                  </button>
                `;
              })
              .join('')}
          </div>
        </section>
      `;
    }).join('');
  }

  // ==================== EVENT HANDLING ====================
  bindEvents() {
    // Global header navigation
    document.getElementById('nav-campaign')?.addEventListener('click', () => {
      playPop();
      this.mode = 'campaign';
      if (this.state.level.isProcedural) {
        this.loadLevel(LEVELS[0]);
      } else {
        this.render();
      }
      this.announce('已切換到闖關模式');
    });

    document.getElementById('nav-sandbox')?.addEventListener('click', () => {
      playPop();
      this.mode = 'sandbox';
      this.render();
      this.announce('已切換到為什麼要兩條式子雙天平沙盒');
    });

    document.getElementById('nav-practice')?.addEventListener('click', () => {
      playPop();
      this.startPracticeLevel();
    });

    document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
      setMuted(!isMuted());
      if (!isMuted()) playPop();
      this.renderHeaderBadges();
    });

    document.getElementById('btn-open-map')?.addEventListener('click', () => {
      playPop();
      this.renderLevelMapDialog();
      this.dialogs.map?.showModal();
    });

    document.getElementById('btn-open-help')?.addEventListener('click', () => {
      playPop();
      this.dialogs.help?.showModal();
    });

    this.dialogs.map?.addEventListener('click', (e) => {
      const pickBtn = e.target.closest('[data-pick-level]');
      if (!pickBtn) return;
      const lvlId = Number(pickBtn.getAttribute('data-pick-level'));
      const found = LEVELS.find((l) => l.id === lvlId);
      if (found) {
        playPop();
        this.mode = 'campaign';
        this.loadLevel(found);
        this.dialogs.closeAnimated(this.dialogs.map);
        this.announce(`已載入第 ${found.id} 關：${found.title}`);
      }
    });

    // Main root delegated click handler
    this.rootEl.addEventListener('click', (e) => {
      const target = e.target;

      // Mode & Stepper
      const jumpBtn = target.closest('[data-jump-step]');
      if (jumpBtn && !jumpBtn.disabled) {
        playPop();
        this.state.step = Number(jumpBtn.getAttribute('data-jump-step'));
        this.render();
        return;
      }

      const actionBtn = target.closest('[data-action]');
      if (actionBtn) {
        this.handleAction(actionBtn.getAttribute('data-action'));
        return;
      }

      // Step 1 interactions
      const varSlotBtn = target.closest('[data-select-var-slot]');
      if (varSlotBtn) {
        playPop();
        this.state.activeVarSlot = varSlotBtn.getAttribute('data-select-var-slot');
        this.render();
        return;
      }

      const clearVarBtn = target.closest('[data-clear-var]');
      if (clearVarBtn) {
        playPop();
        const slot = clearVarBtn.getAttribute('data-clear-var');
        if (slot === 'x') this.state.xAssignedId = null;
        else this.state.yAssignedId = null;
        this.state.activeVarSlot = slot;
        this.state.step1Feedback = null;
        this.render();
        return;
      }

      const varCandBtn = target.closest('[data-candidate-kind]');
      if (varCandBtn && !varCandBtn.disabled) {
        this.handleVarCandidateSelect(
          varCandBtn.getAttribute('data-candidate-kind'),
          varCandBtn.getAttribute('data-candidate-id'),
          this.state.activeVarSlot
        );
        return;
      }

      // Step 2 interactions
      const clueSlotBtn = target.closest('[data-select-clue-slot]');
      if (clueSlotBtn) {
        playPop();
        this.state.activeClueSlot = Number(clueSlotBtn.getAttribute('data-select-clue-slot'));
        this.render();
        return;
      }

      const clearClueBtn = target.closest('[data-clear-clue]');
      if (clearClueBtn) {
        playPop();
        const idx = Number(clearClueBtn.getAttribute('data-clear-clue'));
        this.state.assignedClueOrder[idx] = null;
        this.state.activeClueSlot = idx;
        this.state.step2Feedback = null;
        this.render();
        return;
      }

      const clueCandBtn = target.closest('[data-clue-kind]');
      if (clueCandBtn && !clueCandBtn.disabled) {
        this.handleClueCandidateSelect(
          clueCandBtn.getAttribute('data-clue-kind'),
          Number(clueCandBtn.getAttribute('data-clue-idx')),
          this.state.activeClueSlot
        );
        return;
      }

      // Step 3 interactions
      const magnetBtn = target.closest('[data-select-magnet]');
      if (magnetBtn) {
        playClink();
        this.state.selectedMagnetIdx = Number(magnetBtn.getAttribute('data-select-magnet'));
        this.render();
        return;
      }

      const applyMagBtn = target.closest('[data-apply-magnet]');
      if (applyMagBtn) {
        const mode = applyMagBtn.getAttribute('data-apply-magnet');
        const chip = this.state.level.numberChips[this.state.selectedMagnetIdx];
        if (chip) {
          this.applyMagnetToActivePan(chip.value, mode);
        }
        return;
      }

      const targetScaleBtn = target.closest('[data-target-scale]');
      if (targetScaleBtn) {
        playPop();
        this.lastActiveScaleIdx = Number(targetScaleBtn.getAttribute('data-target-scale'));
        this.render();
        return;
      }

      const panSelectBtn = target.closest('[data-select-pan]');
      if (panSelectBtn) {
        playPop();
        const [sIdxStr, side] = panSelectBtn.getAttribute('data-select-pan').split(':');
        const sIdx = Number(sIdxStr);
        this.lastActiveScaleIdx = sIdx;
        this.state.activePan[sIdx] = side;
        this.render();
        return;
      }

      const panAddBtn = target.closest('[data-pan-add]');
      if (panAddBtn) {
        const [sIdxStr, key, deltaStr] = panAddBtn.getAttribute('data-pan-add').split(':');
        const sIdx = Number(sIdxStr);
        this.adjustPanTerm(sIdx, this.state.activePan[sIdx], key, Number(deltaStr));
        return;
      }

      const deltaBtn = target.closest('[data-term-delta]');
      if (deltaBtn) {
        const [sIdxStr, side, key, deltaStr] = deltaBtn.getAttribute('data-term-delta').split(':');
        this.adjustPanTerm(Number(sIdxStr), side, key, Number(deltaStr));
        return;
      }

      const flipBtn = target.closest('[data-term-flip]');
      if (flipBtn) {
        const [sIdxStr, side, key] = flipBtn.getAttribute('data-term-flip').split(':');
        const sIdx = Number(sIdxStr);
        playClink();
        this.state.scales[sIdx][side][key] = roundClean(-this.state.scales[sIdx][side][key]);
        this.state.lastCheck = null;
        this.render();
        return;
      }

      const clearTermBtn = target.closest('[data-term-clear]');
      if (clearTermBtn) {
        const [sIdxStr, side, key] = clearTermBtn.getAttribute('data-term-clear').split(':');
        playPop();
        this.state.scales[Number(sIdxStr)][side][key] = 0;
        this.state.lastCheck = null;
        this.render();
        return;
      }

      const clearScaleBtn = target.closest('[data-clear-scale]');
      if (clearScaleBtn) {
        playPop();
        this.state.scales[Number(clearScaleBtn.getAttribute('data-clear-scale'))] = createEmptyScale();
        this.state.lastCheck = null;
        this.render();
        return;
      }

      const tapeBtn = target.closest('[data-toggle-tape]');
      if (tapeBtn) {
        playPop();
        const idx = Number(tapeBtn.getAttribute('data-toggle-tape'));
        this.state.showTapeDiagram[idx] = !this.state.showTapeDiagram[idx];
        this.render();
        return;
      }

      const expBtn = target.closest('[data-toggle-exp]');
      if (expBtn) {
        playPop();
        const idx = Number(expBtn.getAttribute('data-toggle-exp'));
        this.state.showExpansionHint[idx] = !this.state.showExpansionHint[idx];
        this.render();
        return;
      }

      const customSubBtn = target.closest('[data-custom-sub]');
      if (customSubBtn) {
        const sIdx = Number(customSubBtn.getAttribute('data-custom-sub'));
        const input = document.getElementById(`custom-num-${sIdx}`);
        const val = Number(input?.value);
        if (Number.isFinite(val) && Math.abs(val) > EPS) {
          this.adjustPanTerm(sIdx, this.state.activePan[sIdx], 'c', -val);
        }
        return;
      }

      // Sandbox Interactions
      const sbPresetBtn = target.closest('[data-sb-preset]');
      if (sbPresetBtn) {
        playPop();
        const idx = Number(sbPresetBtn.getAttribute('data-sb-preset'));
        const p = getSandboxPreset(idx);
        this.sandbox.presetIndex = idx;
        this.sandbox.testX = p.quickPairs[0][0];
        this.sandbox.testY = p.quickPairs[0][1];
        this.sandbox.enableScale2 = false;
        this.sandbox.discoveredLine1Dots = [{ x: this.sandbox.testX, y: this.sandbox.testY }];
        this.render();
        return;
      }

      const sbPairBtn = target.closest('[data-sb-pair]');
      if (sbPairBtn) {
        const [qx, qy] = sbPairBtn.getAttribute('data-sb-pair').split(',').map(Number);
        this.updateSandboxPoint(qx, qy);
        return;
      }

      const sbToggleS2 = target.closest('[data-sb-toggle-s2]');
      if (sbToggleS2) {
        playPop();
        this.sandbox.enableScale2 = !this.sandbox.enableScale2;
        this.render();
        return;
      }
    });

    // Submit handler for custom number inputs
    this.rootEl.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-custom-num-form]');
      if (!form) return;
      e.preventDefault();
      const sIdx = Number(form.getAttribute('data-custom-num-form'));
      const input = document.getElementById(`custom-num-${sIdx}`);
      const val = Number(input?.value);
      if (Number.isFinite(val) && Math.abs(val) > EPS) {
        this.adjustPanTerm(sIdx, this.state.activePan[sIdx], 'c', val);
      }
    });

    // Input handler for range sliders & challenge checkbox
    this.rootEl.addEventListener('input', (e) => {
      const target = e.target;
      if (target.matches('[data-s4-slider]')) {
        const axis = target.getAttribute('data-s4-slider');
        const val = Number(target.value);
        if (axis === 'x') this.state.testX = val;
        else this.state.testY = val;
        this.render();
        return;
      }

      if (target.matches('[data-sb-slider]')) {
        const axis = target.getAttribute('data-sb-slider');
        const val = Number(target.value);
        const nx = axis === 'x' ? val : this.sandbox.testX;
        const ny = axis === 'y' ? val : this.sandbox.testY;
        this.updateSandboxPoint(nx, ny, false);
        // Preserve slider focus smoothly after re-render
        const refocused = this.rootEl.querySelector(`[data-sb-slider="${axis}"]`);
        refocused?.focus();
      }
    });

    this.rootEl.addEventListener('change', (e) => {
      if (e.target.matches('[data-action="toggle-challenge"]')) {
        this.challengeSkipGuided = e.target.checked;
        if (this.challengeSkipGuided && this.state.step < 3) {
          this.state.xAssignedId = 'u0';
          this.state.yAssignedId = 'u1';
          this.state.assignedClueOrder = [0, 1];
          this.state.step = 3;
          this.render();
        }
      }
    });

    // Drag-and-drop support (desktop bonus on top of click/keyboard)
    this.bindDragAndDrop();
  }

  bindDragAndDrop() {
    let dragPayload = null;
    this.rootEl.addEventListener('dragstart', (e) => {
      const item = e.target.closest('[data-drag-kind]');
      if (!item) return;
      const kind = item.getAttribute('data-drag-kind');
      if (kind === 'var-candidate') {
        dragPayload = {
          kind,
          candKind: item.getAttribute('data-candidate-kind'),
          id: item.getAttribute('data-candidate-id'),
        };
      } else if (kind === 'clue-candidate') {
        dragPayload = {
          kind,
          clueKind: item.getAttribute('data-clue-kind'),
          idx: Number(item.getAttribute('data-clue-idx')),
        };
      } else if (kind === 'magnet') {
        dragPayload = {
          kind,
          magnetIdx: Number(item.getAttribute('data-magnet-idx')),
        };
      }
      e.dataTransfer?.setData('text/plain', kind);
    });

    this.rootEl.addEventListener('dragover', (e) => {
      const zone = e.target.closest('[data-drop-var], [data-drop-clue], [data-drop-pan]');
      if (!zone) return;
      e.preventDefault();
      zone.classList.add('is-drag-over');
    });

    this.rootEl.addEventListener('dragleave', (e) => {
      const zone = e.target.closest('[data-drop-var], [data-drop-clue], [data-drop-pan]');
      zone?.classList.remove('is-drag-over');
    });

    this.rootEl.addEventListener('drop', (e) => {
      const zone = e.target.closest('[data-drop-var], [data-drop-clue], [data-drop-pan]');
      if (!zone || !dragPayload) return;
      e.preventDefault();
      zone.classList.remove('is-drag-over');

      if (dragPayload.kind === 'var-candidate' && zone.hasAttribute('data-drop-var')) {
        this.handleVarCandidateSelect(
          dragPayload.candKind,
          dragPayload.id,
          zone.getAttribute('data-drop-var')
        );
      } else if (dragPayload.kind === 'clue-candidate' && zone.hasAttribute('data-drop-clue')) {
        this.handleClueCandidateSelect(
          dragPayload.clueKind,
          dragPayload.idx,
          Number(zone.getAttribute('data-drop-clue'))
        );
      } else if (dragPayload.kind === 'magnet' && zone.hasAttribute('data-drop-pan')) {
        const [sIdxStr, side] = zone.getAttribute('data-drop-pan').split(':');
        const sIdx = Number(sIdxStr);
        this.state.activePan[sIdx] = side;
        this.state.selectedMagnetIdx = dragPayload.magnetIdx;
        const chip = this.state.level.numberChips[dragPayload.magnetIdx];
        if (chip) {
          this.adjustPanTerm(sIdx, side, 'c', chip.value);
        }
      }
      dragPayload = null;
    });
  }

  handleVarCandidateSelect(candKind, candId, targetSlot) {
    const level = this.state.level;
    if (candKind === 'distractor') {
      const dist = level.unknownDistractors.find((d) => d.id === candId);
      playError();
      this.state.step1Feedback = { type: 'err', text: dist?.reason || '這是已知條件，不是未知數喔！' };
      this.announce(this.state.step1Feedback.text);
      this.render();
      return;
    }

    playDrop();
    if (targetSlot === 'x') {
      if (this.state.yAssignedId === candId) this.state.yAssignedId = null;
      this.state.xAssignedId = candId;
      if (!this.state.yAssignedId) this.state.activeVarSlot = 'y';
    } else {
      if (this.state.xAssignedId === candId) this.state.xAssignedId = null;
      this.state.yAssignedId = candId;
      if (!this.state.xAssignedId) this.state.activeVarSlot = 'x';
    }

    if (this.state.xAssignedId && this.state.yAssignedId) {
      const vm = getVarMeta(level, this.isSwapped());
      this.state.step1Feedback = {
        type: 'ok',
        text: `設定完成！x = ${vm.x.label}，y = ${vm.y.label}（小秘密：就算兩者互換也完全算對喔！）`,
      };
      this.announce(this.state.step1Feedback.text);
    } else {
      this.state.step1Feedback = null;
    }
    this.render();
  }

  handleClueCandidateSelect(clueKind, clueIdx, targetSlot) {
    const level = this.state.level;
    if (clueKind === 'distractor') {
      playError();
      this.state.step2Feedback = { type: 'err', text: level.clueDistractor.reason };
      this.announce(this.state.step2Feedback.text);
      this.render();
      return;
    }

    playDrop();
    const otherSlot = targetSlot === 0 ? 1 : 0;
    if (this.state.assignedClueOrder[otherSlot] === clueIdx) {
      this.state.assignedClueOrder[otherSlot] = null;
    }
    this.state.assignedClueOrder[targetSlot] = clueIdx;
    if (this.state.assignedClueOrder[otherSlot] === null) {
      this.state.activeClueSlot = otherSlot;
    }

    if (this.state.assignedClueOrder[0] !== null && this.state.assignedClueOrder[1] !== null) {
      this.state.step2Feedback = {
        type: 'ok',
        text: '兩條線索都鎖定了！現在就把它們放上雙天平吧！',
      };
      this.announce(this.state.step2Feedback.text);
    } else {
      this.state.step2Feedback = null;
    }
    this.render();
  }

  adjustPanTerm(scaleIdx, side, key, delta) {
    playClink();
    this.lastActiveScaleIdx = scaleIdx;
    const pan = this.state.scales[scaleIdx][side];
    pan[key] = roundClean((pan[key] ?? 0) + delta);
    this.state.activePan[scaleIdx] = side;
    this.state.lastCheck = null;
    this.render();
  }

  applyMagnetToActivePan(value, mode) {
    // Apply to whichever scale was interacted with most recently? Wait: let's track `lastActiveScaleIdx`!
    const sIdx = this.lastActiveScaleIdx ?? 0;
    const side = this.state.activePan[sIdx];
    const [op, kind] = mode.split('-');
    const signedVal = op === 'sub' ? -value : value;
    const key = kind === 'x' ? 'x' : kind === 'y' ? 'y' : 'c';
    this.adjustPanTerm(sIdx, side, key, signedVal);
  }

  handleAction(action) {
    if (action === 'swap-xy') {
      playPop();
      const prevX = this.state.xAssignedId;
      this.state.xAssignedId = this.state.yAssignedId;
      this.state.yAssignedId = prevX;
      this.state.lastCheck = null;
      this.render();
      this.announce('已對調 x 與 y 的定義');
      return;
    }

    if (action === 'goto-step-2') {
      playPop();
      this.state.step = 2;
      this.render();
      return;
    }

    if (action === 'goto-step-3') {
      playPop();
      this.state.step = 3;
      this.render();
      return;
    }

    if (action === 'next-hint') {
      playPop();
      if (this.state.hintTier < 3) {
        this.state.hintTier += 1;
        this.announce(`顯示第 ${this.state.hintTier} 層提示`);
        this.render();
      }
      return;
    }

    if (action === 'verify-scales') {
      this.runVerification();
      return;
    }

    if (action === 'goto-step-4') {
      playVictory();
      const vm = getVarMeta(this.state.level, this.isSwapped());
      this.state.testX = vm.xVal;
      this.state.testY = vm.yVal;
      this.state.step = 4;
      this.render();
      return;
    }

    if (action === 'snap-solution') {
      playBalanceLock();
      const vm = getVarMeta(this.state.level, this.isSwapped());
      this.state.testX = vm.xVal;
      this.state.testY = vm.yVal;
      this.render();
      return;
    }

    if (action === 'next-level') {
      playPop();
      const next = LEVELS.find((l) => l.id === this.state.level.id + 1);
      if (next) this.loadLevel(next);
      return;
    }

    if (action === 'new-practice' || action === 'start-practice') {
      playPop();
      this.startPracticeLevel();
      return;
    }
  }

  runVerification() {
    const { level, scales, assignedClueOrder } = this.state;
    const swapped = this.isSwapped();
    const order = [assignedClueOrder[0] ?? 0, assignedClueOrder[1] ?? 1];
    const res = verifyLevelAttempt(level, swapped, scales[0], scales[1], order);
    this.state.lastCheck = res;

    if (res.passed) {
      playBalanceLock();
      let stars = 3;
      if (this.state.hintTier >= 2 || this.state.retries >= 3) stars = 2;
      if (this.state.hintTier >= 3 && this.state.retries >= 4) stars = 1;
      this.state.earnedStars = stars;
      this.saveProgress(level.id, stars);
      this.announce(`太棒了！${res.feedback}`);
    } else {
      playError();
      this.state.retries += 1;
      this.announce(res.feedback);
    }
    this.render();
  }

  startPracticeLevel() {
    this.mode = 'practice';
    const nextLvl = generatePracticeLevel(this.practiceCounter);
    this.practiceCounter += 1;
    this.loadLevel(nextLvl);
    this.announce(`已產生新的隨機練習題：${nextLvl.title}`);
  }

  updateSandboxPoint(nx, ny, playSound = true) {
    const preset = getSandboxPreset(this.sandbox.presetIndex);
    this.sandbox.testX = nx;
    this.sandbox.testY = ny;

    const tilt1 = evaluateScaleTilt(preset.scale1, nx, ny);
    const tilt2 = evaluateScaleTilt(preset.scale2, nx, ny);
    if (tilt1.isBalanced) {
      const exists = this.sandbox.discoveredLine1Dots.some((d) => d.x === nx && d.y === ny);
      if (!exists) {
        this.sandbox.discoveredLine1Dots.push({ x: nx, y: ny });
      }
    }
    if (playSound) {
      if (tilt1.isBalanced && this.sandbox.enableScale2 && tilt2.isBalanced) {
        playBalanceLock();
      } else if (tilt1.isBalanced) {
        playClink();
      } else {
        playPop();
      }
    }
    this.render();
  }
}
