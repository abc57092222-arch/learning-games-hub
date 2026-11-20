/**
 * Pure Domain Logic for Multiplication Grid & Adventure.
 * No DOM/window dependencies - runs in Node test runner and browser.
 */

export const CAMPAIGN_LEVELS = [
  {
    id: 1,
    title: '第一關：2 與 5 的倍數探險',
    desc: '從最規律的 2 和 5 開始，觀察點陣排列！',
    targetMultiplier: [2, 5],
    count: 5,
    allowHint: true,
  },
  {
    id: 2,
    title: '第二關：3 與 4 的方格陣列',
    desc: '每組 3 個或 4 個，數數看一共多少個！',
    targetMultiplier: [3, 4],
    count: 5,
    allowHint: true,
  },
  {
    id: 3,
    title: '第三關：乘法交換律大發現',
    desc: '轉個方向看一看！橫著看與直著看，總數一樣嗎？',
    targetMultiplier: [2, 3, 4, 5],
    type: 'commutative',
    count: 5,
    allowHint: true,
  },
  {
    id: 4,
    title: '第四關：6 與 7 的高山挑戰',
    desc: '遇到難記的口訣？用相加和點陣來幫忙！',
    targetMultiplier: [6, 7],
    count: 5,
    allowHint: true,
  },
  {
    id: 5,
    title: '第五關：8 與 9 的神準射手',
    desc: '快要背完九九乘法表囉！9 的倍數數字和有神奇的秘密！',
    targetMultiplier: [8, 9],
    count: 5,
    allowHint: true,
  },
  {
    id: 6,
    title: '第六關：逆向神探（填入乘數）',
    desc: '知道答案，那中間是多少呢？如 6 × ( ) = 42',
    targetMultiplier: [2, 3, 4, 5, 6, 7, 8, 9],
    type: 'missing_operand',
    count: 5,
    allowHint: true,
  },
  {
    id: 7,
    title: '第七關：相鄰推導術（+A 或 -A）',
    desc: '若 7 × 6 = 42，那 7 × 7 就是再多一個 7 嗎？',
    targetMultiplier: [4, 6, 7, 8, 9],
    type: 'neighbor_step',
    count: 5,
    allowHint: true,
  },
  {
    id: 8,
    title: '第八關：生活情境應用題',
    desc: '一盒布丁有 4 個，買 6 盒共有幾個？',
    targetMultiplier: [2, 3, 4, 5, 6, 7, 8],
    type: 'word_problem',
    count: 5,
    allowHint: true,
  },
  {
    id: 9,
    title: '第九關：九九乘法全能大挑戰',
    desc: '全表隨機出題，考驗你的口訣直覺與速度！',
    targetMultiplier: [2, 3, 4, 5, 6, 7, 8, 9],
    type: 'mixed',
    count: 6,
    allowHint: false,
  },
  {
    id: 10,
    title: '第十關：終極乘法大宗師',
    desc: '混合未知數、文字題與速算，達成 30 星榮耀！',
    targetMultiplier: [2, 3, 4, 5, 6, 7, 8, 9],
    type: 'master',
    count: 6,
    allowHint: false,
  },
];

/**
 * Story scenarios for word problems
 */
export const WORD_SCENARIOS = [
  { item: '盒蘋果', unit: '顆', prefix: '每盒裝有', suffix: '顆蘋果，買了' },
  { item: '包色鉛筆', unit: '枝', prefix: '每包含有', suffix: '枝色鉛筆，老師發給' },
  { item: '排座位', unit: '張椅子', prefix: '教室每排有', suffix: '張椅子，共排了' },
  { item: '籠小籠包', unit: '個', prefix: '一籠裝有', suffix: '個小籠包，餐桌上有' },
  { item: '束花朵', unit: '朵', prefix: '每束花插有', suffix: '朵向日葵，花店包裝了' },
  { item: '袋餅乾', unit: '片', prefix: '每袋有', suffix: '片手工餅乾，小明分到' },
];

/**
 * Diagnoses common student errors
 */
