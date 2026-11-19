# Git 與蜂群工作樹操作守則 (Git & Swarm Worktrees)

## 1. 分支與 Worktree 隔離原則
- 當有多個子代理人並行編碼時，必須指派獨立的 Git Worktree，避免在同一個目錄發生檔案競爭與覆蓋。
- 專案根目錄為協調整合區與主分支 `main`。
- 子代理人工作樹命名範式：`../wt-<feature-name>`，對應分支 `feat/<feature-name>`。

## 2. Worktree 常用命令參考
```powershell
# 建立新工作樹並切換到新分支
git worktree add -b feat/feature-x ../wt-feature-x main

# 列出所有活躍工作樹
git worktree list

# 完成後移除工作樹
git worktree remove ../wt-feature-x
git worktree prune
```
或直接調用本專案專屬技能：`worktree-manager` 的自動化腳本。

## 3. 提交與推送守則
- 每個功能單元保持原子化提交 (Atomic Commits)，遵循 Conventional Commits 格式。
- 提交前必須通過語法、測試與技能衛生驗證，嚴禁將未經驗證、含敏感資訊或 `dist/` 建置產物推入主分支。
- `.agents/skills/` 內嚴禁存在任何嵌套 `.git` 目錄/檔案或個人本機絕對路徑，確保所有專案技能可完整受 Git 追蹤並跨環境重現。
- 推薦統一使用專案技能 `git-commit-push`（`.agents/skills/git-commit-push/scripts/git-commit-push.ps1`）進行驗證、提交與推送（支援 `-DryRun` 預覽，且嚴禁 `--force` 推送）。
