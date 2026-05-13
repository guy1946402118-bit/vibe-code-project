﻿﻿﻿﻿﻿import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { skillApi } from '../lib/api';
import { showToast } from '../components/Toast';

type SkillType = 'PROMPT' | 'SKILL' | 'RULE' | 'DOC' | 'AGENT';
type SortMode = 'latest' | 'effective' | 'used';

interface SkillItem {
  id: string;
  title: string;
  content: string;
  type: SkillType;
  category: string;
  tags: string;
  effectiveness: number;
  usageCount: number;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

interface SkillStats {
  totalSkills: number;
  byType: { type: SkillType; _count: number }[];
  totalUsage: number;
}

interface TagInfo {
  name: string;
  count: number;
}

const TYPE_CONFIG: Record<SkillType, { label: string; icon: string; color: string; bg: string }> = {
  PROMPT: { label: '提示词', icon: '💬', color: 'var(--matrix-green)', bg: 'var(--matrix-green-dim)' },
  SKILL: { label: '技能', icon: '⚡', color: '#00f0ff', bg: 'rgba(0,240,255,0.1)' },
  RULE: { label: '规则', icon: '📐', color: '#ffaa00', bg: 'rgba(255,170,0,0.1)' },
  DOC: { label: '文档', icon: '📄', color: '#ff6b9d', bg: 'rgba(255,107,157,0.1)' },
  AGENT: { label: '智能体', icon: '🤖', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

const CATEGORIES = [
  { key: 'all', label: '全部', icon: '📦' },
  { key: 'frontend', label: '前端开发', icon: '🎨' },
  { key: 'backend', label: '后端开发', icon: '⚙️' },
  { key: 'ai_ml', label: 'AI/ML', icon: '🧠' },
  { key: 'productivity', label: '效率工具', icon: '🚀' },
  { key: 'writing', label: '写作内容', icon: '✍️' },
  { key: 'design', label: '设计创意', icon: '🎭' },
  { key: 'data', label: '数据分析', icon: '📊' },
  { key: 'general', label: '通用', icon: '🔧' },
];

export function SkillDepotPage() {
  const { currentUser } = useUserStore();
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [stats, setStats] = useState<SkillStats>({ totalSkills: 0, byType: [], totalUsage: 0 });
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [formData, setFormData] = useState({
    title: '', content: '', type: 'SKILL' as SkillType, category: 'general',
    tags: [] as string[], source: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickPaste, setQuickPaste] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, st, tg] = await Promise.all([
        skillApi.getAll({ type: filterType === 'all' ? undefined : filterType, category: filterCategory === 'all' ? undefined : filterCategory, search: searchQuery || undefined, sort: sortMode, page: currentPage }),
        skillApi.getStats(),
        skillApi.getTags(),
      ]);
      setSkills(res?.skills || []);
      setTotalPages(res?.pagination?.totalPages || 1);
      setStats(st);
      setAllTags(tg || []);
    } catch (e) { /* */ }
    setLoading(false);
  }, [filterType, filterCategory, searchQuery, sortMode, currentPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setFormData({ title: '', content: '', type: 'SKILL', category: 'general', tags: [], source: '' });
    setQuickPaste('');
    setEditingSkill(null);
  };

  const handleOpenAdd = () => { resetForm(); setShowModal(true); };

  const handleOpenEdit = (skill: SkillItem) => {
    setEditingSkill(skill);
    setFormData({
      title: skill.title, content: skill.content, type: skill.type, category: skill.category,
      tags: parseTags(skill.tags), source: skill.source || '',
    });
    setShowModal(true);
  };

  const handleQuickPaste = () => {
    if (!quickPaste.trim()) return;
    const lines = quickPaste.trim().split('\n');
    const title = lines[0].replace(/^#+\s*/, '').slice(0, 80);
    const content = lines.join('\n');
    setFormData(p => ({ ...p, title: title || '导入的技能', content }));
    setQuickPaste('');
    showToast({ type: 'info', title: '已导入', message: '请在下方编辑后保存', duration: 2000 });
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast({ type: 'warning', title: '标题和内容不能为空', message: '请填写完整后再保存', duration: 2000 });
      return;
    }
    try {
      if (editingSkill) {
        await skillApi.update(editingSkill.id, { ...formData });
        showToast({ type: 'success', title: '已更新', message: `「${formData.title}」更新成功`, duration: 2000 });
      } else {
        await skillApi.create({ ...formData, tags: formData.tags });
        showToast({ type: 'success', title: '已入库', message: `「${formData.title}」已加入技能仓库`, duration: 2000 });
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch { showToast({ type: 'warning', title: '保存失败', message: '请检查网络连接', duration: 2000 }); }
  };

  const handleDelete = async (id: string) => {
    try {
      await skillApi.delete(id);
      showToast({ type: 'info', title: '已移除', message: '技能已从仓库移除', duration: 2000 });
      setShowDeleteConfirm(null);
      loadData();
    } catch { /* */ }
  };

  const handleMarkUsed = async (id: string) => {
    try {
      await skillApi.markUsed(id);
      setSkills(prev => prev.map(s => s.id === id ? { ...s, usageCount: s.usageCount + 1 } : s));
    } catch { /* */ }
  };

  const handleEffectiveness = async (id: string, value: number) => {
    try {
      await skillApi.update(id, { effectiveness: value });
      setSkills(prev => prev.map(s => s.id === id ? { ...s, effectiveness: value } : s));
    } catch { /* */ }
  };

  const parseTags = (tagsStr: string): string[] => {
    try { const p = JSON.parse(tagsStr); return Array.isArray(p) ? p : []; } catch { return tagsStr ? [tagsStr] : []; }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  const renderStars = (skillId: string, current: number) => {
    const Star = ({ filled, onClick }: { filled: boolean; onClick?: () => void }) => (
      <span onClick={onClick} style={{
        cursor: onClick ? 'pointer' : 'default', color: filled ? '#ffaa00' : 'rgba(255,255,255,0.15)',
        fontSize: '14px', transition: 'color 0.15s',
      }}>{filled ? '★' : '☆'}</span>
    );
    return (
      <div style={{ display: 'flex', gap: '1px' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} filled={i <= current} onClick={() => handleEffectiveness(skillId, i === current ? 0 : i)} />
        ))}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: "'Courier New', monospace" }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <div style={{ fontSize: '16px' }}>登录后解锁你的 AI 第二大脑</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto', fontFamily: "'Courier New', monospace" }}>
      {/* ===== 统计概览 ===== */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { l: '技能总数', v: stats.totalSkills, i: '📦', c: '#00f0ff' },
          ...stats.byType.map(t => {
            const cfg = TYPE_CONFIG[t.type];
            return { l: `${cfg.icon} ${cfg.label}`, v: t._count, i: '', c: cfg.color };
          }),
          { l: '累计使用', v: stats.totalUsage, i: '🔄', c: 'var(--matrix-green)' },
        ].map((st, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '12px 20px', minWidth: '120px',
          }}>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', textTransform: 'uppercase' }}>{st.l}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: st.c }}>{st.v}</div>
          </div>
        ))}
      </div>

