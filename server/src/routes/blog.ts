import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

let _prisma: PrismaClient | null = null;
function sharedPrisma(): PrismaClient {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

const parseTags = (tags: any): string => {
  if (Array.isArray(tags)) return JSON.stringify(tags);
  if (typeof tags === 'string') return tags;
  return JSON.stringify([]);
};

router.get('/posts', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const { category, search, sort = 'latest', page = 1, limit = 10, exclude } = req.query;

  const where: any = { isPublished: true };
  if (category) where.category = category as string;
  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { content: { contains: search as string } },
    ];
  }
  if (exclude) where.id = { not: exclude as string };

  let orderBy: any = { publishedAt: 'desc' };
  if (sort === 'popular') orderBy = { views: 'desc' };
  if (sort === 'liked') orderBy = { likes: 'desc' };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy, skip, take: limitNum }),
    prisma.blogPost.count({ where }),
  ]);

  res.json({
    posts,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}));

router.post('/posts/:id/like', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = sharedPrisma();
  const postId = String(req.params.id);
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) { res.status(404).json({ error: '文章不存在' }); return; }
  const updated = await prisma.blogPost.update({
    where: { id: postId },
    data: { likes: { increment: 1 } },
  });
  res.json({ likes: updated.likes });
}));

router.get('/posts/:slug', asyncHandler(async (req: AuthRequest, res) => {
  const prisma = sharedPrisma();
  const slug = String(req.params.slug);
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (post) {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });
  }
  res.json(post);
}));

router.post('/posts', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, slug, excerpt, content, coverImage, category, tags, isPublished, author } = req.body;
  const authorName = author || req.userId || '用户';
  const post = await prisma.blogPost.create({
    data: { title, slug, excerpt, content, coverImage, category, tags: parseTags(tags), isPublished, author: authorName },
  });
  res.json(post);
}));

router.put('/posts/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, slug, excerpt, content, coverImage, category, tags, isPublished } = req.body;
  const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : null);
  const post = await prisma.blogPost.update({
    where: { id: String(req.params.id) },
    data: { title, slug, excerpt, content, coverImage, category, tags: tagsStr, isPublished },
  });
  res.json(post);
}));

router.delete('/posts/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.blogPost.delete({ where: { id: String(req.params.id) } });
  res.json({ success: true });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  res.json(await prisma.blogCategory.findMany());
}));

router.get('/tags', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const posts = await prisma.blogPost.findMany({ where: { isPublished: true } });
  const tagCounts: Record<string, number> = {};
  posts.forEach(post => {
    if (post.tags) {
      try {
        const tags = JSON.parse(post.tags);
        if (Array.isArray(tags)) {
          tags.forEach((tag: string) => {
            const t = tag.trim().toLowerCase();
            if (t) tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        }
      } catch { /* ignore */ }
    }
  });
  res.json(Object.entries(tagCounts).map(([name, count]) => ({ name, count })));
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const [totalPosts, totalCategories] = await Promise.all([
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.blogCategory.count(),
  ]);
  res.json({ totalPosts, totalCategories });
}));

router.post('/categories', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { name, slug, color } = req.body;
  res.json(await prisma.blogCategory.create({ data: { name, slug, color } }));
}));

// ========== 评论系统 ==========

router.get('/posts/:postId/comments', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = sharedPrisma();
  const postId = String(req.params.postId);
  res.json(await prisma.comment.findMany({ where: { postId }, orderBy: { createdAt: 'desc' } }));
}));

router.post('/posts/:postId/comments', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const postId = String(req.params.postId);
  const { content, author } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: '评论内容不能为空' });
    return;
  }

  // 优先使用前端传来的作者名，其次使用 userId
  const authorName = author || req.userId || '匿名用户';

  const comment = await prisma.comment.create({
    data: { postId, author: authorName, content: content.trim() },
  });

  res.json(comment);
}));

router.delete('/comments/:commentId', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const commentId = String(req.params.commentId);

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) { res.status(404).json({ error: '评论不存在' }); return; }

  const isOwner = comment.author === req.userId || comment.author === (req as any).userName;
  const isAdminUser = (req as any).isAdmin === true;

  if (!isOwner && !isAdminUser) {
    res.status(403).json({ error: '无权删除此评论' });
    return;
  }

  await prisma.comment.delete({ where: { id: commentId } });
  res.json({ success: true });
}));

