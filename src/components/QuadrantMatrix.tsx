﻿﻿﻿﻿﻿import { useState } from 'react';
import { showToast } from './Toast';

interface Task {
  id: string;
  title: string;
  category: string;
  priority: string;
  urgency: 'high' | 'low';
  importance: 'high' | 'low';
  deadline?: string;
  points?: number;
}

type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

const QUADRANT_CONFIG: Record<Quadrant, {
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  action: string;
  icon: string;
}> = {
  Q1: {
    title: '重要且紧急',
    subtitle: '立即执行',
    color: '#ff6b6b',
    bgColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.25)',
    action: '🔥 立即做',
    icon: '🚨',
  },
  Q2: {
    title: '重要不紧急',
    subtitle: '计划安排',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.08)',
    borderColor: 'rgba(0, 255, 136, 0.25)',
    action: '📅 规划做',
    icon: '⭐',
  },
  Q3: {
    title: '紧急不重要',
    subtitle: '委托授权',
    color: '#ffd93d',
    bgColor: 'rgba(255, 217, 61, 0.08)',
    borderColor: 'rgba(255, 217, 61, 0.25)',
    action: '🤝 授权做',
    icon: '⚡',
  },
  Q4: {
    title: '不重要不紧急',
    subtitle: '坚决删除',
    color: '#a0a0a0',
    bgColor: 'rgba(160, 160, 160, 0.08)',
    borderColor: 'rgba(160, 160, 160, 0.25)',
    action: '🗑️ 不去做',
    icon: '💤',
  },
};

interface QuadrantMatrixProps {
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
}

