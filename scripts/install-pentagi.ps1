# ============================================================
#  PentAGI 仓库克隆与提示词提取脚本
#  用于在网络可用时克隆仓库、提取提示词、创建参考技能
#
#  功能：
#    1. 克隆 pentagi 仓库到本地
#    2. 提取 Agent 提示词模板
#    3. 汇总关键文件到 extracted 目录
# ============================================================
$ErrorActionPreference = 'Stop'

$项目根目录 = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$目标目录 = Join-Path $项目根目录 "pentagi"
$技能目录 = Join-Path $项目根目录 ".trae\skills"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║       PentAGI 渗透测试提示词提取工具          ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 第一步：克隆仓库
Write-Host "  [1/4] 克隆 pentagi 仓库..." -ForegroundColor Yellow
if (Test-Path $目标目录) {
    Write-Host "    目录已存在，拉取最新代码..." -ForegroundColor Gray
    Push-Location $目标目录
    git pull
    Pop-Location
} else {
    git clone https://github.com/vxcontrol/pentagi.git $目标目录
}
Write-Host "    完成！仓库路径: $目标目录" -ForegroundColor Green

# 第二步：列出所有提示词模板
Write-Host ""
Write-Host "  [2/4] 提取提示词模板 (backend/pkg/templates/prompts/)" -ForegroundColor Yellow
$模板目录 = Join-Path $目标目录 "backend\pkg\templates\prompts"
if (Test-Path $模板目录) {
    $模板文件 = Get-ChildItem $模板目录 -Filter "*.tmpl"
    Write-Host "    找到 $($模板文件.Count) 个模板文件:" -ForegroundColor Gray
    foreach ($文件 in $模板文件) {
        $大小KB = [math]::Round($文件.Length / 1024, 1)
        Write-Host "      - $($文件.Name) ($大小KB KB)" -ForegroundColor White
    }
}

# 第三步：创建汇总提取
Write-Host ""
Write-Host "  [3/4] 创建提示词汇总..." -ForegroundColor Yellow
$提取目录 = Join-Path $目标目录 "extracted"
New-Item -ItemType Directory -Force -Path $提取目录 | Out-Null

$关键文件 = @(
    "backend\pkg\templates\prompts\pentester.tmpl",
    "backend\pkg\templates\prompts\primary_agent.tmpl",
    "backend\pkg\templates\prompts\adviser.tmpl",
    "backend\pkg\templates\prompts\assistant.tmpl",
    "backend\pkg\templates\prompts\coder.tmpl",
    "backend\pkg\templates\prompts\enricher.tmpl",
    "backend\pkg\templates\prompts\generator.tmpl",
    "backend\pkg\templates\prompts\installer.tmpl",
    "backend\pkg\templates\prompts\memorist.tmpl",
    "backend\pkg\templates\prompts\refiner.tmpl",
    "backend\pkg\templates\prompts\reflector.tmpl",
    "backend\pkg\templates\prompts\reporter.tmpl",
    "backend\pkg\templates\prompts\searcher.tmpl",
    "backend\pkg\templates\prompts\summarizer.tmpl",
    "examples\prompts\base_web_pentest.md",
    "CLAUDE.md",
    "README.md"
)

foreach ($文件 in $关键文件) {
    $源路径 = Join-Path $目标目录 $文件
    $目标子目录 = Join-Path $提取目录 (Split-Path -Parent $文件)
    New-Item -ItemType Directory -Force -Path $目标子目录 | Out-Null
    if (Test-Path $源路径) {
        Copy-Item $源路径 $目标子目录 -Force
        Write-Host "    已复制: $文件" -ForegroundColor Gray
    } else {
        Write-Host "    跳过 (未找到): $文件" -ForegroundColor DarkYellow
    }
}

# 第四步：总结
Write-Host ""
Write-Host "  [4/4] 提取完毕！" -ForegroundColor Green
Write-Host ""
Write-Host "  ══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  总结" -ForegroundColor Cyan
Write-Host "  ══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  仓库位置:     $目标目录" -ForegroundColor White
Write-Host "  提取到:       $提取目录" -ForegroundColor White
Write-Host "  参考技能目录: $技能目录" -ForegroundColor White
Write-Host ""
Write-Host "  已创建的 3 个参考技能:" -ForegroundColor Yellow
Write-Host "    - pentest-methodology   (渗透测试方法论)" -ForegroundColor Gray
Write-Host "    - pentest-agent-system  (多Agent系统架构)" -ForegroundColor Gray
Write-Host "    - pentest-toolchain     (安全工具链)" -ForegroundColor Gray
Write-Host ""
Write-Host "  下一步:" -ForegroundColor Cyan
Write-Host "    1. 查看提取的提示词: $提取目录" -ForegroundColor White
Write-Host "    2. 进入项目目录: cd $目标目录" -ForegroundColor White
Write-Host "    3. 查阅 README.md 了解系统配置说明" -ForegroundColor White
Write-Host ""