# 📂 项目文件导航图 — GrowthDashboard（成长仪表盘）

> 技术栈：React 19 + TypeScript + Vite 8 + Zustand（前端） | Express + Prisma + SQLite（后端）
>
> 一句话介绍：一个带段位系统的个人成长打卡管理工具，含博客、训练、复盘、知识库、消息推送、目标管理、成就系统、热力图、生命之花、排行榜等功能。

---

## 🗺️ 一、根目录文件（非目录）

| 文件名 | 是干嘛的 | 如果你想... |
|--------|---------|------------|
| `package.json` | 前端项目的依赖清单和启动脚本 | 装依赖用 `npm install`，启动用 `npm run dev` |
| `vite.config.ts` | Vite 构建配置，配了端口5173，还把 `/api` 代理到后端3000端口 | 改前端端口、改后端代理地址 |
| `tsconfig.json` | TypeScript 根配置 | 改 TS 编译规则 |
| `tsconfig.app.json` | 前端 src 目录的 TS 配置 | 加路径别名(@)等 |
| `tsconfig.node.json` | Vite/Node 相关文件的 TS 配置 | 改 vite.config 的编译规则 |
| `index.html` | 前端应用入口 HTML 文件 | 改网页标题、SEO meta 标签 |
| `eslint.config.js` | 前端代码规范检查配置 | 改 lint 规则 |
| `.env` / `.env.example` | 环境变量（`.env` 写真实值，`.example` 是模板） | 改 API 地址：`VITE_API_URL` |
| `start-all.cjs` | 一键启动前端+后端的脚本（Node 写的） | 直接 `node start-all.cjs` 启动整个项目 |
| `start-backend.js` | 只启动后端服务 | 单独启动后端 |
| `check-end.cjs` / `check-file.cjs` / `check-line.cjs` | 调试/检查用的临时脚本 | 排查问题时用 |
| `delete-testuser.cjs` / `get-users.cjs` | 删除测试用户 / 查看所有用户 | 管理测试数据 |
| `test-*.cjs` / `test-*.mjs` | 各种后端 API 的测试脚本 | 调试接口时参考 |

---

## 🖥️ 二、前端代码（`src/` 目录）

### 2.1 入口文件

| 文件 | 是干嘛的 |
|------|---------|
| `src/main.tsx` | React 应用的启动入口，渲染 `<App />` 到页面上，顺带禁用了 Ctrl+滚轮缩放 |
| `src/App.tsx` | 路由总控中心，定义所有页面路径和权限守卫（PrivateRoute / AdminRoute），PrivateRoute 内部已包含 Layout |

### 2.2 页面（`src/pages/`）— 22 个页面

#### 🏠 核心页面

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `LoginPage.tsx` | 用户登录/注册页面，有酷炫的引导动画 | 改登录页样式、动画 |
| `CmsLoginPage.tsx` | 管理员登录页面（当前未在路由中直接使用） | 改管理员登录页样式 |
| `HomePage.tsx` | 首页，展示今日打卡面板、名言、数据概览、段位进度 | 改首页卡片样式、布局 |
| `DashboardPage.tsx` | 用户仪表盘（当前未在路由中使用，被 HomePage 替代） | — |

#### ✅ 打卡 & 复盘

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `CheckInPage.tsx` | 打卡页面，选类别（健康/学习/工作/自律/复盘）打卡赚分 | 改打卡按钮颜色、积分规则 |
| `ReviewPage.tsx` | 智能复盘页面，周度数据回顾 + AI 洞察 + 行动计划 | 改复盘模板、数据展示 |

#### 🎯 成长中心（新增）

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `GoalsPage.tsx` | 目标管理页面，创建/跟踪/完成个人目标 | 改目标卡片样式、添加目标分类 |
| `AchievementsPage.tsx` | 成就徽章页面，展示已获得和未获得的成就 | 改徽章设计、添加新成就 |
| `HeatmapPage.tsx` | 打卡热力图，年/月/周三种视图的可视化打卡记录 | 改热力图颜色、布局 |
| `LifeFlowerPage.tsx` | 生命之花（生活平衡轮），8维度雷达图展示生活平衡度 | 改维度定义、雷达图样式 |

