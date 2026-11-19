import { formatCanonicalEquation, formatCoeff } from '../math/equationEngine.js';

export const WORLDS = [
  { id: 1, name: '夜市小老闆', subtitle: '數量與總價的雙重謎題', color: '#3b82f6' },
  { id: 2, name: '關係偵探社', subtitle: '誰比誰多？倍數與年齡轉換', color: '#8b5cf6' },
  { id: 3, name: '校園生活趣', subtitle: '帳篷分配、給來給去與船速', color: '#10b981' },
  { id: 4, name: '會考魔王殿', subtitle: '十位個位數、打折與綜合挑戰', color: '#f59e0b' },
];

/**
 * Helper to get student-facing variable metadata honoring `swapped`.
 */
export function getVarMeta(level, swapped = false) {
  const u0 = level.unknowns[0];
  const u1 = level.unknowns[1];
  return {
    x: swapped ? u1 : u0,
    y: swapped ? u0 : u1,
    xVal: swapped ? level.solution.u1 : level.solution.u0,
    yVal: swapped ? level.solution.u0 : level.solution.u1,
  };
}

/**
 * Build standard 3-step solution explanation dynamically respecting `swapped`.
 */
function buildStandardSolvingSteps(level, swapped) {
  const vm = getVarMeta(level, swapped);
  const c1 = level.clues[0].equation;
  const c2 = level.clues[1].equation;
  const eq1Str = formatCanonicalEquation(c1, swapped);
  const eq2Str = formatCanonicalEquation(c2, swapped);
  return [
    `列出聯立方程式：① ${eq1Str}，② ${eq2Str}`,
    `觀察 x（${vm.x.label}）與 y（${vm.y.label}）的係數，利用加減消去法或代入消去法消去其中一個未知數。`,
    `求得唯一交點：x = ${formatCoeff(vm.xVal)} ${vm.x.unit}，y = ${formatCoeff(vm.yVal)} ${vm.y.unit}，代回兩句話皆完全吻合！`,
  ];
}

