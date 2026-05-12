# Growth Dashboard 项目状态

## 项目概述
赛博朋克风本地优先自我成长管理系统（PWA）

## 已完成功能

### ✅ 核心系统
- **IndexedDB本地存储** - 用户、打卡、笔记、博客、训练日志
- **多用户系统** - 支持创建账号、切换用户、头像编辑
- **响应式导航** - 左栏导航 + 顶部移动端导航
- **PWA支持** - 可安装到桌面，离线可用

### ✅ 功能模块
1. **首页** - 数据概览、积分排名、每日名言
2. **打卡** - 5维度（健康/学习/工作/纪律/复盘）+ 段位系统
3. **知识库** - 笔记CRUD、Markdown支持
4. **奖池系统** - 积分兑换奖励
5. **复盘功能** - 周期性总结
6. **推送系统** - 消息通知
7. **博客** - 文章CRUD、Markdown、分类标签
8. **大屏** - 态势感知中心、打卡分布、积分趋势、实时动态
9. **训练** - 冥想(4种) + 脑训练游戏(5种) + 积分记录

### ✅ 主题风格
- **登录页** - Terminal终端风格（参考erzbir.com）
- **博客** - HackYourHeart终端风格
- **整体** - 赛博朋克霓虹配色

## 技术栈
- React 19 + TypeScript
- Vite + PWA
- Zustand（状态管理）
- IDB（IndexedDB）
- Framer Motion（动画）
- React Router DOM
- React Markdown

## 待完成/问题
- DashboardPage语法错误已修复
- 头像BUG已修复（emoji渲染问题）
- 训练页面已增加积分记录
- 大屏已显示训练积分明细

## 项目结构
```
GrowthDashboard/
├── src/
│   ├── components/   # 组件
│   ├── lib/          # 数据库、工具函数
│   ├── pages/        # 页面
│   ├── stores/       # 状态管理
│   └── App.tsx       # 路由配置
├── package.json
└── vite.config.ts
```

## 启动命令
```bash
cd GrowthDashboard
npm install
npm run dev
```

## 数据存储
所有数据存储在浏览器IndexedDB中，包括：
- users（用户）
- checkIns（打卡记录）
- notes（笔记）
- rewards（奖励）
- blogPosts（博客文章）
- trainingLogs（训练日志）

---
最后更新: 2026-04-15