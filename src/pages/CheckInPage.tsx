﻿import { useEffect, useState } from 'react';
import { useCheckInStore } from '../stores/checkInStore';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Confetti } from '../components/Confetti';
import { RankBadge, RankProgressBar, RankUpAnimation } from '../components/RankBadge';
import { getRankByPoints, type RankInfo } from '../lib/ranks';
import { StreakCalendar } from '../components/StreakCalendar';
import { ProgressJournal } from '../components/ProgressJournal';
import { checkInApi, userApi } from '../lib/api';
import { showToast } from '../components/Toast';

const categories = [
  { key: 'HEALTH', label: '健康', icon: '❤️', points: 10, color: '#FF6B6B' },
  { key: 'STUDY', label: '学习', icon: '📚', points: 15, color: '#4ECDC4' },
  { key: 'WORK', label: '工作', icon: '💼', points: 15, color: '#45B7D1' },
  { key: 'DISCIPLINE', label: '自律', icon: '🎯', points: 20, color: '#96CEB4' },
  { key: 'REVIEW', label: '复盘', icon: '📝', points: 25, color: '#FFEAA7' },
] as const;

export function CheckInPage() {
  const { todayCheckIns, checkIn, loadTodayCheckIns, getTotalPoints } = useCheckInStore();
  const [totalPoints, setTotalPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [currentRank, setCurrentRank] = useState<RankInfo>(getRankByPoints(0));
  const [showRankUp, setShowRankUp] = useState(false);
  const [newRank, setNewRank] = useState<RankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [activeGoals, setActiveGoals] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'checkin' | 'journal'>('checkin');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadTodayCheckIns();
      const points = await getTotalPoints();
      setTotalPoints(points);
      setCurrentRank(getRankByPoints(points));
      try {
        const stats = await checkInApi.getStats();
        setStreak(stats.streak);
      } catch { /* ignore */ }
      try {
        const goals = await userApi.getActiveGoals();
        setActiveGoals(goals || []);
      } catch { /* ignore */ }
      try {
        const hd = await checkInApi.getHeatmap();
        setHeatmapData(hd || {});
      } catch { /* ignore */ }
      setLoading(false);
    };
    init();
  }, []);

  const handleCheckIn = async (category: typeof categories[number]['key']) => {
    if (checkingIn) return;
    setCheckingIn(true);
    const oldRank = currentRank;
    const pts = categories.find(c => c.key === category)?.points || 0;
    setLastPoints(pts);
    try {
      await checkIn(category);
    } catch (e: any) {
      if (e?.message?.includes('409') || e?.message?.includes('已打过')) {
        showToast({ type: 'warning', title: '重复打卡', message: `「${categories.find(c=>c.key===category)?.label}」分类今天已打卡过`, duration: 2500 });
        await loadTodayCheckIns();
        setCheckingIn(false);
        return;
      }
      showToast({ type: 'warning', title: '打卡失败', message: '请稍后再试', duration: 2500 });
      setCheckingIn(false);
      return;
    }
    const newTotal = await getTotalPoints();
    setTotalPoints(newTotal);
    const newRankInfo = getRankByPoints(newTotal);
    setCurrentRank(newRankInfo);
    setShowConfetti(true);
    setCheckingIn(false);

    if (newRankInfo.tier !== oldRank.tier) {
      setNewRank(newRankInfo);
      setShowRankUp(true);
      showToast({ type: 'achievement', title: '段位晋升！', message: `恭喜升级为 ${newRankInfo.nameCn}！`, duration: 5000 });
    } else {
      showToast({ type: 'success', title: '打卡成功', message: `+${pts} 积分 · 连续打卡 ${streak + 1} 天`, duration: 3000 });
    }

    if (newTotal % 100 === 0) {
      showToast({ type: 'achievement', title: '里程碑！', message: `你已累计获得 ${newTotal} 积分！`, duration: 5000 });
    }
  };

  const doneCategories = todayCheckIns.map(c => c.category);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: { day: number; isCurrentMonth: boolean; isToday: boolean; hasCheckIn: boolean }[] = [];
    
    const isCheckInDay = (d: Date) => {
      const key = d.toISOString().split('T')[0];
      return (heatmapData[key] || 0) > 0;
    };

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ day: prevDate.getDate(), isCurrentMonth: false, isToday: false, hasCheckIn: isCheckInDay(prevDate) });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
      const hasCheckIn = isToday ? todayCheckIns.length > 0 : isCheckInDay(curDate);
      days.push({ day: d, isCurrentMonth: true, isToday, hasCheckIn });
    }
    
    return days;
  };

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1));

  return (
    <>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <RankUpAnimation show={showRankUp} newRank={newRank} onComplete={() => setShowRankUp(false)} />

      <div style={{ padding: '0 0 40px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>✅ 每日打卡</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>坚持打卡，持续成长</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('checkin')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              border: `2px solid ${activeTab === 'checkin' ? '#00f0ff' : 'rgba(255,255,255,0.1)'}`,
              background: activeTab === 'checkin' ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeTab === 'checkin' ? '#00f0ff' : 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              transition: 'all 0.2s',
            }}
          >
            ✅ 每日打卡
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '10px',
              border: `2px solid ${activeTab === 'journal' ? 'var(--matrix-green)' : 'rgba(255,255,255,0.1)'}`,
              background: activeTab === 'journal' ? 'var(--matrix-green-dim)' : 'rgba(255,255,255,0.03)',
              color: activeTab === 'journal' ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              transition: 'all 0.2s',
            }}
          >
            📖 进步本
          </button>
        </div>

        {activeTab === 'journal' ? (
          <ProgressJournal todayCheckIns={doneCategories} onPointsEarned={(points) => {
            setTotalPoints(prev => prev + points);
          }} />
        ) : (
        <>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>加载中...</div>
        ) : (
          <>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <RankBadge rank={currentRank} size="large" showProgress currentPoints={totalPoints} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '30px' }}>
              {categories.map((cat) => {
                const isDone = doneCategories.includes(cat.key);
                return (
                  <button
                    key={cat.key}
                    onClick={() => !isDone && !checkingIn && handleCheckIn(cat.key)}
                    disabled={isDone || checkingIn}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      border: `1px solid ${isDone ? 'rgba(255,255,255,0.1)' : `${cat.color}25`}`,
                      background: isDone ? 'rgba(255,255,255,0.03)' : `linear-gradient(135deg, ${cat.color}10 0%, ${cat.color}05 100%)`,
                      cursor: isDone ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isDone && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', borderRadius: '50%', background: '#00ff88', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '12px' }}>✓</div>
                    )}
                    <span style={{ fontSize: '32px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{cat.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: isDone ? '#00ff88' : cat.color }}>
                      {isDone ? '已完成 ✓' : `+${cat.points}分`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="glass-card-accent" style={{ padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>今日打卡</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
                <AnimatedNumber value={todayCheckIns.length} />
                <span style={{ opacity: 0.5 }}> / {categories.length}</span>
              </div>
            </div>

            <div className="glass-card-warning" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>累计积分</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
                <AnimatedNumber value={totalPoints} />
              </div>
            </div>

            <RankProgressBar currentPoints={totalPoints} currentRank={currentRank} />

            {activeGoals.length > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', border: '1px solid rgba(0,240,255,0.15)', background: 'rgba(0,240,255,0.04)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#00f0ff', fontFamily: "'Courier New', monospace", marginBottom: '10px', letterSpacing: '1px' }}>🎯 今日推进</div>
                {activeGoals.slice(0, 3).map((goal: any) => (
                  <div key={goal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,240,255,0.04)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace" }}>{goal.title}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>
                        {goal.currentValue}/{goal.targetValue} · {goal.priority === 'HIGH' ? '🔴 优先' : goal.priority === 'MEDIUM' ? '🟡 中等' : '🟢 一般'}
                      </div>
                    </div>
                    <div style={{
                      width: '48px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px',
                      overflow: 'hidden', flexShrink: 0, marginLeft: '10px',
                    }}>
                      <div style={{
                        width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%`,
                        height: '100%', background: '#00f0ff', borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <StreakCalendar
                data={Object.entries(heatmapData).map(([date, points]) => ({
                  date,
                  count: points || 0,
                  categories: [],
                }))}
                streak={streak}
                onDateClick={() => {}}
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => setShowCalendar(!showCalendar)} className="glass-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📅 {showCalendar ? '隐藏日历' : '月历视图'}
              </button>
              {showCalendar && (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                  {calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月
                </div>
              )}
            </div>

            {showCalendar && (
              <div className="glass-card" style={{ padding: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <button onClick={prevMonth} className="glass-btn" style={{ padding: '6px 14px', fontSize: '12px' }}>◀ 上月</button>
                  <span style={{ fontSize: '15px', color: '#fff', fontWeight: '600' }}>{calendarMonth.getFullYear()}年{calendarMonth.getMonth() + 1}月</span>
                  <button onClick={nextMonth} className="glass-btn" style={{ padding: '6px 14px', fontSize: '12px' }}>下月 ▶</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.35)', padding: '8px 0' }}>{d}</div>
                  ))}
                  {getDaysInMonth(calendarMonth).map((dayInfo, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default',
                        background: dayInfo.isToday ? '#00f0ff20' : dayInfo.hasCheckIn && dayInfo.isCurrentMonth ? '#00ff8815' : dayInfo.isCurrentMonth ? 'rgba(255,255,255,0.03)' : 'transparent',
                        border: dayInfo.isToday ? '1px solid #00f0ff40' : '1px solid transparent',
                        color: dayInfo.isCurrentMonth ? (dayInfo.hasCheckIn ? '#00ff88' : 'rgba(255,255,255,0.7)') : 'rgba(255,255,255,0.2)',
                        fontWeight: dayInfo.isToday ? '700' : '500',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {dayInfo.day}
                      {dayInfo.hasCheckIn && dayInfo.isCurrentMonth && (
                        <span style={{ position: 'absolute', bottom: '2px', width: '4px', height: '4px', borderRadius: '50%', background: '#00ff88' }} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                  <span>● 已打卡</span>
                  <span>○ 未打卡</span>
                  <span>🔵 今天</span>
                </div>
              </div>
            )}
          </>
        )}
        </>
        )}

        {lastPoints > 0 && (
          <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #00ff88, #00f0ff)', color: '#000', padding: '12px 24px', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,255,136,0.4)', zIndex: 100 }}>
            +{lastPoints} 积分！🎉
          </div>
        )}
      </div>
    </>
  );
}
