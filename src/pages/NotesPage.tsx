import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUserStore } from '../stores/userStore';
import * as db from '../lib/db';
import { knowledgeApi, type KnowledgeCategory, type KnowledgeNode, type KnowledgeGraphData } from '../lib/api';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { TagCloud } from '../components/TagCloud';
import { showToast } from '../components/Toast';

type ViewMode = 'graph' | 'list' | 'para';

interface ParaFolder {
  key: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  notes: db.Note[];
}

const NOTE_TEMPLATES = [
  {
    id: 'meeting',
    name: '📋 会议记录',
    title: '会议记录 - ',
    content: `---
日期: ${new Date().toISOString().slice(0, 10)}
类型: 会议记录
参与者:
标签:
---

## 议题

## 讨论要点

## 决议

## 待办事项
- [ ] 
`,
    tags: '会议',
  },
  {
    id: 'study',
    name: '📖 学习笔记',
    title: '学习笔记 - ',
    content: `---
日期: ${new Date().toISOString().slice(0, 10)}
类型: 学习笔记
来源:
领域:
标签:
---

## 核心概念

## 要点摘录

## 个人理解与思考

## 待深入探索
- [[相关概念]]
`,
    tags: '学习',
  },
  {
    id: 'review',
    name: '🔄 项目复盘',
    title: '复盘 - ',
    content: `---
日期: ${new Date().toISOString().slice(0, 10)}
类型: 项目复盘
项目:
周期:
标签:
---

## 目标回顾

## 完成情况

## 做得好的

## 可改进的

## 下一步行动
- [ ] 
`,
    tags: '复盘',
  },
  {
    id: 'idea',
    name: '💡 灵感速记',
    title: '灵感 - ',
    content: `---
日期: ${new Date().toISOString().slice(0, 10)}
类型: 灵感速记
标签:
---

## 灵感来源

## 核心想法

## 关联内容
- [[关联]]
`,
    tags: '灵感',
  },
];

function parseWikiLinks(text: string): { display: string; target: string }[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: { display: string; target: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1];
    const parts = raw.split('|');
    const target = (parts[0] || raw).trim();
    const display = (parts[1] || parts[0] || raw).trim();
    links.push({ target, display });
  }
  return links;
}

function renderContentWithLinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (_m, raw) => {
    const parts = raw.split('|');
    const target = (parts[0] || raw).trim();
    const display = (parts[1] || parts[0] || raw).trim();
    return `<span class="wikilink" data-target="${target}" style="color:var(--matrix-green);border-bottom:1px dashed var(--matrix-green);cursor:pointer;font-family:'Courier New',monospace">${display}</span>`;
  });
}

