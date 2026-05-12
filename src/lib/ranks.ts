export type RankTier = 
  | 'bronze' | 'silver' | 'gold' | 'platinum' 
  | 'diamond' | 'master' | 'grandmaster' | 'challenger' 
  | 'king' | 'supreme';

export interface RankInfo {
  tier: RankTier;
  name: string;
  nameCn: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  bgGradient: string;
  icon: string;
}

export const RANKS: Record<RankTier, RankInfo> = {
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    nameCn: '青铜',
    minPoints: 0,
    maxPoints: 500,
    color: '#CD7F32',
    bgGradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    icon: '🥉',
  },
  silver: {
    tier: 'silver',
    name: 'Silver',
    nameCn: '白银',
    minPoints: 500,
    maxPoints: 1200,
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
    icon: '🥈',
  },
  gold: {
    tier: 'gold',
    name: 'Gold',
    nameCn: '黄金',
    minPoints: 1200,
    maxPoints: 2500,
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    icon: '🥇',
  },
  platinum: {
    tier: 'platinum',
    name: 'Platinum',
    nameCn: '铂金',
    minPoints: 2500,
    maxPoints: 4500,
    color: '#E5E4E2',
    bgGradient: 'linear-gradient(135deg, #E5E4E2 0%, #A0B2C6 100%)',
    icon: '💎',
  },
  diamond: {
    tier: 'diamond',
    name: 'Diamond',
    nameCn: '钻石',
    minPoints: 4500,
    maxPoints: 8000,
    color: '#B9F2FF',
    bgGradient: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 100%)',
    icon: '🔹',
  },
  master: {
    tier: 'master',
    name: 'Master',
    nameCn: '大师',
    minPoints: 8000,
    maxPoints: 13000,
    color: '#9B59B6',
    bgGradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
    icon: '⭐',
  },
  grandmaster: {
    tier: 'grandmaster',
    name: 'Grandmaster',
    nameCn: '宗师',
    minPoints: 13000,
    maxPoints: 20000,
    color: '#E74C3C',
    bgGradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    icon: '🔥',
  },
  challenger: {
    tier: 'challenger',
    name: 'Challenger',
    nameCn: '王者',
    minPoints: 20000,
    maxPoints: 35000,
    color: '#8A2BE2',
    bgGradient: 'linear-gradient(135deg, #8A2BE2 0%, #4B0082 100%)',
    icon: '👑',
  },
  king: {
    tier: 'king',
    name: 'King',
    nameCn: '荣耀王者',
    minPoints: 35000,
    maxPoints: 55000,
    color: '#FF6B6B',
    bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF1493 100%)',
    icon: '🏆',
  },
  supreme: {
    tier: 'supreme',
    name: 'Supreme',
    nameCn: '最强王者',
    minPoints: 55000,
    maxPoints: Infinity,
    color: '#FF4500',
    bgGradient: 'linear-gradient(135deg, #FF4500 0%, #FFD700 50%, #FF6B6B 100%)',
    icon: '🌟',
  },
};

export const RANK_ORDER: RankTier[] = [
  'bronze', 'silver', 'gold', 'platinum', 
  'diamond', 'master', 'grandmaster', 
  'challenger', 'king', 'supreme'
];

export function getRankByPoints(points: number): RankInfo {
  for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
    const rank = RANKS[RANK_ORDER[i]];
    if (points >= rank.minPoints) {
      return rank;
    }
  }
  return RANKS.bronze;
}

export function getNextRank(currentTier: RankTier): RankInfo | null {
  const currentIndex = RANK_ORDER.indexOf(currentTier);
  if (currentIndex >= RANK_ORDER.length - 1) return null;
  return RANKS[RANK_ORDER[currentIndex + 1]];
}

export function getProgressToNextRank(points: number, currentRank: RankInfo, nextRank: RankInfo | null): number {
  if (!nextRank) return 100;
  const range = nextRank.minPoints - currentRank.minPoints;
  const progress = points - currentRank.minPoints;
  return Math.min(100, Math.max(0, (progress / range) * 100));
}