import { evaluateScaleTilt } from '../math/equationEngine.js';
import { renderCoordinateGraphSVG } from './graphRenderer.js';
import { renderScaleSVG } from './scaleRenderer.js';

const SANDBOX_PRESETS = [
  {
    id: 'farm',
    title: '農場雞兔（10 顆頭、28 隻腳）',
    clue1Text: '① 雞 (x) 與兔 (y) 共 10 隻：x + y = 10',
    clue2Text: '② 總腳數 28 隻：2x + 4y = 28',
    scale1: { left: { x: 1, y: 1, c: 0 }, right: { x: 0, y: 0, c: 10 } },
    scale2: { left: { x: 2, y: 4, c: 0 }, right: { x: 0, y: 0, c: 28 } },
    eq1: { a: 1, b: 1, c: 10 },
    eq2: { a: 2, b: 4, c: 28 },
    solution: { u0: 6, u1: 4 },
    maxX: 12,
    maxY: 12,
    varMeta: {
      x: { label: '雞隻數', unit: '隻', icon: '🐔' },
      y: { label: '兔隻數', unit: '隻', icon: '🐰' },
    },
    quickPairs: [
      [2, 8],
      [4, 6],
      [6, 4],
      [8, 2],
    ],
  },
  {
    id: 'boba',
    title: '夜市點餐（共 8 份、460 元）',
    clue1Text: '① 珍奶 (x) 與雞排 (y) 共 8 份：x + y = 8',
    clue2Text: '② 50元珍奶 + 70元雞排 = 460：50x + 70y = 460',
    scale1: { left: { x: 1, y: 1, c: 0 }, right: { x: 0, y: 0, c: 8 } },
    scale2: { left: { x: 50, y: 70, c: 0 }, right: { x: 0, y: 0, c: 460 } },
    eq1: { a: 1, b: 1, c: 8 },
    eq2: { a: 50, b: 70, c: 460 },
    solution: { u0: 5, u1: 3 },
    maxX: 10,
    maxY: 10,
    varMeta: {
      x: { label: '珍奶杯數', unit: '杯', icon: '🧋' },
      y: { label: '雞排份數', unit: '份', icon: '🍗' },
    },
    quickPairs: [
      [1, 7],
      [4, 4],
      [5, 3],
      [7, 1],
    ],
  },
];

export function createSandboxState() {
  return {
    presetIndex: 0,
    testX: 2,
    testY: 8,
    enableScale2: false,
    discoveredLine1Dots: [{ x: 2, y: 8 }],
  };
}

