# 互動教學遊戲實驗室（Learning Games Hub）

本專案採用 **Zero-Server / Offline-First 模組化多遊戲架構**，共用設計令牌、音訊引擎與無障礙彈窗元件置於 `shared/`，各教學遊戲獨立封裝於 `games/<slug>/`，並可透過一鍵打包腳本產出全離線單檔 HTML。

---

## 目錄架構總覽

```text
.
├── index.html                                # 互動教學遊戲大廳（學科篩選、關鍵字搜尋、星數總覽）
├── package.json                              # 專案指令（test / build / serve / new-game）
├── shared/                                   # 跨遊戲共用核心層
│   ├── catalog.js                            # 遊戲登錄目錄（名稱、科目、年級、路徑、星數設定）
│   ├── hub.js                                # 大廳搜尋與卡片渲染控制器
│   ├── audio/soundEngine.js                  # 零資源 Web Audio API 程序化音效引擎
│   ├── ui/dialogHelper.js                    # 原生 <dialog> 無障礙與頂層動畫降級輔助
│   ├── styles/
│   │   ├── tokens.css                        # 全域設計變數、按鈕互動態、焦點環、彈窗基礎樣式
│   │   └── hub.css                           # 遊戲大廳響應式卡片網格樣式
│   └── tests/catalog.test.js                 # 目錄與 games/*/game.json 一致性驗證
├── games/                                    # 各獨立教學遊戲目錄
│   └── linear-systems/                       # 雙天平偵探：二元一次聯立方程式列式實驗室
│       ├── game.json                         # 遊戲自描述清單（供自動打包器讀取）
│       ├── index.html                        # 遊戲入口頁（含回遊戲大廳導覽）
│       ├── src/                              # 遊戲專屬數學引擎、關卡資料與視覺元件
│       └── tests/                            # 遊戲專屬無頭自動化測試
├── scripts/
│   ├── build.mjs                             # 自動掃描 games/*/game.json 打包至 dist/
│   ├── serve.mjs                             # 本機靜態開發伺服器
│   └── new-game.mjs                          # 新遊戲快速腳手架產生器
└── dist/                                     # （Git 忽略）離線單檔發布產物（雙擊即可玩）
```

---

## 常用指令

### 1. 啟動本機開發預覽
```powershell
npm run serve
```
開啟 `http://127.0.0.1:4173/index.html` 即可瀏覽遊戲大廳並進入各款教學遊戲。

### 2. 執行全站與所有遊戲測試
```powershell
npm test
```
自動執行 `shared/tests/` 目錄一致性驗證與 `games/*/tests/` 內的所有無頭模擬測試。

### 3. 打包成離線雙擊單檔版（`dist/`）
```powershell
npm run build
```
輸出 `dist/index.html` 與每個遊戲的 `dist/games/<slug>/index.html`。

### 4. 快速新增一款新教學遊戲
```powershell
npm run new-game -- pythagorean-lab "畢氏定理拼圖實驗室" "數學" "國中八年級"
```
會自動在 `games/pythagorean-lab/` 建立合規起始架構（含 `game.json`、`index.html`、`src/`、`tests/`），並自動登錄進 `shared/catalog.js`！

### 5. 基礎設施健康度驗證與 Windows 編碼宣告
```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
powershell -ExecutionPolicy Bypass -File .agents/skills/verification-runner/scripts/verify.ps1
```

---

## 專案級技能（`.agents/skills/`）

專案所有常用 AI 代理人工作流已內建為受 Git 追蹤的專案級技能：
- `project-onboarding`：專案導入、規範對齊與開發指令速查
- `session-memory-sync`：跨對話記憶庫（`.agents/memory/`）與 ADR 決策維護
- `worktree-manager`：多代理人並行開發的 Git Worktree 管理
- `verification-runner`：Git、規範、技能衛生檢查與 `npm test` / `npm run build` 驗證
- `modern-web-guidance`：現代 Web HTML/CSS/DOM 最佳實踐查詢指南
- `learning-game-builder`：互動教學小遊戲建立、IIFE 打包規範與無頭測試流程
- `cloudflare-pages-deploy`：透過 Wrangler OAuth 部署 `dist/` 至 Cloudflare Pages
- `git-commit-push`：自動化 Conventional Commit 驗證、安全檢核與推送遠端

使用 `git-commit-push` 一鍵驗證、提交並推送至遠端範例：
```powershell
$env:PYTHONIOENCODING="utf-8"; chcp 65001 | Out-Null
powershell -ExecutionPolicy Bypass -File .agents/skills/git-commit-push/scripts/git-commit-push.ps1 -Message "feat: describe your change" -Paths @(".agents", "README.md")
```
