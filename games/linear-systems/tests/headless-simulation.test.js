import test from 'node:test';
import assert from 'node:assert/strict';

import {
  areCoefficientsParallel,
  areLinesEquivalent,
  computeLineBoxSegment,
  createEmptyScale,
  diagnoseScaleError,
  EPS,
  evaluateScaleTilt,
  formatCanonicalEquation,
  formatEquation,
  normalizeScale,
  solveSystem2x2,
  verifyLevelAttempt,
} from '../src/math/equationEngine.js';
import { generatePracticeLevel, LEVELS } from '../src/data/levels.js';

function makeRng(seed = 123456) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Helper: build a valid scale from canonical `{ a, b, c }`, optionally swapping variables,
 * scaling both sides, or moving terms to opposite pans!
 */
function buildScaleFromEq(eq, swapped, { scaleFactor = 1, moveYToRight = false, negateAll = false } = {}) {
  const s = createEmptyScale();
  const mult = scaleFactor * (negateAll ? -1 : 1);
  const cx = (swapped ? eq.b : eq.a) * mult;
  const cy = (swapped ? eq.a : eq.b) * mult;
  const cVal = eq.c * mult;

  s.left.x = cx;
  if (moveYToRight) {
    s.right.y = -cy;
  } else {
    s.left.y = cy;
  }
  s.right.c = cVal;
  return s;
}

test('Core algebraic normalization, equivalence, and 2x2 solver', () => {
  // Standard scale: 50x + 70y = 460
  const scale = { left: { x: 50, y: 70, c: 0 }, right: { x: 0, y: 0, c: 460 } };
  assert.deepEqual(normalizeScale(scale, false), { a: 50, b: 70, c: 460 });
  assert.deepEqual(normalizeScale(scale, true), { a: 70, b: 50, c: 460 });

  // Equivalent rearranged forms: x = y + 8 vs x - y = 8 vs 2y - 2x = -16
  const eqBase = { a: 1, b: -1, c: 8 };
  const eqRearranged = normalizeScale({ left: { x: 1, y: 0, c: 0 }, right: { x: 0, y: 1, c: 8 } }, false);
  const eqNegScaled = normalizeScale({ left: { x: -2, y: 2, c: 0 }, right: { x: 0, y: 0, c: -16 } }, false);
  assert.equal(areLinesEquivalent(eqBase, eqRearranged), true);
  assert.equal(areLinesEquivalent(eqBase, eqNegScaled), true);

  // Coincident vs parallel vs unique
  assert.equal(solveSystem2x2({ a: 1, b: 1, c: 8 }, { a: 50, b: 70, c: 460 }).status, 'unique');
  assert.equal(solveSystem2x2({ a: 1, b: 1, c: 8 }, { a: 2, b: 2, c: 16 }).status, 'coincident');
  assert.equal(solveSystem2x2({ a: 1, b: 1, c: 8 }, { a: 1, b: 1, c: 10 }).status, 'parallel');
  assert.equal(areCoefficientsParallel({ a: 1, b: 1, c: 8 }, { a: 1, b: 1, c: 34 }), true);
});

test('Physical tilt direction & formatting', () => {
  const s = { left: { x: 1, y: 1, c: 0 }, right: { x: 0, y: 0, c: 8 } };
  const balanced = evaluateScaleTilt(s, 5, 3);
  assert.equal(balanced.isBalanced, true);
  assert.equal(balanced.angleDeg, 0);

  // Left heavier (6+3 = 9 > 8) => Left sinks down => negative angleDeg
  const leftHeavy = evaluateScaleTilt(s, 6, 3);
  assert.equal(leftHeavy.isBalanced, false);
  assert.ok(leftHeavy.angleDeg < 0, `Expected negative angle when left is heavier, got ${leftHeavy.angleDeg}`);

  // Right heavier (4+3 = 7 < 8) => Right sinks down => positive angleDeg
  const rightHeavy = evaluateScaleTilt(s, 4, 3);
  assert.ok(rightHeavy.angleDeg > 0, `Expected positive angle when right is heavier, got ${rightHeavy.angleDeg}`);

  assert.equal(formatEquation({ left: { x: 50, y: 70, c: 0 }, right: { x: 0, y: 0, c: 460 } }), '50x + 70y = 460');
  assert.equal(formatCanonicalEquation({ a: 0.8, b: 0.9, c: 420 }, false), '0.8x + 0.9y = 420');
});

