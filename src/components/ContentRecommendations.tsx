import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi } from '../lib/api';

interface Recommendation {
  id: string;
  title: string;
  category: string;
  reason: string;
  slug: string;
}

export function ContentRecommendations({ limit = 4 }: { limit?: number }) {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const raw: any = await blogApi.getAll();
        const posts = Array.isArray(raw) ? raw : (raw?.posts || []);
        const shuffled = posts.sort(() => Math.random() - 0.5).slice(0, limit);
        const recommendations: Recommendation[] = shuffled.map((p: any, i: number) => ({
          id: p.id || String(i),
          title: p.title,
          category: p.category,
          slug: p.slug,
          reason: REASONS[i % REASONS.length],
        }));
        setRecs(recommendations);
      } catch { /* ignore */ }
    })();
  }, [limit]);

  return (
    <div style={{
      border: '1px solid rgba(255,215,0,0.18)', borderRadius: '8px',
      background: 'rgba(10,10,16,0.88)', backdropFilter: 'blur(12px)',
      padding: '18px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ width: '4px', height: '18px', background: '#FFD700', borderRadius: '2px', boxShadow: '0 0 10px #FFD700' }} />
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFD700', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>💡 为你推荐</span>
      </div>
      {recs.map(rec => (
        <div key={rec.id} onClick={() => navigate(`/blog/${rec.slug}`)}
          style={{
            padding: '8px 10px', marginBottom: '6px', borderRadius: '6px',
            border: '1px solid rgba(255,215,0,0.06)', background: 'rgba(255,215,0,0.02)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.02)'; }}
        >
          <div style={{ fontSize: '11px', color: '#fff', fontFamily: "'Courier New', monospace" }}>{rec.title}</div>
          <div style={{ fontSize: '9px', color: 'rgba(255,215,0,0.4)', fontFamily: "'Courier New', monospace", marginTop: '3px' }}>{rec.reason}</div>
        </div>
      ))}
      {recs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: "'Courier New', monospace" }}>暂无推荐内容</div>
      )}
    </div>
  );
}

const REASONS = [
  '基于你的阅读偏好推荐',
  '同标签下热门文章',
  '与你最近浏览内容相关',
  '你可能感兴趣的新文章',
  '社区高互动率推荐',
  '你的薄弱领域 · 建议加强',
  '✨ 本周精选内容',
  '🔥 正在被热议的文章',
];