export function NotesPage() {
  const { currentUser } = useUserStore();
  const [notes, setNotes] = useState<db.Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [tagCloud, setTagCloud] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ nodes: KnowledgeNode[]; articles: any[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [relatedNodes, setRelatedNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [tagLoading, setTagLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('');
  const [showSeedBtn, setShowSeedBtn] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [wikiLinks, setWikiLinks] = useState<{ target: string; sourceNote: string }[]>([]);
  const [showBacklinks, setShowBacklinks] = useState(false);

  useEffect(() => { if (currentUser) loadNotes(); }, [currentUser]);

  useEffect(() => {
    loadCategories();
    loadGraphData();
    loadTags();
  }, [selectedCategory]);

  useEffect(() => {
    const links: { target: string; sourceNote: string }[] = [];
    notes.forEach(note => {
      const found = parseWikiLinks(note.title + ' ' + note.content);
      found.forEach(l => links.push({ target: l.target, sourceNote: note.id }));
    });
    setWikiLinks(links);
  }, [notes]);

  const loadNotes = async () => {
    if (!currentUser) return;
    const data = await db.getNotes(currentUser.id);
    setNotes(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  const loadCategories = async () => {
    try {
      const data = await knowledgeApi.getCategories();
      setCategories(data);
      if (data.length > 0 && data[0].children.length === 0) {
        setShowSeedBtn(true);
      }
    } catch {
      setShowSeedBtn(true);
    }
  };

  const loadGraphData = async () => {
    setGraphLoading(true);
    try {
      const params = selectedCategory ? { category: selectedCategory } : undefined;
      const data = await knowledgeApi.getGraph(params);
      setGraphData(data);
      setShowSeedBtn(data.nodes.length <= 4);
    } catch {
      setShowSeedBtn(true);
    } finally {
      setGraphLoading(false);
    }
  };

  const loadTags = async () => {
    setTagLoading(true);
    try {
      const data = await knowledgeApi.getTags();
      setTagCloud(data);
    } catch { } finally {
      setTagLoading(false);
    }
  };

  const handleNodeClick = useCallback(async (nodeId: string) => {
    setLoading(true);
    try {
      const { node, related } = await knowledgeApi.getNode(nodeId);
      setSelectedNode(node);
      setRelatedNodes(related);
      setShowBacklinks(true);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setLoading(true);
    try {
      const results = await knowledgeApi.search(searchQuery.trim());
      setSearchResults(results);
    } catch { } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleTagClick = useCallback((tag: any) => {
    setActiveTag(activeTag === tag.name ? '' : tag.name);
    setSearchQuery(tag.name);
  }, [activeTag]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await knowledgeApi.seed();
      await knowledgeApi.syncBlog();
      await loadCategories();
      await loadGraphData();
      await loadTags();
      setShowSeedBtn(false);
      showToast({ type: 'success', title: '知识图谱已初始化', message: '种子数据和博客同步完成', duration: 3000 });
    } catch { } finally {
      setSeeding(false);
    }
  };

  const applyTemplate = (tpl: typeof NOTE_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    setTags(tpl.tags);
    setShowTemplatePicker(false);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!currentUser || !title.trim() || !content.trim()) return;
    await db.addNote(
      currentUser.id,
      title.trim(),
      content.trim(),
      tags.split(',').map(t => t.trim()).filter(Boolean),
    );
    setTitle(''); setContent(''); setTags(''); setShowForm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    loadNotes();
  };

  const handleDelete = async (id: string) => {
    await db.deleteNote(id);
    loadNotes();
  };

  const handleCategoryClick = (cat: KnowledgeCategory) => {
    setSelectedCategory(selectedCategory === cat.name ? '' : cat.name);
    setSelectedNode(null);
    setRelatedNodes([]);
    setShowBacklinks(false);
  };

  const handleWikiLinkClick = (target: string) => {
    const matchedNode = graphData?.nodes.find(n => n.name === target);
    if (matchedNode) {
      handleNodeClick(matchedNode.id);
    } else {
      setSearchQuery(target);
      handleSearch();
    }
  };

  const relationLabels: Record<string, string> = {
    BELONGS_TO: '属于',
    RELATED_TO: '关联',
    HAS_TAG: '标签',
    INSTANCE_OF: '实例',
    SIMILAR_TO: '相似',
    DEPENDS_ON: '依赖',
    AUTHORED_BY: '作者',
    SUPERCEDES: '替代',
  };

  const backlinksForNode = useMemo(() => {
    if (!selectedNode) return [];
    return notes.filter(note => {
      const text = note.title + ' ' + note.content;
      const links = parseWikiLinks(text);
      return links.some(l => l.target === selectedNode.name);
    });
  }, [notes, selectedNode]);

  const orphanNodes = useMemo(() => {
    if (!graphData) return [];
    const connectedIds = new Set<string>();
    graphData.edges.forEach(e => {
      connectedIds.add(e.fromId);
      connectedIds.add(e.toId);
    });
    return graphData.nodes.filter(n => !connectedIds.has(n.id) && !n.isCategory);
  }, [graphData]);

  const paraFolders = useMemo((): ParaFolder[] => {
    const inboxNotes = notes.filter(n => n.tags.some(t => ['inbox', '收件箱', '临时'].includes(t.toLowerCase())));
    const projectNotes = notes.filter(n => n.tags.some(t => ['project', '项目'].includes(t.toLowerCase())));
    const areaNotes = notes.filter(n => n.tags.some(t => ['area', '领域', 'study', '学习', 'work', '工作'].includes(t.toLowerCase())));
    const resourceNotes = notes.filter(n => n.tags.some(t => ['resource', '资源', 'reference', '参考'].includes(t.toLowerCase())));
    const otherNotes = notes.filter(n => {
      const all = ['inbox', '收件箱', '临时', 'project', '项目', 'area', '领域', 'study', '学习', 'work', '工作', 'resource', '资源', 'reference', '参考'];
      return !n.tags.some(t => all.includes(t.toLowerCase()));
    });

    return [
      { key: 'inbox', label: '📥 收件箱', icon: '📥', description: '临时记录，待整理', color: '#ffbd2e', notes: inboxNotes },
      { key: 'projects', label: '📁 项目', icon: '📁', description: '有明确目标与截止日期', color: '#ff6b6b', notes: projectNotes },
      { key: 'areas', label: '🌱 领域', icon: '🌱', description: '持续关注的责任领域', color: '#00f0ff', notes: areaNotes },
      { key: 'resources', label: '📚 资源', icon: '📚', description: '参考资料与外部知识', color: '#96CEB4', notes: resourceNotes },
      { key: 'archive', label: '🗄️ 归档', icon: '🗄️', description: '已完成或不活跃的内容', color: '#888', notes: otherNotes },
    ];
  }, [notes]);

  const renderParaView = () => (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontFamily: "'Courier New', monospace" }}>
        💡 PARA 方法：标签带 <code>inbox/项目/学习/资源</code> 的笔记会自动归类。使用 <code>[[双向链接]]</code> 建立知识关联。
      </div>
      {paraFolders.map((folder) => (
        <div key={folder.key} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 10,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: `${folder.color}15`,
            borderLeft: `3px solid ${folder.color}`,
          }}>
            <span style={{ fontSize: 20 }}>{folder.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{folder.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{folder.description}</div>
            </div>
            <span style={{ fontSize: 12, color: folder.color, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
              {folder.notes.length}
            </span>
          </div>
          {folder.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
              {folder.notes.map(note => {
                const links = parseWikiLinks(note.title + ' ' + note.content);
                return (
                  <div
                    key={note.id}
                    className="glass-card"
                    style={{
                      padding: '14px 16px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{note.title}</div>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}
                          dangerouslySetInnerHTML={{ __html: renderContentWithLinks(note.content.slice(0, 120) + (note.content.length > 120 ? '...' : '')) }}
                        />
                        {links.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔗</span>
                            {links.slice(0, 5).map((l, i) => (
                              <span
                                key={i}
                                onClick={(e) => { e.stopPropagation(); handleWikiLinkClick(l.target); }}
                                style={{
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  background: 'rgba(57,255,20,0.1)',
                                  color: 'var(--matrix-green)',
                                  cursor: 'pointer',
                                  fontFamily: "'Courier New', monospace",
                                  border: '1px solid rgba(57,255,20,0.2)',
                                }}
                              >
                                {l.display}
                              </span>
                            ))}
                            {links.length > 5 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{links.length - 5}</span>}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDelete(note.id)} title="删除"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: '2px 6px', opacity: 0.5 }}>
                        🗑️
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {note.tags.map((tag, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', borderRadius: 10 }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '16px 0 16px 12px', color: 'var(--text-muted)', fontSize: 12, fontFamily: "'Courier New', monospace" }}>
              拖拽笔记到此文件夹，或添加 <code>#{folder.key}</code> 标签
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '0 0 60px' }}>
      {/* ====== 头部 ====== */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, fontFamily: "'Courier New', monospace" }}>
            🕸️ 知识库
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {selectedNode ? `浏览: ${selectedNode.name}` : 'Obsidian 风格 · [[双向链接]] · PARA 分类 · 知识图谱'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {showSeedBtn && !seeding && (
            <button onClick={handleSeed} style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid #ffbd2e',
              background: 'rgba(255,189,46,0.1)', color: '#ffbd2e', fontSize: 12, cursor: 'pointer', fontWeight: 600,
              fontFamily: "'Courier New', monospace",
            }}>
              ⚡ 初始化知识图谱
            </button>
          )}
          {seeding && (
            <span style={{ padding: '8px 14px', color: 'var(--text-muted)', fontSize: 12 }}>
              ⏳ 初始化中...
            </span>
          )}

          {/* ====== 视图切换 ====== */}
          <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            {[
              { key: 'graph', label: '🕸️ 图谱', desc: '知识图谱' },
              { key: 'para', label: '📂 PARA', desc: '文件夹' },
              { key: 'list', label: '📋 列表', desc: '列表' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => { setViewMode(v.key as ViewMode); setSelectedNode(null); setShowBacklinks(false); }}
                title={v.desc}
                style={{
                  padding: '7px 12px', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: viewMode === v.key ? 'var(--accent)' : 'transparent',
                  color: viewMode === v.key ? '#000' : 'var(--text-secondary)',
                  fontFamily: "'Courier New', monospace",
                  transition: 'all 0.15s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <button onClick={() => { setShowForm(!showForm); setSelectedNode(null); setShowTemplatePicker(false); }}
            style={{
              padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--matrix-green)',
              background: showForm ? 'transparent' : 'var(--matrix-green-dim)', color: 'var(--matrix-green)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Courier New', monospace",
            }}>
            {showForm ? '关闭' : '✚ 新建笔记'}
          </button>
        </div>
      </div>

      {/* ====== 笔记表单 ====== */}
      {showForm && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
          {!showTemplatePicker ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <button
                  onClick={() => setShowTemplatePicker(true)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-accent)',
                    background: 'transparent', color: 'var(--accent)', fontSize: 11, cursor: 'pointer',
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  📝 使用模板
                </button>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Courier New', monospace" }}>
                  提示: 使用 [[节点名]] 创建双向链接
                </span>
              </div>
              <input
                value={title} onChange={e => setTitle(e.target.value)} placeholder="笔记标题"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 12, boxSizing: 'border-box',
                  outline: 'none', fontFamily: "'Courier New', monospace",
                }}
              />
              <textarea
                value={content} onChange={e => setContent(e.target.value)} placeholder="笔记内容 — 使用 [[双边括号]] 创建知识链接..."
                rows={6}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, marginBottom: 12,
                  boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.7, outline: 'none',
                  fontFamily: "'Courier New', monospace",
                }}
              />
              <input
                value={tags} onChange={e => setTags(e.target.value)}
                placeholder="标签（逗号分隔）— 使用 inbox/项目/学习/资源 激活 PARA 分类"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 12, marginBottom: 14,
                  boxSizing: 'border-box', outline: 'none', fontFamily: "'Courier New', monospace",
                }}
              />
              <button onClick={handleSave} disabled={!title.trim() || !content.trim()}
                style={{
                  padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: 'none', width: '100%',
                  background: title.trim() && content.trim() ? 'var(--matrix-green)' : 'rgba(255,255,255,0.08)',
                  color: title.trim() && content.trim() ? '#000' : 'var(--text-muted)', fontSize: 13, fontWeight: 700,
                  cursor: title.trim() ? 'pointer' : 'not-allowed', fontFamily: "'Courier New', monospace",
                }}>
                💾 保存笔记 (+5 分)
              </button>
            </>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>📝 选择模板</h3>
                <button onClick={() => setShowTemplatePicker(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {NOTE_TEMPLATES.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="glass-card"
                    style={{
                      padding: '16px', cursor: 'pointer', transition: 'all 0.15s',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 6 }}>{tpl.name}</div>
                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Courier New', monospace",
                      whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden',
                    }}>
                      {tpl.content.slice(0, 120)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== 主内容区 ====== */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ====== 左侧边栏 ====== */}
        <div style={{ flex: '0 0 220px', minWidth: 200 }}>
          {/* 知识分类 */}
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
              📂 知识分类
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {categories.map(cat => {
                const isActive = selectedCategory === cat.name;
                return (
                  <div key={cat.id}>
                    <div onClick={() => handleCategoryClick(cat)} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)', background: isActive ? 'var(--accent-dim)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)', cursor: 'pointer', fontSize: 12,
                      fontWeight: isActive ? 600 : 400, transition: 'all 0.15s',
                      borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      <span>{cat.icon || '📁'}</span>
                      <span style={{ flex: 1 }}>{cat.name}</span>
                      {cat.children.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cat.children.length}</span>
                      )}
                    </div>
                    {isActive && cat.children.length > 0 && (
                      <div style={{ paddingLeft: 20, marginTop: 2 }}>
                        {cat.children.map(child => (
                          <div key={child.id} onClick={() => handleNodeClick(child.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                            borderRadius: 6, color: selectedNode?.id === child.id ? 'var(--accent)' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: 11, transition: 'all 0.15s',
                          }}>
                            <span>{child.icon || '🔹'}</span>
                            <span>{child.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 标签云 */}
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            <h3 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
              🏷️ 标签云
            </h3>
            <TagCloud tags={tagCloud} loading={tagLoading} onTagClick={handleTagClick} activeTag={activeTag} />
          </div>

          {/* 孤立节点 */}
          {orphanNodes.length > 0 && viewMode === 'graph' && (
            <div className="glass-card" style={{ padding: 14 }}>
              <h3 style={{ fontSize: 12, color: '#ffbd2e', marginBottom: 8, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                ⚠️ 孤立节点 ({orphanNodes.length})
              </h3>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: "'Courier New', monospace" }}>
                这些节点未与其他知识建立连接
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {orphanNodes.slice(0, 8).map(n => (
                  <div key={n.id} onClick={() => handleNodeClick(n.id)} style={{
                    padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
                  }}>
                    <span>{n.icon || '🔹'}</span>
                    <span>{n.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ====== 右侧主内容 ====== */}
        <div style={{ flex: 1, minWidth: 400 }}>
          {/* 搜索 */}
          <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="🔍 搜索知识库 — 支持关键词、概念、实体..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                boxSizing: 'border-box', fontFamily: "'Courier New', monospace",
              }}
            />
            <button onClick={handleSearch} style={{
              padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: 'var(--accent)', color: '#000', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Courier New', monospace",
            }}>
              搜索
            </button>
          </div>

          {/* 搜索结果 */}
          {searchResults && searchResults.nodes.length > 0 && (
            <div className="glass-card" style={{ padding: 14, marginBottom: 14, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ fontSize: 13, color: 'var(--accent)', margin: 0, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                  🔍 搜索结果 ({searchResults.nodes.length + searchResults.articles.length})
                </h3>
                <button onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {searchResults.nodes.map(node => (
                  <div key={node.id} onClick={() => { handleNodeClick(node.id); setSearchResults(null); }} style={{
                    padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, transition: 'all 0.15s',
                  }}>
                    <span>{node.icon || '🔹'}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{node.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {node.type === 'ENTITY' ? '实体' : node.type === 'CONCEPT' ? '概念' : node.type}
                    </span>
                  </div>
                ))}
                {searchResults.articles.map((article: any) => (
                  <div key={article.id} style={{
                    padding: '7px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                  }}>
                    <span>📄</span>
                    <span style={{ color: 'var(--text-primary)' }}>{article.title}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>文章</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 节点详情 + 反向链接 */}
          {selectedNode && (
            <div className="glass-card" style={{ padding: 18, marginBottom: 14, borderLeft: '3px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{selectedNode.icon || '🔹'}</span>
                  <h3 style={{ fontSize: 15, color: 'var(--text-primary)', margin: 0, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                    {selectedNode.name}
                  </h3>
                  <span style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'var(--accent-dim)', color: 'var(--accent)',
                    fontFamily: "'Courier New', monospace",
                  }}>
                    {selectedNode.type === 'ENTITY' ? '实体' : selectedNode.type === 'CONCEPT' ? '概念' : selectedNode.type}
                  </span>
                </div>
                <button onClick={() => { setSelectedNode(null); setRelatedNodes([]); setShowBacklinks(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
                  ✕
                </button>
              </div>

              {selectedNode.description && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {selectedNode.description}
                </p>
              )}

              {/* 关联节点 */}
              {relatedNodes.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                    🔗 图谱关联 ({relatedNodes.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {relatedNodes.map((rel: any, idx: number) => (
                      <span key={idx} onClick={() => handleNodeClick(rel.id)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                        borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)',
                        fontSize: 11, cursor: 'pointer', border: '1px solid var(--border-light)',
                        fontFamily: "'Courier New', monospace", transition: 'all 0.15s',
                      }}>
                        <span>{rel.icon || '🔹'}</span>
                        <span>{rel.name}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                          {relationLabels[rel.relation] || rel.relation}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 反向链接 — Obsidian 核心特性 */}
              {showBacklinks && (
                <div>
                  <h4 style={{ fontSize: 11, color: 'var(--matrix-green)', marginBottom: 6, fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                    🔙 反向链接 ({backlinksForNode.length})
                    <span style={{ fontWeight: 400, fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>
                      （哪些笔记通过 [[{selectedNode.name}]] 引用了此节点）
                    </span>
                  </h4>
                  {backlinksForNode.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {backlinksForNode.map(note => (
                        <div key={note.id} style={{
                          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                          background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.15)',
                          fontSize: 12, color: 'var(--text-primary)',
                        }}>
                          <span style={{ fontWeight: 600 }}>📝 {note.title}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 10 }}>
                            {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 0', fontFamily: "'Courier New', monospace" }}>
                      暂无笔记引用此节点。在笔记中使用 <code>[[{selectedNode.name}]]</code> 建立反向链接。
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 视图主体 */}
          {viewMode === 'graph' && (
            <KnowledgeGraph data={graphData} loading={graphLoading} onNodeClick={handleNodeClick} category={selectedCategory} />
          )}

          {viewMode === 'para' && renderParaView()}

          {viewMode === 'list' && (
            <div>
              {categories.map(cat => (
                <div key={cat.id} style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Courier New', monospace" }}>
                    <span>{cat.icon || '📁'}</span>
                    {cat.name}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{cat.description}</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                    {cat.children.map(child => (
                      <div key={child.id} onClick={() => handleNodeClick(child.id)} className="glass-card" style={{
                        padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 22 }}>{child.icon || '🔹'}</span>
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{child.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {child.type === 'ENTITY' ? '实体' : '概念'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 我的笔记面板 — 仅在图谱和列表模式显示 */}
          {viewMode !== 'para' && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 12, fontFamily: "'Courier New', monospace" }}>
                📝 我的笔记 ({notes.length})
              </h3>
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                  <div style={{ fontFamily: "'Courier New', monospace" }}>暂无笔记，点击「新建笔记」开始记录</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notes.map(note => {
                    const links = parseWikiLinks(note.title + ' ' + note.content);
                    return (
                      <div key={note.id} className="glass-card" style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{note.title}</div>
                          <button onClick={() => handleDelete(note.id)} title="删除" style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
                            padding: '2px 6px', opacity: 0.5,
                          }}>
                            🗑️
                          </button>
                        </div>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 8 }}
                          dangerouslySetInnerHTML={{ __html: renderContentWithLinks(note.content) }}
                        />
                        {/* 双向链接显示 */}
                        {links.length > 0 && (
                          <div style={{ marginBottom: 8, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>🔗</span>
                            {links.slice(0, 8).map((l, i) => (
                              <span
                                key={i}
                                onClick={(e) => { e.stopPropagation(); handleWikiLinkClick(l.target); }}
                                style={{
                                  fontSize: 10, padding: '2px 8px', borderRadius: 10,
                                  background: 'rgba(57,255,20,0.08)', color: 'var(--matrix-green)',
                                  cursor: 'pointer', fontFamily: "'Courier New', monospace",
                                  border: '1px solid rgba(57,255,20,0.2)',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {l.display}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {note.tags.map((tag, i) => (
                              <span key={i} style={{
                                fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.06)',
                                color: 'var(--text-muted)', borderRadius: 10,
                              }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-glass)', backdropFilter: 'blur(var(--blur-lg))', color: 'var(--matrix-green)',
          padding: '12px 24px', borderRadius: 'var(--radius-lg)', fontSize: 13, fontWeight: 700,
          zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 20px var(--accent-glow)',
          border: '1px solid var(--border-accent)', fontFamily: "'Courier New', monospace",
          animation: 'goalCardEnter 0.3s cubic-bezier(0.4,0,0.2,1) both',
        }}>
          ✅ 笔记保存成功！+5 分
        </div>
      )}
    </div>
  );
}