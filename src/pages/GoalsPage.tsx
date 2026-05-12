﻿import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { QuadrantMatrix } from '../components/QuadrantMatrix';
import { GoalBreakdown } from '../components/GoalBreakdown';
import { GoalCard } from '../components/GoalCard';
import { goalApi } from '../lib/api';
import { showToast } from '../components/Toast';

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate?: string;
  status: string;
  priority: string;
  createdAt?: string;
  updatedAt?: string;

  smart?: {
    specific: string;
    measurable: { unit: string; target: number };
    achievable: 'easy' | 'medium' | 'hard' | 'extreme';
    relevant: string[];
    timeBound: { deadline: string; milestones: string[] };
  };
}

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  HEALTH: { icon: '❤️', color: '#ff6b6b', label: '健康' },
  STUDY: { icon: '📚', color: '#4ecdc4', label: '学习' },
  WORK: { icon: '💼', color: '#45b7d1', label: '工作' },
  FITNESS: { icon: '💪', color: '#96ceb4', label: '健身' },
  HABIT: { icon: '🎯', color: '#dda0dd', label: '习惯' },
  OTHER: { icon: '📌', color: '#a0a0a0', label: '其他' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  HIGH: { color: '#ff6b6b', label: '高' },
  MEDIUM: { color: '#ffaa00', label: '中' },
  LOW: { color: '#00ff88', label: '低' },
};

const FILTER_LABELS: Record<string, string> = {
  ALL: '全部',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  HEALTH: '❤️ 健康',
  STUDY: '📚 学习',
  WORK: '💼 工作',
  FITNESS: '💪 健身',
  HABIT: '🎯 习惯',
};

