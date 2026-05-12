const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch {}
  }

  getToken(): string | null {
    if (!this.token) {
      try {
        this.token = localStorage.getItem('auth_token');
      } catch {}
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const err = JSON.parse(text);
        errorMsg = err.error || err.message || errorMsg;
      } catch {
        if (text) errorMsg += `: ${text}`;
      }
      throw new Error(errorMsg);
    }

    if (!text || text.trim() === '') {
      return null as T;
    }

    return JSON.parse(text);
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: any; isAdmin: boolean }>('/auth/login', { username, password }),
  loginUser: (name: string, password?: string) =>
    api.post<{ token: string; user: any }>('/auth/user/login', { name, password }),
  registerUser: (name: string, password?: string, email?: string, phone?: string) =>
    api.post<{ token: string; user: any }>('/auth/user/register', { name, password, email, phone }),
  register: (username: string, password: string) =>
    api.post<{ token: string; user: any }>('/auth/register', { username, password }),
  getMe: () => api.get<{ user: any; isAdmin: boolean }>('/auth/me'),
};

export const userApi = {
  getAll: () => api.get<User[]>('/users'),
  getRankings: () => api.get<User[]>('/users/rankings'),
  getMe: () => api.get<any>('/users/me'),
  updateMe: (data: Partial<User>) => api.put<any>('/users/me', data),
  updateProfile: (data: { avatar?: string; password?: string }) => api.put<any>('/users/me', data),
  register: (name: string) => api.post<any>('/users/register', { name }),
  login: (name: string) => api.post<any>('/users/login', { name }),
  getStats: () => api.get<{ totalUsers: number; activeUsers: number }>('/users/stats'),
  heartbeat: () => api.post('/users/heartbeat'),
  syncPoints: () => api.post('/users/sync-points'),
  getActiveGoals: () => api.get<any[]>('/goals/active'),
};

export const visitorApi = {
  getRecent: (limit = 20) => api.get<any[]>(`/visitors/recent?limit=${limit}`),
  getStats: () => api.get<any>('/visitors/stats'),
  clear: () => api.delete('/visitors/clear'),
};

