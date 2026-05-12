import { useEffect, useState, useRef } from 'react';
import { checkInApi, type CheckIn } from '../lib/api';

interface LifeDimension {
  key: string;
  icon: string;
  label: string;
  color: string;
  value: number;
  target: number;
  description: string;
}

const LIFE_DIMENSIONS: Omit<LifeDimension, 'value'>[] = [
  { key: 'health', icon: '❤️', label: '健康', color: '#ff6b6b', target: 100, description: '运动、饮食、睡眠、休息' },
  { key: 'study', icon: '📚', label: '学习', color: '#4ecdc4', target: 100, description: '阅读、课程、技能提升' },
  { key: 'work', icon: '💼', label: '工作', color: '#45b7d1', target: 100, description: '职业发展、项目完成' },
  { key: 'finance', icon: '💰', label: '财务', color: '#96ceb4', target: 100, description: '储蓄、投资、消费规划' },
  { key: 'family', icon: '👨‍👩‍👧', label: '家庭', color: '#ffaa00', target: 100, description: '陪伴、沟通、关系维护' },
  { key: 'social', icon: '👥', label: '社交', color: '#dda0dd', target: 100, description: '朋友、社团、人际关系' },
  { key: 'recreation', icon: '🎮', label: '娱乐', color: '#ff00aa', target: 100, description: '爱好、游玩、放松' },
  { key: 'spirit', icon: '🧘', label: '心灵', color: '#aa00ff', target: 100, description: '冥想、反思、价值观' },
];

const CATEGORY_TO_DIMENSION: Record<string, string[]> = {
  HEALTH: ['health'],
  STUDY: ['study'],
  WORK: ['work'],
  DISCIPLINE: ['spirit'],
  REVIEW: ['spirit'],
};