export function GoalsPage() {
  const { currentUser } = useUserStore();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'goals' | 'quadrant'>('goals');
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'HABIT',
    targetValue: 30,
    priority: 'MEDIUM',
    smart: {
      specific: '',
      measurable: { unit: '次', target: 30 },
      achievable: 'medium' as const,
      relevant: [] as string[],
      timeBound: {
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestones: [],
      },
    },
  });

  useEffect(() => {
    loadGoals();
  }, [currentUser]);

  const loadGoals = async () => {
    try {
      const serverGoals = await goalApi.getAll();
      if (serverGoals && serverGoals.length > 0) {
        setGoals(serverGoals.map((g: any) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          category: g.category,
          targetValue: g.targetValue,
          currentValue: g.currentValue,
          startDate: g.startDate,
          endDate: g.endDate,
          status: g.status,
          priority: g.priority,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          smart: undefined,
        })));
        return;
      }
    } catch (e) {
      console.warn('Failed to load goals from API:', e);
    }
    setGoals([]);
  };

  const getProgress = (goal: Goal) => Math.min((goal.currentValue / goal.targetValue) * 100, 100);

  const filteredGoals = goals.filter(g => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return g.status === 'COMPLETED';
    if (filter === 'IN_PROGRESS') return g.status === 'IN_PROGRESS';
    return g.category === filter;
  });

  const handleSubmit = async () => {
    if (!newGoal.title.trim()) return;
    try {
      const created = await goalApi.create({
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        targetValue: newGoal.targetValue,
        startDate: new Date().toISOString(),
        endDate: newGoal.smart.timeBound.deadline || undefined,
        priority: newGoal.priority,
      });
      const goal: Goal = {
        id: created.id || Date.now().toString(),
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category,
        targetValue: newGoal.targetValue,
        currentValue: 0,
        startDate: new Date().toISOString(),
        endDate: newGoal.smart.timeBound.deadline || undefined,
        status: 'IN_PROGRESS',
        priority: newGoal.priority,
      };
      setGoals(prev => [...prev, goal]);
      showToast({ type: 'success', title: '目标已创建', message: `「${newGoal.title}」已加入你的成长计划`, duration: 3000 });
    } catch (e) {
      console.warn('Failed to create goal:', e);
      showToast({ type: 'warning', title: '创建失败', message: '请检查网络连接后重试', duration: 3000 });
    }
    setShowModal(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'HABIT',
      targetValue: 30,
      priority: 'MEDIUM',
      smart: {
        specific: '',
        measurable: { unit: '次', target: 30 },
        achievable: 'medium' as const,
        relevant: [] as string[],
        timeBound: {
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          milestones: [],
        },
      },
    });
  };

  const updateProgress = async (goalId: string, newValue: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;
      const newCurrent = Math.min(newValue, goal.targetValue);
      const newStatus = newCurrent >= goal.targetValue ? 'COMPLETED' : 'IN_PROGRESS';
      await goalApi.update(goalId, { currentValue: newCurrent, status: newStatus });
    } catch (e) { console.warn('Failed to update goal progress:', e); }

    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const updated = { ...g, currentValue: Math.min(newValue, g.targetValue) };
        if (updated.currentValue >= g.targetValue) {
          updated.status = 'COMPLETED';
          showToast({
            type: 'achievement',
            title: '目标达成！',
            message: `恭喜完成「${g.title}」！获得30积分奖励`,
            duration: 6000,
            action: {
              label: '📝 写篇复盘文章',
              onClick: () => navigate('/blog/new'),
            },
          });
        }
        return updated;
      }
      return g;
    });
    setGoals(updatedGoals);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(var(--blur-md))',
        WebkitBackdropFilter: 'blur(var(--blur-md))',
        borderRadius: 'var(--radius-md)',
        padding: '24px 28px',
        marginBottom: '24px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Courier New', monospace", letterSpacing: '0.02em' }}>
              <span style={{ color: 'var(--matrix-green)' }}>&#9678;</span> 目标管理中心
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0, fontFamily: "'Courier New', monospace" }}>
              设定目标，追踪进度，见证成长
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActiveTab('goals')}
              style={{
                padding: '8px 22px', borderRadius: 'var(--radius-sm)',
                border: activeTab === 'goals' ? '1.5px solid var(--matrix-green)' : '1.5px solid var(--border-light)',
                background: activeTab === 'goals' ? 'var(--accent-dim)' : 'var(--bg-glass)',
                color: activeTab === 'goals' ? 'var(--matrix-green)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'goals' ? '0 0 12px var(--accent-glow)' : 'none',
              }}
            >
              &#9783; 目标列表
            </button>
            <button
              onClick={() => setActiveTab('quadrant')}
              style={{
                padding: '8px 22px', borderRadius: 'var(--radius-sm)',
                border: activeTab === 'quadrant' ? '1.5px solid var(--accent)' : '1.5px solid var(--border-light)',
                background: activeTab === 'quadrant' ? 'var(--accent-dim)' : 'var(--bg-glass)',
                color: activeTab === 'quadrant' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'quadrant' ? '0 0 12px var(--accent-glow)' : 'none',
              }}
            >
              &#8986; 四象限
            </button>
          </div>
        </div>

        {activeTab === 'goals' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {['ALL', 'IN_PROGRESS', 'COMPLETED', 'HEALTH', 'STUDY', 'WORK', 'FITNESS', 'HABIT'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 14px', borderRadius: '20px',
                    border: filter === f ? '1.5px solid var(--accent)' : '1px solid var(--border-light)',
                    background: filter === f ? 'var(--accent-dim)' : 'transparent',
                    color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12, cursor: 'pointer', fontWeight: filter === f ? 600 : 400,
                    fontFamily: "'Courier New', monospace",
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {FILTER_LABELS[f] || f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '7px 18px', borderRadius: '20px',
                border: '1.5px solid var(--matrix-green-bright)',
                background: 'var(--matrix-green-dim)',
                color: 'var(--matrix-green-bright)',
                fontSize: 13, cursor: 'pointer', fontWeight: 700,
                fontFamily: "'Courier New', monospace",
                textShadow: '0 0 6px var(--accent-glow)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              + 创建目标
            </button>
          </div>
        )}
      </div>

      {activeTab === 'quadrant' && <QuadrantMatrix />}

      {activeTab === 'goals' && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredGoals.map((goal, idx) => {
          const cat = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.OTHER;
          const isCompleted = goal.status === 'COMPLETED';

          return (
            <div key={goal.id} style={{ animationDelay: `${idx * 0.06}s`, animation: `goalCardEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) both` }}>
              <div
                onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                style={{ cursor: 'pointer' }}
              >
                <GoalCard
                  goal={{
                    id: goal.id,
                    title: goal.title,
                    description: goal.description || '',
                    category: goal.category,
                    currentCount: goal.currentValue,
                    targetCount: goal.targetValue,
                    unit: goal.unit || '次',
                    points: goal.points || 0,
                    isCompleted,
                    color: cat.color,
                    icon: cat.icon,
                  }}
                  onProgress={(goalId) => {
                    const g = goals.find(g => g.id === goalId);
                    if (g) updateProgress(goalId, g.currentValue + 1);
                  }}
                />
              </div>

              <div style={{
                textAlign: 'center',
                marginTop: 6,
                padding: '4px 0 0',
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: "'Courier New', monospace",
              }}>
                {expandedGoalId === goal.id ? '▲ 收起详情' : '▼ 查看目标拆解'}
              </div>

              {expandedGoalId === goal.id && (
                <div style={{
                  marginTop: 12,
                  padding: 18,
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(var(--blur-md))',
                  WebkitBackdropFilter: 'blur(var(--blur-md))',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                }}>
                  <GoalBreakdown
                    goalId={goal.id}
                    goalTitle={goal.title}
                    goalCategory={goal.category}
                    targetValue={goal.targetValue}
                    currentValue={goal.currentValue}
                    onPointsEarned={(points) => showToast({ type: 'success', title: '积分奖励', message: `获得 +${points} 积分！`, duration: 3000 })}
                    onGoalComplete={() => showToast({ type: 'achievement', title: '目标完成！', message: '所有里程碑已全部达成！', duration: 5000 })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {filteredGoals.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: 'rgba(255,255,255,0.3)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <div style={{ fontSize: '16px' }}>暂无目标</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>点击"创建目标"开始你的成长之旅</div>
        </div>
      )}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%)',
              borderRadius: '20px',
              padding: '24px',
              width: '90%',
              maxWidth: '450px',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px' }}>新建目标</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                目标名称
              </label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="例如：每日阅读30分钟"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                目标描述（可选）
              </label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="描述你的目标..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  resize: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                  分类
                </label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                    <option key={key} value={key}>{val.icon} {val.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                  优先级
                </label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="HIGH">🔴 高优先级</option>
                  <option value="MEDIUM">🟡 中优先级</option>
                  <option value="LOW">🟢 低优先级</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px' }}>
                目标值（次数/天数）
              </label>
              <input
                type="number"
                min="1"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.3)',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{
              background: 'var(--accent-dim)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid var(--matrix-green-dim)',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--matrix-green)', marginBottom: '12px', fontFamily: "'Courier New', monospace" }}>
                🎯 SMART 目标设定
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
                  S - Specific (具体明确)
                </label>
                <input
                  type="text"
                  value={newGoal.smart.specific}
                  onChange={(e) => setNewGoal({
                    ...newGoal,
                    smart: { ...newGoal.smart, specific: e.target.value }
                  })}
                  placeholder="具体要做什么？例如：每天晚上9点阅读30分钟"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--matrix-green-dim)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#e8e8e8',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: "'Courier New', monospace",
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
                    M - Measurable (可衡量)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      value={newGoal.smart.measurable.target}
                      onChange={(e) => setNewGoal({
                        ...newGoal,
                        smart: {
                          ...newGoal.smart,
                          measurable: { ...newGoal.smart.measurable, target: parseInt(e.target.value) || 1 }
                        }
                      })}
                      placeholder="数量"
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--matrix-green-dim)',
                        background: 'rgba(0,0,0,0.4)',
                        color: '#e8e8e8',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <select
                      value={newGoal.smart.measurable.unit}
                      onChange={(e) => setNewGoal({
                        ...newGoal,
                        smart: { ...newGoal.smart, measurable: { ...newGoal.smart.measurable, unit: e.target.value } }
                      })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid var(--matrix-green-dim)',
                        background: 'rgba(0,0,0,0.4)',
                        color: '#e8e8e8',
                        fontSize: '13px',
                      }}
                    >
                      <option value="次">次</option>
                      <option value="页">页</option>
                      <option value="公里">公里</option>
                      <option value="分钟">分钟</option>
                      <option value="个">个</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
                    A - Achievable (可实现)
                  </label>
                  <select
                    value={newGoal.smart.achievable}
                    onChange={(e) => setNewGoal({
                      ...newGoal,
                      smart: { ...newGoal.smart, achievable: e.target.value as any }
                    })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid var(--matrix-green-dim)',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#e8e8e8',
                      fontSize: '13px',
                    }}
                  >
                    <option value="easy">🟢 简单 (轻松完成)</option>
                    <option value="medium">🟡 中等 (需要努力)</option>
                    <option value="hard">🔴 困难 (挑战自我)</option>
                    <option value="extreme">⚡ 极限 (突破极限)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
                  R - Relevant (相关性)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['职业发展', '健康', '知识积累', '财务自由', '人际关系', '心理健康'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const relevant = newGoal.smart.relevant.includes(tag)
                          ? newGoal.smart.relevant.filter(t => t !== tag)
                          : [...newGoal.smart.relevant, tag];
                        setNewGoal({ ...newGoal, smart: { ...newGoal.smart, relevant } });
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: `1px solid ${newGoal.smart.relevant.includes(tag) ? 'var(--matrix-green)' : 'rgba(255,255,255,0.15)'}`,
                        background: newGoal.smart.relevant.includes(tag) ? 'var(--matrix-green-dim)' : 'transparent',
                        color: newGoal.smart.relevant.includes(tag) ? 'var(--matrix-green)' : 'rgba(255,255,255,0.6)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
                  T - Time-bound (时限性)
                </label>
                <input
                  type="date"
                  value={newGoal.smart.timeBound.deadline}
                  onChange={(e) => setNewGoal({
                    ...newGoal,
                    smart: {
                      ...newGoal.smart,
                      timeBound: { ...newGoal.smart.timeBound, deadline: e.target.value }
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--matrix-green-dim)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#e8e8e8',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00f0ff, #00ff88)',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                创建目标
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
