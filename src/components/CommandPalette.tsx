import { useState, useMemo } from 'react';
import { useUserStore } from '../stores/userStore';

interface CommandItem {
  icon: string;
  label: string;
  path: string;
  group: string;
  keywords: string[];
  requireLogin?: boolean;
}

const GUEST_COMMANDS: CommandItem[] = [
  { icon: '🏠', label: '首页', path: '/blog', group: '核心', keywords: ['首页', '主页', '控制台', '博客'] },
  { icon: '📝', label: '博客', path: '/blog', group: '内容', keywords: ['博客', '文章', 'blog', '写作', '发布'] },
  { icon: '📋', label: '文章列表', path: '/blog/posts', group: '内容', keywords: ['文章', '列表', '全部', '浏览'] },
];

const ALL_COMMANDS: CommandItem[] = [
  ...GUEST_COMMANDS,
  { icon: '🏠', label: '控制台', path: '/', group: '核心', keywords: ['首页', '主页', '控制台', '仪表盘'], requireLogin: true },
  { icon: '✅', label: '打卡', path: '/checkin', group: '日常', keywords: ['打卡', '签到', 'checkin', '每日'], requireLogin: true },
  { icon: '🎯', label: '目标管理', path: '/goals', group: '成长', keywords: ['目标', 'goals', 'okr', '计划'], requireLogin: true },
  { icon: '🏆', label: '成就徽章', path: '/achievements', group: '成长', keywords: ['成就', '徽章', '战绩'], requireLogin: true },
  { icon: '📊', label: '热力图', path: '/heatmap', group: '数据', keywords: ['热力图', '数据', '统计'], requireLogin: true },
  { icon: '🌸', label: '生命之花', path: '/lifeflower', group: '数据', keywords: ['生命之花', '平衡', '维度'], requireLogin: true },
  { icon: '📝', label: '复盘', path: '/review', group: '日常', keywords: ['复盘', '总结', '反思'], requireLogin: true },
  { icon: '🥇', label: '排行榜', path: '/leaderboard', group: '社交', keywords: ['排行榜', '排名', 'leaderboard'], requireLogin: true },
  { icon: '📦', label: '技能仓库', path: '/skills', group: '工具', keywords: ['技能', '仓库', 'AI', '提示词', 'prompt', '入库'], requireLogin: true },
  { icon: '🧠', label: '训练', path: '/training', group: '学习', keywords: ['训练', '练习', '刻意'], requireLogin: true },
  { icon: '📖', label: '学习方法', path: '/learning', group: '学习', keywords: ['学习', '方法', '认知'], requireLogin: true },
  { icon: '📚', label: '知识库', path: '/notes', group: '学习', keywords: ['知识库', '笔记', '资料'], requireLogin: true },
  { icon: '🎁', label: '奖池', path: '/rewards', group: '奖励', keywords: ['奖池', '奖励', '兑换'], requireLogin: true },
  { icon: '⚙️', label: '设置', path: '/settings', group: '系统', keywords: ['设置', '配置', '选项'], requireLogin: true },
  { icon: '📨', label: '推送设置', path: '/push', group: '系统', keywords: ['推送', '通知', 'push'], requireLogin: true },
];

