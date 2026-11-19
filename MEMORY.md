# 專案記憶系統索引 (Project Memory Index)

歡迎閱讀本專案持久化記憶庫。本記憶架構旨在提供跨對話、跨代理人蜂群的上下文延續能力。

## 記憶目錄導航

| 檔案 | 職責與用途 | 檢索與維護時機 |
| :--- | :--- | :--- |
| [project_context.md](file:///d:/GitDev/2026-11-20/.agents/memory/project_context.md) | 專案基本定位、架構總覽、技術選型與核心概念 | 當代理人需了解專案全局脈絡時閱讀 |
| [active_context.md](file:///d:/GitDev/2026-11-20/.agents/memory/active_context.md) | 當前衝刺目標、進行中工作、阻礙與下一步路線圖 | 每次工作階段起始與結束時檢視並更新 |
| [decisions.md](file:///d:/GitDev/2026-11-20/.agents/memory/decisions.md) | 架構決策紀錄 (ADRs: Architecture Decision Records) | 進行技術選型、規格變更或新增核心模組時查閱與追加 |
| [learnings.md](file:///d:/GitDev/2026-11-20/.agents/memory/learnings.md) | 環境相容性、錯誤教訓、使用者指導與防禦清單 | 遇到報錯、環境配置或排查異常前優先查詢 |
| [scratchpad.md](file:///d:/GitDev/2026-11-20/.agents/memory/scratchpad.md) | 暫存筆記、即時思考歷程與臨時數據輸出 | 任務進行中的即時塗鴉板 |

---

## 記憶操作建議
- 專案已配備專案級技能 `session-memory-sync`，可快速調度以更新記憶庫。
- 記憶庫應維持簡潔扼要，避免過度膨脹，重點記錄「為什麼（Why）」與「最新狀態（Current State）」。
