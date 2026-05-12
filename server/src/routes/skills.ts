import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { type, category, tag, search, sort = 'latest', page = 1, limit = 20 } = req.query;

  const where: any = { userId: req.userId };
  if (type) where.type = type as string;
  if (category && category !== 'all') where.category = category as string;
  if (tag) where.tags = { contains: tag as string };
  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { content: { contains: search as string } },
    ];
  }

  let orderBy: any = { updatedAt: 'desc' };
  if (sort === 'effective') orderBy = { effectiveness: 'desc' };
  if (sort === 'used') orderBy = { usageCount: 'desc' };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [skills, total] = await Promise.all([
    prisma.skillDepot.findMany({ where, orderBy, skip, take: limitNum }),
    prisma.skillDepot.count({ where }),
  ]);

  res.json({ skills, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, content, type, category, tags, source } = req.body;
  const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');

  const skill = await prisma.skillDepot.create({
    data: {
      userId: req.userId!,
      title,
      content,
      type: type || 'SKILL',
      category: category || 'general',
      tags: tagsStr,
      source: source || null,
    },
  });
  res.json(skill);
}));

router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, content, type, category, tags, effectiveness, source } = req.body;
  const tagsStr = tags ? (Array.isArray(tags) ? JSON.stringify(tags) : tags) : undefined;

  await prisma.skillDepot.updateMany({
    where: { id: String(req.params.id), userId: req.userId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(category !== undefined && { category }),
      ...(tagsStr !== undefined && { tags: tagsStr }),
      ...(effectiveness !== undefined && { effectiveness }),
      ...(source !== undefined && { source }),
    },
  });
  res.json({ success: true });
}));

router.post('/:id/use', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.skillDepot.updateMany({
    where: { id: String(req.params.id), userId: req.userId },
    data: { usageCount: { increment: 1 } },
  });
  res.json({ success: true });
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.skillDepot.deleteMany({ where: { id: String(req.params.id), userId: req.userId } });
  res.json({ success: true });
}));

router.get('/stats', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const [totalSkills, byType, totalUsage] = await Promise.all([
    prisma.skillDepot.count({ where: { userId: req.userId } }),
    prisma.skillDepot.groupBy({ by: ['type'], where: { userId: req.userId }, _count: true }),
    prisma.skillDepot.aggregate({ where: { userId: req.userId }, _sum: { usageCount: true } }),
  ]);
  res.json({ totalSkills, byType, totalUsage: totalUsage._sum.usageCount || 0 });
}));

router.get('/tags', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const skills = await prisma.skillDepot.findMany({
    where: { userId: req.userId },
    select: { tags: true },
  });

  const tagCount: Record<string, number> = {};
  for (const s of skills) {
    try {
      const parsed = JSON.parse(s.tags);
      for (const t of (Array.isArray(parsed) ? parsed : [s.tags])) {
        const key = t.trim();
        if (key) tagCount[key] = (tagCount[key] || 0) + 1;
      }
    } catch {
      const key = s.tags.trim();
      if (key) tagCount[key] = (tagCount[key] || 0) + 1;
    }
  }

  const tags = Object.entries(tagCount).map(([name, count]) => ({ name, count }));
  res.json(tags);
}));

export default router;