#### 📝 博客系统

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `DashboardBlogPage.tsx` | 博客仪表盘（`/blog` 路由），文章列表+快速记录+数据面板 | 改博客列表展示 |
| `BlogPage.tsx` | 公开博客首页（当前未在路由中使用） | — |
| `BlogPostPage.tsx` | 单篇博客文章详情页 | 改文章页排版、评论区 |
| `BlogEditorPage.tsx` | 博客编辑器（新建/编辑文章），支持自动保存草稿 | 改编辑器界面、功能 |

#### 🧠 学习 & 训练

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `LearningPage.tsx` | 学习方法页面，展示 6 种经典学习方法 | 改方法卡片样式 |
| `TrainingPage.tsx` | 大脑训练页面，5 种小游戏（舒尔特表/N-Back/记忆卡片/斯特鲁普/象棋残局）+ 4 种冥想 | 改游戏规则、颜色 |
| `NotesPage.tsx` | 知识库/笔记页面，增删改查笔记 | 改笔记列表、编辑器 |

#### 🏆 排行 & 奖励

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `LeaderboardPage.tsx` | 排行榜页面，按积分排名，支持时间/分类筛选 | 改排行榜样式、排序 |
| `RewardsPage.tsx` | 奖池页面，用积分兑换奖励 | 改奖励卡片、兑换逻辑 |

#### ⚙️ 系统

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `SettingsPage.tsx` | 用户设置页面（主题切换、提醒设置、数据导入/导出/清空） | 改设置项、添加新主题 |
| `PushPage.tsx` | 消息推送配置页面（浏览器通知/微信/邮件/短信） | 改推送渠道配置 |
| `CmsPage.tsx` | 后台管理页面（用户管理+博客管理），仅管理员可见 | 改管理面板功能 |

### 2.3 组件（`src/components/`）— 6 个通用组件

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `Layout.tsx` | **全局布局组件**，包含桌面端可折叠侧边栏 + 平板端顶栏 + 移动端底部导航 + 用户设置弹窗 | **改侧边栏菜单项、颜色、导航结构** |
| `AnimatedNumber.tsx` | 数字滚动动画组件 | 改数字动画效果 |
| `Animations.tsx` | 通用动画效果集合 | 复用动画效果 |
| `AvatarEditor.tsx` | 头像编辑器组件 | 改头像编辑功能 |
| `Confetti.tsx` | 撒花/彩带特效组件 | 改庆祝动画效果 |
| `RankBadge.tsx` | 段位徽章 + 进度条 + 升级动画组件 | **改段位徽章的样式** |

### 2.4 状态管理（`src/stores/`）— Zustand 写的

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `userStore.ts` | 用户状态管理（登录/注册/登出/初始化），数据持久化到 localStorage | **改用户登录逻辑、权限判断** |
| `checkInStore.ts` | 打卡状态管理（打卡/加载今日打卡/统计），分类键统一为大写（HEALTH/STUDY/WORK/DISCIPLINE/REVIEW） | **改打卡积分规则** |

### 2.5 工具库（`src/lib/`）— 6 个核心工具文件

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `api.ts` | **最核心文件**：封装了所有后端 API 调用（auth、user、checkIn、note、reward、review、training、blog、cms、visitor），统一 Base URL 为 `/api` | **改接口地址：改第 1 行 `API_BASE`**；改请求头；改接口参数 |
| `db.ts` | 浏览器本地 IndexedDB 数据库操作（离线存储的降级方案），分类键统一为大写 | 改本地数据存储逻辑 |
| `blog.ts` | 博客相关的类型定义和默认分类配置 | 改博客分类 |
| `learningMethods.ts` | 6 种学习方法的硬编码数据（西蒙/费曼/康奈尔/卡片盒/PQ4R/间隔重复） | **改学习方法内容** |
| `push.ts` | 消息推送逻辑（浏览器通知/微信Webhook/邮件/短信） | **改推送渠道实现** |
| `ranks.ts` | **段位系统**：10 个段位定义 + 积分换算 + 进度计算 | **改段位名称、积分门槛、颜色** |

### 2.6 样式

| 文件 | 是干嘛的 |
|------|---------|
| `src/index.css` | **全局主题核心文件**：Aurora Glass 极光玻璃拟态主题（CSS 变量 + 玻璃卡片系统 + 极光背景光晕动画），支持 5 种主题切换（dark/light/synthwave/ocean/forest） |
| `src/App.css` | 应用级样式（可能未使用） |

