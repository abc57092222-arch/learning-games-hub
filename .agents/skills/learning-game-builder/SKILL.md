---
name: learning-game-builder
description: >-
  Guide agents through scaffolding, building, testing, and registering Zero-Server
  and Offline-First interactive educational games under games/<slug>/ in the
  Learning Games Hub.
---

# 互動教學遊戲建置技能 (Learning Game Builder)

當使用者要求在本專案新增、擴充或重構教學小遊戲時，依本技能執行，確保所有遊戲遵守 **Zero-Server / Offline-First** 哲學並相容共用大廳與離線單檔打包管線。

## 執行步驟

### 1. 先查閱現代 Web 規範
- 撰寫或修改 HTML/CSS/DOM 互動介面（如 `<dialog>`、響應式排版、表單控制、焦點管理）前，先使用專案技能 `modern-web-guidance` 檢索最新標準與降級策略。

### 2. 建立新遊戲骨架與目錄註冊
使用內建腳手架建立 `games/<slug>/` 並自動註冊進 `shared/catalog.js`：
```powershell
npm run new-game -- <slug> "<遊戲標題>" "<科目>" "<年級>"
```
- `<slug>` 僅限小寫英文、數字與連字號（`/^[a-z0-9-]+$/`）。
- 檢查並補齊 `shared/catalog.js` 中的 `shortTitle`、`icon`、`accent`、`tags`、`description`、`storageKey` 與 `maxStars`，確保與遊戲內實際可獲得星數一致。

### 3. 重用 `shared/` 共用層與導覽契約
- **樣式令牌**：`games/<slug>/index.html` 與 `game.json` 必須引入 `../../shared/styles/tokens.css`，遊戲專屬樣式置於 `./src/styles/game.css`。
- **回大廳連結**：遊戲頁首保留 `<a href="../../index.html" class="tool-btn back-hub-link">🏠 回遊戲大廳</a>`。
- **音效引擎**：從 `../../../shared/audio/soundEngine.js` 匯入 Web Audio 程序化音效（如 `playPop`, `playDrop`, `playClink`, `playError`, `playBalanceLock`, `playVictory`），嚴禁引入外部音檔。
- **無障礙彈窗**：原生 `<dialog class="lab-dialog">` 搭配 `../../../shared/ui/dialogHelper.js` 的 `setupAccessibleDialogs` 處理 ESC 關閉、輕觸外部關閉與頂層過渡降級。

### 4. 嚴格遵守 `scripts/build.mjs` IIFE 打包契約
離線打包器會將 `game.json` 內宣告的 JS 模組轉譯為獨立 IIFE，**必須遵守以下靜態語法限制**：
1. 僅使用靜態具名匯入：`import { a, b as c } from './path.js';`（不可使用 `import * as`、default import 或動態 `import()`）。
2. 僅使用頂層具名匯出：`export function ...`、`export async function ...`、`export class ...`、`export const/let/var ...`（不可使用 `export default`、`export { ... }` 或 `export *`）。
3. 在 `games/<slug>/game.json` 中依**相依拓撲順序**列出 `styles` 與 `modules`，且入口模組標記 `"isEntry": true`（位於最後一項）。

### 5. 領域純邏輯分離與無頭百局模擬測試
- 將數學運算、題目生成、診斷規則與狀態機抽離至純 JS 模組（無 `document` / `window` 相依），讓 Node 24 原生測試執行器（`node --test`）可直接匯入驗證。
- 在 `games/<slug>/tests/` 中補齊：
  - 核心規則、等價驗證與邊界案例單元測試。
  - **≥ 100 局無頭自動化模擬測試**：驗證題庫/關卡收斂性、0 死鎖（Deadlocks = 0）與錯誤迷思診斷覆蓋度。

### 6. 教學設計與無障礙檢查清單
- **鷹架式探索**：拆解為「觀察/設定 → 視覺化建構 → 即時回饋/驗證 → 自由沙盒」步驟，並使用程序化 inline SVG 圖示強化直覺。
- **迷思診斷**：針對學生常見錯誤給予具體原因回饋，不只回報「答錯」。
- **無障礙與響應式**：提供 `.skip-link`、`aria-live="polite"` 讀屏播報、`*:focus-visible` 焦點環、粗指標環境（`@media (pointer: coarse)`）≥ 44px 點擊熱區，以及 `@media (prefers-reduced-motion: reduce)` 動效減弱支援。

### 7. 驗證與離線交付檢查
執行以下命令確認全數通過：
```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
npm test
npm run build
```
- 確認 `shared/tests/catalog.test.js` 驗證 `GAME_CATALOG` 與 `games/*/game.json` 一致。
- 確認 `dist/index.html` 與 `dist/games/<slug>/index.html` 成功產出且無語法錯誤（`build.mjs` 會以 `new Function` 檢查）。
- 可啟動 `npm run serve`（`http://127.0.0.1:4173/index.html`）檢查大廳與遊戲互動，並測試直接開啟 `dist/games/<slug>/index.html` 的離線運作。
