﻿﻿﻿﻿﻿# ============================================================
#  GrowthDashboard 技能管理中心 v4.0
#  257 个技能 | 4 个来源 | 12 个分类
#
#  使用方式：
#    .\scripts\skills.ps1              # 交互菜单
#    .\scripts\skills.ps1 列表         # 列出所有分类
#    .\scripts\skills.ps1 列表 开发    # 列出开发相关技能
#    .\scripts\skills.ps1 统计         # 统计信息
#    .\scripts\skills.ps1 搜索 <关键词> # 搜索技能
# ============================================================

$技能目录 = Join-Path $PSScriptRoot "..\.trae\skills"

$全部分类 = @{
    "gitnexus" = @{
        名称 = "[代码智能] GitNexus"
        描述 = "代码图谱分析、影响评估、重构导航"
        技能 = @("gitnexus-cli", "gitnexus-debugging", "gitnexus-exploring", "gitnexus-guide", "gitnexus-impact-analysis", "gitnexus-refactoring")
    }
    "understand" = @{
        名称 = "[知识图谱] Understand"
        描述 = "代码库理解、知识图谱可视化"
        技能 = @("understand", "understand-chat", "understand-dashboard", "understand-diff", "understand-domain", "understand-explain", "understand-knowledge", "understand-onboard")
    }
    "dev-core" = @{
        名称 = "[开发] 核心工具"
        描述 = "代码审查、TDD、重构、诊断"
        技能 = @("caveman", "code-simplifier", "code-reviewer", "design-an-interface", "diagnose", "grill-me", "grill-with-docs", "improve-codebase-architecture", "karpathy-guidelines", "karpathy-perspective", "mcp-builder", "migrate-to-shoehorn", "prototype", "qa", "real-flip", "request-refactor-plan", "review", "scaffold-exercises", "setup-matt-pocock-skills", "setup-pre-commit", "tdd", "handoff", "handoff-templates", "zoom-out", "ubiquitous-language", "coach", "discovery-coach", "reality-checker", "whimsy-injector", "master-orchestrator")
    }
    "documents" = @{
        名称 = "[文档] 办公文件"
        描述 = "Word、Excel、PPT、PDF"
        技能 = @("docx", "pdf", "pptx", "xlsx")
    }
    "writing" = @{
        名称 = "[写作] 内容与编辑"
        描述 = "文章创作、叙事结构、编辑润色"
        技能 = @("edit-article", "write-a-skill", "writing-beats", "writing-fragments", "writing-shape", "skill-creator", "find-skills", "frontend-design", "document-generator")
    }
    "project" = @{
        名称 = "[项目管理]"
        描述 = "PRD、Issue、Sprint 管理"
        技能 = @("to-issues", "to-prd", "triage", "git-guardrails-claude-code", "git-workflow-master", "jira-workflow-steward", "sprint-prioritizer", "project-manager-senior", "project-shepherd", "manager", "obsidian-vault", "executive-summary-generator", "phase-0-discovery", "phase-1-strategy", "phase-2-foundation", "phase-3-build", "phase-4-hardening", "phase-5-launch", "phase-6-operate")
    }
    "pentest" = @{
        名称 = "[安全] 渗透测试 (PentAGI)"
        描述 = "安全测试方法论、多 Agent 架构、工具链"
        技能 = @("pentest-methodology", "pentest-agent-system", "pentest-toolchain")
    }
    "metagpt" = @{
        名称 = "[架构] MetaGPT 多智能体"
        描述 = "角色协作、SOP 工作流、Action 系统"
        技能 = @("metagpt-architecture", "metagpt-role-action", "metagpt-sop")
    }
    "engineering" = @{
        名称 = "[工程] 开发与游戏"
        描述 = "前端/后端/运维/安全/数据库/游戏/XR"
        技能 = @("ai-engineer", "api-tester", "backend-architect", "cms-developer", "database-optimizer", "data-engineer", "data-consolidation-agent", "data-extraction-agent", "devops-automator", "embedded-firmware-engineer", "engineer", "frontend-developer", "infrastructure-maintainer", "lsp-index-engineer", "minimal-change-engineer", "mobile-app-builder", "performance-benchmarker", "security-engineer", "senior-developer", "software-architect", "solidity-smart-contract-engineer", "blockchain-security-auditor", "sre", "test-results-analyzer", "threat-detection-engineer", "terminal-integration-specialist", "voice-ai-integration-engineer", "workflow-architect", "workflow-optimizer", "ai-data-remediation-engineer", "automation-governance-architect", "autonomous-optimization-architect", "blender-addon-engineer", "codebase-onboarding-engineer", "developer-advocate", "godot-gameplay-scripter", "godot-multiplayer-engineer", "godot-shader-developer", "level-designer", "game-designer", "game-audio-engineer", "narrative-designer", "technical-artist", "unity-architect", "unity-editor-tool-developer", "unity-multiplayer-engineer", "unreal-multiplayer-architect", "unreal-systems-engineer", "unreal-technical-artist", "unreal-world-builder", "macos-spatial-metal-engineer", "visionos-spatial-engineer", "xr-cockpit-interaction-specialist", "xr-immersive-developer", "xr-interface-architect", "filament-optimization-specialist", "roblox-avatar-creator", "roblox-experience-designer", "roblox-systems-scripter", "tracking-specialist", "rapid-prototyper", "video-optimization-specialist", "image-prompt-engineer", "agent-activation-prompts", "email-intelligence-engineer", "accessibility-auditor", "salesforce-architect")
    }
    "business" = @{
        名称 = "[商业] 战略与运营"
        描述 = "营销/销售/财务/HR/法务/运营/设计"
        技能 = @("account-strategist", "anthropologist", "app-store-optimizer", "baidu-seo-specialist", "behavioral-nudge-engine", "bilibili-content-strategist", "brand-guardian", "carousel-growth-engine", "china-ecommerce-operator", "china-market-localization-strategist", "content-creator", "creative-strategist", "cross-border-ecommerce", "cultural-intelligence-strategist", "customer-service", "deal-strategist", "douyin-strategist", "evidence-collector", "experiment-tracker", "feedback-synthesizer", "feishu-integration-developer", "finance-tracker", "financial-analyst", "fpa-analyst", "french-consulting-market", "geographer", "growth-hacker", "healthcare-customer-service", "healthcare-marketing-compliance", "historian", "hospitality-guest-services", "hr-onboarding", "instagram-curator", "investment-researcher", "korean-business-navigator", "kuaishou-strategist", "language-translator", "legal-billing-time-tracking", "legal-client-intake", "legal-compliance-checker", "legal-document-review", "linkedin-content-creator", "livestream-commerce-coach", "loan-officer-assistant", "outbound-strategist", "outreach", "paid-social-strategist", "pipeline-analyst", "podcast-strategist", "ppc-strategist", "private-domain-operator", "programmatic-buyer", "proposal-strategist", "psychologist", "real-estate-buyer-seller", "recruitment-specialist", "reddit-community-builder", "retail-customer-returns", "search-query-analyst", "seo-specialist", "short-video-editing-coach", "social-media-strategist", "studio-operations", "studio-producer", "study-abroad-advisor", "supply-chain-strategist", "tiktok-strategist", "trend-researcher", "twitter-engager", "ui-designer", "ux-architect", "ux-researcher", "visual-storyteller", "wechat-mini-program-developer", "wechat-official-account", "weibo-strategist", "xiaohongshu-specialist", "zhihu-strategist", "government-digital-presales-consultant", "report-distribution-agent", "analytics-reporter", "agentic-identity-trust", "agentic-search-optimizer", "ethical-ai-governance", "llm-pipeline-architect", "localization-specialist", "platform-architect", "platform-engineer", "rag-implementer", "spec-workflow-orchestrator", "tooling-manager")
    }
}

