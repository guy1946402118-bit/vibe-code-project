# ============================================================
#  Agency Agents 安装脚本
#  状态：已安装（截至 2026-05-12，共 257 个技能）
#
#  来源说明：
#    内置 (Trae/Claude Code): ~30 个技能
#    Agency Agents (本脚本):  ~215 个技能 (已安装)
#    PentAGI (手动安装):        3 个技能 (已安装)
#    MetaGPT (手动安装):        3 个技能 (已安装)
#
#  如需重新安装：
#    1. git clone https://github.com/msitarzewski/agency-agents.git $env:TEMP\agency-agents
#    2. 运行本脚本
#
#  技能管理: .\scripts\skills.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
$仓库路径 = "$env:TEMP\agency-agents"
$目标路径 = Join-Path $PSScriptRoot "..\.trae\skills"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║        Agency Agents 技能安装工具            ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  注意：技能已安装。仅当需要从新克隆重新安装时才运行。" -ForegroundColor Yellow
Write-Host "  源路径: $仓库路径" -ForegroundColor Gray
Write-Host "  目标:   $目标路径" -ForegroundColor Gray
Write-Host ""

$跳过目录 = @('scripts','examples','integrations','.github')
$跳过文件 = @('README.md','EXECUTIVE-BRIEF.md','QUICKSTART.md','nexus-strategy.md','CONTRIBUTING.md','CONTRIBUTING_zh-CN.md','SECURITY.md')

$全部文件 = Get-ChildItem -Path $仓库路径 -Recurse -Filter "*.md" | Where-Object {
    $目录 = $_.DirectoryName
    $通过 = $true
    foreach ($排除 in $跳过目录) { if ($目录 -match "\\$排除\\" -or $目录 -match "\\$排除$") { $通过 = $false; break } }
    if ($_.Name -in $跳过文件) { $通过 = $false }
    $通过
}

Write-Host "  找到 $($全部文件.Count) 个 Agent 文件" -ForegroundColor Green
Write-Host ""

$已安装 = 0
$已跳过 = 0

foreach ($文件 in $全部文件) {
    $相对路径 = $文件.FullName.Substring($仓库路径.Length + 1)
    
    $分类 = Split-Path -Parent $相对路径
    if ($分类 -match '\\') { $分类 = Split-Path -Leaf $分类 }
    
    $基础名 = [IO.Path]::GetFileNameWithoutExtension($文件.Name)
    $前缀列表 = @('engineering','design','product','marketing','sales','finance','strategy','project-management','support','testing','academic','game-development','spatial-computing','specialized','paid-media')
    $技能名 = $基础名
    foreach ($前缀 in $前缀列表) {
        if ($技能名 -match "^$前缀-") {
            $技能名 = $技能名.Substring($前缀.Length + 1)
            break
        }
    }
    
    $内容 = Get-Content $文件.FullName -Raw -Encoding UTF8
    
    if ($内容.Length -lt 100) {
        Write-Host "  跳过 (太小): $相对路径" -ForegroundColor DarkGray
        $已跳过++
        continue
    }
    
    $行列表 = $内容 -split "`n"
    $标题 = ""
    
    foreach ($行 in $行列表) {
        $清理 = $行.Trim()
        if ($清理 -match '^# (.+)') {
            $标题 = $matches[1].Trim()
            if ($标题.Length -gt 100) { $标题 = $标题.Substring(0, 97) + '...' }
            break
        }
    }
    
    if ($标题 -eq "") { $标题 = $技能名 }
    $标题 = $标题 -replace '"', "'"
    
    $简要描述 = $技能名 -replace '-', ' '
    $描述 = "Agent: $标题. 分类: $分类. 当用户提到 $简要描述 时使用。"
    if ($描述.Length -gt 250) { $描述 = $描述.Substring(0, 247) + '...' }
    
    $新内容 = "---`n名称: $技能名`n描述: $描述`n---`n`n" + $内容
    
    $技能目录 = Join-Path $目标路径 $技能名
    New-Item -ItemType Directory -Force -Path $技能目录 | Out-Null
    
    $输出文件 = Join-Path $技能目录 "SKILL.md"
    [IO.File]::WriteAllText($输出文件, $新内容, [Text.Encoding]::UTF8)
    
    $已安装++
    if ($已安装 % 20 -eq 0) { Write-Host "  已安装 $已安装 个..." -ForegroundColor Gray }
}

Write-Host ""
Write-Host "  ══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "  已安装: $已安装 个" -ForegroundColor White
Write-Host "  已跳过: $已跳过 个" -ForegroundColor Gray
Write-Host ""