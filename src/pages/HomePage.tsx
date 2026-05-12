﻿import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useCheckInStore } from '../stores/checkInStore';
import { checkInApi, rewardApi } from '../lib/api';
import { getRankByPoints } from '../lib/ranks';
import { getDailyQuote, getRandomQuote } from '../lib/quotes';
import type { Quote } from '../lib/quotes';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export function HomePage() {
  const navigate = useNavigate();
  const { todayCheckIns, loadTodayCheckIns } = useCheckInStore();
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [rewards, setRewards] = useState<{ name: string; pointsCost: number }[]>([]);
  const [quote, setQuote] = useState<Quote>(getDailyQuote());
  const [weeklyData, setWeeklyData] = useState<number[]>([]);
  const [categoryData, setCategoryData] = useState<{ label: string; value: number; color: string }[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [chartColors, setChartColors] = useState({
    accent: '#39ff14',
    accentDim: 'rgba(57, 255, 20, 0.1)',
    accentGlow: 'rgba(57, 255, 20, 0.3)',
    bgPrimary: '#0a0a0f',
  });

  const updateChartColors = useCallback(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    setChartColors({
      accent: style.getPropertyValue('--matrix-green').trim() || '#39ff14',
      accentDim: style.getPropertyValue('--accent-dim').trim() || 'rgba(57, 255, 20, 0.1)',
      accentGlow: style.getPropertyValue('--matrix-green-dim').trim() || 'rgba(57, 255, 20, 0.3)',
      bgPrimary: style.getPropertyValue('--bg-primary').trim() || '#0a0a0f',
    });
  }, []);

  useEffect(() => {
    updateChartColors();
    const observer = new MutationObserver(updateChartColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [updateChartColors]);

  const randomQuote = useCallback(() => {
    setQuote(getRandomQuote());
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const stats = await checkInApi.getStats();
      setTotalPoints(stats.totalPoints);
      setStreak(stats.streak);
      const rewardData = await rewardApi.getAll();
      setRewards(rewardData.filter(r => !r.redeemed).slice(0, 4));

      const weekly = await checkInApi.getWeekly();
      if (weekly && weekly.length > 0) {
        setWeeklyData(weekly.map(d => d.count || 0));
      } else {
        setWeeklyData(Array(7).fill(0));
      }

      const catCounts: Record<string, number> = {};
      const allCheckins = await checkInApi.getAll();
      if (Array.isArray(allCheckins) && allCheckins.length > 0) {
        allCheckins.forEach((c: any) => {
          catCounts[c.category] = (catCounts[c.category] || 0) + 1;
        });
      }
      setCategoryData(categories.map(c => ({
        label: c.label,
        value: catCounts[c.key] || 0,
        color: c.color,
      })));
    } catch { /* ignore */ }
  }, [todayCheckIns]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await loadTodayCheckIns();
      await loadStats();
      if (mounted) randomQuote();
    };
    init();
    return () => { mounted = false };
  }, [loadStats, loadTodayCheckIns, randomQuote]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rank = getRankByPoints(totalPoints);

  const categories = [
    { key: 'HEALTH', label: '健康', icon: '❤️', points: 10, color: '#FF6B6B' },
    { key: 'STUDY', label: '学习', icon: '📚', points: 15, color: '#4ECDC4' },
    { key: 'WORK', label: '工作', icon: '💼', points: 15, color: '#45B7D1' },
    { key: 'DISCIPLINE', label: '自律', icon: '🎯', points: 20, color: '#96CEB4' },
    { key: 'REVIEW', label: '复盘', icon: '📝', points: 25, color: '#FFEAA7' },
  ];

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: chartColors.bgPrimary,
        titleColor: chartColors.accent,
        bodyColor: 'rgba(255,255,255,0.9)',
        borderColor: chartColors.accent,
        borderWidth: 2,
        cornerRadius: 12,
        padding: 14,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        displayColors: true,
        boxPadding: 8,
      },
    },
    scales: {
      x: {
        grid: { color: chartColors.accentDim, drawBorder: false },
        ticks: { color: chartColors.accentGlow, font: { size: 12, family: "'Courier New'" } },
      },
      y: {
        min: 0,
        max: Math.max(5, ...weeklyData) + 1,
        grid: { color: chartColors.accentDim, drawBorder: false },
        ticks: { color: chartColors.accentGlow, font: { size: 12, family: "'Courier New'" }, stepSize: 1 },
      },
    },
    interaction: { intersect: false, mode: 'index' as const },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          color: chartColors.accentGlow,
          padding: 14,
          font: { size: 12, family: "'Courier New'" },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: chartColors.bgPrimary,
        titleColor: chartColors.accent,
        bodyColor: 'rgba(255,255,255,0.9)',
        borderColor: chartColors.accent,
        borderWidth: 2,
        cornerRadius: 12,
        padding: 14,
      },
    },
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  };

  return (
    <div className="dashboard-container" style={{ 
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0f14 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 科技网格背景 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(var(--accent-dim) 1px, transparent 1px),
          linear-gradient(90deg, var(--accent-dim) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* 扫描线动画 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, transparent, var(--matrix-green), transparent)',
        animation: 'scanlineMove 4s linear infinite',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* 主容器 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
      }} className="container-padding">

        {/* 顶部标题栏 */}
        <div className="cyber-border header-section" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '20px 28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h1 className="cyber-title" style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--matrix-green)',
              margin: 0,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              ⚡ 成长指挥中心
            </h1>
            <p style={{
              fontSize: '13px',
              color: 'var(--matrix-green-dim)',
              marginTop: '6px',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
            }}>
              GROWTH COMMAND CENTER v2.0 · 实时监控
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="time-display" style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#00f0ff',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '3px',
              lineHeight: 1,
            }}>
              {formatTime(currentTime)}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--matrix-green-dim)',
              fontFamily: "'Courier New', monospace",
              marginTop: '4px',
            }}>
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* 统计卡片区 */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '18px',
          marginBottom: '24px',
        }}>
          {[
            { icon: '🔥', label: '连续打卡', value: streak, unit: '天', color: '#FF6B6B', glow: 'rgba(255,107,107,0.4)' },
            { icon: '⭐', label: '累计积分', value: totalPoints, unit: '分', color: '#FFD700', glow: 'rgba(255,215,0,0.4)' },
            { icon: rank.icon, label: '当前段位', value: rank.nameCn, unit: '', color: rank.color, glow: `${rank.color}40` },
            { icon: '✅', label: '今日完成', value: todayCheckIns.length, unit: '/5', color: '#00ff88', glow: 'rgba(0,255,136,0.4)' },
          ].map((stat, idx) => (
            <div key={idx} className="cyber-border stat-card-hfish" style={{
              padding: '22px 20px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '--hover-color': stat.glow,
            } as React.CSSProperties}>
              {/* 背景光效 */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`,
                opacity: 0.15,
                pointerEvents: 'none',
              }} />

              <div style={{
                fontSize: '36px',
                marginBottom: '8px',
                filter: 'drop-shadow(0 0 8px currentColor)',
              }}>
                {typeof stat.value === 'number' ? (
                  <span style={{ color: stat.color, fontSize: '38px', fontWeight: '700', fontFamily: "'Courier New', monospace" }}>
                    <AnimatedNumber value={stat.value} />
                  </span>
                ) : (
                  <span style={{ color: stat.color, fontSize: '26px', fontWeight: '700', fontFamily: "'Courier New', monospace" }}>
                    {stat.value}
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '13px',
                color: 'var(--matrix-green-dim)',
                fontWeight: '500',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '1px',
              }}>
                {stat.icon} {stat.label}
                {stat.unit && <span style={{ marginLeft: '4px', color: stat.color }}>{stat.unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* 主要内容区 */}
        <div className="main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }} ref={chartContainerRef}>
          {/* 左侧：趋势图 */}
          <div className="cyber-border" style={{ padding: '24px' }}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--matrix-green)',
              marginBottom: '18px',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              📈 近 7 天打卡趋势
              <span style={{
                fontSize: '11px',
                color: 'var(--matrix-green-dim)',
                fontWeight: '400',
              }}>ANALYTICS</span>
            </div>
            <div style={{ height: '260px' }}>
              <Line data={{
                labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                datasets: [{
                  data: weeklyData.length ? weeklyData : Array(7).fill(0),
                  borderColor: chartColors.accent,
                  backgroundColor: chartColors.accentDim,
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: chartColors.accent,
                  pointBorderColor: chartColors.bgPrimary,
                  pointBorderWidth: 3,
                  pointRadius: 6,
                  pointHoverRadius: 9,
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: chartColors.accent,
                  pointHoverBorderWidth: 3,
                }],
              }} options={lineChartOptions} />
            </div>
          </div>

          {/* 中间：分类占比 */}
          <div className="cyber-border" style={{ padding: '24px' }}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--matrix-green)',
              marginBottom: '18px',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              🍩 分类占比
              <span style={{
                fontSize: '11px',
                color: 'var(--matrix-green-dim)',
                fontWeight: '400',
              }}>分类</span>
            </div>
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {categoryData.every(d => d.value === 0) ? (
                <div style={{ color: chartColors.accentGlow, fontFamily: "'Courier New'", fontSize: 13, textAlign: 'center' }}>
                  暂无分类数据<br />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>去打卡页面开始记录</span>
                </div>
              ) : (
                <Doughnut data={{
                  labels: categoryData.map(d => d.label),
                  datasets: [{
                    data: categoryData.map(d => d.value),
                    backgroundColor: categoryData.map(d => d.color),
                    borderColor: chartColors.bgPrimary,
                    borderWidth: 3,
                    hoverOffset: 12,
                    hoverBorderColor: '#fff',
                    hoverBorderWidth: 3,
                  }],
                }} options={doughnutOptions} />
              )}
            </div>
          </div>

          {/* 右侧：快速操作 */}
          <div className="cyber-border" style={{ padding: '24px' }}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--matrix-green)',
              marginBottom: '18px',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              ⚡ 快捷入口
              <span style={{
                fontSize: '11px',
                color: 'var(--matrix-green-dim)',
                fontWeight: '400',
              }}>QUICK ACCESS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '立即打卡', icon: '✅', path: '/checkin', color: '#00ff88' },
                { label: '查看目标', icon: '🎯', path: '/goals', color: '#00f0ff' },
                { label: '积分商城', icon: '🛒', path: '/rewards', color: '#ffd93d' },
                { label: '排行榜', icon: '🏆', path: '/leaderboard', color: '#ff6b6b' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: `1.5px solid ${item.color}35`,
                    background: `${item.color}08`,
                    color: item.color,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: "'Courier New', monospace",
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${item.color}18`;
                    e.currentTarget.style.borderColor = item.color;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${item.color}08`;
                    e.currentTarget.style.borderColor = `${item.color}35`;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                  <span style={{ marginLeft: 'auto', fontSize: '18px', opacity: 0.5 }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 每日金句区域 */}
        <div className="cyber-border quote-section" style={{
          padding: '24px 28px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--matrix-green), #00f0ff, #ff6b6b, var(--matrix-green))',
            backgroundSize: '300% 100%',
            animation: 'gradientShift 4s ease infinite',
          }} />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--matrix-green)',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              💡 每日金句
              <span style={{
                fontSize: '11px',
                color: 'var(--matrix-green-dim)',
                fontWeight: '400',
              }}>MOTIVATION</span>
            </div>
            <button onClick={randomQuote}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: '1.5px solid var(--matrix-green-dim)',
                background: 'var(--accent-dim)',
                color: 'var(--matrix-green)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--matrix-green-dim)';
                e.currentTarget.style.boxShadow = '0 0 16px var(--matrix-green-dim)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-dim)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ⟳ 换一句
            </button>
          </div>

          <div style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.8,
            fontStyle: 'italic',
            paddingLeft: '20px',
            borderLeft: '3px solid var(--matrix-green)',
          }}>
            "{quote.text}"
          </div>
          <div style={{
            marginTop: '10px',
            fontSize: '13px',
            color: 'var(--matrix-green-dim)',
            textAlign: 'right',
            fontFamily: "'Courier New', monospace",
          }}>
            —— {quote.author}
          </div>
        </div>

        {/* 今日打卡状态 */}
        <div className="cyber-border" style={{
          padding: '24px 28px',
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '600',
            color: 'var(--matrix-green)',
            marginBottom: '18px',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            ✅ 今日已完成
            <span style={{
              fontSize: '11px',
              color: 'var(--matrix-green-dim)',
              fontWeight: '400',
            }}>TODAY'S PROGRESS</span>
          </div>

          {/* 进度条 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div style={{
              flex: 1,
              height: '10px',
              background: 'var(--accent-dim)',
              borderRadius: '5px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${Math.min((todayCheckIns.length / 5) * 100, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--matrix-green), #00f0ff)',
                borderRadius: '5px',
                boxShadow: '0 0 20px var(--matrix-green-dim), inset 0 0 10px rgba(255,255,255,0.2)',
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '6px',
                  height: '14px',
                  background: '#fff',
                  borderRadius: '3px',
                  boxShadow: '0 0 12px rgba(255,255,255,0.9)',
                }} />
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--matrix-green)',
              fontFamily: "'Courier New', monospace",
              minWidth: '60px',
              textAlign: 'right',
            }}>
              {todayCheckIns.length}/5
            </div>
          </div>

          {/* 打卡分类 */}
          <div className="checkin-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '14px',
          }}>
            {categories.map((cat) => {
              const isDone = todayCheckIns.some(c => c.category === cat.key);
              return (
                <div key={cat.key} className="checkin-item cyber-border" style={{
                  textAlign: 'center',
                  padding: '16px 10px',
                  borderRadius: '12px',
                  background: isDone ? `${cat.color}10` : 'var(--accent-dim)',
                  border: `1.5px solid ${isDone ? `${cat.color}45` : 'var(--matrix-green-dim)'}`,
                  '--hover-color': isDone ? cat.color : 'var(--matrix-green-dim)',
                } as React.CSSProperties}>
                  <div style={{
                    fontSize: '28px',
                    marginBottom: '8px',
                    opacity: isDone ? 1 : 0.3,
                    filter: isDone ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: isDone ? cat.color : 'var(--matrix-green-dim)',
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '0.5px',
                  }}>
                    {cat.label}
                  </div>
                  {isDone && (
                    <div style={{
                      fontSize: '11px',
                      color: '#00ff88',
                      marginTop: '6px',
                      fontWeight: '600',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      ✓ 已完成
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '18px',
            fontSize: '13px',
            color: 'var(--matrix-green-dim)',
            fontFamily: "'Courier New', monospace",
          }}>
            前往{' '}
            <span
              onClick={() => navigate('/checkin')}
              style={{
                color: '#00f0ff',
                cursor: 'pointer',
                textDecoration: 'underline',
                textDecorationStyle: 'dashed',
                textDecorationColor: 'rgba(0,240,255,0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--matrix-green)';
                e.currentTarget.style.textDecorationColor = 'var(--matrix-green)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#00f0ff';
                e.currentTarget.style.textDecorationColor = 'rgba(0,240,255,0.4)';
              }}
            >
              打卡页面
            </span>
            {' '}完成今日打卡
          </div>
        </div>

        {/* 可兑换奖励 */}
        {rewards.length > 0 && (
          <div className="cyber-border" style={{
            padding: '24px 28px',
            marginBottom: '24px',
          }}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--matrix-green)',
              marginBottom: '18px',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              🎁 可兑换奖励
              <span style={{
                fontSize: '11px',
                color: 'var(--matrix-green-dim)',
                fontWeight: '400',
              }}>奖励</span>
            </div>
            <div className="rewards-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px',
            }}>
              {rewards.map((r, i) => (
                <div key={i} className="cyber-border" style={{
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,240,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '6px',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {r.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#00f0ff',
                    fontWeight: '700',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {r.pointsCost} 积分
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部版权信息 */}
        <div style={{
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid var(--matrix-green-dim)',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--matrix-green-dim)',
          fontFamily: "'Courier New', monospace",
          letterSpacing: '1px',
        }}>
          Growth Dashboard v2.0 · Matrix Terminal Edition · Powered by React & Chart.js
        </div>
      </div>
    </div>
  );
}
