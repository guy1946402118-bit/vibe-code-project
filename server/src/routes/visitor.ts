import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/record', asyncHandler(async (req, res) => {
  const { ip, country, city, device, browser, os, path } = req.body;

  const visitor = await prisma.visitor.create({
    data: {
      ip: ip || 'unknown',
      country: country || null,
      city: city || null,
      device: device || null,
      browser: browser || null,
      os: os || null,
      path: path || '/',
    },
  });

  res.json({ success: true, id: visitor.id });
}));

router.get('/recent', asyncHandler(async (req, res) => {
  const { limit = '20' } = req.query;
  const take = parseInt(limit as string, 10);

  const visitors = await prisma.visitor.findMany({
    orderBy: { visitedAt: 'desc' },
    take,
  });

  res.json(visitors);
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayCount = await prisma.visitor.count({
    where: { visitedAt: { gte: today } },
  });

  const weekCount = await prisma.visitor.count({
    where: { visitedAt: { gte: weekAgo } },
  });

  const totalCount = await prisma.visitor.count();

  const allVisitors = await prisma.visitor.findMany({
    select: { ip: true },
  });
  const uniqueIPs = new Set(allVisitors.map(v => v.ip)).size;

  const topCountries = await prisma.visitor.groupBy({
    by: ['country'],
    _count: { ip: true },
    orderBy: { _count: { ip: 'desc' } },
    take: 5,
  });

  res.json({
    todayCount,
    weekCount,
    totalCount,
    uniqueIPs,
    topCountries,
  });
}));

router.delete('/clear', asyncHandler(async (req, res) => {
  await prisma.visitor.deleteMany({});
  res.json({ success: true, message: 'All visitor records cleared' });
}));

export default router;