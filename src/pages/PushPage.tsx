import { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useCheckInStore } from '../stores/checkInStore';
import { generateDailySummary, sendWebPush, sendToWechat, DEFAULT_PUSH_CONFIG, type PushConfig, type DailySummary } from '../lib/push';
import { getRankByPoints } from '../lib/ranks';
import { noteApi, checkInApi } from '../lib/api';
import { Confetti } from '../components/Confetti';

function loadSettings(userId: string): PushConfig {
  try {
    const saved = localStorage.getItem(`push_${userId}`);
    return saved ? JSON.parse(saved) : DEFAULT_PUSH_CONFIG;
  } catch { return DEFAULT_PUSH_CONFIG; }
}

function saveSettings(userId: string, config: PushConfig) {
  localStorage.setItem(`push_${userId}`, JSON.stringify(config));
}

export function PushPage() {
  const { currentUser } = useUserStore();
  const { todayCheckIns, loadTodayCheckIns, getTotalPoints } = useCheckInStore();
  const [config, setConfig] = useState<PushConfig>(DEFAULT_PUSH_CONFIG);
  const [totalPoints, setTotalPoints] = useState(0);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<DailySummary | null>(null);
  const [sendStatus, setSendStatus] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    loadTodayCheckIns();
    getTotalPoints().then(setTotalPoints);
    setConfig(loadSettings(currentUser.id));
  }, [currentUser]);

  const update = (updates: Partial<PushConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!currentUser) return;
    saveSettings(currentUser.id, config);
    setSaved(true);
  };

  const handlePreview = async () => {
    if (!currentUser) return;
    let notesToday = 0;
    let streak = 0;
    try {
      const notes = await noteApi.getAll();
      const today = new Date().toDateString();
      notesToday = notes.filter(n => new Date(n.createdAt).toDateString() === today).length;
      const stats = await checkInApi.getStats();
      streak = stats.streak;
    } catch { /* ignore */ }
    const summary = generateDailySummary({
      todayCheckIns: todayCheckIns.map(c => ({ category: c.category, points: c.points })),
      totalPoints, streak,
      rankName: getRankByPoints(totalPoints).nameCn,
      notesToday,
    });
    setPreview(summary);
  };

  const handleSend = async () => {
    if (!preview) return;
    setSendStatus('发送中...');
    let result = { success: false, message: '' };
    switch (config.pushType) {
      case 'webpush': result = await sendWebPush(config, preview); break;
      case 'wechat': result = config.wechatWebhook ? await sendToWechat(config.wechatWebhook, preview) : { success: false, message: '请配置 Webhook' }; break;
      case 'email': result = { success: false, message: '邮件需后端支持' }; break;
      case 'sms': result = { success: false, message: '短信需后端支持' }; break;
    }
    setSendStatus(result.message);
    if (result.success) setShowConfetti(true);
    setTimeout(() => setSendStatus(''), 3000);
  };

  const channels = [
    { key: 'webpush', label: '🔔 浏览器通知', desc: '无需配置' },
    { key: 'wechat', label: '💬 微信/企业微信', desc: '需Webhook' },
    { key: 'email', label: '📧 邮箱', desc: '需SMTP' },
    { key: 'sms', label: '📱 短信', desc: '需短信服务' },
  ];

  return (
    <div style={{ padding: '0 0 40px' }}>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>📤 每日推送</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>设置成长总结推送渠道</p>
      </div>

      <div className="glass-card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>启用推送</span>
          <button onClick={() => update({ enabled: !config.enabled })} style={{ width: '48px', height: '26px', borderRadius: '13px', background: config.enabled ? '#00f0ff' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', position: 'relative' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: config.enabled ? '#000' : '#fff', position: 'absolute', top: '2px', left: config.enabled ? '24px' : '2px', transition: 'left 0.2s' }} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>渠道</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {channels.map(c => (
              <div key={c.key} onClick={() => update({ pushType: c.key as any })}
                style={{ padding: '12px', borderRadius: '10px', border: `2px solid ${config.pushType === c.key ? '#00f0ff' : 'rgba(255,255,255,0.08)'}`, background: config.pushType === c.key ? 'rgba(0,240,255,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: config.pushType === c.key ? '#00f0ff' : '#fff' }}>{c.label}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {config.pushType === 'wechat' && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>Webhook</div>
            <input value={config.wechatWebhook || ''} onChange={e => update({ wechatWebhook: e.target.value })} placeholder="https://qyapi.weixin.qq.com/..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>推送内容</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(config.summaryTypes).map(([key, val]) => (
              <span key={key} onClick={() => update({ summaryTypes: { ...config.summaryTypes, [key]: !val } })}
                style={{ padding: '6px 12px', borderRadius: '16px', fontSize: '12px', background: val ? '#00f0ff' : 'rgba(255,255,255,0.08)', color: val ? '#000' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                {key === 'checkin' ? '✅' : key === 'points' ? '📊' : key === 'streak' ? '🔥' : key === 'rank' ? '🏆' : '📝'}
                {key === 'checkin' ? '打卡' : key === 'points' ? '积分' : key === 'streak' ? '天数' : key === 'rank' ? '段位' : '笔记'}
              </span>
            ))}
          </div>
        </div>

        <button onClick={handleSave} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: saved ? '#00ff88' : '#00f0ff', color: '#000', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          {saved ? '✓ 已保存' : '保存配置'}
        </button>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '14px' }}>📨 测试发送</div>
        <button onClick={handlePreview} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.3)', background: 'transparent', color: '#00f0ff', fontSize: '13px', cursor: 'pointer', marginBottom: '10px' }}>
          👁️ 预览消息
        </button>
        {preview && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px', marginBottom: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {preview.message}
          </div>
        )}
        <button onClick={handleSend} disabled={!config.enabled} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: config.enabled ? '#ff00aa' : 'rgba(255,255,255,0.08)', color: config.enabled ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: '600', cursor: config.enabled ? 'pointer' : 'not-allowed' }}>
          🚀 立即发送
        </button>
        {sendStatus && <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '13px', color: '#00f0ff' }}>{sendStatus}</div>}
      </div>
    </div>
  );
}