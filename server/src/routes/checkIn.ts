import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

const POINTS_MAP: Record<string, number> = {
  HEALTH: 10,
  STUDY: 15,
  WORK: 15,
  DISCIPLINE: 20,
  REVIEW: 25,
};

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { category, startTime, endTime } = req.query;
  
  const where: any = { userId: req.userId };
  if (category) where.category = category;
  if (startTime || endTime) {
    where.timestamp = {};
    if (startTime) where.timestamp.gte = new Date(Number(startTime));
    if (endTime) where.timestamp.lte = new Date(Number(endTime));
  }

  const checkIns = await prisma.checkIn.findMany({
    where,
    orderBy: { timestamp: 'desc' },
  });
  res.json(checkIns);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { category } = req.body;
  const points = POINTS_MAP[category] || 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.checkIn.findFirst({
    where: { userId: req.userId!, category, timestamp: { gte: today } },
  });

  if (existing) {
    return res.status(409).json({ error: `今天已打过「${category}」分类的卡`, existingCheckIn: existing });
  }

  const checkIn = await prisma.checkIn.create({
    data: { userId: req.userId!, category, points },
  });

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { points: { increment: points } },
  });

  res.json({ checkIn, totalPoints: user.points });
}));

router.get('/today', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: req.userId, timestamp: { gte: today } },
  });
  res.json(checkIns);
}));

router.get('/stats', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  
  const totalCheckIns = await prisma.checkIn.count({ where: { userId: req.userId } });
  
  // 从 user 表获取 points，而不是累加 checkIn
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { points: true }
  });
  const totalPoints = user?.points || 0;

  const checkIns = await prisma.checkIn.findMany({ where: { userId: req.userId } });
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateMap = new Map<string, number>();
  checkIns.forEach(c => {
    const date = new Date(c.timestamp).toISOString().split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dateMap.has(dateStr)) streak++;
    else break;
  }

  res.json({ totalCheckIns, totalPoints, streak });
}));

router.get('/today-count', asyncHandler(async (req, res) => {
  const prisma = new PrismaClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = await prisma.checkIn.count({
    where: { timestamp: { gte: today } },
  });
  res.json({ todayCount });
  await prisma.$disconnect();
}));

router.get('/weekly', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const days: { day: string; points: number; count: number }[] = [];
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayCheckIns = await prisma.checkIn.findMany({
      where: { userId: req.userId, timestamp: { gte: d, lt: nextD } },
    });
    const points = dayCheckIns.reduce((s, c) => s + c.points, 0);
    days.push({ day: dayNames[d.getDay()], points, count: dayCheckIns.length });
  }
  res.json(days);
}));

router.get('/heatmap', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: req.userId, timestamp: { gte: start, lt: end } },
    select: { timestamp: true, points: true },
  });

  const heatmap: Record<string, number> = {};
  for (const ci of checkIns) {
    const d = new Date(ci.timestamp).toISOString().split('T')[0];
    heatmap[d] = (heatmap[d] || 0) + ci.points;
  }
  res.json(heatmap);
}));

export default router;