test('Targeted misconception diagnostics catch all key errors', () => {
  const target = { a: 1, b: -1, c: 8 }; // x - y = 8
  const other = { a: 1, b: 1, c: 36 };
  const labels = { xLabel: '小晴', yLabel: '小安' };

  // Empty
  assert.equal(diagnoseScaleError({ a: 0, b: 0, c: 8 }, target, other, labels, false, { diff: -8 }).code, 'empty');
  // Swapped vars: 2x + 4y = 34 vs 4x + 2y = 34
  assert.equal(
    diagnoseScaleError({ a: 4, b: 2, c: 34 }, { a: 2, b: 4, c: 34 }, { a: 1, b: 1, c: 12 }, labels, false, { diff: 2 }).code,
    'swapped_vars'
  );
  // Reversed difference: x + 8 = y => x - y = -8
  assert.equal(diagnoseScaleError({ a: 1, b: -1, c: -8 }, target, other, labels, false, { diff: 16 }).code, 'reversed_diff');
  // Wrong op sign: x + y = 8 instead of x - y = 8
  assert.equal(diagnoseScaleError({ a: 1, b: 1, c: 8 }, target, other, labels, false, { diff: 28 }).code, 'wrong_op_sign');
  // Missing unit multiplier: x + y = 34 instead of 2x + 4y = 34
  assert.equal(
    diagnoseScaleError({ a: 1, b: 1, c: 34 }, { a: 2, b: 4, c: 34 }, { a: 1, b: 1, c: 12 }, labels, false, { diff: -22 }).code,
    'missing_unit_multiplier'
  );
  // Wrong constant: x + y = 10 instead of x + y = 12
  assert.equal(
    diagnoseScaleError({ a: 1, b: 1, c: 10 }, { a: 1, b: 1, c: 12 }, { a: 2, b: 4, c: 34 }, labels, false, { diff: 2 }).code,
    'wrong_constant'
  );
});

test('Line-box clipping computes valid segment for coordinate graph', () => {
  const seg = computeLineBoxSegment(1, 1, 8, { minX: 0, maxX: 10, minY: 0, maxY: 10 });
  assert.ok(seg && seg.length === 2);
  // Both endpoints lie on x + y = 8
  for (const pt of seg) {
    assert.ok(Math.abs(pt.x + pt.y - 8) < EPS);
  }
});

test('All 12 handcrafted curriculum levels have unique exact solutions & full metadata', () => {
  assert.equal(LEVELS.length, 12);
  for (const lvl of LEVELS) {
    const eq1 = lvl.clues[0].equation;
    const eq2 = lvl.clues[1].equation;
    const sol = solveSystem2x2(eq1, eq2);
    assert.equal(sol.status, 'unique', `Level ${lvl.id} (${lvl.title}) must have unique solution`);
    assert.ok(Math.abs(sol.x - lvl.solution.u0) < EPS, `Level ${lvl.id} u0 mismatch`);
    assert.ok(Math.abs(sol.y - lvl.solution.u1) < EPS, `Level ${lvl.id} u1 mismatch`);

    assert.equal(lvl.unknowns.length, 2);
    assert.ok(lvl.unknownDistractors.length >= 2);
    assert.ok(lvl.clueDistractor && lvl.clueDistractor.reason);
    assert.equal(lvl.hints(false).length, 3);
    assert.equal(lvl.hints(true).length, 3);
    assert.equal(lvl.solvingSteps(false).length, 3);
    assert.equal(lvl.solvingSteps(true).length, 3);
  }
});

