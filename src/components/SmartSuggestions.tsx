﻿import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkInApi, userApi } from '../lib/api';

export function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState<{ type: string; icon: string; color: string; text: string; action: { label: string; path: string } }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const items: typeof suggestions = [];

      try {
        const weekly = await checkInApi.getWeekly();
        const totalCount = weekly.reduce((s, d) => s + d.count, 0);

        if (totalCount < 3) {
          items.push({
            type: 'checkin', icon: '⚠️', color: '#ffd93d',
            text: '本周打卡较少，试试设定每日提醒？',
            action: { label: '去打卡', path: '/checkin' },
          });
        } else if (totalCount >= 5) {
          items.push({
            type: 'positive', icon: '🔥', color: 'var(--matrix-green)',
            text: `本周打卡 ${totalCount} 次，势头很好！写篇周记分享吧`,
            action: { label: '写博客', path: '/blog/new' },
          });
        }
      } catch { /* ignore */ }

      try {
        const goals = await userApi.getActiveGoals();
        const nearGoal = goals.find((g: any) => g.targetValue - g.currentValue <= 3 && g.targetValue > 0);
        if (nearGoal) {
          items.push({
            type: 'goal', icon: '🎯', color: '#00f0ff',
            text: `目标「${nearGoal.title}」即将完成，再加把劲！`,
            action: { label: '查看目标', path: '/goals' },
          });
        }
        const stalled = goals.find((g: any) => {
          const days = g.startDate ? Math.floor((Date.now() - new Date(g.startDate).getTime()) / 86400000) : 0;
          return days > 14 && g.currentValue < g.targetValue * 0.3;
        });
        if (stalled) {
          items.push({
            type: 'stalled', icon: '💤', color: '#ff6b6b',
            text: `目标「${stalled.title}」进展缓慢，需要调整计划吗？`,
            action: { label: '调整目标', path: '/goals' },
          });
        }
      } catch { /* ignore */ }

      try {
        const stats = await checkInApi.getStats();
        if (stats.streak < 3) {
          items.push({
            type: 'streak', icon: '🚀', color: '#aa00ff',
            text: '连续打卡可以养成习惯，坚持就会看到变化！',
            action: { label: '开始打卡', path: '/checkin' },
          });
        }
      } catch { /* ignore */ }

      setSuggestions(items.slice(0, 4));
    })();
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <div style={{
      border: '1px solid var(--matrix-green-dim)', borderRadius: '8px',
      background: 'rgba(10,10,16,0.88)', backdropFilter: 'blur(12px)',
      padding: '18px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ width: '4px', height: '18px', background: 'var(--matrix-green)', borderRadius: '2px', boxShadow: '0 0 10px var(--matrix-green)' }} />
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--matrix-green)', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>🤖 智能建议</span>
      </div>
      {suggestions.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
          borderRadius: '6px', background: `${s.color}08`, border: `1px solid ${s.color}14`,
          marginBottom: i < suggestions.length - 1 ? '6px' : '0',
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{s.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Courier New', monospace", lineHeight: 1.3 }}>{s.text}</div>
          </div>
          <button onClick={() => navigate(s.action.path)}
            style={{
              padding: '3px 10px', borderRadius: '6px', border: `1px solid ${s.color}33`,
              background: `${s.color}11`, color: s.color, fontSize: '9px', cursor: 'pointer',
              fontFamily: "'Courier New', monospace", fontWeight: '600', flexShrink: 0,
            }}>{s.action.label}</button>
        </div>
      ))}
    </div>
  );
}
