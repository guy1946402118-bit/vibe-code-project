﻿import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { followApi } from '../lib/api';
import { showToast } from '../components/Toast';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  totalPoints: number;
  streak: number;
  category: string;
  trend: 'up' | 'down' | 'same';
}

type TimeRange = 'day' | 'week' | 'month' | 'all';
type Category = 'all' | 'HEALTH' | 'STUDY' | 'WORK' | 'FITNESS' | 'DISCIPLINE';

export function LeaderboardPage() {
  const { currentUser } = useUserStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [category, setCategory] = useState<Category>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLeaderboard();
    loadFollowing();
  }, [timeRange, category]);

  const loadFollowing = async () => {
    try {
      const following = await followApi.getFollowing();
      setFollowingIds(new Set(following.map((u: any) => u.id)));
    } catch { /* ignore */ }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/users/rankings');
      if (!response.ok) throw new Error('Failed to fetch rankings');

      const users = await response.json();

      let data: LeaderboardEntry[] = users.map((user: any, i: number) => ({
        rank: i + 1,
        userId: user.id,
        name: user.name || 'Anonymous',
        avatar: user.avatar || '👤',
        totalPoints: user.points || 0,
        streak: 0,
        category: '',
        trend: 'same' as const,
      }));

      setLeaderboard(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);

      const fallbackUsers = [
        { name: currentUser?.name || 'You', avatar: '🎯', basePoints: currentUser?.points || 0, streak: 1 },
      ];

      let data: LeaderboardEntry[] = fallbackUsers.map((user, i) => ({
        rank: i + 1,
        userId: currentUser?.id || 'local',
        name: user.name,
        avatar: user.avatar,
        totalPoints: user.basePoints,
        streak: user.streak,
        category: '',
        trend: 'same' as const,
      }));

      setLeaderboard(data);
      setIsLoading(false);
    }
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.3)' };
    if (rank === 2) return { color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)', border: 'rgba(192,192,192,0.3)' };
    if (rank === 3) return { color: '#cd7f32', bg: 'rgba(205,127,50,0.15)', border: 'rgba(205,127,50,0.3)' };
    return { color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.05)' };
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return { icon: '↑', color: '#00ff88' };
    if (trend === 'down') return { icon: '↓', color: '#ff6b6b' };
    return { icon: '→', color: '#ffaa00' };
  };

  const handleFollow = async (userId: string, userName: string) => {
    try {
      await followApi.follow(userId);
      setFollowingIds(prev => new Set([...prev, userId]));
      showToast({ type: 'success', title: '已关注', message: `你正在关注 ${userName}`, duration: 2000 });
    } catch { /* ignore */ }
  };

  const handleUnfollow = async (userId: string, userName: string) => {
    try {
      await followApi.unfollow(userId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(userId); return n; });
      showToast({ type: 'info', title: '已取消关注', message: `不再关注 ${userName}`, duration: 2000 });
    } catch { /* ignore */ }
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontFamily: "'Courier New', monospace" }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <div>LOADING_RANKINGS...</div>
        </div>
      ) : (
      <>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
          🏆 排行榜
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          与伙伴们一较高下，看看谁是最努力的成长者
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['day', 'week', 'month', 'all'] as TimeRange[]).map(t => (
          <button
            key={t}
            onClick={() => setTimeRange(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: timeRange === t ? '2px solid #00f0ff' : '2px solid rgba(255,255,255,0.1)',
              background: timeRange === t ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: timeRange === t ? '#00f0ff' : 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {t === 'day' ? '今日' : t === 'week' ? '本周' : t === 'month' ? '本月' : '全部'}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {(['all', 'HEALTH', 'STUDY', 'WORK', 'FITNESS', 'DISCIPLINE'] as Category[]).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '8px 12px',
                borderRadius: '16px',
                border: category === c ? '2px solid #00ff88' : '2px solid rgba(255,255,255,0.1)',
                background: category === c ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
                color: category === c ? '#00ff88' : 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {c === 'all' ? '全部' : c === 'HEALTH' ? '❤️' : c === 'STUDY' ? '📚' : c === 'WORK' ? '💼' : c === 'FITNESS' ? '💪' : '⚡'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {topThree.map((user, i) => {
          const style = getRankStyle(user.rank);
          const trend = getTrendIcon(user.trend);

          return (
            <div
              key={user.userId}
              style={{
                background: style.bg,
                borderRadius: '16px',
                padding: '20px',
                border: `1px solid ${style.border}`,
                textAlign: 'center',
                position: 'relative',
                order: i === 1 ? -1 : i,
              }}
            >
              {user.rank === 1 && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '24px',
                }}>
                  👑
                </div>
              )}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                margin: '0 auto 12px',
              }}>
                {user.avatar}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: style.color,
                marginBottom: '4px',
              }}>
                {user.name}
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '8px',
              }}>
                {user.totalPoints.toLocaleString()}
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
              }}>
                积分
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                fontSize: '12px',
              }}>
                <span style={{ color: trend.color }}>
                  {trend.icon} {user.streak}天连续
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 100px 100px 60px 80px',
          padding: '12px 20px',
          background: 'rgba(0,0,0,0.2)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.4)',
        }}>
          <div>排名</div>
          <div>用户</div>
          <div style={{ textAlign: 'right' }}>积分</div>
          <div style={{ textAlign: 'right' }}>连续天数</div>
          <div style={{ textAlign: 'center' }}>趋势</div>
          <div style={{ textAlign: 'center' }}>操作</div>
        </div>

        {rest.map((user) => {
          const style = getRankStyle(user.rank);
          const trend = getTrendIcon(user.trend);
          const isCurrentUser = currentUser && user.userId === currentUser.id;

          return (
            <div
              key={user.userId}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 100px 100px 60px 80px',
                padding: '16px 20px',
                alignItems: 'center',
                background: isCurrentUser ? 'rgba(0,240,255,0.1)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: style.color,
              }}>
                #{user.rank}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  {user.avatar}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                    {user.name}
                    {isCurrentUser && <span style={{ color: '#00f0ff', marginLeft: '6px', fontSize: '11px' }}>(你)</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {user.category === 'HEALTH' ? '❤️ 健康' :
                     user.category === 'STUDY' ? '📚 学习' :
                     user.category === 'WORK' ? '💼 工作' :
                     user.category === 'FITNESS' ? '💪 健身' : '⚡ 自律'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {user.totalPoints.toLocaleString()}
              </div>
              <div style={{ textAlign: 'right', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                {user.streak}天
              </div>
              <div style={{ textAlign: 'center', fontSize: '14px', color: trend.color }}>
                {trend.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                {isCurrentUser ? (
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Courier New', monospace" }}>自己</span>
                ) : followingIds.has(user.userId) ? (
                  <button onClick={() => handleUnfollow(user.userId, user.name)}
                    style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '10px', cursor: 'pointer',
                      border: '1px solid rgba(255,107,107,0.3)', background: 'rgba(255,107,107,0.1)',
                      color: '#ff6b6b', fontFamily: "'Courier New', monospace",
                    }}>✓ 已关注</button>
                ) : (
                  <button onClick={() => handleFollow(user.userId, user.name)}
                    style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '10px', cursor: 'pointer',
                      border: '1px solid var(--matrix-green-dim)', background: 'var(--accent-dim)',
                      color: 'var(--matrix-green)', fontFamily: "'Courier New', monospace",
                    }}>+ 关注</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(0,255,136,0.1))',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(0,240,255,0.2)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
          {currentUser ? `${currentUser.name} 的当前排名` : '你的当前排名'}
        </div>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#00f0ff' }}>
          #{leaderboard.length + 1}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
          继续努力，冲击更高排名！
        </div>
      </div>
      </>
      )}
    </div>
  );
}
