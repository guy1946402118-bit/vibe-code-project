import { useEffect, useState } from 'react';

interface FlyingNumberProps {
  value: number;
  x: number;
  y: number;
  color?: string;
  combo?: number;
}

export function FlyingNumber({ value, x, y, color = '#39ff14', combo = 1 }: FlyingNumberProps) {
  const [visible, setVisible] = useState(true);
  const [pos, setPos] = useState({ x, y });
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    setVisible(true);
    setPos({ x, y });
    setScale(combo > 1 ? 1.2 + combo * 0.15 : 1);
    setOpacity(1);

    const duration = 800;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setPos({
        x: x + Math.sin(progress * Math.PI) * 20,
        y: y - 60 * eased - (combo > 1 ? 20 : 0),
      });
      setScale(1 + (combo > 1 ? combo * 0.2 : 0) - eased * 0.3);
      setOpacity(progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setVisible(false);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        fontSize: combo > 1 ? 16 + combo * 4 : 18,
        fontWeight: 'bold',
        color,
        opacity,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: 'none',
        zIndex: 9999,
        textShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
        fontFamily: "'Courier New', monospace",
      }}
    >
      +{value}{combo > 1 ? ` x${combo}` : ''}
    </div>
  );
}