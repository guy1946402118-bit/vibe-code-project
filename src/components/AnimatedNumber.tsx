import { useEffect, useState, useRef } from 'react';

interface CounterProps {
  value: number;
  duration?: number;
}

export function Counter({ value, duration = 1000 }: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTime.current = null;
    setDisplayValue(0);

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeOut * value));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export function AnimatedNumber({ value, duration = 1000 }: CounterProps) {
  return <Counter value={value} duration={duration} />;
}