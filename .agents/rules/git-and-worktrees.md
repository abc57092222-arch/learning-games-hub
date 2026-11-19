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

## 3. 提交守則
- 每個功能單元保持原子化提交 (Atomic Commits)。
- 提交前必須進行語法與格式驗證，嚴禁將未經驗證或編譯錯誤的代碼推入主分支。
