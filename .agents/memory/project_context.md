# 專案背景與架構總覽 (Project Context)

## 1. 專案基本資訊
- **專案名稱**：互動教學遊戲實驗室 (Learning Games Hub / `2026-11-20`)
- **工作路徑**：`d:\GitDev\2026-11-20`
- **運行平台**：Windows (PowerShell) / UTF-8
- **版本控制**：Git (`main` 分支)
- **架構特質**：Zero-Server / Offline-First 多教學遊戲集合平台（`shared/` 共用層 + `games/<slug>/` 插件式遊戲目錄 + 自動離線單檔打包器）

## 2. 核心技術哲學
1. **Zero-Server-First**：優先使用純前端原生 HTML / CSS / ES Modules，免安裝與資料庫依賴。
2. **Offline-First & Self-Contained**：優先採程序化 Web Audio 合成音效與原生 SVG 圖形，支援單檔 `dist/` 雙擊離線遊玩。
3. **Precision Tooling & Anti-Shortcut**：微創手術編輯（< 20 行）、> 40% 覆寫重構、拒絕偽造模型與寫死假數據。

## 3. 目錄結構職責
- `index.html` & `shared/`：遊戲大廳首頁 (`hub.js`)、登錄目錄 (`catalog.js`)、共用樣式 (`tokens.css`, `hub.css`)、音訊 (`soundEngine.js`) 與無障礙彈窗 (`dialogHelper.js`)。
- `games/<slug>/`：各獨立教學遊戲（含 `game.json`、獨立入口、核心邏輯與無頭測試）。目前收錄 `linear-systems`（雙天平偵探）。
- `scripts/`：離線建置 (`build.mjs`)、靜態伺服器 (`serve.mjs`)、新遊戲腳手架 (`new-game.mjs`)。
- `.agents/`、`AGENTS.md`、`GEMINI.md`：專案規範、跨對話記憶，以及 8 套受 Git 追蹤的專案級技能庫（`project-onboarding`、`session-memory-sync`、`worktree-manager`、`verification-runner`、`modern-web-guidance`、`learning-game-builder`、`cloudflare-pages-deploy`、`git-commit-push`）。
