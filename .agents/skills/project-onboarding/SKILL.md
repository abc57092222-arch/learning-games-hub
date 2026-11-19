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

3. **蜂群作業確認**：
   - 若任務涉及多代理人平行編程，啟用 `worktree-manager` 技能分配獨立工作樹。
