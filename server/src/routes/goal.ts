import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(goals);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, description, category, targetValue, startDate, endDate, priority, smart } = req.body;

  const goal = await prisma.goal.create({
    data: {
      userId: req.userId!,
      title,
      description,
      category: category || 'OTHER',
      targetValue: targetValue || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      priority: priority || 'MEDIUM',
    },
  });
  res.json(goal);
}));

router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { id } = req.params;
  const { title, description, targetValue, currentValue, status, priority } = req.body;

  const goal = await prisma.goal.updateMany({
    where: { id: String(req.params.id), userId: req.userId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(targetValue !== undefined && { targetValue }),
      ...(currentValue !== undefined && { currentValue }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
    },
  });

  if (status === 'COMPLETED') {
    try {
      await prisma.user.update({
        where: { id: req.userId },
        data: { points: { increment: 30 } },
      });
      await prisma.notification.create({
        data: {
          userId: req.userId!,
          type: 'goal_complete',
          title: '目标达成！',
          message: `恭喜完成目标！获得30积分奖励`,
          link: '/goals',
        },
      });
    } catch { /* ignore */ }
  }

  res.json({ success: true });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.goal.deleteMany({ where: { id: String(req.params.id), userId: req.userId } });
  res.json({ success: true });
}));

router.get('/active', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId, status: 'IN_PROGRESS' },
    orderBy: { priority: 'asc' },
  });
  res.json(goals);
}));

export default router;