// ========== 收藏系统 ==========

router.get('/favorites', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = sharedPrisma();
  const userId = req.userId || '';
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { post: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(favorites.map(f => f.post));
}));

router.post('/posts/:postId/favorite', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const postId = String(req.params.postId);
  const userId = req.userId || '';
  try {
    const favorite = await prisma.favorite.create({ data: { postId, userId } });
    res.json({ favorited: true, favorite });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: '已经收藏过了' });
    } else { throw error; }
  }
}));

router.delete('/posts/:postId/favorite', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const postId = String(req.params.postId);
  const userId = req.userId || '';
  await prisma.favorite.deleteMany({ where: { postId, userId } });
  res.json({ favorited: false });
}));

router.get('/posts/:postId/isFavorited', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = sharedPrisma();
  const postId = String(req.params.postId);
  const userId = req.userId;
  if (!userId) { res.json({ isFavorited: false }); return; }
  const favorite = await prisma.favorite.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  res.json({ isFavorited: !!favorite });
}));

// ========== 订阅系统 ==========

router.post('/subscribe', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: '请输入有效的邮箱地址' });
    return;
  }
  try {
    const subscription = await prisma.subscription.create({ data: { email } });
    res.json({ success: true, message: '订阅成功！', subscription });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: '该邮箱已订阅' });
    } else { throw error; }
  }
}));

router.get('/subscribers/count', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const count = await prisma.subscription.count({ where: { active: true } });
  res.json({ count });
}));

// ========== 高级搜索 ==========

router.get('/search/advanced', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();
  const { query, category, author, tags, dateFrom, dateTo, sortBy = 'latest', page = 1, limit = 10 } = req.query;

  const where: any = { isPublished: true };
  if (query) {
    where.OR = [
      { title: { contains: query as string } },
      { excerpt: { contains: query as string } },
      { content: { contains: query as string } },
    ];
  }
  if (category) where.category = category as string;
  if (author) where.author = author as string;
  if (tags) where.tags = { contains: tags as string };
  if (dateFrom || dateTo) {
    where.publishedAt = {};
    if (dateFrom) where.publishedAt.gte = new Date(dateFrom as string);
    if (dateTo) where.publishedAt.lte = new Date(dateTo as string);
  }

  let orderBy: any = { publishedAt: 'desc' };
  if (sortBy === 'popular') orderBy = { views: 'desc' };
  if (sortBy === 'liked') orderBy = { likes: 'desc' };
  if (sortBy === 'oldest') orderBy = { publishedAt: 'asc' };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy, skip, take: limitNum }),
    prisma.blogPost.count({ where }),
  ]);

  res.json({
    posts,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
}));

// ========== 数据统计 ==========

router.get('/analytics', asyncHandler(async (req, res) => {
  const prisma = sharedPrisma();

  const [totalPosts, totalComments, totalViews, totalLikes, postsByCategory, recentPosts] = await Promise.all([
    prisma.blogPost.count({ where: { isPublished: true } }),
    prisma.comment.count(),
    prisma.blogPost.aggregate({ _sum: { views: true }, where: { isPublished: true } }),
    prisma.blogPost.aggregate({ _sum: { likes: true }, where: { isPublished: true } }),
    prisma.blogPost.groupBy({ by: ['category'], _count: { id: true }, where: { isPublished: true } }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, views: true, likes: true, category: true, publishedAt: true },
    }),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const postsLast7Days = await prisma.blogPost.groupBy({
    by: ['publishedAt'],
    _count: { id: true },
    where: { isPublished: true, publishedAt: { gte: sevenDaysAgo } },
  });

  res.json({
    overview: {
      totalPosts,
      totalComments,
      totalViews: totalViews._sum.views || 0,
      totalLikes: totalLikes._sum.likes || 0,
    },
    categories: postsByCategory.map(c => ({ name: c.category, count: c._count.id })),
    trending: recentPosts,
    weeklyTrend: postsLast7Days,
  });
}));

export default router;
