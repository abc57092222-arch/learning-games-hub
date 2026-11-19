---
name: session-memory-sync
description: >-
  Guide agents on how to read, update, and persist session context, architectural
  decisions (ADRs), and environment learnings across conversation boundaries.
---

# 會話記憶同步技能 (Session Memory Sync)

本技能規範代理人在工作階段開始、關鍵決策點、以及工作階段結束時，如何維持專案記憶庫的一致性與延續性。

## 執行流程

### 步驟 1：開工前同步 (Pre-flight Context Check)
1. 讀取 [.agents/memory/active_context.md](../../memory/active_context.md)。
2. 確認前序工作階段遺留的未完成任務（Next Steps）與潛在阻礙。

### 步驟 2：過程沉澱 (In-flight Persistence)
- **重大架構選型**：
  在 [.agents/memory/decisions.md](../../memory/decisions.md) 依 ADR 格式記錄：
  - ADR 編號與標題
  - 日期與狀態 (Proposed / Accepted / Superseded)
  - 背景、決策內容與正面/負面影響
- **環境問題與修正**：
  若遇到 Windows 編碼、工具報錯或使用者修正，即時更新 [.agents/memory/learnings.md](../../memory/learnings.md)。

### 步驟 3：收尾交接 (Hand-off Checkpoint)
在完成主要任務或對話即將告一段落時：
1. 更新 `active_context.md`：
   - 將已完成的事項移至「最近完成 (Recently Completed)」。
   - 明確寫下「下一步 (Next Steps)」供下一回合代理人無縫接軌。
2. 清理 `scratchpad.md` 中的過期雜項。