# ============================================================
#  快速任务定义（在对话中说需求即可触发）
# ============================================================
$快速任务 = @{
    "0" = @{
        名称 = "分析代码"
        描述 = "理解架构、解释模块"
        触发词 = "帮我分析一下 XXX 是怎么工作的"
        技能链 = "zoom-out -> gitnexus-exploring -> understand-explain"
    }
    "1" = @{
        名称 = "修复 Bug"
        描述 = "代码报错、功能异常"
        触发词 = "帮我修复这个 Bug：[描述问题]"
        技能链 = "karpathy-guidelines -> gitnexus-debugging -> diagnose"
    }
    "2" = @{
        名称 = "开发新功能"
        描述 = "添加功能、页面或 API"
        触发词 = "帮我开发 [功能描述]"
        技能链 = "karpathy-guidelines -> grill-me -> tdd"
    }
    "3" = @{
        名称 = "重构代码"
        描述 = "重命名、拆分模块、结构优化"
        触发词 = "帮我重构 XXX：[做什么]"
        技能链 = "gitnexus-impact-analysis -> improve-codebase-architecture -> gitnexus-refactoring"
    }
    "4" = @{
        名称 = "项目管理"
        描述 = "PRD、Issue、任务拆分"
        触发词 = "帮我写一个 PRD：[需求描述]"
        技能链 = "triage -> to-prd -> grill-with-docs -> to-issues"
    }
    "5" = @{
        名称 = "写文章"
        描述 = "博客、技术文档、内容创作"
        触发词 = "帮我写/编辑：[文章主题]"
        技能链 = "writing-fragments -> writing-beats -> writing-shape -> edit-article"
    }
    "6" = @{
        名称 = "渗透测试"
        描述 = "Web 安全测试、漏洞扫描"
        触发词 = "帮我做渗透测试：[目标描述]"
        技能链 = "pentest-methodology -> pentest-agent-system -> pentest-toolchain"
    }
    "7" = @{
        名称 = "多智能体设计"
        描述 = "多角色协作架构设计"
        触发词 = "帮我设计多智能体系统：[需求]"
        技能链 = "metagpt-architecture -> metagpt-role-action -> metagpt-sop"
    }
}

