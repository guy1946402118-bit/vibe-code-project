import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { followApi } from '../lib/api';

interface FeedItem {
  id: string;
  type: 'checkin' | 'post';
  user?: { id: string; name: string; avatar?: string };
  author?: string;
  category?: string;
  points?: number;
  title?: string;
  slug?: string;
  timestamp: string | Date;
}

export function ActivityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try { setFeed(await followApi.getFeed()); } catch { /* ignore */ }
      try { setFollowing(await followApi.getFollowing()); } catch { /* ignore */ }
    };
    init();
    const timer = setInterval(init, 30000);
    return () => clearInterval(timer);
  }, []);

  const timeAgo = (ts: string | Date) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  const CAT_MAP: Record<string, string> = { HEALTH: '❤️ 健康', STUDY: '📚 学习', WORK: '💼 工作', DISCIPLINE: '🎯 自律', REVIEW: '📋 复盘' };

  return (
    <div style={{
      border: '1px solid rgba(170,0,255,0.18)', borderRadius: '8px',
      background: 'rgba(10,10,16,0.88)', backdropFilter: 'blur(12px)',
      padding: '18px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '18px', background: '#aa00ff', borderRadius: '2px', boxShadow: '0 0 10px #aa00ff' }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#aa00ff', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>📡 社区动态</span>
        </div>
        <span style={{ fontSize: '9px', color: 'rgba(170,0,255,0.3)', fontFamily: "'Courier New', monospace" }}>
          关注 {following.length} 人
        </span>
      </div>

      {feed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: "'Courier New', monospace" }}>
          关注好友以查看动态<br/>
          <button onClick={() => navigate('/blog')} style={{
            marginTop: '8px', padding: '4px 12px', borderRadius: '6px',
            border: '1px solid rgba(170,0,255,0.2)', background: 'rgba(170,0,255,0.06)',
            color: '#aa00ff', cursor: 'pointer', fontSize: '10px', fontFamily: "'Courier New', monospace",
          }}>去发现 →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
          {feed.slice(0, 15).map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 8px',
              borderRadius: '6px', background: 'rgba(255,255,255,0.02)',
              cursor: item.type === 'post' ? 'pointer' : 'default',
            }}
              onClick={() => { if (item.type === 'post' && item.slug) navigate(`/blog/${item.slug}`); }}>
              <span style={{ fontSize: '14px', flexShrink: 0 }}>
                {item.type === 'checkin' ? '✅' : '📝'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace", lineHeight: 1.3 }}>
                  <span style={{ color: item.type === 'checkin' ? '#FFD700' : '#ff6b6b', fontWeight: '700' }}>
                    {item.user?.name || item.author}
                  </span>
                  {item.type === 'checkin' ? (
                    <span> {CAT_MAP[item.category || ''] || '📌 其他'} +{item.points}分</span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}> 发表了 <span style={{ color: '#00f0ff' }}>{item.title}</span></span>
                  )}
                </div>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)', fontFamily: "'Courier New', monospace", marginTop: '2px' }}>
                  {timeAgo(item.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
