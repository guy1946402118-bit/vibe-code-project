﻿import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter, useNotificationCenter } from './NotificationCenter';

interface LayoutProps {
  children: ReactNode;
  currentUser?: any;
}

type NavItem = {
  path: string;
  label: string;
  icon: string;
  requireLogin?: boolean;
};

const PRIVATE_NAV: NavItem[] = [
  { path: '/', label: '首页', icon: '🏠', requireLogin: true },
  { path: '/blog', label: '博客', icon: '📝', requireLogin: false },
  { path: '/training', label: '训练', icon: '🧠', requireLogin: true },
  { path: '/learning', label: '学习方法', icon: '📖', requireLogin: true },
  { path: '/notes', label: '知识库', icon: '📚', requireLogin: true },
  { path: '/checkin', label: '打卡', icon: '✅', requireLogin: true },
  { path: '/goals', label: '目标', icon: '🎯', requireLogin: true },
  { path: '/achievements', label: '成就', icon: '🏆', requireLogin: true },
  { path: '/heatmap', label: '热力图', icon: '📊', requireLogin: true },
  { path: '/lifeflower', label: '生命之花', icon: '🌸', requireLogin: true },
  { path: '/review', label: '复盘', icon: '📊', requireLogin: true },
  { path: '/leaderboard', label: '排行榜', icon: '🥇', requireLogin: true },
  { path: '/skills', label: '技能仓库', icon: '📦', requireLogin: true },
  { path: '/rewards', label: '奖池', icon: '🎁', requireLogin: true },
  { path: '/push', label: '推送', icon: '📨', requireLogin: true },
  { path: '/settings', label: '设置', icon: '🎛️', requireLogin: true },
];

const ADMIN_NAV: NavItem[] = [
  { path: '/cms', label: '管理', icon: '👑', requireLogin: true },
];

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handle = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  return size;
}