const INTENT_PATTERNS: { patterns: RegExp[]; action: { label: string; icon: string; path: string }; group: string; requireLogin?: boolean }[] = [
  {
    patterns: [/写.*博客/, /发布.*文章/, /新建.*文章/],
    action: { label: '✍️ 写一篇新文章', icon: '📝', path: '/blog/new' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/打卡/, /签到/, /check/i, /每日.*健康/, /每日.*学习/],
    action: { label: '🎯 去打卡页面', icon: '✅', path: '/checkin' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/入库|存储.*技能|添加.*提示词|保存.*prompt|收集.*AI/],
    action: { label: '📦 入库新技能', icon: '📦', path: '/skills' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/技能.*仓库|我的.*技能|AI.*宝库|提示词.*管理/],
    action: { label: '📦 打开技能仓库', icon: '📦', path: '/skills' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/排版|格式.*调整|美化/],
    action: { label: '🎨 打开文章编辑器排版', icon: '📝', path: '/blog/new' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/复盘|总结.*今天|今天.*回顾/],
    action: { label: '📊 打开复盘页面', icon: '📝', path: '/review' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/目标|计划.*创建|新建.*目标/],
    action: { label: '🎯 去目标管理页面', icon: '🎯', path: '/goals' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/排行|谁.*第一|积分.*排名/],
    action: { label: '🥇 打开排行榜', icon: '🥇', path: '/leaderboard' },
    group: '智能推荐',
    requireLogin: true,
  },
  {
    patterns: [/浏览.*文章|查看.*文章|文章.*列表|全部.*文章/],
    action: { label: '📋 浏览全部文章', icon: '📋', path: '/blog/posts' },
    group: '智能推荐',
  },
  {
    patterns: [/看.*博客|博客.*首页|成长.*指挥/],
    action: { label: '🏠 回到博客首页', icon: '📝', path: '/blog' },
    group: '智能推荐',
  },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentUser } = useUserStore();
  const [query, setQuery] = useState('');

  const visibleCommands = useMemo(() => {
    return currentUser
      ? ALL_COMMANDS
      : ALL_COMMANDS.filter(c => !c.requireLogin);
  }, [currentUser]);

  const visibleIntents = useMemo(() => {
    return currentUser
      ? INTENT_PATTERNS
      : INTENT_PATTERNS.filter((ip: any) => !ip.requireLogin);
  }, [currentUser]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return { items: visibleCommands, intents: [] as typeof visibleIntents };
    }
    const lower = query.toLowerCase();
    const matchedItems = visibleCommands.filter(
      c => c.label.toLowerCase().includes(lower) || c.group.toLowerCase().includes(lower) || c.keywords.some((k: string) => k.toLowerCase().includes(lower))
    );
    const matchedIntents = visibleIntents.filter((ip: any) => ip.patterns.some((p: RegExp) => p.test(lower)));
    return { items: matchedItems, intents: matchedIntents };
  }, [query, visibleCommands, visibleIntents]);

  if (!open) return null;

  const navigate = (path: string) => {
    window.location.hash = path;
    onClose();
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '560px', maxHeight: '460px',
        background: 'rgba(15,15,30,0.97)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,240,255,0.2)', borderRadius: '16px',
        zIndex: 9999, overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(0,240,255,0.1)',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            autoFocus
            value={query}
            onInput={(e: any) => setQuery(e.target.value || '')}
            placeholder="输入关键词或自然语言...（如：帮我排版、入库技能、查看排行榜）"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '14px', fontFamily: "'Courier New', monospace",
            }}
          />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace" }}>ESC</span>
        </div>
        <div style={{ padding: '8px', overflowY: 'auto', maxHeight: '380px' }}>
          {query.trim() && (
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', padding: '4px 8px 8px', fontFamily: "'Courier New', monospace" }}>
              匹配 "<span style={{ color: '#00f0ff' }}>{query}</span>" — {results.items.length} 条功能 · {results.intents.length} 条智能推荐
            </div>
          )}
          {results.intents.map((ip, idx) => (
            <div key={`intent-${idx}`}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', padding: '6px 10px 4px', fontFamily: "'Courier New', monospace", textTransform: 'uppercase' }}>{ip.group}</div>
              <button
                onClick={() => navigate(ip.action.path)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#00f0ff', fontSize: '13px', fontFamily: "'Courier New', monospace",
                  fontWeight: 'bold',
                }}
                onMouseEnter={(e: any) => (e.currentTarget.style.background = 'rgba(0,240,255,0.08)')}
                onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '20px' }}>{ip.action.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{ip.action.label}</span>
                <span style={{ fontSize: '11px', color: 'rgba(0,240,255,0.4)' }}>⚡ 智能</span>
              </button>
            </div>
          ))}
          {(() => {
            const groups = [...new Set(results.items.map(i => i.group))];
            return groups.map(group => {
              const items = results.items.filter(i => i.group === group);
              return (
                <div key={group}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', padding: '6px 10px 4px', fontFamily: "'Courier New', monospace", textTransform: 'uppercase' }}>{group}</div>
                  {items.map(item => (
                    <button key={item.path}
                      onClick={() => navigate(item.path)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '10px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.7)', fontSize: '13px',
                        fontFamily: "'Courier New', monospace",
                      }}
                      onMouseEnter={(e: any) => (e.currentTarget.style.background = 'rgba(0,240,255,0.08)')}
                      onMouseLeave={(e: any) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '16px' }}>{item.icon}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </>
  );
}
