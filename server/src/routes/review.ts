import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { type } = req.query;
  const where: any = { userId: req.userId };
  if (type) where.type = type;

  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { type, content } = req.body;

  const review = await prisma.review.create({
    data: { userId: req.userId!, type, content },
  });
  res.json(review);
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.review.delete({
    where: { id: String(req.params.id), userId: req.userId },
  });
  res.json({ success: true });
}));

export default router;