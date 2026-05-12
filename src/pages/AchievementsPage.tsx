import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  points: number;
  earned: boolean;
  earnedAt?: string;
}

const BADGE_CATEGORIES = {
  CHECKIN: { icon: '✅', label: '打卡', color: '#00f0ff' },
  STREAK: { icon: '🔥', label: '连续', color: '#ff6b6b' },
  TRAINING: { icon: '🧠', label: '训练', color: '#00ff88' },
  NOTES: { icon: '📝', label: '笔记', color: '#ffaa00' },
  BLOG: { icon: '📄', label: '博客', color: '#ff00aa' },
  GOALS: { icon: '🎯', label: '目标', color: '#4ecdc4' },
  LEARNING: { icon: '📖', label: '学习', color: '#45b7d1' },
  SOCIAL: { icon: '👥', label: '社交', color: '#aa00ff' },
  RANK: { icon: '⬆️', label: '段位', color: '#ffd700' },
  SPECIAL: { icon: '🌟', label: '特殊', color: '#ffd700' },
};

const ALL_BADGES: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  { id: '1', code: 'FIRST_CHECKIN', name: '初次打卡', description: '完成第一次打卡', icon: '🎯', category: 'CHECKIN', requirement: 1, points: 10 },
  { id: '2', code: 'CHECKIN_7', name: '习惯达人', description: '累计打卡7天', icon: '🌱', category: 'CHECKIN', requirement: 7, points: 30 },
  { id: '3', code: 'CHECKIN_30', name: '百年树人', description: '累计打卡30天', icon: '🌳', category: 'CHECKIN', requirement: 30, points: 100 },
  { id: '4', code: 'CHECKIN_100', name: '坚持不懈', description: '累计打卡100天', icon: '🏆', category: 'CHECKIN', requirement: 100, points: 300 },
  { id: '5', code: 'STREAK_7', name: '连续7天', description: '连续打卡7天', icon: '🔥', category: 'STREAK', requirement: 7, points: 50 },
  { id: '6', code: 'STREAK_30', name: '火焰勋章', description: '连续打卡30天', icon: '💎', category: 'STREAK', requirement: 30, points: 150 },
  { id: '7', code: 'TRAINING_10', name: '训练新手', description: '完成10次训练', icon: '🧠', category: 'TRAINING', requirement: 10, points: 20 },
  { id: '8', code: 'TRAINING_50', name: '训练大师', description: '完成50次训练', icon: '🎓', category: 'TRAINING', requirement: 50, points: 100 },
  { id: '9', code: 'NOTES_10', name: '笔记达人', description: '创建10篇笔记', icon: '📒', category: 'NOTES', requirement: 10, points: 30 },
  { id: '10', code: 'NOTES_50', name: '知识库主', description: '创建50篇笔记', icon: '📚', category: 'NOTES', requirement: 50, points: 150 },
  { id: '11', code: 'BLOG_1', name: '初次创作', description: '发布第一篇文章', icon: '✍️', category: 'BLOG', requirement: 1, points: 20 },
  { id: '12', code: 'BLOG_10', name: '内容创作者', description: '发布10篇文章', icon: '📝', category: 'BLOG', requirement: 10, points: 100 },
  { id: '13', code: 'PERFECT_DAY', name: '完美一天', description: '一天内完成所有分类打卡', icon: '⭐', category: 'SPECIAL', requirement: 1, points: 50 },
  { id: '14', code: 'ALL_CATEGORIES', name: '全能选手', description: '完成所有分类打卡各10次', icon: '🎖️', category: 'SPECIAL', requirement: 50, points: 200 },
  { id: '15', code: 'EARLY_BIRD', name: '早起鸟', description: '早晨6点前完成打卡', icon: '🐦', category: 'SPECIAL', requirement: 1, points: 30 },
  { id: '16', code: 'GOAL_FIRST', name: '目标起航', description: '创建第一个目标', icon: '🚀', category: 'GOALS', requirement: 1, points: 15 },
  { id: '17', code: 'GOAL_COMPLETE_1', name: '初次达成', description: '完成第一个目标', icon: '🎉', category: 'GOALS', requirement: 1, points: 50 },
  { id: '18', code: 'GOAL_COMPLETE_5', name: '目标猎人', description: '完成5个目标', icon: '🏹', category: 'GOALS', requirement: 5, points: 150 },
  { id: '19', code: 'GOAL_COMPLETE_10', name: '目标收割者', description: '完成10个目标', icon: '⚔️', category: 'GOALS', requirement: 10, points: 300 },
  { id: '20', code: 'GOAL_POINTS_500', name: '积分积累者', description: '通过目标获得500积分', icon: '💰', category: 'GOALS', requirement: 500, points: 50 },
  { id: '21', code: 'GOAL_POINTS_2000', name: '积分大亨', description: '通过目标获得2000积分', icon: '💎', category: 'GOALS', requirement: 2000, points: 150 },
  { id: '22', code: 'QUADRANT_MASTER', name: '四象限大师', description: '使用四象限管理10个任务', icon: '⏰', category: 'GOALS', requirement: 10, points: 100 },
  { id: '23', code: 'LEARN_1H', name: '学习初体验', description: '累计学习1小时', icon: '📖', category: 'LEARNING', requirement: 60, points: 20 },
  { id: '24', code: 'LEARN_10H', name: '求知若渴', description: '累计学习10小时', icon: '📚', category: 'LEARNING', requirement: 600, points: 80 },
  { id: '25', code: 'LEARN_50H', name: '学霸模式', description: '累计学习50小时', icon: '🎓', category: 'LEARNING', requirement: 3000, points: 200 },
  { id: '26', code: 'NOTES_100', name: '百科全书', description: '创建100篇笔记', icon: '📔', category: 'NOTES', requirement: 100, points: 300 },
  { id: '27', code: 'BLOG_50', name: '专栏作家', description: '发布50篇文章', icon: '📰', category: 'BLOG', requirement: 50, points: 300 },
  { id: '28', code: 'STREAK_14', name: '两周连击', description: '连续打卡14天', icon: '⚡', category: 'STREAK', requirement: 14, points: 80 },
  { id: '29', code: 'STREAK_60', name: '双月霸主', description: '连续打卡60天', icon: '👑', category: 'STREAK', requirement: 60, points: 300 },
  { id: '30', code: 'STREAK_100', name: '百日奇迹', description: '连续打卡100天', icon: '🌟', category: 'STREAK', requirement: 100, points: 500 },
  { id: '31', code: 'TRAINING_100', name: '训练将军', description: '完成100次训练', icon: '🎖️', category: 'TRAINING', requirement: 100, points: 200 },
  { id: '32', code: 'RANK_SILVER', name: '初露锋芒', description: '达到白银段位', icon: '🥈', category: 'RANK', requirement: 500, points: 50 },
  { id: '33', code: 'RANK_GOLD', name: '金榜题名', description: '达到黄金段位', icon: '🥇', category: 'RANK', requirement: 1200, points: 100 },
  { id: '34', code: 'RANK_DIAMOND', name: '钻石会员', description: '达到钻石段位', icon: '💎', category: 'RANK', requirement: 4500, points: 200 },
  { id: '35', code: 'RANK_MASTER', name: '一代宗师', description: '达到大师段位', icon: '⭐', category: 'RANK', requirement: 8000, points: 500 },
  { id: '36', code: 'RANK_KING', name: '荣耀加冕', description: '达到王者段位', icon: '👑', category: 'RANK', requirement: 20000, points: 1000 },
  { id: '37', code: 'LIFE_BALANCE', name: '生命均衡', description: '生命之花8个维度均≥50%', icon: '🌸', category: 'SPECIAL', requirement: 8, points: 100 },
  { id: '38', code: 'LIFE_MASTERY', name: '生命大师', description: '生命之花8个维度均≥80%', icon: '🌺', category: 'SPECIAL', requirement: 8, points: 300 },
  { id: '39', code: 'NIGHT_OWL', name: '夜猫子', description: '凌晨0点后完成打卡', icon: '🦉', category: 'SPECIAL', requirement: 1, points: 20 },
  { id: '40', code: 'WEEKEND_WARRIOR', name: '周末战士', description: '连续4个周末都完成打卡', icon: '⚔️', category: 'STREAK', requirement: 8, points: 60 },
];

