# 2026-11-20 專案基礎

本專案目錄已全面實施 **Agent 最佳基礎實踐架構**，深度整合 Antigravity / Gemini 多代理人蜂群協同協定，具備完整的專案級技能庫 (Project-Scoped Skills)、持久化記憶庫 (Memory)、模組化規範 (Rules) 以及版本控制防禦機制 (Git Guard)。

---

## 專案架構概覽

```text
.
├── .agents/                               # Antigravity 專案級自定義標準目錄
│   ├── memory/                            # 跨工作階段持久化記憶庫
│   │   ├── active_context.md              # 當前聚焦目標與下一步行動
│   │   ├── decisions.md                   # 架構決策紀錄 (ADR)
│   │   ├── learnings.md                   # 環境特性與踩坑教訓 (Windows 編碼防禦)
│   │   ├── project_context.md             # 專案背景與技術哲學
│   │   └── scratchpad.md                  # 即時暫存記事
│   ├── rules/                             # 模組化規範清單
│   │   ├── coding-standards.md            # 代碼標準與微創手術原則
│   │   ├── git-and-worktrees.md           # 蜂群實體 Worktree 隔離與操作守則
│   │   └── memory-management.md           # 記憶系統維護與同步協定
│   └── skills/                            # 專案專用技能庫 (Project-Scoped Skills)
│       ├── project-onboarding/            # 代理人快速上手與對齊
│       ├── session-memory-sync/           # 會話記憶讀寫與交接
│       ├── verification-runner/           # 自動化基礎設施驗證器
│       └── worktree-manager/              # 蜂群子代理人 Worktree 自動隔離管理
├── .gitattributes                         # Windows CRLF / LF 防禦與換行規範
├── .gitignore                             # 全端、環境與 Agent 忽略規則
├── AGENTS.md                              # 蜂群協同手冊與反偷懶鐵律
├── GEMINI.md                              # 專案運行憲章與極簡 No-Server 標準
├── MEMORY.md                              # 專案記憶導航入口
└── README.md                              # 專案首頁說明文件
```

---

## 快速上手與常用操作

### 1. 執行基礎設施健康度檢查
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/verification-runner/scripts/verify.ps1
```

### 2. 蜂群子代理人 Worktree 隔離操作
```powershell
# 建立子代理人專用 Worktree
powershell -ExecutionPolicy Bypass -File .agents/skills/worktree-manager/scripts/worktree.ps1 -Action add -Branch feat/subagent-task -Path ../wt-subagent-task

# 查看工作樹列表
powershell -ExecutionPolicy Bypass -File .agents/skills/worktree-manager/scripts/worktree.ps1 -Action list

# 清理工作樹
powershell -ExecutionPolicy Bypass -File .agents/skills/worktree-manager/scripts/worktree.ps1 -Action remove -Path ../wt-subagent-task
```

### 3. Windows PowerShell 編碼宣告
執行任何包含非 ASCII 字元之指令前，請宣告：
```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
```
