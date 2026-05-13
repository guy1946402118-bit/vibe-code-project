﻿﻿﻿﻿import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { usePomodoroStore } from '../stores/pomodoroStore';
import * as db from '../lib/db';
import { getRankByPoints, getNextRank, getProgressToNextRank, type RankInfo } from '../lib/ranks';
import { userApi, blogApi, checkInApi, visitorApi, notificationApi, type CheckIn } from '../lib/api';
import { KasperskyGlobe } from '../components/KasperskyGlobe';
import { RadarChart } from '../components/RadarChart';
import { ActivityFeed } from '../components/ActivityFeed';
import { ContentRecommendations } from '../components/ContentRecommendations';
import { useMilestones } from '../components/MilestoneTracker';
import { SmartSuggestions } from '../components/SmartSuggestions';
import { showToast } from '../components/Toast';

interface LeaderUser { id: string; name: string; avatar?: string; points: number; rank: RankInfo; }
interface VisitorRecord { id: string; ip: string; path: string; visitedAt: string; country?: string; city?: string; device?: string; browser?: string; os?: string; }
interface VisitorStats { todayCount: number; weekCount: number; totalCount: number; uniqueIPs: number; topCountries: any[]; hourlyStats: any[]; }

const CATEGORIES = [
  { id: 'all', name: '全部', color: 'var(--matrix-green)' },
  { id: 'growth', name: '成长', color: 'var(--matrix-green)' },
  { id: 'tech', name: '技术', color: '#00f0ff' },
  { id: 'life', name: '生活', color: '#00ff88' },
  { id: 'reading', name: '读书', color: '#ffd93d' },
  { id: 'thinking', name: '思考', color: '#ff6b6b' },
];

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

const QUICK_RECORD_CATEGORIES: { key: 'HEALTH' | 'STUDY' | 'WORK' | 'DISCIPLINE' | 'REVIEW'; label: string; icon: string; color: string }[] = [
  { key: 'STUDY', label: '学习', icon: '📚', color: '#00f0ff' },
  { key: 'HEALTH', label: '健康', icon: '💪', color: '#00ff88' },
  { key: 'WORK', label: '工作', icon: '💼', color: '#ffd93d' },
  { key: 'DISCIPLINE', label: '自律', icon: '🎯', color: '#ff6b6b' },
  { key: 'REVIEW', label: '复盘', icon: '🔄', color: '#c084fc' },
];

function SectionTitle({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${color}22` }}>
      <div style={{ width: '4px', height: '20px', background: color, borderRadius: '2px', boxShadow: `0 0 10px ${color}88` }} />
      <span style={{ fontSize: '15px', fontWeight: '700', color, fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>{icon} {title}</span>
      <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}44, transparent)` }} />
      <span style={{ fontSize: '10px', color: `${color}66`, fontFamily: "'Courier New', monospace" }}>{subtitle}</span>
    </div>
  );
}

