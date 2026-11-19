# 專案背景與架構總覽 (Project Context)

## 1. 專案基本資訊
- **專案名稱**：2026-11-20
- **工作路徑**：`d:\GitDev\2026-11-20`
- **運行平台**：Windows (PowerShell) / UTF-8
- **版本控制**：Git (`main` 分支)
- **架構特質**：基於 Antigravity / Gemini Swarm 體系之高度模組化、離線優先專案

## 2. 核心技術哲學
1. **Zero-Server-First**：優先使用純前端、靜態交付或原生腳本，避免非必要的外部伺服器與資料庫複雜度。
2. **Offline-First & Self-Contained**：優先採程序化演算法合成音效與圖資，杜絕資源丟失。
3. **Precision Tooling & Anti-Shortcut**：微創手術編輯（< 20 行）、> 40% 覆寫重構、拒絕偽造模型與寫死假數據。

## 3. 目錄結構職責
- `.agents/rules/`：專案模組化規範（代碼、Git、記憶）。
- `.agents/memory/`：專案長期跨對話記憶庫。
- `.agents/skills/`：專案專用技能包（Onboarding, Worktree 管理, 記憶同步, 驗證執行）。
- `AGENTS.md` / `GEMINI.md`：全域與專案雙憲章。