function DesktopSidebar({ navItems, onNavigate, collapsed, onToggle }: { 
  navItems: NavItem[]; 
  onNavigate: (path: string) => void; 
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { currentUser, logout, isAdmin } = useUserStore();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  
  const handleLogout = () => {
    logout();
  };

  const saveProfile = async () => {
    try {
      const { userApi } = await import('../lib/api');
      const res = await userApi.updateProfile({ avatar });
      const { useUserStore: store } = await import('../stores/userStore');
      store.getState().updateUser(res.id, res);
      setMsg('头像已更新'); setTimeout(() => setMsg(''), 2000);
    } catch { setErr('更新失败'); setTimeout(() => setErr(''), 2000); }
  };

  const changePassword = async () => {
    if (!password || password !== confirmPwd) { setErr('两次密码不一致'); setTimeout(() => setErr(''), 2000); return; }
    if (password.length < 6) { setErr('密码至少6位'); setTimeout(() => setErr(''), 2000); return; }
    try {
      const { userApi } = await import('../lib/api');
      await userApi.updateProfile({ password });
      setMsg('密码已修改'); setPassword(''); setConfirmPwd('');
      setTimeout(() => setMsg(''), 2000);
    } catch { setErr('修改失败'); setTimeout(() => setErr(''), 2000); }
  };

  const sidebarW = collapsed ? '64px' : '240px';

  return (
    <>
      <aside style={{
        width: sidebarW,
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--matrix-green-dim)',
        padding: collapsed ? '24px 8px' : '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 100,
        boxSizing: 'border-box',
        transition: 'width 0.25s ease, padding 0.25s ease',
      }}>
        <style>{`
          .nav-item { transition: all 0.15s ease; border-radius: 6px; }
          .nav-item:hover { background: var(--accent-dim); }
          .nav-item.active { background: linear-gradient(90deg, var(--matrix-green-dim) 0%, transparent 100%); border-left: 2px solid var(--matrix-green) !important; }
        `}</style>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: '20px', padding: '0 4px' }}>
          {!collapsed && (
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', background: 'linear-gradient(135deg, var(--matrix-green) 0%, #00ff88 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '2px', lineHeight: 1.2, fontFamily: "'Courier New', monospace" }}>GROWTH</h1>
              <div style={{ fontSize: '10px', color: '#555555', marginTop: '2px', fontFamily: "'Courier New', monospace", letterSpacing: '1px' }}>// SYSTEM v2.0</div>
            </div>
          )}
          <button
            onClick={onToggle}
            title="折叠侧边栏"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '8px' }}>
          {collapsed ? (
            navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={item.label}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '12px 0', 
                    borderRadius: '10px', 
                    color: isActive ? 'var(--matrix-green)' : 'rgba(255,255,255,0.65)', 
                    cursor: 'pointer', 
                    borderLeft: isActive ? '2px solid var(--matrix-green)' : '2px solid transparent', 
                    boxSizing: 'border-box',
                    fontSize: '20px',
                    minHeight: '48px',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{item.icon}</span>
                </div>
              );
            })
          ) : (
            <>
              <div style={{ fontSize: '11px', color: '#555555', padding: '8px 14px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
                ── 主页 ──
              </div>
              {navItems.filter(item => ['/', '/blog'].includes(item.path)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: isActive ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid var(--matrix-green)' : '2px solid transparent',
                      boxSizing: 'border-box',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>{item.label}</span>
                  </div>
                );
              })}

              <div style={{ fontSize: '11px', color: '#555555', padding: '12px 14px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
                ── 成长 ──
              </div>
              {navItems.filter(item => ['/goals', '/achievements', '/heatmap', '/lifeflower'].includes(item.path)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: isActive ? '#00ff88' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid #00ff88' : '2px solid transparent',
                      boxSizing: 'border-box',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>{item.label}</span>
                  </div>
                );
              })}

              <div style={{ fontSize: '11px', color: '#555555', padding: '12px 14px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
                ── 训练 ──
              </div>
              {navItems.filter(item => ['/training', '/learning', '/notes'].includes(item.path)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: isActive ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid var(--matrix-green)' : '2px solid transparent',
                      boxSizing: 'border-box',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>{item.label}</span>
                  </div>
                );
              })}

              <div style={{ fontSize: '11px', color: '#555555', padding: '12px 14px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
                ── 每日 ──
              </div>
              {navItems.filter(item => ['/checkin', '/review', '/leaderboard'].includes(item.path)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: isActive ? '#ffbd2e' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid #ffbd2e' : '2px solid transparent',
                      boxSizing: 'border-box',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>{item.label}</span>
                  </div>
                );
              })}

              <div style={{ fontSize: '11px', color: '#555555', padding: '12px 14px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
                ── 奖励 ──
              </div>
              {navItems.filter(item => ['/rewards', '/push'].includes(item.path)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      color: isActive ? '#ff3366' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid #ff3366' : '2px solid transparent',
                      boxSizing: 'border-box',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1, fontFamily: "'Courier New', monospace" }}>{item.label}</span>
                  </div>
                );
              })}

              <div style={{ fontSize: '11px', color: '#555555', padding: '12px 14px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: "'Courier New', monospace" }}>
                ── 系统 ──
              </div>
              {navItems.filter(item => ['/settings'].includes(item.path)).map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      color: isActive ? '#dda0dd' : 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      borderLeft: isActive ? '2px solid #dda0dd' : '2px solid transparent',
                      boxSizing: 'border-box',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1 }}>{item.label}</span>
                  </div>
                );
              })}

              {navItems.some(item => item.path === '/cms') && (
                <>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', padding: '12px 14px 4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚙️ 系统管理
                  </div>
                  {navItems.filter(item => ['/cms'].includes(item.path)).map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <div
                        key={item.path}
                        onClick={() => onNavigate(item.path)}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          color: isActive ? '#ff6b6b' : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          borderLeft: isActive ? '2px solid #ff6b6b' : '2px solid transparent',
                          boxSizing: 'border-box',
                          justifyContent: 'flex-start',
                        }}
                      >
                        <span style={{ fontSize: '17px', lineHeight: 1 }}>{item.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: isActive ? '500' : '400', lineHeight: 1 }}>{item.label}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </nav>

        <div style={{ 
          marginTop: 'auto',
          padding: collapsed ? '12px 4px' : '14px',
          borderTop: '1px solid var(--matrix-green-dim)',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px', 
          boxSizing: 'border-box',
          transition: 'padding 0.25s ease',
        }}>
          {currentUser ? (
            <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: collapsed ? '8px' : '10px' }}>
              <div onClick={() => !collapsed && setShowModal(!showModal)} style={{ width: collapsed ? '34px' : '36px', height: collapsed ? '34px' : '36px', borderRadius: '10px', background: currentUser?.avatar ? `url(${currentUser.avatar}) center/cover` : 'linear-gradient(135deg, var(--matrix-green) 0%, #00ff88 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: collapsed ? '14px' : '15px', fontWeight: 'bold', cursor: collapsed ? 'default' : 'pointer', flexShrink: 0 }}>
                {!currentUser?.avatar && (currentUser.name?.charAt(0).toUpperCase() || 'U')}
              </div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '10px', color: isAdmin ? 'var(--matrix-green)' : 'rgba(255,255,255,0.4)' }}>{isAdmin ? '⚡ 管理员' : '👤 用户'}</div>
                </div>
              )}
              {collapsed ? (
                <div title="退出登录" onClick={handleLogout} style={{ fontSize: '14px', cursor: 'pointer', opacity: 0.6 }}>🚪</div>
              ) : (
                <div onClick={handleLogout} style={{ fontSize: '11px', color: '#ff3333', cursor: 'pointer', textAlign: 'center', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(255,51,51,0.25)', background: 'rgba(255,51,51,0.08)', whiteSpace: 'nowrap', fontFamily: "'Courier New', monospace" }}>退出</div>
              )}
            </div>
          ) : (
            <div onClick={() => onNavigate('/login')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: collapsed ? '8px' : '10px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--accent-dim) 0%, rgba(0, 255, 136, 0.08) 100%)', border: '1px solid var(--matrix-green-dim)' }}>
              <div style={{ width: collapsed ? '30px' : '32px', height: collapsed ? '30px' : '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--matrix-green) 0%, #00ff88 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: collapsed ? '14px' : '15px', fontWeight: 'bold' }}>?</div>
              {!collapsed && (
                <div style={{ marginLeft: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#fff', fontWeight: '500', fontFamily: "'Courier New', monospace" }}>登录</div>
                  <div style={{ fontSize: '10px', color: '#555555', fontFamily: "'Courier New', monospace" }}>// 开始会话</div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {showModal && !collapsed && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: '60px', left: '260px', width: '360px', maxHeight: '75vh', overflowY: 'auto', background: 'rgba(10, 10, 10, 0.98)', borderRadius: '8px', border: '1px solid var(--matrix-green-dim)', padding: '24px', zIndex: 201, boxShadow: '0 0 40px var(--matrix-green-dim)' }}>
            <h3 style={{ color: 'var(--matrix-green)', fontSize: '15px', marginBottom: '18px', fontFamily: "'Courier New', monospace" }}>⚙ 用户配置</h3>
            
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#555555', display: 'block', marginBottom: '6px', fontFamily: "'Courier New', monospace" }}>🖼 头像地址</label>
              <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--matrix-green-dim)', background: 'rgba(0,0,0,0.5)', color: '#e8e8e8', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: "'Courier New', monospace" }} />
              <button onClick={saveProfile} style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--matrix-green)', background: 'var(--matrix-green-dim)', color: 'var(--matrix-green)', fontSize: '12px', cursor: 'pointer', fontFamily: "'Courier New', monospace" }}>保存</button>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', color: '#555555', display: 'block', marginBottom: '6px', fontFamily: "'Courier New', monospace" }}>🔒 新密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6位字符" style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--matrix-green-dim)', background: 'rgba(0,0,0,0.5)', color: '#e8e8e8', fontSize: '13px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: "'Courier New', monospace" }} />
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="确认密码" onKeyDown={e => e.key === 'Enter' && changePassword()} style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--matrix-green-dim)', background: 'rgba(0,0,0,0.5)', color: '#e8e8e8', fontSize: '13px', outline: 'none', marginBottom: '8px', boxSizing: 'border-box', fontFamily: "'Courier New', monospace" }} />
              <button onClick={changePassword} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--matrix-green)', background: 'var(--matrix-green-dim)', color: 'var(--matrix-green)', fontSize: '12px', cursor: 'pointer', fontFamily: "'Courier New', monospace" }}>更新</button>
            </div>

            {(msg || err) && (
              <div style={{ padding: '10px 14px', borderRadius: '4px', background: err ? 'rgba(255,51,51,0.1)' : 'var(--matrix-green-dim)', color: err ? '#ff3333' : 'var(--matrix-green)', fontSize: '12px', textAlign: 'center', marginBottom: '12px', fontFamily: "'Courier New', monospace" }}>{err || msg}</div>
            )}

            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--matrix-green-dim)', background: 'var(--accent-dim)', color: '#888888', fontSize: '13px', cursor: 'pointer', fontFamily: "'Courier New', monospace" }}>关闭 [X]</button>
          </div>
        </>
      )}
    </>
  );
}

