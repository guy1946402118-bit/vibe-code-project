import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const notes = await prisma.note.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(notes);
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, content, tags } = req.body;

  const note = await prisma.note.create({
    data: { userId: req.userId!, title, content, tags: JSON.stringify(tags || []) },
  });

  await prisma.user.update({
    where: { id: req.userId },
    data: { points: { increment: 5 } },
  });

  res.json(note);
}));

router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { title, content, tags } = req.body;

  const note = await prisma.note.update({
    where: { id: String(req.params.id), userId: req.userId },
    data: { title, content, tags: JSON.stringify(tags || []) },
  });
  res.json(note);
}));

router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  await prisma.note.delete({
    where: { id: String(req.params.id), userId: req.userId },
  });
  res.json({ success: true });
}));

export default router;