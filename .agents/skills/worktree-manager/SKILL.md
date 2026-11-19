---
name: worktree-manager
description: >-
  Automate creating, listing, checking, and cleaning up Git Worktrees for swarm workers
  to ensure physical isolation and prevent concurrent write collisions.
---

# 蜂群工作樹管理技能 (Worktree Manager)

當需要啟動 2 個或更多子代理人平行編程時，使用本技能為每個子代理人配置獨立的工作樹（Worktree），徹底防止並行檔案覆蓋與衝突。

## 核心命令與腳本調度

腳本路徑：[worktree.ps1](./scripts/worktree.ps1)

### 1. 建立獨立工作樹
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/worktree-manager/scripts/worktree.ps1 -Action add -Branch feat/subagent-task -Path ../wt-subagent-task
```

### 2. 檢視現有工作樹清單
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/worktree-manager/scripts/worktree.ps1 -Action list
```

### 3. 清理已合併之工作樹
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/worktree-manager/scripts/worktree.ps1 -Action remove -Path ../wt-subagent-task
```

## 注意事項
- 子代理人只能在被分配的 Worktree 目錄中執行編輯與命令。
- 工作樹通常建立在專案父層（例如 `../wt-<名稱>`），避免被誤加入主專案目錄。