export function diagnoseError(question, userAnswer) {
  const ans = Number(userAnswer);
  if (Number.isNaN(ans)) {
    return { type: 'invalid', message: '請輸入有效的阿拉伯數字喔！' };
  }

  const { a, b, expected, type } = question;

  // 1. 相加混淆 (誤乘為加，如 6 x 3 = 9)
  if (ans === a + b && type !== 'missing_operand') {
    return {
      type: 'added_instead',
      message: `你把 ${a} 和 ${b} 相加得到 ${ans} 了！乘法是「${b} 個 ${a} 連加」喔！`,
    };
  }

  // 2. 逆向填空時誤答為積
  if (type === 'missing_operand' && ans === a * b) {
    return {
      type: 'answered_product',
      message: `這是問要乘上多少喔！${a} × ( ${b} ) = ${expected}，空格應該填 ${b}！`,
    };
  }

  // 3. 鄰近口訣漂移 (差一個 a：例如 7x8=56，誤答 49 或 63)
  if (type !== 'missing_operand') {
    if (ans === a * (b - 1)) {
      return {
        type: 'drift_minus_one',
        message: `這是 ${a} × ${b - 1} 的答案！乘上 ${b} 要再加一次 ${a}，答案是 ${expected}。`,
      };
    }
    if (ans === a * (b + 1)) {
      return {
        type: 'drift_plus_one',
        message: `這是 ${a} × ${b + 1} 的答案！多加了一個 ${a} 囉，答案是 ${expected}。`,
      };
    }
  }

  // 4. 口訣顛倒字音相似或相近段落混淆 (常見如 6x9=54 混淆 7x8=56)
  if (ans === 54 && expected === 56) {
    return {
      type: 'clash_54_56',
      message: '容易混淆喔！七八是「五十六」，六九才是「五十四」！',
    };
  }
  if (ans === 56 && expected === 54) {
    return {
      type: 'clash_54_56',
      message: '注意口訣喔！六九是「五十四」，七八才是「五十六」！',
    };
  }

  // 一般提醒
  return {
    type: 'generic_error',
    message: `正確答案是 ${expected}。可以利用點陣圖或連加推導看看喔！`,
  };
}

/**
 * Generate a single question tailored to level specification or random seed
 */
export function generateQuestion(levelSpec, seedIndex = 0) {
  const multipliers = levelSpec.targetMultiplier || [2, 3, 4, 5, 6, 7, 8, 9];
  const a = multipliers[seedIndex % multipliers.length];
  // b goes from 2 to 9
  const b = ((seedIndex * 3 + 2) % 8) + 2;
  const product = a * b;
  const qType = levelSpec.type || 'standard';

  if (qType === 'commutative') {
    return {
      type: 'commutative',
      a,
      b,
      expected: product,
      prompt: `觀察點陣：${a} × ${b} 與 ${b} × ${a} 的結果都一樣是？`,
      altPrompt: `${a} × ${b} = ${product}，那麼 ${b} × ${a} = ( ? )`,
      hint: `${a} 個一組有 ${b} 組，轉個方向變成 ${b} 個一組有 ${a} 組，總數相同！`,
    };
  }

  if (qType === 'missing_operand') {
    // a * (?) = product
    return {
      type: 'missing_operand',
      a,
      b,
      expected: b,
      prompt: `${a} × ( ? ) = ${product}`,
      hint: `想一想：幾個 ${a} 加起來會是 ${product}？`,
    };
  }

  if (qType === 'neighbor_step') {
    const prevB = b > 2 ? b - 1 : b + 1;
    const prevProd = a * prevB;
    const diff = b > prevB ? `+ ${a}` : `- ${a}`;
    return {
      type: 'neighbor_step',
      a,
      b,
      expected: product,
      prompt: `已知 ${a} × ${prevB} = ${prevProd}，請問 ${a} × ${b} = ( ? )`,
      hint: `${a} 的乘法每多 1 份就多 ${a}，也就是 ${prevProd} ${diff} = ${product}。`,
    };
  }

  if (qType === 'word_problem') {
    const scenario = WORD_SCENARIOS[seedIndex % WORD_SCENARIOS.length];
    return {
      type: 'word_problem',
      a,
      b,
      expected: product,
      prompt: `${scenario.prefix} ${a} ${scenario.unit}，買了 ${b} 個，一共有多少 ${scenario.unit}？`,
      hint: `列式為：${a} × ${b} = ${product}`,
    };
  }

  if (qType === 'mixed' || qType === 'master') {
    // Cycle between standard, missing_operand, neighbor_step and word_problem
    const subTypes = ['standard', 'missing_operand', 'neighbor_step', 'word_problem'];
    const chosen = subTypes[seedIndex % subTypes.length];
    return generateQuestion({ ...levelSpec, type: chosen }, seedIndex + 1);
  }

  // Standard direct multiplication
  return {
    type: 'standard',
    a,
    b,
    expected: product,
    prompt: `${a} × ${b} = ( ? )`,
    hint: `可以想成 ${b} 個 ${a} 連加：` + Array(b).fill(a).join(' + ') + ` = ${product}`,
  };
}

/**
 * Generate full question set for a given campaign level
 */
export function generateLevelQuestions(levelSpec) {
  const count = levelSpec.count || 5;
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(levelSpec, i));
  }
  return questions;
}

/**
 * Calculate stars earned based on mistakes
 */
export function calculateStars(totalQuestions, mistakes) {
  if (totalQuestions <= 0) return 0;
  if (mistakes === 0) return 3;
  if (mistakes <= Math.ceil(totalQuestions / 3)) return 2;
  return 1;
}

/**
 * Full 9x9 table generation helper for sandbox
 */
export function getMultiplicationTable() {
  const table = [];
  for (let r = 1; r <= 9; r++) {
    const row = [];
    for (let c = 1; c <= 9; c++) {
      row.push({ a: r, b: c, product: r * c });
    }
    table.push(row);
  }
  return table;
}
