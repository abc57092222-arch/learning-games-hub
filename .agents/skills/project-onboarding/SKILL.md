---
name: project-onboarding
description: >-
  Provides rapid project orientation, environment readiness verification, memory
  status check, and architectural alignment for any agent starting work in this repository.
---

# 專案導入與對齊技能 (Project Onboarding Skill)

當代理人進入此專案或開始新的一輪任務時，使用此技能以確保對專案背景、記憶系統、環境規範和協同協議達成一致。

## 導入檢查清單 (Onboarding Checklist)

1. **讀取當前上下文**：
   - 檢視 [.agents/memory/active_context.md](../../memory/active_context.md) 以確認目前正在進行的事項與前一輪對話的交接點。
   - 檢視 [.agents/memory/project_context.md](../../memory/project_context.md) 以理解技術棧與專案哲學。

2. **確認規範與限制**：
   - 遵循根目錄的 [AGENTS.md](../../../AGENTS.md) 與 [GEMINI.md](../../../GEMINI.md)。
   - Windows PowerShell 指令前置：`$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null`。
   - 工具微創原則：修改 < 20 行，> 40% 果斷重寫。

3. **專案級技能清單（`.agents/skills/`）**：
   | 技能名稱 | 用途說明 |
   | :--- | :--- |
   | `project-onboarding` | 新回合上下文對齊與環境檢查清單 |
   | `session-memory-sync` | 同步 `.agents/memory/`、ADR 決策與跨對話交接 |
   | `worktree-manager` | 為多代理人平行作業建立與清理 Git Worktree |
   | `verification-runner` | 驗證 Git、規範、記憶庫、技能衛生與 `npm test` / `build` |
   | `modern-web-guidance` | HTML/CSS/JS 現代 Web 最佳實踐與無障礙查詢 |
   | `learning-game-builder` | 建置、註冊與測試零依賴教學小遊戲的完整開發工作流 |
   | `cloudflare-pages-deploy` | 透過 Wrangler OAuth 將 `dist/` 部署至 Cloudflare Pages |
   | `git-commit-push` | Conventional Commit 驗證、安全檢核與推送至遠端分支 |

4. **核心開發指令（`package.json`）**：
   - `npm run serve`：啟動本機靜態伺服器（`http://127.0.0.1:4173/index.html`）
   - `npm test`：執行 Node 原生測試與各遊戲無頭模擬測試
   - `npm run build`：打包離線雙擊單檔版至 `dist/`
   - `npm run new-game -- <slug> "<標題>" [科目] [年級]`：建立新遊戲骨架並註冊至 `shared/catalog.js`

5. **蜂群作業確認**：
   - 若任務涉及多代理人平行編程，啟用 `worktree-manager` 技能分配獨立工作樹。
