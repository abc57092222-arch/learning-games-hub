# 架構決策紀錄 (Architecture Decision Records)

本檔案記錄本專案的重要架構決策。每項決策包含背景（Context）、決策內容（Decision）、後果與權衡（Consequences）。

---

## ADR-001: 建立 Project-Scoped Agent 基礎架構

- **日期**：2026-11-20
- **狀態**：Accepted (已採納)

### 背景 (Context)
新專案需要一套清晰、高效、可自癒且相容 Antigravity / Gemini CLI 生態的開發框架。歷史數據顯示：未配置環境規範時容易遭遇編碼崩潰（CP950）、檔案替換偏移（CRLF/LF 差異）及多代理人協同衝突。

### 決策 (Decision)
1. 採納 `.agents/` 作為專案級自定義標準目錄（符合 Antigravity 官方優先搜尋順序）。
2. 在根目錄部署雙憲章：`AGENTS.md`（蜂群協同與防偷懶鐵律）與 `GEMINI.md`（No-Server 與運行標準）。
3. 使用 `.gitattributes` 強制定義文字檔 LF 換行與腳本專用換行，徹底解決換行字元匹配異常。
4. 導入模組化記憶庫架構（`project_context`, `active_context`, `decisions`, `learnings`, `scratchpad`）。
5. 建立 4 套專屬技能（Onboarding, Worktree 管理, 記憶同步, 驗證執行）。

### 後果 (Consequences)
- **正面效果**：
  - 新加入的代理人能在首個回合內迅速完成專案上下文注入。
  - 多代理人平行作業時透過 Worktree 隔離，杜絕程式碼覆蓋風險。
  - 編碼與行結束符完全標準化，排除 Windows 平台歷史高頻錯誤。
- **維護成本**：
  - 代理人在完成重大功能時，需主動依規更新 `active_context.md` 與 `decisions.md`。

---

## ADR-002: 「雙天平偵探」零依賴離線教育網頁遊戲架構

- **日期**：2026-11-19
- **狀態**：Accepted (已採納)

### 背景 (Context)
國中學生學習二元一次聯立方程式時，計算技巧通常較易掌握，但面臨應用題「設兩個未知數」與「從文字敘述拆出兩條等量關係列式」時常卡關。同時需遵循專案 `Zero-Server-First` 與 `Offline-First` 原則。

### 決策 (Decision)
1. **零外部套件與單檔可攜發行**：採用原生 ES Modules + SVG + Web Audio API，並以自製 `scripts/build.mjs`（各模組 IIFE 隔離封裝 + `new Function` 語法檢驗）產出可雙擊開啟的 `dist/index.html`（185.2 KB）。
2. **數學對稱與等價驗證引擎**：`src/math/equationEngine.js` 完整接受學生自訂 $x/y$ 對調、移項（如 `x = y + 8` 與 `x - y = 8`）、倍數縮放與獨立線性組合，同時精準攔截重合線索 (`duplicate_clue`) 與常見列式迷思（反向加減、漏乘單位倍數等）。
3. **直覺互動機制**：整合「4 步驟列式引導」、「物理傾斜雙天平 + 線段對比圖」、「2D 座標交點驗算滑桿」與「為什麼要兩條式子？」沙盒。

### 後果 (Consequences)
- **正面效果**：免伺服器即可於桌面與行動裝置離線操作；純函數核心可直接由 Node 24 原生測試 runner 進行百局以上無頭驗證。
- **權衡取捨**：自製 IIFE bundler 依賴靜態具名 `import/export` 語法，未來新增 JS 檔案時須同步登記於 `scripts/build.mjs` 之模組清單。

---

## ADR-003: 多教學遊戲集合平台目錄結構 (`shared/` + `games/<slug>/` + Manifest Bundler)

- **日期**：2026-11-19
- **狀態**：Accepted (已採納)

### 背景 (Context)
使用者計畫在此專案下持續新增多款互動教學遊戲，原本將單一遊戲檔案直接置於根目錄 `src/` 與 `tests/` 會隨遊戲數量增加而變得混亂，難以共用設計系統與離線打包。

### 決策 (Decision)
1. **分層目錄結構**：
   - 根目錄 `index.html` 改為「互動教學遊戲實驗室」大廳入口，支援學科分類、關鍵字搜尋與各遊戲 `localStorage` 星星進度讀取。
   - `shared/` 集中存放跨遊戲共用資產：`catalog.js`、`hub.js`、`audio/soundEngine.js`、`ui/dialogHelper.js`、`styles/tokens.css`、`styles/hub.css` 與結構驗證測試 `tests/catalog.test.js`。
   - `games/<slug>/` 採完全獨立封裝（`game.json`、`index.html`、`src/`、`tests/`），每個遊戲皆附「🏠 回遊戲大廳」連結。
2. **Manifest 驅動離線建置與腳手架**：
   - `scripts/build.mjs` 自動掃描 `games/*/game.json`，透過絕對路徑解析完成跨 `shared/` 與 `src/` 相依模組之無衝突 IIFE 封裝，輸出至 `dist/index.html` 與 `dist/games/<slug>/index.html`。
   - 新增 `scripts/new-game.mjs`（`npm run new-game`）自動化生成新遊戲目錄、測試骨架並自動註冊至 `shared/catalog.js`。

### 後果 (Consequences)
- **正面效果**：新增遊戲零摩擦且彼此隔離，離線單檔分發與 Node 24 自動化測試同步維持零外部依賴。
- **權衡取捨**：每個遊戲目錄需維護 `game.json` 模組順序；新增或調整目錄時由 `shared/tests/catalog.test.js` 自動守護一致性。

---

## ADR-004: 整合核心工作流為 Project-Scoped Skills 並建立安全 Git Commit & Push 技能

- **日期**：2026-11-20
- **狀態**：Accepted (已採納)

### 背景 (Context)
專案自初始化至今已形成清晰的跨回合工作流（基礎設施導入與記憶同步、現代 Web 標準查詢、互動教學遊戲建置、Cloudflare Pages 部署、以及自動化驗證與提交推送）。原先部分技能分散於全域或外掛目錄（甚至內含獨立 `.git/`），難以隨專案版本控制跨機器完整重現，也缺乏專案統一的 Git 提交與推送防呆機制。

### 決策 (Decision)
1. 將專案目前實際使用的 8 項核心技能統一收斂至 `.agents/skills/`：保留並升級 `project-onboarding`、`session-memory-sync`、`worktree-manager`、`verification-runner`；乾淨引入 `modern-web-guidance` 與 `cloudflare-pages-deploy`（僅複製 `SKILL.md` 與 `LICENSE`，絕不帶入嵌套 `.git`）；並新增針對本專案的 `learning-game-builder` 與 `git-commit-push`。
2. 排除與本專案離線靜態教育遊戲無關或依賴本機尚未配置 MCP 的全域/外掛技能，維持技能庫精實無冗餘。
3. 透過 `verification-runner`（`verify.ps1`）強制檢測所有技能目錄之 YAML Frontmatter、Git 可追蹤性、無嵌套 `.git`、無個人路徑及 `npm test` / `npm run build` 通過；並以 `git-commit-push.ps1` 提供 PowerShell 5.1/7 相容的安全提交與遠端同步驗證。

### 後果 (Consequences)
- **正面效果**：任何開發者或 AI 代理人在 clone 專案後即可取得完整專案級技能；徹底杜絕 Git submodule（mode `160000`）誤入與敏感檔/建置產物誤推風險。
- **權衡取捨**：未來新增技能或升級全域來源技能時，需同步更新 `.agents/skills/` 並通過 `verify.ps1` 檢查。