export function LifeFlowerPage() {
  const [dimensions, setDimensions] = useState<LifeDimension[]>([]);
  const [selectedDim, setSelectedDim] = useState<LifeDimension | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const manualOverridesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const saved = localStorage.getItem('lifeFlower');
      const savedManual: Record<string, number> = {};
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.assign(savedManual, parsed);
        } catch {}
      }
      manualOverridesRef.current = savedManual;

      const checkInScores: Record<string, number> = {};
      try {
        const stats = await checkInApi.getStats();
        if (stats.totalCheckIns > 0) {
          const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentCheckIns = await checkInApi.getAll({ startTime: weekAgo, endTime: Date.now() });

          const catDaySets: Record<string, Set<string>> = {};
          for (const ci of recentCheckIns) {
            const dateStr = new Date(ci.timestamp).toISOString().split('T')[0];
            if (!catDaySets[ci.category]) catDaySets[ci.category] = new Set();
            catDaySets[ci.category].add(dateStr);
          }

          for (const [cat, dims] of Object.entries(CATEGORY_TO_DIMENSION)) {
            const daysCount = catDaySets[cat]?.size || 0;
            const score = Math.round((daysCount / 7) * 100);
            for (const dim of dims) {
              if (!checkInScores[dim] || score > checkInScores[dim]) {
                checkInScores[dim] = score;
              }
            }
          }
        }
      } catch { /* API unavailable, use manual only */ }

      const initial: LifeDimension[] = LIFE_DIMENSIONS.map(dim => ({
        ...dim,
        value: savedManual[dim.key] !== undefined ? savedManual[dim.key] : (checkInScores[dim.key] || 0),
      }));
      setDimensions(initial);
      setLoading(false);
    };

    fetchData();
  }, []);

  const updateDimension = (key: string, value: number) => {
    setDimensions(prev => {
      const updated = prev.map(d => d.key === key ? { ...d, value } : d);
      const saveObj: Record<string, number> = {};
      updated.forEach(d => { saveObj[d.key] = d.value; });
      localStorage.setItem('lifeFlower', JSON.stringify(saveObj));
      return updated;
    });
  };

  useEffect(() => {
    if (canvasRef.current && dimensions.length > 0) {
      drawRadarChart();
    }
  }, [dimensions]);

  const drawRadarChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    const sides = dimensions.length;
    const angleStep = (Math.PI * 2) / sides;

    ctx.clearRect(0, 0, width, height);

    const levels = 5;
    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius / levels) * i;
      ctx.beginPath();
      for (let j = 0; j <= sides; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * levelRadius;
        const y = centerY + Math.sin(angle) * levelRadius;
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + i * 0.02})`;
      ctx.stroke();
    }

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const dim = dimensions[i % sides];
      const angle = i * angleStep - Math.PI / 2;
      const valueRadius = (dim.value / dim.target) * radius;
      const x = centerX + Math.cos(angle) * valueRadius;
      const y = centerY + Math.sin(angle) * valueRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < sides; i++) {
      const dim = dimensions[i];
      const angle = i * angleStep - Math.PI / 2;
      const labelRadius = radius + 35;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;

      ctx.font = '12px sans-serif';
      ctx.fillStyle = dim.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dim.icon, x, y - 8);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(dim.label, x, y + 8);

      ctx.font = '10px sans-serif';
      ctx.fillStyle = dim.color;
      ctx.fillText(`${dim.value}%`, x, y + 22);
    }
  };

  const totalScore = dimensions.length > 0 ? Math.round(dimensions.reduce((sum, d) => sum + d.value, 0) / dimensions.length) : 0;
  const balanceScore = dimensions.length > 0 ? Math.round(
    dimensions.reduce((sum, d) => sum + Math.abs(d.value - totalScore), 0) / dimensions.length
  ) : 0;
  const balanceLevel = balanceScore < 10 ? '非常均衡' : balanceScore < 20 ? '基本均衡' : balanceScore < 30 ? '略有失衡' : '严重失衡';

  const weakestDims = [...dimensions].sort((a, b) => a.value - b.value).slice(0, 2);
  const strongestDims = [...dimensions].sort((a, b) => b.value - a.value).slice(0, 2);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'rgba(255,255,255,0.4)', fontFamily: "'Courier New', monospace", fontSize: '14px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🌸</div>
          正在加载生命之花数据...
        </div>
      ) : (
      <>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
          🌸 生命之花
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          平衡人生八个维度，发现你的生活状态
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(0,240,255,0.2)',
          }}
        >
          <h3 style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', textAlign: 'center' }}>
            雷达图
          </h3>
          <canvas
            ref={canvasRef}
            width={350}
            height={350}
            style={{ width: '100%', height: 'auto', maxWidth: '350px', margin: '0 auto', display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(0,240,255,0.05) 100%)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(0,240,255,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>综合得分</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00f0ff' }}>{totalScore}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>平衡度</div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: balanceScore < 20 ? '#00ff88' : balanceScore < 30 ? '#ffaa00' : '#ff6b6b'
                }}>
                  {balanceLevel}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '12px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${totalScore}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00f0ff, #00ff88)',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(0,255,136,0.2)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
              🏆 最强项
            </div>
            {strongestDims.map((dim) => (
              <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{dim.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#fff' }}>{dim.label}</div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${dim.value}%`, height: '100%', background: dim.color, borderRadius: '2px' }} />
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: dim.color }}>{dim.value}%</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid rgba(255,107,107,0.2)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
              📈 待提升
            </div>
            {weakestDims.map((dim) => (
              <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{dim.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#fff' }}>{dim.label}</div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${dim.value}%`, height: '100%', background: dim.color, borderRadius: '2px' }} />
                  </div>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: dim.color }}>{dim.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '32px' }}>
        <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '16px' }}>各维度详情</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              onClick={() => setSelectedDim(dim)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${dim.color}30`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>{dim.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{dim.label}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{dim.description}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginRight: '12px' }}>
                  <div
                    style={{
                      width: `${dim.value}%`,
                      height: '100%',
                      background: dim.color,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: dim.color }}>{dim.value}%</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>0</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={dim.value}
                  onChange={(e) => updateDimension(dim.key, parseInt(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    height: '4px',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: `linear-gradient(90deg, ${dim.color}40, ${dim.color})`,
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>100</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: '32px',
          background: 'linear-gradient(135deg, rgba(0,240,255,0.1) 0%, rgba(0,255,136,0.1) 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(0,240,255,0.2)',
        }}
      >
        <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '16px' }}>💡 平衡建议</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {weakestDims.map(dim => (
            <div
              key={dim.key}
              style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{dim.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: dim.color }}>{dim.label}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
                {dim.key === 'health' && '建议每天安排30分钟以上的运动时间，保持规律作息。'}
                {dim.key === 'study' && '可以每天阅读30分钟，或参加在线课程提升技能。'}
                {dim.key === 'work' && '尝试使用番茄工作法提高效率，合理规划工作与休息。'}
                {dim.key === 'finance' && '建议开始记录收支，制定每月的储蓄计划。'}
                {dim.key === 'family' && '每天抽出时间与家人交流，周末安排家庭活动。'}
                {dim.key === 'social' && '可以参加一些社交活动或兴趣小组，扩大社交圈。'}
                {dim.key === 'recreation' && '别忘了给自己安排一些娱乐时间，做喜欢的事情放松身心。'}
                {dim.key === 'spirit' && '尝试每天冥想5-10分钟，或进行一些反思活动。'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedDim && (
        <div
          onClick={() => setSelectedDim(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0a0e27 100%)',
              borderRadius: '20px',
              padding: '24px',
              border: `1px solid ${selectedDim.color}40`,
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '48px' }}>{selectedDim.icon}</span>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: selectedDim.color, marginTop: '8px' }}>
                {selectedDim.label}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                {selectedDim.description}
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>当前得分</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: selectedDim.color }}>{selectedDim.value}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${selectedDim.value}%`, height: '100%', background: selectedDim.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedDim.value}
                onChange={(e) => updateDimension(selectedDim.key, parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: `linear-gradient(90deg, ${selectedDim.color}40, ${selectedDim.color})`,
                  borderRadius: '3px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>0</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>100</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDim(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: selectedDim.color + '20',
                color: selectedDim.color,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
      </>
    )}
    </div>
  );
}
