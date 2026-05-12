import { useEffect, useState } from 'react';
import { showToast } from './Toast';

interface Milestone {
  type: string;
  title: string;
  description: string;
  value: number;
  threshold: number;
  achieved: boolean;
  achievedAt?: string;
}

export function useMilestones(totalPoints: number, totalPosts: number, totalCheckIns: number, streak: number) {
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    const milestones: Milestone[] = [
      { type: 'points', title: '积分里程碑', description: '累计获得100分', value: totalPoints, threshold: 100, achieved: totalPoints >= 100 },
      { type: 'points', title: '积分里程碑', description: '累计获得500分', value: totalPoints, threshold: 500, achieved: totalPoints >= 500 },
      { type: 'points', title: '积分里程碑', description: '累计获得1000分', value: totalPoints, threshold: 1000, achieved: totalPoints >= 1000 },
      { type: 'posts', title: '创作里程碑', description: '发表10篇文章', value: totalPosts, threshold: 10, achieved: totalPosts >= 10 },
      { type: 'posts', title: '创作里程碑', description: '发表50篇文章', value: totalPosts, threshold: 50, achieved: totalPosts >= 50 },
      { type: 'checkins', title: '打卡里程碑', description: '累计100次打卡', value: totalCheckIns, threshold: 100, achieved: totalCheckIns >= 100 },
      { type: 'streak', title: '连续打卡', description: '连续50天打卡', value: streak, threshold: 50, achieved: streak >= 50 },
    ];

    for (const m of milestones) {
      if (m.achieved && !notified.has(m.description)) {
        setNotified(prev => new Set([...prev, m.description]));
        showToast({
          type: 'achievement',
          title: `🎉 ${m.title}`,
          message: m.description,
          duration: 6000,
        });
      }
    }
  }, [totalPoints, totalPosts, totalCheckIns, streak]);
}
