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
