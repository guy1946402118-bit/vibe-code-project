export interface ReportData {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  summary: {
    totalCheckIns: number;
    totalPoints: number;
    averagePerDay: number;
    bestDay: string;
    worstDay: string;
    streak: number;
    topCategory: string;
  };
  dailyBreakdown: Array<{
    date: string;
    dayName: string;
    checkIns: number;
    points: number;
    categories: Record<string, number>;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
    points: number;
  }>;
  achievements: Array<{
    name: string;
    description: string;
    earnedDate: string;
  }>;
  goalsProgress: Array<{
    title: string;
    progress: number;
    target: number;
    status: 'completed' | 'in-progress' | 'not-started';
  }>;
}

export function generateWeeklyReport(): ReportData {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const categories = ['HEALTH', 'STUDY', 'WORK', 'FITNESS', 'DISCIPLINE'];

  const dailyBreakdown = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const checkIns = Math.floor(Math.random() * 5) + (i === 6 ? 2 : 0);
    const points = checkIns * (Math.floor(Math.random() * 10) + 5);

    const categoryCounts: Record<string, number> = {};
    categories.forEach(cat => {
      categoryCounts[cat] = Math.floor(Math.random() * Math.max(1, checkIns));
    });

    return {
      date: date.toISOString().split('T')[0],
      dayName: dayNames[i],
      checkIns,
      points,
      categories: categoryCounts,
    };
  });

  const totalCheckIns = dailyBreakdown.reduce((sum, d) => sum + d.checkIns, 0);
  const totalPoints = dailyBreakdown.reduce((sum, d) => sum + d.points, 0);
  const averagePerDay = Math.round(totalCheckIns / 7 * 10) / 10;

  const bestDay = dailyBreakdown.reduce((max, d) => d.checkIns > max.checkIns ? d : max, dailyBreakdown[0]);
  const worstDay = dailyBreakdown.reduce((min, d) => d.checkIns < min.checkIns ? d : min, dailyBreakdown[0]);

  const categoryTotals: Record<string, { count: number; points: number }> = {};
  categories.forEach(cat => {
    categoryTotals[cat] = { count: 0, points: 0 };
  });

  dailyBreakdown.forEach(day => {
    Object.entries(day.categories).forEach(([cat, count]) => {
      if (categoryTotals[cat]) {
        categoryTotals[cat].count += count;
        categoryTotals[cat].points += count * 8;
      }
    });
  });

  const categoryStats = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      count: data.count,
      percentage: Math.round((data.count / totalCheckIns) * 100),
      points: data.points,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    period: 'week',
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    summary: {
      totalCheckIns,
      totalPoints,
      averagePerDay,
      bestDay: `${bestDay.dayName}（${bestDay.checkIns} 次打卡）`,
      worstDay: `${worstDay.dayName}（${worstDay.checkIns} 次打卡）`,
      streak: Math.floor(Math.random() * 14) + 3,
      topCategory: categoryStats[0]?.category || '无',
    },
    dailyBreakdown,
    categoryStats,
    achievements: [
      { name: '🔥 一周战士', description: '连续7天每天完成5次以上打卡', earnedDate: today.toISOString().split('T')[0] },
      { name: '⭐ 分类大师', description: `在「${categoryStats[0]?.category || '未分类'}」表现出色`, earnedDate: today.toISOString().split('T')[0] },
    ],
    goalsProgress: [
      { title: '阅读50页', progress: 35, target: 50, status: 'in-progress' as const },
      { title: '运动5次', progress: 4, target: 5, status: 'in-progress' as const },
      { title: '每日冥想', progress: 6, target: 7, status: 'in-progress' as const },
      { title: '学习新技能', progress: 1, target: 1, status: 'completed' as const },
    ],
  };
}