test('Headless 120-run E2E modeling simulation across 12 campaign levels + 100 procedural levels (0 deadlocks)', () => {
  const rng = makeRng(20261120);
  let totalRuns = 0;
  let deadlocks = 0;
  let validPassCount = 0;
  let duplicateCaughtCount = 0;
  let errorCaughtCount = 0;

  // Part A: 20 varied runs over the 12 handcrafted levels (including swapped x/y, rearranged forms, duplicates, errors)
  for (let i = 0; i < 20; i++) {
    const lvl = LEVELS[i % LEVELS.length];
    const swapped = i % 2 === 1;
    const clueOrder = i % 3 === 0 ? [1, 0] : [0, 1];
    const eqA = lvl.clues[clueOrder[0]].equation;
    const eqB = lvl.clues[clueOrder[1]].equation;

    // 1. Deliberate duplicate clue must be rejected with duplicate_clue
    const dupScale1 = buildScaleFromEq(eqA, swapped);
    const dupScale2 = buildScaleFromEq(eqA, swapped, { scaleFactor: 2 });
    const dupRes = verifyLevelAttempt(lvl, swapped, dupScale1, dupScale2, clueOrder);
    assert.equal(dupRes.passed, false);
    assert.equal(dupRes.matchType, 'duplicate_clue');
    duplicateCaughtCount += 1;

    // 2. Deliberate error on scale 2 (offset constant) must fail with diagnostic
    const badScale2 = buildScaleFromEq({ a: eqB.a, b: eqB.b, c: eqB.c + 5 }, swapped);
    const errRes = verifyLevelAttempt(lvl, swapped, dupScale1, badScale2, clueOrder);
    assert.equal(errRes.passed, false);
    assert.ok(errRes.scale2Diag && errRes.scale2Diag.message.length > 0);
    errorCaughtCount += 1;

    // 3. Valid rearranged/scaled solution must pass!
    const validScale1 = buildScaleFromEq(eqA, swapped, {
      scaleFactor: i % 4 === 0 ? 10 : 1,
      moveYToRight: i % 2 === 0,
    });
    const validScale2 = buildScaleFromEq(eqB, swapped, {
      negateAll: i % 5 === 0,
      moveYToRight: i % 3 === 0,
    });
    const passRes = verifyLevelAttempt(lvl, swapped, validScale1, validScale2, clueOrder);
    if (!passRes.passed) deadlocks += 1;
    assert.equal(passRes.passed, true, `Campaign level ${lvl.id} failed valid modeling`);
    validPassCount += 1;
    totalRuns += 1;
  }

  // Part B: 100 freshly generated procedural practice levels across all 5 templates
  for (let p = 0; p < 100; p++) {
    const procLvl = generatePracticeLevel(p % 5, rng);
    const sol = solveSystem2x2(procLvl.clues[0].equation, procLvl.clues[1].equation);
    assert.equal(sol.status, 'unique');
    assert.ok(Number.isInteger(sol.x) && sol.x > 0, `Practice x=${sol.x} must be positive integer`);
    assert.ok(Number.isInteger(sol.y) && sol.y > 0, `Practice y=${sol.y} must be positive integer`);
    assert.equal(sol.x, procLvl.solution.u0);
    assert.equal(sol.y, procLvl.solution.u1);

    const swapped = p % 2 === 1;
    const s1 = buildScaleFromEq(procLvl.clues[0].equation, swapped, { moveYToRight: p % 3 === 1 });
    const s2 = buildScaleFromEq(procLvl.clues[1].equation, swapped, { scaleFactor: p % 4 === 0 ? 2 : 1 });

    // Also test linear combination equivalent system (eq1 + eq2 and eq2) on every 5th run
    if (p % 5 === 0) {
      const combinedEq = {
        a: procLvl.clues[0].equation.a + procLvl.clues[1].equation.a,
        b: procLvl.clues[0].equation.b + procLvl.clues[1].equation.b,
        c: procLvl.clues[0].equation.c + procLvl.clues[1].equation.c,
      };
      const combScale = buildScaleFromEq(combinedEq, swapped);
      const combRes = verifyLevelAttempt(procLvl, swapped, combScale, s2, [0, 1]);
      assert.equal(combRes.passed, true);
      assert.equal(combRes.matchType, 'equivalent_system');
    }

    const res = verifyLevelAttempt(procLvl, swapped, s1, s2, [0, 1]);
    if (!res.passed) deadlocks += 1;
    assert.equal(res.passed, true);
    validPassCount += 1;
    totalRuns += 1;
  }

  assert.equal(totalRuns, 120);
  assert.equal(deadlocks, 0);
  assert.equal(validPassCount, 120);
  assert.equal(duplicateCaughtCount, 20);
  assert.equal(errorCaughtCount, 20);
});
