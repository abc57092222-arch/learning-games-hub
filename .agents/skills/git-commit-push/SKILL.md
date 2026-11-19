---
name: git-commit-push
description: >-
  Safely validate, stage, create Conventional Commits, and push changes to the Git remote
  on Windows without force-pushing, committing secrets/build artifacts, or leaving nested
  .git directories inside project skills.
---

# Git 提交與推送技能 (Git Commit & Push)

當需要將專案變更（程式碼、文件、記憶庫或 `.agents/skills/`）提交至 Git 並推送到遠端倉庫（如 `origin/main`）時使用本技能。

## 前置條件
1. 確認處於有效的 Git 倉庫與明確分支（不可為 detached HEAD）。
2. 確認遠端倉庫已設定（預設為 `origin`）且具備推送認證權限。
3. 提交訊息必須遵循 **Conventional Commits** 格式：
   `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `perf:`, `ci:`, `build:`（可附帶 `(scope)` 或 `!`）。

## 自動化執行腳本

腳本路徑：[git-commit-push.ps1](./scripts/git-commit-push.ps1)

### 1. 先行預覽檢查（Dry-Run，不修改 Git 索引）
```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
powershell -ExecutionPolicy Bypass -File .agents/skills/git-commit-push/scripts/git-commit-push.ps1 -Message "feat: add new educational game" -Paths @(".agents", "README.md") -DryRun
```

### 2. 指定路徑提交並推送至遠端
```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
powershell -ExecutionPolicy Bypass -File .agents/skills/git-commit-push/scripts/git-commit-push.ps1 -Message "feat: consolidate core project-scoped skills and add git-commit-push workflow" -Paths @(".agents", "README.md")
```

### 3. 提交全部變更並推送（`git add -A`）
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/git-commit-push/scripts/git-commit-push.ps1 -Message "chore: update hub assets" -All
```

### 4. 常用旗標說明
| 參數 | 說明 |
| :--- | :--- |
| `-Message`（必填） | Conventional Commits 提交訊息（以 UTF-8 無 BOM 寫入暫存檔交由 Git 讀取，防止中文亂碼） |
| `-Paths` | 指定要暫存的路徑陣列；未傳入且未指定 `-All` 時，僅提交目前已暫存的變更 |
| `-All` | 暫存所有工作樹變更（`git add -A`） |
| `-Remote` | 遠端名稱，預設為 `origin` |
| `-Branch` | 目標分支，預設自動偵測目前分支 |
| `-NoPush` | 僅建立本機 Commit，不執行 `git push` |
| `-SkipVerify` | 跳過呼叫 `verification-runner`（僅限特殊情況） |
| `-DryRun` | 僅執行驗證與預覽輸出，不改動索引或建立 Commit |

## 內建安全護欄
1. **禁止嵌套倉庫與子模組誤提交**：掃描 `.agents/skills` 是否含 `.git`，並於暫存區阻擋 mode `160000` gitlink。
2. **禁止機密與建置產物入庫**：阻擋 `.env*`、`*.pem`、`*.key`、`*.pfx`、`*.cert` 與 `dist/` 路徑被提交。
3. **提交前全量驗證**：預設先執行 `.agents/skills/verification-runner/scripts/verify.ps1`，通過後才提交。
4. **安全推送與遠端校驗**：一律使用 `git push -u <remote> <branch>`（嚴禁 `--force`），推送後比對 `git rev-parse HEAD` 與 `git ls-remote` 確認遠端 SHA 一致。

## 推送後驗證
```powershell
git status
git show --stat --summary HEAD
git ls-remote --heads origin main
```