### 2.8 玻璃拟态工具库（新增）

| 文件 | 是干嘛的 |
|------|---------|
| `src/lib/glass.ts` | **Aurora Glass 样式工具集**：提供 glass.card、glass.accent、glass.success、glass.warning、glass.danger、glass.btn、glass.input 等 JS 对象，方便在页面组件中快速应用玻璃拟态样式 |

### 2.7 静态资源（`src/assets/` + `public/`）

| 文件 | 是干嘛的 |
|------|---------|
| `src/assets/hero.png` | 首页大图 |
| `src/assets/react.svg` / `vite.svg` | React / Vite 图标 |
| `public/favicon.svg` | 网站标签页图标 |
| `public/icons.svg` / `pwa-192x192.svg` | PWA 图标 |

---

## 🔧 三、后端代码（`server/` 目录）

### 3.1 入口文件

| 文件 | 是干嘛的 |
|------|---------|
| `server/src/index.ts` | **后端入口**：创建 Express 应用，注册所有路由，监听 3000 端口 |

### 3.2 数据库（`server/prisma/`）

| 文件 | 是干嘛的 | 如果你想... |
|------|---------|------------|
| `schema.prisma` | **数据库表结构定义**（User、CheckIn、Note、Reward、Review、TrainingLog、BlogPost、BlogCategory、Admin、Visitor），SQLite 数据库 | **改表结构、加字段** |
| `data/` | 数据库文件存放目录（`dev.db`） | 备份/恢复数据库文件 |

### 3.3 路由（`server/src/routes/`）— 10 个路由文件，每个对应一组 API

| 文件 | 负责的 API 路径 | 是干嘛的 |
|------|---------------|---------|
| `auth.ts` | `/api/auth/*` | 登录/注册/获取当前用户 |
| `user.ts` | `/api/users/*` | 用户 CRUD + 排行榜 |
| `checkIn.ts` | `/api/checkins/*` | 打卡 CRUD + 每日统计 + 连续天数 |
| `note.ts` | `/api/notes/*` | 笔记 CRUD |
| `reward.ts` | `/api/rewards/*` | 奖励 CRUD + 兑换 |
| `review.ts` | `/api/reviews/*` | 复盘 CRUD |
| `training.ts` | `/api/training/*` | 训练日志 + 统计 |
| `blog.ts` | `/api/blog/*` | 博客文章 + 分类 CRUD |
| `cms.ts` | `/api/cms/*` | 管理后台接口（用户管理、打卡查看） |
| `visitor.ts` | `/api/visitors/*` | 访客统计 |

### 3.4 中间件（`server/src/middleware/`）

| 文件 | 是干嘛的 |
|------|---------|
| `auth.ts` | JWT 鉴权中间件（验证 token、解析用户 ID） |
| `errorHandler.ts` | 统一错误处理 + async 错误捕获包装器 |

### 3.5 脚本（`server/` 根目录的 .cjs/.mjs 文件）

| 文件 | 是干嘛的 |
|------|---------|
| `start.cjs` | 启动后端服务 |
| `create-admin.cjs` / `seed-admin.cjs` / `promote-admin.cjs` | 创建/初始化/提升管理员账号 |
| `check-db.cjs` / `fix-db.cjs` / `migrate.cjs` | 检查/修复/迁移数据库 |
| `test-*.cjs` / `test-*.mjs` / `test.ps1` | 测试各种 API 接口 |
| `quick-server.js` | 一个简化版的后端快速启动文件 |

---

## 📦 四、构建产物（`dist/` 目录）

`npm run build` 之后生成的静态文件，可以直接部署到服务器。

| 文件 | 是干嘛的 |
|------|---------|
| `dist/index.html` | 构建后的入口 HTML |
| `dist/assets/` | 打包后的 JS/CSS/图片 |
| `dist/sw.js` / `workbox-*.js` | PWA Service Worker（离线缓存） |

---

## 🎯 五、快速定位指南（我想改 XXX 去哪找？）

