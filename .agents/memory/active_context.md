# 當前上下文與活躍任務 (Active Context)

## 1. 當前聚焦目標 (Current Focus)
- 完成專案主要工作流技能整合至專案級 Scope（`.agents/skills/` 共 8 項技能），並建立安全自動化 `git-commit-push` 技能與遠端同步驗證，為後續持續擴充教學遊戲建立可攜的標準作業流。

## 2. 最近完成 (Recently Completed)
- [x] 建立根目錄遊戲大廳入口 (`index.html`) 與控制邏輯 (`shared/catalog.js`, `shared/hub.js`, `shared/styles/hub.css`)
- [x] 抽離共用層至 `shared/`：`tokens.css`（全站變數、按鈕互動與原生 `<dialog>` 頂層動畫）、`soundEngine.js`、`dialogHelper.js`
- [x] 將「雙天平偵探」完整遷移至 `games/linear-systems/` 並以 `game.json` 自描述模組依賴與樣式
- [x] 升級 `scripts/build.mjs` 自動掃描 `games/*/game.json` 產出 `dist/index.html` 與各遊戲獨立單檔，並新增腳手架 `scripts/new-game.mjs` (`npm run new-game`)
- [x] 新增 `shared/tests/catalog.test.js` 驗證登錄目錄與遊戲目錄一致性，整合 `npm test` 覆蓋全站與各遊戲測試
- [x] 收斂並建立 8 項專案級技能至 `.agents/skills/`（含 `modern-web-guidance`、`cloudflare-pages-deploy`、`learning-game-builder`、`git-commit-push`），升級 `verification-runner`（技能衛生檢查 + 應用測試與離線建置），並完成提交推送至 `origin/main`

## 3. 進行中與下一步 (Next Steps)
- [ ] 依據教學單元規劃新增第二款以後之互動遊戲（依 `learning-game-builder` 技能與 `npm run new-game` 快速建立）

## 4. 當前已知阻礙或風險 (Blockers & Risks)
- 無阻礙。Node v24.15.0 `node --test` 原生遞迴測試、`scripts/build.mjs`、`verify.ps1` 與 `git-commit-push.ps1` 皆正常運作。