export function QuadrantMatrix({ tasks = [], onTaskClick }: QuadrantMatrixProps) {
  const [activeQuadrant, setActiveQuadrant] = useState<Quadrant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    urgency: 'low' as 'high' | 'low',
    importance: 'low' as 'high' | 'low',
  });
  const [allTasks, setAllTasks] = useState<Task[]>(tasks.length > 0 ? tasks : generateMockTasks());

  const getQuadrant = (task: Task): Quadrant => {
    if (task.urgency === 'high' && task.importance === 'high') return 'Q1';
    if (task.urgency === 'low' && task.importance === 'high') return 'Q2';
    if (task.urgency === 'high' && task.importance === 'low') return 'Q3';
    return 'Q4';
  };

  const getTasksByQuadrant = (quadrant: Quadrant): Task[] => {
    return allTasks.filter(task => getQuadrant(task) === quadrant);
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      category: 'OTHER',
      priority: newTask.urgency === 'high' ? 'HIGH' : 'LOW',
      urgency: newTask.urgency,
      importance: newTask.importance,
      points: calculatePoints(newTask.urgency, newTask.importance),
    };
    setAllTasks([...allTasks, task]);
    setNewTask({ title: '', urgency: 'low', importance: 'low' });
    setShowAddModal(false);
    showToast({
      type: 'success',
      title: '✅ 任务已创建',
      message: `「${task.title}」已添加到 ${QUADRANT_CONFIG[getQuadrant(task)].title}`,
      duration: 2500,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    setAllTasks(allTasks.filter(t => t.id !== taskId));
    if (task) {
      showToast({
        type: 'info',
        title: '🗑️ 任务已删除',
        message: `「${task.title}」已移除`,
        duration: 2000,
      });
    }
  };

  const totalTasks = allTasks.length;
  const quadrantStats = {
    Q1: getTasksByQuadrant('Q1').length,
    Q2: getTasksByQuadrant('Q2').length,
    Q3: getTasksByQuadrant('Q3').length,
    Q4: getTasksByQuadrant('Q4').length,
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Courier New', monospace" }}>
            ⏰ 四象限法则
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, fontFamily: "'Courier New', monospace" }}>
            Eisenhower Matrix · 智能优先级管理
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          + 新建任务
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((quad, idx) => {
          const config = QUADRANT_CONFIG[quad];
          const quadrantTasks = getTasksByQuadrant(quad);
          const isActive = activeQuadrant === quad;

          return (
            <div
              key={quad}
              onMouseEnter={() => setActiveQuadrant(quad)}
              onMouseLeave={() => setActiveQuadrant(null)}
              onClick={() => setActiveQuadrant(isActive ? null : quad)}
              style={{
                background: config.bgColor,
                borderRadius: 'var(--radius-lg)',
                border: `1.5px solid ${isActive ? config.color + '60' : config.borderColor}`,
                padding: '16px',
                minHeight: '280px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isActive ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
                boxShadow: isActive ? `0 8px 32px ${config.color}20` : 'none',
                position: 'relative',
                overflow: 'hidden',
                animation: 'goalCardEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1) both',
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
              }} />

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{config.icon}</div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: config.color,
                    marginBottom: '2px',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {config.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {config.subtitle}
                  </div>
                </div>
                <div style={{
                  background: config.color + '25',
                  color: config.color,
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {quadrantTasks.length} 项
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {quadrantTasks.slice(0, isActive ? undefined : 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${config.color}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                        marginBottom: '2px',
                      }}>
                        {task.title}
                      </div>
                      {task.deadline && (
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                        }}>
                          📅 {task.deadline}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {task.points && (
                        <span style={{
                          fontSize: '11px',
                          color: config.color,
                          fontWeight: '600',
                          fontFamily: "'Courier New', monospace",
                        }}>
                          +{task.points}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.3)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '2px 6px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {!isActive && quadrantTasks.length > 3 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '8px',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    +{quadrantTasks.length - 3} 更多...
                  </div>
                )}

                {quadrantTasks.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--text-muted)',
                    fontSize: '13px',
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📭</div>
                    暂无任务
                  </div>
                )}
              </div>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                fontSize: '11px',
                color: config.color + '80',
                fontFamily: "'Courier New', monospace",
                fontWeight: '600',
              }}>
                {config.action}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        background: 'var(--accent-dim)',
        borderRadius: '12px',
        padding: '16px 20px',
        border: '1px solid var(--matrix-green-dim)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', fontFamily: "'Courier New', monospace" }}>
            {totalTasks}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>总任务数</div>
        </div>
        {(Object.entries(quadrantStats) as [Quadrant, number][]).map(([quad, count]) => (
          <div key={quad} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: QUADRANT_CONFIG[quad].color,
              fontFamily: "'Courier New', monospace",
            }}>
              {count}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
              {QUADRANT_CONFIG[quad].icon} {QUADRANT_CONFIG[quad].title.slice(0, 4)}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'var(--matrix-green)',
            fontFamily: "'Courier New', monospace",
          }}>
            {totalTasks > 0 ? Math.round((quadrantStats.Q2 / totalTasks) * 100) : 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>⭐ 重要不紧急占比</div>
        </div>
      </div>

      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
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
              maxWidth: '450px',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'goalCardEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
            }}
          >
            <h3 style={{ fontSize: '18px', color: 'var(--matrix-green)', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>
              ➕ 新建四象限任务
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', fontFamily: "'Courier New', monospace" }}>
                任务名称
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="输入任务内容..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--matrix-green-dim)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '10px', fontFamily: "'Courier New', monospace" }}>
                选择象限
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>
                {(Object.keys(QUADRANT_CONFIG) as Quadrant[]).map((quad) => {
                  const config = QUADRANT_CONFIG[quad];
                  const isSelected =
                    (quad === 'Q1' && newTask.urgency === 'high' && newTask.importance === 'high') ||
                    (quad === 'Q2' && newTask.urgency === 'low' && newTask.importance === 'high') ||
                    (quad === 'Q3' && newTask.urgency === 'high' && newTask.importance === 'low') ||
                    (quad === 'Q4' && newTask.urgency === 'low' && newTask.importance === 'low');

                  return (
                    <button
                      key={quad}
                      onClick={() => {
                        if (quad === 'Q1') setNewTask({ ...newTask, urgency: 'high', importance: 'high' });
                        else if (quad === 'Q2') setNewTask({ ...newTask, urgency: 'low', importance: 'high' });
                        else if (quad === 'Q3') setNewTask({ ...newTask, urgency: 'high', importance: 'low' });
                        else setNewTask({ ...newTask, urgency: 'low', importance: 'low' });
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: `2px solid ${isSelected ? config.color : 'rgba(255,255,255,0.1)'}`,
                        background: isSelected ? config.bgColor : 'rgba(255,255,255,0.03)',
                        color: isSelected ? config.color : 'rgba(255,255,255,0.7)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{config.icon}</div>
                      <div style={{ fontWeight: '600', fontSize: '11px' }}>{config.title}</div>
                      <div style={{ fontSize: '9px', opacity: 0.6 }}>{config.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddModal(false)}
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
                onClick={handleAddTask}
                disabled={!newTask.title.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: newTask.title.trim() ? 'linear-gradient(135deg, var(--matrix-green), #00ff88)' : 'rgba(255,255,255,0.1)',
                  color: newTask.title.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: newTask.title.trim() ? 'pointer' : 'not-allowed',
                }}
              >
              创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateMockTasks(): Task[] {
  return [
    { id: '1', title: '完成项目提案文档', category: 'WORK', priority: 'HIGH', urgency: 'high', importance: 'high', deadline: '今天', points: 50 },
    { id: '2', title: '回复客户紧急邮件', category: 'WORK', priority: 'HIGH', urgency: 'high', importance: 'high', deadline: '今天', points: 40 },
    { id: '3', title: '学习 TypeScript 高级特性', category: 'STUDY', priority: 'MEDIUM', urgency: 'low', importance: 'high', deadline: '本周', points: 80 },
    { id: '4', title: '制定季度健身计划', category: 'FITNESS', priority: 'MEDIUM', urgency: 'low', importance: 'high', deadline: '本月', points: 60 },
    { id: '5', title: '阅读《原子习惯》第5章', category: 'STUDY', priority: 'LOW', urgency: 'low', importance: 'high', deadline: '本周', points: 35 },
    { id: '6', title: '参加部门例会', category: 'WORK', priority: 'MEDIUM', urgency: 'high', importance: 'low', deadline: '下午3点', points: 15 },
    { id: '7', title: '回复无关紧要的社交媒体消息', category: 'OTHER', priority: 'LOW', urgency: 'high', importance: 'low', points: 5 },
    { id: '8', title: '刷短视频消遣', category: 'OTHER', priority: 'LOW', urgency: 'low', importance: 'low', points: 0 },
  ];
}

function calculatePoints(urgency: 'high' | 'low', importance: 'high' | 'low'): number {
  if (urgency === 'high' && importance === 'high') return 50;
  if (urgency === 'low' && importance === 'high') return 75;
  if (urgency === 'high' && importance === 'low') return 15;
  return 0;
}
