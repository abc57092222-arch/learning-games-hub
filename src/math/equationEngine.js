/**
 * Pure algebraic equation engine for 2-variable linear systems.
 * Zero DOM dependencies so it runs identically in browser ESM and Node 24 headless tests.
 */

export const EPS = 1e-6;

/**
 * Round a floating point value cleanly to 4 decimal places to avoid IEEE-754 drift
 * (e.g. 0.8 + 0.1 = 0.9000000000000001).
 * @param {number} n
 * @returns {number}
 */
export function roundClean(n) {
  if (!Number.isFinite(n)) return 0;
  const rounded = Math.round(n * 10000) / 10000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Format coefficient cleanly (integers without decimals, decimals without trailing zeros).
 * @param {number} n
 * @returns {string}
 */
export function formatCoeff(n) {
  const clean = roundClean(n);
  if (Math.abs(clean) < EPS) return '0';
  if (Number.isInteger(clean)) return String(clean);
  return String(Number(clean.toFixed(4)));
}

/**
 * Create an empty scale state `{ left: { x, y, c }, right: { x, y, c } }`.
 */
export function createEmptyScale() {
  return {
    left: { x: 0, y: 0, c: 0 },
    right: { x: 0, y: 0, c: 0 },
  };
}

/**
 * Clone a scale deeply.
 * @param {{ left: {x:number,y:number,c:number}, right: {x:number,y:number,c:number} }} scale
 */
export function cloneScale(scale) {
  return {
    left: { x: roundClean(scale.left.x), y: roundClean(scale.left.y), c: roundClean(scale.left.c) },
    right: { x: roundClean(scale.right.x), y: roundClean(scale.right.y), c: roundClean(scale.right.c) },
  };
}

/**
 * Normalize a scale's pan values into canonical equation `a*U0 + b*U1 = c`.
 * When `swapped === false`, student `x` is `U0` and `y` is `U1`.
 * When `swapped === true`, student `x` is `U1` and `y` is `U0`.
 * @param {{ left: {x:number,y:number,c:number}, right: {x:number,y:number,c:number} }} scale
 * @param {boolean} [swapped=false]
 * @returns {{ a: number, b: number, c: number }}
 */
export function normalizeScale(scale, swapped = false) {
  const coeffX = roundClean((scale?.left?.x ?? 0) - (scale?.right?.x ?? 0));
  const coeffY = roundClean((scale?.left?.y ?? 0) - (scale?.right?.y ?? 0));
  const rhs = roundClean((scale?.right?.c ?? 0) - (scale?.left?.c ?? 0));
  if (swapped) {
    return { a: coeffY, b: coeffX, c: rhs };
  }
  return { a: coeffX, b: coeffY, c: rhs };
}

/**
 * Solve a 2x2 linear system:
 *   eq1.a * u0 + eq1.b * u1 = eq1.c
 *   eq2.a * u0 + eq2.b * u1 = eq2.c
 * @param {{ a: number, b: number, c: number }} eq1
 * @param {{ a: number, b: number, c: number }} eq2
 * @returns {{ status: 'unique' | 'parallel' | 'coincident' | 'degenerate', x: number | null, y: number | null, det: number }}
 */
export function solveSystem2x2(eq1, eq2) {
  const norm1 = Math.abs(eq1.a) + Math.abs(eq1.b);
  const norm2 = Math.abs(eq2.a) + Math.abs(eq2.b);
  if (norm1 < EPS || norm2 < EPS) {
    return { status: 'degenerate', x: null, y: null, det: 0 };
  }

  const det = roundClean(eq1.a * eq2.b - eq2.a * eq1.b);
  if (Math.abs(det) > EPS) {
    const x = roundClean((eq1.c * eq2.b - eq2.c * eq1.b) / det);
    const y = roundClean((eq1.a * eq2.c - eq2.a * eq1.c) / det);
    return { status: 'unique', x, y, det };
  }

  const crossAC = Math.abs(eq1.a * eq2.c - eq2.a * eq1.c);
  const crossBC = Math.abs(eq1.b * eq2.c - eq2.b * eq1.c);
  if (crossAC < EPS && crossBC < EPS) {
    return { status: 'coincident', x: null, y: null, det: 0 };
  }
  return { status: 'parallel', x: null, y: null, det: 0 };
}

/**
 * Check if two linear equations `{ a, b, c }` represent the exact same non-degenerate line
 * (including scalar multiples and negated forms like `x - y = 8` vs `-x + y = -8`).
 * @param {{ a: number, b: number, c: number }} eqA
 * @param {{ a: number, b: number, c: number }} eqB
 * @returns {boolean}
 */
export function areLinesEquivalent(eqA, eqB) {
  const normA = Math.abs(eqA.a) + Math.abs(eqA.b);
  const normB = Math.abs(eqB.a) + Math.abs(eqB.b);
  if (normA < EPS || normB < EPS) return false;

  const crossAB = Math.abs(eqA.a * eqB.b - eqB.a * eqA.b);
  const crossAC = Math.abs(eqA.a * eqB.c - eqB.a * eqA.c);
  const crossBC = Math.abs(eqA.b * eqB.c - eqB.b * eqA.c);
  return crossAB < EPS && crossAC < EPS && crossBC < EPS;
}

/**
 * Check if two equations have parallel normal vectors `(a, b)` regardless of constant `c`.
 * @param {{ a: number, b: number }} eqA
 * @param {{ a: number, b: number }} eqB
 * @returns {boolean}
 */
export function areCoefficientsParallel(eqA, eqB) {
  const normA = Math.abs(eqA.a) + Math.abs(eqA.b);
  const normB = Math.abs(eqB.a) + Math.abs(eqB.b);
  if (normA < EPS || normB < EPS) return false;
  return Math.abs(eqA.a * eqB.b - eqB.a * eqA.b) < EPS;
}

/**
 * Evaluate physical tilt of a balance scale at a given `(xVal, yVal)`.
 * Consistent physics: if Left Pan > Right Pan (`diff > 0`), Left Pan sinks DOWN,
 * which is counter-clockwise rotation => negative `angleDeg`.
 * @param {{ left: {x:number,y:number,c:number}, right: {x:number,y:number,c:number} }} scale
 * @param {number} xVal Student's x numeric value
 * @param {number} yVal Student's y numeric value
 * @returns {{ leftVal: number, rightVal: number, diff: number, angleDeg: number, isBalanced: boolean }}
 */
export function evaluateScaleTilt(scale, xVal, yVal) {
  const leftVal = roundClean(
    (scale.left.x ?? 0) * xVal + (scale.left.y ?? 0) * yVal + (scale.left.c ?? 0)
  );
  const rightVal = roundClean(
    (scale.right.x ?? 0) * xVal + (scale.right.y ?? 0) * yVal + (scale.right.c ?? 0)
  );
  const diff = roundClean(leftVal - rightVal);
  const isBalanced = Math.abs(diff) < 1e-4;
  if (isBalanced) {
    return { leftVal, rightVal, diff: 0, angleDeg: 0, isBalanced: true };
  }
  const scaleRef = Math.max(10, Math.abs(leftVal) + Math.abs(rightVal));
  const rawAngle = (diff / scaleRef) * 28;
  const magnitude = Math.min(16, Math.max(3.5, Math.abs(rawAngle)));
  const angleDeg = roundClean(diff > 0 ? -magnitude : magnitude);
  return { leftVal, rightVal, diff, angleDeg, isBalanced: false };
}

/**
 * Check whether an equation `eq` is satisfied at `(u0, u1)` and is non-degenerate.
 * @param {{ a: number, b: number, c: number }} eq
 * @param {number} u0
 * @param {number} u1
 * @returns {boolean}
 */
export function satisfiesPoint(eq, u0, u1) {
  if (Math.abs(eq.a) + Math.abs(eq.b) < EPS) return false;
  return Math.abs(eq.a * u0 + eq.b * u1 - eq.c) < 1e-3;
}

/**
 * Diagnose specific student modeling misconceptions on one scale against a target clue.
 * @param {{ a: number, b: number, c: number }} studentEq Canonical `(U0, U1)` equation
 * @param {{ a: number, b: number, c: number }} targetClue Canonical `(U0, U1)` target equation
 * @param {{ a: number, b: number, c: number } | null} otherClue Canonical `(U0, U1)` other clue
 * @param {{ xLabel: string, yLabel: string }} varLabels
 * @param {boolean} swapped
 * @param {{ leftVal: number, rightVal: number, diff: number }} tiltInfo
 * @returns {{ code: string, message: string }}
 */
export function diagnoseScaleError(studentEq, targetClue, otherClue, varLabels, swapped, tiltInfo) {
  const { a, b, c } = studentEq;
  const xLabel = varLabels?.xLabel || 'x';
  const yLabel = varLabels?.yLabel || 'y';

  if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
    return {
      code: 'empty',
      message: '天平上還沒有放入未知數 x 或 y 喔！先從線索中判斷數量或單價是誰。',
    };
  }

  // 1. Reversed difference / constant put on wrong side (`x + d = y` vs `x = y + d`)
  // Checked before swapped_vars because for `x - y = d`, swapping x and y is identical to negating d.
  if (Math.abs(targetClue.c) > EPS && areLinesEquivalent({ a, b, c: -c }, targetClue)) {
    return {
      code: 'reversed_diff',
      message: '「比…多／少」或「剩／不足」加錯邊囉！想想看誰比較大，差值補在比較小的那一邊天平才會平。',
    };
  }

  // 2. Swapped variables relative to canonical target
  if (areLinesEquivalent({ a: b, b: a, c }, targetClue)) {
    return {
      code: 'swapped_vars',
      message: `x（${xLabel}）和 y（${yLabel}）的倍數好像對調了！再核對一下誰乘上哪個數字。`,
    };
  }

  // 3. Wrong operation sign between x and y (`x - y` vs `x + y`)
  if (
    (Math.abs(b) > EPS && areLinesEquivalent({ a, b: -b, c }, targetClue)) ||
    (Math.abs(a) > EPS && areLinesEquivalent({ a: -a, b, c }, targetClue))
  ) {
    return {
      code: 'wrong_op_sign',
      message: '加減符號好像相反了！再讀一次這條線索是「合起來」還是「相差／比較」。',
    };
  }

  // 4. Missing unit multiplier (used `1*x + 1*y` with the weighted clue's constant, e.g. `x + y = 34` instead of `2x + 4y = 34`)
  if (otherClue && areCoefficientsParallel(studentEq, otherClue) && !areCoefficientsParallel(targetClue, otherClue)) {
    const scaleFactor =
      Math.abs(otherClue.a) > EPS ? a / otherClue.a : b / otherClue.b;
    const scaledOtherC = roundClean(otherClue.c * scaleFactor);
    if (Math.abs(c - scaledOtherC) > 1e-3) {
      return {
        code: 'missing_unit_multiplier',
        message: '右邊的總數放對了，但左邊只放了基本個數！別忘了乘上每個單位的價錢、腳數或折數喔。',
      };
    }
  }

  // 5. Same (a, b) slope/ratio as target, only constant `c` is wrong
  if (areCoefficientsParallel(studentEq, targetClue)) {
    return {
      code: 'wrong_constant',
      message: 'x 與 y 的係數比例完全正確！再檢查一下常數（總數、差值或加減展開後的數值）有沒有算錯。',
    };
  }

  // 6. General tilt feedback
  const heavySide = tiltInfo.diff > 0 ? '左盤比較重（往下沉）' : '右盤比較重（往下沉）';
  return {
    code: 'general_tilt',
    message: `在正確答案下這座天平目前${heavySide}，代表兩邊還沒代表同一個數量喔！再檢查題目條件。`,
  };
}

