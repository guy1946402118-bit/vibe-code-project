﻿﻿﻿﻿﻿import { useState } from 'react';

interface ReviewItem {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const CHECKLIST: ReviewItem[] = [
  { id: 'title', label: '标题清晰明确', icon: '📌', description: '标题准确概括内容，不含歧义词，能吸引读者点击' },
  { id: 'structure', label: '结构逻辑完整', icon: '📐', description: '开头点题 → 正文展开 → 结尾总结，段落过渡自然' },
  { id: 'value', label: '提供具体价值', icon: '💎', description: '内容包含可操作的建议、工具方法或深入见解' },
  { id: 'format', label: '排版格式规范', icon: '🎨', description: '标题层级合理，代码块标注语言，图片有说明，链接可点击' },
  { id: 'accuracy', label: '内容准确可靠', icon: '✅', description: '数据和技术细节经过验证，引用标注来源' },
  { id: 'reader', label: '考虑读者视角', icon: '👁️', description: '读者阅读此文章能获得什么？是否足够易懂？' },
  { id: 'tags', label: '标签分类恰当', icon: '🏷️', description: '标签不超过5个，分类准确，无重复冗余标签' },
];

interface PublishReviewProps {
  content: string;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PublishReview({ content, title, onConfirm, onCancel }: PublishReviewProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allChecked = CHECKLIST.every(item => checked.has(item.id));
  const progress = (checked.size / CHECKLIST.length) * 100;

  const contentStats = {
    chars: (content || '').length,
    words: (content || '').length > 0 ? (content || '').split(/\s+/).filter(Boolean).length : 0,
    lines: (content || '').split('\n').filter(Boolean).length,
    sections: (content || '').match(/^#{1,3}\s/gm)?.length || 0,
  };

  const suggestions: string[] = [];
  if ((title || '').length < 5) suggestions.push('标题过短（建议≥5字），请考虑扩展以提升SEO和点击率');
  if ((title || '').length > 60) suggestions.push('标题过长（建议≤60字），可能会在列表中被截断');
  if (contentStats.chars < 200) suggestions.push('内容较短（建议≥200字），考虑补充更多细节或示例');
  if (contentStats.chars > 50000) suggestions.push('内容较长（建议拆分系列文章），超长文章可能影响阅读体验');
  if (contentStats.sections < 2) suggestions.push('缺少分节标题，建议添加二级/三级标题提升可读性');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', padding: '24px',
      fontFamily: "'Courier New', monospace", color: '#fff',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>
        🔍 发布前审核
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
        就像视频里说的 AI 输出需要「门下省」审核机制，好的文章也需要自审
      </div>

      {/* 进度条 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>审核进度</span>
          <span style={{ color: progress === 100 ? 'var(--matrix-green)' : 'rgba(255,255,255,0.5)' }}>{checked.size}/{CHECKLIST.length} — {Math.round(progress)}%</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: progress === 100 ? 'linear-gradient(90deg, var(--matrix-green), #00f0ff)' : 'linear-gradient(90deg, #ffaa00, #ff6b9d)',
            width: `${progress}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* 清单 */}
      <div style={{ marginBottom: '20px' }}>
        {CHECKLIST.map(item => {
          const isChecked = checked.has(item.id);
          return (
            <div key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '6px',
                cursor: 'pointer', transition: 'all 0.15s',
                background: isChecked ? 'var(--accent-dim)' : 'transparent',
                border: `1px solid ${isChecked ? 'var(--matrix-green-dim)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isChecked ? 'var(--matrix-green-dim)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isChecked ? 'var(--matrix-green)' : 'rgba(255,255,255,0.1)'}`,
                fontSize: '12px', flexShrink: 0, transition: 'all 0.15s',
              }}>
                {isChecked ? '✓' : ''}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: isChecked ? 'var(--matrix-green)' : 'rgba(255,255,255,0.7)' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{item.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 内容统计 */}
      <div style={{
        display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap',
        padding: '12px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
      }}>
        {[
          { l: '标题字数', v: (title || '').length },
          { l: '正文字数', v: contentStats.chars },
          { l: '段落数', v: contentStats.lines },
          { l: '分节标题', v: contentStats.sections },
        ].map((st, i) => (
          <div key={i}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{st.l}</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>{st.v}</div>
          </div>
        ))}
      </div>

      {/* 建议 */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#ffaa00', marginBottom: '6px' }}>💡 优化建议</div>
          {suggestions.map((s, i) => (
            <div key={i} style={{
              fontSize: '10px', color: 'rgba(255,170,0,0.7)',
              padding: '4px 8px', marginBottom: '2px',
            }}>• {s}</div>
          ))}
        </div>
      )}

      {/* 按钮 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button onClick={onCancel}
          style={{
            padding: '10px 24px', borderRadius: '10px', fontFamily: 'inherit', fontSize: '12px', cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
          }}>返回编辑</button>
        <button onClick={onConfirm}
          disabled={!allChecked}
          style={{
            padding: '10px 24px', borderRadius: '10px', fontFamily: 'inherit', fontSize: '12px', cursor: allChecked ? 'pointer' : 'not-allowed',
            background: allChecked ? 'linear-gradient(135deg, var(--matrix-green-dim), rgba(0,240,255,0.1))' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${allChecked ? 'var(--matrix-green-dim)' : 'rgba(255,255,255,0.05)'}`,
            color: allChecked ? 'var(--matrix-green)' : 'rgba(255,255,255,0.15)',
            fontWeight: 'bold',
          }}>
          🚀 发布文章
        </button>
      </div>
    </div>
  );
}
