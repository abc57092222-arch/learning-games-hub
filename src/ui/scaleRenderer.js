import {
  buildPanTokens,
  EPS,
  formatCoeff,
  formatEquation,
  formatPanExpression,
} from '../math/equationEngine.js';

/**
 * Render an accessible, physically-tilting SVG balance scale.
 * Computes exact beam endpoints so hanging pans stay upright and readable.
 */
export function renderScaleSVG({
  title = '天平',
  scale,
  angleDeg = 0,
  status = 'idle', // 'idle' | 'balanced' | 'tilted'
  varMeta,
  accentColor = '#4f46e5',
  compact = false,
}) {
  const width = compact ? 300 : 360;
  const height = compact ? 156 : 196;
  const cx = width / 2;
  const pivotY = compact ? 38 : 46;
  const halfBeam = compact ? 92 : 112;
  const rad = (angleDeg * Math.PI) / 180;

  const lx = cx - halfBeam * Math.cos(rad);
  const ly = pivotY - halfBeam * Math.sin(rad);
  const rx = cx + halfBeam * Math.cos(rad);
  const ry = pivotY + halfBeam * Math.sin(rad);

  const dropH = compact ? 40 : 52;
  const panW = compact ? 76 : 92;
  const lPanY = ly + dropH;
  const rPanY = ry + dropH;

  const leftText = formatPanExpression(scale.left);
  const rightText = formatPanExpression(scale.right);
  const statusLabel =
    status === 'balanced'
      ? '已平衡'
      : status === 'tilted'
        ? angleDeg < 0
          ? '左盤較重（下沉）'
          : '右盤較重（下沉）'
        : '等待檢驗';

  const statusColor =
    status === 'balanced' ? '#10b981' : status === 'tilted' ? '#ef4444' : accentColor;

  const leftBadges = renderPanVisualTokens(scale.left, lx, lPanY - 12, varMeta, compact);
  const rightBadges = renderPanVisualTokens(scale.right, rx, rPanY - 12, varMeta, compact);

  return `
    <svg class="scale-svg ${status === 'balanced' ? 'is-balanced' : ''}" viewBox="0 0 ${width} ${height}" role="img">
      <title>${escapeHtml(title)}：左盤 ${escapeHtml(leftText)}，右盤 ${escapeHtml(rightText)}，狀態：${statusLabel}</title>
      <!-- Base & Pillar -->
      <rect x="${cx - 46}" y="${height - 14}" width="92" height="10" rx="5" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5" />
      <rect x="${cx - 6}" y="${pivotY + 8}" width="12" height="${height - pivotY - 22}" rx="3" fill="#94a3b8" />
      <!-- Fulcrum triangle -->
      <polygon points="${cx},${pivotY - 4} ${cx - 12},${pivotY + 14} ${cx + 12},${pivotY + 14}" fill="#f59e0b" stroke="#92400e" stroke-width="1.5" />

      <!-- Hanging Left Chain + Pan -->
      <line x1="${lx}" y1="${ly}" x2="${lx - panW * 0.34}" y2="${lPanY}" stroke="#64748b" stroke-width="1.5" />
      <line x1="${lx}" y1="${ly}" x2="${lx + panW * 0.34}" y2="${lPanY}" stroke="#64748b" stroke-width="1.5" />
      <path d="M ${lx - panW / 2} ${lPanY} Q ${lx} ${lPanY + 14} ${lx + panW / 2} ${lPanY} Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.8" />

      <!-- Hanging Right Chain + Pan -->
      <line x1="${rx}" y1="${ry}" x2="${rx - panW * 0.34}" y2="${rPanY}" stroke="#64748b" stroke-width="1.5" />
      <line x1="${rx}" y1="${ry}" x2="${rx + panW * 0.34}" y2="${rPanY}" stroke="#64748b" stroke-width="1.5" />
      <path d="M ${rx - panW / 2} ${rPanY} Q ${rx} ${rPanY + 14} ${rx + panW / 2} ${rPanY} Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.8" />

      <!-- Beam -->
      <line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" stroke="${statusColor}" stroke-width="6" stroke-linecap="round" />
      <circle cx="${lx}" cy="${ly}" r="4.5" fill="#ffffff" stroke="${statusColor}" stroke-width="2" />
      <circle cx="${rx}" cy="${ry}" r="4.5" fill="#ffffff" stroke="${statusColor}" stroke-width="2" />
      <circle cx="${cx}" cy="${pivotY}" r="5.5" fill="#ffffff" stroke="#92400e" stroke-width="2" />

      <!-- Tokens sitting on pans -->
      ${leftBadges}
      ${rightBadges}

      <!-- Status Pill near Base -->
      <rect x="${cx - 46}" y="${height - 40}" width="92" height="22" rx="11" fill="${status === 'balanced' ? '#dcfce7' : status === 'tilted' ? '#fee2e2' : '#eef2ff'}" stroke="${statusColor}" stroke-width="1.4" />
      <text x="${cx}" y="${height - 25}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${status === 'balanced' ? '#166534' : status === 'tilted' ? '#991b1b' : '#3730a3'}">${status === 'balanced' ? '✅ 已平衡' : status === 'tilted' ? (angleDeg < 0 ? '↙ 左盤重' : '↘ 右盤重') : '⚖️ 等號平衡'}</text>
    </svg>
  `;
}

