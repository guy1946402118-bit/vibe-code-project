import { useState } from 'react';
import { LEARNING_METHODS, type LearningMethod } from '../lib/learningMethods';

export function LearningPage() {
  const [selectedMethod, setSelectedMethod] = useState<LearningMethod | null>(null);

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>📚 学习方法论</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>掌握高效学习方法，让学习更轻松</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {LEARNING_METHODS.map((method) => (
          <div
            key={method.id}
            onClick={() => setSelectedMethod(method)}
            className="glass-card"
            style={{ padding: '18px 20px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `${method.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{method.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{method.nameCn}</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{method.description.slice(0, 60)}...</div>
              </div>
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.3)' }}>→</span>
            </div>
          </div>
        ))}
      </div>

      
        {selectedMethod && (
          <div
            onClick={() => setSelectedMethod(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'rgba(20,20,30,0.98)', borderRadius: '18px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(0,240,255,0.2)', boxShadow: '0 0 60px rgba(0,240,255,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: `${selectedMethod.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{selectedMethod.icon}</div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>{selectedMethod.nameCn}</h3>
                  <div style={{ fontSize: '12px', color: selectedMethod.color }}>{selectedMethod.name}</div>
                </div>
              </div>

              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '18px' }}>{selectedMethod.description}</div>

              <div style={{ background: `${selectedMethod.color}15`, borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: selectedMethod.color, marginBottom: '6px' }}>💡 核心原理</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{selectedMethod.核心原理}</div>
              </div>

              <div style={{ background: `${selectedMethod.color}15`, borderRadius: '12px', padding: '14px 16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: selectedMethod.color, marginBottom: '6px' }}>🎯 适用场景</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{selectedMethod.适用场景}</div>
              </div>

              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '12px' }}>📝 具体步骤</div>
                {selectedMethod.steps.map((step, i) => (
                  <div key={i}
                    style={{ display: 'flex', gap: '12px', marginBottom: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: selectedMethod.color, color: '#fff', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>{step.title}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{step.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setSelectedMethod(null)}
                style={{ width: '100%', marginTop: '16px', padding: '12px', background: selectedMethod.color, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                我知道了 💪
              </button>
            </div>
          </div>
        )}
      
    </div>
  );
}