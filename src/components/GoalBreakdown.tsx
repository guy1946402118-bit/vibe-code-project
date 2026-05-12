import { useState, useEffect, useRef, useCallback } from 'react';
import { ProgressParticle } from './ProgressParticle';
import { FlyingNumber } from './FlyingNumber';
import { showToast } from './Toast';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  status: 'pending' | 'in_progress' | 'completed';
  points: number;
  deadline?: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  points: number;
  completedAt?: string;
}

interface GoalBreakdownProps {
  goalId: string;
  goalTitle: string;
  goalCategory: string;
  targetValue: number;
  currentValue: number;
  onPointsEarned?: (points: number) => void;
  onGoalComplete?: () => void;
}

const DIFFICULTY_MULTIPLIER = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  extreme: 3,
};

export function GoalBreakdown({
  goalTitle,
  targetValue,
  currentValue,
  onPointsEarned,
  onGoalComplete,
}: GoalBreakdownProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', targetValue: 10 });
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [subTasks, setSubTasks] = useState<Record<string, SubTask[]>>({});
  const [combo, setCombo] = useState(0);
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particlePos, setParticlePos] = useState({ x: 0, y: 0 });
  const [particleColor, setParticleColor] = useState('#39ff14');
  const [particleBig, setParticleBig] = useState(false);
  const [flyTriggers, setFlyTriggers] = useState<{ id: number; x: number; y: number; value: number; color: string }[]>([]);
  const flyIdRef = useRef(0);
  const taskBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    generateMilestones();
  }, [targetValue]);

  const spawnParticles = useCallback((x: number, y: number, color: string, big = false) => {
    setParticlePos({ x, y });
    setParticleColor(color);
    setParticleBig(big);
    setParticleTrigger(prev => prev + 1);
  }, []);

  const spawnFlyNumber = useCallback((x: number, y: number, value: number, color: string) => {
    const id = ++flyIdRef.current;
    setFlyTriggers(prev => [...prev, { id, x, y, value, color }]);
    setTimeout(() => {
      setFlyTriggers(prev => prev.filter(f => f.id !== id));
    }, 1000);
  }, []);

  const generateMilestones = () => {
    const milestoneCount = Math.min(Math.ceil(targetValue / 10), 5);
    const newMilestones: Milestone[] = [];
    
    for (let i = 0; i < milestoneCount; i++) {
      const target = Math.round((targetValue / milestoneCount) * (i + 1));
      
      newMilestones.push({
        id: `milestone-${i}`,
        title: getMilestoneTitle(i),
        description: `完成 ${target} 次进度`,
        targetValue: target,
        currentValue: Math.min(currentValue, target),
        status: currentValue >= target ? 'completed' : currentValue > (i > 0 ? newMilestones[i - 1].targetValue : 0) ? 'in_progress' : 'pending',
        points: calculateMilestonePoints(i, milestoneCount, 'medium'),
        deadline: generateDeadline(i, milestoneCount),
      });
    }
    
    setMilestones(newMilestones);
    generateSubTasks(newMilestones);
  };

  const getMilestoneTitle = (index: number): string => {
    const titles = [
      '🌱 启动阶段',
      '📈 成长阶段',
      '⚡ 加速阶段',
      '🎯 突破阶段',
      '🏆 终极目标',
    ];
    return titles[Math.min(index, titles.length - 1)];
  };

  const calculateMilestonePoints = (index: number, _total: number, difficulty: keyof typeof DIFFICULTY_MULTIPLIER): number => {
    const basePoints = 100 + (index * 50);
    return Math.round(basePoints * DIFFICULTY_MULTIPLIER[difficulty]);
  };

  const generateDeadline = (index: number, total: number): string => {
    const daysFromNow = Math.ceil(((index + 1) / total) * 30);
    const date = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
  };

  const generateSubTasks = (milestonesList: Milestone[]) => {
    const tasksMap: Record<string, SubTask[]> = {};
    
    milestonesList.forEach((milestone) => {
      const taskCount = 2;
      const tasks: SubTask[] = [];
      
      for (let i = 0; i < taskCount; i++) {
        tasks.push({
          id: `task-${milestone.id}-${i}`,
          title: getSubTaskTitle(milestone.title, i),
          completed: false,
          points: 15,
        });
      }
      
      tasksMap[milestone.id] = tasks;
    });
    
    setSubTasks(tasksMap);
  };

  const getSubTaskTitle = (_milestoneTitle: string, index: number): string => {
    const templates = [
      `完成基础练习`,
      `进行深度学习`,
      `实践应用`,
      `复习巩固`,
      `挑战进阶内容`,
      `记录反思`,
      `分享成果`,
    ];
    return templates[index % templates.length];
  };

  const handleCompleteSubTask = (milestoneId: string, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTasks = { ...subTasks };
    const taskIndex = updatedTasks[milestoneId]?.findIndex(t => t.id === taskId);
    
    if (taskIndex === undefined || taskIndex === -1) return;
    
    if (!updatedTasks[milestoneId][taskIndex].completed) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      updatedTasks[milestoneId][taskIndex] = {
        ...updatedTasks[milestoneId][taskIndex],
        completed: true,
        completedAt: new Date().toISOString(),
      };
      
      const points = updatedTasks[milestoneId][taskIndex].points;
      const newCombo = combo + 1;
      const comboBonus = Math.floor(points * (newCombo > 3 ? 0.5 : newCombo > 1 ? 0.2 : 0));
      const totalPoints = points + comboBonus;
      
      setCombo(newCombo);
      setTotalEarnedPoints(prev => prev + totalPoints);

      spawnParticles(cx, cy, '#00ff88');
      spawnFlyNumber(cx, cy, totalPoints, newCombo > 3 ? '#ffd700' : '#00ff88');

      showToast({
        type: 'success',
        title: newCombo > 3 ? `🔥 ${newCombo}x 连击！` : '✅ 子任务完成',
        message: newCombo > 1 ? `+${totalPoints} 积分 (含连击加成 +${comboBonus})` : `+${totalPoints} 积分`,
        duration: 2500,
      });
      
      if (onPointsEarned) {
        onPointsEarned(totalPoints);
      }
      
      checkMilestoneCompletion(milestoneId, updatedTasks);
      setSubTasks(updatedTasks);
    }
  };

  const checkMilestoneCompletion = (milestoneId: string, updatedTasks: Record<string, SubTask[]>) => {
    const milestoneTasks = updatedTasks[milestoneId];
    if (!milestoneTasks) return;
    
    const allCompleted = milestoneTasks.every(t => t.completed);
    
    if (allCompleted) {
      const milestone = milestones.find(m => m.id === milestoneId);
      if (milestone && milestone.status !== 'completed') {
        const updatedMilestones = milestones.map(m =>
          m.id === milestoneId ? { ...m, status: 'completed' as const } : m
        );
        
        setMilestones(updatedMilestones);
        setTotalEarnedPoints(prev => prev + milestone.points);

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        spawnParticles(centerX, centerY, '#ffd700', true);

        showToast({
          type: 'achievement',
          title: '🎉 里程碑达成！',
          message: `「${milestone.title}」已完成！获得 +${milestone.points} 积分`,
          duration: 4000,
        });
        
        if (onPointsEarned) {
          onPointsEarned(milestone.points);
        }
        
        const allMilestonesCompleted = updatedMilestones.every(m => m.status === 'completed');
        if (allMilestonesCompleted && onGoalComplete) {
          setTimeout(() => {
            spawnParticles(window.innerWidth / 2, window.innerHeight / 2, '#39ff14', true);
            onGoalComplete();
          }, 800);
        }
      }
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title.trim()) return;
    
    const milestone: Milestone = {
      id: `milestone-custom-${Date.now()}`,
      title: newMilestone.title,
      description: `完成 ${newMilestone.targetValue} 次进度`,
      targetValue: newMilestone.targetValue,
      currentValue: 0,
      status: 'pending',
      points: calculateMilestonePoints(milestones.length, milestones.length + 1, 'medium'),
    };
    
    setMilestones([...milestones, milestone]);
    setSubTasks({
      ...subTasks,
      [milestone.id]: Array(2).fill(null).map((_, i) => ({
        id: `task-${milestone.id}-${i}`,
        title: `子任务 ${i + 1}`,
        completed: false,
        points: 15,
      })),
    });
    
    setNewMilestone({ title: '', targetValue: 10 });
    setShowMilestoneModal(false);

    showToast({
      type: 'success',
      title: '✅ 里程碑已创建',
      message: `「${milestone.title}」已添加到目标拆解计划`,
      duration: 2500,
    });
  };

  const overallProgress = milestones.length > 0
    ? Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100)
    : 0;

  const completedTasks = Object.values(subTasks).flat().filter(t => t.completed).length;
  const totalTasks = Object.values(subTasks).flat().length;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            fontFamily: "'Courier New', monospace",
          }}>
            🎯 目标拆解
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontFamily: "'Courier New', monospace" }}>
            OKR 方法论 · 里程碑追踪 · 即时反馈
          </p>
        </div>

        <button
          onClick={() => setShowMilestoneModal(true)}
          style={{
            padding: '9px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--matrix-green)',
            background: 'var(--matrix-green-dim)',
            color: 'var(--matrix-green)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.2s',
          }}
        >
          + 新建里程碑
        </button>
      </div>

      <div style={{
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid var(--border-light)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, var(--accent-dim) 0%, transparent 50%, var(--accent-dim) 100%)`,
          opacity: 0.5,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {goalTitle}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', fontFamily: "'Courier New', monospace" }}>
            目标总览 · 进度可视化
          </div>

          <div style={{
            height: '22px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '11px',
            overflow: 'visible',
            position: 'relative',
            marginBottom: '8px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
          }}>
            <div
              style={{
                width: `${overallProgress}%`,
                height: '100%',
                background: overallProgress >= 100
                  ? 'linear-gradient(90deg, var(--matrix-green), var(--matrix-green-bright))'
                  : overallProgress >= 50
                    ? 'linear-gradient(90deg, #00f0ff, var(--matrix-green))'
                    : 'linear-gradient(90deg, var(--matrix-green-dim), var(--matrix-green))',
                borderRadius: '11px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: overallProgress > 0 ? '0 0 16px var(--accent-glow)' : 'none',
                position: 'relative',
                minWidth: overallProgress > 0 ? '4px' : '0',
              }}
            >
              {overallProgress > 0 && overallProgress < 100 && (
                <div style={{
                  position: 'absolute',
                  right: -4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 10px rgba(255,255,255,0.8)',
                }} />
              )}
            </div>
            {milestones.filter(m => m.status !== 'completed').length > 0 && milestones.map((m, i) => {
              const pct = (m.targetValue / targetValue) * 100;
              if (m.status === 'completed') return null;
              return (
                <div
                  key={m.id}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(pct, 95)}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 4,
                    height: 14,
                    background: m.status === 'in_progress' ? '#00f0ff' : 'rgba(255,255,255,0.15)',
                    borderRadius: 2,
                    boxShadow: m.status === 'in_progress' ? '0 0 6px rgba(0,240,255,0.6)' : 'none',
                  }}
                />
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <span style={{
              fontSize: '26px',
              fontWeight: 'bold',
              color: overallProgress >= 100 ? 'var(--matrix-green-bright)' : 'var(--accent)',
              fontFamily: "'Courier New', monospace",
              textShadow: overallProgress >= 100 ? '0 0 10px var(--accent-glow)' : 'none',
            }}>
              {overallProgress}%
            </span>

            <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontFamily: "'Courier New', monospace" }}>
              <span style={{ color: 'var(--text-muted)' }}>
                📊 {completedTasks}/{totalTasks} 任务
              </span>
              <span style={{ color: 'var(--matrix-green)' }}>
                ⭐ +{totalEarnedPoints} 积分
              </span>
              {combo > 0 && (
                <span style={{
                  color: combo > 3 ? '#ff6b6b' : '#ffd93d',
                  fontWeight: 700,
                  textShadow: combo > 3 ? '0 0 8px rgba(255,107,107,0.6)' : 'none',
                }}>
                  🔥 {combo}x 连击
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {milestones.map((milestone, idx) => {
          const isExpanded = expandedMilestone === milestone.id;
          const milestoneTasks = subTasks[milestone.id] || [];
          const completedInMilestone = milestoneTasks.filter(t => t.completed).length;

          return (
            <div
              key={milestone.id}
              style={{
                background: milestone.status === 'completed'
                  ? 'rgba(0,255,136,0.04)'
                  : milestone.status === 'in_progress'
                    ? 'rgba(0,240,255,0.03)'
                    : 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-md)',
                border: milestone.status === 'completed'
                  ? '1.5px solid rgba(0,255,136,0.3)'
                  : milestone.status === 'in_progress'
                    ? '1.5px solid rgba(0,240,255,0.2)'
                    : '1px solid var(--border-light)',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: milestone.status === 'completed' ? 0.8 : 1,
                animation: `goalCardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) both`,
                animationDelay: `${idx * 0.08}s`,
              }}
            >
              <div
                onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: milestone.status === 'completed'
                    ? 'linear-gradient(135deg, #00ff88, #00cc6a)'
                    : milestone.status === 'in_progress'
                      ? 'linear-gradient(135deg, #00f0ff, #0099cc)'
                      : 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                  boxShadow: milestone.status === 'completed'
                    ? '0 0 12px rgba(0,255,136,0.3)'
                    : milestone.status === 'in_progress'
                      ? '0 0 10px rgba(0,240,255,0.2)'
                      : 'none',
                  color: milestone.status === 'completed' ? '#000' : milestone.status === 'in_progress' ? '#000' : 'var(--text-muted)',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {milestone.status === 'completed' ? '✓' : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: milestone.status === 'completed' ? 'var(--matrix-green-bright)' : 'var(--text-primary)',
                    marginBottom: '2px',
                    textDecoration: milestone.status === 'completed' ? 'line-through' : 'none',
                  }}>
                    {milestone.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {milestone.description} · {completedInMilestone}/{milestoneTasks.length} 子任务
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: milestone.status === 'completed'
                      ? 'var(--matrix-green-bright)'
                      : milestone.status === 'in_progress'
                        ? '#00f0ff'
                        : 'var(--text-muted)',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    +{milestone.points}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    积分
                  </div>
                </div>

                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  transition: 'transform 0.25s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                }}>
                  ▼
                </div>
              </div>

              {isExpanded && (
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '14px',
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '10px',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    📋 子任务清单
                  </div>

                  {milestoneTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        marginBottom: '6px',
                        background: task.completed
                          ? 'rgba(0,255,136,0.05)'
                          : 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)',
                        border: task.completed
                          ? '1px solid rgba(0,255,136,0.15)'
                          : '1px solid var(--border-light)',
                        cursor: task.completed ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: task.completed ? 0.65 : 1,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {!task.completed && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'transparent',
                            transition: 'background 0.15s',
                          }}
                          className="task-hover-glow"
                        />
                      )}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${task.completed ? 'var(--matrix-green)' : 'var(--border-medium)'}`,
                        background: task.completed ? 'var(--matrix-green)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#000',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}>
                        {task.completed && '✓'}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '12px',
                          color: task.completed ? 'var(--matrix-green)' : 'var(--text-secondary)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                        }}>
                          {task.title}
                        </div>
                      </div>

                      {!task.completed && (
                        <button
                          ref={el => { taskBtnRefs.current[task.id] = el; }}
                          onClick={(e) => handleCompleteSubTask(milestone.id, task.id, e)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-accent)',
                            background: 'var(--accent-dim)',
                            color: 'var(--matrix-green)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Courier New', monospace",
                            transition: 'all 0.15s',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          +{task.points}
                        </button>
                      )}

                      {task.completed && (
                        <span style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          已完成 ✓
                        </span>
                      )}
                    </div>
                  ))}

                  {milestone.deadline && (
                    <div style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      <span>📅 截止日期: {milestone.deadline}</span>
                      <span style={{
                        color: milestone.status === 'completed'
                          ? 'var(--matrix-green)'
                          : new Date(milestone.deadline) < new Date()
                            ? '#ff6b6b'
                            : 'var(--text-muted)',
                      }}>
                        {milestone.status === 'completed'
                          ? '✅ 已完成'
                          : new Date(milestone.deadline) < new Date()
                            ? '⚠️ 已逾期'
                            : '⏳ 进行中'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showMilestoneModal && (
        <div
          onClick={() => setShowMilestoneModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(var(--blur-lg))',
              WebkitBackdropFilter: 'blur(var(--blur-lg))',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              width: '90%',
              maxWidth: '420px',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'goalCardEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
            }}
          >
            <h3 style={{
              fontSize: '17px',
              color: 'var(--matrix-green)',
              marginBottom: '16px',
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
            }}>
              ➕ 新建里程碑
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '6px',
                fontFamily: "'Courier New', monospace",
              }}>
                里程碑名称
              </label>
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="例如：完成第一阶段学习"
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: "'Courier New', monospace",
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '6px',
                fontFamily: "'Courier New', monospace",
              }}>
                目标值（次数/数量）
              </label>
              <input
                type="number"
                min="1"
                value={newMilestone.targetValue}
                onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: parseInt(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: "'Courier New', monospace",
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowMilestoneModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={!newMilestone.title.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: newMilestone.title.trim()
                    ? 'linear-gradient(135deg, var(--matrix-green), var(--accent-secondary))'
                    : 'rgba(255,255,255,0.08)',
                  color: newMilestone.title.trim() ? '#000' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: newMilestone.title.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.2s',
                }}
              >
                创建里程碑
              </button>
            </div>
          </div>
        </div>
      )}

      {milestones.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '42px', marginBottom: '10px', opacity: 0.6 }}>🎯</div>
          <div style={{ fontSize: '15px', fontFamily: "'Courier New', monospace" }}>暂无里程碑</div>
          <div style={{ fontSize: '12px', marginTop: '6px', fontFamily: "'Courier New', monospace" }}>点击"新建里程碑"开始拆解你的目标</div>
        </div>
      )}

      <ProgressParticle
        trigger={particleTrigger}
        x={particlePos.x}
        y={particlePos.y}
        color={particleColor}
        count={particleBig ? 30 : 12}
      />
      {flyTriggers.map(f => (
        <FlyingNumber
          key={f.id}
          value={f.value}
          x={f.x}
          y={f.y}
          color={f.color}
          combo={combo > 1 ? combo : 1}
        />
      ))}
    </div>
  );
}