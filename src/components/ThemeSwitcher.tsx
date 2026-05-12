﻿import { useState, useEffect } from 'react';

const THEME_CLASSICS = [
  { id: 'terminal', label: '矩阵终端', preview: '#39ff14', accentStyle: { background: '#39ff14' } },
  { id: 'light', label: 'GitHub暗色', preview: '#3fb950', accentStyle: { background: '#3fb950' } },
  { id: 'synthwave', label: '赛博霓虹', preview: '#e040fb', accentStyle: { background: '#e040fb' } },
  { id: 'ocean', label: '深海潜行', preview: '#0099ff', accentStyle: { background: '#0099ff' } },
  { id: 'forest', label: '数字丛林', preview: '#00cc66', accentStyle: { background: '#00cc66' } },
  { id: 'fire', label: '火焰引擎', preview: '#ff6600', accentStyle: { background: '#ff6600' } },
];

const THEME_CONTRASTS = [
  { id: 'neon', label: '霓虹蓝紫', preview: '#00B9FB', accentStyle: { background: 'linear-gradient(135deg, #00B9FB, #8F00FF)' } },
  { id: 'lime', label: '青柠炭黑', preview: '#BFFF00', accentStyle: { background: '#BFFF00' } },
  { id: 'royal', label: '帝王紫黄', preview: '#7209B7', accentStyle: { background: 'linear-gradient(135deg, #7209B7, #FFDA00)' } },
  { id: 'sakura', label: '樱花墨绿', preview: '#FF8FA3', accentStyle: { background: 'linear-gradient(135deg, #FF8FA3, #1A4D2E)' } },
  { id: 'mint', label: '冰薄荷红', preview: '#00F5D4', accentStyle: { background: 'linear-gradient(135deg, #00F5D4, #E63946)' } },
  { id: 'lava', label: '熔岩深海', preview: '#FF5E0E', accentStyle: { background: 'linear-gradient(135deg, #FF5E0E, #0A2342)' } },
  { id: 'berry', label: '莓果荧光', preview: '#E30B5C', accentStyle: { background: 'linear-gradient(135deg, #E30B5C, #76FF03)' } },
  { id: 'blaze', label: '炽橙电蓝', preview: '#FF7900', accentStyle: { background: 'linear-gradient(135deg, #FF7900, #0022FF)' } },
];

const ALL_THEMES = [...THEME_CLASSICS, ...THEME_CONTRASTS];

export function ThemeSwitcher() {
  const [active, setActive] = useState(() => {
    try {
      const saved = localStorage.getItem('growth-dashboard-theme');
      if (saved && ALL_THEMES.some(t => t.id === saved)) return saved;
    } catch {}
    return 'terminal';
  });

  useEffect(() => {
    const el = document.documentElement;
    if (active === 'terminal') {
      el.removeAttribute('data-theme');
    } else {
      el.setAttribute('data-theme', active);
    }
    try {
      localStorage.setItem('growth-dashboard-theme', active);
    } catch {}
  }, [active]);

  const handleThemeChange = (themeId: string) => {
    setActive(themeId);
  };

  const renderGroup = (themes: typeof THEME_CLASSICS, label: string) => (
    <div key={label} style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: "'Courier New', monospace", fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {themes.map(theme => (
          <button key={theme.id} onClick={() => handleThemeChange(theme.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px',
              border: active === theme.id ? '1.5px solid var(--accent)' : '1.5px solid var(--border-light)',
              background: active === theme.id ? 'var(--accent-dim)' : 'var(--bg-glass)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
              boxShadow: active === theme.id ? '0 0 14px var(--accent-glow)' : 'none',
            }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '4px',
              border: active === theme.id ? '2px solid var(--text-primary)' : '1px solid rgba(255,255,255,0.3)',
              ...theme.accentStyle, flexShrink: 0,
            }} />
            <span style={{
              fontSize: '11px', fontWeight: active === theme.id ? '600' : '400',
              color: active === theme.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: "'Courier New', monospace", whiteSpace: 'nowrap',
            }}>{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '14px 0' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', fontFamily: "'Courier New', monospace", fontWeight: '600', letterSpacing: '1px' }}>
        主题选择
      </div>
      {renderGroup(THEME_CLASSICS, '经典')}
      {renderGroup(THEME_CONTRASTS, '撞色')}
    </div>
  );
}