/**
 * Verify a student's complete two-scale submission for a level.
 * Supports:
 * - Direct match to assigned clue order (`assignedClueOrder = [0, 1]` or `[1, 0]`)
 * - Swapped scale order (Scale 1 matches Clue B, Scale 2 matches Clue A)
 * - Mathematically independent equivalent linear combinations passing through `(u0*, u1*)`
 * - Explicit rejection & diagnostics for duplicate/dependent clues (`det === 0`)
 *
 * @param {object} level
 * @param {boolean} swapped Whether student mapped `x -> u1, y -> u0`
 * @param {{ left: {x:number,y:number,c:number}, right: {x:number,y:number,c:number} }} scale1
 * @param {{ left: {x:number,y:number,c:number}, right: {x:number,y:number,c:number} }} scale2
 * @param {[number, number]} [assignedClueOrder=[0, 1]]
 */
export function verifyLevelAttempt(level, swapped, scale1, scale2, assignedClueOrder = [0, 1]) {
  const clueA = level.clues[assignedClueOrder[0]].equation;
  const clueB = level.clues[assignedClueOrder[1]].equation;
  const { u0, u1 } = level.solution;

  // Student's true values in student (x, y) coordinates
  const trueX = swapped ? u1 : u0;
  const trueY = swapped ? u0 : u1;

  const eq1 = normalizeScale(scale1, swapped);
  const eq2 = normalizeScale(scale2, swapped);

  const tilt1 = evaluateScaleTilt(scale1, trueX, trueY);
  const tilt2 = evaluateScaleTilt(scale2, trueX, trueY);

  const eq1MatchesA = areLinesEquivalent(eq1, clueA);
  const eq1MatchesB = areLinesEquivalent(eq1, clueB);
  const eq2MatchesA = areLinesEquivalent(eq2, clueA);
  const eq2MatchesB = areLinesEquivalent(eq2, clueB);

  const systemSolve = solveSystem2x2(eq1, eq2);
  const varLabels = {
    xLabel: swapped ? level.unknowns[1].label : level.unknowns[0].label,
    yLabel: swapped ? level.unknowns[0].label : level.unknowns[1].label,
  };

  // Case A: Exact match to assigned order
  if (eq1MatchesA && eq2MatchesB) {
    return {
      passed: true,
      matchType: 'exact_assigned',
      scale1Balanced: true,
      scale2Balanced: true,
      tilt1,
      tilt2,
      eq1,
      eq2,
      feedback: '兩座天平完美平衡！你成功把兩句話都翻譯成聯立方程式了！',
    };
  }

  // Case B: Student built the two clues in swapped scale slots
  if (eq1MatchesB && eq2MatchesA) {
    return {
      passed: true,
      matchType: 'exact_swapped_clues',
      scale1Balanced: true,
      scale2Balanced: true,
      tilt1,
      tilt2,
      eq1,
      eq2,
      feedback: '太棒了！兩條線索雖然互換了天平位置，但一樣組成正確的聯立方程式！',
    };
  }

  // Case C: Duplicate / dependent clues (coincident lines passing through solution)
  if ((eq1MatchesA && eq2MatchesA) || (eq1MatchesB && eq2MatchesB) || systemSolve.status === 'coincident') {
    const bothTrue = satisfiesPoint(eq1, u0, u1) && satisfiesPoint(eq2, u0, u1);
    if (bothTrue) {
      return {
        passed: false,
        matchType: 'duplicate_clue',
        scale1Balanced: true,
        scale2Balanced: true,
        tilt1,
        tilt2,
        eq1,
        eq2,
        scale1Diag: null,
        scale2Diag: {
          code: 'duplicate_clue',
          message: '這兩座天平列的是同一條線索（重合直線），解不出唯一答案！請把其中一座改成另一條線索。',
        },
        feedback: '⚠️ 警報！兩座天平其實是同一條線索（重合直線，有無限多組解），必須運用「另一條線索」才能鎖定唯一答案！',
      };
    }
  }

  // Case D: Valid independent equivalent linear system (e.g. algebraic combination of both clues)
  if (
    systemSolve.status === 'unique' &&
    Math.abs(systemSolve.x - u0) < 1e-3 &&
    Math.abs(systemSolve.y - u1) < 1e-3
  ) {
    return {
      passed: true,
      matchType: 'equivalent_system',
      scale1Balanced: true,
      scale2Balanced: true,
      tilt1,
      tilt2,
      eq1,
      eq2,
      feedback: '厲害！你用等價的數學關係列出了兩條獨立方程式，同樣精準鎖定唯一交點！',
    };
  }

  // Otherwise diagnose each scale individually against its assigned clue
  const scale1Ok = eq1MatchesA || satisfiesPoint(eq1, u0, u1);
  const scale2Ok = eq2MatchesB || satisfiesPoint(eq2, u0, u1);

  const scale1Diag = scale1Ok
    ? null
    : diagnoseScaleError(eq1, clueA, clueB, varLabels, swapped, tilt1);
  const scale2Diag = scale2Ok
    ? null
    : diagnoseScaleError(eq2, clueB, clueA, varLabels, swapped, tilt2);

  let feedback = '再微調一下天平上的砝碼！';
  if (!scale1Ok && !scale2Ok) {
    feedback = '兩座天平目前都還沒完全吻合線索，請看看下方的偵探診斷提示！';
  } else if (!scale1Ok) {
    feedback = `天平 ② 已就位！再修正天平 ①：${scale1Diag.message}`;
  } else if (!scale2Ok) {
    feedback = `天平 ① 已平衡！再修正天平 ②：${scale2Diag.message}`;
  }

  return {
    passed: false,
    matchType: 'mismatch',
    scale1Balanced: scale1Ok,
    scale2Balanced: scale2Ok,
    tilt1,
    tilt2,
    eq1,
    eq2,
    scale1Diag,
    scale2Diag,
    feedback,
  };
}

