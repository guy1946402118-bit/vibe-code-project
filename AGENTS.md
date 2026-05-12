<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **GrowthDashboard** (2553 symbols, 3962 relationships, 127 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.
- NEVER add inline `<style>` blocks with backtick template literals in JSX — they confuse the oxc parser. Use `index.css` instead.
- NEVER use `console.log` in production source files — they pollute the console and indicate incomplete error handling.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/GrowthDashboard/context` | Codebase overview, check index freshness |
| `gitnexus://repo/GrowthDashboard/clusters` | All functional areas |
| `gitnexus://repo/GrowthDashboard/processes` | All execution flows |
| `gitnexus://repo/GrowthDashboard/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

---

# 🗺️ GrowthDashboard 项目导航地图

## 一、项目结构总览

```
GrowthDashboard/
├── src/                        # 前端 React + TypeScript
│   ├── App.tsx                 # 路由根（含主题初始化）
│   ├── index.css               # 全局样式 + 14 主题 + 关键帧动画
│   ├── main.tsx                # 入口
│   ├── components/             # 38 个复用组件
│   ├── pages/                  # 15 个页面
│   ├── stores/                 # Zustand 状态管理 (userStore, pomodoroStore)
│   └── lib/                    # 工具库 (api, db, ranks, notificationBus)
├── server/                     # 后端 Express + Prisma
│   └── src/routes/             # API 路由
├── scripts/                    # PowerShell 管理脚本
├── docs/                       # 文档
└── .trae/skills/               # 257 个 AI 技能
```

## 二、路由地图

| 路径 | 页面组件 | 权限 | 功能 |
|------|---------|------|------|
| `/` | [HomePage](file:///d:/GrowthDashboard/src/pages/HomePage.tsx) | 登录 | 仪表盘：趋势图、分类占比、番茄钟、快捷打卡 |
| `/goals` | [GoalsPage](file:///d:/GrowthDashboard/src/pages/GoalsPage.tsx) | 登录 | 目标中心：目标卡片 + 四象限矩阵 |
| `/checkin` | [CheckInPage](file:///d:/GrowthDashboard/src/pages/CheckInPage.tsx) | 登录 | 每日打卡 + 连续日历 |
| `/training` | [TrainingPage](file:///d:/GrowthDashboard/src/pages/TrainingPage.tsx) | 登录 | 专注训练（舒尔特表格等） |
| `/knowledge` | [NotesPage](file:///d:/GrowthDashboard/src/pages/NotesPage.tsx) | 登录 | 知识库：图谱 + PARA 视图 + 双向链接 |
| `/achievements` | [AchievementsPage](file:///d:/GrowthDashboard/src/pages/AchievementsPage.tsx) | 登录 | 成就系统：40 个徽章 |
| `/life-flower` | [LifeFlowerPage](file:///d:/GrowthDashboard/src/pages/LifeFlowerPage.tsx) | 登录 | 生命之花：8 维度雷达图 + 滑动条 |
| `/settings` | [SettingsPage](file:///d:/GrowthDashboard/src/pages/SettingsPage.tsx) | 登录 | 设置：主题、个人信息、密码 |
| `/journal` | [ProgressJournal](file:///d:/GrowthDashboard/src/components/ProgressJournal.tsx) | 登录 | 进度日记 |
| `/leaderboard` | [LeaderboardPage](file:///d:/GrowthDashboard/src/pages/LeaderboardPage.tsx) | 登录 | 积分排行榜 |
| `/blog` | [DashboardBlogPage](file:///d:/GrowthDashboard/src/pages/DashboardBlogPage.tsx) | 公开 | 博客仪表盘：态势感知图、文章雷达 |
| `/blog/posts` | [BlogPage](file:///d:/GrowthDashboard/src/pages/BlogPage.tsx) | 公开 | 文章列表 + 搜索 |
| `/blog/post/:slug` | [BlogPostPage](file:///d:/GrowthDashboard/src/pages/BlogPostPage.tsx) | 公开 | 文章详情 + 评论 |
| `/blog/editor` | [BlogEditorPage](file:///d:/GrowthDashboard/src/pages/BlogEditorPage.tsx) | 登录 | 文章编辑器 |
| `/login` | [LoginPage](file:///d:/GrowthDashboard/src/pages/LoginPage.tsx) | 公开 | 用户登录 |
| `/cms/login` | [CmsLoginPage](file:///d:/GrowthDashboard/src/pages/CmsLoginPage.tsx) | 公开 | CMS 后台登录 |

## 三、核心组件地图

| 组件 | 文件 | 职责 |
|------|------|------|
| **Layout** | [Layout.tsx](file:///d:/GrowthDashboard/src/components/Layout.tsx) | 全局布局：侧边栏导航 + 通知中心 + 主题切换 |
| **GoalCard** | [GoalCard.tsx](file:///d:/GrowthDashboard/src/components/GoalCard.tsx) | 目标卡片：连击、涟漪、里程碑、粒子爆裂 |
| **GoalBreakdown** | [GoalBreakdown.tsx](file:///d:/GrowthDashboard/src/components/GoalBreakdown.tsx) | 目标拆解：OKR 里程碑 + 子任务 + 粒子动画 |
| **QuadrantMatrix** | [QuadrantMatrix.tsx](file:///d:/GrowthDashboard/src/components/QuadrantMatrix.tsx) | 四象限矩阵：艾森豪威尔法则任务管理 |
| **KnowledgeGraph** | [KnowledgeGraph.tsx](file:///d:/GrowthDashboard/src/components/KnowledgeGraph.tsx) | ECharts 知识图谱：节点、边标签、力导向布局 |
| **NotificationCenter** | [NotificationCenter.tsx](file:///d:/GrowthDashboard/src/components/NotificationCenter.tsx) | 通知中心：全局事件总线 + 弹窗提醒 |
| **Toast** | [Toast.tsx](file:///d:/GrowthDashboard/src/components/Toast.tsx) | 轻量级消息提示 |
| **ProgressParticle** | [ProgressParticle.tsx](file:///d:/GrowthDashboard/src/components/ProgressParticle.tsx) | 粒子爆裂动画（requestAnimationFrame 物理引擎） |
| **FlyingNumber** | [FlyingNumber.tsx](file:///d:/GrowthDashboard/src/components/FlyingNumber.tsx) | 浮动数字动画（+1 飘出效果） |
| **RadarChart** | [RadarChart.tsx](file:///d:/GrowthDashboard/src/components/RadarChart.tsx) | Canvas 雷达图：生命之花 / 技能雷达 |
| **StreakCalendar** | [StreakCalendar.tsx](file:///d:/GrowthDashboard/src/components/StreakCalendar.tsx) | GitHub 风格连续打卡热力图 |
| **RankBadge** | [RankBadge.tsx](file:///d:/GrowthDashboard/src/components/RankBadge.tsx) | 段位徽章 + 升级音效 |
| **KasperskyGlobe** | [KasperskyGlobe.tsx](file:///d:/GrowthDashboard/src/components/KasperskyGlobe.tsx) | 3D 地球数据可视化 |
| **TagCloud** | [TagCloud.tsx](file:///d:/GrowthDashboard/src/components/TagCloud.tsx) | 词云标签 |
| **RewardsShop** | [RewardsShop.tsx](file:///d:/GrowthDashboard/src/components/RewardsShop.tsx) | 积分兑换商城 |

## 四、数据流地图

```
用户操作 → 页面组件 → db (IndexedDB) / api (HTTP)
                              ↓
                         Server Routes (Express)
                              ↓
                         Prisma ORM
                              ↓
                         PostgreSQL (生产) / SQLite (开发)
```

**关键 API 模块**：
| 模块 | 文件 |
|------|------|
| 用户认证 | [server/src/routes/user.ts](file:///d:/GrowthDashboard/server/src/routes/user.ts) |
| 知识图谱 | [server/src/routes/knowledge.ts](file:///d:/GrowthDashboard/server/src/routes/knowledge.ts) |
| 目标管理 | [server/src/routes/goal.ts](file:///d:/GrowthDashboard/server/src/routes/goal.ts) |
| 打卡系统 | [server/src/routes/checkIn.ts](file:///d:/GrowthDashboard/server/src/routes/checkIn.ts) |
| 奖励系统 | [server/src/routes/reward.ts](file:///d:/GrowthDashboard/server/src/routes/reward.ts) |
| 通知系统 | [server/src/routes/notification.ts](file:///d:/GrowthDashboard/server/src/routes/notification.ts) |

## 五、主题系统

14 套主题，通过 `[data-theme="主题名"]` 切换，CSS 变量存储在 `index.css`。
主题切换器在 [ThemeSwitcher.tsx](file:///d:/GrowthDashboard/src/components/ThemeSwitcher.tsx)，仅在登录状态显示。

## 六、技能系统

257 个 AI Agent 技能位于 `.trae/skills/`，通过自然语言自动触发。
- **管理脚本**：[scripts/skills.ps1](file:///d:/GrowthDashboard/scripts/skills.ps1)
- **使用指南**：[docs/技能系统使用指南.md](file:///d:/GrowthDashboard/docs/技能系统使用指南.md)

## 七、代码规范

- 组件使用命名导出 `export function ComponentName()`
- 样式优先使用 CSS 变量（`var(--text-primary)`）
- Canvas 组件需用 `getComputedStyle` 读取主题色
- 文本使用中文（用户界面 + 注释）
- 错误处理使用 `try/catch` + Toast 通知，不用 `console.log`