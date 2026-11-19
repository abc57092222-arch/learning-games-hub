# 歷史教訓與環境踩坑記錄 (Learnings & Corrections)

本文件沉澱跨階段累積的環境特性、踩坑經歷與使用者校正規則。

---

## 1. Windows PowerShell 編碼天塹 (CP950 vs UTF-8)
- **現象**：執行 Python 指令或批次腳本時，遇到包含中文、日文符號或引號時觸發 `UnicodeEncodeError`。
- **解法**：終端命令開頭必須強制包含：
  ```powershell
  $env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
  ```
- **Python 腳本通用守則**：加入 `sys.stdout.reconfigure(encoding='utf-8')`。

## 2. 檔案替換字元不匹配 (48% 錯誤根因)
- **現象**：調用 `edit_file` 時因縮排、跨行換行符號（CRLF vs LF）不匹配導致替換失敗。
- **解法**：
  1. 使用 `.gitattributes` 強制宣告 `* text=auto eol=lf`。
  2. 微創手術原則：單次編輯範圍 < 20 行，保留上下 2~3 行唯一識別代碼。
  3. 若改動範圍 > 40% 或涉及多處改寫，果斷切換為 `write_file` (Overwrite=true) 全檔覆寫。

## 3. 防禦性重複讀取冗餘 (3.89:1 讀寫比)
- **現象**：反覆重複閱讀相同代碼區塊浪費 Token 與 Context 空間。
- **解法**：修改前精算行號範圍，修改後若需檢查僅針對性查看，嚴禁全檔反覆空轉讀取。

## 4. Windows PowerShell 5.1 vs 7 語法相容性
- **現象**：Windows PowerShell 5.1 (預設引擎) 不支援 PowerShell 7+ 的三元運算子 `($cond ? $a : $b)`，會拋出 `Unexpected token '?'`。
- **解法**：在 `.ps1` 輔助腳本中一律使用標準 `if ($cond) { ... } else { ... }` 語法，確保在純原生 Windows 10/11 預設 PowerShell 5.1 與 PowerShell 7 均能無縫執行。