function TabletHeader({ navItems, onNavigate }: { navItems: NavItem[]; onNavigate: (path: string) => void }) {
  const { currentUser, isAdmin } = useUserStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '12px 16px',
      overflowX: 'auto',
      background: 'linear-gradient(180deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.95) 100%)',
      borderBottom: '1px solid var(--matrix-green-dim)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        fontSize: '16px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, var(--matrix-green) 0%, #00ff88 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginRight: '8px',
        flexShrink: 0,
        fontFamily: "'Courier New', monospace",
      }}>成长</span>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: isActive ? 'var(--matrix-green-dim)' : 'transparent',
              color: isActive ? 'var(--matrix-green)' : 'rgba(255,255,255,0.6)',
              fontSize: '13px',
              fontWeight: isActive ? '500' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              fontFamily: "'Courier New', monospace",
            }}
          >
            {item.icon} {item.label}
          </button>
        );
      })}
      <div style={{ flex: 1, minWidth: '20px' }} />
      {currentUser ? (
        <>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{currentUser.name}</span>
          {isAdmin && <button onClick={() => navigate('/cms')} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: 'var(--matrix-green-dim)', color: 'var(--matrix-green)', fontSize: '12px', cursor: 'pointer', flexShrink: 0, fontFamily: "'Courier New', monospace" }}>{isAdmin ? '⚙ 管理' : ''}</button>}
        </>
      ) : (
        <button onClick={() => navigate('/login')} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid var(--matrix-green-dim)', background: 'transparent', color: 'var(--matrix-green)', fontSize: '12px', cursor: 'pointer', flexShrink: 0, fontFamily: "'Courier New', monospace" }}>🔑 登录</button>
      )}
    </div>
  );
}