export function generateMonthlyReport(): ReportData {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const dailyBreakdown = Array.from({ length: Math.min(daysInMonth, today.getDate()) }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const checkIns = Math.floor(Math.random() * 4) + (Math.random() > 0.3 ? 1 : 0);
    const points = checkIns * (Math.floor(Math.random() * 10) + 5);

    const categoryCounts: Record<string, number> = {};
    ['HEALTH', 'STUDY', 'WORK', 'FITNESS', 'DISCIPLINE'].forEach(cat => {
      categoryCounts[cat] = Math.floor(Math.random() * Math.max(1, checkIns));
    });

    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      checkIns,
      points,
      categories: categoryCounts,
    };
  });

  const totalCheckIns = dailyBreakdown.reduce((sum, d) => sum + d.checkIns, 0);
  const totalPoints = dailyBreakdown.reduce((sum, d) => sum + d.points, 0);
  const averagePerDay = Math.round(totalCheckIns / dailyBreakdown.length * 10) / 10;

  const bestDay = dailyBreakdown.reduce((max, d) => d.checkIns > max.checkIns ? d : max, dailyBreakdown[0]);
  const worstDay = dailyBreakdown.reduce((min, d) => d.checkIns < min.checkIns ? d : min, dailyBreakdown[0]);

  const categoryTotals: Record<string, { count: number; points: number }> = {};
  ['HEALTH', 'STUDY', 'WORK', 'FITNESS', 'DISCIPLINE'].forEach(cat => {
    categoryTotals[cat] = { count: 0, points: 0 };
  });

  dailyBreakdown.forEach(day => {
    Object.entries(day.categories).forEach(([cat, count]) => {
      if (categoryTotals[cat]) {
        categoryTotals[cat].count += count;
        categoryTotals[cat].points += count * 8;
      }
    });
  });

  const categoryStats = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      count: data.count,
      percentage: Math.round((data.count / totalCheckIns) * 100),
      points: data.points,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    period: 'month',
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    summary: {
      totalCheckIns,
      totalPoints,
      averagePerDay,
      bestDay: `${bestDay.date}（${bestDay.checkIns} 次打卡）`,
      worstDay: `${worstDay.date}（${worstDay.checkIns} 次打卡）`,
      streak: Math.floor(Math.random() * 21) + 5,
      topCategory: categoryStats[0]?.category || '无',
    },
    dailyBreakdown,
    categoryStats,
    achievements: [
      { name: '🏆 月度冠军', description: '整月保持稳定增长', earnedDate: today.toISOString().split('T')[0] },
      { name: ' 自律大师', description: '日常习惯完成 25 次以上', earnedDate: today.toISOString().split('T')[0] },
      { name: '📚 求知者', description: '累计学习积分 500+', earnedDate: today.toISOString().split('T')[0] },
    ],
    goalsProgress: [
      { title: '完成在线课程', progress: 75, target: 100, status: 'in-progress' as const },
      { title: '累计跑步50公里', progress: 42, target: 50, status: 'in-progress' as const },
      { title: '阅读2本书', progress: 1, target: 2, status: 'in-progress' as const },
      { title: '冥想20天', progress: 18, target: 20, status: 'in-progress' as const },
      { title: '学习Python基础', progress: 100, target: 100, status: 'completed' as const },
    ],
  };
}

export function getReportSummary(report: ReportData): string {
  const { summary, period } = report;

  return `
📊 ${period === 'week' ? '每周' : '每月'}成长报告
${'='.repeat(40)}

📅 周期: ${report.startDate} → ${report.endDate}
✅ 总打卡次数: ${summary.totalCheckIns}
💰 总积分: ${summary.totalPoints}
📈 日均打卡: ${summary.averagePerDay} 次/天
🔥 当前连续: ${summary.streak} 天
🏆 最佳分类: ${summary.topCategory}
⭐ 最佳日期: ${summary.bestDay}
📉 最低日期: ${summary.worstDay}

继续保持出色表现！🚀
  `.trim();
}

export default { generateWeeklyReport, generateMonthlyReport, getReportSummary };