# ============================================================
#  工具函数
# ============================================================
function 获取全部技能 {
    $列表 = @()
    if (Test-Path $技能目录) {
        $文件夹 = Get-ChildItem $技能目录 -Directory -ErrorAction SilentlyContinue
        foreach ($d in $文件夹) {
            $有MD = Test-Path (Join-Path $d.FullName "SKILL.md")
            $列表 += @{ 名称 = $d.Name; 有说明 = $有MD; 路径 = $d.FullName }
        }
    }
    return $列表
}

function 查找技能分类($技能名) {
    foreach ($cat in $全部分类.Keys) {
        if ($技能名 -in $全部分类[$cat].技能) { return $cat }
    }
    return "未归类"
}

function 显示横幅 {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║     GrowthDashboard 技能管理中心 v4.0        ║" -ForegroundColor Cyan
    Write-Host "  ╠══════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "  ║  257 个技能 | 12 个分类 | 4 个来源            ║" -ForegroundColor Cyan
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function 显示主菜单 {
    显示横幅
    Write-Host "  💡 快速任务（直接在对话中说触发词即可自动激活）" -ForegroundColor Yellow
    Write-Host ""
    foreach ($key in ($快速任务.Keys | Sort-Object)) {
        $t = $快速任务[$key]
        Write-Host "  $key. $($t.名称)" -ForegroundColor Green
        Write-Host "     描述: $($t.描述)" -ForegroundColor Gray
        Write-Host "     链: $($t.技能链)" -ForegroundColor DarkGray
        Write-Host ""
    }
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  分类. 浏览技能分类" -ForegroundColor Yellow
    Write-Host "  搜索. 搜索技能" -ForegroundColor Yellow
    Write-Host "  来源. 按来源浏览" -ForegroundColor Yellow
    Write-Host "  脚本. 安装脚本" -ForegroundColor Yellow
    Write-Host "  退出. 关闭" -ForegroundColor Red
    Write-Host ""
}

function 显示分类 {
    显示横幅
    Write-Host "  技能分类统计" -ForegroundColor Yellow
    Write-Host ""

    $全部 = 获取全部技能
    $已归类 = @{}
    $未归类 = @()
    foreach ($s in $全部) {
        $cat = 查找技能分类 $s.名称
        if ($cat -eq "未归类") { $未归类 += $s.名称 }
        else {
            if (-not $已归类.ContainsKey($cat)) { $已归类[$cat] = @() }
            $已归类[$cat] += $s.名称
        }
    }

    $合计 = 0
    foreach ($cat in $全部分类.Keys) {
        $数量 = if ($已归类.ContainsKey($cat)) { $已归类[$cat].Count } else { 0 }
        $合计 += $数量
        Write-Host "  $($全部分类[$cat].名称)" -ForegroundColor Green
        Write-Host "    $($全部分类[$cat].描述) — $数量 个技能" -ForegroundColor Gray
        Write-Host ""
    }
    Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  已归类: $合计 | 未归类: $($未归类.Count) | 总计: $($全部.Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "  按任意键返回..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function 显示来源 {
    显示横幅
    Write-Host "  按来源浏览技能" -ForegroundColor Yellow
    Write-Host ""

    $来源列表 = @{
        "内置 (Trae/Claude Code)"       = @("dev-core", "gitnexus", "understand", "documents", "writing", "project")
        "Agency Agents (GitHub)"        = @("engineering", "business")
        "PentAGI (渗透测试)"            = @("pentest")
        "MetaGPT (多智能体架构)"        = @("metagpt")
    }

    foreach ($来源 in $来源列表.Keys) {
        $分类键 = $来源列表[$来源]
        Write-Host "  === $来源 ===" -ForegroundColor Cyan
        $小计 = 0
        foreach ($ck in $分类键) {
            $数量 = $全部分类[$ck].技能.Count
            $小计 += $数量
            Write-Host "    $($全部分类[$ck].名称): $数量" -ForegroundColor Gray
        }
        Write-Host "    小计: $小计" -ForegroundColor White
        Write-Host ""
    }

    Write-Host "  总计: 257 个技能" -ForegroundColor Green
    Write-Host ""
    Write-Host "  按任意键返回..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function 显示安装脚本 {
    显示横幅
    Write-Host "  安装脚本说明" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "  scripts\skills.ps1" -ForegroundColor Green
    Write-Host "    技能管理中心（就是本脚本）" -ForegroundColor Gray
    Write-Host ""

    Write-Host "  scripts\install-agency-agents.ps1" -ForegroundColor Green
    Write-Host "    安装约 200 个商业/工程 Agent 技能" -ForegroundColor Gray
    Write-Host "    前提: 先 git clone agency-agents 仓库到临时目录" -ForegroundColor DarkGray
    Write-Host ""

    Write-Host "  scripts\install-pentagi.ps1" -ForegroundColor Green
    Write-Host "    克隆 PentAGI 仓库 + 提取提示词模板" -ForegroundColor Gray
    Write-Host "    目标: d:\GrowthDashboard\pentagi" -ForegroundColor DarkGray
    Write-Host ""

    Write-Host "  手动克隆命令:" -ForegroundColor Yellow
    Write-Host "    git clone https://github.com/vxcontrol/pentagi.git pentagi" -ForegroundColor DarkGray
    Write-Host "    git clone https://github.com/FoundationAgents/MetaGPT.git MetaGPT" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  按任意键返回..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function 搜索技能($关键词) {
    显示横幅
    Write-Host "  搜索: '$关键词'" -ForegroundColor Yellow
    Write-Host ""

    $全部 = 获取全部技能
    $结果 = $全部 | Where-Object { $_.名称 -match $关键词 }
    if (-not $结果) {
        Write-Host "  未找到匹配的技能。" -ForegroundColor Red
    } else {
        foreach ($s in $结果) {
            $cat = 查找技能分类 $s.名称
            $分类名 = if ($全部分类.ContainsKey($cat)) { $全部分类[$cat].名称 } else { "?? 未归类" }
            $状态 = if ($s.有说明) { "✓" } else { "!" }
            Write-Host "  [$状态] $($s.名称)" -ForegroundColor Green -NoNewline
            Write-Host "  <- $分类名" -ForegroundColor Gray
        }
    }
    Write-Host ""
    Write-Host "  按任意键返回..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function 显示任务详情($键) {
    $t = $快速任务[$键]
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║  $($t.名称)" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  触发词: " -NoNewline -ForegroundColor Yellow
    Write-Host $t.触发词 -ForegroundColor White
    Write-Host ""
    Write-Host "  技能链: " -NoNewline -ForegroundColor Yellow
    Write-Host $t.技能链 -ForegroundColor Green
    Write-Host ""
    Write-Host "  按任意键返回..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# ============================================================
#  命令行模式
# ============================================================
function 执行命令模式($参数) {
    if ($参数.Count -eq 0) { return $false }
    $命令 = $参数[0]
    $子参数 = if ($参数.Count -gt 1) { $参数[1] } else { "" }

    switch ($命令) {
        "统计" {
            $全部 = 获取全部技能
            Write-Host "技能总数: $($全部.Count)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "按来源:" -ForegroundColor Cyan
            Write-Host "  内置 (Trae/Claude Code): ~30" -ForegroundColor Gray
            Write-Host "  Agency Agents (GitHub):  ~215" -ForegroundColor Gray
            Write-Host "  PentAGI (渗透测试):        3" -ForegroundColor Gray
            Write-Host "  MetaGPT (多智能体):        3" -ForegroundColor Gray
            Write-Host ""
            Write-Host "按分类:" -ForegroundColor Cyan
            foreach ($cat in $全部分类.Keys) {
                $数量 = $全部分类[$cat].技能.Count
                if ($数量 -gt 0) {
                    Write-Host "  $($全部分类[$cat].名称): $数量" -ForegroundColor Green
                }
            }
            return $true
        }
        "列表" {
            if ($子参数 -ne "" -and $全部分类.ContainsKey($子参数)) {
                $cat = $全部分类[$子参数]
                Write-Host "$($cat.名称): $($cat.描述)" -ForegroundColor Cyan
                Write-Host ""
                foreach ($s in $cat.技能) { Write-Host "  $s" -ForegroundColor Green }
                Write-Host ""
                Write-Host "数量: $($cat.技能.Count)" -ForegroundColor White
            } else {
                Write-Host "可用分类:" -ForegroundColor Cyan
                Write-Host ""
                foreach ($cat in $全部分类.Keys) {
                    Write-Host "  [$cat] $($全部分类[$cat].名称) ($($全部分类[$cat].技能.Count) 个)" -ForegroundColor Green
                }
                Write-Host ""
                Write-Host "用法: .\scripts\skills.ps1 列表 <分类名>" -ForegroundColor Gray
            }
            return $true
        }
        "搜索" {
            if ($子参数) { 搜索技能 $子参数 } else { Write-Host "用法: .\scripts\skills.ps1 搜索 <关键词>" -ForegroundColor Red }
            return $true
        }
    }
    return $false
}

# ============================================================
#  主入口
# ============================================================
if (执行命令模式 $args) { exit 0 }

while ($true) {
    显示主菜单
    $选择 = Read-Host "  输入编号 (0-7) 或命令 (分类/搜索/来源/脚本/退出)"
    switch ($选择) {
        "0" { 显示任务详情 "0" }
        "1" { 显示任务详情 "1" }
        "2" { 显示任务详情 "2" }
        "3" { 显示任务详情 "3" }
        "4" { 显示任务详情 "4" }
        "5" { 显示任务详情 "5" }
        "6" { 显示任务详情 "6" }
        "7" { 显示任务详情 "7" }
        "分类" { 显示分类 }
        "搜索" { $关键词 = Read-Host "  输入搜索关键词"; if ($关键词) { 搜索技能 $关键词 } }
        "来源" { 显示来源 }
        "脚本" { 显示安装脚本 }
        "退出" { Write-Host "  再见！" -ForegroundColor Green; break }
        default { Write-Host "  无效选项" -ForegroundColor Red; Start-Sleep 1 }
    }
}