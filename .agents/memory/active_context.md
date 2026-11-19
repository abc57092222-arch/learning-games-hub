# 當前上下文與活躍任務 (Active Context)

## 1. 當前聚焦目標 (Current Focus)
- 已完成「雙天平偵探：二元一次聯立方程式列式實驗室」純前端離線教育網頁遊戲之開發與全面驗證。

## 2. 最近完成 (Recently Completed)
- [x] 完成零依賴純前端模組與數學引擎 (`src/math/equationEngine.js`)：支援 $x/y$ 對調等價、比例/移項/線性組合等價判定、誤區診斷 (`reversed_diff`, `swapped_vars`, `wrong_op_sign`, `missing_unit_multiplier`, `wrong_constant`, `duplicate_clue`) 與物理傾斜計算
- [x] 建立 4 大主題 12 關卡與 5 種題型無限練習生成器 (`src/data/levels.js`)
- [x] 實作雙天平 SVG 物理動畫、線段對比圖 (`src/ui/scaleRenderer.js`)、2D 直線交點圖 (`src/ui/graphRenderer.js`) 與「為什麼要兩條式子？」直覺沙盒 (`src/ui/sandboxView.js`)
- [x] 實作零外部音檔之 Web Audio 程序化音效 (`src/audio/soundEngine.js`) 與無障礙鍵盤/觸控/拖曳控制 (`src/ui/gameController.js`)
- [x] 通過 `node --test tests/headless-simulation.test.js`（6/6 PASS，含 120 局無頭模擬 0 死鎖）、`node scripts/build.mjs`（單檔離線 `dist/index.html`，185.2 KB）、`verify.ps1`（24/24 PASS）與真實瀏覽器端到端實測

## 3. 進行中與下一步 (Next Steps)
- [ ] 如需部署公開網址，可透過 `npx wrangler pages deploy dist` 發布或擴充更多會考應用題型

## 4. 當前已知阻礙或風險 (Blockers & Risks)
- 無阻礙。Node v24.15.0 原生 ESM 與單檔建置腳本皆運作正常。
