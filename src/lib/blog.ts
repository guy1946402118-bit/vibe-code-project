export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: number;
  updatedAt: number;
  views: number;
  likes: number;
  isPublished: boolean;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
  color: string;
}

export const DEFAULT_CATEGORIES: BlogCategory[] = [
  { id: 'growth', name: '成长记录', slug: 'growth', count: 0, color: '#667eea' },
  { id: 'tech', name: '技术文章', slug: 'tech', count: 0, color: '#4ECDC4' },
  { id: 'life', name: '生活随笔', slug: 'life', count: 0, color: '#FF6B6B' },
  { id: 'reading', name: '读书笔记', slug: 'reading', count: 0, color: '#FFEAA7' },
  { id: 'thinking', name: '思考感悟', slug: 'thinking', count: 0, color: '#96CEB4' },
];

export interface AboutConfig {
  name: string;
  bio: string;
  avatar?: string;
  socials: {
    github?: string;
    twitter?: string;
    email?: string;
    zhihu?: string;
  };
}

export const DEFAULT_ABOUT: AboutConfig = {
  name: '成长博主',
  bio: '记录成长，探索世界',
  socials: {}
};