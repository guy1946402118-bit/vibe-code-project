import { useEffect, useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { api } from '../lib/api';

interface BlogPost { id: string; title: string; slug: string; excerpt: string; isPublished: boolean; views: number; }
interface User { id: string; name: string; points: number; role: string; }

export function CmsPage() {
  const { currentUser, isAdmin } = useUserStore();
  const [tab, setTab] = useState<'users' | 'blog'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [u, p] = await Promise.all([
        api.get<User[]>('/cms/users'),
        api.get<{ posts: BlogPost[] }>('/cms/posts'),
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setPosts(Array.isArray(p) ? p : (p?.posts || []));
    } catch (e: any) {
      setError(e.message || '加载失败，请确认服务器运行中且拥有管理员权限');
    }
    setLoading(false);
  };

  const createUser = async (name: string) => {
    if (!name.trim()) return;
    try { await api.post('/cms/users', { name: name.trim() }); loadData(); } catch (e: any) { alert(e.message || '创建失败'); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('确定删除该用户？此操作不可撤销')) return;
    try { await api.delete(`/cms/users/${id}`); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const updatePoints = async (userId: string, points: number) => {
    try { await api.put(`/cms/users/${userId}`, { points }); loadData(); } catch (e) { console.error(e); }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try { await api.put(`/cms/users/${userId}`, { role: newRole }); loadData(); } catch (e: any) { alert(e.message || '操作失败'); }
  };

  const deletePost = async (id: string) => {
    if (!confirm('确定删除该文章？')) return;
    try { await api.delete(`/cms/posts/${id}`); loadData(); } catch (e: any) { alert(e.message || '删除失败'); }
  };

  const togglePublish = async (post: BlogPost) => {
    try { await api.put(`/cms/posts/${post.id}`, { isPublished: !post.isPublished }); loadData(); } catch (e) { console.error(e); }
  };

  if (!isAdmin) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ padding: '40px', background: 'rgba(20, 20, 35, 0.9)', borderRadius: '14px', border: '1px solid rgba(255, 100, 100, 0.3)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
        <h2 style={{ color: '#ff6b6b', marginBottom: '8px' }}>无权限</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>需要管理员权限</p>
      </div>
    </div>;
  }

  const ROLES: Record<string, string> = { ADMIN: '管理员', USER: '用户' };

  return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#00f0ff', marginBottom: '4px' }}>⚙️ 管理后台</h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{currentUser?.name} 欢迎回来</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['users', 'blog'].map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: tab === t ? '#00f0ff' : 'rgba(255,255,255,0.06)', color: tab === t ? '#000' : 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            {t === 'users' ? '👥 用户管理' : '📄 博客管理'}
          </button>
        ))}
        <button onClick={loadData} style={{ padding: '10px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>🔄 刷新</button>
      </div>

      {loading ? <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px' }}>加载中...</div> :
      error ? (
        <div style={{ padding: '30px', background: 'rgba(255,68,68,0.08)', borderRadius: '12px', border: '1px solid rgba(255,68,68,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '16px', fontFamily: "'Courier New', monospace" }}>{error}</div>
          <button onClick={loadData} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #ff6b6b', background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', fontSize: '13px', cursor: 'pointer', fontFamily: "'Courier New', monospace" }}>重试</button>
        </div>
      ) :
        tab === 'users' ? (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <input placeholder="输入用户名回车创建" onKeyDown={(e: any) => { if (e.key === 'Enter') { createUser(e.target.value); e.target.value = ''; } }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '10px', padding: '10px 12px', background: 'rgba(0,240,255,0.04)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', marginBottom: '8px' }}>
              <span>用户名</span><span>积分</span><span>角色</span><span>操作</span>
            </div>
            {users.map(u => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '10px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '13px' }}>{u.name}</span>
                <input type="number" defaultValue={u.points} onBlur={e => updatePoints(u.id, parseInt(e.target.value) || 0)}
                  style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px' }} />
                <span style={{ fontSize: '12px', color: u.role === 'ADMIN' ? '#ff00aa' : 'rgba(255,255,255,0.4)' }}>{ROLES[u.role] || u.role || '用户'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => toggleRole(u.id, u.role || 'USER')} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '11px', cursor: 'pointer' }}>{u.role === 'ADMIN' ? '降级' : '提升'}</button>
                  <button onClick={() => deleteUser(u.id)} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(255,68,68,0.3)', background: 'transparent', color: '#ff4444', fontSize: '11px', cursor: 'pointer' }}>删除</button>
                </div>
              </div>
            ))}
            {users.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '30px' }}>暂无用户</div>}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: '10px', padding: '10px 12px', background: 'rgba(0,240,255,0.04)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', marginBottom: '8px' }}>
              <span>标题</span><span>阅读</span><span>状态</span><span>操作</span>
            </div>
            {posts.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: '10px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontSize: '13px' }}>{p.title}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{p.views || 0}</span>
                <span style={{ fontSize: '12px', color: p.isPublished ? '#00ff88' : '#ff4444' }}>{p.isPublished ? '已发布' : '草稿'}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => togglePublish(p)} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '11px', cursor: 'pointer' }}>{p.isPublished ? '下架' : '发布'}</button>
                  <button onClick={() => deletePost(p.id)} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(255,68,68,0.3)', background: 'transparent', color: '#ff4444', fontSize: '11px', cursor: 'pointer' }}>删除</button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '30px' }}>暂无文章</div>}
          </div>
        )}
    </div>
  );
}