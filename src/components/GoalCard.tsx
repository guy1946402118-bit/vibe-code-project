import { useState, useCallback, useRef } from 'react';
import { ProgressParticle } from './ProgressParticle';
import { FlyingNumber } from './FlyingNumber';
import { notificationBus } from '../lib/notificationBus';

interface GoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    category: string;
    currentCount: number;
    targetCount: number;
    unit: string;
    points: number;
    createdAt?: string;
    isCompleted: boolean;
    color: string;
    icon: string;
  };
  onProgress: (goalId: string) => void;
}

export function GoalCard({ goal, onProgress }: GoalCardProps) {
  const [ripple, setRipple] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [flyKey, setFlyKey] = useState(0);
  const [flyPos, setFlyPos] = useState({ x: 0, y: 0 });
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const comboRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const progress = Math.min((goal.currentCount / goal.targetCount) * 100, 100);
  const isMilestone = progress >= 100 || progress >= 50 || progress >= 75 || progress >= 90;
  const prevProgressRef = useRef(progress);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipple({ x, y, active: true });
    setTimeout(() => setRipple({ x: 0, y: 0, active: false }), 600);

    setFlyPos({ x: e.clientX + (Math.random() - 0.5) * 40, y: e.clientY - 20 });
    setFlyKey(prev => prev + 1);

    const newCombo = combo + 1;
    setCombo(newCombo);
    if (comboRef.current) clearTimeout(comboRef.current);
    comboRef.current = setTimeout(() => setCombo(0), 1200);

    if (newCombo >= 5) setShake(true);
    setTimeout(() => setShake(false), 400);

    setPulseTrigger(prev => prev + 1);

    const newCount = goal.currentCount + 1;
    const newProgress = (newCount / goal.targetCount) * 100;
    if (prevProgressRef.current < 50 && newProgress >= 50) {
      notificationBus.push('milestone', '🎯 进度过半', `目标「${goal.title}」已完成 50%！`, '🌟');
    }
    if (prevProgressRef.current < 75 && newProgress >= 75) {
      notificationBus.push('milestone', '🔥 即将达成', `目标「${goal.title}」已完成 75%！`, '💎');
    }
    if (prevProgressRef.current < 100 && newProgress >= 100) {
      notificationBus.push('goal_complete', '🏆 目标达成！', `目标「${goal.title}」已全部完成！`, '🎉');
    }
    prevProgressRef.current = newProgress;

    onProgress(goal.id);
  }, [combo, goal.id, onProgress, goal.title, goal.currentCount, goal.targetCount]);

  const getProgressColor = () => {
    if (progress >= 100) return 'var(--matrix-green-bright)';
    if (progress >= 75) return '#00f5d4';
    if (progress >= 50) return '#ffd700';
    if (progress >= 25) return goal.color;
    return 'var(--text-muted)';
  };

  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(var(--blur-md))',
        WebkitBackdropFilter: 'blur(var(--blur-md))',
        border: progress >= 100
          ? '1.5px solid var(--matrix-green-bright)'
          : progress >= 75
            ? '1.5px solid rgba(0, 245, 212, 0.5)'
            : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: progress >= 100
          ? '0 0 24px var(--accent-glow), 0 0 8px var(--accent-glow)'
          : progress >= 75
            ? '0 0 16px rgba(0, 245, 212, 0.15)'
            : 'var(--shadow-sm)',
        animation: `goalCardEnter 0.5s cubic-bezier(0.4, 0, 0.2, 1) both`,
      }}
    >
      {goal.isCompleted && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(57, 255, 20, 0.06), transparent 60%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ padding: '16px 18px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{goal.icon}</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: progress >= 100 ? 'var(--matrix-green-bright)' : 'var(--text-primary)',
                  fontFamily: "'Courier New', monospace",
                  textDecoration: goal.isCompleted ? 'line-through' : 'none',
                  textShadow: progress >= 100 ? '0 0 8px var(--accent-glow)' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {goal.title}
              </span>
              {progress >= 100 && (
                <span style={{ fontSize: 12, animation: 'pulse 2s infinite' }}>&#10003;</span>
              )}
            </div>
            {goal.description && (
              <p style={{
                color: 'var(--text-muted)',
                fontSize: 11,
                margin: 0,
                fontFamily: "'Courier New', monospace",
                opacity: 0.7,
              }}>
                {goal.description}
              </p>
            )}
            <div style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: 'var(--text-muted)',
              fontFamily: "'Courier New', monospace",
            }}>
              <span>{goal.category.toUpperCase()}</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>{goal.points}pts/{goal.unit}</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div
            style={{
              height: 6,
              background: 'var(--bg-tertiary)',
              borderRadius: 3,
              overflow: 'visible',
              position: 'relative',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                background: progress >= 100
                  ? `linear-gradient(90deg, ${getProgressColor()}, var(--matrix-green-bright))`
                  : getProgressColor(),
                width: `${progress}%`,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: progress > 0 ? `0 0 8px ${getProgressColor()}, 0 0 2px ${getProgressColor()}` : 'none',
                position: 'relative',
              }}
            >
              {progress > 0 && progress < 100 && (
                <div
                  style={{
                    position: 'absolute',
                    right: -3,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: getProgressColor(),
                    boxShadow: `0 0 6px ${getProgressColor()}`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 12,
            color: progress >= 100 ? 'var(--matrix-green-bright)' : 'var(--text-secondary)',
            fontFamily: "'Courier New', monospace",
            fontWeight: progress >= 100 ? 700 : 400,
            textShadow: progress >= 100 ? '0 0 6px var(--accent-glow)' : 'none',
          }}>
            {goal.currentCount} / {goal.targetCount} {goal.unit}
            {progress >= 100 && ' COMPLETE'}
            {progress >= 75 && progress < 100 && ' (ALMOST!)'}
            {progress >= 50 && progress < 75 && ' (HALFWAY)'}
          </span>
          <button
            ref={btnRef}
            onClick={handleClick}
            disabled={goal.isCompleted}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: combo > 3 ? '7px 16px' : '7px 13px',
              background: goal.isCompleted
                ? 'var(--accent-dim)'
                : combo > 3
                  ? 'var(--matrix-green)'
                  : 'var(--accent-dim)',
              border: goal.isCompleted
                ? '1px solid var(--border-medium)'
                : combo > 3
                  ? '1px solid var(--matrix-green-bright)'
                  : '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-sm)',
              color: goal.isCompleted
                ? 'var(--text-muted)'
                : combo > 3
                  ? '#000'
                  : 'var(--matrix-green)',
              fontSize: combo > 3 ? 15 : 13,
              fontWeight: 700,
              cursor: goal.isCompleted ? 'default' : 'pointer',
              fontFamily: "'Courier New', monospace",
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: combo > 3
                ? '0 0 20px var(--accent-glow)'
                : 'none',
              textShadow: combo > 3 ? '0 0 4px rgba(0,0,0,0.5)' : 'none',
              animation: shake ? 'shake 0.4s ease' : combo > 3 ? 'pulse 0.5s infinite' : 'none',
              outline: 'none',
            }}
          >
            {goal.isCompleted ? (
              'DONE'
            ) : combo > 3 ? (
              `+1 MAX x${combo}!`
            ) : (
              `+1${combo > 1 ? ` x${combo}` : ''}`
            )}

            {ripple.active && (
              <span
                style={{
                  position: 'absolute',
                  left: ripple.x - 20,
                  top: ripple.y - 20,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                  transform: 'scale(0)',
                  animation: 'rippleEffect 0.6s ease-out forwards',
                  pointerEvents: 'none',
                }}
              />
            )}

            <div
              style={{
                position: 'absolute',
                inset: -2,
                borderRadius: 'calc(var(--radius-sm) + 2px)',
                background: combo > 3 ? `conic-gradient(${getProgressColor()}, transparent)` : 'transparent',
                animation: combo > 3 ? 'rotateBorder 1s linear infinite' : 'none',
                opacity: 0,
                zIndex: -1,
                filter: 'blur(2px)',
              }}
            />
          </button>
        </div>

        {combo > 1 && combo <= 3 && (
          <div style={{
            marginTop: 6,
            textAlign: 'center',
            fontSize: 10,
            color: '#ffd700',
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            textShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
          }}>
            COMBO x{combo}!
          </div>
        )}
        {combo > 3 && (
          <div style={{
            marginTop: 6,
            textAlign: 'center',
            fontSize: 12,
            color: goal.color,
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            letterSpacing: 2,
            textShadow: `0 0 12px ${goal.color}`,
          }}>
            &#9889; MAX COMBO x{combo}! &#9889;
          </div>
        )}
      </div>

      <FlyingNumber
        key={flyKey}
        value={1}
        x={flyPos.x}
        y={flyPos.y}
        color={goal.color}
        combo={combo}
      />
      <ProgressParticle
        trigger={pulseTrigger}
        x={flyPos.x}
        y={flyPos.y}
        color={goal.color}
        count={combo > 3 ? 20 : 10}
      />
    </div>
  );
}