export function DashboardBlogPage() {
  const { currentUser } = useUserStore();
  const navigate = useNavigate();
  const pomodoro = usePomodoroStore();
  const [points, setPoints] = useState(0);
  const [rankingUsers, setRankingUsers] = useState<LeaderUser[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<db.BlogPost[]>([]);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackPoints, setFeedbackPoints] = useState(0);
  const [feedbackHiding, setFeedbackHiding] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; points: number; count: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [showQuickRecordModal, setShowQuickRecordModal] = useState(false);
  const [quickRecordContent, setQuickRecordContent] = useState('');
  const [quickRecordCategory, setQuickRecordCategory] = useState<'HEALTH' | 'STUDY' | 'WORK' | 'DISCIPLINE' | 'REVIEW'>('STUDY');
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ totalUsers: 0, activeUsers: 0 });
  const [blogStats, setBlogStats] = useState({ totalPosts: 0, totalCategories: 0 });
  const [todayCheckInCount, setTodayCheckInCount] = useState(0);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({ todayCount: 0, weekCount: 0, totalCount: 0, uniqueIPs: 0, topCountries: [], hourlyStats: [] });
  const [recentVisitors, setRecentVisitors] = useState<VisitorRecord[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkInCategoryCounts, setCheckInCategoryCounts] = useState<Record<string, number>>({});
  const [userCheckIns, setUserCheckIns] = useState<db.CheckIn[]>([]);
  const [userTrainingLogs, setUserTrainingLogs] = useState<db.TrainingLog[]>([]);
  const [userNotes, setUserNotes] = useState<db.Note[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchUserData = async () => {
      try {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        const [recentCheckIns, allCheckIns, trainingLogs, notes] = await Promise.all([
          checkInApi.getAll({ startTime: weekAgo, endTime: Date.now() }).catch(() => []),
          db.getCheckIns(currentUser.id, monthAgo).catch(() => []),
          db.getTrainingLogs(currentUser.id, monthAgo).catch(() => []),
          db.getNotes(currentUser.id).catch(() => []),
        ]);

        const counts: Record<string, number> = {};
        for (const ci of recentCheckIns) {
          counts[ci.category] = (counts[ci.category] || 0) + 1;
        }
        setCheckInCategoryCounts(counts);
        setUserCheckIns(allCheckIns);
        setUserTrainingLogs(trainingLogs);
        setUserNotes(notes);
      } catch { /* ignore */ }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    const recordVisit = async () => {
      try {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        let device = 'desktop';

        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Edg')) browser = 'Edge';
        else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac OS')) os = 'Mac OS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) { os = 'Android'; device = 'mobile'; }
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) { os = 'iOS'; device = userAgent.includes('iPad') ? 'tablet' : 'mobile'; }

        await fetch('/api/visitors/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: 'localhost',
            path: window.location.pathname,
            browser,
            os,
            device,
            country: '本地',
            city: 'localhost',
          }),
        });
      } catch { /* ignore */ }
    };
    recordVisit();
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try { await userApi.syncPoints(); } catch { /* ignore */ }
      try {
        const rankings = await userApi.getRankings();
        if (mounted) setRankingUsers(rankings.sort((a, b) => b.points - a.points).slice(0, 5).map(u => ({ ...u, rank: getRankByPoints(u.points) })));
      } catch { /* ignore */ }
      try {
        const blogTags = await blogApi.getTags();
        if (mounted) setTags(blogTags);
      } catch { /* ignore */ }
      try {
        const rawPosts: any = selectedCategory === 'all' ? await blogApi.getAll() : await blogApi.getByCategory(selectedCategory);
        const apiPosts = Array.isArray(rawPosts) ? rawPosts : (rawPosts?.posts || []);
        const posts = apiPosts.slice(0, 6).map((post: any) => ({
          id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content,
          coverImage: post.coverImage, category: post.category,
          tags: Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? (() => {
            try { const p = JSON.parse(post.tags); return Array.isArray(p) ? p : [post.tags]; }
            catch { return post.tags.split(',').map((t: string) => t.trim()).filter(Boolean); }
          })() : []),
          author: post.author,
          publishedAt: typeof post.publishedAt === 'number' ? post.publishedAt : new Date(post.publishedAt).getTime(),
          updatedAt: typeof post.updatedAt === 'number' ? post.updatedAt : new Date(post.updatedAt).getTime(),
          views: typeof post.views === 'number' ? post.views : Number(post.views) || 0,
          likes: typeof post.likes === 'number' ? post.likes : Number(post.likes) || 0,
          isPublished: post.isPublished,
        }));
        if (mounted) setPosts(posts);
      } catch {
        if (mounted) {
          const bp = selectedCategory === 'all' ? await db.getAllBlogPosts() : await db.getBlogPostsByCategory(selectedCategory);
          setPosts(bp.slice(0, 6));
        }
      }
      try { const s = await userApi.getStats(); if (mounted) setUserStats(s); } catch { /* ignore */ }
      try { const s = await blogApi.getStats(); if (mounted) setBlogStats(s); } catch { /* ignore */ }
      try { const { todayCount } = await checkInApi.getTodayCount(); if (mounted) setTodayCheckInCount(todayCount); } catch { /* ignore */ }
      try { const s = await visitorApi.getStats(); if (mounted) setVisitorStats(s); } catch { /* ignore */ }
      try { const v = await visitorApi.getRecent(10); if (mounted) setRecentVisitors(v); } catch { /* ignore */ }
      try {
        const w = await checkInApi.getWeekly();
        if (mounted && w.length > 0) setWeeklyData(w);
        else if (mounted) {
          setWeeklyData(WEEK_DAYS.map((d) => ({ day: d, points: 0, count: 0 })));
        }
      } catch { /* ignore */ }
      try {
        const stats = await checkInApi.getStats();
        if (mounted) setStreak(stats.streak);
        if (stats.streak >= 7 && mounted) {
          showToast({ type: 'achievement', title: '连续打卡', message: `你已经连续打卡 ${stats.streak} 天！继续保持！` });
        }
      } catch { /* ignore */ }
      try {
        const goals = await userApi.getActiveGoals();
        if (mounted) setActiveGoals(goals || []);
      } catch { /* ignore */ }
      try {
        await notificationApi.getUnreadCount();
      } catch { /* ignore */ }
      if (currentUser && mounted) setPoints(typeof currentUser.points === 'number' ? currentUser.points : 0);
    };
    init();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { mounted = false; clearInterval(timer); };
  }, [currentUser, selectedCategory]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try { setUserStats(await userApi.getStats()); } catch { /* ignore */ }
      try { const { todayCount } = await checkInApi.getTodayCount(); setTodayCheckInCount(todayCount); } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const rank = getRankByPoints(points);
  const nextRank = getNextRank(rank.tier);
  const rankProgress = getProgressToNextRank(points, rank, nextRank);

  const handleQuickRecord = () => {
    if (!currentUser) return;
    setShowQuickRecordModal(true);
    setQuickRecordContent('');
    setQuickRecordCategory('STUDY');
  };

  const dismissFeedback = () => {
    setFeedbackHiding(true);
    if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; }
    setTimeout(() => {
      setFeedbackVisible(false);
      setFeedbackHiding(false);
    }, 300);
  };

  const handleQuickRecordSubmit = async () => {
    if (!currentUser) return;
    if (!quickRecordContent.trim()) { alert('请输入学习内容'); return; }
    const pts = 5 + Math.floor(Math.random() * 6);
    setShowQuickRecordModal(false);
    setQuickRecordContent('');

    setFeedbackPoints(pts);
    setFeedbackVisible(true);
    setFeedbackHiding(false);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(dismissFeedback, 2000);

    await db.addCheckIn(currentUser.id, quickRecordCategory, quickRecordContent);
    setPoints(prev => prev + pts);
    showToast({
      type: 'success',
      title: '记录成功',
      message: `已记录到 📝 每日打卡 · +${pts}积分`,
      action: { label: '去查看', onClick: () => navigate('/checkin') },
    });
  };

  const getHeatColor = (val: number) => {
    if (val >= 80) return 'var(--matrix-green-dim)';
    if (val >= 60) return 'rgba(255,215,0,0.6)';
    if (val >= 40) return 'rgba(0,240,255,0.5)';
    return 'rgba(168,85,247,0.4)';
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  useMilestones(points, blogStats.totalPosts || posts.length, todayCheckInCount * 7 /* approximate */, streak);

  const panelStyle: React.CSSProperties = {
    border: '1px solid var(--matrix-green-dim)',
    background: 'rgba(10,10,16,0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '6px',
    position: 'relative',
    overflow: 'hidden',
  };

  const cornerLines = (color = 'var(--matrix-green)'): React.CSSProperties => ({
    position: 'absolute', top: 0, left: 0, width: '10px', height: '10px',
    borderLeft: `2px solid ${color}`, borderTop: `2px solid ${color}`, pointerEvents: 'none',
  });

  const cornerLinesBR = (color = 'var(--matrix-green)'): React.CSSProperties => ({
    position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px',
    borderRight: `2px solid ${color}`, borderBottom: `2px solid ${color}`, pointerEvents: 'none',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #050508 0%, #0a0f14 50%, #080810 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* 网格背景 */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--accent-dim) 1px, transparent 1px), linear-gradient(90deg, var(--accent-dim) 1px, transparent 1px)', backgroundSize: '45px 45px', pointerEvents: 'none', zIndex: 0 }} />

      {/* 扫描线 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--matrix-green), transparent)', animation: 'scanlineMove 5s linear infinite', opacity: 0.4, pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2, padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>

        {/* ====== 顶部标题栏 ====== */}
        <header style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '20px 28px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={cornerLines('var(--matrix-green)')} /><div style={cornerLinesBR('var(--matrix-green)')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--matrix-green), #00ff88)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px var(--matrix-green-dim)', animation: 'pulseGlow 2s ease-in-out infinite' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#000', fontFamily: "'Courier New', monospace" }}>G</span>
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--matrix-green)', margin: 0, fontFamily: "'Courier New', monospace", letterSpacing: '3px' }}>⚡ 成长指挥中心</h1>
              <p style={{ fontSize: '12px', color: 'var(--matrix-green-dim)', marginTop: '2px', fontFamily: "'Courier New', monospace", letterSpacing: '1.5px' }}>GROWTH COMMAND CENTER v2.0</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#00f0ff', fontFamily: "'Courier New', monospace", letterSpacing: '4px' }}>{formatTime(currentTime)}</div>
            <div style={{ fontSize: '11px', color: 'var(--matrix-green-dim)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>
              {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </header>

        {/* ====== 统计卡片行 ====== */}
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { icon: '👥', label: '总用户数', value: rankingUsers.length, unit: '人', color: '#00f0ff' },
            { icon: '✅', label: '今日打卡', value: todayCheckInCount, unit: '次', color: '#00ff88' },
            { icon: '📝', label: '博客文章', value: blogStats.totalPosts || posts.length, unit: '篇', color: '#ff6b6b' },
            { icon: '⚡', label: '活跃用户', value: userStats.activeUsers || rankingUsers.length, unit: '人', color: '#ffd93d' },
          ].map((stat, idx) => (
            <div key={idx} style={{ ...panelStyle, padding: '20px 18px', cursor: 'default', transition: 'all 0.35s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${stat.color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{stat.icon}</span>
                <span style={{ fontSize: '11px', color: 'var(--matrix-green-dim)', fontFamily: "'Courier New', monospace", textTransform: 'uppercase' }}>{stat.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '38px', fontWeight: '900', color: stat.color, fontFamily: "'Courier New', monospace", textShadow: `0 0 18px ${stat.color}50` }}>{stat.value}</span>
                <span style={{ fontSize: '13px', color: stat.color, fontWeight: '600', fontFamily: "'Courier New', monospace" }}>{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ====== 今日焦点卡片（仅登录用户） ====== */}
        {currentUser && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {/* 连续打卡 */}
          <div style={{ ...panelStyle, padding: '16px 22px', background: 'linear-gradient(135deg, rgba(255,215,0,0.06), transparent)' }}>
            <div style={cornerLines('#FFD700')} /><div style={cornerLinesBR('#FFD700')} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '8px', color: 'rgba(255,215,0,0.4)', fontFamily: "'Courier New', monospace", letterSpacing: '2px', marginBottom: '4px' }}>连续打卡</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#FFD700', fontFamily: "'Courier New', monospace" }}>{streak}<span style={{ fontSize: '14px', fontWeight: '400', opacity: 0.6 }}>天</span></div>
                <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.35)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>{streak >= 30 ? '🏆 已形成稳定习惯' : streak >= 7 ? '🔥 势头不错' : '🚀 新习惯养成中'}</div>
              </div>
              <div style={{ fontSize: '36px' }}>🔥</div>
            </div>
          </div>

          {/* 番茄钟状态 */}
          <div style={{ ...panelStyle, padding: '16px 22px', background: 'linear-gradient(135deg, rgba(255,107,107,0.06), transparent)', cursor: 'pointer' }}
            onClick={() => pomodoro.isRunning ? pomodoro.pauseTimer() : pomodoro.startTimer()}>
            <div style={cornerLines('#ff6b6b')} /><div style={cornerLinesBR('#ff6b6b')} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '8px', color: 'rgba(255,107,107,0.4)', fontFamily: "'Courier New', monospace", letterSpacing: '2px', marginBottom: '4px' }}>番茄钟</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#ff6b6b', fontFamily: "'Courier New', monospace" }}>
                  {String(Math.floor(pomodoro.seconds / 60)).padStart(2, '0')}:{String(pomodoro.seconds % 60).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,107,107,0.35)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>
                  {pomodoro.isRunning ? '▶ 进行中' : '⏸ 暂停'} · {pomodoro.mode === 'work' ? '💼 工作' : '☕ 休息'} · 完成{pomodoro.completedPomodoros}个
                </div>
              </div>
              <div style={{ fontSize: '24px', width: '50px', height: '50px', borderRadius: '50%', background: `conic-gradient(#ff6b6b ${((pomodoro.seconds) / (pomodoro.mode === 'work' ? 1500 : 300)) * 360}deg, rgba(255,107,107,0.1) ${((pomodoro.seconds) / (pomodoro.mode === 'work' ? 1500 : 300)) * 360}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🍅
              </div>
            </div>
          </div>

          {/* 活跃目标 */}
          <div style={{ ...panelStyle, padding: '16px 22px', background: 'linear-gradient(135deg, rgba(0,240,255,0.06), transparent)' }}
            onClick={() => navigate('/goals')}>
            <div style={cornerLines('#00f0ff')} /><div style={cornerLinesBR('#00f0ff')} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '8px', color: 'rgba(0,240,255,0.4)', fontFamily: "'Courier New', monospace", letterSpacing: '2px', marginBottom: '4px' }}>活跃目标</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: '#00f0ff', fontFamily: "'Courier New', monospace" }}>{activeGoals.length}<span style={{ fontSize: '14px', fontWeight: '400', opacity: 0.6 }}>个</span></div>
                {activeGoals.length > 0 ? (
                  <div style={{ fontSize: '9px', color: 'rgba(0,240,255,0.3)', fontFamily: "'Courier New', monospace", marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeGoals.slice(0, 2).map((g: any) => g.title).join(' · ')}
                  </div>
                ) : (
                  <div style={{ fontSize: '9px', color: 'rgba(0,240,255,0.2)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>点击设定新目标 →</div>
                )}
              </div>
              <div style={{ fontSize: '28px' }}>🎯</div>
            </div>
          </div>
        </div>
        )}

        {/* ====== 双大屏：学习态势感知 ║ 访问态势感知 ====== */}
        <div className="dual-screens" style={{ display: 'grid', gridTemplateColumns: currentUser ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>

          {/* --- 左屏：学习态势感知（仅登录用户）--- */}
          {currentUser && (
          <div style={{ ...panelStyle, padding: '24px', background: 'linear-gradient(135deg, var(--accent-dim) 0%, rgba(0,240,255,0.01) 100%)' }}>
            <div style={cornerLines('var(--matrix-green)')} /><div style={cornerLinesBR('var(--matrix-green)')} />
            <SectionTitle icon="🛰️" title="成长雷达" subtitle="六维能力实时监测" color="var(--matrix-green)" />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <RadarChart
                dimensions={(() => {
                  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

                  const healthCheckIns = userCheckIns.filter(c => c.category === 'HEALTH' && c.timestamp >= monthAgo);
                  const studyCheckIns = userCheckIns.filter(c => c.category === 'STUDY' && c.timestamp >= monthAgo);
                  const workCheckIns = userCheckIns.filter(c => c.category === 'WORK' && c.timestamp >= monthAgo);
                  const disciplineCheckIns = userCheckIns.filter(c => c.category === 'DISCIPLINE' && c.timestamp >= monthAgo);
                  const reviewCheckIns = userCheckIns.filter(c => c.category === 'REVIEW' && c.timestamp >= monthAgo);

                  const meditationTraining = userTrainingLogs.filter(t => t.type === 'meditation');
                  const cognitiveTraining = userTrainingLogs.filter(t => ['schulte', 'memory', 'stroop'].includes(t.type));

                  let healthScore = Math.min(Math.round((healthCheckIns.length * 8 + meditationTraining.length * 5) * 1.2), 100);
                  let studyScore = Math.min(Math.round((studyCheckIns.length * 8 + cognitiveTraining.length * 6 + userNotes.length * 3) * 1.2), 100);
                  let workScore = Math.min(Math.round(workCheckIns.length * 10 * 1.2), 100);
                  let disciplineScore = Math.min(Math.round((disciplineCheckIns.length * 10 + streak * 2) * 1.2), 100);
                  let reviewScore = Math.min(Math.round(reviewCheckIns.length * 10 * 1.2), 100);
                  let growthScore = Math.min(Math.round(points / 4 + activeGoals.length * 8 + blogStats.totalPosts * 2), 100);

                  return [
                    { label: '健康', value: healthScore || 15, maxValue: 100, color: '#00ff88' },
                    { label: '学习', value: studyScore || 20, maxValue: 100, color: '#00f0ff' },
                    { label: '工作', value: workScore || 12, maxValue: 100, color: '#ffd93d' },
                    { label: '自律', value: disciplineScore || 18, maxValue: 100, color: '#ff6b6b' },
                    { label: '复盘', value: reviewScore || 10, maxValue: 100, color: '#c084fc' },
                    { label: '成长', value: growthScore || 25, maxValue: 100, color: 'var(--matrix-green)' },
                  ];
                })()}
                width={520} height={380}
                title="技能雷达扫描"
                subtitle="近30日能力分布"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '14px', borderTop: '1px solid var(--matrix-green-dim)' }}>
              {[
                { v: blogStats.totalPosts || posts.length, l: '总文章', c: '#00f0ff' },
                { v: todayCheckInCount, l: '今日打卡', c: '#00ff88' },
                { v: tags.length, l: '标签数', c: '#ff6b6b' },
                { v: userStats.activeUsers || rankingUsers.length, l: '活跃用户', c: '#ffd93d' },
              ].map((it, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: it.c, fontFamily: "'Courier New', monospace", textShadow: `0 0 12px ${it.c}50` }}>{it.v}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: "'Courier New', monospace", marginTop: '3px' }}>{it.l}</div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* --- 右屏：访问态势感知 --- */}
          <div style={{ ...panelStyle, padding: '24px', background: 'linear-gradient(135deg, rgba(0,240,255,0.03) 0%, rgba(0,240,255,0.01) 100%)' }}>
            <div style={cornerLines('#00f0ff')} /><div style={cornerLinesBR('#00f0ff')} />
            <SectionTitle icon="🌐" title="访问态势感知" subtitle="全球访客实时监测" color="#00f0ff" />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <KasperskyGlobe width={currentUser ? 600 : 900} height={340} />
            </div>

            {/* 访客核心指标 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {[
                { v: visitorStats.todayCount, l: '今日', cl: '#00f0ff' },
                { v: visitorStats.weekCount, l: '本周', cl: '#00ff88' },
                { v: visitorStats.uniqueIPs, l: '独立IP', cl: '#ffd93d' },
                { v: visitorStats.totalCount, l: '累计', cl: '#ff6b6b' },
              ].map((it, i) => (
                <div key={i} style={{ background: `${it.cl}10`, border: `1px solid ${it.cl}22`, borderRadius: '6px', padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: it.cl, fontFamily: "'Courier New', monospace" }}>{it.v}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>{it.l}</div>
                </div>
              ))}
            </div>

            {/* 最近访问列表 */}
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Courier New', monospace", marginBottom: '8px' }}>▸ 最近访问记录</div>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {recentVisitors.slice(0, 8).map((v, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderBottom: '1px solid rgba(0,240,255,0.05)',
                  fontSize: '10px', fontFamily: "'Courier New', monospace",
                  transition: 'background 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f0ff', opacity: 0.7, flexShrink: 0 }} />
                      <span style={{ color: '#00f0ff', fontWeight: '600' }}>{v.ip}</span>
                      {v.country && (
                        <span style={{ padding: '2px 6px', borderRadius: '6px', background: 'rgba(0,240,255,0.1)', color: '#00f0ff', fontSize: '8px' }}>
                          🌍 {v.country}{v.city && ` · ${v.city}`}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>
                      {new Date(v.visitedAt).toLocaleString('zh-CN', { 
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '14px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>📄 {v.path}</span>
                    {v.browser && (
                      <span style={{ color: 'rgba(0,255,136,0.6)', fontSize: '9px' }}>
                        🌐 {v.browser}
                      </span>
                    )}
                    {v.os && (
                      <span style={{ color: 'rgba(255,217,61,0.6)', fontSize: '9px' }}>
                        🖥️ {v.os}
                      </span>
                    )}
                    {v.device && (
                      <span style={{ color: 'rgba(192,132,252,0.6)', fontSize: '9px' }}>
                        {v.device === 'mobile' ? '📱' : v.device === 'tablet' ? '📲' : '🖥️'} {v.device}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {recentVisitors.length === 0 && (
                <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '20px', fontSize: '11px', fontFamily: "'Courier New', monospace" }}>暂无访问记录</div>
              )}
            </div>
          </div>
        </div>

        {/* ====== 辅助面板行（三栏） ====== */}
        <div className="panel-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>

          {/* 左：TOP排行榜 + 本周热力图 */}
          <div style={{ ...panelStyle, padding: '18px' }}>
            <div style={cornerLines('#FFD700')} /><div style={cornerLinesBR('#FFD700')} />
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFD700', marginBottom: '12px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>🏆 用户排行榜</div>
            {rankingUsers.map((u, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
                background: i === 0 ? 'rgba(255,215,0,0.06)' : 'transparent',
                borderRadius: '6px', marginBottom: '4px',
                borderLeft: i < 3 ? `3px solid ${['#FFD700','#C0C0C0','#CD7F32'][i]}` : '2px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: ['#FFD700','#C0C0C0','#CD7F32'][i] || 'rgba(255,255,255,0.4)', fontFamily: "'Courier New', monospace", width: '22px', textAlign: 'center' }}>
                  {['🥇','🥈','🥉'][i] || (i + 1)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#fff', fontFamily: "'Courier New', monospace" }}>{u.name}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace" }}>{u.rank.nameCn}</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFD700', fontFamily: "'Courier New', monospace" }}>{u.points}</span>
              </div>
            ))}
            {rankingUsers.length === 0 && <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '12px', fontSize: '11px', fontFamily: "'Courier New', monospace" }}>暂无数据</div>}

            {/* 本周热力图 */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--accent-dim)' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#00f0ff', marginBottom: '10px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>🔥 本周热力图</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                {weeklyData.map((d, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '9px', color: 'var(--matrix-green-dim)', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>{d.day}</div>
                    <div style={{ background: getHeatColor(d.points), borderRadius: '3px', height: '28px', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = `0 0 12px ${getHeatColor(d.points)}`; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>+{d.points}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 中：段位进度 + 快速记录（仅登录用户） */}
          {currentUser && (
          <div style={{ ...panelStyle, padding: '18px' }}>
            <div style={cornerLines('#aa00ff')} /><div style={cornerLinesBR('#aa00ff')} />
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#aa00ff', marginBottom: '14px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>📊 段位进度</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: rank.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', border: `3px solid ${rank.color}`, boxShadow: `0 0 18px ${rank.color}55` }}>{rank.icon}</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: rank.color, fontFamily: "'Courier New', monospace" }}>{rank.nameCn}</div>
                {nextRank && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontFamily: "'Courier New', monospace" }}>距 {nextRank.nameCn} {Math.round((100 - rankProgress) * 5)} 分</div>}
              </div>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px', position: 'relative' }}>
              <div style={{ width: `${rankProgress}%`, height: '100%', background: `linear-gradient(90deg, ${rank.color}, ${rank.color}88)`, borderRadius: '4px', boxShadow: `0 0 10px ${rank.color}66`, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace", marginBottom: '16px' }}>
              <span>{rank.nameCn}</span><span>{nextRank?.nameCn || '已满级'}</span>
            </div>

            {currentUser && (
              <div style={{ marginTop: '8px', padding: '14px', background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(255,215,0,0.02))', borderRadius: '6px', border: '1px dashed rgba(255,215,0,0.25)', cursor: 'pointer' }}
                onClick={handleQuickRecord}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#FFD700', fontFamily: "'Courier New', monospace", marginBottom: '4px' }}>⚡ 快速记录学习</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,215,0,0.45)', fontFamily: "'Courier New', monospace" }}>点击记录 · +5-10积分奖励</div>
              </div>
            )}
          </div>
          )}

          {/* 右：热门标签 + 数据统计 */}
          <div style={{ ...panelStyle, padding: '18px' }}>
            <div style={cornerLines('#ff6b6b')} /><div style={cornerLinesBR('#ff6b6b')} />
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ff6b6b', marginBottom: '12px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>🏷️ 热门标签</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {tags.map(tag => {
                const maxCount = Math.max(...tags.map(t => t.count), 1);
                const fs = Math.max(10, Math.min(14, 10 + (tag.count / maxCount) * 4));
                const op = 0.5 + (tag.count / maxCount) * 0.5;
                const isS = selectedTag === tag.name;
                return (
                  <button key={tag.name} onClick={() => setSelectedTag(isS ? null : tag.name)}
                    style={{
                      fontSize: `${fs}px`, padding: '4px 12px', borderRadius: '12px',
                      border: `1.5px solid ${isS ? '#ff6b6b' : 'rgba(255,255,255,0.06)'}`,
                      background: isS ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isS ? '#ff6b6b' : `rgba(255,255,255,${op})`,
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Courier New', monospace", fontWeight: isS ? '700' : '500',
                    }}>
                    {tag.name}<span style={{ fontSize: '9px', marginLeft: '2px', opacity: 0.5 }}>{tag.count}</span>
                  </button>
                );
              })}
              {tags.length === 0 && <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: "'Courier New', monospace" }}>暂无标签</div>}
            </div>

            <div style={{ borderTop: '1px solid var(--accent-dim)', paddingTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#00f0ff', marginBottom: '12px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>📈 数据统计</div>
              {[
                ...(currentUser ? [
                  { l: '总积分', v: points, c: '#FFD700' },
                  { l: '连续打卡', v: `${streak} 天`, c: '#00ff88' },
                ] : []),
                { l: '博客总数', v: blogStats.totalPosts || posts.length, c: '#ff6b6b' },
              ].map((it, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingBottom: i < 2 ? '10px' : '0',
                  borderBottom: i < 2 ? '1px solid var(--accent-dim)' : 'none',
                  marginBottom: i < 2 ? '10px' : '0',
                }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Courier New', monospace" }}>{it.l}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: it.c, fontFamily: "'Courier New', monospace" }}>{it.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ====== 底部博客列表 ====== */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '4px', height: '20px', background: '#ff6b6b', borderRadius: '2px', boxShadow: '0 0 10px rgba(255,107,107,0.5)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0, fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>📝 最新博客</h2>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {currentUser && (
                <button onClick={() => navigate('/blog/new')}
                  style={{
                    padding: '9px 20px', borderRadius: '16px', border: '1.5px solid #ff6b6b',
                    background: 'linear-gradient(135deg, #ff6b6b, #ff4444)', color: '#fff', fontSize: '12px',
                    fontWeight: '700', cursor: 'pointer', boxShadow: '0 3px 14px rgba(255,107,107,0.3)',
                    transition: 'all 0.25s', fontFamily: "'Courier New', monospace", display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 5px 22px rgba(255,107,107,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(255,107,107,0.3)'; }}
                >✏️ 写文章</button>
              )}
              <button onClick={() => navigate('/blog/posts')}
                style={{
                  padding: '9px 18px', borderRadius: '16px', border: '1.5px solid rgba(0,240,255,0.25)',
                  background: 'rgba(0,240,255,0.06)', color: '#00f0ff', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: "'Courier New', monospace", transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(0,240,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >查看全部 →</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '5px 14px', borderRadius: '14px',
                  border: `2px solid ${selectedCategory === cat.id ? cat.color : 'rgba(255,255,255,0.08)'}`,
                  background: selectedCategory === cat.id ? `${cat.color}12` : 'rgba(255,255,255,0.03)',
                  color: selectedCategory === cat.id ? cat.color : 'rgba(255,255,255,0.6)',
                  fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: "'Courier New', monospace", fontWeight: selectedCategory === cat.id ? '700' : '500',
                }}>{cat.name}</button>
            ))}
          </div>

          <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {posts.slice(0, 6).map((post, idx) => (
              <div key={post.id || idx} style={{ ...panelStyle, padding: '18px', cursor: 'pointer', borderLeft: `3px solid ${CATEGORIES.find(c => c.id === post.category)?.color || 'var(--matrix-green)'}` }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${CATEGORIES.find(c => c.id === post.category)?.color || 'var(--matrix-green)'}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '10px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${CATEGORIES.find(c => c.id === post.category)?.color || 'var(--matrix-green)'}18, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    border: `1px solid ${CATEGORIES.find(c => c.id === post.category)?.color || 'var(--matrix-green)'}30`,
                  }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: "'Courier New', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Courier New', monospace", marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                      {post.excerpt || post.content}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace", marginTop: '6px' }}>
                      <span>{post.author}</span>
                      <span>👁️ {post.views}</span>
                      <span>❤️ {post.likes}</span>
                    </div>
                  </div>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', paddingTop: '10px', borderTop: '1px solid var(--accent-dim)', flexWrap: 'wrap' }}>
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{ padding: '2px 8px', borderRadius: '8px', background: 'var(--accent-dim)', fontSize: '9px', color: 'var(--matrix-green-dim)', fontFamily: "'Courier New', monospace", border: '1px solid var(--matrix-green-dim)' }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ====== 社区动态 + 内容推荐 ====== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
          <SmartSuggestions />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <ActivityFeed />
          <ContentRecommendations limit={4} />
        </div>

      {/* ====== 积分反馈动画 ====== */}
      {feedbackVisible && (
        <div onClick={dismissFeedback} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
          opacity: feedbackHiding ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, rgba(20,20,30,0.98), rgba(10,10,20,0.98))',
            borderRadius: '18px', padding: '28px 40px', border: '2px solid #FFD700',
            boxShadow: '0 0 80px rgba(255,215,0,0.45), inset 0 0 30px rgba(255,215,0,0.08)',
            textAlign: 'center',
            transform: feedbackHiding ? 'scale(0.8) translateY(10px)' : 'scale(1) translateY(0)',
            opacity: feedbackHiding ? 0 : 1,
            transition: 'all 0.3s ease',
          }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#FFD700', fontFamily: "'Courier New', monospace", textShadow: '0 0 25px rgba(255,215,0,0.7)' }}>+{feedbackPoints}</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', marginTop: '8px', fontFamily: "'Courier New', monospace" }}>积分奖励已到账</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '10px' }}>点击任意处关闭</div>
          </div>
        </div>
      )}

      {/* ====== 快速记录弹窗 ====== */}
      {showQuickRecordModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowQuickRecordModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.99), rgba(10,10,18,0.99))',
            borderRadius: '16px', padding: '28px', border: '2px solid rgba(255,215,0,0.3)',
            maxWidth: '440px', width: '100%', boxShadow: '0 0 60px rgba(255,215,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#FFD700', marginBottom: '6px', textAlign: 'center', fontFamily: "'Courier New', monospace", letterSpacing: '2px' }}>⚡ 快速记录</h3>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: '18px', fontFamily: "'Courier New', monospace" }}>
              记录将保存到 📝 <span style={{ color: 'var(--matrix-green)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setShowQuickRecordModal(false); navigate('/checkin'); }}>每日打卡</span>
            </p>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {QUICK_RECORD_CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setQuickRecordCategory(cat.key)}
                  style={{
                    padding: '7px 12px', borderRadius: '16px', border: quickRecordCategory === cat.key ? `1.5px solid ${cat.color}` : '1.5px solid rgba(255,255,255,0.08)',
                    background: quickRecordCategory === cat.key ? `${cat.color}15` : 'rgba(255,255,255,0.03)',
                    color: quickRecordCategory === cat.key ? cat.color : 'rgba(255,255,255,0.4)',
                    fontSize: '12px', cursor: 'pointer', fontWeight: quickRecordCategory === cat.key ? '700' : '400',
                    transition: 'all 0.2s', fontFamily: "'Courier New', monospace",
                  }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            <textarea value={quickRecordContent} onChange={e => setQuickRecordContent(e.target.value)}
              placeholder="今天做了什么？学到了什么？"
              style={{ width: '100%', minHeight: '110px', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(255,215,0,0.2)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: "'Courier New', monospace", outline: 'none', lineHeight: 1.6 }}
            />
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'right', marginTop: '4px' }}>
              {quickRecordContent.length} / 500
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={() => setShowQuickRecordModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: '13px', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontWeight: '600' }}>取消</button>
              <button onClick={handleQuickRecordSubmit}
                disabled={!quickRecordContent.trim()}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: quickRecordContent.trim() ? 'linear-gradient(135deg, #FFD700, #FFA500)' : 'rgba(255,255,255,0.06)', color: quickRecordContent.trim() ? '#000' : 'rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: '700', cursor: quickRecordContent.trim() ? 'pointer' : 'default', fontFamily: "'Courier New', monospace", boxShadow: quickRecordContent.trim() ? '0 3px 16px rgba(255,215,0,0.3)' : 'none', transition: 'all 0.2s' }}>提交获得积分</button>
            </div>
          </div>
        </div>
      )}

      {/* 底部装饰线 */}
      <div style={{ position: 'fixed', bottom: 0, left: '8%', right: '8%', height: '1.5px', background: 'linear-gradient(90deg, transparent, var(--matrix-green), transparent)', opacity: 0.5, zIndex: 1 }} />
      </div>
    </div>
  );
}
