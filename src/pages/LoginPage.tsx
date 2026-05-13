﻿﻿﻿﻿﻿import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';

const bootTexts = [
  'Loading kernel modules...',
  '[OK] Memory check: 16384 MB',
  '[OK] Network interface eth0',
  '[OK] Establishing secure connection...',
  'Initializing Growth Dashboard v1.0...',
  'System ready.',
];

const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';

export function LoginPage() {
  const [mode, setMode] = useState<'user-login' | 'user-register'>('user-login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { userLogin, userRegister, currentUser } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < bootTexts.length) {
        setTypingText(prev => prev + '\n' + bootTexts[index]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowTerminal(true), 300);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'var(--matrix-green)';
      ctx.font = '14px Courier New';

      for (let i = 0; i < drops.length; i++) {
        const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * 20;
        const y = drops[i] * 20;
        ctx.fillStyle = `rgba(57, 255, 20, ${Math.random() * 0.5 + 0.5})`;
        ctx.fillText(char, x, y);
        
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = async () => {
    if (!username.trim()) return;
    if (mode === 'user-register' && !password) return;
    
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'user-register') {
        await userRegister(username.trim(), password, email, phone);
      } else {
        await userLogin(username.trim(), password);
      }
      window.location.href = '/';
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Error');
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
      padding: '16px',
      background: 'var(--bg-primary)',
      fontFamily: "'Courier New', Courier, monospace",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <canvas ref={canvasRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }} />

      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }
        @keyframes flicker { 0%, 100% { opacity: 0.97; } 50% { opacity: 1; } }
        @keyframes borderGlow { 0%, 100% { border-color: #1a3d1a; box-shadow: 0 0 20px var(--matrix-green-dim); } 50% { border-color: var(--matrix-green); box-shadow: 0 0 40px var(--matrix-green-dim); } }
        @keyframes textGlitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .cursor-blink { animation: blink 1s infinite; }
        .scanline { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%); background-size: 100% 4px; pointer-events: none; z-index: 10; }
        .scanline-moving { position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(to bottom, transparent, var(--matrix-green-dim), transparent); pointer-events: none; z-index: 10; animation: scanline 6s linear infinite; }
        .crt-flicker { animation: flicker 0.15s infinite; }
        .terminal-glow { text-shadow: 0 0 5px var(--matrix-green), 0 0 10px var(--matrix-green), 0 0 20px var(--matrix-green); }
        .terminal-window { box-shadow: 0 0 30px var(--matrix-green-dim), 0 0 60px var(--matrix-green-dim), inset 0 0 80px rgba(0, 0, 0, 0.6); border: 1px solid #1a3d1a; animation: borderGlow 3s ease-in-out infinite; }
        .terminal-input { caret-color: var(--matrix-green); background: rgba(13, 13, 13, 0.9) !important; border: 1px solid #1a3d1a !important; color: var(--matrix-green) !important; box-shadow: inset 0 0 15px var(--matrix-green-dim), 0 0 10px var(--matrix-green-dim); transition: all 0.3s ease; }
        .terminal-input:focus { border: 1px solid var(--matrix-green) !important; box-shadow: 0 0 20px var(--matrix-green-dim), inset 0 0 15px var(--matrix-green-dim); outline: none; }
        .terminal-input::placeholder { color: #0d260d !important; }
        .terminal-btn { background: var(--accent-dim) !important; border: 1px solid #1a3d1a !important; color: var(--matrix-green) !important; transition: all 0.2s ease; cursor: pointer; font-family: 'Courier New', Courier, monospace; }
        .terminal-btn:hover { background: var(--matrix-green-dim) !important; border-color: var(--matrix-green) !important; box-shadow: 0 0 25px var(--matrix-green-dim), inset 0 0 15px var(--matrix-green-dim); }
        .terminal-btn-active { background: var(--matrix-green-dim) !important; border-color: var(--matrix-green) !important; box-shadow: 0 0 20px var(--matrix-green-dim); }
      `}</style>

      <div className="scanline" />
      <div className="scanline-moving" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="terminal-window crt-flicker"
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          background: 'rgba(13, 13, 13, 0.95)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 20,
        }}
      >
        <div style={{ 
          background: 'linear-gradient(to bottom, #1a1a1a, #0d0d0d)', 
          padding: '12px 18px',
          borderBottom: '1px solid #1a3d1a',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff5f56, #ff3333)', boxShadow: '0 0 6px rgba(255,95,86,0.5)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffbd2e, #ffaa00)', boxShadow: '0 0 6px rgba(255,189,46,0.5)' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'linear-gradient(135deg, #27ca40, #00cc26)', boxShadow: '0 0 6px rgba(39,202,64,0.5)' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--matrix-green)', fontSize: '13px', fontFamily: "'Courier New', monospace", textShadow: '0 0 10px var(--matrix-green)' }}>
            root@growth ~ login
          </div>
          <div style={{ width: '28px' }} />
        </div>

        <div style={{ padding: '28px 30px' }}>
          {!showTerminal ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                fontSize: '13px', 
                color: 'var(--matrix-green)', 
                whiteSpace: 'pre-wrap',
                fontFamily: "'Courier New', monospace",
                textShadow: '0 0 10px var(--matrix-green)',
                lineHeight: 1.7,
              }}
            >
              {typingText}
              <span className="cursor-blink">█</span>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div style={{ marginBottom: '8px', color: '#27ca40', fontSize: '16px', fontFamily: "'Courier New', monospace" }} className="terminal-glow">
                ┌── Growth Dashboard
              </div>
              <div style={{ marginBottom: '22px', paddingLeft: '16px', color: '#1a8d1a', fontSize: '13px', fontFamily: "'Courier New', monospace" }}>
                └─ $ ./auth.sh <span className="cursor-blink">█</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setMode('user-login')} className={`terminal-btn ${mode === 'user-login' ? 'terminal-btn-active' : ''}`}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                  [+] LOGIN
                </button>
                <button onClick={() => setMode('user-register')} className={`terminal-btn ${mode === 'user-register' ? 'terminal-btn-active' : ''}`}
                  style={{ flex: 1, padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                  [+] REGISTER
                </button>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ fontSize: '13px', color: '#ff3333', marginBottom: '16px', padding: '12px 16px', background: 'rgba(26, 10, 10, 0.9)', borderRadius: '6px', border: '1px solid #3d1a1a', fontFamily: "'Courier New', monospace" }}>
                  ✖ ERROR: {error}
                </motion.div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#1a8d1a', marginBottom: '4px', display: 'block', fontFamily: "'Courier New', monospace" }}>USERNAME</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="enter username" className="terminal-input"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', fontFamily: "'Courier New', Courier, monospace" }} />
                </div>

                {mode === 'user-register' && (
                  <>
                    <div>
                      <label style={{ fontSize: '11px', color: '#1a8d1a', marginBottom: '4px', display: 'block', fontFamily: "'Courier New', monospace" }}>EMAIL <span style={{ opacity: 0.5 }}>(optional)</span></label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" className="terminal-input"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', fontFamily: "'Courier New', Courier, monospace" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#1a8d1a', marginBottom: '4px', display: 'block', fontFamily: "'Courier New', monospace" }}>PHONE <span style={{ opacity: 0.5 }}>(optional)</span></label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="optional" className="terminal-input"
                        style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', fontFamily: "'Courier New', Courier, monospace" }} />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ fontSize: '11px', color: '#1a8d1a', marginBottom: '4px', display: 'block', fontFamily: "'Courier New', monospace" }}>
                    PASSWORD {mode === 'user-register' && <span style={{ color: '#ff3333' }}>(required)</span>}
                  </label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} placeholder="••••••••" className="terminal-input"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', fontSize: '14px', fontFamily: "'Courier New', Courier, monospace" }} />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 30px var(--matrix-green-dim)' }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} disabled={loading || !username.trim() || (mode === 'user-register' && !password)}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: '6px', border: '1px solid var(--matrix-green)',
                  background: 'var(--matrix-green-dim)', color: 'var(--matrix-green)', fontSize: '14px', fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                  marginTop: '24px', fontFamily: "'Courier New', Courier, monospace",
                  transition: 'all 0.3s ease', textShadow: '0 0 10px var(--matrix-green)',
                }}>
                {loading ? '> EXECUTING...█' : `> ${mode === 'user-login' ? 'LOGIN' : 'REGISTER'} --EXEC`}
              </motion.button>

              <div style={{ marginTop: '18px', fontSize: '11px', color: '#1a4d1a', fontFamily: "'Courier New', monospace", textAlign: 'center' }}>
                <span className="cursor-blink">█</span> Enter to execute
              </div>

              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1a3d1a', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#1a3d1a', fontFamily: "'Courier New', monospace" }}>
                <span>v1.0 | {new Date().getFullYear()}</span>
                <span style={{ color: '#27ca40' }}>● SECURE</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}