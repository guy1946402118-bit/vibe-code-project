﻿﻿﻿﻿﻿import { useEffect, useState } from 'react';
import { AIReview } from '../components/AIReview';
import { checkInApi, type CheckIn } from '../lib/api';

interface WeeklyReview {
  id: string;
  weekStart: string;
  totalCheckIns: number;
  totalPoints: number;
  topCategory: string;
  improvement: string;
  summary: string;
  insights: string[];
}

export function ReviewPage() {
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const stats = await checkInApi.getStats();
      const weekly = await checkInApi.getWeekly();
      const recentCheckIns = await checkInApi.getAll({
        startTime: Date.now() - 4 * 7 * 24 * 60 * 60 * 1000,
        endTime: Date.now(),
      });

      const allReviews: WeeklyReview[] = [];
      for (let w = 0; w < 4; w++) {
        const weekStart = getWeekStart(w);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekCheckIns = recentCheckIns.filter((ci: CheckIn) => {
          const ts = new Date(ci.timestamp).getTime();
          return ts >= new Date(weekStart).getTime() && ts <= weekEnd.getTime();
        });

        if (weekCheckIns.length === 0 && w > 0) continue;

        const catCounts: Record<string, number> = {};
        let totalPoints = 0;
        for (const ci of weekCheckIns) {
          catCounts[ci.category] = (catCounts[ci.category] || 0) + 1;
          totalPoints += ci.points || 0;
        }

        const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'STUDY';

        const insights: string[] = [];
        if (catCounts.STUDY) insights.push('📚 学习方面表现良好，继续保持');
        if (catCounts.HEALTH) insights.push('❤️ 健康习惯养成中');
        if (catCounts.WORK) insights.push('💼 工作效率稳定');
        if (catCounts.DISCIPLINE) insights.push('⚡ 自律打卡坚持中');
        if (catCounts.REVIEW) insights.push('📝 复盘习惯良好');
        if (insights.length === 0) insights.push('💡 建议开始每日打卡记录');
        if (weekCheckIns.length < 7) insights.push('⏰ 打卡频率可进一步提升');

        allReviews.push({
          id: `w${w}`,
          weekStart,
          totalCheckIns: weekCheckIns.length,
          totalPoints,
          topCategory,
          improvement: weekCheckIns.length < 14 ? '本周打卡次数偏少，建议增加日常记录' : '保持当前节奏',
          summary: weekCheckIns.length > 0
            ? `本周共打卡 ${weekCheckIns.length} 次，获得 ${totalPoints} 分`
            : '本周暂无打卡记录',
          insights: insights.length > 0 ? insights : ['📊 开始你的打卡之旅吧'],
        });
      }

      if (allReviews.length === 0) {
        const fallback: WeeklyReview = {
          id: 'fallback',
          weekStart: getWeekStart(0),
          totalCheckIns: 0,
          totalPoints: 0,
          topCategory: 'STUDY',
          improvement: '还没有数据，开始第一次打卡',
          summary: '空白周 - 等待你的记录',
          insights: ['🚀 开始你的第一次打卡吧', '📊 记录每日成长', '📝 每周回顾会更有帮助'],
        };
        setReviews([fallback]);
        setCurrentReview(fallback);
        return;
      }

      setReviews(allReviews);
      setCurrentReview(allReviews[0]);
    } catch {
      const fallback: WeeklyReview = {
        id: 'fallback',
        weekStart: getWeekStart(0),
        totalCheckIns: 0,
        totalPoints: 0,
        topCategory: 'STUDY',
        improvement: '加载数据失败，请稍后重试',
        summary: '数据加载中...',
        insights: ['请确保后端服务正常运行'],
      };
      setReviews([fallback]);
      setCurrentReview(fallback);
    }
  };

  function getWeekStart(weeksAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - (weeksAgo * 7 + date.getDay()));
    return date.toISOString().split('T')[0];
  }

  const getWeekLabel = (index: number): string => {
    if (index === 0) return '上周';
    if (index === 1) return '2周前';
    return `${index + 1}周前`;
  };

  const formatWeekRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      HEALTH: '❤️',
      STUDY: '📚',
      WORK: '💼',
      FITNESS: '💪',
      DISCIPLINE: '⚡',
      REVIEW: '📝',
    };
    return icons[category] || '📌';
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      HEALTH: '健康',
      STUDY: '学习',
      WORK: '工作',
      FITNESS: '健身',
      DISCIPLINE: '自律',
      REVIEW: '复盘',
    };
    return labels[category] || category;
  };

  const getWeekScore = (review: WeeklyReview): number => {
    const checkInScore = Math.min((review.totalCheckIns / 35) * 100, 100);
    const pointsScore = Math.min((review.totalPoints / 200) * 100, 100);
    return Math.round((checkInScore + pointsScore) / 2);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
          📊 智能复盘
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          回顾过去，展望未来，持续精进
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('ai')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'ai' ? 'var(--matrix-green)' : 'rgba(255,255,255,0.15)'}`,
            background: activeTab === 'ai' ? 'var(--matrix-green-dim)' : 'transparent',
            color: activeTab === 'ai' ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
          }}
        >
          🤖 智能分析
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'manual' ? '#00f0ff' : 'rgba(255,255,255,0.15)'}`,
            background: activeTab === 'manual' ? 'rgba(0,240,255,0.12)' : 'transparent',
            color: activeTab === 'manual' ? '#00f0ff' : 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
          }}
        >
          ✍️ 手动复盘
        </button>
      </div>

      {activeTab === 'ai' ? (
        <AIReview />
      ) : (
      <>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {reviews.map((review, i) => (
          <button
            key={review.id}
            onClick={() => {
              setSelectedWeek(i);
              setCurrentReview(review);
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: selectedWeek === i ? '2px solid #00f0ff' : '2px solid rgba(255,255,255,0.1)',
              background: selectedWeek === i ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: selectedWeek === i ? '#00f0ff' : 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontWeight: '600' }}>{getWeekLabel(i)}</div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
              {formatWeekRange(review.weekStart)}
            </div>
          </button>
        ))}
      </div>

      {currentReview && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,255,136,0.1))',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(0,240,255,0.2)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                周得分
              </div>
              <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#00f0ff' }}>
                {getWeekScore(currentReview)}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                / 100
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                📈 数据概览
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88' }}>
                    {currentReview.totalCheckIns}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>打卡次数</div>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffaa00' }}>
                    {currentReview.totalPoints}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>获得积分</div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255,107,107,0.2)',
              }}
            >
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                🏆 最强项
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>{getCategoryIcon(currentReview.topCategory)}</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                    {getCategoryLabel(currentReview.topCategory)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    本周冠军
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255,170,0,0.2)',
              }}
            >
              <h3 style={{ fontSize: '14px', color: '#ffaa00', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📝 需要改进
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {currentReview.improvement}
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <h3 style={{ fontSize: '14px', color: '#00ff88', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✨ 本周总结
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                {currentReview.summary}
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(170,0,255,0.1))',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💡 AI 洞察
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentReview.insights.map((insight, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                  }}
                >
                  <span style={{ fontSize: '16px', marginTop: '2px' }}>
                    {insight.startsWith('📚') ? '📚' :
                     insight.startsWith('💪') ? '💪' :
                     insight.startsWith('💼') ? '💼' :
                     insight.startsWith('❤️') ? '❤️' :
                     insight.startsWith('🌅') ? '🌅' :
                     insight.startsWith('🧘') ? '🧘' : '💡'}
                  </span>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    {insight.replace(/^.\s/, '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: '24px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '16px' }}>
              📋 下周行动计划
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { task: '每天早起后进行10分钟冥想', category: 'HEALTH' },
                { task: '阅读专业书籍至少30页/天', category: 'STUDY' },
                { task: '每天坚持30分钟有氧运动', category: 'FITNESS' },
                { task: '完成周报并设定下周目标', category: 'WORK' },
              ].map((item, i) => (
                <label
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#00f0ff',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    {item.task}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    color: getCategoryIcon(item.category) === '❤️' ? '#ff6b6b' :
                           getCategoryIcon(item.category) === '📚' ? '#4ecdc4' :
                           getCategoryIcon(item.category) === '💪' ? '#96ceb4' : '#45b7d1',
                  }}>
                    {getCategoryIcon(item.category)} {getCategoryLabel(item.category)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: '32px',
          textAlign: 'center',
          padding: '32px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
        <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          坚持复盘，让成长有迹可循<br />
          每一次反思都是进步的开始
        </div>
      </div>
      </>
      )}
    </div>
  );
}