function renderPanVisualTokens(pan, centerX, baseY, varMeta, compact) {
  const tokens = buildPanTokens(pan).filter((t) => t.kind !== 'op' && t.kind !== 'zero');
  if (tokens.length === 0) {
    return `<text x="${centerX}" y="${baseY}" text-anchor="middle" font-size="11" fill="#94a3b8">(空盤 0)</text>`;
  }

  const slotW = compact ? 36 : 42;
  const startX = centerX - ((tokens.length - 1) * slotW) / 2;

  return tokens
    .map((tok, i) => {
      const tx = startX + i * slotW;
      const isNeg = tok.sign === '-';
      const fill =
        tok.kind === 'x'
          ? isNeg
            ? '#fee2e2'
            : '#dbeafe'
          : tok.kind === 'y'
            ? isNeg
              ? '#ffedd5'
              : '#fef3c7'
            : isNeg
              ? '#fce7f3'
              : '#f1f5f9';
      const stroke =
        tok.kind === 'x'
          ? isNeg
            ? '#ef4444'
            : '#2563eb'
          : tok.kind === 'y'
            ? isNeg
              ? '#ea580c'
              : '#d97706'
            : isNeg
              ? '#db2777'
              : '#64748b';
      const textFill =
        tok.kind === 'x'
          ? isNeg
            ? '#b91c1c'
            : '#1d4ed8'
          : tok.kind === 'y'
            ? isNeg
              ? '#c2410c'
              : '#b45309'
            : isNeg
              ? '#9d174d'
              : '#334155';

      const icon =
        tok.kind === 'x'
          ? varMeta?.x?.icon || '📦'
          : tok.kind === 'y'
            ? varMeta?.y?.icon || '📦'
            : '⚖️';

      // Buoyant lift for negative chips
      const ty = isNeg ? baseY - 12 : baseY;
      const dashAttr = isNeg ? 'stroke-dasharray="3 2"' : '';
      const labelStr =
        tok.kind === 'c'
          ? `${isNeg ? '−' : ''}${formatCoeff(tok.absVal)}`
          : `${isNeg ? '−' : ''}${Math.abs(tok.absVal - 1) < EPS ? '' : formatCoeff(tok.absVal)}${tok.kind}`;

      return `
        <g>
          ${isNeg ? `<line x1="${tx}" y1="${ty + 10}" x2="${tx}" y2="${baseY + 8}" stroke="${stroke}" stroke-width="1" stroke-dasharray="2 2" />` : ''}
          <rect x="${tx - 17}" y="${ty - 16}" width="34" height="24" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="1.6" ${dashAttr} />
          <text x="${tx}" y="${ty - 18}" text-anchor="middle" font-size="11">${icon}</text>
          <text x="${tx}" y="${ty}" text-anchor="middle" font-size="11" font-weight="800" fill="${textFill}">${escapeHtml(labelStr)}</text>
        </g>
      `;
    })
    .join('');
}

