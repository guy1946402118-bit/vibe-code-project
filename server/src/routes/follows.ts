import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.post('/follow', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { followingId } = req.body;

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId } },
  });
  if (existing) return res.json({ following: true });

  await prisma.follow.create({
    data: { followerId: req.userId!, followingId },
  });
  res.json({ following: true });
}));

router.delete('/follow', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const followingId = (req.query.followingId || req.body.followingId) as string;

  await prisma.follow.deleteMany({
    where: { followerId: req.userId!, followingId },
  });
  res.json({ following: false });
}));

router.get('/following', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const follows = await prisma.follow.findMany({
    where: { followerId: req.userId },
    select: { followingId: true },
  });
  const ids = follows.map(f => f.followingId);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, avatar: true, points: true },
  });
  res.json(users);
}));

router.get('/followers', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const follows = await prisma.follow.findMany({
    where: { followingId: req.userId },
    select: { followerId: true },
  });
  const ids = follows.map(f => f.followerId);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, avatar: true, points: true },
  });
  res.json(users);
}));

router.get('/feed', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const follows = await prisma.follow.findMany({
    where: { followerId: req.userId },
    select: { followingId: true },
  });
  const followingIds = follows.map(f => f.followingId);
  if (followingIds.length === 0) return res.json([]);

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { userId: { in: followingIds } },
    orderBy: { timestamp: 'desc' },
    take: 20,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  const recentPosts = await prisma.blogPost.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 10,
  });

  const feedItems: any[] = [];

  for (const ci of recentCheckIns) {
    feedItems.push({
      id: `checkin-${ci.id}`,
      type: 'checkin',
      user: ci.user,
      category: ci.category,
      points: ci.points,
      timestamp: ci.timestamp,
    });
  }

  for (const post of recentPosts) {
    feedItems.push({
      id: `post-${post.id}`,
      type: 'post',
      author: post.author,
      title: post.title,
      slug: post.slug,
      timestamp: post.publishedAt,
    });
  }

  feedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(feedItems.slice(0, 30));
}));

export default router;
