import { useState, useEffect } from 'react';
import type { RankInfo } from '../lib/ranks';
import { getNextRank, getProgressToNextRank } from '../lib/ranks';

const RANK_NAMES: Record<string, string> = {
  'NEWCOMER': '新手',
  'APPRENTICE': '学徒',
  'WARRIOR': '战士',
  'ELITE': '精英',
  'MASTER': '大师',
  'LEGEND': '传奇',
  'MYTHIC': '神话',
  'TRANSCENDENT': '超凡',
};

function playRankUpSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playTone(523.25, now, 0.2);
    playTone(659.25, now + 0.1, 0.2);
    playTone(783.99, now + 0.2, 0.3);
    playTone(1046.50, now + 0.35, 0.4);
  } catch { /* audio not supported */ }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

function generateParticles(count: number): Particle[] {
  const colors = ['var(--matrix-green)', '#00ff88', '#ff6b6b', '#ffd700', '#00f0ff', '#ff00aa'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3 - 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 2,
    life: 1,
    maxLife: Math.random() * 60 + 40,
  }));
}

interface RankUpAnimationProps {
  show: boolean;
  newRank: RankInfo | null;
  onComplete: () => void;
}

export function RankUpAnimation({ show, newRank, onComplete }: RankUpAnimationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (show && newRank) {
      setParticles(generateParticles(80));
      setShowContent(false);
      setAnimationPhase(0);

      playRankUpSound();

      const timer1 = setTimeout(() => setShowContent(true), 500);
      const timer2 = setTimeout(() => setAnimationPhase(1), 1000);
      const timer3 = setTimeout(() => setAnimationPhase(2), 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [show, newRank]);

  useEffect(() => {
    if (!show || particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.05,
            life: p.life - (1 / p.maxLife),
          }))
          .filter(p => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [show, particles.length > 0]);

  if (!show || !newRank) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="var(--matrix-green)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--matrix-green)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {particles.map(p => (
          <circle
            key={p.id}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={p.size * p.life}
            fill={p.color}
            opacity={p.life * 0.8}
          />
        ))}
      </svg>

      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        opacity: showContent ? 1 : 0,
        transform: `scale(${showContent ? 1 : 0.5})`,
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          animation: animationPhase >= 1 ? 'pulse 1s ease-in-out infinite' : 'none',
          filter: `drop-shadow(0 0 30px ${newRank.color})`,
        }}>
          {newRank.icon}
        </div>

        <div style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--matrix-green)',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          fontFamily: "'Courier New', monospace",
          marginBottom: '12px',
          opacity: animationPhase >= 1 ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          ▲ LEVEL UP ▲
        </div>

        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          background: `linear-gradient(135deg, ${newRank.color}, #fff, ${newRank.color})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '12px',
          textShadow: '0 0 30px var(--matrix-green-dim)',
          transform: `scale(${animationPhase >= 1 ? 1 : 0})`,
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {RANK_NAMES[newRank.tier] || newRank.nameCn}
        </div>

        <div style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '30px',
          opacity: animationPhase >= 2 ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          {newRank.name}
        </div>

        <button
          onClick={onComplete}
          style={{
            padding: '16px 48px',
            background: 'linear-gradient(135deg, var(--matrix-green), #00ff88)',
            color: '#000',
            border: 'none',
            borderRadius: '30px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            letterSpacing: '2px',
            boxShadow: '0 0 30px var(--matrix-green-dim)',
            transition: 'all 0.3s ease',
            opacity: animationPhase >= 2 ? 1 : 0,
            transform: `translateY(${animationPhase >= 2 ? 0 : 20}px)`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 40px var(--matrix-green-dim)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 0 30px var(--matrix-green-dim)';
          }}
        >
          CONTINUE →
        </button>
      </div>
    </div>
  );
}

interface RankBadgeProps {
  rank: RankInfo;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  currentPoints: number;
}

export function RankBadge({ rank, size = 'medium', showProgress = false, currentPoints }: RankBadgeProps) {
  const nextRank = getNextRank(rank.tier);
  const progress = getProgressToNextRank(currentPoints, rank, nextRank);

  const sizes = {
    small: { padding: '6px 12px', iconSize: '16px', fontSize: '12px' },
    medium: { padding: '10px 20px', iconSize: '24px', fontSize: '16px' },
    large: { padding: '16px 32px', iconSize: '40px', fontSize: '24px' },
  };

  const s = sizes[size];

  return (
    <div
      style={{
        background: rank.bgGradient,
        padding: s.padding,
        borderRadius: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: `0 4px 15px rgba(0,0,0,0.2), 0 0 20px ${rank.color}40`,
        cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        border: `1px solid ${rank.color}60`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3), 0 0 30px ${rank.color}60`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = `0 4px 15px rgba(0,0,0,0.2), 0 0 20px ${rank.color}40`;
      }}
    >
      <span style={{ 
        fontSize: s.iconSize, 
        filter: `drop-shadow(0 0 10px ${rank.color})`,
        display: 'inline-block',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        {rank.icon}
      </span>
      <span style={{ 
        fontSize: s.fontSize, 
        fontWeight: '600', 
        color: '#fff', 
        textShadow: `0 1px 3px rgba(0,0,0,0.3), 0 0 10px ${rank.color}40` 
      }}>
        {RANK_NAMES[rank.tier] || rank.nameCn}
      </span>
      
      {showProgress && nextRank && (
        <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            width: '60px', 
            height: '6px', 
            background: 'rgba(255,255,255,0.3)', 
            borderRadius: '3px', 
            overflow: 'hidden',
            boxShadow: `inset 0 1px 3px rgba(0,0,0,0.3)`,
          }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(90deg, #fff, ${rank.color})`,
                borderRadius: '3px',
                transition: 'width 1s ease-out',
                boxShadow: `0 0 10px ${rank.color}`,
              }}
            />
          </div>
          <span style={{ 
            fontSize: '10px', 
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 'bold',
            textShadow: `0 0 5px ${rank.color}`
          }}>{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

interface RankProgressBarProps {
  currentPoints: number;
  currentRank: RankInfo;
}

export function RankProgressBar({ currentPoints, currentRank }: RankProgressBarProps) {
  const nextRank = getNextRank(currentRank.tier);
  const progress = getProgressToNextRank(currentPoints, currentRank, nextRank);

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '8px', 
        fontSize: '12px', 
        color: 'var(--text-muted)',
        fontFamily: "'Courier New', monospace",
      }}>
        <span>CURRENT: {RANK_NAMES[currentRank.tier] || currentRank.nameCn}</span>
        {nextRank && <span>NEXT: {RANK_NAMES[nextRank.tier] || nextRank.nameCn} ({nextRank.minPoints} pts)</span>}
      </div>
      <div style={{ 
        height: '12px', 
        background: 'rgba(255,255,255,0.08)', 
        borderRadius: '6px', 
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${currentRank.color}, #fff, ${currentRank.color})`,
            borderRadius: '6px',
            transition: 'width 1s ease-out',
            boxShadow: `0 0 15px ${currentRank.color}80`,
            position: 'relative',
          }}
        />
        {nextRank && (
          <div style={{
            position: 'absolute',
            left: `${progress}%`,
            top: '-4px',
            width: '20px',
            height: '20px',
            background: '#fff',
            borderRadius: '50%',
            border: `3px solid ${currentRank.color}`,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 15px ${currentRank.color}, 0 0 30px ${currentRank.color}40`,
            transition: 'left 1s ease-out',
            zIndex: 2,
          }} />
        )}
      </div>
      {nextRank && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '8px', 
          fontSize: '13px', 
          color: 'var(--text-muted)',
          fontFamily: "'Courier New', monospace",
        }}>
          {nextRank.minPoints - currentPoints} pts to{' '}
          <span style={{ color: currentRank.color, fontWeight: 'bold' }}>
            {RANK_NAMES[nextRank.tier] || nextRank.nameCn}
          </span>
        </div>
      )}
    </div>
  );
}