/**
 * Render an educational Tape/Bar Diagram (`線段對比圖`) showing how the two sides
 * of a student's scale compare conceptually (total sum, difference, or multiple).
 */
export function renderTapeDiagramSVG({ clue, scale, varMeta, swapped }) {
  const eqText = formatEquation(scale);
  const leftTokens = buildPanTokens(scale.left);
  const rightTokens = buildPanTokens(scale.right);

  const width = 340;
  const height = 104;

  function renderBarRow(tokens, yPos, label) {
    const cleanTokens = tokens.filter((t) => t.kind !== 'op');
    if (cleanTokens.length === 1 && cleanTokens[0].kind === 'zero') {
      return `
        <text x="8" y="${yPos + 17}" font-size="11" font-weight="700" fill="#64748b">${label}</text>
        <rect x="46" y="${yPos}" width="282" height="26" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-dasharray="4 3" />
        <text x="187" y="${yPos + 17}" text-anchor="middle" font-size="11.5" fill="#94a3b8">空盤 (0)</text>
      `;
    }

    const totalW = 282;
    const weights = cleanTokens.map((t) => {
      if (t.kind === 'x' || t.kind === 'y') return Math.max(1.2, Math.min(4, Math.abs(t.absVal)));
      return 1.3;
    });
    const sumW = weights.reduce((acc, w) => acc + w, 0) || 1;
    let curX = 46;

    const segs = cleanTokens
      .map((tok, i) => {
        const w = (weights[i] / sumW) * totalW - 3;
        const isNeg = tok.sign === '-';
        const fill =
          tok.kind === 'x'
            ? isNeg
              ? '#fee2e2'
              : '#dbeafe'
            : tok.kind === 'y'
              ? isNeg
                ? '#ffedd5'
                : '#fef3c7'
              : '#e2e8f0';
        const stroke =
          tok.kind === 'x' ? '#2563eb' : tok.kind === 'y' ? '#d97706' : '#64748b';
        const txt = `${tok.sign === '-' ? '−' : i > 0 ? '+' : ''}${tok.kind === 'c' ? formatCoeff(tok.absVal) : `${Math.abs(tok.absVal - 1) < EPS ? '' : formatCoeff(tok.absVal)}${tok.kind}`}`;
        const rect = `
          <rect x="${curX}" y="${yPos}" width="${Math.max(24, w)}" height="26" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${isNeg ? 'stroke-dasharray="4 2"' : ''} />
          <text x="${curX + Math.max(24, w) / 2}" y="${yPos + 17}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#1e293b">${escapeHtml(txt)}</text>
        `;
        curX += Math.max(24, w) + 3;
        return rect;
      })
      .join('');

    return `<text x="8" y="${yPos + 17}" font-size="11" font-weight="700" fill="#475569">${label}</text>${segs}`;
  }

  return `
    <svg class="tape-diagram-svg" viewBox="0 0 ${width} ${height}" role="img">
      <title>線段對比圖：${escapeHtml(eqText)}</title>
      ${renderBarRow(leftTokens, 14, '左盤')}
      <line x1="46" y1="47" x2="328" y2="47" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3" />
      <text x="18" y="51" font-size="11" font-weight="800" fill="#4f46e5">=</text>
      ${renderBarRow(rightTokens, 56, '右盤')}
      <text x="170" y="98" text-anchor="middle" font-size="10.5" fill="#64748b">對比：${escapeHtml(clue?.tag || '線索')}（左長 = 右長 時天平平衡）</text>
    </svg>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
