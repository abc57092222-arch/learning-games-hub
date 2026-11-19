---
name: verification-runner
description: >-
  Execute automated verification checks on file integrity, UTF-8 encoding
  compliance, Git repository health, and dual-artifact standards.
---

# 驗證執行技能 (Verification Runner)

在完成任務、交付重大功能或初次建立專案基礎設施時，調用本技能以執行自動化健康度與完整度檢測。

## 執行方式

執行驗證腳本：[verify.ps1](./scripts/verify.ps1)

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/verification-runner/scripts/verify.ps1
```

## 檢測項目
1. **Git 倉庫狀態**：確認 `.git` 已初始化、主分支為 `main`、`.gitignore` 與 `.gitattributes` 完備。
2. **專案憲章與規範**：確認 `AGENTS.md`、`GEMINI.md` 及 `.agents/rules/` 各模組規範存在。
3. **記憶架構完整度**：驗證 `MEMORY.md` 與 `.agents/memory/` 下 5 大記憶核心檔案。
4. **專案技能合法性**：驗證所有專案技能資料夾是否包含合規的 `SKILL.md` 及 YAML Frontmatter。
