﻿import { useState, useMemo } from 'react';

interface StreakData {
  date: string;
  count: number;
  categories: string[];
}

interface StreakCalendarProps {
  data?: StreakData[];
  streak?: number;
  onDateClick?: (date: StreakData) => void;
}

const LEVEL_COLORS = [
  { min: 0, color: '#1a1a1a', label: 'No activity' },
  { min: 1, color: '#0e3d22', label: '1-2 check-ins' },
  { min: 3, color: '#145a2d', label: '3-4 check-ins' },
  { min: 5, color: '#1a7839', label: '5-6 check-ins' },
  { min: 7, color: '#22883f', label: '7+ check-ins' },
];

export function StreakCalendar({ data = [], streak = 0, onDateClick }: StreakCalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<StreakData | null>(null);

  const calendarGrid = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 365);

    const grid: (StreakData | null)[][] = [];
    let currentWeek: (StreakData | null)[] = [];
    const dataMap = new Map(data.map(d => [d.date, d]));

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      if (currentWeek.length === 7 || (currentWeek.length > 0 && d.getDay() === 0)) {
        grid.push(currentWeek);
        currentWeek = [];
      }

      const dateStr = d.toISOString().split('T')[0];
      currentWeek.push(dataMap.get(dateStr) || null);
    }

    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }

    return grid;
  }, [data]);

  const getLevelColor = (count: number) => {
    for (let i = LEVEL_COLORS.length - 1; i >= 0; i--) {
      if (count >= LEVEL_COLORS[i].min) return LEVEL_COLORS[i].color;
    }
    return LEVEL_COLORS[0].color;
  };

  const totalCheckIns = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid var(--border-medium)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: "'Courier New', monospace" }}>
            🔥 STREAK CALENDAR
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Current streak: <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{streak} days</span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          fontSize: '11px',
          fontFamily: "'Courier New', monospace",
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total:</span>{' '}
            <span style={{ color: 'var(--matrix-green)', fontWeight: 'bold' }}>{totalCheckIns}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Active:</span>{' '}
            <span style={{ color: 'var(--matrix-green)', fontWeight: 'bold' }}>{activeDays}</span>
            <span style={{ color: 'var(--text-muted)' }}>/365</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', paddingBottom: '8px' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          marginRight: '8px',
          paddingTop: '15px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: "'Courier New', monospace",
        }}>
          {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((day, i) => (
            <div key={i} style={{ height: '13px', lineHeight: '13px' }}>{day}</div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '3px' }}>
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = week[dayIndex];
                const count = dayData?.count || 0;

                return (
                  <div
                    key={dayIndex}
                    onMouseEnter={() => dayData && setHoveredDate(dayData)}
                    onMouseLeave={() => setHoveredDate(null)}
                    onClick={() => dayData && onDateClick?.(dayData)}
                    style={{
                      width: '13px',
                      height: '13px',
                      borderRadius: '2px',
                      background: getLevelColor(count),
                      cursor: dayData ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                      border: hoveredDate === dayData ? '1px solid var(--matrix-green)' : 'none',
                      transform: hoveredDate === dayData ? 'scale(1.3)' : 'scale(1)',
                      position: 'relative',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {hoveredDate && (
        <div
          onMouseEnter={() => setHoveredDate(hoveredDate)}
          style={{
            position: 'absolute',
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid var(--border-accent)',
            borderRadius: '6px',
            padding: '12px',
            zIndex: 100,
            pointerEvents: 'none',
            boxShadow: 'var(--shadow-lg)',
            marginTop: '-80px',
            marginLeft: '60px',
            minWidth: '200px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: "'Courier New', monospace" }}>
            📅 {hoveredDate.date}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--matrix-green)' }}>
            ✅ {hoveredDate.count} 次打卡
          </div>
          {hoveredDate.categories.length > 0 && (
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              分类: {hoveredDate.categories.join(', ')}
            </div>
          )}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '12px',
        fontSize: '10px',
        fontFamily: "'Courier New', monospace",
        color: 'var(--text-muted)',
      }}>
        少
        {LEVEL_COLORS.map((level, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: level.color,
            }} />
          </div>
        ))}
        多
      </div>
    </div>
  );
}

export default StreakCalendar;