/**
 * Format a single pan expression into structured tokens for color-coded UI rendering.
 * @param {{ x: number, y: number, c: number }} pan
 * @returns {Array<{ kind: 'x'|'y'|'c'|'op'|'zero', sign: '+'|'-', absVal: number, text: string }>}
 */
export function buildPanTokens(pan, xSym = 'x', ySym = 'y') {
  const entries = [
    { kind: 'x', val: roundClean(pan.x ?? 0), sym: xSym },
    { kind: 'y', val: roundClean(pan.y ?? 0), sym: ySym },
    { kind: 'c', val: roundClean(pan.c ?? 0), sym: '' },
  ].filter((item) => Math.abs(item.val) >= EPS);

  if (entries.length === 0) {
    return [{ kind: 'zero', sign: '+', absVal: 0, text: '0' }];
  }

  const tokens = [];
  entries.forEach((item, idx) => {
    const isNeg = item.val < 0;
    const absVal = roundClean(Math.abs(item.val));
    if (idx > 0) {
      tokens.push({ kind: 'op', sign: isNeg ? '-' : '+', absVal: 0, text: isNeg ? ' − ' : ' + ' });
    }
    const prefix = idx === 0 && isNeg ? '−' : '';
    let body = '';
    if (item.kind === 'c') {
      body = formatCoeff(absVal);
    } else {
      body = Math.abs(absVal - 1) < EPS ? item.sym : `${formatCoeff(absVal)}${item.sym}`;
    }
    tokens.push({
      kind: item.kind,
      sign: isNeg ? '-' : '+',
      absVal,
      text: `${prefix}${body}`,
    });
  });

  return tokens;
}

