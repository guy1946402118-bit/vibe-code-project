import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = 'your-secret-key';

const requireAdmin = async (req: AuthRequest, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId?: string; userId?: string };
    const tokenUserId = decoded.adminId || decoded.userId;
    if (!tokenUserId) return res.status(403).json({ error: 'Forbidden: Invalid token' });

    const user = await prisma.user.findUnique({ where: { id: String(tokenUserId) } });
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

router.get('/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/posts', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    res.json({ posts, pagination: { page: 1, limit: posts.length, total: posts.length, totalPages: 1 } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, points = 0 } = req.body;
    const user = await prisma.user.create({
      data: { name, points },
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, points, avatar, role } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (points !== undefined) updateData.points = points;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (role !== undefined) updateData.role = role;
    const user = await prisma.user.update({
      where: { id: String(id) },
      data: updateData,
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: String(id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/checkins', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const checkins = await prisma.checkIn.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(checkins);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch checkins' });
  }
});

router.put('/posts/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    await prisma.blogPost.update({
      where: { id: String(id) },
      data: { isPublished },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

router.delete('/posts/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.blogPost.delete({ where: { id: String(id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;