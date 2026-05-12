﻿import { useState, useEffect } from 'react';

interface JournalEntry {
  id: string;
  date: string;
  satisfaction: number;
  habits: { name: string; done: boolean; duration?: number }[];
  reflection: string;
  highlights: string[];
  improvements: string[];
  score: number;
  points: number;
}

interface ProgressJournalProps {
  todayCheckIns?: string[];
  onPointsEarned?: (points: number) => void;
}

const ATOMIC_HABITS_TIPS = [
  { law: 'Make it Obvious', tip: '将习惯触发器放在显眼位置', icon: '👁️' },
  { law: 'Make it Attractive', tip: '将习惯与你喜欢的事物绑定', icon: '🎯' },
  { law: 'Make it Easy', tip: '从2分钟版本的习惯开始', icon: '⚡' },
  { law: 'Make it Satisfying', tip: '立即奖励自己的小成就', icon: '🎉' },
];

const REFLECTION_PROMPTS = [
  '今天最大的收获是什么？',
  '哪个习惯执行得最好？为什么？',
  '遇到了什么挑战？如何克服？',
  '明天可以改进的一点是什么？',
  '给自己今天的表现打分（1-10）',
];

export function ProgressJournal({ todayCheckIns = [], onPointsEarned }: ProgressJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    satisfaction: 7,
    habits: [
      { name: '阅读', done: todayCheckIns.includes('STUDY'), duration: 30 },
      { name: '运动', done: todayCheckIns.includes('HEALTH') || todayCheckIns.includes('FITNESS'), duration: 30 },
      { name: '冥想', done: todayCheckIns.includes('HEALTH'), duration: 10 },
      { name: '学习新技能', done: todayCheckIns.includes('STUDY') },
      { name: '复盘反思', done: todayCheckIns.includes('REVIEW') },
    ],
    reflection: '',
    highlights: ['', ''],
    improvements: [''],
    score: 0,
    points: 0,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'history'>('today');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const mockHistory: JournalEntry[] = [
      {
        id: '1',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        satisfaction: 8,
        habits: [
          { name: '阅读', done: true, duration: 45 },
          { name: '运动', done: true, duration: 30 },
          { name: '冥想', done: true, duration: 15 },
          { name: '学习新技能', done: false },
          { name: '复盘反思', done: true },
        ],
        reflection: '今天状态很好，完成了所有核心习惯。阅读时特别专注，学到了很多关于时间管理的知识。',
        highlights: ['读完了一章重要内容', '运动后精力充沛'],
        improvements: ['学习时间可以再长一点'],
        score: 85,
        points: 85,
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        satisfaction: 6,
        habits: [
          { name: '阅读', done: true, duration: 20 },
          { name: '运动', done: false },
          { name: '冥想', done: true, duration: 10 },
          { name: '学习新技能', done: true },
          { name: '复盘反思', done: false },
        ],
        reflection: '今天有点累，但仍然坚持了部分习惯。明天需要调整作息。',
        highlights: ['坚持了冥想', '学习了React新特性'],
        improvements: ['需要更早休息', '增加运动时间'],
        score: 60,
        points: 60,
      },
    ];
    setEntries(mockHistory);
  };

  const calculateScore = () => {
    const habitScore = currentEntry.habits.filter(h => h.done).length * 15;
    const satisfactionScore = currentEntry.satisfaction * 5;
    const hasReflection = currentEntry.reflection.trim().length > 20 ? 10 : 0;
    const hasHighlights = currentEntry.highlights.filter((h: string) => h.trim()).length * 5;
    return Math.min(100, habitScore + satisfactionScore + hasReflection + hasHighlights);
  };

  const handleSave = () => {
    const score = calculateScore();
    const points = Math.floor(score * 1.5);
    
    const entry: JournalEntry = {
      ...currentEntry,
      id: Date.now().toString(),
      score,
      points,
    };
    
    setEntries([entry, ...entries]);
    setSaved(true);
    setShowConfetti(true);
    
    if (onPointsEarned) {
      onPointsEarned(points);
    }
    
    setTimeout(() => {
      setShowConfetti(false);
      setSaved(false);
    }, 3000);
  };

  const getStreakDays = () => {
    return 0;
  };

  const getTotalPoints = () => {
    return entries.reduce((sum, e) => sum + e.points, 0);
  };

  const getAverageScore = () => {
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length);
  };

  if (viewMode === 'history') {
    return (
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: 0, marginBottom: '4px' }}>
              📖 进步本历史
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              回顾成长轨迹
            </p>
          </div>
          <button
            onClick={() => setViewMode('today')}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: '2px solid var(--matrix-green)',
              background: 'var(--matrix-green-dim)',
              color: 'var(--matrix-green)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
            }}
          >
            ← 返回今日
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${entry.score >= 80 ? 'rgba(0,255,136,0.25)' : entry.score >= 60 ? 'rgba(255,217,61,0.25)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: "'Courier New', monospace",
                }}>
                  📅 {entry.date}
                </span>
                <span style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: entry.score >= 80 ? '#00ff88' : entry.score >= 60 ? '#ffd93d' : '#ff6b6b',
                  fontFamily: "'Courier New', monospace",
                }}>
                  {entry.score}分
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>今日习惯</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {entry.habits.map((habit, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: habit.done ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
                        color: habit.done ? '#00ff88' : 'rgba(255,255,255,0.35)',
                        fontSize: '11px',
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      {habit.done ? '✓' : '✗'} {habit.name}
                    </span>
                  ))}
                </div>
              </div>

              {entry.reflection && (
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.5,
                  marginBottom: '8px',
                }}>
                  "{entry.reflection.slice(0, 80)}..."
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--matrix-green)',
                  fontWeight: '600',
                  fontFamily: "'Courier New', monospace",
                }}>
                  +{entry.points} 积分
                </span>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  满意度 {entry.satisfaction}/10
                </span>
              </div>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: 'rgba(255,255,255,0.35)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
            <div style={{ fontSize: '16px' }}>暂无历史记录</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>开始记录你的第一天吧！</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {showConfetti && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #00ff88, #00f0ff)',
          color: '#000',
          padding: '20px 40px',
          borderRadius: '20px',
          fontSize: '20px',
          fontWeight: 'bold',
          boxShadow: '0 8px 32px rgba(0,255,136,0.4)',
          zIndex: 1000,
          animation: 'pulse 0.5s ease-in-out',
        }}>
          🎉 +{calculateScore() * 1.5 | 0} 积分！进步本已保存！
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', margin: 0, marginBottom: '4px' }}>
            📖 进步本
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Atomic Habits · 每日成长记录
          </p>
        </div>
        
        <button
          onClick={() => setViewMode('history')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
          }}
        >
          📊 历史记录 ({entries.length}天)
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div className="glass-card-accent" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', fontFamily: "'Courier New', monospace" }}>
            🔥 {getStreakDays()}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>连续天数</div>
        </div>
        <div className="glass-card-warning" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', fontFamily: "'Courier New', monospace" }}>
            ⭐ {getTotalPoints()}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>累计积分</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00f0ff', fontFamily: "'Courier New', monospace" }}>
            📈 {getAverageScore()}%
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>平均得分</div>
        </div>
      </div>

      <div style={{
        background: 'var(--accent-dim)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        border: '1px solid var(--matrix-green-dim)',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--matrix-green)', marginBottom: '12px', fontFamily: "'Courier New', monospace" }}>
          💡 Atomic Habits 四大定律
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {ATOMIC_HABITS_TIPS.map((tip, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                padding: '12px',
                borderLeft: `3px solid var(--matrix-green)`,
              }}
            >
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>{tip.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--matrix-green)', marginBottom: '2px' }}>
                {tip.law}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
                {tip.tip}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '16px' }}>
          ✅ 今日习惯检查清单
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentEntry.habits.map((habit, idx) => (
            <div
              key={idx}
              onClick={() => {
                const updatedHabits = [...currentEntry.habits];
                updatedHabits[idx] = { ...habit, done: !habit.done };
                setCurrentEntry({ ...currentEntry, habits: updatedHabits });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: habit.done ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                cursor: 'pointer',
                border: `1px solid ${habit.done ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.08)'}`,
                marginBottom: '10px',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: `2px solid ${habit.done ? '#00ff88' : 'rgba(255,255,255,0.3)'}`,
                background: habit.done ? '#00ff88' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}>
                {habit.done && '✓'}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  color: habit.done ? '#00ff88' : '#fff',
                  fontWeight: habit.done ? '600' : '400',
                }}>
                  {habit.name}
                </div>
                {habit.duration && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    建议时长: {habit.duration}分钟
                  </div>
                )}
              </div>
              
              {habit.done && (
                <span style={{
                  fontSize: '12px',
                  color: '#00ff88',
                  fontWeight: '600',
                  fontFamily: "'Courier New', monospace",
                }}>
                  +15分
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>
          😊 今日满意度评分
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <input
            type="range"
            min="1"
            max="10"
            value={currentEntry.satisfaction}
            onChange={(e) => setCurrentEntry({ ...currentEntry, satisfaction: parseInt(e.target.value) })}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              appearance: 'none',
              background: `linear-gradient(to right, #ff6b6b 0%, #ffd93d 50%, #00ff88 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Courier New', monospace",
        }}>
          <span>1 很差</span>
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: currentEntry.satisfaction >= 7 ? '#00ff88' : currentEntry.satisfaction >= 5 ? '#ffd93d' : '#ff6b6b',
          }}>
            {currentEntry.satisfaction}/10
          </span>
          <span>10 完美</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>
          💭 今日反思
        </div>
        
        <textarea
          value={currentEntry.reflection}
          onChange={(e) => setCurrentEntry({ ...currentEntry, reflection: e.target.value })}
          placeholder={REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]}
          rows={4}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.6,
            fontFamily: "'Courier New', monospace",
          }}
        />
        
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: "'Courier New', monospace",
        }}>
          字数: {currentEntry.reflection.length} (建议 {'>'} 20字获得额外积分)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>
            🌟 今日亮点 (最多2个)
          </div>
          
          {currentEntry.highlights.map((highlight, idx) => (
            <input
              key={idx}
              type="text"
              value={highlight}
              onChange={(e) => {
                const updated = [...currentEntry.highlights];
                updated[idx] = e.target.value;
                setCurrentEntry({ ...currentEntry, highlights: updated });
              }}
              placeholder={`亮点 ${idx + 1}`}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '10px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          ))}
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>
            📈 明日改进 (最多1个)
          </div>
          
          <input
            type="text"
            value={currentEntry.improvements[0]}
            onChange={(e) => {
              const updated = [...currentEntry.improvements];
              updated[0] = e.target.value;
              setCurrentEntry({ ...currentEntry, improvements: updated });
            }}
            placeholder="明天可以改进什么？"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '13px',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, rgba(0,240,255,0.08) 0%, rgba(0,255,136,0.08) 100%)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid rgba(0,240,255,0.2)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
          预计获得积分
        </div>
        <div style={{
          fontSize: '42px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00f0ff, #00ff88)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: "'Courier New', monospace",
        }}>
          +{Math.floor(calculateScore() * 1.5)}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          当前得分: {calculateScore()}分 · 完成保存后发放
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saved}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '14px',
          border: 'none',
          background: saved
            ? 'linear-gradient(135deg, #00ff88, #00cc6a)'
            : 'linear-gradient(135deg, var(--matrix-green), #00ff88)',
          color: '#000',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: saved ? 'default' : 'pointer',
          fontFamily: "'Courier New', monospace",
          boxShadow: saved ? '0 4px 20px rgba(0,255,136,0.4)' : '0 4px 20px var(--matrix-green-dim)',
          transition: 'all 0.2s',
          opacity: saved ? 0.9 : 1,
        }}
      >
        {saved ? '✅ 已保存！进步 +1 天' : '💾 保存今日进步本'}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