export function AchievementsPage() {
  const { currentUser } = useUserStore();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    loadBadges();
  }, [currentUser]);

  const loadBadges = () => {
    const earnedBadges = ['1', '2', '5', '13', '16', '17', '28', '32'];
    const badgesWithStatus: Badge[] = ALL_BADGES.map(badge => ({
      ...badge,
      earned: earnedBadges.includes(badge.id),
      earnedAt: earnedBadges.includes(badge.id) ? new Date().toISOString() : undefined,
    }));
    setBadges(badgesWithStatus);
  };

  const earnedCount = badges.filter(b => b.earned).length;
  const totalPoints = badges.filter(b => b.earned).reduce((sum, b) => sum + b.points, 0);

  const filteredBadges = badges.filter(b => {
    if (filter === 'ALL') return true;
    if (filter === 'EARNED') return b.earned;
    return b.category === filter;
  });

  const handleBadgeClick = (badge: Badge) => {
    if (badge.earned) {
      setSelectedBadge(badge);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
          🏆 成就中心
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          解锁徽章，成就更好的自己
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255,215,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏅</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffd700' }}>{earnedCount}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>已获得徽章</div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(0,240,255,0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0,240,255,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⭐</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00f0ff' }}>{totalPoints}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>成就积分</div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(0,255,136,0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(0,255,136,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00ff88' }}>{badges.length - earnedCount}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>待解锁徽章</div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(170,0,255,0.15) 0%, rgba(170,0,255,0.05) 100%)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(170,0,255,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📊</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#aa00ff' }}>{Math.round((earnedCount / badges.length) * 100)}%</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>完成进度</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: filter === 'ALL' ? '2px solid #00f0ff' : '2px solid rgba(255,255,255,0.1)',
            background: filter === 'ALL' ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.05)',
            color: filter === 'ALL' ? '#00f0ff' : 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          全部 ({badges.length})
        </button>
        <button
          onClick={() => setFilter('EARNED')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: filter === 'EARNED' ? '2px solid #00ff88' : '2px solid rgba(255,255,255,0.1)',
            background: filter === 'EARNED' ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
            color: filter === 'EARNED' ? '#00ff88' : 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          已获得 ({earnedCount})
        </button>
        {Object.entries(BADGE_CATEGORIES).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filter === key ? `2px solid ${val.color}` : '2px solid rgba(255,255,255,0.1)',
              background: filter === key ? `${val.color}20` : 'rgba(255,255,255,0.05)',
              color: filter === key ? val.color : 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        {filteredBadges.map((badge) => {
          const cat = BADGE_CATEGORIES[badge.category as keyof typeof BADGE_CATEGORIES] || BADGE_CATEGORIES.SPECIAL;
          const isEarned = badge.earned;

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              style={{
                background: isEarned
                  ? `linear-gradient(135deg, ${cat.color}15 0%, rgba(255,255,255,0.05) 100%)`
                  : 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                padding: '20px',
                border: isEarned
                  ? `2px solid ${cat.color}50`
                  : '2px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
                cursor: isEarned ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                opacity: isEarned ? 1 : 0.5,
                filter: isEarned ? 'none' : 'grayscale(50%)',
              }}
            >
              {!isEarned && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  fontSize: '16px',
                }}>
                  🔒
                </div>
              )}
              <div style={{
                fontSize: '48px',
                marginBottom: '12px',
                filter: isEarned ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'none',
              }}>
                {badge.icon}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: isEarned ? '#fff' : 'rgba(255,255,255,0.5)',
                marginBottom: '6px',
              }}>
                {badge.name}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '8px',
                minHeight: '28px',
              }}>
                {badge.description}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: cat.color,
              }}>
                <span>+{badge.points}</span>
                <span>积分</span>
              </div>
              {isEarned && badge.earnedAt && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  {new Date(badge.earnedAt).toLocaleDateString('zh-CN')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
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
              borderRadius: '24px',
              padding: '32px',
              textAlign: 'center',
              border: '2px solid #ffd700',
              maxWidth: '350px',
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>
              🎉
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#ffd700',
              marginBottom: '8px',
            }}>
              {selectedBadge.name}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '16px',
            }}>
              {selectedBadge.description}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '20px',
            }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00f0ff' }}>
                  +{selectedBadge.points}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>成就积分</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00ff88' }}>
                  {BADGE_CATEGORIES[selectedBadge.category as keyof typeof BADGE_CATEGORIES]?.label}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>分类</div>
              </div>
            </div>
            {selectedBadge.earnedAt && (
              <div style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
              }}>
                获得时间：{new Date(selectedBadge.earnedAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
            <button
              onClick={() => setSelectedBadge(null)}
              style={{
                marginTop: '20px',
                padding: '12px 32px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                color: '#000',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
