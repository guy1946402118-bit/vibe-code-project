import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const rewards = await prisma.reward.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rewards);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { name, pointsCost } = req.body;

  const reward = await prisma.reward.create({
    data: { userId: req.userId!, name, pointsCost },
  });
  res.json(reward);
}));

router.post('/:id/redeem', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const rewardId = String(req.params.id);
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
  });

  if (!reward || reward.userId !== req.userId) {
    return res.status(404).json({ error: 'Reward not found' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.points < reward.pointsCost) {
    return res.status(400).json({ error: 'Insufficient points' });
  }

  await prisma.$transaction([
    prisma.reward.update({
      where: { id: rewardId },
      data: { redeemed: true },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { points: { decrement: reward.pointsCost } },
    }),
  ]);

  res.json({ success: true, remainingPoints: user.points - reward.pointsCost });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.reward.delete({
    where: { id: String(req.params.id), userId: req.userId },
  });
  res.json({ success: true });
}));

export default router;