| 你想做什么 | 去找这个文件 |
|-----------|------------|
| **改登录按钮颜色** | `src/pages/LoginPage.tsx` |
| **改接口访问地址** | `src/lib/api.ts` 第 1 行 `API_BASE` + `.env` 的 `VITE_API_URL` |
| **改侧边栏菜单** | `src/components/Layout.tsx` 里的 `PRIVATE_NAV` 数组 |
| **改段位名称/门槛** | `src/lib/ranks.ts` 里的 `RANKS` 对象 |
| **改积分规则** | `server/src/routes/checkIn.ts` 的 `POINTS_MAP` |
| **改学习方法内容** | `src/lib/learningMethods.ts` 里的 `LEARNING_METHODS` 数组 |
| **改数据库表结构** | `server/prisma/schema.prisma` |
| **改博客分类** | `src/lib/blog.ts` 里的 `DEFAULT_CATEGORIES` |
| **改推送渠道配置** | `src/lib/push.ts` + `src/pages/PushPage.tsx` |
| **改后端端口号** | `server/src/index.ts` 的 `PORT` |
| **改前端代理地址** | `vite.config.ts` 的 proxy 配置 |
| **改管理员后台功能** | `src/pages/CmsPage.tsx` + `server/src/routes/cms.ts` |
| **改训练游戏逻辑** | `src/pages/TrainingPage.tsx` |
| **改首页名言** | `src/pages/HomePage.tsx` 里的 `quotes` 数组 |
| **改主题色/样式** | `src/index.css` 里的 CSS 变量（Aurora Glass 极光玻璃拟态主题，支持 dark/light/synthwave/ocean/forest 5种主题） |
| **改玻璃卡片样式** | `src/lib/glass.ts` 样式工具集 + `src/index.css` 中的 `.glass-card` 系列 CSS 类 |
| **改目标管理功能** | `src/pages/GoalsPage.tsx` |
| **改成就徽章** | `src/pages/AchievementsPage.tsx` |
| **改热力图展示** | `src/pages/HeatmapPage.tsx` |
| **改生命之花维度** | `src/pages/LifeFlowerPage.tsx` 里的 `dimensions` 数组 |
| **改排行榜规则** | `src/pages/LeaderboardPage.tsx` |
| **改复盘数据** | `src/pages/ReviewPage.tsx` |
| **改设置页面** | `src/pages/SettingsPage.tsx` |
| **改打卡分类** | `src/pages/CheckInPage.tsx` 的 `categories` 数组 + `src/lib/db.ts` 的 `CheckIn` 接口 |

---

## 🔄 六、路由结构一览

| 路径 | 页面组件 | 权限 |
|------|----------|------|
| `/login` | LoginPage | 公开 |
| `/blog` | DashboardBlogPage | 公开 |
| `/blog/new` | BlogEditorPage | 需登录 |
| `/blog/:slug` | BlogPostPage | 公开（有 Layout） |
| `/` | HomePage | 需登录 |
| `/checkin` | CheckInPage | 需登录 |
| `/review` | ReviewPage | 需登录 |
| `/goals` | GoalsPage | 需登录 |
| `/achievements` | AchievementsPage | 需登录 |
| `/heatmap` | HeatmapPage | 需登录 |
| `/lifeflower` | LifeFlowerPage | 需登录 |
| `/leaderboard` | LeaderboardPage | 需登录 |
| `/training` | TrainingPage | 需登录 |
| `/learning` | LearningPage | 需登录 |
| `/notes` | NotesPage | 需登录 |
| `/rewards` | RewardsPage | 需登录 |
| `/push` | PushPage | 需登录 |
| `/settings` | SettingsPage | 需登录 |
| `/cms` | CmsPage | 需管理员 |

---

## 🧭 七、导航分组（侧边栏）

桌面端侧边栏按功能分为 6 组：

| 分组 | 包含页面 | 图标色 |
|------|---------|--------|
| 📊 数据中心 | 首页、博客 | 青色 `#00f0ff` |
| 🎯 成长中心 | 目标、成就、热力图、生命之花 | 绿色 `#00ff88` |
| 🧠 学习训练 | 训练、学习方法、知识库 | 蓝色 `#45b7d1` |
| ✅ 日常打卡 | 打卡、复盘、排行榜 | 橙色 `#ffaa00` |
| 🎁 奖励中心 | 奖池、推送 | 粉色 `#ff00aa` |
| ⚙️ 系统 | 设置 | 紫色 `#dda0dd` |
| ⚙️ 系统管理 | 管理（仅管理员可见） | 红色 `#ff6b6b` |
