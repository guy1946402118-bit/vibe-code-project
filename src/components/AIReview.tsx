﻿﻿﻿﻿﻿import { useState, useEffect } from 'react';
import { generateWeeklyReport, generateMonthlyReport } from '../lib/reportGenerator';
import type { ReportData } from '../lib/reportGenerator';

interface Insight {
  type: 'strength' | 'weakness' | 'suggestion' | 'achievement';
  icon: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export function AIReview() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const getCategoryName = (catKey: string): string => {
    const names: Record<string, string> = {
      HEALTH: '健康', STUDY: '学习', WORK: '工作', FITNESS: '健身',
      DISCIPLINE: '自律', REVIEW: '复盘', HABIT: '习惯',
    };
    return names[catKey] || catKey;
  };

  const getPeriodName = (): string => period === 'week' ? '本周' : '本月';

  const generateInsights = (data: ReportData): Insight[] => {
    const insights: Insight[] = [];
    const pName = getPeriodName();

    insights.push({
      type: 'achievement',
      icon: '🏆',
      title: `表现最佳：${getCategoryName(data.summary.topCategory)}`,
      description: `你在「${getCategoryName(data.summary.topCategory)}」方面表现最为出色，${pName}共完成 ${data.categoryStats[0]?.count || 0} 次打卡。`,
      impact: 'high',
    });

    if (data.summary.averagePerDay >= 3) {
      insights.push({
        type: 'strength',
        icon: '💪',
        title: '坚持达人',
        description: `你日均打卡 ${data.summary.averagePerDay} 次，展现了极强的自律力！`,
        impact: 'high',
      });
    }

    if (data.summary.streak >= 7) {
      insights.push({
        type: 'achievement',
        icon: '🔥',
        title: `${data.summary.streak} 天连续打卡！`,
        description: '令人印象深刻！你正在建立持久的习惯。',
        impact: 'high',
      });
    }

    const worstCategory = data.categoryStats[data.categoryStats.length - 1];
    if (worstCategory && worstCategory.count < data.summary.totalCheckIns * 0.15) {
      insights.push({
        type: 'weakness',
        icon: '⚠️',
        title: `「${getCategoryName(worstCategory.category)}」需要加强`,
        description: `仅有 ${worstCategory.percentage}% 的打卡属于「${getCategoryName(worstCategory.category)}」。建议下一个${period === 'week' ? '周' : '月'}多关注此领域。`,
        impact: 'medium',
      });
    }

    const weekendDays = data.dailyBreakdown.filter(d => ['Saturday', 'Sunday'].includes(d.dayName));
    const avgWeekend = weekendDays.reduce((sum, d) => sum + d.checkIns, 0) / Math.max(weekendDays.length, 1);
    const weekdayDays = data.dailyBreakdown.filter(d => !['Saturday', 'Sunday'].includes(d.dayName));
    const avgWeekday = weekdayDays.reduce((sum, d) => sum + d.checkIns, 0) / Math.max(weekdayDays.length, 1);

    if (avgWeekend < avgWeekday * 0.5) {
      insights.push({
        type: 'suggestion',
        icon: '📅',
        title: '周末活跃度较低',
        description: `周末日均 ${avgWeekend.toFixed(1)} 次，远低于工作日 ${avgWeekday.toFixed(1)} 次。尝试在周末安排一些轻松任务。`,
        impact: 'medium',
      });
    }

    insights.push({
      type: 'suggestion',
      icon: '🎯',
      title: `${period === 'week' ? '下周' : '下月'}行动建议`,
      description: period === 'week'
        ? `根据你的行为模式，建议每天打卡 ${Math.ceil(data.summary.averagePerDay) + 1} 次，以超越本周记录。`
        : `设定总打卡 ${Math.round(data.summary.totalCheckIns * 1.2)} 次的目标，实现 20% 的提升。`,
      impact: 'high',
    });

    if (data.goalsProgress.some(g => g.status === 'completed')) {
      insights.push({
        type: 'achievement',
        icon: '✅',
        title: '目标达成！',
        description: `你完成了 ${data.goalsProgress.filter(g => g.status === 'completed').length} 个目标！继续保持这股势头。`,
        impact: 'high',
      });
    }

    const incompleteGoals = data.goalsProgress.filter(g => g.status === 'in-progress');
    if (incompleteGoals.length > 0) {
      const lowestProgress = incompleteGoals.reduce((min, g) => g.progress < min.progress ? g : min, incompleteGoals[0]);
      insights.push({
        type: 'weakness',
        icon: '📊',
        title: `「${lowestProgress.title}」进度滞后`,
        description: `仅完成 ${lowestProgress.progress}%。建议将其拆分为更小的里程碑以保持动力。`,
        impact: 'low',
      });
    }

    return insights.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.impact] - order[b.impact];
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReport(null);
    setInsights([]);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newReport = period === 'week' ? generateWeeklyReport() : generateMonthlyReport();
    setReport(newReport);
    setInsights(generateInsights(newReport));
    setIsGenerating(false);
  };

  useEffect(() => {
    handleGenerate();
  }, []);

  const insightColors = {
    strength: { bg: 'var(--accent-dim)', border: 'var(--matrix-green)', text: 'var(--matrix-green)' },
    weakness: { bg: 'rgba(255,51,51,0.08)', border: '#ff3333', text: '#ff3333' },
    suggestion: { bg: 'rgba(57,144,217,0.08)', border: '#4a90d9', text: '#4a90d9' },
    achievement: { bg: 'rgba(243,156,18,0.08)', border: '#f39c12', text: '#f39c12' },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', fontFamily: "'Courier New', monospace" }}>
          🤖 AI 复盘助手
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'Courier New', monospace" }}>
          // 智能分析你的成长数据
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => { setPeriod('week'); handleGenerate(); }}
          disabled={isGenerating}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${period === 'week' ? 'var(--matrix-green)' : 'var(--border-medium)'}`,
            background: period === 'week' ? 'var(--matrix-green-dim)' : 'transparent',
            color: period === 'week' ? 'var(--matrix-green)' : 'var(--text-secondary)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.15s',
          }}
        >
          📅 周报
        </button>
        <button
          onClick={() => { setPeriod('month'); handleGenerate(); }}
          disabled={isGenerating}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${period === 'month' ? 'var(--matrix-green)' : 'var(--border-medium)'}`,
            background: period === 'month' ? 'var(--matrix-green-dim)' : 'transparent',
            color: period === 'month' ? 'var(--matrix-green)' : 'var(--text-secondary)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.15s',
          }}
        >
          📆 月报
        </button>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{
            padding: '16px 28px',
            borderRadius: '8px',
            border: '1px solid var(--matrix-green)',
            background: 'var(--accent-dim)',
            color: 'var(--matrix-green)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {isGenerating ? '⏳ 分析中...' : '🔄 重新生成'}
        </button>
      </div>

      {isGenerating && (
        <div style={{
          textAlign: 'center',
          padding: '80px 0',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--border-medium)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}>🤖</div>
          <div style={{ fontSize: '18px', color: 'var(--text-secondary)', fontFamily: "'Courier New', monospace" }}>
            正在分析你的成长数据...
          </div>
          <div style={{
            width: '200px',
            height: '4px',
            background: 'var(--bg-tertiary)',
            borderRadius: '2px',
            margin: '20px auto 0',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, var(--matrix-green), #00ff88, var(--matrix-green))',
              animation: 'shimmer 1.5s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }} />
          </div>
        </div>
      )}

      {!isGenerating && report && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            {[
              { label: '总打卡次数', value: report.summary.totalCheckIns.toString(), icon: '✅' },
              { label: '总积分', value: report.summary.totalPoints.toLocaleString(), icon: '💰' },
              { label: '日均打卡', value: report.summary.averagePerDay.toFixed(1), icon: '📊' },
              { label: '当前连续', value: `${report.summary.streak} 天`, icon: '🔥' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid var(--border-medium)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Courier New', monospace", marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: "'Courier New', monospace" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '8px',
            padding: '24px',
            border: '1px solid var(--border-medium)',
            marginBottom: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>
              💡 AI 洞察与建议
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {insights.map((insight, i) => {
                const colors = insightColors[insight.type];
                return (
                  <div
                    key={i}
                    style={{
                      background: colors.bg,
                      borderRadius: '6px',
                      padding: '16px',
                      borderLeft: `3px solid ${colors.border}`,
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{insight.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: '4px',
                        fontFamily: "'Courier New', monospace",
                      }}>
                        {insight.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {insight.description}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-muted)',
                      alignSelf: 'flex-start',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {insight.impact === 'high' ? '高' : insight.impact === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid var(--border-medium)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>
                📈 分类统计
              </h3>
              {report.categoryStats.map((cat, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '4px',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{getCategoryName(cat.category)}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{cat.count} 次（{cat.percentage}%）</span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${cat.percentage}%`,
                        background: i === 0 ? 'var(--matrix-green)' : 'var(--border-accent)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid var(--border-medium)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>
                🎯 目标进度
              </h3>
              {report.goalsProgress.map((goal, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '6px',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{goal.title}</span>
                    <span style={{
                      color: goal.status === 'completed' ? 'var(--matrix-green)' : 
                             goal.status === 'in-progress' ? '#f39c12' : 'var(--text-muted)'
                    }}>
                      {goal.progress}/{goal.target}
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${goal.progress}%`,
                        background: goal.status === 'completed' ? 'var(--matrix-green)' :
                                 goal.status === 'in-progress' ? '#f39c12' : 'var(--border-medium)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AIReview;