export const LEVELS = [
  // ==================== WORLD 1: 夜市小老闆 ====================
  {
    id: 1,
    worldId: 1,
    title: '珍奶與雞排',
    badge: '夜市入門',
    storySegments: [
      { text: '小宇在夜市買了', kind: 'plain' },
      { text: '珍珠奶茶與香酥雞排共 8 份', kind: 'clue', clueIndex: 0 },
      { text: '，', kind: 'plain' },
      { text: '珍奶每杯 50 元、雞排每份 70 元，總共付了 460 元', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問珍奶買了幾杯？雞排買了幾份？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '珍奶杯數', unit: '杯', icon: '🧋', chipText: '珍奶買了幾杯' },
      { id: 'u1', label: '雞排份數', unit: '份', icon: '🍗', chipText: '雞排買了幾份' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '總共付了 460 元', reason: '460 元是題目已經給的已知總金額，不需要設成未知數喔！' },
      { id: 'd1', chipText: '一共買了 8 份', reason: '8 份是兩樣餐點的已知總數量，不能當成未知數喔！' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '總數量線索',
        text: '珍珠奶茶與香酥雞排共 8 份',
        equation: { a: 1, b: 1, c: 8 },
      },
      {
        id: 'c1',
        tag: '總金額線索',
        text: '珍奶每杯 50 元、雞排每份 70 元，總共付了 460 元',
        equation: { a: 50, b: 70, c: 460 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問珍奶買了幾杯？雞排買了幾份？',
      reason: '這是題目的「問題」，裡面沒有給出等量關係，不能用來列天平喔！',
    },
    numberChips: [
      { value: 8, label: '8', note: '共 8 份' },
      { value: 50, label: '50', note: '珍奶單價' },
      { value: 70, label: '70', note: '雞排單價' },
      { value: 460, label: '460', note: '總金額' },
    ],
    solution: { u0: 5, u1: 3 },
    barDiagramHint: { type: 'sum', total: 8, desc: '總份數由「珍奶」與「雞排」拼在一起！' },
    hints: (swapped) => {
      const vm = getVarMeta(LEVELS[0], swapped);
      return [
        `先看第一句話：買的「${vm.x.label} (${vm.x.icon})」和「${vm.y.label} (${vm.y.icon})」合起來剛好等於 8 份！`,
        `第二句話算總金額：每${vm.x.unit}${vm.x.label} ${swapped ? 70 : 50} 元，每${vm.y.unit}${vm.y.label} ${swapped ? 50 : 70} 元，左盤放價錢總和，右盤放 460！`,
        `完整答案參考：天平 ① 放 ${formatCanonicalEquation({ a: 1, b: 1, c: 8 }, swapped)}；天平 ② 放 ${formatCanonicalEquation({ a: 50, b: 70, c: 460 }, swapped)}。`,
      ];
    },
    solvingSteps: (swapped) => {
      const vm = getVarMeta(LEVELS[0], swapped);
      return [
        `① ${formatCanonicalEquation({ a: 1, b: 1, c: 8 }, swapped)}，② ${formatCanonicalEquation({ a: 50, b: 70, c: 460 }, swapped)}`,
        `把 ① 式全部乘以 50 得到 50x + 50y = 400，再用 ② 式減掉它消去其中一個未知數！`,
        `算出 ${vm.x.label} = ${vm.xVal} ${vm.x.unit}、${vm.y.label} = ${vm.yVal} ${vm.y.unit}（5×50 + 3×70 = 460 元）。`,
      ];
    },
  },
  {
    id: 2,
    worldId: 1,
    title: '遊樂園門票',
    badge: '單價反推',
    storySegments: [
      { text: '週末大家一起去遊樂園：', kind: 'plain' },
      { text: '買 2 張成人票和 3 張兒童票共花了 950 元', kind: 'clue', clueIndex: 0 },
      { text: '；另一個家庭', kind: 'plain' },
      { text: '買 4 張成人票和 1 張兒童票共花了 1150 元', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問成人票一張多少元？兒童票一張多少元？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '成人票單價', unit: '元', icon: '🎟️', chipText: '成人票一張多少元' },
      { id: 'u1', label: '兒童票單價', unit: '元', icon: '🎫', chipText: '兒童票一張多少元' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '買 2 張成人票', reason: '2 張成人票是已知的張數，未知的是「每一張票多少元」喔！' },
      { id: 'd1', chipText: '共花了 950 元', reason: '950 元是題目給的已知總價，不能設成未知數！' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '第一組購票',
        text: '買 2 張成人票和 3 張兒童票共花了 950 元',
        equation: { a: 2, b: 3, c: 950 },
      },
      {
        id: 'c1',
        tag: '第二組購票',
        text: '買 4 張成人票和 1 張兒童票共花了 1150 元',
        equation: { a: 4, b: 1, c: 1150 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問成人票一張多少元？兒童票一張多少元？',
      reason: '問句只是告訴我們要設什麼未知數，不是方程式的等量線索。',
    },
    numberChips: [
      { value: 2, label: '2', note: '2 張' },
      { value: 3, label: '3', note: '3 張' },
      { value: 950, label: '950', note: '第一組花費' },
      { value: 4, label: '4', note: '4 張' },
      { value: 1150, label: '1150', note: '第二組花費' },
    ],
    solution: { u0: 250, u1: 150 },
    hints: (swapped) => {
      const xRole = swapped ? '兒童票' : '成人票';
      const yRole = swapped ? '成人票' : '兒童票';
      return [
        `注意看這題未知數是「單價」：x 代表 1 張${xRole}的錢，y 代表 1 張${yRole}的錢。`,
        `第一組：${swapped ? '3x + 2y = 950' : '2x + 3y = 950'}；第二組把張數乘以單價後放左盤，總價放右盤。`,
        `完整答案參考：天平 ① 放 ${formatCanonicalEquation({ a: 2, b: 3, c: 950 }, swapped)}；天平 ② 放 ${formatCanonicalEquation({ a: 4, b: 1, c: 1150 }, swapped)}。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[1], swapped),
  },
  {
    id: 3,
    worldId: 1,
    title: '農場雞兔同籠',
    badge: '隱藏常識',
    storySegments: [
      { text: '開心農場裡養了一群雞與兔子，', kind: 'plain' },
      { text: '數一數總共有 12 顆頭', kind: 'clue', clueIndex: 0 },
      { text: '，', kind: 'plain' },
      { text: '牠們在地上加起來總共有 34 隻腳', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問農場裡雞和兔子各有幾隻？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '雞的隻數', unit: '隻', icon: '🐔', chipText: '雞有幾隻' },
      { id: 'u1', label: '兔子的隻數', unit: '隻', icon: '🐰', chipText: '兔子有幾隻' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '雞有幾隻腳', reason: '1 隻雞固定有 2 隻腳，這是生活常識不是未知數，題目問的是「隻數」！' },
      { id: 'd1', chipText: '總共有 34 隻腳', reason: '34 隻腳是已知總數喔！' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '總頭數線索',
        text: '數一數總共有 12 顆頭',
        equation: { a: 1, b: 1, c: 12 },
      },
      {
        id: 'c1',
        tag: '總腳數線索',
        text: '牠們在地上加起來總共有 34 隻腳',
        equation: { a: 2, b: 4, c: 34 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問農場裡雞和兔子各有幾隻？',
      reason: '這是最後的提問句，先留著它幫我們設 x 和 y，不要放進兩條線索框！',
    },
    numberChips: [
      { value: 12, label: '12', note: '總頭數' },
      { value: 34, label: '34', note: '總腳數' },
      { value: 2, label: '2', note: '生活常識：雞 2 隻腳' },
      { value: 4, label: '4', note: '生活常識：兔 4 隻腳' },
    ],
    solution: { u0: 7, u1: 5 },
    hints: (swapped) => {
      const chickenSym = swapped ? 'y' : 'x';
      const rabbitSym = swapped ? 'x' : 'y';
      return [
        `每隻雞與兔子都只有 1 顆頭，所以 12 顆頭代表牠們的總隻數相加等於 12。`,
        `隱藏常識來了！1 隻雞有 2 隻腳，1 隻兔有 4 隻腳，所以總腳數是 2${chickenSym} + 4${rabbitSym} = 34。`,
        `完整答案參考：天平 ① 放 ${formatCanonicalEquation({ a: 1, b: 1, c: 12 }, swapped)}；天平 ② 放 ${formatCanonicalEquation({ a: 2, b: 4, c: 34 }, swapped)}。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[2], swapped),
  },

  // ==================== WORLD 2: 關係偵探社 ====================
  {
    id: 4,
    worldId: 2,
    title: '限量貼紙收藏',
    badge: '和差關係',
    storySegments: [
      { text: '小晴和小安一起收集限量閃亮貼紙，', kind: 'plain' },
      { text: '兩人合起來總共有 36 張貼紙', kind: 'clue', clueIndex: 0 },
      { text: '，而且', kind: 'plain' },
      { text: '小晴比小安多 8 張', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問小晴和小安各自有多少張貼紙？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '小晴貼紙數', unit: '張', icon: '⭐', chipText: '小晴有幾張貼紙' },
      { id: 'u1', label: '小安貼紙數', unit: '張', icon: '💎', chipText: '小安有幾張貼紙' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '總共有 36 張', reason: '36 是兩人的已知總數喔！' },
      { id: 'd1', chipText: '相差 8 張', reason: '8 是兩人數量的已知差距，不需要設為未知數。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '總和線索',
        text: '兩人合起來總共有 36 張貼紙',
        equation: { a: 1, b: 1, c: 36 },
      },
      {
        id: 'c1',
        tag: '誰比誰多線索',
        text: '小晴比小安多 8 張',
        equation: { a: 1, b: -1, c: 8 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問小晴和小安各自有多少張貼紙？',
      reason: '這是問句！用來決定 x、y 的代表對象即可。',
    },
    numberChips: [
      { value: 36, label: '36', note: '總張數' },
      { value: 8, label: '8', note: '小晴多 8 張' },
    ],
    solution: { u0: 22, u1: 14 },
    barDiagramHint: { type: 'sum_diff', diff: 8, desc: '小晴比較長，小安要多加 8 才會和小晴一樣長喔！' },
    hints: (swapped) => {
      const qingSym = swapped ? 'y' : 'x';
      const anSym = swapped ? 'x' : 'y';
      return [
        `「誰比誰多」可以想成天平平衡：小晴 (${qingSym}) 比較重，要讓小安 (${anSym}) 跟小晴一樣重，8 要加在小安那一盤！`,
        `也就是說「${qingSym} = ${anSym} + 8」，或者用相減寫成「${qingSym} − ${anSym} = 8」都可以平衡！`,
        `完整答案參考：天平 ① 放 ${formatCanonicalEquation({ a: 1, b: 1, c: 36 }, swapped)}；天平 ② 放 ${qingSym} = ${anSym} + 8。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[3], swapped),
  },
  {
    id: 5,
    worldId: 2,
    title: '神奇扭蛋機',
    badge: '倍數少多少',
    storySegments: [
      { text: '玩具店有藍、紅兩台扭蛋機，', kind: 'plain' },
      { text: '兩台裡面總共裝了 52 顆扭蛋', kind: 'clue', clueIndex: 0 },
      { text: '；老闆補充說：', kind: 'plain' },
      { text: '藍色機的扭蛋數比紅色機的 3 倍還少 4 顆', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問藍色機和紅色機原來各有幾顆扭蛋？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '藍色機扭蛋數', unit: '顆', icon: '🔵', chipText: '藍色機有幾顆' },
      { id: 'u1', label: '紅色機扭蛋數', unit: '顆', icon: '🔴', chipText: '紅色機有幾顆' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '總共 52 顆', reason: '52 是兩台總和的已知數字。' },
      { id: 'd1', chipText: '3 倍少 4 顆', reason: '這是兩台之間的數量關係，不是未知數名稱喔！' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '總和線索',
        text: '兩台裡面總共裝了 52 顆扭蛋',
        equation: { a: 1, b: 1, c: 52 },
      },
      {
        id: 'c1',
        tag: '倍數加減線索',
        text: '藍色機的扭蛋數比紅色機的 3 倍還少 4 顆',
        equation: { a: 1, b: -3, c: -4 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問藍色機和紅色機原來各有幾顆扭蛋？',
      reason: '問句不含等號條件，不可放進線索盤喔！',
    },
    numberChips: [
      { value: 52, label: '52', note: '總顆數' },
      { value: 3, label: '3', note: '紅色機的 3 倍' },
      { value: 4, label: '4', note: '少 4 顆' },
    ],
    solution: { u0: 38, u1: 14 },
    barDiagramHint: { type: 'ratio', mult: 3, offset: -4, desc: '「比紅色的 3 倍少 4」就是：藍色 = 3×紅色 − 4（或 藍色 + 4 = 3×紅色）！' },
    hints: (swapped) => {
      const bSym = swapped ? 'y' : 'x';
      const rSym = swapped ? 'x' : 'y';
      return [
        `照著中文順序翻譯「是 / 比」：藍色機 (${bSym})「等於」紅色機 (${rSym}) 的 3 倍再減 4！`,
        `試著在天平 ② 左盤放 1 個 ${bSym}，右盤放 3 個 ${rSym} 和「−4」（或者左盤放 ${bSym} + 4，右盤放 3${rSym}）！`,
        `完整答案參考：天平 ① 放 ${bSym} + ${rSym} = 52；天平 ② 放 ${bSym} = 3${rSym} − 4。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[4], swapped),
  },
  {
    id: 6,
    worldId: 2,
    title: '穿越時光機',
    badge: '年齡同步長大',
    storySegments: [
      { text: '關於爸爸和兒子今年的年齡：', kind: 'plain' },
      { text: '今年父子兩人的年齡和是 50 歲', kind: 'clue', clueIndex: 0 },
      { text: '，', kind: 'plain' },
      { text: '5 年後，爸爸的年齡剛好會是兒子年齡的 2 倍', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問今年爸爸和兒子各幾歲？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '爸爸今年歲數', unit: '歲', icon: '👨', chipText: '爸爸今年幾歲' },
      { id: 'u1', label: '兒子今年歲數', unit: '歲', icon: '👦', chipText: '兒子今年幾歲' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '5 年後爸爸的年齡', reason: '設「今年幾歲」列式最單純！5 年後只要把今年歲數 +5 就好。' },
      { id: 'd1', chipText: '年齡和是 50 歲', reason: '50 歲是已知的總和數值喔。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '今年年齡和',
        text: '今年父子兩人的年齡和是 50 歲',
        equation: { a: 1, b: 1, c: 50 },
      },
      {
        id: 'c1',
        tag: '5 年後的倍數',
        text: '5 年後，爸爸的年齡剛好會是兒子年齡的 2 倍',
        equation: { a: 1, b: -2, c: 5 },
        expansionHint: '小提示：兩人都要加 5 歲喔！5年後：爸爸 + 5 = 2 × (兒子 + 5) = 2×兒子 + 10',
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問今年爸爸和兒子各幾歲？',
      reason: '這是題目的提問，不代表方程式條件。',
    },
    numberChips: [
      { value: 50, label: '50', note: '今年年齡和' },
      { value: 5, label: '5', note: '5 年後 (+5)' },
      { value: 2, label: '2', note: '2 倍' },
      { value: 10, label: '10', note: '展開：2×5 = 10' },
    ],
    solution: { u0: 35, u1: 15 },
    hints: (swapped) => {
      const dSym = swapped ? 'y' : 'x';
      const sSym = swapped ? 'x' : 'y';
      return [
        `陷阱注意！5 年後爸爸是 (${dSym} + 5) 歲，兒子「也會長大 5 歲」變成 (${sSym} + 5) 歲喔！`,
        `把 2 倍分配進去：左盤放「${dSym} + 5」，右盤放「2${sSym} + 10」（2×5=10），天平就會乖乖平衡！`,
        `完整答案參考：天平 ① 放 ${dSym} + ${sSym} = 50；天平 ② 放 ${dSym} + 5 = 2${sSym} + 10（即 ${dSym} − 2${sSym} = 5）。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[5], swapped),
  },

  // ==================== WORLD 3: 校園生活趣 ====================
  {
    id: 7,
    worldId: 3,
    title: '童軍露營帳篷',
    badge: '盈虧分配',
    storySegments: [
      { text: '童軍社舉辦露營活動分配帳篷：', kind: 'plain' },
      { text: '如果每頂帳篷住 4 人，會多出 6 個學生沒位置住', kind: 'clue', clueIndex: 0 },
      { text: '；', kind: 'plain' },
      { text: '如果改為每頂帳篷住 6 人，最後會空出 4 個床位', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問共有多少學生？幾頂帳篷？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '學生總人數', unit: '人', icon: '🎒', chipText: '共有幾位學生' },
      { id: 'u1', label: '帳篷總頂數', unit: '頂', icon: '⛺', chipText: '共有幾頂帳篷' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '多出 6 個學生', reason: '6 人是已知的剩餘人數，不是未知數喔。' },
      { id: 'd1', chipText: '每頂住 4 人', reason: '4 人是題目設定的分配規則（係數），不是未知數。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '第一種住法',
        text: '如果每頂帳篷住 4 人，會多出 6 個學生沒位置住',
        equation: { a: 1, b: -4, c: 6 },
      },
      {
        id: 'c1',
        tag: '第二種住法',
        text: '如果改為每頂帳篷住 6 人，最後會空出 4 個床位',
        equation: { a: 1, b: -6, c: -4 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問共有多少學生？幾頂帳篷？',
      reason: '問句用來設定 x、y 即可！',
    },
    numberChips: [
      { value: 4, label: '4', note: '每頂 4 人 / 空 4 位' },
      { value: 6, label: '6', note: '多 6 人 / 每頂 6 人' },
    ],
    solution: { u0: 26, u1: 5 },
    hints: (swapped) => {
      const stuSym = swapped ? 'y' : 'x';
      const tentSym = swapped ? 'x' : 'y';
      return [
        `不管怎麼分配，兩條線索都是在計算「學生總人數 (${stuSym})」怎麼等於帳篷裡的床位加加減減！`,
        `住 4 人多 6 個學生：學生總數 = 4×帳篷 + 6；住 6 人空 4 個床位：學生總數 = 6×帳篷 − 4。`,
        `完整答案參考：天平 ① 放 ${stuSym} = 4${tentSym} + 6；天平 ② 放 ${stuSym} = 6${tentSym} − 4。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[6], swapped),
  },
  {
    id: 8,
    worldId: 3,
    title: '分享巧克力',
    badge: '雙向轉移',
    storySegments: [
      { text: '哥哥和弟弟各有一盒巧克力：', kind: 'plain' },
      { text: '哥哥原本比弟弟多 10 顆巧克力', kind: 'clue', clueIndex: 0 },
      { text: '；', kind: 'plain' },
      { text: '如果弟弟給哥哥 3 顆後，哥哥的數量就會是弟弟剩下的 3 倍', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問哥哥和弟弟原本各有幾顆巧克力？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '哥哥原本顆數', unit: '顆', icon: '🍫', chipText: '哥哥原本有幾顆' },
      { id: 'u1', label: '弟弟原本顆數', unit: '顆', icon: '🍬', chipText: '弟弟原本有幾顆' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '弟弟給哥哥 3 顆', reason: '3 顆是轉移的已知數量！' },
      { id: 'd1', chipText: '變成 3 倍', reason: '3 倍是關係倍率，未知的是兩人「原本的顆數」。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '原本差距',
        text: '哥哥原本比弟弟多 10 顆巧克力',
        equation: { a: 1, b: -1, c: 10 },
      },
      {
        id: 'c1',
        tag: '給出後倍數',
        text: '如果弟弟給哥哥 3 顆後，哥哥的數量就會是弟弟剩下的 3 倍',
        equation: { a: 1, b: -3, c: -12 },
        expansionHint: '小提示：給出後，哥哥變 (哥 + 3)、弟弟變 (弟 − 3)！右邊展開：3×(弟 − 3) = 3×弟 − 9',
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問哥哥和弟弟原本各有幾顆巧克力？',
      reason: '問句不是列式條件喔！',
    },
    numberChips: [
      { value: 10, label: '10', note: '原本多 10 顆' },
      { value: 3, label: '3', note: '給 3 顆 / 3 倍' },
      { value: 9, label: '9', note: '展開：3×3 = 9' },
    ],
    solution: { u0: 21, u1: 11 },
    hints: (swapped) => {
      const broSym = swapped ? 'y' : 'x';
      const lilSym = swapped ? 'x' : 'y';
      return [
        `「給來給去」記得雙向加減！弟弟給哥哥 3 顆後：哥哥變成 (${broSym} + 3)，弟弟變成 (${lilSym} − 3)。`,
        `哥哥是弟弟剩下的 3 倍 → 天平 ② 左盤放「${broSym} + 3」，右盤放 3×(${lilSym} − 3) 展開後的「3${lilSym} − 9」！`,
        `完整答案參考：天平 ① 放 ${broSym} = ${lilSym} + 10；天平 ② 放 ${broSym} + 3 = 3${lilSym} − 9。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[7], swapped),
  },
  {
    id: 9,
    worldId: 3,
    title: '河流觀光渡輪',
    badge: '順流與逆流',
    storySegments: [
      { text: '觀光渡輪在相距 36 公里的上下游碼頭往返：', kind: 'plain' },
      { text: '順流行駛 2 小時可以跑完全程 36 公里', kind: 'clue', clueIndex: 0 },
      { text: '；', kind: 'plain' },
      { text: '回程逆流行駛需要 3 小時才跑完 36 公里', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問渡輪在靜水中的船速與水流速率各是多少 km/h？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '靜水船速', unit: 'km/h', icon: '⛴️', chipText: '靜水中的船速' },
      { id: 'u1', label: '水流速率', unit: 'km/h', icon: '🌊', chipText: '河水的流速' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '碼頭相距 36 公里', reason: '36 公里是已知距離，不要設成未知數！' },
      { id: 'd1', chipText: '順流 2 小時', reason: '2 小時是已知的時間。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '順流行駛',
        text: '順流行駛 2 小時可以跑完全程 36 公里',
        equation: { a: 2, b: 2, c: 36 },
        expansionHint: '距離 = 速率 × 時間！順流速率 = (船速 + 水速)，乘上 2 小時 = 2×船速 + 2×水速',
      },
      {
        id: 'c1',
        tag: '逆流行駛',
        text: '回程逆流行駛需要 3 小時才跑完 36 公里',
        equation: { a: 3, b: -3, c: 36 },
        expansionHint: '逆流速率 = (船速 − 水速)，乘上 3 小時 = 3×船速 − 3×水速',
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問渡輪在靜水中的船速與水流速率各是多少 km/h？',
      reason: '這是最後問句，用於定義未知數。',
    },
    numberChips: [
      { value: 36, label: '36', note: '距離 36 km' },
      { value: 2, label: '2', note: '順流 2 小時' },
      { value: 3, label: '3', note: '逆流 3 小時' },
    ],
    solution: { u0: 15, u1: 3 },
    hints: (swapped) => {
      const boatSym = swapped ? 'y' : 'x';
      const waterSym = swapped ? 'x' : 'y';
      return [
        `公式：距離 = 速率 × 時間！順流有水推著走，速度是「${boatSym} + ${waterSym}」；逆流會被水擋住，速度是「${boatSym} − ${waterSym}」。`,
        `兩邊展開後：順流 2 小時是「2${boatSym} + 2${waterSym} = 36」；逆流 3 小時是「3${boatSym} − 3${waterSym} = 36」（也可直接約分寫成 ${boatSym}+${waterSym}=18、${boatSym}−${waterSym}=12 喔！）。`,
        `完整答案參考：天平 ① 放 2${boatSym} + 2${waterSym} = 36；天平 ② 放 3${boatSym} − 3${waterSym} = 36。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[8], swapped),
  },

  // ==================== WORLD 4: 會考魔王殿 ====================
  {
    id: 10,
    worldId: 4,
    title: '密碼保險箱',
    badge: '十位與個位',
    storySegments: [
      { text: '一個神祕兩位數密碼鎖有以下線索：', kind: 'plain' },
      { text: '原密碼的十位數字與個位數字之和為 9', kind: 'clue', clueIndex: 0 },
      { text: '；', kind: 'plain' },
      { text: '若把十位數字與個位數字對調，所得的新數比原數大 27', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問原密碼的十位數字和個位數字各是多少？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '原十位數字', unit: '', icon: '🔟', chipText: '原數的十位數字' },
      { id: 'u1', label: '原個位數字', unit: '', icon: '1️⃣', chipText: '原數的個位數字' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '新數比原數大 27', reason: '27 是兩數的已知差值喔。' },
      { id: 'd1', chipText: '數字之和為 9', reason: '9 是已知的數字和。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '數字和線索',
        text: '原密碼的十位數字與個位數字之和為 9',
        equation: { a: 1, b: 1, c: 9 },
      },
      {
        id: 'c1',
        tag: '位值對調差值',
        text: '若把十位數字與個位數字對調，所得的新數比原數大 27',
        equation: { a: -9, b: 9, c: 27 },
        expansionHint: '位值公式：原數 = 10×十位 + 個位；對調新數 = 10×個位 + 十位！把「原數 + 27」放左盤，「新數」放右盤試試看！',
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問原密碼的十位數字和個位數字各是多少？',
      reason: '這是題目問句喔。',
    },
    numberChips: [
      { value: 9, label: '9', note: '數字和 9 / 係數 9' },
      { value: 27, label: '27', note: '新數大 27' },
      { value: 10, label: '10', note: '位值權重：十位 × 10' },
      { value: 1, label: '1', note: '位值權重：個位 × 1' },
    ],
    solution: { u0: 3, u1: 6 },
    hints: (swapped) => {
      const tenSym = swapped ? 'y' : 'x';
      const oneSym = swapped ? 'x' : 'y';
      return [
        `切記！十位數字 ${tenSym} 在數值上代表「10${tenSym}」，所以原數 = 10${tenSym} + ${oneSym}，對調新數 = 10${oneSym} + ${tenSym}！`,
        `直接照題目放上天平 ②：左盤放新數「10${oneSym} + ${tenSym}」，右盤放原數加 27「10${tenSym} + ${oneSym} + 27」就會自動抵銷成 9${oneSym} − 9${tenSym} = 27！`,
        `完整答案參考：天平 ① 放 ${tenSym} + ${oneSym} = 9；天平 ② 放 10${oneSym} + ${tenSym} = 10${tenSym} + ${oneSym} + 27。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[9], swapped),
  },
  {
    id: 11,
    worldId: 4,
    title: '咖啡廳優惠日',
    badge: '會考單價題',
    storySegments: [
      { text: '文青咖啡廳今天舉辦點餐實戰：', kind: 'plain' },
      { text: '點 3 杯拿鐵與 2 塊起司蛋糕一共需要 440 元', kind: 'clue', clueIndex: 0 },
      { text: '；', kind: 'plain' },
      { text: '已知單買 1 杯拿鐵的價錢比 1 塊起司蛋糕便宜 20 元', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問拿鐵與起司蛋糕原價各多少元？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '拿鐵單價', unit: '元', icon: '☕', chipText: '拿鐵一杯多少元' },
      { id: 'u1', label: '蛋糕單價', unit: '元', icon: '🍰', chipText: '蛋糕一塊多少元' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '一共需要 440 元', reason: '440 元是已知的結帳總金額。' },
      { id: 'd1', chipText: '便宜 20 元', reason: '20 元是兩者單價的已知差距。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '組合總價',
        text: '點 3 杯拿鐵與 2 塊起司蛋糕一共需要 440 元',
        equation: { a: 3, b: 2, c: 440 },
      },
      {
        id: 'c1',
        tag: '單價比較',
        text: '已知單買 1 杯拿鐵的價錢比 1 塊起司蛋糕便宜 20 元',
        equation: { a: 1, b: -1, c: -20 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問拿鐵與起司蛋糕原價各多少元？',
      reason: '這是最後的提問句，不是條件式喔。',
    },
    numberChips: [
      { value: 3, label: '3', note: '3 杯拿鐵' },
      { value: 2, label: '2', note: '2 塊蛋糕' },
      { value: 440, label: '440', note: '共 440 元' },
      { value: 20, label: '20', note: '便宜 20 元' },
    ],
    solution: { u0: 80, u1: 100 },
    hints: (swapped) => {
      const latSym = swapped ? 'y' : 'x';
      const cakeSym = swapped ? 'x' : 'y';
      return [
        `先比較誰比較貴！「拿鐵比蛋糕便宜 20 元」，代表拿鐵 (${latSym}) 比較輕，把 +20 補在拿鐵盤才會跟蛋糕 (${cakeSym}) 一樣重！`,
        `天平 ①：3${latSym} + 2${cakeSym} = 440；天平 ②：${latSym} + 20 = ${cakeSym}（或寫成 ${latSym} = ${cakeSym} − 20）。`,
        `完整答案參考：天平 ① 放 3${latSym} + 2${cakeSym} = 440；天平 ② 放 ${latSym} + 20 = ${cakeSym}。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[10], swapped),
  },
  {
    id: 12,
    worldId: 4,
    title: '書店週年慶打折',
    badge: '百分率魔王',
    storySegments: [
      { text: '書局週年慶促銷活動：', kind: 'plain' },
      { text: '小美挑選了一本小說與一本漫畫，兩本原價合計 500 元', kind: 'clue', clueIndex: 0 },
      { text: '；結帳時', kind: 'plain' },
      { text: '小說打 8 折、漫畫打 9 折，折價後一共實付 420 元', kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問這本小說和漫畫的原價各是多少元？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '小說原價', unit: '元', icon: '📖', chipText: '小說原價多少元' },
      { id: 'u1', label: '漫畫原價', unit: '元', icon: '📚', chipText: '漫畫原價多少元' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: '原價合計 500 元', reason: '500 元是已知原價總和。' },
      { id: 'd1', chipText: '打折後實付 420 元', reason: '420 元是折扣後已知實付金額。' },
    ],
    clues: [
      {
        id: 'c0',
        tag: '原價合計',
        text: '小美挑選了一本小說與一本漫畫，兩本原價合計 500 元',
        equation: { a: 1, b: 1, c: 500 },
      },
      {
        id: 'c1',
        tag: '打折實付',
        text: '小說打 8 折、漫畫打 9 折，折價後一共實付 420 元',
        equation: { a: 0.8, b: 0.9, c: 420 },
      },
    ],
    clueDistractor: {
      id: 'cd0',
      text: '請問這本小說和漫畫的原價各是多少元？',
      reason: '這是問句！先設原價為 x、y 最簡潔好算。',
    },
    numberChips: [
      { value: 500, label: '500', note: '原價合計' },
      { value: 0.8, label: '0.8', note: '8 折 = ×0.8' },
      { value: 0.9, label: '0.9', note: '9 折 = ×0.9' },
      { value: 420, label: '420', note: '折後實付' },
    ],
    solution: { u0: 300, u1: 200 },
    hints: (swapped) => {
      const novSym = swapped ? 'y' : 'x';
      const comSym = swapped ? 'x' : 'y';
      return [
        `台灣常考打折轉換：「8 折」就是原價 × 0.8，「9 折」就是原價 × 0.9！（若習慣整數，左右同乘 10 寫成 8${novSym} + 9${comSym} = 4200 天平也會認得喔！）`,
        `天平 ① 放原價相加：${novSym} + ${comSym} = 500；天平 ② 放折扣價相加：0.8${novSym} + 0.9${comSym} = 420。`,
        `完整答案參考：天平 ① 放 ${novSym} + ${comSym} = 500；天平 ② 放 0.8${novSym} + 0.9${comSym} = 420。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(LEVELS[11], swapped),
  },
];

/**
 * Simple deterministic-or-random integer helper.
 */
function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Procedural practice level generator across 5 distinct word-problem templates.
 * Guaranteed positive integer solutions and linearly independent clues.
 * @param {number} [templateIndex] Optional 0..4 template selector
 * @param {() => number} [rng=Math.random]
 */
export function generatePracticeLevel(templateIndex = undefined, rng = Math.random) {
  const chosenTemplate =
    typeof templateIndex === 'number' ? ((templateIndex % 5) + 5) % 5 : randInt(rng, 0, 4);

  if (chosenTemplate === 0) {
    // Template 0: 飲品與點心（數量＋總價）
    const pairs = [
      { n1: '紅茶', u1: '杯', i1: '🧋', n2: '鬆餅', u2: '份', i2: '🧇' },
      { n1: '豆花', u1: '碗', i1: '🍮', n2: '蔥油餅', u2: '張', i2: '🫓' },
      { n1: '原子筆', u1: '枝', i1: '🖊️', n2: '筆記本', u2: '本', i2: '📓' },
    ];
    const item = pairs[randInt(rng, 0, pairs.length - 1)];
    const u0 = randInt(rng, 3, 9);
    const u1 = randInt(rng, 2, 8);
    const p1 = randInt(rng, 2, 5) * 10;
    const p2 = p1 + randInt(rng, 1, 4) * 10;
    const totalCount = u0 + u1;
    const totalCost = p1 * u0 + p2 * u1;
    return createProceduralObj({
      id: 100,
      title: `無限練習：${item.n1}與${item.n2}`,
      badge: '隨機練習・數量總價',
      storySegments: [
        { text: '小偵探採買任務：', kind: 'plain' },
        { text: `${item.n1}與${item.n2}合計買了 ${totalCount} 個`, kind: 'clue', clueIndex: 0 },
        { text: '，', kind: 'plain' },
        { text: `${item.n1}每${item.u1} ${p1} 元、${item.n2}每${item.u2} ${p2} 元，一共花了 ${totalCost} 元`, kind: 'clue', clueIndex: 1 },
        { text: '。', kind: 'plain' },
        { text: `請問${item.n1}和${item.n2}各買了多少？`, kind: 'question' },
      ],
      unknowns: [
        { id: 'u0', label: `${item.n1}數量`, unit: item.u1, icon: item.i1, chipText: `${item.n1}買了幾${item.u1}` },
        { id: 'u1', label: `${item.n2}數量`, unit: item.u2, icon: item.i2, chipText: `${item.n2}買了幾${item.u2}` },
      ],
      unknownDistractors: [
        { id: 'd0', chipText: `合計買了 ${totalCount} 個`, reason: `${totalCount} 是已知總數量喔！` },
        { id: 'd1', chipText: `共花了 ${totalCost} 元`, reason: `${totalCost} 元是已知總金額。` },
      ],
      clues: [
        { id: 'c0', tag: '總數量', text: `${item.n1}與${item.n2}合計買了 ${totalCount} 個`, equation: { a: 1, b: 1, c: totalCount } },
        { id: 'c1', tag: '總金額', text: `${item.n1}每${item.u1} ${p1} 元、${item.n2}每${item.u2} ${p2} 元，一共花了 ${totalCost} 元`, equation: { a: p1, b: p2, c: totalCost } },
      ],
      clueDistractor: { id: 'cd0', text: `請問${item.n1}和${item.n2}各買了多少？`, reason: '問句不構成平衡方程式喔！' },
      numberChips: [
        { value: totalCount, label: String(totalCount), note: '總數量' },
        { value: p1, label: String(p1), note: `${item.n1}單價` },
        { value: p2, label: String(p2), note: `${item.n2}單價` },
        { value: totalCost, label: String(totalCost), note: '總金額' },
      ],
      solution: { u0, u1 },
    });
  }

  if (chosenTemplate === 1) {
    // Template 1: 和差問題（誰比誰多）
    const u1 = randInt(rng, 8, 25);
    const diff = randInt(rng, 4, 16);
    const u0 = u1 + diff;
    const sum = u0 + u1;
    return createProceduralObj({
      id: 101,
      title: '無限練習：社團積分賽',
      badge: '隨機練習・和差關係',
      storySegments: [
        { text: '藍隊與紅隊參加益智問答，', kind: 'plain' },
        { text: `兩隊總積分合計 ${sum} 分`, kind: 'clue', clueIndex: 0 },
        { text: '，而且', kind: 'plain' },
        { text: `藍隊比紅隊多 ${diff} 分`, kind: 'clue', clueIndex: 1 },
        { text: '。', kind: 'plain' },
        { text: '請問藍隊和紅隊各得幾分？', kind: 'question' },
      ],
      unknowns: [
        { id: 'u0', label: '藍隊得分', unit: '分', icon: '🔵', chipText: '藍隊得幾分' },
        { id: 'u1', label: '紅隊得分', unit: '分', icon: '🔴', chipText: '紅隊得幾分' },
      ],
      unknownDistractors: [
        { id: 'd0', chipText: `合計 ${sum} 分`, reason: `${sum} 分是已知的兩隊總和！` },
        { id: 'd1', chipText: `多 ${diff} 分`, reason: `${diff} 分是已知差距。` },
      ],
      clues: [
        { id: 'c0', tag: '總積分', text: `兩隊總積分合計 ${sum} 分`, equation: { a: 1, b: 1, c: sum } },
        { id: 'c1', tag: '相差分數', text: `藍隊比紅隊多 ${diff} 分`, equation: { a: 1, b: -1, c: diff } },
      ],
      clueDistractor: { id: 'cd0', text: '請問藍隊和紅隊各得幾分？', reason: '問句只用來決定未知數，不是方程式喔。' },
      numberChips: [
        { value: sum, label: String(sum), note: '總分' },
        { value: diff, label: String(diff), note: '藍隊多出分數' },
      ],
      solution: { u0, u1 },
    });
  }

  if (chosenTemplate === 2) {
    // Template 2: 雞兔 / 汽機車數輪子
    const u0 = randInt(rng, 4, 15); // 機車 (2輪)
    const u1 = randInt(rng, 3, 12); // 汽車 (4輪)
    const totalVehicles = u0 + u1;
    const totalWheels = 2 * u0 + 4 * u1;
    return createProceduralObj({
      id: 102,
      title: '無限練習：停車場數輪子',
      badge: '隨機練習・隱藏係數',
      storySegments: [
        { text: '停車場裡停滿了兩輪機車與四輪汽車，', kind: 'plain' },
        { text: `數一數總共有 ${totalVehicles} 輛車`, kind: 'clue', clueIndex: 0 },
        { text: '，', kind: 'plain' },
        { text: `地上的輪胎合計有 ${totalWheels} 個輪子`, kind: 'clue', clueIndex: 1 },
        { text: '。', kind: 'plain' },
        { text: '請問機車和汽車各有幾輛？', kind: 'question' },
      ],
      unknowns: [
        { id: 'u0', label: '機車數量', unit: '輛', icon: '🛵', chipText: '機車有幾輛' },
        { id: 'u1', label: '汽車數量', unit: '輛', icon: '🚗', chipText: '汽車有幾輛' },
      ],
      unknownDistractors: [
        { id: 'd0', chipText: `共有 ${totalVehicles} 輛`, reason: '這是已知總輛數。' },
        { id: 'd1', chipText: `合計 ${totalWheels} 個輪子`, reason: '這是已知總輪胎數。' },
      ],
      clues: [
        { id: 'c0', tag: '總車輛數', text: `數一數總共有 ${totalVehicles} 輛車`, equation: { a: 1, b: 1, c: totalVehicles } },
        { id: 'c1', tag: '總輪胎數', text: `地上的輪胎合計有 ${totalWheels} 個輪子`, equation: { a: 2, b: 4, c: totalWheels } },
      ],
      clueDistractor: { id: 'cd0', text: '請問機車和汽車各有幾輛？', reason: '這是提問句，不是關係條件。' },
      numberChips: [
        { value: totalVehicles, label: String(totalVehicles), note: '總車輛數' },
        { value: totalWheels, label: String(totalWheels), note: '總輪胎數' },
        { value: 2, label: '2', note: '常識：機車 2 輪' },
        { value: 4, label: '4', note: '常識：汽車 4 輪' },
      ],
      solution: { u0, u1 },
    });
  }

  if (chosenTemplate === 3) {
    // Template 3: 分組盈虧（長椅/帳篷）
    const k1 = randInt(rng, 3, 5);
    const k2 = k1 + 2;
    const u1 = randInt(rng, 4, 10); // 椅子數量
    const surplus = randInt(rng, 2, 7);
    const u0 = k1 * u1 + surplus; // 學生人數
    const deficit = k2 * u1 - u0; // 保證 > 0 只要 k2*u1 > u0 => 2*u1 > surplus => 2*4=8 > 7, always > 0!
    return createProceduralObj({
      id: 103,
      title: '無限練習：禮堂排座椅',
      badge: '隨機練習・盈虧分配',
      storySegments: [
        { text: '校慶集合分配禮堂長椅：', kind: 'plain' },
        { text: `每張長椅坐 ${k1} 人，會多出 ${surplus} 人站著`, kind: 'clue', clueIndex: 0 },
        { text: '；', kind: 'plain' },
        { text: `每張長椅坐 ${k2} 人，則會空出 ${deficit} 個座位`, kind: 'clue', clueIndex: 1 },
        { text: '。', kind: 'plain' },
        { text: '請問現場有幾位學生？幾張長椅？', kind: 'question' },
      ],
      unknowns: [
        { id: 'u0', label: '學生人數', unit: '人', icon: '🧑‍🎓', chipText: '學生有幾人' },
        { id: 'u1', label: '長椅張數', unit: '張', icon: '🪑', chipText: '長椅有幾張' },
      ],
      unknownDistractors: [
        { id: 'd0', chipText: `多出 ${surplus} 人`, reason: '這是已知多出來的人數。' },
        { id: 'd1', chipText: `空出 ${deficit} 個位子`, reason: '這是已知空缺的座位數。' },
      ],
      clues: [
        { id: 'c0', tag: '擠一點坐', text: `每張長椅坐 ${k1} 人，會多出 ${surplus} 人站著`, equation: { a: 1, b: -k1, c: surplus } },
        { id: 'c1', tag: '分開點坐', text: `每張長椅坐 ${k2} 人，則會空出 ${deficit} 個座位`, equation: { a: 1, b: -k2, c: -deficit } },
      ],
      clueDistractor: { id: 'cd0', text: '請問現場有幾位學生？幾張長椅？', reason: '這是題目問句喔。' },
      numberChips: [
        { value: k1, label: String(k1), note: `每張 ${k1} 人` },
        { value: surplus, label: String(surplus), note: `多 ${surplus} 人` },
        { value: k2, label: String(k2), note: `每張 ${k2} 人` },
        { value: deficit, label: String(deficit), note: `空 ${deficit} 位` },
      ],
      solution: { u0, u1 },
    });
  }

  // Template 4: 倍數比較問題
  const mult = randInt(rng, 2, 4);
  const offset = randInt(rng, 2, 9);
  const u1 = randInt(rng, 6, 18);
  const u0 = mult * u1 + offset;
  const total = u0 + u1;
  return createProceduralObj({
    id: 104,
    title: '無限練習：圖書館藏書',
    badge: '隨機練習・倍數關係',
    storySegments: [
      { text: '圖書館統計科學與文學兩區書架：', kind: 'plain' },
      { text: `兩區總共有 ${total} 本書`, kind: 'clue', clueIndex: 0 },
      { text: '，', kind: 'plain' },
      { text: `科學區的書比文學區的 ${mult} 倍還多 ${offset} 本`, kind: 'clue', clueIndex: 1 },
      { text: '。', kind: 'plain' },
      { text: '請問科學區與文學區各有幾本書？', kind: 'question' },
    ],
    unknowns: [
      { id: 'u0', label: '科學區書數', unit: '本', icon: '🔬', chipText: '科學區有幾本' },
      { id: 'u1', label: '文學區書數', unit: '本', icon: '📜', chipText: '文學區有幾本' },
    ],
    unknownDistractors: [
      { id: 'd0', chipText: `總共 ${total} 本`, reason: '這是已知總本數。' },
      { id: 'd1', chipText: `多 ${offset} 本`, reason: '這是已知的差額本數。' },
    ],
    clues: [
      { id: 'c0', tag: '兩區合計', text: `兩區總共有 ${total} 本書`, equation: { a: 1, b: 1, c: total } },
      { id: 'c1', tag: '倍數多幾本', text: `科學區的書比文學區的 ${mult} 倍還多 ${offset} 本`, equation: { a: 1, b: -mult, c: offset } },
    ],
    clueDistractor: { id: 'cd0', text: '請問科學區與文學區各有幾本書？', reason: '問句不含等式條件！' },
    numberChips: [
      { value: total, label: String(total), note: '總本數' },
      { value: mult, label: String(mult), note: `${mult} 倍` },
      { value: offset, label: String(offset), note: `多 ${offset} 本` },
    ],
    solution: { u0, u1 },
  });
}

function createProceduralObj(base) {
  return {
    ...base,
    worldId: 0,
    isProcedural: true,
    hints: (swapped) => {
      const vm = getVarMeta(base, swapped);
      return [
        `先從第一句話判斷「${vm.x.label}」與「${vm.y.label}」是相加、相減還是倍數關係。`,
        `建議天平 ① 放入：${formatCanonicalEquation(base.clues[0].equation, swapped)}。`,
        `完整答案參考：天平 ① 放 ${formatCanonicalEquation(base.clues[0].equation, swapped)}；天平 ② 放 ${formatCanonicalEquation(base.clues[1].equation, swapped)}。`,
      ];
    },
    solvingSteps: (swapped) => buildStandardSolvingSteps(base, swapped),
  };
}
