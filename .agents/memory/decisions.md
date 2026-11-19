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
