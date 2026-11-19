---
name: verification-runner
description: >-
  Execute automated verification checks on file integrity, UTF-8 encoding
  compliance, Git repository health, project skill hygiene, and application tests/build.
---

# 驗證執行技能 (Verification Runner)

在完成任務、交付重大功能、提交程式碼或維護專案基礎設施時，調用本技能以執行自動化健康度與完整度檢測。

## 執行方式

執行驗證腳本：[verify.ps1](./scripts/verify.ps1)

```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
powershell -ExecutionPolicy Bypass -File .agents/skills/verification-runner/scripts/verify.ps1
```

若僅需檢測基礎設施與技能合規（跳過 `npm test` 與 `npm run build`）：
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/verification-runner/scripts/verify.ps1 -SkipAppChecks
```

## 檢測項目
1. **Git 倉庫與遠端設定**：確認 `.git` 已初始化、主分支為 `main`、`.gitignore` 與 `.gitattributes` 完備，且已設定 `origin` 遠端。
2. **專案憲章與規範**：確認 `AGENTS.md`、`GEMINI.md` 及 `.agents/rules/` 各模組規範存在。
3. **記憶架構完整度**：驗證 `MEMORY.md` 與 `.agents/memory/` 下 5 大記憶核心檔案。
4. **專案技能合法性與可攜衛生檢查**：
   - 驗證 `.agents/skills/*` 皆含 `SKILL.md` 及完整 YAML Frontmatter（支援單行與多行 `>-` / `|` 描述，且 `name` 必須與資料夾名稱相符）。
   - 確認各技能未受 `.gitignore` 阻擋（可正常納入 Git 追蹤）。
   - 確認 `.agents/skills/` 內不含任何嵌套 `.git` 目錄或檔案，且無個人本機絕對路徑。
5. **應用程式測試與離線建置**（預設執行，可用 `-SkipAppChecks` 跳過）：
   - 執行 `npm test` 確認單元與無頭模擬測試全數通過。
   - 執行 `npm run build` 確認成功產出 `dist/index.html` 與各遊戲離線單檔。
