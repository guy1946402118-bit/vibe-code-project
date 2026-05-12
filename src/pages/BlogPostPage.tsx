import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import * as db from '../lib/db';
import { blogApi, type Comment } from '../lib/api';
import { useUserStore } from '../stores/userStore';

const CAT_COLORS: Record<string, string> = {
  growth: '#00f0ff', tech: '#ff00aa', life: '#00ff88', reading: '#ffaa00', thinking: '#aa00ff',
};

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useUserStore();
  const [post, setPost] = useState<db.BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<db.BlogPost[]>([]);

  // 评论系统
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // 收藏系统
  const [isFavorited, setIsFavorited] = useState(false);
  const [showFavoritesToast, setShowFavoritesToast] = useState(false);

  // 订阅系统
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    loadPost();
    loadSubscriberCount();
    window.scrollTo(0, 0);
  }, [slug]);

  const loadPost = async () => {
    if (!slug) return;
    setLoading(true);

    try {
      const apiPost = await blogApi.getBySlug(slug);

      const converted: db.BlogPost = {
        id: apiPost.id,
        title: apiPost.title,
        slug: apiPost.slug,
        excerpt: apiPost.excerpt,
        content: apiPost.content,
        coverImage: apiPost.coverImage,
        category: apiPost.category,
        tags: Array.isArray(apiPost.tags) ? apiPost.tags : (typeof apiPost.tags === 'string' ? (() => { try { const parsed = JSON.parse(apiPost.tags); return Array.isArray(parsed) ? parsed : [apiPost.tags]; } catch { return apiPost.tags.split(',').map((t: string) => t.trim()).filter(Boolean); } })() : []),
        author: apiPost.author,
        publishedAt: typeof apiPost.publishedAt === 'number' ? apiPost.publishedAt : new Date(apiPost.publishedAt).getTime(),
        updatedAt: typeof apiPost.updatedAt === 'number' ? apiPost.updatedAt : new Date(apiPost.updatedAt).getTime(),
        views: typeof apiPost.views === 'number' ? apiPost.views : Number(apiPost.views) || 0,
        likes: typeof apiPost.likes === 'number' ? apiPost.likes : Number(apiPost.likes) || 0,
        isPublished: apiPost.isPublished,
      };

      setPost(converted);
      setLikesCount(converted.likes);

      // 加载相关文章
      loadRelatedPosts(converted.category, converted.id);

      // 加载评论
      loadComments(converted.id);

      // 检查收藏状态
      checkFavoriteStatus(converted.id);
    } catch (apiError) {
      console.warn('Failed to fetch from API:', apiError);
      try {
        const data = await db.getBlogPostBySlug(slug);
        setPost(data || null);
        if (data) {
          setLikesCount(data.likes);
          loadRelatedPosts(data.category, data.id);
          loadComments(data.id);
        }
      } catch (dbError) {
        console.error('Failed to fetch from IndexedDB:', dbError);
        setPost(null);
      }
    }
    setLoading(false);
  };

  const loadComments = async (postId: string) => {
    try {
      const data = await blogApi.getComments(postId);
      setComments(data);
    } catch (error) {
      console.warn('Failed to load comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!post || !commentText.trim()) return;

    try {
      const newComment = await blogApi.createComment(post.id, commentText.trim(), currentUser?.name);
      setComments(prev => [...prev, newComment]);
      setCommentText('');

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      alert('评论失败: ' + (error.message || '请先登录'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定删除这条评论？')) return;

    try {
      await blogApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const checkFavoriteStatus = async (postId: string) => {
    try {
      const result = await blogApi.isFavorited(postId);
      setIsFavorited(result.isFavorited);
    } catch (error) {
      // 未登录时忽略
    }
  };

  const toggleFavorite = async () => {
    if (!post || !currentUser) {
      alert('请先登录后再收藏');
      return;
    }

    try {
      if (isFavorited) {
        await blogApi.removeFavorite(post.id);
        setIsFavorited(false);
        setShowFavoritesToast(true);
        setTimeout(() => setShowFavoritesToast(false), 2000);
      } else {
        await blogApi.addFavorite(post.id);
        setIsFavorited(true);
        setShowFavoritesToast(true);
        setTimeout(() => setShowFavoritesToast(false), 2000);
      }
    } catch (error: any) {
      alert('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const loadRelatedPosts = async (category: string, excludeId: string) => {
    try {
      const result: any = await blogApi.getRelated(category, excludeId, 3);
      const posts = (result.posts || result || []).map((p: any) => ({
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : [],
        views: Number(p.views) || 0,
        likes: Number(p.likes) || 0,
        publishedAt: Number(p.publishedAt) || 0,
      }));
      setRelatedPosts(posts);
    } catch (error) {
      console.warn('Failed to load related posts:', error);
    }
  };

  const loadSubscriberCount = async () => {
    try {
      const result = await blogApi.getSubscriberCount();
      setSubscriberCount(result.count);
    } catch (error) {
      // ignore
    }
  };

  const handleSubscribe = async () => {
    if (!subscribeEmail.includes('@')) {
      alert('请输入有效的邮箱地址');
      return;
    }

    try {
      await blogApi.subscribe(subscribeEmail);
      setSubscribed(true);
      setSubscriberCount(prev => prev + 1);
    } catch (error: any) {
      alert(error.error || '订阅失败');
    }
  };

  const handleDelete = async () => {
    if (!post || !confirm('确定删除这篇文章？')) return;
    try {
      await blogApi.delete(post.id);
      navigate('/blog');
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const handleLike = async () => {
    if (!post) return;
    if (hasLiked) {
      alert('您已经点过赞了');
      return;
    }
    try {
      const result = await blogApi.like(post.id);
      setLikesCount(result.likes);
      setHasLiked(true);
    } catch (error: any) {
      alert('点赞失败: ' + (error.message || '未知错误'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '40vh', color: 'rgba(255,255,255,0.4)', gap: '16px' }}>
        <div style={{ fontSize: '48px', animation: 'pulse 2s ease-in-out infinite' }}>📝</div>
        <span>加载中...</span>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }`}</style>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
        <div style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>文章未找到</div>
        <Link to="/blog" style={{ color: '#00f0ff', textDecoration: 'none' }}>← 返回博客</Link>
      </div>
    );
  }

  const accent = CAT_COLORS[post.category] || '#00f0ff';

  return (
    <div style={{ padding: '0 0 40px' }}>
      <style>{`
        .md-body h1,.md-body h2,.md-body h3 { color: #00f0ff; margin-top: 22px; margin-bottom: 10px; transition: color 0.2s; }
        .md-body h1:hover,.md-body h2:hover,.md-body h3:hover { color: ${accent}; }
        .md-body p { margin-bottom: 14px; line-height: 1.8; color: rgba(255,255,255,0.8); }
        .md-body code { background: rgba(0,240,255,0.12); padding: 2px 8px; border-radius: 4px; color: #ff00aa; font-size: 0.9em; }
        .md-body pre { background: rgba(0,0,0,0.7); padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid rgba(0,240,255,0.2); position: relative; }
        .md-body pre code { background: none; color: #00ff88; font-size: 13px; }
        .md-body a { color: #00f0ff; text-decoration: none; transition: all 0.2s; }
        .md-body a:hover { color: ${accent}; text-decoration: underline; }
        .md-body blockquote { border-left: 3px solid ${accent}; padding: 8px 14px; margin: 12px 0; background: rgba(0,0,0,0.3); border-radius: 0 8px 8px 0; }
        .md-body img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); transition: transform 0.3s; }
        .md-body img:hover { transform: scale(1.02); }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.1); }
        }

        @keyframes toastSlide {
          0% { opacity: 0; transform: translateY(-20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }

        .blog-post-container { animation: fadeInUp 0.5s ease-out; }
        .blog-post-header { animation: fadeInUp 0.5s ease-out 0.1s both; }
        .blog-post-cover { animation: fadeInUp 0.5s ease-out 0.2s both; }
        .blog-post-content { animation: fadeInUp 0.5s ease-out 0.3s both; }

        .like-btn:hover:not(:disabled) { animation: heartBeat 0.6s ease-in-out; }
        .like-btn.liked { animation: heartBeat 0.6s ease-in-out; background: rgba(255,0,170,0.25) !important; border-color: #ff00aa !important; color: #ff00aa !important; }

        .related-card { animation: slideInRight 0.4s ease-out both; transition: all 0.3s ease; }
        .related-card:nth-child(1) { animation-delay: 0s; }
        .related-card:nth-child(2) { animation-delay: 0.1s; }
        .related-card:nth-child(3) { animation-delay: 0.2s; }
        .related-card:hover { transform: translateY(-4px) translateX(4px); box-shadow: 0 8px 24px ${accent}33; border-color: ${accent}66 !important; }

        .comment-item { transition: all 0.2s ease; }
        .comment-item:hover { background: rgba(255,255,255,0.03); }

        .toast-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 9999;
          animation: toastSlide 3s ease-in-out forwards;
        }

        @media (max-width: 768px) {
          .blog-post-container { margin: 0 -8px !important; border-radius: 12px !important; }
          .blog-post-header { padding: 16px !important; }
          .blog-post-content { padding: 16px !important; font-size: 14px !important; line-height: 1.7 !important; }
          .blog-post-cover { height: 180px !important; }
        }
        @media (max-width: 480px) {
          .blog-breadcrumb { flex-wrap: wrap !important; gap: 4px !important; font-size: 11px !important; }
          .blog-tag { padding: 2px 8px !important; font-size: 10px !important; }
          .blog-action-btn { padding: 6px 12px !important; font-size: 12px !important; }
          .related-posts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Toast 通知 */}
      {showFavoritesToast && (
        <div className="toast-notification glass-card" style={{
          background: isFavorited ? 'rgba(0,240,255,0.15)' : 'rgba(255,68,68,0.15)',
          border: `1px solid ${isFavorited ? '#00f0ff' : '#ff4444'}`,
          color: isFavorited ? '#00f0ff' : '#ff4444',
        }}>
          {isFavorited ? '✅ 已添加到收藏夹' : '❌ 已从收藏夹移除'}
        </div>
      )}

      {/* 面包屑导航 */}
      <div className="blog-breadcrumb" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '18px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.4)',
        flexWrap: 'wrap',
        animation: 'fadeInUp 0.4s ease-out'
      }}>
        <Link to="/blog" style={{ color: '#00f0ff', textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
        >
          ← 返回博客
        </Link>
        <span>/</span>
        <span>{post.category}</span>
        <span>/</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.title}
        </span>
      </div>

      {/* 文章主体 */}
      <article className="glass-card blog-post-container" style={{ overflow: 'hidden' }}>
        {/* 文章头部信息 */}
        <div className="blog-post-header" style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${accent}20`,
          background: `linear-gradient(135deg, ${accent}08 0%, transparent 100%)`
        }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              background: accent,
              color: '#000',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onClick={() => navigate(`/blog?category=${post.category}`)}
            >
              {post.category.toUpperCase()}
            </span>
            {post.tags.slice(0, 5).map(t => (
              <span key={t} className="blog-tag" style={{
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}22`; e.currentTarget.style.color = accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                #{t}
              </span>
            ))}
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', marginBottom: '10px', lineHeight: 1.4, letterSpacing: '-0.3px' }}>
            {post.title}
          </h1>

          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>📅 {new Date(post.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>✍️ {post.author}</span>
            <span>👁 {post.views}</span>
            <span>💬 {comments.length}</span>
          </div>
        </div>

        {/* 封面图 */}
        {post.coverImage && (
          <div className="blog-post-cover" style={{
            height: '280px',
            background: `linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%), url(${post.coverImage}) center/cover`,
            position: 'relative',
            overflow: 'hidden'
          }} />
        )}

        {/* Markdown 内容 */}
        <div className="blog-post-content" style={{ padding: '28px 24px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.9, fontSize: '15px' }}>
          <div className="md-body"><ReactMarkdown>{post.content}</ReactMarkdown></div>
        </div>

        {/* 底部操作栏 */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleLike} disabled={hasLiked}
              className={`blog-action-btn like-btn ${hasLiked ? 'liked' : ''}`}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${hasLiked ? '#ff00aa' : 'rgba(255,255,255,0.1)'}`,
                background: hasLiked ? 'rgba(255,0,170,0.2)' : 'transparent',
                color: hasLiked ? '#ff00aa' : 'rgba(255,255,255,0.5)',
                cursor: hasLiked ? 'default' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
            >
              <span style={{ fontSize: '16px' }}>{hasLiked ? '❤️' : '🤍'}</span>
              <span>{likesCount}</span>
            </button>

            <button onClick={toggleFavorite}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${isFavorited ? '#ffaa00' : 'rgba(255,255,255,0.1)'}`,
                background: isFavorited ? 'rgba(255,170,0,0.2)' : 'transparent',
                color: isFavorited ? '#ffaa00' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              <span>{isFavorited ? '⭐' : '☆'}</span>
              <span>{isFavorited ? '已收藏' : '收藏'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentUser && (isAdmin || currentUser.name === post.author) && (
              <button onClick={handleDelete} className="blog-action-btn"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,68,68,0.3)',
                  background: 'transparent',
                  color: '#ff4444',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                🗑️ 删除
              </button>
            )}
            <button onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="blog-action-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid rgba(0,240,255,0.3)',
                background: 'transparent',
                color: '#00f0ff',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              🔗 分享
            </button>
          </div>
        </div>
      </article>

      {/* 💬 评论区 */}
      <div style={{ marginTop: '32px', animation: 'fadeInUp 0.5s ease-out 0.4s both' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💬 评论 ({comments.length})
        </h3>

        {/* 评论输入框 */}
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder={currentUser ? "写下你的评论..." : "登录后才能评论"}
              disabled={!currentUser}
              rows={3}
              maxLength={500}
              style={{
                flex: 1,
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                opacity: currentUser ? 1 : 0.6
              }}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || !currentUser}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #00f0ff',
                background: commentText.trim() && currentUser ? 'rgba(0,240,255,0.15)' : 'transparent',
                color: commentText.trim() && currentUser ? '#00f0ff' : 'rgba(255,255,255,0.3)',
                cursor: commentText.trim() && currentUser ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              发送
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            <span>{commentText.length}/500</span>
            {!currentUser && <span><Link to="/login" style={{ color: '#00f0ff' }}>登录</Link> 后评论</span>}
            {currentUser && <span>Ctrl+Enter 快速发送</span>}
          </div>
        </div>

        {/* 评论列表 */}
        {comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.map((comment) => (
              <div key={comment.id} className="glass-card comment-item" style={{
                padding: '14px 18px',
                borderRadius: '8px',
                borderLeft: `3px solid ${accent}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>{comment.author}</strong>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    {(currentUser?.name === comment.author || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: '#ff4444',
                          cursor: 'pointer',
                          fontSize: '11px',
                          transition: 'all 0.2s'
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '14px' }}>
                  {comment.content}
                </p>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>💬</div>
            <p>暂无评论，来发表第一条吧！</p>
          </div>
        )}
      </div>

      {/* 📚 相关文章推荐 */}
      {relatedPosts.length > 0 && (
        <div style={{ marginTop: '32px', animation: 'fadeInUp 0.5s ease-out 0.5s both' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📚</span>
            <span>相关阅读</span>
          </h3>
          <div className="related-posts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {relatedPosts.map((relatedPost) => (
              <Link key={relatedPost.id} to={`/blog/${relatedPost.slug}`}
                className="glass-card related-card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {relatedPost.coverImage && (
                  <div style={{
                    height: '140px',
                    background: `linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.7) 100%), url(${relatedPost.coverImage}) center/cover`,
                    position: 'relative'
                  }}>
                    <span style={{
                      position: 'absolute', bottom: '8px', left: '8px',
                      padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600',
                      background: CAT_COLORS[relatedPost.category] || accent, color: '#000'
                    }}>
                      {relatedPost.category}
                    </span>
                  </div>
                )}
                <div style={{ padding: '14px 16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', marginBottom: '6px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {relatedPost.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '8px' }}>
                    {relatedPost.excerpt}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    <span>{new Date(relatedPost.publishedAt).toLocaleDateString('zh-CN')}</span>
                    <span style={{ display: 'flex', gap: '8px' }}>
                      <span>👁 {relatedPost.views}</span>
                      <span>❤️ {relatedPost.likes}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 📧 订阅区域 */}
      <div className="glass-card" style={{
        marginTop: '32px',
        padding: '24px',
        background: `linear-gradient(135deg, ${accent}08 0%, rgba(0,0,0,0.3) 100%)`,
        border: `1px solid ${accent}22`,
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
          📧 订阅更新通知
        </h3>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
          获取最新文章推送，已有 {subscriberCount} 位订阅者
        </p>
        {subscribed ? (
          <div style={{ color: '#00ff88', fontSize: '16px', fontWeight: '600' }}>
            ✅ 订阅成功！感谢你的关注
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="email"
              value={subscribeEmail}
              onChange={e => setSubscribeEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.4)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSubscribe}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #00f0ff',
                background: 'rgba(0,240,255,0.15)',
                color: '#00f0ff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              订阅
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
