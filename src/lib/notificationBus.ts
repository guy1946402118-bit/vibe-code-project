type NotificationType = 'checkin' | 'achievement' | 'rank' | 'reminder' | 'system' | 'goal_complete' | 'follow' | 'milestone';

interface PushPayload {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
}

const ICONS: Record<string, string> = {
  checkin: '\u2705', achievement: '\ud83c\udfc6', rank: '\u2b06\ufe0f', reminder: '\ud83d\udd14', system: '\u2699\ufe0f',
  goal_complete: '\ud83c\udfaf', follow: '\ud83d\udc64', milestone: '\ud83c\udf1f',
};

type Listener = (payload: PushPayload) => void;
const listeners: Listener[] = [];

export const notificationBus = {
  push(type: NotificationType, title: string, message: string, icon?: string) {
    const payload: PushPayload = {
      type,
      title,
      message,
      icon: icon || ICONS[type] || '\ud83d\udccc',
    };
    listeners.forEach(fn => fn(payload));
  },

  subscribe(fn: Listener) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
};