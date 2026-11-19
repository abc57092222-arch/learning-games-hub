import { computeLineBoxSegment, formatCanonicalEquation, formatCoeff } from '../math/equationEngine.js';

/**
 * Render an interactive 2D SVG coordinate graph showing Line ①, Line ②,
 * their intersection `(x*, y*)`, and an optional live test probe point `(testX, testY)`.
 */
export function renderCoordinateGraphSVG({
  eq1,
  eq2,
  solution, // { u0, u1 } in canonical coordinates
  swapped = false,
  varMeta,
  testPoint = null, // { x, y } in student (x, y) coordinates
  showLine2 = true,
  historyDots = [],
}) {
  const width = 420;
  const height = 300;
  const pad = { top: 24, right: 28, bottom: 44, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Student-coordinate equations
  const sEq1 = swapped ? { a: eq1.b, b: eq1.a, c: eq1.c } : eq1;
  const sEq2 = swapped ? { a: eq2.b, b: eq2.a, c: eq2.c } : eq2;

  const trueX = swapped ? solution.u1 : solution.u0;
  const trueY = swapped ? solution.u0 : solution.u1;

  // Determine neat viewport bounds covering (0,0), (trueX, trueY), and intercepts
  const xCandidates = [trueX * 1.45, 10];
  const yCandidates = [trueY * 1.45, 10];
  if (Math.abs(sEq1.a) > 1e-6 && sEq1.c / sEq1.a > 0 && sEq1.c / sEq1.a < trueX * 3.5) {
    xCandidates.push((sEq1.c / sEq1.a) * 1.15);
  }
  if (Math.abs(sEq1.b) > 1e-6 && sEq1.c / sEq1.b > 0 && sEq1.c / sEq1.b < trueY * 3.5) {
    yCandidates.push((sEq1.c / sEq1.b) * 1.15);
  }
  if (testPoint) {
    xCandidates.push(testPoint.x * 1.15);
    yCandidates.push(testPoint.y * 1.15);
  }

  const maxX = chooseNiceBound(Math.max(...xCandidates));
  const maxY = chooseNiceBound(Math.max(...yCandidates));
  const bounds = { minX: 0, maxX, minY: 0, maxY };

  const toPxX = (vx) => pad.left + ((vx - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
  const toPxY = (vy) => pad.top + plotH - ((vy - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;

  // Grid ticks (5 intervals)
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const gridLines = ticks
    .map((t) => {
      const gx = bounds.minX + t * (bounds.maxX - bounds.minX);
      const gy = bounds.minY + t * (bounds.maxY - bounds.minY);
      const px = toPxX(gx);
      const py = toPxY(gy);
      return `
        <line x1="${px}" y1="${pad.top}" x2="${px}" y2="${pad.top + plotH}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${px}" y="${pad.top + plotH + 16}" text-anchor="middle" font-size="10.5" fill="#64748b">${formatCoeff(Math.round(gx * 10) / 10)}</text>
        <line x1="${pad.left}" y1="${py}" x2="${pad.left + plotW}" y2="${py}" stroke="#e2e8f0" stroke-width="1" />
        <text x="${pad.left - 8}" y="${py + 4}" text-anchor="end" font-size="10.5" fill="#64748b">${formatCoeff(Math.round(gy * 10) / 10)}</text>
      `;
    })
    .join('');

  const seg1 = computeLineBoxSegment(sEq1.a, sEq1.b, sEq1.c, bounds);
  const seg2 = showLine2 ? computeLineBoxSegment(sEq2.a, sEq2.b, sEq2.c, bounds) : null;

  const line1Svg = seg1
    ? `<line class="graph-line-1" x1="${toPxX(seg1[0].x)}" y1="${toPxY(seg1[0].y)}" x2="${toPxX(seg1[1].x)}" y2="${toPxY(seg1[1].y)}" stroke="#4f46e5" stroke-width="3.2" stroke-linecap="round" />`
    : '';

  const line2Svg = seg2
    ? `<line class="graph-line-2" x1="${toPxX(seg2[0].x)}" y1="${toPxY(seg2[0].y)}" x2="${toPxX(seg2[1].x)}" y2="${toPxY(seg2[1].y)}" stroke="#10b981" stroke-width="3.2" stroke-linecap="round" />`
    : '';

  const ix = toPxX(trueX);
  const iy = toPxY(trueY);

  const historySvg = historyDots
    .map((pt) => {
      const hx = toPxX(pt.x);
      const hy = toPxY(pt.y);
      return `<circle cx="${hx}" cy="${hy}" r="4.5" fill="#818cf8" stroke="#ffffff" stroke-width="1.5" opacity="0.85" />`;
    })
    .join('');

  const probeSvg = testPoint
    ? (() => {
        const px = toPxX(Math.min(maxX, Math.max(0, testPoint.x)));
        const py = toPxY(Math.min(maxY, Math.max(0, testPoint.y)));
        const onSolution =
          Math.abs(testPoint.x - trueX) < 1e-4 && Math.abs(testPoint.y - trueY) < 1e-4;
        return `
          <line x1="${px}" y1="${pad.top + plotH}" x2="${px}" y2="${py}" stroke="#94a3b8" stroke-dasharray="3 3" stroke-width="1.2" />
          <line x1="${pad.left}" y1="${py}" x2="${px}" y2="${py}" stroke="#94a3b8" stroke-dasharray="3 3" stroke-width="1.2" />
          <circle cx="${px}" cy="${py}" r="7" fill="${onSolution ? '#f59e0b' : '#ec4899'}" stroke="#ffffff" stroke-width="2.2" />
          <rect x="${Math.min(width - 96, px + 8)}" y="${Math.max(8, py - 24)}" width="84" height="20" rx="6" fill="#0f172a" opacity="0.88" />
          <text x="${Math.min(width - 96, px + 8) + 42}" y="${Math.max(8, py - 24) + 14}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#ffffff">(${formatCoeff(testPoint.x)}, ${formatCoeff(testPoint.y)})</text>
        `;
      })()
    : '';

  const eq1Label = formatCanonicalEquation(eq1, swapped);
  const eq2Label = formatCanonicalEquation(eq2, swapped);

  return `
    <svg class="coord-graph-svg" viewBox="0 0 ${width} ${height}" role="img">
      <title>二元一次聯立方程式交點圖：直線一 ${eq1Label}${showLine2 ? ` 與直線二 ${eq2Label} 相交於 (${trueX}, ${trueY})` : ''}</title>
      <rect x="${pad.left}" y="${pad.top}" width="${plotW}" height="${plotH}" fill="#ffffff" rx="6" />
      ${gridLines}

      <!-- Axes -->
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="#2563eb" stroke-width="2" />
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="#d97706" stroke-width="2" />

      <text x="${pad.left + plotW}" y="${pad.top + plotH + 34}" text-anchor="end" font-size="11.5" font-weight="700" fill="#1d4ed8">x (${varMeta.x.label})</text>
      <text x="${pad.left + 4}" y="${pad.top - 8}" text-anchor="start" font-size="11.5" font-weight="700" fill="#b45309">y (${varMeta.y.label})</text>

      <!-- Equations -->
      ${line1Svg}
      ${line2Svg}
      ${historySvg}

      <!-- Solution intersection -->
      ${
        showLine2
          ? `
        <circle cx="${ix}" cy="${iy}" r="11" fill="#fef3c7" opacity="0.8" />
        <circle cx="${ix}" cy="${iy}" r="5.5" fill="#f59e0b" stroke="#78350f" stroke-width="2" />
        ${
          !testPoint
            ? `
          <rect x="${Math.min(width - 110, ix + 10)}" y="${Math.max(12, iy - 26)}" width="98" height="22" rx="6" fill="#78350f" />
          <text x="${Math.min(width - 110, ix + 10) + 49}" y="${Math.max(12, iy - 26) + 15}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">交點 (${formatCoeff(trueX)}, ${formatCoeff(trueY)})</text>
        `
            : ''
        }
      `
          : ''
      }

      ${probeSvg}

      <!-- Legend -->
      <rect x="${pad.left + 8}" y="${pad.top + 6}" width="176" height="${showLine2 ? 38 : 22}" rx="6" fill="rgba(255,255,255,0.92)" stroke="#e2e8f0" />
      <line x1="${pad.left + 16}" y1="${pad.top + 17}" x2="${pad.left + 32}" y2="${pad.top + 17}" stroke="#4f46e5" stroke-width="3" />
      <text x="${pad.left + 37}" y="${pad.top + 21}" font-size="10.5" font-weight="700" fill="#312e81">① ${eq1Label}</text>
      ${
        showLine2
          ? `
        <line x1="${pad.left + 16}" y1="${pad.top + 34}" x2="${pad.left + 32}" y2="${pad.top + 34}" stroke="#10b981" stroke-width="3" />
        <text x="${pad.left + 37}" y="${pad.top + 38}" font-size="10.5" font-weight="700" fill="#065f46">② ${eq2Label}</text>
      `
          : ''
      }
    </svg>
  `;
}

function chooseNiceBound(rawMax) {
  const safe = Math.max(4, rawMax);
  const mag = 10 ** Math.floor(Math.log10(safe));
  const norm = safe / mag;
  let nice;
  if (norm <= 1.2) nice = 1.2;
  else if (norm <= 1.5) nice = 1.5;
  else if (norm <= 2) nice = 2;
  else if (norm <= 3) nice = 3;
  else if (norm <= 4) nice = 4;
  else if (norm <= 5) nice = 5;
  else if (norm <= 6) nice = 6;
  else if (norm <= 8) nice = 8;
  else nice = 10;
  return Math.ceil(nice * mag);
}
