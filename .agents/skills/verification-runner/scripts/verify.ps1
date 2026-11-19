<#
.SYNOPSIS
    Automated Agent Repository Baseline & Health Verification.
.DESCRIPTION
    Validates Git repository setup, Rules, Memory, Skills structure, and YAML frontmatter.
#>

$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

$script:passed = 0
$script:failed = 0

function Assert-Condition {
    param (
        [string]$Name,
        [bool]$Condition,
        [string]$Details = ""
    )
    if ($Condition) {
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        if ($Details) {
            Write-Host "         $Details" -ForegroundColor Yellow
        }
        $script:failed++
    }
}

Write-Host "=== 1. Git Repository & Configuration Checks ===" -ForegroundColor Cyan
$isGit = Test-Path -Path ".git"
Assert-Condition -Name "Git repository initialized" -Condition $isGit
$gitBranch = (git branch --show-current) 2>$null
Assert-Condition -Name "Git branch is 'main'" -Condition ($gitBranch -eq "main") "Current branch: $gitBranch"
$hasGitIgnore = Test-Path -Path ".gitignore"
Assert-Condition -Name ".gitignore exists" -Condition $hasGitIgnore
$hasGitAttr = Test-Path -Path ".gitattributes"
Assert-Condition -Name ".gitattributes exists" -Condition $hasGitAttr

Write-Host "`n=== 2. Root Charters & Rules Checks ===" -ForegroundColor Cyan
$hasAgentsMd = Test-Path -Path "AGENTS.md"
Assert-Condition -Name "Root AGENTS.md exists" -Condition $hasAgentsMd
$hasGeminiMd = Test-Path -Path "GEMINI.md"
Assert-Condition -Name "Root GEMINI.md exists" -Condition $hasGeminiMd

$ruleFiles = @(
    ".agents/rules/coding-standards.md",
    ".agents/rules/git-and-worktrees.md",
    ".agents/rules/memory-management.md"
)
foreach ($r in $ruleFiles) {
    Assert-Condition -Name "Rule file exists: $r" -Condition (Test-Path -Path $r)
}

Write-Host "`n=== 3. Memory Architecture Checks ===" -ForegroundColor Cyan
$hasMemoryMd = Test-Path -Path "MEMORY.md"
Assert-Condition -Name "Root MEMORY.md exists" -Condition $hasMemoryMd

$memoryFiles = @(
    ".agents/memory/project_context.md",
    ".agents/memory/active_context.md",
    ".agents/memory/decisions.md",
    ".agents/memory/learnings.md",
    ".agents/memory/scratchpad.md"
)
foreach ($m in $memoryFiles) {
    Assert-Condition -Name "Memory file exists: $m" -Condition (Test-Path -Path $m)
}

Write-Host "`n=== 4. Project-Scoped Skills Validation ===" -ForegroundColor Cyan
$skillDirs = Get-ChildItem -Path ".agents/skills" -Directory -ErrorAction SilentlyContinue
Assert-Condition -Name "Project-scoped skills found" -Condition ($skillDirs.Count -ge 4) "Found $($skillDirs.Count) skills"

foreach ($skill in $skillDirs) {
    $skillMdPath = Join-Path $skill.FullName "SKILL.md"
    $hasSkillMd = Test-Path $skillMdPath
    Assert-Condition -Name "Skill $($skill.Name): SKILL.md exists" -Condition $hasSkillMd
    
    if ($hasSkillMd) {
        $content = Get-Content -Path $skillMdPath -Raw -Encoding utf8
        $hasFrontmatter = $content -match '^---\s*[\r\n]+name:\s*([^\r\n]+)[\r\n]+description:\s*([^\r\n>]+|>-[^\r\n]*)'
        Assert-Condition -Name "Skill $($skill.Name): valid YAML frontmatter" -Condition $hasFrontmatter
    }
}

Write-Host "`n=== Verification Summary ===" -ForegroundColor Cyan
Write-Host "Passed: $script:passed" -ForegroundColor Green
$failColor = "Red"
if ($script:failed -eq 0) { $failColor = "Green" }
Write-Host "Failed: $script:failed" -ForegroundColor $failColor

if ($script:failed -gt 0) {
    exit 1
} else {
    Write-Host "`nAll Agent Foundation checks passed successfully!" -ForegroundColor Green
    exit 0
}
