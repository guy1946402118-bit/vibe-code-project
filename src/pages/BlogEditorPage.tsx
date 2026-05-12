import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogApi } from '../lib/api';
import { useUserStore } from '../stores/userStore';
import { PublishReview } from '../components/PublishReview';

const CATEGORIES = [
  { id: 'growth', name: '成长', color: '#00f0ff' },
  { id: 'tech', name: '技术', color: '#ff00aa' },
  { id: 'life', name: '生活', color: '#00ff88' },
  { id: 'reading', name: '读书', color: '#ffaa00' },
  { id: 'thinking', name: '思考', color: '#aa00ff' },
];

export function BlogEditorPage() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('growth');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showReview, setShowReview] = useState(false);

  const generateSlug = (text: string) => {
    const baseSlug = text.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '');
    if (!baseSlug) return '';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${timestamp}${random}`;
  };

  const saveDraft = async () => {
    if (!title.trim() && !content.trim()) return;
    
    try {
      setAutoSaveStatus('保存中...');
      const slugValue = generateSlug(title) || `draft-${Date.now()}`;
      const draft = {
        title: title.trim() || '未命名',
        slug: slugValue,
        excerpt: excerpt.trim() || content.slice(0, 150) + '...',
        content: content.trim(),
        coverImage: coverImage.trim() || undefined,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author: currentUser?.name || '匿名用户',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
        isPublished: false,
      };
      
      if (draftId) {
        await blogApi.update(draftId, draft);
      } else {
        const saved = await blogApi.create(draft);
        setDraftId(saved.id);
      }
      setAutoSaveStatus('已自动保存');
      setTimeout(() => setAutoSaveStatus(''), 3000);
    } catch (error) {
      console.error('Auto save failed:', error);
      setAutoSaveStatus('自动保存失败');
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [title, content, excerpt, category, tags, coverImage, draftId]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { alert('请填标题和内容'); return; }
    setSaving(true);
    try {
      const postData = {
        title: title.trim(),
        slug: generateSlug(title),
        excerpt: excerpt.trim() || content.slice(0, 150) + '...',
        content: content.trim(),
        coverImage: coverImage.trim() || undefined,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        author: currentUser?.name || '匿名用户',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
        isPublished,
      };

      let post;
      if (draftId) {
        post = await blogApi.update(draftId, postData);
      } else {
        post = await blogApi.create(postData);
      }
      navigate(`/blog/${post.slug}`);
    } catch (error: any) {
      console.error('Failed to save blog post:', error);
      alert('保存失败: ' + (error.message || '未知错误'));
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <style>{`
        @media (max-width: 768px) {
          .blog-editor-container {
            margin: 0 -8px !important;
            border-radius: 12px !important;
            padding: 16px !important;
          }
          .editor-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .editor-input {
            font-size: 15px !important;
            padding: 12px !important;
          }
          .editor-textarea {
            min-height: 200px !important;
          }
        }
        @media (max-width: 480px) {
          .editor-header {
            padding: 14px !important;
          }
          .editor-title {
            font-size: 18px !important;
          }
          .btn-publish {
            padding: 12px !important;
            font-size: 13px !important;
          }
          .btn-cancel {
            padding: 12px 16px !important;
          }
        }
      `}</style>

      <div className="glass-card blog-editor-container" style={{ padding: '22px', marginBottom: '20px', borderLeft: '3px solid #00f0ff' }}>
        <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="editor-title" style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>✍️ 写文章</h2>
          {autoSaveStatus && (
            <span style={{ fontSize: '12px', color: autoSaveStatus.includes('失败') ? '#ff4444' : '#00ff88' }}>
              {autoSaveStatus}
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>支持 Markdown · 自动保存已开启</p>
      </div>

      <div className="glass-card blog-editor-container" style={{ padding: '22px' }}>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>标题</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="文章标题"
            className="editor-input"
            style={{ width: '100%', padding: '14px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '17px', fontWeight: '600', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>摘要（可选）</label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="文章摘要..."
            className="editor-input"
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

        <div className="editor-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>分类</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="editor-input"
              style={{ width: '100%', padding: '12px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '15px', boxSizing: 'border-box' }}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>标签（逗号分隔）</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2"
              className="editor-input"
              style={{ width: '100%', padding: '12px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>封面图（可选）</label>
          <input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..."
            className="editor-input"
            style={{ width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>内容（Markdown）</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={15} placeholder={`# 标题\n\n正文...\n\n\`\`\`js\nconsole.log('hello');\n\`\`\``}
            className="editor-input editor-textarea"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#00ff88', fontSize: '14px', fontFamily: 'monospace', lineHeight: 1.7, boxSizing: 'border-box', resize: 'vertical', minHeight: '300px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} style={{ accentColor: '#00f0ff', width: '18px', height: '18px' }} />
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{isPublished ? '立即发布' : '保存为草稿'}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => isPublished ? setShowReview(true) : handleSave()} disabled={saving}
            className="btn-publish"
            style={{ flex: 1, minWidth: '140px', padding: '16px', borderRadius: '12px', border: 'none', background: '#00f0ff', color: '#000', fontSize: '16px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '保存中...' : '发布文章'}
          </button>
          <button onClick={() => navigate('/blog')} 
            className="btn-cancel"
            style={{ padding: '16px 28px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '15px', cursor: 'pointer' }}>取消</button>
        </div>
      </div>

      {showReview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '640px', maxHeight: '90vh', overflow: 'auto' }}>
            <PublishReview
              title={title}
              content={content}
              onConfirm={() => { setShowReview(false); handleSave(); }}
              onCancel={() => setShowReview(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}