function MobileNav({ navItems, currentPath, onNavigate }: { 
  navItems: NavItem[]; 
  currentPath: string; 
  onNavigate: (path: string) => void;
}) {
  const { currentUser, isAdmin, logout } = useUserStore();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const MAX_VISIBLE = 5;

  const visible = navItems.slice(0, MAX_VISIBLE);
  const overflow = navItems.slice(MAX_VISIBLE);
  const hasOverflow = overflow.length > 0 || isAdmin || !!currentUser;
  
  const handleLogout = () => {
    logout();
    setShowMore(false);
  };
  
  return (
    <>
      <nav style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: 'rgba(10, 10, 10, 0.95)', 
        borderTop: '1px solid var(--matrix-green-dim)', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        padding: '8px 4px', 
        zIndex: 100, 
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        {visible.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <div 
              key={item.path} 
              onClick={() => onNavigate(item.path)} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '2px', 
                padding: '6px 10px', 
                borderRadius: '10px', 
                background: isActive ? 'var(--matrix-green-dim)' : 'transparent', 
                cursor: 'pointer', 
                minWidth: '56px',
              }}
            >
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '10px', color: isActive ? 'var(--matrix-green)' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontFamily: "'Courier New', monospace" }}>{item.label}</span>
            </div>
          );
        })}
        {hasOverflow && (
          <div 
            onClick={() => setShowMore(!showMore)} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '2px', 
              padding: '6px 10px', 
              borderRadius: '10px', 
              background: showMore ? 'var(--matrix-green-dim)' : 'transparent', 
              cursor: 'pointer', 
              minWidth: '56px',
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{showMore ? '✕' : '⋯'}</span>
            <span style={{ fontSize: '10px', color: showMore ? 'var(--matrix-green)' : 'rgba(255,255,255,0.5)', fontFamily: "'Courier New', monospace" }}>更多</span>
          </div>
        )}
        {!currentUser && (
          <div onClick={() => onNavigate('/login')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 10px', borderRadius: '10px', cursor: 'pointer', minWidth: '56px' }}>
            <span style={{ fontSize: '20px' }}>🔑</span>
            <span style={{ fontSize: '10px', color: 'var(--matrix-green)', fontFamily: "'Courier New', monospace" }}>登录</span>
          </div>
        )}
      </nav>

      {showMore && (
        <>
          <div onClick={() => setShowMore(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150 }} />
          <div style={{ position: 'fixed', bottom: '80px', left: '16px', right: '16px', background: 'rgba(10, 10, 10, 0.98)', borderRadius: '8px', border: '1px solid var(--matrix-green-dim)', padding: '16px', zIndex: 151, display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            {overflow.map((item) => {
              const isActive = currentPath === item.path;
              return (
                <div key={item.path} onClick={() => { onNavigate(item.path); setShowMore(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '6px', background: isActive ? 'var(--matrix-green-dim)' : 'transparent', color: isActive ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '14px', fontFamily: "'Courier New', monospace" }}>
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{item.label}{isActive ? ' ●' : ''}</span>
                </div>
              );
            })}
            {isAdmin && (
              <div onClick={() => { navigate('/cms'); setShowMore(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '6px', background: currentPath === '/cms' ? 'var(--matrix-green-dim)' : 'transparent', color: currentPath === '/cms' ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)', cursor: 'pointer', borderTop: '1px solid var(--accent-dim)', marginTop: '4px', paddingTop: '16px', fontSize: '14px', fontFamily: "'Courier New', monospace" }}>
                <span style={{ fontSize: '18px' }}>⚙️</span>
                <span>系统管理{currentPath === '/cms' ? ' ●' : ''}</span>
              </div>
            )}
            {currentUser && (
              <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '6px', background: 'rgba(255,51,51,0.08)', color: '#ff4444', cursor: 'pointer', borderTop: '1px solid rgba(255,51,51,0.15)', marginTop: '4px', paddingTop: '16px', fontSize: '14px', fontFamily: "'Courier New', monospace" }}>
                <span style={{ fontSize: '18px' }}>🚪</span>
                <span>退出登录</span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function Layout({ children, currentUser: propUser }: LayoutProps) {
  const { currentUser: storeUser, isAdmin } = useUserStore();
  const currentUser = propUser ?? storeUser;
  const navigate = useNavigate();
  const location = useLocation();
  const { width } = useWindowSize();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });
  
  const nc = useNotificationCenter();

  const handleToggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  }, []);
  
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const isLoggedIn = !!currentUser;
  
  let allNavs: NavItem[];
  if (isLoggedIn) {
    allNavs = [...PRIVATE_NAV, ...(isAdmin ? ADMIN_NAV : [])];
  } else {
    allNavs = [
      { path: '/blog', label: '博客', icon: '📝', requireLogin: false },
      { path: '/blog/posts', label: '文章列表', icon: '📋', requireLogin: false },
    ];
  }
  
  const visibleNavs = allNavs.filter(item => {
    if (item.requireLogin && !currentUser) return false;
    return true;
  });

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {isDesktop && <DesktopSidebar navItems={visibleNavs} onNavigate={(p) => navigate(p)} onToggle={handleToggle} collapsed={collapsed} />}
      {isTablet && <TabletHeader navItems={visibleNavs} onNavigate={(p) => navigate(p)} />}
      <main style={{ 
        marginLeft: isDesktop ? `${sidebarW}px` : '0',
        padding: isDesktop ? '24px 28px' : isTablet ? '16px 16px' : '16px',
        paddingBottom: isMobile ? '80px' : '24px',
        paddingTop: isTablet ? '16px' : '24px',
        minHeight: '100vh',
        background: 'transparent',
        boxSizing: 'border-box',
        transition: 'margin-left 0.25s ease',
        overflow: 'auto',
      }}>
        <div className="page-enter" style={{ maxWidth: '1400px', margin: isDesktop ? '0' : '0 auto', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <NotificationCenter {...nc} />
          </div>
          {children}
        </div>
      </main>
      {isMobile && <MobileNav navItems={visibleNavs} currentPath={location.pathname} onNavigate={(p) => navigate(p)} />}
    </div>
  );
}