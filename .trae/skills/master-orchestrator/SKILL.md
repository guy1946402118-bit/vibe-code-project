---
name: master-orchestrator
description: One-click orchestration hub that routes user intent to the correct skill workflow chain. Use as the FIRST skill for any non-trivial task — it auto-selects and sequences the right skills from the 45-skill arsenal. Invoke when user says "一键", "orchestrate", "auto", "full workflow", or starts any complex multi-step task.
---

# 🎯 一键技能菜单

> **核心原理**：这些技能不需要你手动调用，你只需要用**自然语言**描述想做的事，AI 自动匹配执行链。

---

## 怎么用？只需要说一句话

| 你想做什么 | 在对话里说 | AI 自动执行 |
|-----------|-----------|------------|
| 🔍 理解代码 | "帮我分析一下登录流程" | zoom-out → gitnexus-exploring → understand-explain |
| 🐛 修 Bug | "这个 bug 帮我修一下：点提交白屏报 500" | karpathy-guidelines → gitnexus-debugging → diagnose |
| 🏗️ 开发功能 | "帮我做一个用户积分排行榜" | karpathy-guidelines → grill-me → tdd |
| 🔄 重构代码 | "帮我把 calculateTotal 改成 computeGrandTotal" | gitnexus-impact-analysis → gitnexus-refactoring |
| 📋 提需求 | "帮我整理一个暗黑模式的 PRD" | triage → to-prd → to-issues |
| ✍️ 写文章 | "帮我写一篇 React 性能优化博客" | writing-fragments → writing-shape → edit-article |
| 🚀 刷新数据 | "刷新代码图谱" | npx gitnexus analyze → code-review-graph build |

---

## 触发词速查表

你只要说了下面任意关键词，AI 就知道走哪条链：

| 关键词 | → 工作流 |
|--------|---------|
| bug、出错、报错、挂了、不work、500、白屏 | 🐛 Bug Fix |
| 开发、做一个、加个、实现、新增、功能 | 🏗️ Feature Dev |
| 重构、改名、拆分、清理、整理代码 | 🔄 Refactoring |
| 分析、怎么工作、解释、架构、结构 | 🔍 Exploration |
| issue、prd、需求、规格、拆分任务、提单 | 📋 Issue/PRD |
| 写文章、博客、编辑、润色、草稿 | ✍️ Writing |
| 刷新、重新索引、更新图谱 | 🚀 Refresh |

---

## 真实对话示例

### 示例 1：修 Bug
```
用户: "帮我修一下，用户注册页面输入邮箱后点提交，页面直接白屏了，F12 看到 POST /api/auth/register 返回 500"

AI:
[匹配: Bug Fix 工作流]

[1/4] gitnexus-debugging   → 搜索 .gitnexus 找到 register 调用链
[2/4] karpathy-guidelines  → 确认：server/src/routes/auth.ts:42, bcrypt 未导入
[3/4] diagnose             → 复现 → 定位：import { hash } 缺失 → 添加 → 测试通过
[4/4] gitnexus-impact      → 影响范围：仅 auth.ts，风险 LOW

✅ 已修复，只需要在 auth.ts 顶部加上 `import { hash } from 'bcrypt';`
```

### 示例 2：开发新功能
```
用户: "帮我做一个积分排行榜，显示前 20 名用户，要有排名、用户名、积分"

AI:
[匹配: Feature Dev 工作流]

[1/3] karpathy-guidelines → 不做过度的灵活性，先做最简单的版本
[2/3] grill-me            → Q: 要不要分本周/本月排行？A: 先只做总排行
                           → Q: 没登录能看到吗？A: 可以，公开页面
[3/3] tdd                 → 写测试 → 造接口 GET /api/leaderboard → 写页面 → 通过
```

### 示例 3：理解代码
```
用户: "这个项目的权限校验怎么做的？我看不懂"

AI:
[匹配: Exploration 工作流]

[1/3] zoom-out              → 项目架构：Express + JWT + Prisma
[2/3] gitnexus-exploring    → npx gitnexus query "auth middleware"
                              找到：authenticate (基础验证) → requireAdmin (角色验证)
                              .gitnexus/processes.md 显示路径：middleware/auth.ts → routes/*
[3/3] understand-explain    → 解读 src/middleware/auth.ts 逐函数解释

总结：两层验证 — authenticate 验 JWT Token，requireAdmin 验用户角色是否为 ADMIN
```

---

## 终端脚本

如果不想打字，可以运行菜单脚本快速找到对应的触发词：

```powershell
.\scripts\skills.ps1        # 交互菜单
.\scripts\skills.ps1 bug    # 直接看 Bug Fix 的对话模板
.\scripts\skills.ps1 build  # 直接看 Feature Dev 的对话模板
```

---

## 所有技能一览

| # | 技能 | 一句话 |
|---|------|--------|
| 1 | caveman | 极简回答模式，省 Token |
| 2 | karpathy-guidelines | 先想再写，不走弯路 |
| 3 | karpathy-perspective | Karpathy 思维模式 |
| 4 | diagnose | 6 阶段诊断修 Bug |
| 5 | tdd | 先写测试再写代码 |
| 6 | triage | Issue 状态管理 |
| 7 | to-prd | 对话 → PRD 文档 |
| 8 | to-issues | PRD → 拆分任务单 |
| 9 | review | 代码审查（标准+需求） |
| 10 | design-an-interface | 生成 3 种 API 设计 |
| 11 | prototype | 快速验证原型 |
| 12 | improve-codebase-architecture | 找架构优化机会 |
| 13 | zoom-out | 宏观架构一览 |
| 14 | request-refactor-plan | 访谈 → 重构计划 |
| 15 | grill-me | 设计思路逼问 |
| 16 | grill-with-docs | 逼问 + 更新文档 |
| 17 | ubiquitous-language | 提取领域术语 |
| 18 | setup-matt-pocock-skills | 初始化项目配置 |
| 19-24 | gitnexus-* (6个) | 调用链分析工具集 |
| 25-32 | understand-* (8个) | 知识图谱工具集 |
| 33-36 | writing-* (4个) | 写作工作流 |
| 37 | qa | 交互式报 Bug |
| 38 | handoff | 会话交接文档 |
| 39 | write-a-skill | 创建新技能 |
| 40 | setup-pre-commit | 配置 Git Hooks |
| 41 | git-guardrails | 阻止危险 Git 命令 |
| 42 | scaffold-exercises | 创建习题目录 |
| 43 | migrate-to-shoehorn | 迁移测试断言 |
| 44 | obsidian-vault | 管理 Obsidian 笔记 |
| 45 | master-orchestrator | 本文件：一键编排 |