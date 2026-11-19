# 當前上下文與活躍任務 (Active Context)

## 1. 當前聚焦目標 (Current Focus)
- 完成多教學遊戲平台（Learning Games Hub）之目錄架構重構，將共用層抽離至 `shared/` 並將「雙天平偵探」整合進 `games/linear-systems/`。

## 2. 最近完成 (Recently Completed)
- [x] 建立根目錄遊戲大廳入口 (`index.html`) 與控制邏輯 (`shared/catalog.js`, `shared/hub.js`, `shared/styles/hub.css`)
- [x] 抽離共用層至 `shared/`：`tokens.css`（全站變數、按鈕互動與原生 `<dialog>` 頂層動畫）、`soundEngine.js`、`dialogHelper.js`
- [x] 將「雙天平偵探」完整遷移至 `games/linear-systems/` 並以 `game.json` 自描述模組依賴與樣式
- [x] 升級 `scripts/build.mjs` 自動掃描 `games/*/game.json` 產出 `dist/index.html` 與各遊戲獨立單檔，並新增腳手架 `scripts/new-game.mjs` (`npm run new-game`)
- [x] 新增 `shared/tests/catalog.test.js` 驗證登錄目錄與遊戲目錄一致性，整合 `npm test` 覆蓋全站與各遊戲測試

## 3. 進行中與下一步 (Next Steps)
- [ ] 依據教學單元規劃新增第二款以後之互動遊戲（使用 `npm run new-game` 快速建立）

## 4. 當前已知阻礙或風險 (Blockers & Risks)
- 無阻礙。Node v24.15.0 `node --test` 原生遞迴測試、`scripts/build.mjs` 與瀏覽器實測皆正常運作。
