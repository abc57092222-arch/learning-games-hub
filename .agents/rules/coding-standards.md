# 專案編程與代碼修改準則 (Coding Standards)

## 1. 代碼修改手術刀原則 (Surgical Editing)
- **微創替換（< 20 行）**：調用 `edit_file` 時，替換區間嚴格控制在 20 行以內，且前後各保留 2~3 行唯一識別代碼。
- **大幅重構（> 40% 或 > 80 行）**：直接使用 `write_file` (Overwrite=true) 進行全檔覆寫，避免因縮排、CRLF/LF 差異導致搜尋替換失敗。
- **無冗餘讀取**：禁止反覆讀取同一檔案區塊；每次讀取精算 `StartLine` 與 `EndLine`。

## 2. 跨平台相容性與 Windows 防禦
- **終端輸出編碼**：PowerShell 指令必須附帶 `$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null`。
- **Python 腳本頭部**：加入 `sys.stdout.reconfigure(encoding='utf-8')`。
- **工作目錄絕對錨定**：`run_command` 一律設定絕對路徑 `Cwd`，禁止使用 `cd` 切換目錄。

## 3. 模組化與可讀性
- 遵守單一職責原則 (SRP)，保持檔案小巧且語意明確。
- 如果專案使用 TypeScript，優先使用 Node 原生相容的明確副檔名 import（如 `./module.ts`）。
- 保持純函數與無副作用導向，方便進行無頭自動化測試。
