import { useState, useCallback, useEffect, useRef } from 'react';
import { notificationApi } from '../lib/api';
import { notificationBus } from '../lib/notificationBus';

export interface Notification {
  id: string;
  type: 'checkin' | 'achievement' | 'rank' | 'reminder' | 'system' | 'goal_complete';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

const TYPE_ICONS: Record<string, string> = {
  checkin: '✅', achievement: '🏆', rank: '⬆️', reminder: '🔔', system: '⚙️',
  goal_complete: '🎯', follow: '👤', milestone: '🌟',
};

export function useNotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [popupToast, setPopupToast] = useState<Notification | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const serverNotifs = await notificationApi.getAll();
      if (serverNotifs && serverNotifs.length > 0) {
        setNotifications(serverNotifs.map((n: any) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          read: n.isRead || false,
          icon: TYPE_ICONS[n.type] || '📌',
        })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  useEffect(() => {
    const unsub = notificationBus.subscribe((payload) => {
      const notif: Notification = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: payload.type as Notification['type'],
        title: payload.title,
        message: payload.message,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        icon: payload.icon || TYPE_ICONS[payload.type] || '📌',
      };
      setNotifications(prev => [notif, ...prev].slice(0, 100));

      setPopupToast(notif);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
      popupTimerRef.current = setTimeout(() => setPopupToast(null), 4000);
    });
    return () => {
      unsub();
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const addNotification = useCallback((type: Notification['type'], title: string, message: string, icon: string) => {
    notificationBus.push(type, title, message, icon);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notificationApi.markRead(id); } catch { /* ignore */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await notificationApi.markRead(); } catch { /* ignore */ }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, showPanel, setShowPanel, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll, popupToast };
}

export function NotificationCenter({ 
  notifications, 
  showPanel, 
  setShowPanel, 
  unreadCount, 
  markAsRead, 
  markAllAsRead, 
  clearAll,
  popupToast,
}: ReturnType<typeof useNotificationCenter>) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            background: '#ff4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            boxShadow: '0 2px 8px rgba(255,68,68,0.4)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowPanel(false)} />
          <div
            style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '360px',
              maxHeight: '480px',
              background: 'rgba(15,15,30,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,240,255,0.12)',
              borderRadius: '16px',
              zIndex: 999,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.06)',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>🔔 通知中心</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={markAllAsRead} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(0,240,255,0.06)', color: '#00f0ff', cursor: 'pointer' }}>
                  全部已读
                </button>
                <button onClick={clearAll} style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.2)', background: 'rgba(255,68,68,0.05)', color: '#ff6b6b', cursor: 'pointer' }}>
                  清空
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                  <div style={{ fontSize: '13px' }}>暂无通知</div>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '14px 16px',
                      margin: '4px 8px',
                      borderRadius: '12px',
                      background: notif.read ? 'transparent' : 'rgba(0,240,255,0.04)',
                      border: '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(0,240,255,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(0,240,255,0.04)')}
                  >
                    <span style={{ fontSize: '22px', flexShrink: 0 }}>{notif.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', marginBottom: '3px' }}>
                        {notif.title}
                        {!notif.read && (
                          <span style={{
                            display: 'inline-block',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#00f0ff',
                            marginLeft: '6px',
                          }} />
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{notif.message}</div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{notif.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      {popupToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 10000,
          padding: '14px 20px',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(var(--blur-lg))',
          WebkitBackdropFilter: 'blur(var(--blur-lg))',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--accent)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'goalCardEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1) both',
          minWidth: '300px',
          maxWidth: '420px',
          pointerEvents: 'auto',
        }}>
          <span style={{ fontSize: '28px', flexShrink: 0 }}>{popupToast.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', fontFamily: "'Courier New', monospace" }}>
              {popupToast.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{popupToast.message}</div>
          </div>
          <button
            onClick={() => markAsRead(popupToast.id)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
              whiteSpace: 'nowrap',
            }}
          >
            知道了
          </button>
        </div>
      )}
    </div>
  );
}
