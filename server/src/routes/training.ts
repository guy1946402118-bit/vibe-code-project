import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { startTime, endTime } = req.query;
  
  const where: any = { userId: req.userId };
  if (startTime || endTime) {
    where.timestamp = {};
    if (startTime) where.timestamp.gte = new Date(Number(startTime));
    if (endTime) where.timestamp.lte = new Date(Number(endTime));
  }

  const logs = await prisma.trainingLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });
  res.json(logs);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { type, points, detail } = req.body;

  const log = await prisma.trainingLog.create({
    data: { userId: req.userId!, type, points, detail },
  });
  res.json(log);
}));

router.get('/stats', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  
  const logs = await prisma.trainingLog.findMany({ where: { userId: req.userId } });
  
  const typeStats = new Map<string, number>();
  logs.forEach(l => {
    typeStats.set(l.type, (typeStats.get(l.type) || 0) + 1);
  });

  res.json({ total: logs.length, byType: Object.fromEntries(typeStats) });
}));

export default router;