/**
 * Procedural SVG Array / Grid visualizer.
 * Renders a visual representation of (rows x cols) or dots with groups.
 */

export function renderArraySvg(rows, cols, options = {}) {
  const {
    isRotated = false,
    highlightColor = '#0284c7',
    dotRadius = 14,
    gap = 8,
  } = options;

  const actualRows = isRotated ? cols : rows;
  const actualCols = isRotated ? rows : cols;

  const cellSize = dotRadius * 2 + gap;
  const padding = 16;
  const width = actualCols * cellSize + padding * 2;
  const height = actualRows * cellSize + padding * 2;

  let dotsMarkup = '';

  for (let r = 0; r < actualRows; r++) {
    for (let c = 0; c < actualCols; c++) {
      const cx = padding + c * cellSize + dotRadius;
      const cy = padding + r * cellSize + dotRadius;
      const index = r * actualCols + c + 1;
      const hue = Math.round((r / Math.max(1, actualRows)) * 40 + 195);
      const fill = `hsl(${hue}, 85%, 55%)`;

      dotsMarkup += `
        <g class="dot-cell" data-index="${index}">
          <circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="${fill}" class="dot-circle" />
          <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff" pointer-events="none">${index}</text>
        </g>
      `;
    }
  }

  // Row bracket / labels
  const labelText = isRotated
    ? `${actualRows} 行 × ${actualCols} 列（旋轉視角：${actualCols} × ${actualRows}）`
    : `${rows} 個一組 × ${cols} 組 = ${rows * cols}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" class="array-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${labelText}">
      <rect width="${width}" height="${height}" rx="12" fill="var(--bg-canvas-subtle, #f8fafc)" stroke="var(--border-subtle, #e2e8f0)" stroke-width="1.5" />
      ${dotsMarkup}
    </svg>
  `;
}