export interface User {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  role?: string;
  createdAt?: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  category: string;
  points: number;
  timestamp: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  id: string;
  userId: string;
  name: string;
  pointsCost: number;
  redeemed: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface TrainingLog {
  id: string;
  userId: string;
  type: string;
  points: number;
  detail?: string;
  timestamp: string;
}

export const checkInApi = {
  getAll: (params?: { category?: string; startTime?: number; endTime?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return query ? api.get<CheckIn[]>(`/checkins?${query}`) : api.get<CheckIn[]>('/checkins');
  },
  create: (category: string) =>
    api.post<{ checkIn: CheckIn; totalPoints: number }>('/checkins', { category }),
  getToday: () => api.get<CheckIn[]>('/checkins/today'),
  getStats: () => api.get<{ totalCheckIns: number; totalPoints: number; streak: number }>('/checkins/stats'),
  getTodayCount: () => api.get<{ todayCount: number }>('/checkins/today-count'),
  getWeekly: () => api.get<{ day: string; points: number; count: number }[]>('/checkins/weekly'),
  getHeatmap: (year?: number) => api.get<Record<string, number>>(`/checkins/heatmap${year ? `?year=${year}` : ''}`),
};

export const noteApi = {
  getAll: () => api.get<Note[]>('/notes'),
  create: (title: string, content: string, tags?: string[]) =>
    api.post<Note>('/notes', { title, content, tags }),
  update: (id: string, data: Partial<Note>) => api.put<Note>(`/notes/${id}`, data),
  delete: (id: string) => api.delete<void>(`/notes/${id}`),
};

export const rewardApi = {
  getAll: () => api.get<Reward[]>('/rewards'),
  create: (name: string, pointsCost: number) =>
    api.post<Reward>('/rewards', { name, pointsCost }),
  redeem: (id: string) => api.post<{ success: boolean }>(`/rewards/${id}/redeem`),
  delete: (id: string) => api.delete<void>(`/rewards/${id}`),
};

export const reviewApi = {
  getAll: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return api.get<Review[]>(`/reviews${query}`);
  },
  create: (type: string, content: string) =>
    api.post<Review>('/reviews', { type, content }),
  delete: (id: string) => api.delete<void>(`/reviews/${id}`),
};

export const trainingApi = {
  getAll: (params?: { startTime?: number; endTime?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return query ? api.get<TrainingLog[]>(`/training?${query}`) : api.get<TrainingLog[]>('/training');
  },
  create: (type: string, points: number, detail?: string) =>
    api.post<TrainingLog>('/training', { type, points, detail }),
  getStats: () => api.get<{ total: number; byType: Record<string, number> }>('/training/stats'),
};

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[] | string;
  author: string;
  publishedAt: number | string;
  updatedAt: number | string;
  views: number | string;
  likes: number | string;
  isPublished: boolean;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export const blogApi = {
  getAll: (params?: { sort?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return api.get<BlogPost[]>(`/blog/posts${query}`);
  },
  getBySlug: (slug: string) => api.get<BlogPost>(`/blog/posts/${slug}`),
  getByCategory: (category: string, params?: { sort?: string; page?: number; limit?: number }) => {
    const baseParams = { category, ...params };
    const query = `?${new URLSearchParams(baseParams as any).toString()}`;
    return api.get<BlogPost[]>(`/blog/posts${query}`);
  },
  search: (query: string, params?: { sort?: string; page?: number; limit?: number }) => {
    const baseParams = { search: query, ...params };
    const queryString = `?${new URLSearchParams(baseParams as any).toString()}`;
    return api.get<BlogPost[]>(`/blog/posts${queryString}`);
  },
  getPopular: (limit = 5) => api.get<BlogPost[]>(`/blog/posts?sort=popular&limit=${limit}`),
  getRelated: (category: string, excludeId: string, limit = 3) =>
    api.get<BlogPost[]>(`/blog/posts?category=${category}&exclude=${excludeId}&limit=${limit}`),
  create: (data: Omit<BlogPost, 'id' | 'views' | 'likes'>) => api.post<BlogPost>('/blog/posts', data),
  update: (id: string, data: Partial<BlogPost>) => api.put<BlogPost>(`/blog/posts/${id}`, data),
  delete: (id: string) => api.delete<void>(`/blog/posts/${id}`),
  like: (id: string) => api.post<{ likes: number }>(`/blog/posts/${id}/like`),
  getCategories: () => api.get<BlogCategory[]>('/blog/categories'),
  createCategory: (data: BlogCategory) => api.post<BlogCategory>('/blog/categories', data),
  getTags: () => api.get<{ name: string; count: number }[]>('/blog/tags'),
  getStats: () => api.get<{ totalPosts: number; totalCategories: number }>('/blog/stats'),

  // 评论系统
  getComments: (postId: string) => api.get<Comment[]>('/blog/posts/' + postId + '/comments'),
  createComment: (postId: string, content: string, author?: string) =>
    api.post<Comment>('/blog/posts/' + postId + '/comments', { content, author }),
  deleteComment: (commentId: string) => api.delete<void>('/blog/comments/' + commentId),

  // 收藏系统
  getFavorites: () => api.get<BlogPost[]>('/blog/favorites'),
  addFavorite: (postId: string) => api.post<any>('/blog/posts/' + postId + '/favorite'),
  removeFavorite: (postId: string) => api.delete<any>('/blog/posts/' + postId + '/favorite'),
  isFavorited: (postId: string) => api.get<{ isFavorited: boolean }>(`/blog/posts/${postId}/isFavorited`),

  // 订阅系统
  subscribe: (email: string) => api.post<any>('/blog/subscribe', { email }),
  getSubscriberCount: () => api.get<{ count: number }>('/blog/subscribers/count'),

  // 高级搜索
  advancedSearch: (params: {
    query?: string;
    category?: string;
    author?: string;
    tags?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryString = `?${new URLSearchParams(params as any).toString()}`;
    return api.get<any>(`/blog/search/advanced${queryString}`);
  },

  // 数据统计
  getAnalytics: () => api.get<any>('/blog/analytics'),
};

export interface Comment {
  id: string;
  postId: string;
  author: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const notificationApi = {
  getAll: () => api.get<any[]>('/notifications'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id?: string) => api.post<{ success: boolean }>('/notifications/mark-read', { id }),
};

export const followApi = {
  follow: (followingId: string) => api.post<{ following: boolean }>('/follows/follow', { followingId }),
  unfollow: (followingId: string) => api.delete<{ following: boolean }>(`/follows/follow?followingId=${followingId}`),
  getFollowing: () => api.get<any[]>('/follows/following'),
  getFollowers: () => api.get<any[]>('/follows/followers'),
  getFeed: () => api.get<any[]>('/follows/feed'),
};

export const goalApi = {
  getAll: () => api.get<any[]>('/goals'),
  getActive: () => api.get<any[]>('/goals/active'),
  create: (data: { title: string; description?: string; category: string; targetValue: number; startDate?: string; endDate?: string; priority?: string }) =>
    api.post<any>('/goals', data),
  update: (id: string, data: { title?: string; description?: string; targetValue?: number; currentValue?: number; status?: string; priority?: string }) =>
    api.put<{ success: boolean }>(`/goals/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/goals/${id}`),
};

export const skillApi = {
  getAll: (params?: { type?: string; category?: string; tag?: string; search?: string; sort?: string; page?: number; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return api.get<{ skills: any[]; pagination: any }>(`/skills${query}`);
  },
  create: (data: { title: string; content: string; type: string; category?: string; tags?: string[]; source?: string }) =>
    api.post<any>('/skills', data),
  update: (id: string, data: { title?: string; content?: string; type?: string; category?: string; tags?: string[]; effectiveness?: number; source?: string }) =>
    api.put<{ success: boolean }>(`/skills/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/skills/${id}`),
  markUsed: (id: string) => api.post<{ success: boolean }>(`/skills/${id}/use`),
  getStats: () => api.get<{ totalSkills: number; byType: any[]; totalUsage: number }>('/skills/stats'),
  getTags: () => api.get<{ name: string; count: number }[]>('/skills/tags'),
};

export interface KnowledgeNode {
  id: string;
  name: string;
  description?: string;
  type: 'ENTITY' | 'CONCEPT' | 'CATEGORY' | 'TAG' | 'ARTICLE';
  icon?: string;
  category?: string;
  isCategory: boolean;
  weight: number;
  blogPostId?: string;
}

export interface KnowledgeEdge {
  id: string;
  fromId: string;
  toId: string;
  relation: string;
  weight: number;
  description?: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  weight: number;
  children: { id: string; name: string; type: string; icon?: string }[];
}

export interface KnowledgeGraphData {
  nodes: { id: string; name: string; type: string; category?: string; icon?: string; weight: number; isCategory: boolean }[];
  edges: { id: string; fromId: string; toId: string; relation: string; weight: number; description?: string }[];
}

export interface KnowledgeSearchResult {
  nodes: KnowledgeNode[];
  articles: any[];
}

export const knowledgeApi = {
  getCategories: () => api.get<KnowledgeCategory[]>('/knowledge/categories'),
  getNodes: (params?: { type?: string; category?: string; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return api.get<KnowledgeNode[]>(`/knowledge/nodes${query}`);
  },
  getNode: (id: string) => api.get<{ node: KnowledgeNode; related: any[] }>(`/knowledge/nodes/${id}`),
  getGraph: (params?: { category?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return api.get<KnowledgeGraphData>(`/knowledge/graph${query}`);
  },
  search: (q: string, type?: string) => {
    const params = new URLSearchParams({ q });
    if (type) params.set('type', type);
    return api.get<KnowledgeSearchResult>(`/knowledge/search?${params.toString()}`);
  },
  getTags: () => api.get<{ id: string; name: string; weight: number; normalizedWeight: number; category?: string }[]>('/knowledge/tags'),
  getRelated: (id: string) => api.get<{ node: KnowledgeNode; relation: string; weight: number }[]>(`/knowledge/related/${id}`),
  seed: () => api.post<any>('/knowledge/seed'),
  extract: (postId?: string) => api.post<any>('/knowledge/extract', { postId }),
  syncBlog: () => api.post<any>('/knowledge/sync-blog'),
};
