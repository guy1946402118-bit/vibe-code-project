import { useEffect, useState } from 'react';
import { checkInApi } from '../lib/api';

interface DayData {
  date: string;
  count: number;
  categories: string[];
}

export function HeatmapPage() {
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'week'>('year');
  const [heatmapData, setHeatmapData] = useState<DayData[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const all = await checkInApi.getAll();
        if (!mounted) return;
        const typed = Array.isArray(all) ? all : [];
        const daysToShow = viewMode === 'year' ? 365 : viewMode === 'month' ? 31 : 7;
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysToShow + 1);

        const dateMap: Record<string, { count: number; categories: string[] }> = {};
        typed.forEach((c: any) => {
          const d = c.timestamp ? new Date(c.timestamp).toISOString().split('T')[0] : c.date;
          if (!d || new Date(d) < startDate) return;
          if (!dateMap[d]) dateMap[d] = { count: 0, categories: [] };
          dateMap[d].count++;
          if (c.category && !dateMap[d].categories.includes(c.category)) {
            dateMap[d].categories.push(c.category);
          }
        });

        const data: DayData[] = [];
        for (let i = 0; i < daysToShow; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().split('T')[0];
          data.push({
            date: key,
            count: dateMap[key]?.count || 0,
            categories: dateMap[key]?.categories || [],
          });
        }
        if (mounted) setHeatmapData(data);
      } catch { /* empty */ }
    };
    load();
    return () => { mounted = false };
  }, [viewMode]);

  const getIntensity = (count: number): string => {
    const colors = ['rgba(255,255,255,0.05)', 'rgba(0,240,255,0.3)', 'rgba(0,240,255,0.5)', 'rgba(0,255,136,0.6)', 'rgba(0,255,136,0.8)', 'rgba(0,255,136,1)'];
    return colors[Math.min(count, 5)];
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>📊 打卡热力图</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px' }}>
        可视化你的坚持历程，每一天都在变得更好
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {(['year', 'month', 'week'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: viewMode === mode ? '2px solid #00f0ff' : '2px solid rgba(255,255,255,0.1)',
              background: viewMode === mode ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: viewMode === mode ? '#00f0ff' : 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {mode === 'year' ? '📅 年视图' : mode === 'month' ? '📆 月视图' : '📅 周视图'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid rgba(0,240,255,0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00f0ff' }}>{heatmapData.reduce((s, d) => s + d.count, 0)}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>总打卡次数</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid rgba(0,255,136,0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00ff88' }}>{heatmapData.filter(d => d.count > 0).length}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>活跃天数</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid rgba(255,170,0,0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffaa00' }}>{heatmapData.length}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>统计天数</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid rgba(255,107,107,0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff6b6b' }}>{(heatmapData.reduce((s, d) => s + d.count, 0) / (heatmapData.length || 1)).toFixed(1)}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>日均打卡</div>
        </div>
      </div>

      {viewMode === 'year' && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '24px', marginBottom: '24px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {(() => {
              const weeks: DayData[][] = [];
              for (let i = 0; i < heatmapData.length; i += 7) {
                weeks.push(heatmapData.slice(i, i + 7));
              }
              return weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={`${day.date}: ${day.count}次打卡`}
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        background: getIntensity(day.count),
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              ));
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>少</span>
            {[0, 1, 2, 3, 4, 5].map(level => (
              <div key={level} style={{ width: '14px', height: '14px', borderRadius: '3px', background: getIntensity(level) }} />
            ))}
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>多</span>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)', padding: '8px' }}>{d}</div>
            ))}
            {(() => {
              const firstDay = new Date(heatmapData[0]?.date || new Date());
              const paddingDays = firstDay.getDay();
              const cells = [];
              for (let i = 0; i < paddingDays; i++) cells.push(<div key={`pad-${i}`} />);
              heatmapData.forEach((day) => {
                cells.push(
                  <div
                    key={day.date}
                    style={{
                      background: getIntensity(day.count),
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{new Date(day.date).getDate()}</div>
                    <div style={{ fontSize: '18px', marginTop: '4px' }}>{day.count > 0 ? '✓' : ''}</div>
                  </div>
                );
              });
              return cells;
            })()}
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
            {heatmapData.map((day) => {
              const dayOfWeek = new Date(day.date).getDay();
              const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
              return (
                <div
                  key={day.date}
                  style={{
                    background: getIntensity(day.count),
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>{weekDays[dayOfWeek]}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>{new Date(day.date).getMonth() + 1}/{new Date(day.date).getDate()}</div>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>{day.count > 0 ? '✅' : '❌'}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{day.count}次打卡</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '16px' }}>分类打卡统计</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { key: 'HEALTH', icon: '❤️', color: '#ff6b6b', label: '健康' },
            { key: 'STUDY', icon: '📚', color: '#4ecdc4', label: '学习' },
            { key: 'WORK', icon: '💼', color: '#45b7d1', label: '工作' },
            { key: 'DISCIPLINE', icon: '⚡', color: '#ffaa00', label: '自律' },
            { key: 'REVIEW', icon: '📝', color: '#dda0dd', label: '复盘' },
          ].map(cat => {
            const count = heatmapData.reduce((sum, d) => sum + (d.categories.includes(cat.key) ? 1 : 0), 0);
            const total = heatmapData.reduce((s, d) => s + d.count, 0);
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={cat.key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '16px', border: `1px solid ${cat.color}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                  <span style={{ fontSize: '14px', color: '#fff' }}>{cat.label}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: cat.color }}>
                  {count} <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>天</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', background: cat.color, borderRadius: '2px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}