      {/* ===== 搜索/筛选栏 ===== */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '0 1 300px' }}>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="🔍 搜索技能标题/内容..."
            style={{
              width: '100%', padding: '10px 14px 10px 32px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
              color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>🔍</span>
        </div>

        <select value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <option value="all">全部类型</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.icon} {v.label}</option>
          ))}
        </select>

        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>

        <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          {(['latest', 'effective', 'used'] as SortMode[]).map(m => (
            <button key={m} onClick={() => setSortMode(m)}
              style={{
                padding: '8px 14px', background: sortMode === m ? 'rgba(0,240,255,0.1)' : 'transparent',
                border: 'none', color: sortMode === m ? '#00f0ff' : 'rgba(255,255,255,0.4)',
                fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {m === 'latest' ? '🕐 最新' : m === 'effective' ? '⭐ 最有效' : '🔄 最常用'}
            </button>
          ))}
        </div>

        <button onClick={handleOpenAdd}
          style={{
            padding: '10px 20px', borderRadius: '10px', background: 'rgba(0,240,255,0.15)',
            border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff', fontSize: '12px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          ➕ 入库新技能
        </button>
      </div>

      {/* ===== 标签云 ===== */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: '16px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginRight: '4px' }}>🏷️</span>
          {allTags.sort((a, b) => b.count - a.count).slice(0, 20).map(t => (
            <span key={t.name} style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            }} onClick={() => { setSearchQuery(t.name); setCurrentPage(1); }}>{t.name} <span style={{ color: 'rgba(255,255,255,0.3)' }}>{t.count}</span></span>
          ))}
          {allTags.length > 20 && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>+{allTags.length - 20}...</span>}
        </div>
      )}

      {/* ===== 技能网格 ===== */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div style={{ fontSize: '12px' }}>正在扫描技能仓库...</div>
        </div>
      ) : skills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>仓库空空如也</div>
          <div style={{ fontSize: '11px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
            就像视频里说的 AI 技能只有入库了才能被检索和使用<br />
            点击 <span style={{ color: '#00f0ff' }}>入库新技能</span> 开始建立你的 AI 第二大脑
          </div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px',
          }}>
            {skills.map(skill => {
              const cfg = TYPE_CONFIG[skill.type];
              const tags = parseTags(skill.tags);
              const isExpanded = expandedId === skill.id;

              return (
                <div key={skill.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${isExpanded ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '14px', padding: '16px', transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }} onClick={() => setExpandedId(isExpanded ? null : skill.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                        fontSize: '10px', color: cfg.color, background: cfg.bg, marginRight: '8px',
                      }}>{cfg.icon} {cfg.label}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                        {CATEGORIES.find(c => c.key === skill.category)?.icon || '📌'} {CATEGORIES.find(c => c.key === skill.category)?.label || skill.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={e => { e.stopPropagation(); handleMarkUsed(skill.id); }}
                        style={{
                          padding: '2px 8px', borderRadius: '6px', fontSize: '9px',
                          background: 'var(--matrix-green-dim)', border: '1px solid var(--matrix-green-dim)',
                          color: 'var(--matrix-green)', cursor: 'pointer', fontFamily: 'inherit',
                        }}>使用</button>
                      <button onClick={e => { e.stopPropagation(); handleOpenEdit(skill); }}
                        style={{
                          padding: '2px 6px', borderRadius: '6px', fontSize: '9px',
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                        }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); setShowDeleteConfirm(skill.id); }}
                        style={{
                          padding: '2px 6px', borderRadius: '6px', fontSize: '9px',
                          background: 'transparent', border: '1px solid rgba(255,107,107,0.1)',
                          color: 'rgba(255,107,107,0.5)', cursor: 'pointer', fontFamily: 'inherit',
                        }}>🗑</button>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                    {skill.title}
                  </div>

                  <div style={{
                    fontSize: '10px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.5',
                    maxHeight: isExpanded ? 'none' : '36px', overflow: 'hidden',
                  }}>
                    {(skill.content || '').slice(0, isExpanded ? 5000 : 120)}
                    {!isExpanded && (skill.content || '').length > 120 && '...'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {renderStars(skill.id, skill.effectiveness)}
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                        已用 {skill.usageCount} 次
                      </span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                      {formatDate(skill.createdAt)}
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {tags.map(t => (
                        <span key={t} style={{
                          padding: '1px 7px', borderRadius: '10px', fontSize: '9px',
                          background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                        }}>{t}</span>
                      ))}
                    </div>
                  )}

                  {skill.source && (
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '6px' }}>
                      来源: {skill.source}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '11px', cursor: currentPage <= 1 ? 'default' : 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  color: currentPage <= 1 ? 'rgba(255,255,255,0.2)' : '#fff', fontFamily: 'inherit', opacity: currentPage <= 1 ? 0.5 : 1,
                }}>←</button>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {currentPage} / {totalPages}
              </span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '11px', cursor: currentPage >= totalPages ? 'default' : 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  color: currentPage >= totalPages ? 'rgba(255,255,255,0.2)' : '#fff', fontFamily: 'inherit', opacity: currentPage >= totalPages ? 0.5 : 1,
                }}>→</button>
            </div>
          )}
        </>
      )}

      {/* ===== Modal 添加/编辑 ===== */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '28px', width: '640px', maxHeight: '85vh', overflow: 'auto',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
              {editingSkill ? '✏️ 编辑技能' : '📦 入库新技能'}
            </div>

            {/* Quick paste */}
            {!editingSkill && (
              <>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                  ⚡ 快速粘贴 (直接粘贴来自任何地方的提示词/规则文本)
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <textarea
                    value={quickPaste}
                    onChange={e => setQuickPaste(e.target.value)}
                    placeholder="粘贴 AI 提示词 / 技能 / 规则文本..."
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', minHeight: '60px',
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                      color: '#fff', fontSize: '11px', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    }}
                  />
                  <button onClick={handleQuickPaste}
                    style={{
                      padding: '8px 16px', borderRadius: '10px', alignSelf: 'flex-start',
                      background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)',
                      color: '#00f0ff', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}>解析</button>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginBottom: '12px' }} />
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="技能/提示词标题"
                style={{
                  padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit',
                }}
              />

              <textarea
                value={formData.content}
                onChange={e => setFormData(p => ({ ...p, content: e.target.value }))}
                placeholder="技能/提示词完整内容..."
                style={{
                  padding: '10px 14px', borderRadius: '10px', minHeight: '120px',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
                  color: '#fff', fontSize: '11px', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as SkillType }))}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>

                <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {CATEGORIES.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={formData.tags.join(', ')}
                  onChange={e => setFormData(p => ({ ...p, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  placeholder="标签(逗号分隔): 前端, React, UI设计"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit',
                  }}
                />

                <input value={formData.source}
                  onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}
                  placeholder="来源: 抖音/网站名"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '12px', outline: 'none', fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                style={{
                  padding: '10px 24px', borderRadius: '10px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                }}>取消</button>
              <button onClick={handleSubmit}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(0,240,255,0.2), var(--matrix-green-dim))',
                  border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff',
                  fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit',
                }}>
                {editingSkill ? '💾 保存修改' : '📦 入库'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 删除确认 ===== */}
      {showDeleteConfirm && (
        <div onClick={() => setShowDeleteConfirm(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0a0f1a', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '16px',
            padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontSize: '14px', color: '#fff', marginBottom: '6px' }}>确认移除此技能?</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }}>此操作不可恢复</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '8px 20px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
                }}>取消</button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                style={{
                  padding: '8px 20px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b',
                }}>确认移除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
