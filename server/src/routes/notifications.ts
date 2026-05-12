import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
}));

router.get('/unread-count', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const count = await prisma.notification.count({
    where: { userId: req.userId, isRead: false },
  });
  res.json({ count });
}));

router.post('/mark-read', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { id } = req.body;
  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: req.userId },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
  }
  res.json({ success: true });
}));

export async function createNotification(
  prisma: PrismaClient,
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string,
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  } catch { /* notification is non-critical */ }
}

export default router;
