# 專案記憶系統維護與同步協定 (Memory Management Protocol)

## 1. 記憶分層架構
專案記憶存儲於 `.agents/memory/` 目錄中，並由根目錄 `MEMORY.md` 索引：
- **`project_context.md`**：專案目標、核心架構、技術棧與模組依賴。
- **`active_context.md`**：當前正在推進的事項、短期路線圖、未決阻礙。
- **`decisions.md`**：架構決策紀錄 (ADRs: Architecture Decision Records)。
- **`learnings.md`**：環境相容性問題、歷史錯誤修正、使用者特殊偏好。
- **`scratchpad.md`**：即時筆記與暫存構想。

## 2. 記憶讀寫時機
1. **工作階段啟動 (Session Start)**：
   - 檢查 `active_context.md` 以掌握上一個階段完成的事項與本次目標。
2. **架構重大變更 (Major Architecture Decision)**：
   - 在 `decisions.md` 中以標準 ADR 格式記錄決策背景、方案比較與影響。
3. **發生錯誤或使用者校正 (Errors & Corrections)**：
   - 沉澱具體根因與防範手段至 `learnings.md`。
4. **工作階段結束 (Session End)**：
   - 更新 `active_context.md` 中的「已完成」與「下一步」，確保下個工作階段能無縫銜接。