/**
 * Format one pan as a plain string (e.g., "50x + 70y" or "0").
 */
export function formatPanExpression(pan, xSym = 'x', ySym = 'y') {
  return buildPanTokens(pan, xSym, ySym).map((t) => t.text).join('');
}

/**
 * Format a full scale as an equation string (e.g., "50x + 70y = 460").
 */
export function formatEquation(scale, xSym = 'x', ySym = 'y') {
  return `${formatPanExpression(scale.left, xSym, ySym)} = ${formatPanExpression(scale.right, xSym, ySym)}`;
}

/**
 * Format canonical `{ a, b, c }` in standard form `ax + by = c`, honoring `swapped`.
 */
export function formatCanonicalEquation(eq, swapped = false) {
  const cx = swapped ? eq.b : eq.a;
  const cy = swapped ? eq.a : eq.b;
  return `${formatPanExpression({ x: cx, y: cy, c: 0 })} = ${formatCoeff(eq.c)}`;
}

/**
 * Compute line segment endpoints inside bounding box `[minX, maxX] x [minY, maxY]`
 * for line `a*x + b*y = c` using Liang-Barsky / parametric clipping.
 * Returns `null` if the line does not intersect the box.
 */
export function computeLineBoxSegment(a, b, c, bounds) {
  const { minX, maxX, minY, maxY } = bounds;
  if (Math.abs(a) < EPS && Math.abs(b) < EPS) return null;

  const candidates = [];
  if (Math.abs(b) > EPS) {
    const yAtMinX = (c - a * minX) / b;
    if (yAtMinX >= minY - EPS && yAtMinX <= maxY + EPS) {
      candidates.push({ x: minX, y: Math.min(maxY, Math.max(minY, yAtMinX)) });
    }
    const yAtMaxX = (c - a * maxX) / b;
    if (yAtMaxX >= minY - EPS && yAtMaxX <= maxY + EPS) {
      candidates.push({ x: maxX, y: Math.min(maxY, Math.max(minY, yAtMaxX)) });
    }
  }
  if (Math.abs(a) > EPS) {
    const xAtMinY = (c - b * minY) / a;
    if (xAtMinY >= minX - EPS && xAtMinY <= maxX + EPS) {
      candidates.push({ x: Math.min(maxX, Math.max(minX, xAtMinY)), y: minY });
    }
    const xAtMaxY = (c - b * maxY) / a;
    if (xAtMaxY >= minX - EPS && xAtMaxY <= maxX + EPS) {
      candidates.push({ x: Math.min(maxX, Math.max(minX, xAtMaxY)), y: maxY });
    }
  }

  // Deduplicate corner hits
  const unique = [];
  for (const pt of candidates) {
    if (!unique.some((u) => Math.hypot(u.x - pt.x, u.y - pt.y) < 1e-4)) {
      unique.push(pt);
    }
  }
  if (unique.length < 2) return null;
  return [unique[0], unique[1]];
}
