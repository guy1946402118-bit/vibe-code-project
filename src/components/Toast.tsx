import { useEffect, useState } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

let toastId = 0;
const listeners: Set<(toasts: ToastItem[]) => void> = new Set();
let toasts: ToastItem[] = [];

function notify() {
  listeners.forEach(fn => fn([...toasts]));
}

export function showToast(item: Omit<ToastItem, 'id'>) {
  const id = `toast-${++toastId}`;
  toasts = [...toasts, { ...item, id }];
  notify();
  const duration = item.duration ?? 4000;
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration);
  }
  return id;
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>(toasts);

  useEffect(() => {
    listeners.add(setItems);
    return () => { listeners.delete(setItems); };
  }, []);

  return items;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; titleColor: string }> = {
  success: { bg: 'rgba(0,255,136,0.08)', border: '#00ff88', icon: '✅', titleColor: '#00ff88' },
  info: { bg: 'rgba(0,240,255,0.08)', border: '#00f0ff', icon: 'ℹ️', titleColor: '#00f0ff' },
  warning: { bg: 'rgba(255,215,0,0.08)', border: '#ffd93d', icon: '⚠️', titleColor: '#ffd93d' },
  achievement: { bg: 'rgba(170,0,255,0.08)', border: '#aa00ff', icon: '🏆', titleColor: '#aa00ff' },
};

export function ToastContainer() {
  const items = useToasts();

  if (items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
      display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px',
    }}>
      {items.map(item => {
        const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
        return (
          <div key={item.id} style={{
            background: `linear-gradient(135deg, ${style.bg}, rgba(10,10,20,0.95))`,
            border: `1.5px solid ${style.border}44`,
            borderRadius: '10px', padding: '14px 16px',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 16px ${style.border}15`,
            animation: 'toastSlideIn 0.35s cubic-bezier(0.21, 1.02, 0.73, 1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{style.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: style.titleColor, fontFamily: "'Courier New', monospace", marginBottom: '3px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Courier New', monospace", lineHeight: 1.4 }}>
                  {item.message}
                </div>
                {item.action && (
                  <button onClick={() => { item.action!.onClick(); dismissToast(item.id); }}
                    style={{
                      marginTop: '8px', padding: '4px 12px', borderRadius: '6px',
                      border: `1px solid ${style.border}44`, background: `${style.border}11`,
                      color: style.titleColor, fontSize: '10px', cursor: 'pointer',
                      fontFamily: "'Courier New', monospace",
                    }}>{item.action.label}</button>
                )}
              </div>
              <button onClick={() => dismissToast(item.id)}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: '14px', padding: '0 2px', lineHeight: 1,
                }}>×</button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
