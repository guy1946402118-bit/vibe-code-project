import { useEffect, useState, useCallback } from 'react';

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
  char?: string;
}

interface ProgressParticleProps {
  trigger: number;
  x: number;
  y: number;
  color?: string;
  count?: number;
  chars?: string[];
}

export function ProgressParticle({ trigger, x, y, color = '#39ff14', count = 12, chars }: ProgressParticleProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawn = useCallback(() => {
    const defaults = chars || ['+', '✦', '⚡', '◆', '●', '▲', '💎', '⭐', '🔥', '💪'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 40 + Math.random() * 80;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        color: i % 3 === 0 ? color : i % 3 === 1 ? '#fff' : '#ffd700',
        size: 8 + Math.random() * 14,
        life: 1,
        maxLife: 600 + Math.random() * 400,
        char: defaults[Math.floor(Math.random() * defaults.length)],
      });
    }
    setParticles(newParticles);
  }, [trigger, x, y, color, count]);

  useEffect(() => {
    if (trigger > 0) spawn();
  }, [trigger]);

  useEffect(() => {
    if (particles.length === 0) return;
    let frame: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      setParticles(prev => {
        const next = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx * (dt / 1000),
            y: p.y + p.vy * (dt / 1000),
            vy: p.vy + 120 * (dt / 1000),
            life: p.life - dt / p.maxLife,
          }))
          .filter(p => p.life > 0);
        if (next.length === 0) return [];
        return next;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [particles.length > 0]);

  if (particles.length === 0) return null;

  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: p.x,
            top: p.y,
            fontSize: p.size,
            fontWeight: 'bold',
            color: p.color,
            opacity: p.life,
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'translate(-50%, -50%)',
            textShadow: `0 0 8px ${p.color}`,
            fontFamily: "'Courier New', monospace",
          }}
        >
          {p.char}
        </div>
      ))}
    </>
  );
}