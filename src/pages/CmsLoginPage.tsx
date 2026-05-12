import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import { useNavigate } from 'react-router-dom';

export function CmsLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin } = useUserStore();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username.trim() || !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      await adminLogin(username.trim(), password);
      navigate('/cms');
    } catch (e: any) {
      setError(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '20%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,0,170,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(0,240,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .cursor-blink { animation: blink 1s infinite; }
        .glass-panel {
          background: rgba(20, 20, 35, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .admin-input {
          caret-color: #ff00aa;
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 0, 170, 0.3) !important;
        }
        .admin-input:focus {
          border-color: #ff00aa !important;
          box-shadow: 0 0 20px rgba(255, 0, 170, 0.2);
          outline: none;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            background: 'linear-gradient(135deg, #ff00aa 0%, #00f0ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
            letterSpacing: '2px'
          }}>
            CMS 管理后台
          </h1>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontFamily: "'SF Mono', monospace" }}>
            <span style={{ color: '#ff00aa' }}>root@admin</span>:~$ <span style={{ color: '#00f0ff' }}>登录</span>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ 
              fontSize: '13px', 
              color: '#ff6b6b', 
              marginBottom: '20px', 
              padding: '12px 16px', 
              background: 'rgba(255,107,107,0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(255,107,107,0.3)',
              textAlign: 'center'
            }}
          >
            ⚠ {error}
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
              管理员账号
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="admin"
              autoFocus
              className="admin-input"
              style={{
                width: '100%', 
                padding: '14px 16px',
                borderRadius: '8px',
                color: '#fff', 
                fontSize: '15px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', display: 'block' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              className="admin-input"
              style={{
                width: '100%', 
                padding: '14px 16px',
                borderRadius: '8px',
                color: '#fff', 
                fontSize: '15px',
              }}
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,0,170,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading || !username.trim() || !password}
          style={{
            width: '100%', 
            padding: '16px 20px', 
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #ff00aa 0%, #ff6b9d 100%)',
            color: '#fff', 
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer', 
            opacity: loading ? 0.6 : 1,
            marginTop: '24px',
            letterSpacing: '1px',
          }}
        >
          {loading ? '验证中...' : '管理员登录'}
        </motion.button>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '24px',
          fontSize: '12px', 
          color: 'rgba(255,255,255,0.3)',
          fontFamily: "'SF Mono', monospace"
        }}>
          <span className="cursor-blink">_</span>
        </div>
      </motion.div>
    </div>
  );
}
