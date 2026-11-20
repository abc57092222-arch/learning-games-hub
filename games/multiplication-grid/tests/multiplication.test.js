import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMPAIGN_LEVELS,
  diagnoseError,
  generateQuestion,
  generateLevelQuestions,
  calculateStars,
  getMultiplicationTable,
} from '../src/multiplicationCore.js';

describe('九九乘法核心領域邏輯測試 (Multiplication Core)', () => {
  it('9x9 乘法大表維度與乘積全部正確', () => {
    const table = getMultiplicationTable();
    assert.equal(table.length, 9);
    for (let r = 0; r < 9; r++) {
      assert.equal(table[r].length, 9);
      for (let c = 0; c < 9; c++) {
        const item = table[r][c];
        assert.equal(item.a, r + 1);
        assert.equal(item.b, c + 1);
        assert.equal(item.product, (r + 1) * (c + 1));
      }
    }
  });

  it('10 個戰役關卡配置齊全且符合題目數量規範', () => {
    assert.equal(CAMPAIGN_LEVELS.length, 10);
    CAMPAIGN_LEVELS.forEach((lvl) => {
      assert.ok(lvl.id >= 1 && lvl.id <= 10);
      assert.ok(lvl.title.length > 0);
      const qs = generateLevelQuestions(lvl);
      assert.equal(qs.length, lvl.count);
      qs.forEach((q) => {
        assert.ok(q.expected > 0);
        assert.ok(q.prompt.length > 0);
      });
    });
  });

  it('迷思診斷回饋引擎精確捕捉四大常見認知偏誤', () => {
    // 1. 誤乘為加
    const q1 = { a: 6, b: 3, expected: 18, type: 'standard' };
    const diagAdd = diagnoseError(q1, 9);
    assert.equal(diagAdd.type, 'added_instead');
    assert.ok(diagAdd.message.includes('相加'));

    // 2. 逆向填空誤填乘積
    const q2 = { a: 7, b: 6, expected: 6, type: 'missing_operand' };
    const diagProd = diagnoseError(q2, 42);
    assert.equal(diagProd.type, 'answered_product');

    // 3. 鄰近口訣漂移 (少一次 a)
    const q3 = { a: 7, b: 8, expected: 56, type: 'standard' };
    const diagDriftMinus = diagnoseError(q3, 49);
    assert.equal(diagDriftMinus.type, 'drift_minus_one');

    // 4. 六九與七八口訣混淆 (54 vs 56)
    const diag54 = diagnoseError(q3, 54);
    assert.equal(diag54.type, 'clash_54_56');

    // 5. 非法輸入
    const diagNan = diagnoseError(q1, 'abc');
    assert.equal(diagNan.type, 'invalid');
  });

  it('星數結算邏輯正確評定 3 星、2 星與 1 星', () => {
    assert.equal(calculateStars(5, 0), 3);
    assert.equal(calculateStars(5, 1), 2);
    assert.equal(calculateStars(5, 2), 2);
    assert.equal(calculateStars(5, 3), 1);
    assert.equal(calculateStars(0, 0), 0);
  });

  it('無頭 120 局隨機題目生成與可解性自動化模擬（0 死鎖、0 異常）', () => {
    let simulationCount = 0;
    let deadlocks = 0;

    // 遍歷所有關卡及 procedural 種子
    for (const lvl of CAMPAIGN_LEVELS) {
      for (let seed = 0; seed < 12; seed++) {
        simulationCount++;
        const q = generateQuestion(lvl, seed);

        // 驗證關鍵指標
        if (!q.expected || q.expected <= 0 || !q.prompt) {
          deadlocks++;
        }
        if (q.type === 'missing_operand') {
          if (q.a * q.expected !== q.a * q.b) deadlocks++;
        } else {
          if (q.expected !== q.a * q.b) deadlocks++;
        }

        // 模擬學生正確作答與診斷
        const correctCheck = diagnoseError(q, q.expected);
        assert.ok(correctCheck);
      }
    }

    assert.equal(deadlocks, 0, '死鎖計數必須為 0');
    assert.ok(simulationCount >= 120, '模擬局數必須大於等於 120');
  });
});
