/**
 * Central Learning Games Catalog.
 * Add a new entry here whenever adding a game under `games/<id>/`
 * (or run `npm run new-game -- <slug> "<title>" [subject] [grade]`).
 */
export const GAME_CATALOG = [
  {
    id: 'linear-systems',
    title: '雙天平偵探：二元一次聯立方程式列式實驗室',
    shortTitle: '雙天平偵探',
    subject: '數學',
    grade: '國中七年級',
    icon: '⚖️',
    accent: '#4f46e5',
    tags: ['應用題列式', '設未知數', '線段圖', '雙直線交點'],
    description:
      '從文字題「設 x, y → 抓雙線索 → 雙天平列式 → 2D 座標交點驗算」四步驟打通聯立方程式應用題！內含 12 關卡、無限隨機題庫與「為什麼要兩條式子？」直覺沙盒。',
    entry: './games/linear-systems/index.html',
    storageKey: 'eq_detective_progress_v1',
    maxStars: 36,
  },
  {
    id: 'multiplication-grid',
    title: '九九乘法冒險島：直覺探索與速算實驗室',
    shortTitle: '九九乘法冒險島',
    subject: '數學',
    grade: '小學三年級數學',
    icon: '✖️',
    accent: '#0284c7',
    tags: ['九九乘法', '點陣圖', '乘法交換律', '迷思診斷', '四則運算'],
    description:
      '融合視覺點陣圖、乘法交換律旋轉視角、相鄰推導與情境應用題！提供 10 關冒險挑戰、探索沙盒與完整 9x9 大表，內建誤乘為加與口訣混淆智慧診斷。',
    entry: './games/multiplication-grid/index.html',
    storageKey: 'multiplication_grid_progress_v1',
    maxStars: 30,
  },
];
