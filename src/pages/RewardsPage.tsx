﻿﻿﻿﻿﻿import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Confetti } from '../components/Confetti';
import { rewardApi, checkInApi } from '../lib/api';
import { RewardsShop } from '../components/RewardsShop';

interface RewardItem {
  id: string;
  name: string;
  pointsCost: number;
  redeemed: boolean;
  userId: string;
  createdAt: string;
}

const USE_API = true;

export function RewardsPage() {
  const { currentUser } = useUserStore();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'shop'>('rewards');

  useEffect(() => {
    if (currentUser) {
      loadRewards();
      loadPoints();
    }
  }, [currentUser]);

  const loadRewards = async () => {
    if (!currentUser) return;
    if (USE_API) {
      try {
        const data = await rewardApi.getAll();
        setRewards(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch { /* ignore */ }
    }
  };

  const loadPoints = async () => {
    if (!currentUser || !USE_API) return;
    try {
      const stats = await checkInApi.getStats();
      setTotalPoints(stats.totalPoints);
    } catch { /* ignore */ }
  };

  const handleAdd = async () => {
    if (!currentUser || !name.trim() || !cost) return;
    setLoading(true);
    try {
      await rewardApi.create(name.trim(), parseInt(cost));
      setName(''); setCost(''); setShowForm(false);
      loadRewards();
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(err.message || '添加失败');
    }
    setLoading(false);
  };

  const handleRedeem = async (reward: RewardItem) => {
    if (!currentUser || totalPoints < reward.pointsCost) return;
    try {
      await rewardApi.redeem(reward.id);
      loadRewards();
      loadPoints();
      setShowConfetti(true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      alert(err.message || '兑换失败');
    }
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div
        style={{ background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.2) 0%, rgba(240, 147, 251, 0.15) 100%)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(245, 87, 108, 0.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: '120px', height: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>可用积分</div>
          <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#fff' }}><AnimatedNumber value={totalPoints} /></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('rewards')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'rewards' ? '#ff3366' : 'var(--border-medium)'}`,
            background: activeTab === 'rewards' ? 'rgba(255,51,102,0.12)' : 'transparent',
            color: activeTab === 'rewards' ? '#ff3366' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.15s',
          }}
        >
          🎁 我的奖励
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'shop' ? 'var(--matrix-green)' : 'var(--border-medium)'}`,
            background: activeTab === 'shop' ? 'var(--matrix-green-dim)' : 'transparent',
            color: activeTab === 'shop' ? 'var(--matrix-green)' : 'var(--text-secondary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            transition: 'all 0.15s',
          }}
        >
          🛒 商城
        </button>
      </div>

      {activeTab === 'shop' ? (
        <RewardsShop />
      ) : (
      <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>🎁 奖励池</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: showForm ? 'rgba(255,255,255,0.1)' : '#ff00aa', color: showForm ? 'rgba(255,255,255,0.6)' : '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          {showForm ? '取消' : '✚ 添加奖励'}
        </button>
      </div>

      
        {showForm && (
          <div
            className="glass-card" style={{ padding: '18px', marginBottom: '18px' }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="奖励名称" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box' }} />
            <input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="所需积分" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box' }} />
            <button onClick={handleAdd} disabled={loading || !name.trim() || !cost}
              style={{ padding: '12px', borderRadius: '10px', border: 'none', background: name.trim() && cost ? '#ff00aa' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: name.trim() && cost ? 'pointer' : 'not-allowed', width: '100%' }}>
              {loading ? '添加中...' : '添加奖励'}
            </button>
          </div>
        )}
      

      {rewards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎁</div>
          暂无奖励，添加第一个目标吧
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rewards.map((reward) => (
            <div key={reward.id}
              className="glass-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: reward.redeemed ? 0.5 : 1 }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>{reward.name}</div>
                <div style={{ fontSize: '13px', color: '#ff00aa', marginTop: '4px' }}>{reward.pointsCost} 积分</div>
              </div>
              {reward.redeemed ? (
                <span style={{ fontSize: '13px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>已兑换</span>
              ) : (
                <button onClick={() => handleRedeem(reward)}
                  style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: totalPoints >= reward.pointsCost ? '#00ff88' : 'rgba(255,255,255,0.1)', color: totalPoints >= reward.pointsCost ? '#000' : 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: '600', cursor: totalPoints >= reward.pointsCost ? 'pointer' : 'not-allowed' }}>
                  {totalPoints >= reward.pointsCost ? '兑换' : '积分不足'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}