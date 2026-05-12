import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as db from '../lib/db';
import { blogApi } from '../lib/api';

const CATEGORIES = [
  { id: 'all', name: '全部', color: '#00f0ff' },
  { id: 'growth', name: '成长', color: '#00f0ff' },
  { id: 'tech', name: '技术', color: '#ff00aa' },
  { id: 'life', name: '生活', color: '#00ff88' },
  { id: 'reading', name: '读书', color: '#ffaa00' },
  { id: 'thinking', name: '思考', color: '#aa00ff' },
];

const SORT_OPTIONS = [
  { id: 'latest', name: '最新发布', icon: '🕐' },
  { id: 'popular', name: '最多浏览', icon: '👁️' },
  { id: 'liked', name: '最多点赞', icon: '❤️' },
];

const CAT_COLORS: Record<string, string> = {
  growth: '#00f0ff', tech: '#ff00aa', life: '#00ff88', reading: '#ffaa00', thinking: '#aa00ff',
};

export function BlogPage() {
  const [posts, setPosts] = useState<db.BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [popularPosts, setPopularPosts] = useState<db.BlogPost[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPage(1);
    setPosts([]);
    loadPosts(1);
    loadPopularPosts();
  }, [selectedCategory, sortBy]);

  const convertPost = (post: any): db.BlogPost => ({
    ...post,
    tags: Array.isArray(post.tags)
      ? post.tags
      : typeof post.tags === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(post.tags);
              return Array.isArray(parsed) ? parsed : post.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            } catch {
              return post.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
            }
          })()
        : [],
    views: Number(post.views) || 0,
    likes: Number(post.likes) || 0,
    publishedAt: Number(post.publishedAt) || (typeof post.publishedAt === 'string' ? new Date(post.publishedAt).getTime() : Date.now()),
    updatedAt: Number(post.updatedAt) || (typeof post.updatedAt === 'string' ? new Date(post.updatedAt).getTime() : Date.now()),
  });

  const loadPosts = async (pageNum: number = page, append: boolean = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      let rawData: any;
      const params = { sort: sortBy, page: pageNum, limit: 6 };

      if (selectedCategory === 'all') {
        if (searchQuery.trim()) {
          rawData = await blogApi.search(searchQuery, params);
        } else {
          rawData = await blogApi.getAll(params);
        }
      } else {
        rawData = await blogApi.getByCategory(selectedCategory, params);
      }

      // 兼容新旧格式：新格式 { posts: [], pagination: {} }，旧格式 []
      let apiData: any[] = [];
      if (rawData && Array.isArray(rawData)) {
        apiData = rawData;
      } else if (rawData && rawData.posts && Array.isArray(rawData.posts)) {
        apiData = rawData.posts;
        // 处理分页信息
        if (rawData.pagination) {
          setTotalPages(rawData.pagination.totalPages || 1);
        }
      }

      const convertedPosts = apiData.map(convertPost);

      if (append) {
        setPosts(prev => [...prev, ...convertedPosts]);
      } else {
        setPosts(convertedPosts);
      }
    } catch (apiError) {
      console.warn('❌ API 加载失败，尝试 IndexedDB:', apiError);
      try {
        let data;
        if (selectedCategory === 'all') {
          data = searchQuery.trim() ? await db.searchBlogPosts(searchQuery) : await db.getAllBlogPosts();
        } else {
          data = await db.getBlogPostsByCategory(selectedCategory);
        }

        // 客户端排序
        if (sortBy === 'popular') {
          data.sort((a: any, b: any) => Number(b.views || 0) - Number(a.views || 0));
        } else if (sortBy === 'liked') {
          data.sort((a: any, b: any) => Number(b.likes || 0) - Number(a.likes || 0));
        }

        // 客户端分页
        const startIndex = (pageNum - 1) * 6;
        const endIndex = startIndex + 6;
        const paginatedData = data.slice(startIndex, endIndex).map(convertPost);

        if (append) {
          setPosts(prev => [...prev, ...paginatedData]);
        } else {
          setPosts(paginatedData);
        }
        setTotalPages(Math.ceil(data.length / 6));
      } catch (dbError) {
        console.error('❌ IndexedDB 也失败了:', dbError);
        if (!append) setPosts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadPopularPosts = async () => {
    try {
      const rawData: any = await blogApi.getPopular(4);
      let posts: any[] = [];
      if (Array.isArray(rawData)) {
        posts = rawData;
      } else if (rawData?.posts) {
        posts = rawData.posts;
      }
      setPopularPosts(posts.map(convertPost));
    } catch (error) {
      console.warn('⚠️ 热门文章加载失败:', error);
    }
  };

  const handleSearch = useCallback(() => {
    setPage(1);
    loadPosts(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, true);
  }, [page, totalPages, loadingMore, selectedCategory, sortBy]);

  // 无限滚动
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleLoadMore, loadingMore, page, totalPages]);

  return (
    <div style={{ padding: '0 0 40px' }}>
      <style>{`
        @media (max-width: 768px) {
          .blog-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .blog-search-container {
            flex-direction: column !important;
          }
          .blog-search-input {
            min-width: 100% !important;
            margin-bottom: 8px !important;
          }
          .blog-toolbar {
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 480px) {
          .blog-card {
            margin: 0 -8px;
            border-radius: 12px !important;
          }
          .blog-cover-img {
            height: 140px !important;
          }
          .blog-category-btn {
            font-size: 10px !important;
            padding: 4px 8px !important;
          }
          .sort-btn {
            font-size: 11px !important;
            padding: 5px 10px !important;
          }
        }

        /* 动画 */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .blog-card {
          animation: fadeInUp 0.4s ease-out forwards;
          opacity: 0;
        }

        .blog-card:nth-child(1) { animation-delay: 0s; }
        .blog-card:nth-child(2) { animation-delay: 0.05s; }
        .blog-card:nth-child(3) { animation-delay: 0.1s; }
        .blog-card:nth-child(4) { animation-delay: 0.15s; }
        .blog-card:nth-child(5) { animation-delay: 0.2s; }
        .blog-card:nth-child(6) { animation-delay: 0.25s; }

        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 240, 255, 0.15);
          transition: all 0.3s ease;
        }

        .popular-card {
          transition: all 0.3s ease;
        }

        .popular-card:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 16px rgba(255, 0, 170, 0.2);
        }

        .sort-btn {
          transition: all 0.2s ease;
        }

        .sort-btn:hover {
          background: rgba(0, 240, 255, 0.15) !important;
          border-color: #00f0ff !important;
        }

        .category-btn {
          transition: all 0.2s ease;
        }

        .category-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>📝 博客</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>记录成长、分享知识</p>
      </div>

      {/* 搜索 + 排序工具栏 */}
      <div className="blog-toolbar" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="blog-search-input" style={{ flex: 1, minWidth: '200px' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="🔍 搜索文章..."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '14px',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#00f0ff'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
          />
        </div>

        {/* 排序按钮组 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {SORT_OPTIONS.map(sort => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id)}
              className="sort-btn"
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${sortBy === sort.id ? '#00f0ff' : 'rgba(255,255,255,0.12)'}`,
                background: sortBy === sort.id ? 'rgba(0,240,255,0.12)' : 'transparent',
                color: sortBy === sort.id ? '#00f0ff' : 'rgba(255,255,255,0.6)',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: sortBy === sort.id ? '600' : '400'
              }}
            >
              {sort.icon} {sort.name}
            </button>
          ))}
        </div>

        <Link
          to="/blog/new"
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: '1px solid #00f0ff',
            color: '#00f0ff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,240,255,0.1)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ✚ 写文章
        </Link>
      </div>

      {/* 分类标签 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className="category-btn"
            style={{
              padding: '6px 14px',
              borderRadius: '18px',
              border: 'none',
              background: selectedCategory === cat.id ? cat.color : 'rgba(255,255,255,0.06)',
              color: selectedCategory === cat.id ? '#000' : 'rgba(255,255,255,0.5)',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: selectedCategory === cat.id ? '600' : '400',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 热门推荐 */}
      {popularPosts.length > 0 && page === 1 && !searchQuery && (
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', borderLeft: '3px solid #ff00aa' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#ff00aa', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🔥 热门推荐
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {popularPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="popular-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  gap: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'rgba(255,0,170,0.6)', minWidth: '20px' }}>
                  #{index + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.title}
                  </h4>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    👁 {post.views} · ❤️ {post.likes}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 文章列表 */}
      {loading && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p>加载中...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>暂无文章</p>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}>
            {searchQuery ? `未找到与 "${searchQuery}" 相关的文章` : '还没有发布任何文章'}
          </p>
          {!searchQuery && (
            <Link
              to="/blog/new"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                borderRadius: '20px',
                background: 'rgba(0,240,255,0.1)',
                border: '1px solid #00f0ff',
                color: '#00f0ff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ✚ 写第一篇文章
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }} className="blog-grid">
            {posts.map((post) => (
              <div
                key={post.id || post.slug}
                className="glass-card blog-card"
                style={{ overflow: 'hidden' }}
              >
                <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.coverImage && (
                    <div
                      className="blog-cover-img"
                      style={{
                        height: '160px',
                        background: `url(${post.coverImage}) center/cover`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        className="blog-category-btn"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          background: CAT_COLORS[post.category] || '#00f0ff',
                          color: '#000'
                        }}
                      >
                        {post.category}
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '16px 18px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px', lineHeight: 1.4 }}>
                      {post.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.6,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        marginBottom: '12px'
                      }}
                    >
                      {post.excerpt}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.35)',
                        flexWrap: 'wrap',
                        gap: '4px',
                        alignItems: 'center'
                      }}
                    >
                      <span>{new Date(post.publishedAt).toLocaleDateString('zh-CN')}</span>
                      <span style={{ display: 'flex', gap: '8px' }}>
                        <span>👁 {post.views}</span>
                        <span>❤️ {post.likes}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* 加载更多触发器 */}
          {page < totalPages && (
            <div ref={loadMoreRef} style={{ textAlign: 'center', padding: '30px 20px' }}>
              {loadingMore ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span> 加载更多...
                </div>
              ) : (
                <button
                  onClick={handleLoadMore}
                  style={{
                    padding: '10px 28px',
                    borderRadius: '20px',
                    border: '1px solid rgba(0,240,255,0.3)',
                    background: 'rgba(0,240,255,0.08)',
                    color: '#00f0ff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,240,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,240,255,0.08)'}
                >
                  ↓ 加载更多 ({page}/{totalPages})
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
