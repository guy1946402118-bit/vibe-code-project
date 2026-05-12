import { useEffect } from 'react';

export function PushRegistration() {
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await navigator.serviceWorker.ready;

          // 每日打卡提醒（每晚20:00）
          const scheduleDaily = async () => {
            const now = new Date();
            const target = new Date();
            target.setHours(20, 0, 0, 0);
            if (now > target) target.setDate(target.getDate() + 1);
            const msUntilTarget = target.getTime() - now.getTime();

            setTimeout(() => {
              if (Notification.permission === 'granted') {
                new Notification('📝 今日打卡提醒', {
                  body: '别忘了记录今天的学习收获哦！',
                  icon: '/icon-192x192.png',
                  tag: 'daily-checkin',
                });
              }
              scheduleDaily();
            }, msUntilTarget);
          };

          scheduleDaily();
        }
      } catch { /* push not available */ }
    };

    register();
  }, []);

  return null;
}

// 发送即时通知
export function sendInstantNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192x192.png', tag: 'instant' });
  }
}
