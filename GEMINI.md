# 專案運行憲章與系統規範 (GEMINI.md)
**Project Operating Charter & Engineering Standards**

> **適用範圍**：本專案目錄內所有代理人對話工作階段、主調度代理人、蜂群子代理人及跨技能管線。

---

## 1. 架構願景與核心法則 (Architecture Vision & Core Principles)

所有在本專案運行的 AI Agent 必須無條件恪守以下三大基礎哲學：

1. **極簡主義與 No-Server 原生工藝 (Zero-Server-First)**
   - 產品與工具設計優先考慮離線運行與純前端/純腳本架構。
   - 嚴禁未經指示引入非必要的後端伺服器依賴、資料庫或重量級框架。
   - 追求極致的可攜帶性與單檔/免安裝資產。

2. **離線優先與自給自足 (Offline-First & Self-Contained)**
   - 任何視覺、幾何或資料結構優先採用程序化演算法或標準可讀格式產生。
   - 杜絕外部資源失效與網路逾時風險。

3. **零冗餘與工程潔癖 (Zero-Bloat & Surgical Precision)**
   - 杜絕死碼、未使用的依賴套件（npm/pip packages）與多餘的包裝層。
   - 維持晶瑩剔透的模組化目錄架構。

---

## 2. 記憶與上下文管理規範 (Memory Lifecycle)

- **對話起始**：代理人啟動時應優先檢索 `.agents/memory/active_context.md` 與 `project_context.md`，取得最新脈絡。
- **架構決策**：重大架構調整或技術選型必須以 ADR 格式記錄至 `.agents/memory/decisions.md`。
- **踩坑紀錄**：遇環境報錯、編碼問題或使用者校正時，沉澱於 `.agents/memory/learnings.md`。

---

## 3. Git 提交規範 (Conventional Commits)

專案嚴格遵循語意化提交格式：
- `feat: <新功能描述>`
- `fix: <修復問題描述>`
- `docs: <文件或記憶更新>`
- `style: <不影響邏輯的代碼排版/格式調整>`
- `refactor: <重構優化>`
- `test: <測試用例或驗證腳本>`
- `chore: <基礎建設、設定檔調整>`