export function renderSandboxHTML(sbState) {
  const preset = SANDBOX_PRESETS[sbState.presetIndex];
  const tilt1 = evaluateScaleTilt(preset.scale1, sbState.testX, sbState.testY);
  const tilt2 = evaluateScaleTilt(preset.scale2, sbState.testX, sbState.testY);

  const bothOk = tilt1.isBalanced && sbState.enableScale2 && tilt2.isBalanced;

  let insightText = '';
  if (!sbState.enableScale2) {
    if (tilt1.isBalanced) {
      insightText = `🎯 (${sbState.testX}, ${sbState.testY}) 讓天平 ① 平衡了！但試試別的組合（例如 (4,6)、(6,4)、(8,2)）— 只有一條式子時，有「無限多組解」排成一條直線，猜不出唯一答案！`;
    } else {
      insightText = `現在左盤 = ${tilt1.leftVal}、右盤 = ${tilt1.rightVal}，天平 ① 歪了！拉動滑桿讓 ${preset.varMeta.x.label} + ${preset.varMeta.y.label} 等於右盤試試看。`;
    }
  } else {
    if (bothOk) {
      insightText = `🏆 找到唯一交點 (${sbState.testX}, ${sbState.testY})！只有這一個組合能同時讓天平 ① 和天平 ② 兩邊都平穩！這就是「兩條線索交出唯一解」的秘密！`;
    } else if (tilt1.isBalanced && !tilt2.isBalanced) {
      insightText = `⚡ 看！(${sbState.testX}, ${sbState.testY}) 雖然通過了天平 ①，卻讓天平 ② 歪掉（左盤 ${tilt2.leftVal} ≠ 右盤 ${tilt2.rightVal}）！快滑動尋找兩座同時平衡的唯一點！`;
    } else if (!tilt1.isBalanced && tilt2.isBalanced) {
      insightText = `⚡ (${sbState.testX}, ${sbState.testY}) 只符合天平 ②，但不符合天平 ①（左盤 ${tilt1.leftVal} ≠ 右盤 ${tilt1.rightVal}）！`;
    } else {
      insightText = `兩座天平都還沒平衡喔！觀察右邊座標平面上的兩條直線交點吧！`;
    }
  }

  return `
    <section class="sandbox-panel" aria-labelledby="sandbox-title">
      <div class="panel-header-row">
        <div>
          <h2 id="sandbox-title">🔬 為什麼需要「兩條式子」？雙天平直覺沙盒</h2>
          <p class="muted-note">先只看 1 座天平，體驗「一式無限解」；再開啟天平 ②，見證「兩式鎖定唯一交點」！</p>
        </div>
        <div class="preset-switcher" role="group" aria-label="沙盒題目切換">
          ${SANDBOX_PRESETS.map(
            (p, idx) => `
            <button type="button" class="pill-btn ${idx === sbState.presetIndex ? 'is-active' : ''}" data-sb-preset="${idx}">
              ${p.title.split('（')[0]}
            </button>
          `
          ).join('')}
        </div>
      </div>

      <div class="sandbox-controls-bar">
        <div class="slider-group">
          <label for="sb-x-range">
            <span class="var-badge var-x">x ${preset.varMeta.x.icon} ${preset.varMeta.x.label}</span>：<strong>${sbState.testX}</strong> ${preset.varMeta.x.unit}
          </label>
          <input id="sb-x-range" type="range" min="0" max="${preset.maxX}" step="1" value="${sbState.testX}" data-sb-slider="x" />
        </div>
        <div class="slider-group">
          <label for="sb-y-range">
            <span class="var-badge var-y">y ${preset.varMeta.y.icon} ${preset.varMeta.y.label}</span>：<strong>${sbState.testY}</strong> ${preset.varMeta.y.unit}
          </label>
          <input id="sb-y-range" type="range" min="0" max="${preset.maxY}" step="1" value="${sbState.testY}" data-sb-slider="y" />
        </div>
        <div class="quick-pairs">
          <span class="quick-label">快速試試：</span>
          ${preset.quickPairs
            .map(
              ([qx, qy]) => `
            <button type="button" class="chip-btn ${sbState.testX === qx && sbState.testY === qy ? 'is-selected' : ''}" data-sb-pair="${qx},${qy}">
              (${qx}, ${qy})
            </button>
          `
            )
            .join('')}
        </div>
        <button type="button" class="toggle-scale2-btn ${sbState.enableScale2 ? 'is-on' : ''}" data-sb-toggle-s2 aria-pressed="${sbState.enableScale2}">
          ${sbState.enableScale2 ? '🔓 天平 ②（第二條線索）已開啟' : '🔒 點此開啟「天平 ②（第二條線索）」'}
        </button>
      </div>

      <div class="insight-banner ${bothOk ? 'is-success' : ''}">${insightText}</div>

      <div class="sandbox-grid">
        <div class="sandbox-scales-col">
          <div class="scale-card clue-1-card">
            <div class="scale-card-title">${preset.clue1Text}</div>
            ${renderScaleSVG({
              title: '沙盒天平一',
              scale: preset.scale1,
              angleDeg: tilt1.angleDeg,
              status: tilt1.isBalanced ? 'balanced' : 'tilted',
              varMeta: preset.varMeta,
              accentColor: '#4f46e5',
              compact: true,
            })}
            <div class="eval-readout">左盤 = ${tilt1.leftVal} ｜ 右盤 = ${tilt1.rightVal}</div>
          </div>

          <div class="scale-card clue-2-card ${sbState.enableScale2 ? '' : 'is-dimmed'}">
            <div class="scale-card-title">${preset.clue2Text}</div>
            ${
              sbState.enableScale2
                ? renderScaleSVG({
                    title: '沙盒天平二',
                    scale: preset.scale2,
                    angleDeg: tilt2.angleDeg,
                    status: tilt2.isBalanced ? 'balanced' : 'tilted',
                    varMeta: preset.varMeta,
                    accentColor: '#10b981',
                    compact: true,
                  })
                : `<div class="scale-locked-placeholder">尚未加入第二條線索 — 目前有好多組 (x, y) 都能過關！</div>`
            }
            <div class="eval-readout">${sbState.enableScale2 ? `左盤 = ${tilt2.leftVal} ｜ 右盤 = ${tilt2.rightVal}` : '開啟天平 ② 來過濾出唯一解答'}</div>
          </div>
        </div>

        <div class="sandbox-graph-col">
          ${renderCoordinateGraphSVG({
            eq1: preset.eq1,
            eq2: preset.eq2,
            solution: preset.solution,
            swapped: false,
            varMeta: preset.varMeta,
            testPoint: { x: sbState.testX, y: sbState.testY },
            showLine2: sbState.enableScale2,
            historyDots: sbState.discoveredLine1Dots,
          })}
        </div>
      </div>
    </section>
  `;
}

export function getSandboxPreset(index) {
  return SANDBOX_PRESETS[index];
}
